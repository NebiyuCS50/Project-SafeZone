import { useState } from "react";
import AddisPic from "@/assets/AddisPic.jpeg";
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
import { signUp } from "@/firebase/auth/emailAuth";
import { useNavigate } from "react-router";
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
      await signUp(values.email, values.password, "user");
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
    <div className={("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Enter your email below to create your account
                </p>
              </div>

              {/* EMAIL */}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
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

              {/* PASSWORD + CONFIRM */}
              <Field>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
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
                      Confirm Password
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

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>

              <Field className="grid grid-cols-3 gap-4">
                <Button variant="outline" type="button">
                  Apple
                </Button>
                <Button variant="outline" type="button">
                  Google
                </Button>
                <Button variant="outline" type="button">
                  Meta
                </Button>
              </Field>

              <FieldDescription className="text-center">
                Already have an account? <Link to="/login">Sign in</Link>
              </FieldDescription>
            </FieldGroup>
          </form>

          <div className="bg-muted relative hidden md:block">
            <img
              src={AddisPic}
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
