import { TrackioApiError, handleAndReturnErrorResponse } from "@/lib/api/errors";
import { parseRequestBody } from "@/lib/api/utils";
import { requestPasswordResetSchema } from "@/lib/zod/schemas/auth";
import { sendEmail } from "@trackio/email";
import { PasswordReset } from "@trackio/email/templates/password-reset";
import { prisma } from "@trackio/prisma";
import { waitUntil } from "@vercel/functions";
import { NextRequest, NextResponse } from "next/server";
import { ratelimit } from "@/lib/upstash/ratelimit";
import { randomBytes } from "crypto";
import { PASSWORD_RESET_TOKEN_EXPIRY } from "@/lib/auth/constants";

// POST /api/auth/forgot-password - request password reset
export async function POST(req: NextRequest) {
  try {
    console.log("Forgot password request received");
    
    // Parse and validate request body
    const body = await parseRequestBody(req);
    console.log("Request body parsed:", body);
    
    const { email } = requestPasswordResetSchema.parse(body);
    console.log("Email validated:", email);

    // Rate limit by email address
    try {
      const { success } = await ratelimit(2, "1 m").limit(
        `forgot-password:${email.toLowerCase()}`
      );
      
      if (!success) {
        throw new TrackioApiError({
          code: "rate_limit_exceeded",
          message: "Too many password reset requests. Please wait a minute before trying again.",
        });
      }
      console.log("Rate limit check passed");
    } catch (rateLimitError) {
      console.error("Rate limit error:", rateLimitError);
      // Continue without rate limiting if it fails
    }

    // Check if user exists (but don't reveal if they don't for security)
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });
    console.log("User lookup result:", user ? "User found" : "User not found");

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ 
        message: "If an account with that email exists, you will receive a password reset link." 
      });
    }

    // Generate 64-character random hex token
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY * 1000); // 1 hour
    console.log("Token generated:", token.substring(0, 8) + "...");

    await prisma.$transaction([
      // Delete any existing tokens for this email
      prisma.passwordResetToken.deleteMany({
        where: { identifier: email },
      }),
      // Create new token
      prisma.passwordResetToken.create({
        data: {
          identifier: email,
          token,
          expires,
        },
      }),
    ]);
    console.log("Database transaction completed");

    // Send email with reset link
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password/${token}`;
    console.log("Reset URL:", resetUrl);
    
    try {
      waitUntil(
        sendEmail({
          subject: `Reset your ${process.env.NEXT_PUBLIC_APP_NAME} password`,
          email,
          react: PasswordReset({
            email,
            resetUrl,
          }),
        })
      );
      console.log("Email sending initiated");
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      // Continue even if email fails
    }

    return NextResponse.json({ 
      message: "If an account with that email exists, you will receive a password reset link." 
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return handleAndReturnErrorResponse(error);
  }
}
