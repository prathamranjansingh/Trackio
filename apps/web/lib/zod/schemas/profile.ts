import z from "@/lib/zod";
const usernameRegex = /^[a-zA-Z0-9_-]+$/;

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Name cannot be empty.")
    .max(50, "Name is too long.")
    .transform((name) => name.trim()),

  username: z
    .string()
    .min(3, "Username must be at least 3 characters.") // Now required
    .max(20, "Username must be 20 characters or less.")
    .regex(usernameRegex, "Only letters, numbers, underscores, and hyphens.")
    .transform((username) => username.trim().toLowerCase()),
});

export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;
