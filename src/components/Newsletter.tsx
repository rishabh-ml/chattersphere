"use client"

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NewsletterSection() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    async function handleSubscribe() {
        setStatus("loading");
        try {
            const res = await fetch("/api/newsletter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                setStatus("success");
                setEmail(""); // Clear input
            } else {
                const errorData = await res.json();
                setErrorMessage(errorData.error || "Something went wrong.");
                setStatus("error");
            }
        } catch (err) {
            console.error(err);
            setStatus("error");
        }
    }

    return (
        <section className="bg-[#111827] text-white py-16">
            <div className="container mx-auto px-4">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
                    <p className="text-gray-300 mb-8">
                        Subscribe to our newsletter to receive the latest updates, features, and community highlights.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        />
                        <Button onClick={handleSubscribe} disabled={status === "loading"} className="bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-white">
                            {status === "loading" ? "Subscribing..." : "Subscribe"}
                        </Button>
                    </div>

                    {/* Feedback Messages */}
                    {status === "success" && <p className="text-green-400 mt-4">Subscribed Successfully!</p>}
                    {status === "error" && <p className="text-red-400 mt-4">{errorMessage}</p>}
                </div>
            </div>
        </section>
    );
}
