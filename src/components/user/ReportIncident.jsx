import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IncidentSchema } from "@/validation/IncidentSchema";
import { Button } from "@/components/ui/button";
import { IncidentReporting } from "@/firebase/incidentReporting";
import { auth } from "@/firebase/firebase";
import CameraCapture from "./CameraCapture";
import { uploadToImageKit } from "@/utils/uploadToImageKit";
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
import { Upload, MapPin, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const incidentCategories = [
  { value: "accident", label: "Accident", icon: "🚗" },
  { value: "traffic", label: "Traffic Issue", icon: "🚦" },
  { value: "crime", label: "Crime / Suspicious Activity", icon: "🚔" },
  { value: "fire", label: "Fire / Hazard", icon: "🔥" },
  { value: "medical", label: "Medical Emergency", icon: "🚑" },
  { value: "disaster", label: "Natural Disaster", icon: "🌪️" },
  { value: "other", label: "Other", icon: "⚠️" },
];

export function ReportIncident({ setIsCameraActive }) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getCurrentDateTimeLocal = () => {
    const now = new Date();

    const pad = (n) => n.toString().padStart(2, "0");
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const hh = pad(now.getHours());
    const min = pad(now.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };
  const form = useForm({
    resolver: zodResolver(IncidentSchema),
    mode: "onSubmit",
    defaultValues: {
      incidentType: "",
      location: { lat: 0, lng: 0 },
      description: "",
      timestamp: getCurrentDateTimeLocal(),
      image: null,
    },
  });

  useEffect(() => {
    // Auto-fill current timestamp
    form.setValue("timestamp", new Date().toISOString().slice(0, 16));
  }, []);

  const getCurrentLocation = () => {
    setIsGettingLocation(true);

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        form.setValue("location.lat", latitude);
        form.setValue("location.lng", longitude);
        toast.success("Location captured successfully");
        setIsGettingLocation(false);
      },
      (error) => {
        toast.error("Unable to get your location: " + error.message);
        setIsGettingLocation(false);
      },
    );
  };

  const onSubmit = async (data) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error("You must be logged in to report an incident.");
      return;
    }
    setIsSubmitting(true);
    let imageUrl = null;
    try {
      if (data.image) {
        imageUrl = await uploadToImageKit(data.image);
        console.log("Image uploaded:", imageUrl);
      }
      const aiResponse = await fetch(
        "http://localhost:3000/api/openrouteAnalyzer",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            incidentType: data.incidentType,
            description: data.description,
          }),
        },
      );
      const aiResult = await aiResponse.json();
      console.log("AI Analysis Result:", aiResult.aiConfidence);
      await IncidentReporting({
        incidentType: data.incidentType,
        description: data.description,
        location: {
          lat: data.location.lat,
          lng: data.location.lng,
        },
        file: imageUrl,
        user: {
          uid: currentUser.uid,
          email: currentUser.email,
        },
        aiConfidence: aiResult.aiConfidence,
      });
      toast.success("Incident reported successfully!");
      form.reset({
        incidentType: "",
        location: { lat: 0, lng: 0 },
        description: "",
        timestamp: new Date().toISOString().slice(0, 16),
        image: null,
      });
      setIsCameraActive(false);
    } catch (error) {
      toast.error("Failed to report incident: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-0 ml-0">
      <CardHeader className="pb-0 pt-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5" />
          Incident Report Form
        </CardTitle>
        <CardDescription>
          Report an incident with detailed information and evidence
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Incident Category */}
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
                          <SelectValue placeholder="Select incident type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {incidentCategories.map((category) => (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
                            <span className="flex items-center gap-2">
                              {category.label}
                              <span>{category.icon}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date & Time */}
              <FormField
                control={form.control}
                name="timestamp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Date & Time of Incident *
                    </FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormDescription>
                      Auto-filled with current time but editable
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <FormLabel className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Incident Location *
              </FormLabel>
              <div className="flex gap-2">
                <FormField
                  control={form.control}
                  name="location.lat"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="Latitude"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location.lng"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="Longitude"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="whitespace-nowrap"
                >
                  {isGettingLocation ? "Getting..." : "Use My Location"}
                </Button>
              </div>
              <FormDescription>
                Coordinates will be auto-filled via browser geolocation
              </FormDescription>
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incident Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a clear and detailed explanation of what happened..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Min: 10 characters, Max: 500 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload */}
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Evidence
                  </FormLabel>
                  <FormControl>
                    <CameraCapture
                      value={field.value}
                      setImage={(img) => field.onChange(img)}
                      setIsCameraActive={setIsCameraActive}
                    />
                  </FormControl>
                  <FormDescription>
                    Accept: .jpg, .jpeg, .png (Max size: 5MB)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="min-w-[120px]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Submitting...
                  </span>
                ) : (
                  "Submit Report"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
