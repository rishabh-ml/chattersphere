"use client";

import { useEffect } from "react";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export default function SSOCallbackPage() {
  const { isLoaded: isSignInLoaded, signIn } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp } = useSignUp();

  useEffect(() => {
    // Get the search params from the URL
    const searchParams = new URLSearchParams(window.location.search);

    // Check if we're handling a sign-in or sign-up flow
    if (searchParams.has("__clerk_status")) {
      const status = searchParams.get("__clerk_status");

      if (status === "needs_first_factor") {
        // This is a sign-in flow
        if (isSignInLoaded) {
          try {
            // Handle the Google OAuth callback
            signIn.authenticateWithRedirect({
              strategy: "oauth_callback",
              redirectUrl: "/sso-callback",
              redirectUrlComplete: "/home",
            });
          } catch (error) {
            console.error("Error during sign-in OAuth callback:", error);
            window.location.href = "/sign-in?error=oauth-callback-failed";
          }
        }
      } else if (status === "needs_identifier") {
        // This is a sign-up flow
        if (isSignUpLoaded) {
          try {
            // Handle the Google OAuth callback
            signUp.authenticateWithRedirect({
              strategy: "oauth_callback",
              redirectUrl: "/sso-callback",
              redirectUrlComplete: "/home",
            });
          } catch (error) {
            console.error("Error during sign-up OAuth callback:", error);
            window.location.href = "/sign-up?error=oauth-callback-failed";
          }
        }
      } else {
        // Unknown status, redirect to sign-in
        window.location.href = "/sign-in";
      }
    } else {
      // No status parameter, redirect to sign-in
      window.location.href = "/sign-in";
    }
  }, [isSignInLoaded, isSignUpLoaded, signIn, signUp]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Processing your sign-in</h1>
        <p className="text-gray-500">Please wait while we authenticate your account...</p>
      </div>
    </div>
  );
}
