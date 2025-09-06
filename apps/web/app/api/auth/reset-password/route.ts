import { TrackioApiError, handleAndReturnErrorResponse } from "@/lib/api/errors";
import { parseRequestBody, ratelimitOrThrow } from "@/lib/api/utils";
import { hashPassword } from "@/lib/auth/password";
import { passwordSchema } from "@/lib/zod/schemas/auth"; // use passwordSchema only
import { sendEmail } from "@trackio/email";
import { PasswordUpdated } from "@trackio/email/templates/password-updated";
import { prisma } from "@trackio/prisma";
import { waitUntil } from "@vercel/functions";
import { NextRequest, NextResponse } from "next/server";
import z from "@/lib/zod";

// ✅ Define a simplified schema just for this API
const resetPasswordApiSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
});

// POST /api/auth/reset-password - reset password using the reset token
export async function POST(req: NextRequest) {
  try {
    await ratelimitOrThrow(req, "reset-password");

    // Parse and validate incoming body
    const body = await parseRequestBody(req);
    console.log("Reset password body:", body); // 🐞 Debug log
    const { token, password } = resetPasswordApiSchema.parse(body);

    // Find the token
    const tokenFound = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        expires: {
          gte: new Date(),
        },
      },
      select: {
        identifier: true,
      },
    });

    if (!tokenFound) {
      throw new TrackioApiError({
        code: "not_found",
        message:
          "Password reset token not found or expired. Please request a new one.",
      });
    }

    const { identifier } = tokenFound;

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: identifier,
      },
      select: {
        emailVerified: true,
      },
    });

    // ✅ Transaction: delete token + update password
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({
        where: { token },
      }),

      prisma.user.update({
        where: { email: identifier },
        data: {
          passwordHash: await hashPassword(password),
          lockedAt: null, // Unlock account after successful reset
          ...(!user.emailVerified && { emailVerified: new Date() }), // Mark as verified if not yet
        },
      }),
    ]);

    // Send confirmation email (non-blocking)
    waitUntil(
      sendEmail({
        subject: `Your ${process.env.NEXT_PUBLIC_APP_NAME} account password has been reset`,
        email: identifier,
        react: PasswordUpdated({
          email: identifier,
          verb: "reset",
        }),
      }),
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Reset password error:", error); // 🐞 Log full error
    return handleAndReturnErrorResponse(error);
  }
}
