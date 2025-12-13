import { GalleryVerticalEnd } from "lucide-react";
import logo from "@/assets/Logo.png";
import SafeZone from "@/assets/SafeZone.jpeg";
import { LoginForm } from "@/components/login-form";
import { Link } from "react-router-dom";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link to="/" className="flex items-center gap-1 font-medium">
            <div className="bg-white text-primary-foreground flex size-13 items-center justify-center rounded-md">
              <img src={logo} alt="Logo" />
            </div>
            SafeRoute
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src={SafeZone}
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
