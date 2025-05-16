"use client";

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define form validation schema
const signUpSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions" }),
  }),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  // Initialize form with react-hook-form
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      termsAccepted: false,
    },
  });

  // Check password strength as user types
  const checkPasswordStrength = (password: string) => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    });
  };

  // Handle form submission
  const onSubmit = async (data: SignUpFormValues) => {
    if (!isLoaded) return;

    try {
      setIsLoading(true);
      setAuthError(null);

      // Attempt to create a new user
      const result = await signUp.create({
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        emailAddress: data.email,
        password: data.password,
      });

      // Start email verification
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setVerifyingEmail(true);
      toast.success("Verification code sent to your email");
    } catch (error: any) {
      console.error("Sign-up error:", error);
      setAuthError(error.errors?.[0]?.message || "Failed to sign up. Please try again.");
      toast.error("Sign-up failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle email verification
  const handleVerification = async (code: string) => {
    if (!isLoaded || !code) return;

    try {
      setIsLoading(true);

      // Attempt to verify the email
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === "complete") {
        // Set the active session
        await setActive({ session: result.createdSessionId });

        // Show success message
        toast.success("Account created successfully!");

        // Redirect to home page
        router.push("/home");
      } else {
        // Handle incomplete verification
        console.log("Verification status:", result.status);
        setAuthError("Verification incomplete. Please try again.");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      setAuthError(error.errors?.[0]?.message || "Failed to verify email. Please try again.");
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Email verification form
  if (verifyingEmail) {
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
                We've sent a verification code to your email address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {authError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="Enter code"
                  disabled={isLoading}
                  onChange={(e) => handleVerification(e.target.value)}
                  className="border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-center text-lg tracking-widest"
                />
              </div>

              <div className="text-sm text-gray-500 text-center">
                <p>Didn't receive a code? Check your spam folder or</p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await signUp.prepareEmailAddressVerification({
                        strategy: "email_code",
                      });
                      toast.success("New verification code sent");
                    } catch (error) {
                      toast.error("Failed to resend code");
                    }
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  resend code
                </button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center border-t border-gray-100 p-6">
              <p className="text-sm text-gray-600">
                <button
                  type="button"
                  onClick={() => setVerifyingEmail(false)}
                  className="font-medium text-indigo-600 hover:text-indigo-800"
                >
                  Go back to sign up
                </button>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

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
            <CardTitle className="text-2xl font-bold text-gray-900">Create an account</CardTitle>
            <CardDescription className="text-gray-500">
              Join ChatterSphere and start connecting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {authError}
              </div>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    disabled={isLoading}
                    {...form.register("firstName")}
                    className="border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    disabled={isLoading}
                    {...form.register("lastName")}
                    className="border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  disabled={isLoading}
                  {...form.register("username")}
                  className="border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                {form.formState.errors.username && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={isLoading}
                  {...form.register("email")}
                  className="border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                {form.formState.errors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Password must contain at least:</p>
                        <ul className="list-disc pl-4 text-xs">
                          <li>8 characters</li>
                          <li>One uppercase letter</li>
                          <li>One lowercase letter</li>
                          <li>One number</li>
                          <li>One special character</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isLoading}
                    {...form.register("password")}
                    onChange={(e) => {
                      form.register("password").onChange(e);
                      checkPasswordStrength(e.target.value);
                    }}
                    className="border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.password.message}
                  </p>
                )}

                {/* Password strength indicators */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`h-4 w-4 rounded-full flex items-center justify-center ${
                        passwordStrength.length ? "bg-green-100" : "bg-gray-100"
                      }`}
                    >
                      {passwordStrength.length && (
                        <Check className="h-3 w-3 text-green-600" />
                      )}
                    </div>
                    <span className="text-xs text-gray-600">8+ characters</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`h-4 w-4 rounded-full flex items-center justify-center ${
                        passwordStrength.uppercase ? "bg-green-100" : "bg-gray-100"
                      }`}
                    >
                      {passwordStrength.uppercase && (
                        <Check className="h-3 w-3 text-green-600" />
                      )}
                    </div>
                    <span className="text-xs text-gray-600">Uppercase letter</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`h-4 w-4 rounded-full flex items-center justify-center ${
                        passwordStrength.lowercase ? "bg-green-100" : "bg-gray-100"
                      }`}
                    >
                      {passwordStrength.lowercase && (
                        <Check className="h-3 w-3 text-green-600" />
                      )}
                    </div>
                    <span className="text-xs text-gray-600">Lowercase letter</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`h-4 w-4 rounded-full flex items-center justify-center ${
                        passwordStrength.number ? "bg-green-100" : "bg-gray-100"
                      }`}
                    >
                      {passwordStrength.number && (
                        <Check className="h-3 w-3 text-green-600" />
                      )}
                    </div>
                    <span className="text-xs text-gray-600">Number</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`h-4 w-4 rounded-full flex items-center justify-center ${
                        passwordStrength.special ? "bg-green-100" : "bg-gray-100"
                      }`}
                    >
                      {passwordStrength.special && (
                        <Check className="h-3 w-3 text-green-600" />
                      )}
                    </div>
                    <span className="text-xs text-gray-600">Special character</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="termsAccepted" {...form.register("termsAccepted")} />
                <Label
                  htmlFor="termsAccepted"
                  className="text-sm text-gray-600 font-normal"
                >
                  I agree to the{" "}
                  <Link
                    href="/terms-of-service"
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy-policy"
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    Privacy Policy
                  </Link>
                </Label>
              </div>
              {form.formState.errors.termsAccepted && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.termsAccepted.message}
                </p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="w-full">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  onClick={() => signUp.authenticateWithRedirect({
                    strategy: "oauth_google",
                    redirectUrl: "/sso-callback",
                    redirectUrlComplete: "/home"
                  })}
                  className="w-full border-gray-300 hover:bg-gray-50"
                >
                  <img src="/google-icon.svg" alt="Google" className="h-5 w-5 mr-2" />
                  Continue with Google
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-gray-100 p-6">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="font-medium text-indigo-600 hover:text-indigo-800"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
