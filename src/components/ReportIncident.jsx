import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IncidentReporting } from "@/firebase/incidentReporting";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  MapPin,
  Camera,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { IncidentSchema } from "@/validation/IncidentSchema";
import { toast } from "sonner";

// Mock user data (in real app, this would come from auth)
const mockUser = {
  userId: "user_12345",
  userEmail: "john.doe@example.com",
  userFullName: "John Doe",
};

const incidentTypes = [
  { value: "accident", label: "Accident", icon: "🚗" },
  { value: "traffic", label: "Traffic Issue", icon: "🚦" },
  { value: "crime", label: "Crime / Suspicious Activity", icon: "🚔" },
  { value: "fire", label: "Fire / Hazard", icon: "🔥" },
  { value: "medical", label: "Medical Emergency", icon: "🚑" },
  { value: "disaster", label: "Natural Disaster", icon: "🌪️" },
  { value: "other", label: "Other", icon: "⚠️" },
];

export function ReportIncident() {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const form = useForm({
    resolver: zodResolver(IncidentSchema),
    defaultValues: {
      incidentType: "",
      location: {
        lat: 0,
        lng: 0,
      },
      description: "",
      image: null,
      timestamp: new Date().toISOString(),
    },
  });

  useEffect(() => {
    form.setValue("timestamp", new Date().toISOString());
  }, [form]);

  const getCurrentLocation = () => {
    setIsGettingLocation(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          form.setValue("location.lat", latitude);
          form.setValue("location.lng", longitude);
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsGettingLocation(false);
          // Fallback to default coordinates (you might want to use a city center)
          form.setValue("location.lat", 40.7128);
          form.setValue("location.lng", -74.006);
          toast("Location Access Denied", {
            description:
              "Could not get your location. Using default coordinates.",
            variant: "destructive",
          });
        }
      );
    } else {
      setIsGettingLocation(false);
      // Fallback for browsers that don't support geolocation
      form.setValue("location.lat", 40.7128);
      form.setValue("location.lng", -74.006);
      toast("Location Not Supported", {
        description:
          "Your browser does not support geolocation. Using default coordinates.",
        variant: "destructive",
      });
    }
  };
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast("File too large", {
          description: "Please upload an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
        toast("Invalid file type", {
          description: "Please upload a JPEG or PNG image.",
          variant: "destructive",
        });
        return;
      }

      form.setValue("image", file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Call your incident reporting function
      await IncidentReporting({
        incidentType: data.incidentType,
        description: data.description,
        location: data.location,
        file: data.image,
        user: mockUser, // Replace with real user in production
      });

      setSubmitStatus("success");
      form.reset();
      setImagePreview(null);
      form.setValue("timestamp", new Date().toISOString());
      toast("Incident reported successfully!", { variant: "success" });
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus("error");
      toast("Error reporting incident", {
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toISOString().slice(0, 16); // Format for datetime-local input
  };
  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Report an Incident
          </CardTitle>
          <CardDescription>
            Please provide detailed information about the incident you are
            reporting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Incident Type */}
              <FormField
                control={form.control}
                name="incidentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Incident Category *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select the type of incident" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {incidentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <span>{type.icon}</span>
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the type of incident you are reporting.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location */}
              <div className="space-y-4">
                <FormLabel className="text-base font-medium">
                  Incident Location *
                </FormLabel>
                <FormDescription className="text-sm">
                  Automatically capture the user's coordinates. Allow manual
                  input as backup.
                </FormDescription>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="flex items-center gap-2"
                  >
                    {isGettingLocation ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                    Use My Location
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="location.lat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="40.7128"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Auto-filled via browser geolocation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location.lng"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="-74.0060"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Auto-filled via browser geolocation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Incident Description *</FormLabel>
                    <FormDescription>
                      Provide a clear and detailed explanation of what happened.
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what happened in detail..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Min: 10 characters</span>
                      <span>Max: 500 characters</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image Upload */}
              <div className="space-y-4">
                <FormLabel className="text-base font-medium">
                  Upload Evidence
                </FormLabel>
                <FormDescription className="text-sm">
                  Upload a photo or image related to the incident. (Optional but
                  recommended)
                </FormDescription>

                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="space-y-4">
                          <Input
                            type="file"
                            accept=".jpg,.jpeg,.png"
                            onChange={handleImageChange}
                            className="cursor-pointer"
                          />
                          <div className="text-sm text-gray-500">
                            Accept: .jpg, .jpeg, .png | Max size: 5MB
                          </div>

                          {imagePreview && (
                            <div className="mt-4">
                              <div className="relative inline-block">
                                <img
                                  src={imagePreview}
                                  alt="Incident evidence preview"
                                  className="max-w-full h-auto rounded-lg border border-gray-200"
                                  style={{ maxHeight: "300px" }}
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-2 right-2"
                                  onClick={() => {
                                    setImagePreview(null);
                                    form.setValue("image", null);
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Date & Time */}
              <FormField
                control={form.control}
                name="timestamp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date & Time of Incident *</FormLabel>
                    <FormDescription>
                      When did this incident occur? Auto-filled with current
                      time but editable.
                    </FormDescription>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        value={formatDateTime(field.value)}
                        onChange={(e) =>
                          field.onChange(new Date(e.target.value).toISOString())
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Reporter Information (Read-only) */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-700">
                    Reporter Information (Auto-filled)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">User ID:</span>
                    <p className="text-gray-800">{mockUser.userId}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Email:</span>
                    <p className="text-gray-800">{mockUser.userEmail}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Full Name:
                    </span>
                    <p className="text-gray-800">{mockUser.userFullName}</p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 italic">
                  This information is pulled from authentication and is not
                  editable.
                </p>
              </div>

              {/* Submit Status */}
              {submitStatus === "success" && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Incident report submitted successfully! Thank you for your
                    report.
                  </AlertDescription>
                </Alert>
              )}

              {submitStatus === "error" && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    Failed to submit incident report. Please try again or
                    contact support.
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Report...
                  </>
                ) : (
                  "Submit Incident Report"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
