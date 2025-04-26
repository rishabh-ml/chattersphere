// src/middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
    matcher: [
        "/",                  // your landing or home page
        "/sign-in",          // Clerk sign-in
        "/sign-up",          // Clerk sign-up
        "/api/public(.*)",    // any custom public API you want
        "/favicon.ico",       // fix PWA icon 500s
        "/manifest.json",     // fix manifest.json 500s
        "/robots.txt",        // robots.txt
        "/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|robots\\.txt).*)",
        "/api/(.*)",
    ],
};