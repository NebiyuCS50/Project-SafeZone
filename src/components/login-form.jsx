import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { login } from "@/firebase/auth/emailAuth";
import fetchUserData from "@/utils/user";
import { signInWithGoogle } from "@/firebase/auth/googleAuth";

export function LoginForm({ className, ...props }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const handleGoogleAuth = async () => {
    try {
      await signInWithGoogle();
      // Optionally show a toast or redirect
      toast.success("Signed in with Google!");
      navigate("/userdashboard"); // or wherever you want to go after login/signup
    } catch (err) {
      toast.error("Google sign-in failed", {
        description: err.message,
      });
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const email = e.target.email.value;
    const password = e.target.password.value;

    setLoading(true);
    try {
      await login(email, password);

      // Fetch user data from Firestore
      const userData = await fetchUserData();
      if (userData.isActive === false) {
        toast.error("Account disabled", {
          description:
            "Your account has been disabled. Please contact support.",
        });
        setLoading(false);
        return;
      }

      toast.success("Login successful", {
        description: <span>Welcome back!</span>,
      });
      setTimeout(() => {
        navigate("/userdashboard");
      }, 1600);
    } catch (err) {
      toast.error("Login failed", {
        description: "Invalid email or password. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <form
      className={("flex flex-col gap-6", className)}
      {...props}
      onSubmit={onSubmit}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to login to your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" placeholder="m@example.com" required />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <Input id="password" type="password" required />
        </Field>
        <Field>
          <Button type="submit">Login</Button>
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <Button
            variant="outline"
            type="button"
            className="flex items-center gap-2"
            onClick={handleGoogleAuth}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="w-5 h-5"
              aria-hidden="true"
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
            Login with Google
          </Button>

          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="underline underline-offset-4">
              Sign up
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
