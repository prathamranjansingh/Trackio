import { ResetPasswordForm } from "@/ui/auth/reset-password-form";
import { AuthLayout } from "@/ui/layout/auth-layout";
import { prisma } from "@trackio/prisma";
import { Key } from "lucide-react";

export const runtime = "nodejs";

interface Props {
  params: {
    token: string;
  };
}

export default async function ResetPasswordPage({ params: { token } }: Props) {
  const validToken = await isValidToken(token);

  if (!validToken) {
    return (
      <AuthLayout>
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Key className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="text-xl font-semibold">Invalid Reset Token</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The password reset token is invalid or expired. Please request a new one.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-sm">
        <h3 className="text-center text-xl font-semibold">
          Reset your password
        </h3>
        <div className="mt-8">
          <ResetPasswordForm />
        </div>
      </div>
    </AuthLayout>
  );
}

const isValidToken = async (token: string) => {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: {
      token,
      expires: {
        gte: new Date(),
      },
    },
    select: {
      token: true,
    },
  });

  return !!resetToken;
};

