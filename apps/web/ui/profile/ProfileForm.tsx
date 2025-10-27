"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateProfileSchema,
  UpdateProfileValues,
} from "@/lib/zod/schemas/profile";
import { getInitials } from "@trackio/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Input,
  Label,
  Spinner,
} from "@trackio/ui";
import { toast } from "sonner";

type UserProps = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  email: string | null;
};

export function ProfileForm({ user }: { user: UserProps }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name || "",
      username: user.username || "",
    },
  });

  const onSubmit = async (data: UpdateProfileValues) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast.error(result.error);
        } else {
          toast.error(result.error || "An unknown server error occurred.");
        }
        return;
      } else {
        toast.success("Profile updated successfully!");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.image || undefined} alt="Profile picture" />
            <AvatarFallback className="text-xl">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-lg">
              {user.name || "Anonymous Coder"}
            </p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        {/* Name Input */}
        <div className="space-y-2">
          <Label htmlFor="name">Display Name</Label>
          <Input id="name" {...register("name")} />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Username Input */}
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="flex items-center">
            <span className="rounded-l-md border border-r-0 border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-500">
              @
            </span>
            <Input
              id="username"
              {...register("username")}
              className="rounded-l-none"
              placeholder="your-unique-handle"
            />
          </div>
          {errors.username && (
            <p className="text-sm text-red-500">{errors.username.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner className="mr-2" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </form>
    </>
  );
}
