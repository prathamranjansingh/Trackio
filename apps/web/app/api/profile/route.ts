import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@trackio/prisma";
import { getSession } from "@/lib/auth";
import { updateProfileSchema } from "@/lib/zod/schemas/profile";

export async function PATCH(req: NextRequest) {
  try {
    // 1. Authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 2. Validation
    const body = await req.json();
    // Zod will now THROW an error if name/username are empty,
    // which is caught by the `catch (error)` block.
    const validatedData = updateProfileSchema.parse(body);

    // 3. Database Update
    // We can pass validatedData directly, as it's guaranteed to be correct.
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: validatedData, // This is simpler
      select: { id: true, name: true, username: true, image: true },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    // 4. Error Handling
    if (error instanceof ZodError) {
      // This will now catch "Name cannot be empty"
      return NextResponse.json(
        { error: "Invalid input.", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // This block already handles your "username should be unique" requirement
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (
        error.code === "P2002" &&
        (error.meta?.target as string[])?.includes("username")
      ) {
        return NextResponse.json(
          { error: "This username is already taken." },
          { status: 409 } // 409 Conflict
        );
      }
    }

    console.error("Error in PATCH /api/profile:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
