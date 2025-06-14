"use client";

import { useState, useEffect } from "react";
import { useSignIn, useSignUp, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function VerifyPage() {
  const { isLoaded: isUserLoaded, isSignedIn, user } = useUser();
  const { isLoaded: isSignInLoaded, signIn } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp } = useSignUp();
  const router = useRouter();
  const [verificationCode, setVerificationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [verificationType, setVerificationType] = useState<"signIn" | "signUp" | null>(null);

  useEffect(() => {
    // If user is already signed in and doesn't need verification, redirect to home
    if (
      isUserLoaded &&
      isSignedIn &&
      !user?.emailAddresses.some((email) => !email.verification.status)
    ) {
      router.push("/home");
    }

    // Determine if we're in a sign-in or sign-up flow
    const searchParams = new URLSearchParams(window.location.search);
    const type = searchParams.get("type");

    if (type === "sign-in") {
      setVerificationType("signIn");
    } else if (type === "sign-up") {
      setVerificationType("signUp");
    } else {
      // Default to sign-in if not specified
      setVerificationType("signIn");
    }
  }, [isUserLoaded, isSignedIn, user, router]);

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (verificationType === "signIn" && isSignInLoaded) {
        const result = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code: verificationCode,
        });

        if (result.status === "complete") {
          setSuccess(true);
          toast.success("Email verified successfully");

          // Redirect after a short delay
          setTimeout(() => {
            router.push("/home");
          }, 1500);
        }
      } else if (verificationType === "signUp" && isSignUpLoaded) {
        const result = await signUp.attemptEmailAddressVerification({
          code: verificationCode,
        });

        if (result.status === "complete") {
          setSuccess(true);
          toast.success("Email verified successfully");

          // Redirect after a short delay
          setTimeout(() => {
            router.push("/home");
          }, 1500);
        }
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      setError(error.errors?.[0]?.message || "Failed to verify email. Please try again.");
      toast.error("Verification failed");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleResendCode = async () => {
    try {
      if (verificationType === "signIn" && isSignInLoaded && signIn) {
        // Get the first email address for the strategy
        const emailAddress = signIn.supportedFirstFactors?.find(
          (factor) => factor.strategy === "email_code"
        );

        if (emailAddress && "emailAddressId" in emailAddress) {
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: emailAddress.emailAddressId,
          });
        } else {
          // Fallback - try without emailAddressId
          await signIn.prepareFirstFactor({
            strategy: "email_code",
          } as any);
        }
      } else if (verificationType === "signUp" && isSignUpLoaded) {
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
      }

      toast.success("Verification code resent");
    } catch (error) {
      console.error("Error resending code:", error);
      toast.error("Failed to resend verification code");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-gray-200 shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <img src="/logo.png" alt="ChatterSphere Logo" className="h-12 w-auto" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Verify your email</CardTitle>
            <CardDescription className="text-gray-500">
              Enter the verification code sent to your email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Email verified successfully! Redirecting...
              </div>
            )}

            <form onSubmit={handleVerification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="Enter code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  disabled={isSubmitting || success}
                  className="border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-center text-lg tracking-widest"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || success || !verificationCode.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </Button>

              <div className="text-sm text-gray-500 text-center">
                <p>Didn't receive a code?</p>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isSubmitting || success}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Resend verification code
                </button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-gray-100 p-6">
            <p className="text-sm text-gray-600">
              <button
                type="button"
                onClick={() => router.push("/sign-in")}
                className="font-medium text-indigo-600 hover:text-indigo-800"
              >
                Back to sign in
              </button>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
