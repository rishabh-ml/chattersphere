import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Newsletter } from "@/models/Newsletter";

interface NewsletterRequestBody {
  email: string;
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.text();
    let data: NewsletterRequestBody;

    try {
      data = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: "Invalid JSON format." }, { status: 400 });
    }

    const { email } = data;

    if (!email || !/.+@.+\..+/.test(email)) {
      return NextResponse.json({ error: "Invalid email address provided." }, { status: 400 });
    }

    try {
      const subscription = await Newsletter.create({ email });
      return NextResponse.json(
        { message: "Subscribed successfully!", subscription },
        { status: 201 }
      );
    } catch (error) {
      console.error("Database Error:", error);
      const errorMessage =
        (error instanceof Error && error.message.includes("duplicate")) ||
        (typeof (error as { code?: number }).code === "number" &&
          (error as { code: number }).code === 11000)
          ? "Email already subscribed."
          : "Database error.";

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Unexpected server error occurred." }, { status: 500 });
  }
}
