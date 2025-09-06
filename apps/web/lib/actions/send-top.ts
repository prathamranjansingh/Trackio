"use server";

import { prisma } from "@trackio/prisma";
import { ratelimit, redis } from "@/lib/upstash";
import { flattenValidationErrors } from "next-safe-action";
import { sendEmail } from "@trackio/email";
import { VerifyEmail } from "@trackio/email/templates/verify-email";
import { generateOTP } from "@/lib/auth";
import { EMAIL_OTP_EXPIRY_IN } from "@/lib/auth/constants";
import { getIP } from "@/lib/api/utils";
import { throwIfAuthenticated } from "@/lib/actions/throw-if-authenticated";
import z from "zod";
import { emailSchema, passwordSchema } from "@/lib/zod/schemas/auth";
import { actionClient } from "@/lib/actions/safe-action";
import { get } from "@vercel/edge-config";

const schema = z.object({
  email: emailSchema,
  password: passwordSchema.optional(),
});

/* ------------------------------------------------------------------ */
/* 2. Action                                                           */
/* ------------------------------------------------------------------ */
export const sendOtpAction = actionClient
  .schema(schema, {
    handleValidationErrorsShape: async (ve) =>
      flattenValidationErrors(ve).fieldErrors,
  })
  .use(throwIfAuthenticated)
  .action(async ({ parsedInput }) => {
    const { email } = parsedInput;

    // Rate-limit: 2 requests per minute per IP
    const { success } = await ratelimit(2, "1 m").limit(
      `send-otp:${await getIP()}`
    );
    if (!success) throw new Error("Too many requests. Try again later.");

    // Disallow Gmail aliases
    if (email.includes("+") && email.endsWith("@gmail.com"))
      throw new Error("Please remove the “+” alias from your Gmail address.");

    const domain = email.split("@")[1] ?? "";

    // Disposable / black-listed domains
    if (process.env.NEXT_PUBLIC_IS_DUB) {
      const [isDisposable, rawEmailDomainTerms] = await Promise.all([
        redis.sismember("disposableEmailDomains", domain),
        process.env.EDGE_CONFIG ? get("emailDomainTerms") : [],
      ]);

      if (isDisposable)
        throw new Error("Disposable addresses are not allowed.");

      // Type-safe handling of Edge Config value
      let emailDomainTerms: string[] = [];
      if (Array.isArray(rawEmailDomainTerms)) {
        emailDomainTerms = rawEmailDomainTerms
          .filter((t) => typeof t === "string")
          .map((t) => t as string);
      }

      if (emailDomainTerms.length > 0) {
        const regex = new RegExp(
          emailDomainTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")
        );
        if (regex.test(domain))
          throw new Error("E-mail domain not accepted for sign-ups.");
      }
    }

    // User must not already exist
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      throw new Error("Account already exists – log in instead.");

    // Generate & store OTP
    const code = generateOTP();
    await prisma.$transaction([
      prisma.emailVerificationToken.deleteMany({ where: { identifier: email } }),
      prisma.emailVerificationToken.create({
        data: {
          identifier: email,
          token: code,
          expires: new Date(Date.now() + EMAIL_OTP_EXPIRY_IN * 1000),
        },
      }),
    ]);

    console.log("Sending OTP email to:", email);

    // Send OTP email
    await sendEmail({
      subject: `${process.env.NEXT_PUBLIC_APP_NAME}: verify your account`,
      email,
      react: VerifyEmail({ email, code }),
    });
  });
