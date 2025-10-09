"use client";

import { Button, Input } from "@trackio/ui";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export const ResetPasswordForm = () => {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(password)) {
      newErrors.password = "Password must contain at least one number, one uppercase, and one lowercase letter";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password, confirmPassword }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error.message);
      }

      toast.success(
        "Your password has been reset. You can now log in with your new password.",
      );
      router.replace("/login");
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mb-auto mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
 <div className="max-w-full p-6 text-white bg-[#171717] border border-subtle rounded-md mx-2 px-4 py-10 sm:px-10">
   
    <form className="flex w-full flex-col gap-6" onSubmit={onSubmit}>
      <input type="hidden" value={token} />

      <label>
        <span className="text-content-emphasis mb-2 block text-sm font-medium leading-none">
          Password
        </span>
        <Input
          type="password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          className=""
        />
        {errors.password && (
          <span
            className="block text-sm text-red-500"
            role="alert"
            aria-live="assertive"
          >
            {errors.password}
          </span>
        )}
      </label>

      <label>
        <span className="text-content-emphasis mb-2 block text-sm font-medium leading-none">
          Confirm password
        </span>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          className=""
        />
        {errors.confirmPassword && (
          <span
            className="block text-sm text-red-500"
            role="alert"
            aria-live="assertive"
          >
            {errors.confirmPassword}
          </span>
        )}
      </label>

      <Button
        type="submit"
        disabled={isSubmitting}
         className="w-full text-white py-2 font-medium disabled:opacity-50"
        variant="default"
        size="default"
      >
        {isSubmitting ? "Resetting..." : "Reset Password"}
      </Button>
    </form>
    </div>
    </main>
  );
};
