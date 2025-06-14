import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { uploadFile } from "@/lib/supabase";
import { z } from "zod";

// Define validation schema for media upload
const mediaUploadSchema = z.object({
  type: z.enum(["post", "comment", "message"]),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  size: z.number().max(10 * 1024 * 1024, "File size must be less than 10MB"),
});

// POST /api/media/upload - Upload media file
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the form data
    const formData = await req.formData();
    const mediaFile = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;

    if (!mediaFile) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ error: "No type provided" }, { status: 400 });
    }

    // Validate the request
    try {
      mediaUploadSchema.parse({
        type,
        contentType: mediaFile.type,
        size: mediaFile.size,
      });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errorMessage = validationError.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");

        return NextResponse.json(
          {
            error: "Validation error",
            details: errorMessage,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: "Invalid file",
        },
        { status: 400 }
      );
    }

    // Upload to Supabase
    const path = `${userId}/${type}`;
    let mediaUrl: string | null = null;

    try {
      mediaUrl = await uploadFile(mediaFile, "media", path);

      if (!mediaUrl) {
        console.error("Media upload failed: No URL returned");
        return NextResponse.json({ error: "Failed to upload media" }, { status: 500 });
      }

      console.log("Media uploaded successfully:", mediaUrl);
    } catch (uploadError) {
      console.error("Error during media upload:", uploadError);
      return NextResponse.json(
        {
          error: "Failed to upload media",
          details: uploadError instanceof Error ? uploadError.message : "Unknown upload error",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        url: mediaUrl,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading media:", error);
    return NextResponse.json(
      {
        error: "Failed to upload media",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
