"use client";

import { requestPasswordResetAction } from "@/lib/actions/request-password-reset";
import { Button, Input } from "@trackio/ui";
import { useAction } from "next-safe-action/hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export const ForgotPasswordForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");

  const { executeAsync, isPending } = useAction(requestPasswordResetAction, {
    onSuccess() {
      toast.success(
        "You will receive an email with instructions to reset your password."
      );
      router.push("/login");
    },
    onError({ error }) {
      toast.error(error.serverError);
    },
  });

  return (
    <main className="mb-auto mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
    <div className="max-w-full p-6 text-white bg-[#171717] border border-subtle rounded-md mx-2 px-4 py-10 sm:px-10">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          executeAsync({ email });
        }}
      >
        <div className="flex flex-col gap-6">
          <label>
            <span className="text-content-emphasis mb-2 block text-sm font-medium leading-none">
              Email
            </span>
            <Input
              type="email"
              autoFocus
              value={email}
              placeholder="panic@thedis.co"
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <Button
            type="submit"
            disabled={isPending || email.length < 3}
            className="w-full"
          >
            {isPending ? "Sending..." : "Send reset link"}
          </Button>
        </div>
      </form>
    </div>
    </main>
  );
};
