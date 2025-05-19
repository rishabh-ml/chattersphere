// src/middleware.ts
import { clerkClient } from "@clerk/nextjs/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";
import { addCachingHeaders } from "./middleware/caching";

// Define public routes that don't require authentication
const publicRoutes = [
  "/",                  // Landing page
  "/sign-in(.*)",       // Sign-in page and any sub-routes
  "/sign-up(.*)",       // Sign-up page and any sub-routes
  "/sso-callback(.*)",  // OAuth callback
  "/api/public(.*)",    // Public API routes
  "/about-developers",  // About page
  "/contact-us",        // Contact page
  "/terms-of-service",  // Terms page
  "/privacy-policy",    // Privacy page
  "/cookie-policy",     // Cookie policy page
];

// These routes require authentication and will redirect to sign-in if not authenticated
// Note: We're using isPublicRoute() to check authentication requirements, so this list is for reference only

// Enhanced authentication middleware with custom logic
export default clerkMiddleware(async (auth, req) => {
  // Apply caching headers for static assets
  const cachingResponse = addCachingHeaders(req as NextRequest);

  // Custom logic for handling authentication
  const { userId } = await auth();
  // If the user is not authenticated and trying to access a protected route
  if (!userId && !isPublicRoute(req.nextUrl.pathname)) {
    // Protect the route - this will redirect to sign-in
    return auth.protect();
  }

  // If the user is authenticated and trying to access auth pages (sign-in, sign-up)
  if (userId && isAuthPage(req.nextUrl.pathname)) {
    // Redirect to home page
    return NextResponse.redirect(new URL("/home", req.url));
  }

  // If the user is an admin and accessing admin routes
  if (userId && req.nextUrl.pathname.startsWith("/admin")) {
    try {
      // Get user data to check if they're an admin
      const user = await clerkClient.users.getUser(userId);
      const isAdmin = user.publicMetadata.role === "admin";

      // If not an admin, redirect to home
      if (!isAdmin) {
        return NextResponse.redirect(new URL("/home", req.url));
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      // If there's an error, redirect to home for safety
      return NextResponse.redirect(new URL("/home", req.url));
    }
  }

  // Return the response with caching headers
  return cachingResponse;
});

// Helper function to check if a route is public
function isPublicRoute(path: string): boolean {
  return publicRoutes.some(pattern => {
    // Convert the pattern to a regex
    const regex = new RegExp(`^${pattern.replace(/\(.*\)/, ".*")}$`);
    return regex.test(path);
  });
}

// Helper function to check if a route is an auth page
function isAuthPage(path: string): boolean {
  return path.startsWith("/sign-in") || path.startsWith("/sign-up");
}

export const config = {
  matcher: [
    // Match all paths except static files, images, and other assets
    "/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|robots\\.txt|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp|.*\\.ico).*)",
    "/api/(.*)",
  ],
};