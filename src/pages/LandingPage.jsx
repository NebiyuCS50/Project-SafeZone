import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

import { auth } from "@/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import "@/firebase/firebase";
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
  Mail,
  Phone,
  MessageSquare,
} from "lucide-react";
import { isSessionExpired } from "@/firebase/auth/emailAuth";
import { db } from "@/firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Home() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsSignedIn(true);
      } else {
        setIsSignedIn(false);
      }
    });

    return () => unsubscribe();
  }, []);
  const navigate = useNavigate();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: Users,
      title: "Community Powered",
      description:
        "Join thousands of Addis Ababa residents working together to keep our city safe.",
      color: "text-blue-600",
    },
    {
      icon: Shield,
      title: "AI Verification",
      description:
        "Advanced AI technology ensures all reports are authentic and reliable.",
      color: "text-purple-600",
    },
    {
      icon: Eye,
      title: "Real-time Updates",
      description:
        "Get instant notifications about verified incidents in your area.",
      color: "text-green-600",
    },
    {
      icon: TrendingUp,
      title: "Data Analytics",
      description:
        "Comprehensive insights and trends to improve city safety planning.",
      color: "text-orange-600",
    },
    {
      icon: AlertTriangle,
      title: "Emergency Response",
      description:
        "Quick coordination with local authorities for faster response times.",
      color: "text-red-600",
    },
    {
      icon: CheckCircle,
      title: "Verified Reports",
      description:
        "Only authenticated and verified incidents are shared with community.",
      color: "text-teal-600",
    },
  ];

  const testimonials = [
    {
      name: "Abeba Kebede",
      role: "Resident, Bole",
      content:
        "SafeRoute has transformed how we report and respond to incidents in our neighborhood. I feel much safer knowing help is just a tap away.",
      rating: 5,
      avatar: "AK",
    },
    {
      name: "Dawit Haile",
      role: "Business Owner, Mekelle",
      content:
        "The real-time updates help me plan my deliveries better and avoid traffic incidents. Essential for my business operations.",
      rating: 5,
      avatar: "DH",
    },
    {
      name: "Sara Tadesse",
      role: "Student, Kazanchis",
      content:
        "As a student who travels daily, SafeRoute gives me peace of mind knowing I can check for safety incidents along my route.",
      rating: 5,
      avatar: "ST",
    },
  ];

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
              <h1 className="text-2xl font-bold text-gray-900">SafeRoute</h1>
              <div className="flex items-center space-x-2  lg:flex">
                <span className="text-lg font-semibold">
                  {" "}
                  <sup>
                    <Badge variant="secondary" className="ml-1">
                      Addis Ababa
                      <span className="relative flex h-2 w-2 ml-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                    </Badge>
                  </sup>
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
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
              <Button
                onClick={async () => {
                  if (
                    !isSessionExpired() &&
                    localStorage.getItem("lastLoginTimestamp")
                  ) {
                    const user = auth.currentUser;
                    if (user) {
                      const userDocRef = doc(db, "users", user.uid);
                      const userDocSnap = await getDoc(userDocRef);
                      const role = userDocSnap.data()?.role;
                      if (role === "admin") {
                        navigate("/admin-dashboard");
                      } else {
                        navigate("/userdashboard");
                      }
                    } else {
                      navigate("/userdashboard");
                    }
                  } else {
                    navigate("/login");
                  }
                }}
              >
                <User className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </nav>

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
            <nav className="md:hidden mt-4 pt-4 border-t">
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
                <Button
                  onClick={async () => {
                    if (
                      !isSessionExpired() &&
                      localStorage.getItem("lastLoginTimestamp")
                    ) {
                      const user = auth.currentUser;
                      if (user) {
                        const userDocRef = doc(db, "users", user.uid);
                        const userDocSnap = await getDoc(userDocRef);
                        const role = userDocSnap.data()?.role;
                        if (role === "admin") {
                          navigate("/admin-dashboard");
                        } else {
                          navigate("/userdashboard");
                        }
                      } else {
                        navigate("/userdashboard");
                      }
                    } else {
                      navigate("/login");
                    }
                  }}
                >
                  <User className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-200">
            🇪🇹 Made for Addis Ababa
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Making Addis Ababa
            <span className="text-blue-600"> Safer Together</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join thousands of residents in creating a safer community through
            real-time incident reporting, AI verification, and coordinated
            emergency response.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-lg px-8 py-3"
              onClick={() => navigate("/signup")}
            >
              <User className="w-5 h-5 mr-2" />
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-3"
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
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="text-center border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                  2,847
                </div>
                <div className="text-gray-600 font-medium">Total Reports</div>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">
                  89%
                </div>
                <div className="text-gray-600 font-medium">
                  Verified Reports
                </div>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">
                  15min
                </div>
                <div className="text-gray-600 font-medium">
                  Avg. Response Time
                </div>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="text-3xl md:text-4xl font-bold text-orange-600 mb-2">
                  24/7
                </div>
                <div className="text-gray-600 font-medium">
                  Active Monitoring
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20" id="features">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose SafeRoute?
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover the features that make SafeRoute the most trusted safety
              platform in Addis Ababa
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300 border-0 shadow-sm"
              >
                <CardContent className="p-8 text-center">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${feature.color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <h4 className="text-xl font-semibold mb-3 text-gray-900">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white" id="how-it-works">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How SafeRoute Works
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get started in four simple steps and start making a difference in
              your community
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: 1,
                title: "Sign Up",
                description: "Create your account and join SafeRoute community",
              },
              {
                step: 2,
                title: "Report Incidents",
                description: "Share safety concerns with photos and details",
              },
              {
                step: 3,
                title: "AI Verification",
                description:
                  "Our AI ensures reports are authentic and reliable",
              },
              {
                step: 4,
                title: "Stay Informed",
                description: "Get real-time updates and safety alerts",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  {item.step}
                </div>
                <h4 className="text-lg font-semibold mb-3 text-gray-900">
                  {item.title}
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20" id="testimonials">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real stories from real people making Addis Ababa safer
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white shadow-sm border-0">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {renderStars(testimonial.rating)}
                  </div>
                  <p className="text-gray-700 mb-6 italic leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-blue-600 font-semibold">
                        {testimonial.avatar}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {testimonial.name}
                      </div>
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
          <h3 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Make Addis Ababa Safer?
          </h3>
          <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto leading-relaxed">
            Join thousands of residents working together to create a safer
            community for everyone. Sign up today and be part of the solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isSignedIn ? (
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-3"
                onClick={() => navigate("/signup")}
              >
                <User className="w-5 h-5 mr-2" />
                Sign Up Now
              </Button>
            ) : (
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-3"
                onClick={async () => {
                  if (
                    !isSessionExpired() &&
                    localStorage.getItem("lastLoginTimestamp")
                  ) {
                    const user = auth.currentUser;
                    if (user) {
                      const userDocRef = doc(db, "users", user.uid);
                      const userDocSnap = await getDoc(userDocRef);
                      const role = userDocSnap.data()?.role;
                      if (role === "admin") {
                        navigate("/admin-dashboard");
                      } else {
                        navigate("/userdashboard");
                      }
                    } else {
                      navigate("/userdashboard");
                    }
                  } else {
                    navigate("/login");
                  }
                }}
              >
                <Shield className="w-5 h-5 mr-2" />
                Go to Dashboard
              </Button>
            )}
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-3 text-blue-600 border-white hover:bg-orange-600 hover:border-orange-600 hover:text-white"
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
      <section className="py-20 bg-white" id="contact">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get in Touch
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Have questions? We're here to help make Addis Ababa safer together
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center border-0 shadow-sm">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2 text-gray-900">Visit Us</h4>
                <p className="text-gray-600">Bole, Addis Ababa, Ethiopia</p>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-sm">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2 text-gray-900">Email Us</h4>
                <p className="text-gray-600">support@SafeRoute.et</p>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-sm">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2 text-gray-900">Call Us</h4>
                <p className="text-gray-600">+251 11 123 4567</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Shield className="w-8 h-8" />
                <h3 className="text-xl font-bold">SafeRoute</h3>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Making Addis Ababa safer through community-powered incident
                reporting and real-time safety updates.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-6">Features</h4>
              <ul className="space-y-3 text-gray-400">
                <li className="hover:text-white transition-colors cursor-pointer">
                  Incident Reporting
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  AI Verification
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  Real-time Updates
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  Emergency Response
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-6">Support</h4>
              <ul className="space-y-3 text-gray-400">
                <li className="hover:text-white transition-colors cursor-pointer">
                  Help Center
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  Safety Guidelines
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  Contact Us
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  Report Issues
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-6">Connect</h4>
              <ul className="space-y-3 text-gray-400">
                <li className="hover:text-white transition-colors cursor-pointer">
                  Twitter
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  Facebook
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  Telegram
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  LinkedIn
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© 2024 SafeRoute Addis Ababa. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
