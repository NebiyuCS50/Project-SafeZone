import { useState } from "react";
import AddisPic from "@/assets/AddisPic.jpeg";
import Logo from "@/assets/Logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { signUp } from "@/firebase/auth/emailAuth";

import { useToast } from "@/hooks/use-toast";
import Loading from "./ui/Loading";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignupSchema } from "@/validation/signupSchema";

export function SignupForm({ className, ...props }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirm: "",
    },
  });

  const onSubmit = async (values) => {
    if (loading) return;

    setLoading(true);
    try {
      await signUp(
        values.name,
        values.email,
        values.password,
        "user",
        values.phoneNumber
      );
      console.log("User signed up successfully");
      toast({ title: "Account created", description: "You can now sign in" });
      navigate("/login");
    } catch (err) {
      console.error(err);
      toast({
        title: err?.message || "Signup failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`flex flex-col md:flex-row min-h-screen ${className}`}
      {...props}
    >
      {/* Left side: Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <form className="w-full max-w-md" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col items-center gap-4 text-center mb-6">
            <img
              src={Logo}
              alt="Logo"
              className="mx-auto w-28 h-28 object-cover rounded-md"
            />
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-muted-foreground text-sm text-balance">
              Enter your email below to create your account
            </p>
          </div>

          {/* NAME */}
          <Field>
            <FieldLabel htmlFor="name">
              Name<span className="text-red-500 -ml-1">*</span>
            </FieldLabel>
            <Input id="name" type="text" {...register("name")} />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </Field>

          {/* EMAIL */}
          <Field>
            <FieldLabel htmlFor="email">
              Email<span className="text-red-500 -ml-1">*</span>
            </FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </Field>

          {/* PHONE NUMBER */}
          <Field>
            <FieldLabel htmlFor="phone">
              Phone Number<span className="text-red-500 -ml-1">*</span>
            </FieldLabel>
            <Input
              id="phone"
              type="tel"
              placeholder="+251 9XXXXXXXX"
              {...register("phoneNumber")}
            />
            {errors.phoneNumber && (
              <p className="text-red-500 text-sm">
                {errors.phoneNumber.message}
              </p>
            )}
          </Field>

          {/* PASSWORD + CONFIRM */}
          <Field>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor="password">
                  Password<span className="text-red-500 -ml-1">*</span>
                </FieldLabel>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div>
                <FieldLabel htmlFor="confirm-password">
                  Confirm Password<span className="text-red-500 -ml-1">*</span>
                </FieldLabel>
                <Input
                  id="confirm-password"
                  type="password"
                  {...register("confirm")}
                />
                {errors.confirm && (
                  <p className="text-red-500 text-sm">
                    {errors.confirm.message}
                  </p>
                )}
              </div>
            </div>
          </Field>

          <Field>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </Field>

          <div className="relative flex items-center mt-6 mb-4">
            <div className="flex-grow border-t border-muted-foreground/30"></div>
            <span className="mx-3 text-sm text-muted-foreground">
              Or continue with
            </span>
            <div className="flex-grow border-t border-muted-foreground/30"></div>
          </div>

          <Field className="mt-6">
            <Button
              variant="outline"
              type="button"
              className="w-full flex items-center justify-center gap-3 py-2"
            >
              {/* GOOGLE ICON */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                className="w-5 h-5"
              >
                <path
                  fill="#fbc02d"
                  d="M43.6 20.5H42V20H24v8h11.3C34.6 32.9 30 36 24 36c-7.7 0-14-6.3-14-14s6.3-14 14-14c3.6 0 6.8 1.3 9.3 3.4l6.2-6.2C36.2 2.7 30.5 0 24 0 10.7 0 0 10.7 0 24s10.7 24 24 24c12.4 0 23-9 23.9-21.2.1-1 .1-2 .1-2.3z"
                />
                <path
                  fill="#e53935"
                  d="M6.3 14.8l6.8 5c1.5-4.5 5.7-7.8 10.9-7.8 3.6 0 6.8 1.3 9.3 3.4l6.2-6.2C36.2 2.7 30.5 0 24 0 15.3 0 7.9 5.1 4 12.5z"
                />
                <path
                  fill="#4caf50"
                  d="M24 48c6.5 0 12.2-2.2 16.7-6l-8-6.6c-2.4 1.6-5.3 2.5-8.7 2.5-6 0-10.8-3.1-13.3-7.6l-6.9 5.3C7.9 42.9 15.3 48 24 48z"
                />
                <path
                  fill="#1565c0"
                  d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.4 5.6-6.4 7.1v5.6C36.2 36.2 43.6 29.9 43.6 20.5z"
                />
              </svg>

              <span className="text-sm font-medium">Continue with Google</span>
            </Button>
          </Field>

          <FieldDescription className="text-center mt-4">
            Already have an account? <Link to="/login">Sign in</Link>
          </FieldDescription>
        </form>
      </div>

      {/* Right side: Image */}
      <div className="hidden md:block md:w-1/2 relative">
        <img
          src={AddisPic}
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
