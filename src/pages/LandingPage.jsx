"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Shield,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  User,
  LogOut,
  Menu,
  X,
  MapPin,
  Star,
  ArrowRight,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Home() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [showSignInDialog, setShowSignInDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sign in form states
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  const features = [
    {
      icon: Users,
      title: "Community Powered",
      description:
        "Join thousands of Addis Ababa residents working together to keep our city safe.",
    },
    {
      icon: Shield,
      title: "AI Verification",
      description:
        "Advanced AI technology ensures all reports are authentic and reliable.",
    },
    {
      icon: Eye,
      title: "Real-time Updates",
      description:
        "Get instant notifications about verified incidents in your area.",
    },
    {
      icon: TrendingUp,
      title: "Data Analytics",
      description:
        "Comprehensive insights and trends to improve city safety planning.",
    },
    {
      icon: AlertTriangle,
      title: "Emergency Response",
      description:
        "Quick coordination with local authorities for faster response times.",
    },
    {
      icon: CheckCircle,
      title: "Verified Reports",
      description:
        "Only authenticated and verified incidents are shared with the community.",
    },
  ];

  const testimonials = [
    {
      name: "Abeba Kebede",
      role: "Resident, Bole",
      content:
        "SafeZone has transformed how we report and respond to incidents in our neighborhood. I feel much safer knowing help is just a tap away.",
      rating: 5,
    },
    {
      name: "Dawit Haile",
      role: "Business Owner, Mekelle",
      content:
        "The real-time updates help me plan my deliveries better and avoid traffic incidents. Essential for my business operations.",
      rating: 5,
    },
    {
      name: "Sara Tadesse",
      role: "Student, Kazanchis",
      content:
        "As a student who travels daily, SafeZone gives me peace of mind knowing I can check for safety incidents along my route.",
      rating: 5,
    },
  ];

  const handleSignIn = () => {
    if (!signInEmail || !signInPassword) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    // Simulate sign in
    setIsSignedIn(true);
    setShowSignInDialog(false);
    setSignInEmail("");
    setSignInPassword("");
    toast({
      title: "Sign In Successful",
      description: "Welcome back to SafeZone!",
    });
  };

  const handleSignOut = () => {
    setIsSignedIn(false);
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">SafeZone</h1>
              <Badge variant="secondary">Addis Ababa</Badge>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Button
                variant="ghost"
                onClick={() =>
                  document
                    .getElementById("features")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Features
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                How It Works
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  document
                    .getElementById("testimonials")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Testimonials
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  document
                    .getElementById("contact")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Contact
              </Button>
              {isSignedIn ? (
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    Signed In
                  </Badge>
                  <Button variant="outline" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Dialog
                  open={showSignInDialog}
                  onOpenChange={setShowSignInDialog}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <User className="w-4 h-4 mr-2" />
                      Sign In
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Sign In to SafeZone</DialogTitle>
                      <DialogDescription>
                        Enter your credentials to access SafeZone features
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={signInEmail}
                          onChange={(e) => setSignInEmail(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          value={signInPassword}
                          onChange={(e) => setSignInPassword(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleSignIn} className="w-full">
                        Sign In
                      </Button>
                      <div className="text-center text-sm text-gray-600">
                        Don't have an account?{" "}
                        <Button variant="link" className="p-0 h-auto">
                          Sign Up
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t">
              <div className="flex flex-col space-y-3">
                <Button
                  variant="ghost"
                  onClick={() =>
                    document
                      .getElementById("features")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Features
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    document
                      .getElementById("how-it-works")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  How It Works
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    document
                      .getElementById("testimonials")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Testimonials
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    document
                      .getElementById("contact")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Contact
                </Button>
                {isSignedIn ? (
                  <div className="flex flex-col space-y-3">
                    <Badge
                      variant="outline"
                      className="flex items-center justify-center"
                    >
                      <User className="w-3 h-3 mr-1" />
                      Signed In
                    </Badge>
                    <Button variant="outline" onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => setShowSignInDialog(true)}>
                    <User className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800">
            🇪🇹 Made for Addis Ababa
          </Badge>
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Making Addis Ababa Safer Together
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Join thousands of residents in creating a safer community through
            real-time incident reporting, AI verification, and coordinated
            emergency response.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-lg px-8"
              onClick={() => setShowSignInDialog(true)}
            >
              <User className="w-5 h-5 mr-2" />
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8"
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <Eye className="w-5 h-5 mr-2" />
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">2,847</div>
                <div className="text-gray-600">Total Reports</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600">89%</div>
                <div className="text-gray-600">Verified Reports</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-600">15min</div>
                <div className="text-gray-600">Avg. Response Time</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-orange-600">24/7</div>
                <div className="text-gray-600">Active Monitoring</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16" id="features">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">
            Why Choose SafeZone?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-semibold mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white" id="how-it-works">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">
            How SafeZone Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h4 className="text-lg font-semibold mb-2">Sign Up</h4>
              <p className="text-gray-600">
                Create your account and join the SafeZone community
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h4 className="text-lg font-semibold mb-2">Report Incidents</h4>
              <p className="text-gray-600">
                Share safety concerns with photos and details
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h4 className="text-lg font-semibold mb-2">AI Verification</h4>
              <p className="text-gray-600">
                Our AI ensures reports are authentic and reliable
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                4
              </div>
              <h4 className="text-lg font-semibold mb-2">Stay Informed</h4>
              <p className="text-gray-600">
                Get real-time updates and safety alerts
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16" id="testimonials">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">
            What Our Users Say
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {renderStars(testimonial.rating)}
                  </div>
                  <p className="text-gray-700 mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-6">
            Ready to Make Addis Ababa Safer?
          </h3>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of residents working together to create a safer
            community for everyone. Sign up today and be part of the solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isSignedIn ? (
              <Button
                size="lg"
                variant="secondary"
                onClick={() => setShowSignInDialog(true)}
              >
                <User className="w-5 h-5 mr-2" />
                Sign Up Now
              </Button>
            ) : (
              <Button size="lg" variant="secondary">
                <Shield className="w-5 h-5 mr-2" />
                Go to Dashboard
              </Button>
            )}
            <Button
              size="lg"
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-blue-600"
              onClick={() =>
                document
                  .getElementById("contact")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-white" id="contact">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Get in Touch</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div>
              <h4 className="text-xl font-semibold mb-4">
                Contact Information
              </h4>
              <div className="space-y-4">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-blue-600 mr-3" />
                  <span>Bole, Addis Ababa, Ethiopia</span>
                </div>
                <div className="flex items-center">
                  <User className="w-5 h-5 text-blue-600 mr-3" />
                  <span>support@safezone.et</span>
                </div>
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-blue-600 mr-3" />
                  <span>+251 11 123 4567</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-4">Office Hours</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Monday - Friday:</span>
                  <span>9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday:</span>
                  <span>10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday:</span>
                  <span>Closed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="w-6 h-6" />
                <h3 className="text-lg font-bold">SafeZone</h3>
              </div>
              <p className="text-gray-400">
                Making Addis Ababa safer through community-powered incident
                reporting and real-time safety updates.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Incident Reporting</li>
                <li>AI Verification</li>
                <li>Real-time Updates</li>
                <li>Emergency Response</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Safety Guidelines</li>
                <li>Contact Us</li>
                <li>Report Issues</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Twitter</li>
                <li>Facebook</li>
                <li>Telegram</li>
                <li>Email</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2024 SafeZone Addis Ababa. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
