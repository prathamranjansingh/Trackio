import { ForgotPasswordForm } from "@/ui/auth/forgot-password-form";
import { AuthLayout } from "@/ui/layout/auth-layout";

export const metadata = {
  title: `Forgot Password | ${process.env.NEXT_PUBLIC_APP_NAME ?? "App"}`,
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <div className="w-full max-w-sm text-white">
        <h3 className="text-center text-xl font-semibold">
          Forgot Password?
        </h3>

        <div className="mt-8">
          <ForgotPasswordForm />
        </div>
      </div>
    </AuthLayout>
  );
}
