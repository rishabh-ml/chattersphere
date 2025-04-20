import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Newsletter } from "@/models/Newsletter";

export async function POST(req: Request) {
    try {
        await dbConnect();

        const body = await req.text();
        let data;

        try {
            data = JSON.parse(body);
        } catch (jsonError) {
            return NextResponse.json(
                { error: "Invalid JSON format." },
                { status: 400 }
            );
        }

        const { email } = data;

        if (!email || !/.+@.+\..+/.test(email)) {
            return NextResponse.json(
                { error: "Invalid email address provided." },
                { status: 400 }
            );
        }

        try {
            const subscription = await Newsletter.create({ email });
            return NextResponse.json(
                { message: "Subscribed successfully!", subscription },
                { status: 201 }
            );
        } catch (dbError: any) {
            console.error("Database Error:", dbError);
            return NextResponse.json(
                { error: dbError.message.includes("duplicate") ? "Already subscribed." : "Database error." },
                { status: 400 }
            );
        }

    } catch (serverError: any) {
        console.error("Server Error:", serverError);
        return NextResponse.json(
            { error: "Unexpected server error occurred." },
            { status: 500 }
        );
    }
}
