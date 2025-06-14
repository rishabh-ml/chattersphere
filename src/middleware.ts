// ✔ Place this at /middleware.ts (or /src/middleware.ts if using a src folder)
import { clerkMiddleware } from "@clerk/nextjs/server";

// Applies Clerk auth parsing on every request
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals & static assets
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API/trpc routes
    '/(api|trpc)(.*)',
  ],
};
