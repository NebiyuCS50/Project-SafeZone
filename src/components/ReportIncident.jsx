import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileInput } from "@/components/ui/file-input";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { MapPin, Camera, Clock, User, AlertCircle } from "lucide-react";

const ReportIncidentForm = () => {
  const [formData, setFormData] = useState({
    incidentType: "",
    location: { lat: "", lng: "" },
    description: "",
    image: null,
    timestamp: new Date().toISOString(),
    reporter: {
      userId: "",
      userEmail: "",
      userFullName: "",
    },
  });

  const [locationError, setLocationError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [imageSizeError, setImageSizeError] = useState("");

  useEffect(() => {
    // Auto-fill reporter information (simulated)
    setFormData((prev) => ({
      ...prev,
      reporter: {
        userId: "user123",
        userEmail: "user@example.com",
        userFullName: "John Doe",
      },
    }));
  }, []);

  useEffect(() => {
    // Auto-fill location using geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            location: {
              lat: position.coords.latitude.toString(),
              lng: position.coords.longitude.toString(),
            },
          }));
        },
        (error) => {
          setLocationError(
            "Unable to retrieve your location. Please enter manually."
          );
        }
      );
    }
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLocationChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value,
      },
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setImageSizeError("File size must be less than 5MB");
        return;
      }
      setImageSizeError("");
      setFormData((prev) => ({
        ...prev,
        image: file,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    let isValid = true;

    if (!formData.incidentType) {
      isValid = false;
    }

    if (!formData.location.lat || !formData.location.lng) {
      setLocationError("Location is required");
      isValid = false;
    }

    if (formData.description.length < 10 || formData.description.length > 500) {
      setDescriptionError("Description must be between 10 and 500 characters");
      isValid = false;
    }

    if (isValid) {
      console.log("Form submitted:", formData);
      // Handle form submission here
    }
  };

  const incidentTypes = [
    { value: "accident", label: "Accident" },
    { value: "traffic", label: "Traffic Issue" },
    { value: "crime", label: "Crime / Suspicious Activity" },
    { value: "fire", label: "Fire / Hazard" },
    { value: "medical", label: "Medical Emergency" },
    { value: "natural", label: "Natural Disaster" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="shadow-lg">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Report Incident
            </CardTitle>
            <CardDescription>
              Please provide detailed information about the incident you're
              reporting.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <CardContent className="space-y-6">
              {/* Incident Category */}
              <div className="space-y-2">
                <Label
                  htmlFor="incidentType"
                  className="text-sm font-medium text-gray-700"
                >
                  Incident Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.incidentType}
                  onValueChange={(value) =>
                    handleInputChange("incidentType", value)
                  }
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select incident type" />
                  </SelectTrigger>
                  <SelectContent>
                    {incidentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Incident Location */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Incident Location <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="latitude" className="text-xs text-gray-500">
                      Latitude
                    </Label>
                    <Input
                      id="latitude"
                      type="text"
                      value={formData.location.lat}
                      onChange={(e) =>
                        handleLocationChange("lat", e.target.value)
                      }
                      placeholder="Auto-filled"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor="longitude"
                      className="text-xs text-gray-500"
                    >
                      Longitude
                    </Label>
                    <Input
                      id="longitude"
                      type="text"
                      value={formData.location.lng}
                      onChange={(e) =>
                        handleLocationChange("lng", e.target.value)
                      }
                      placeholder="Auto-filled"
                      className="text-sm"
                    />
                  </div>
                </div>
                {locationError && (
                  <p className="text-red-500 text-xs mt-1">{locationError}</p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          setFormData((prev) => ({
                            ...prev,
                            location: {
                              lat: position.coords.latitude.toString(),
                              lng: position.coords.longitude.toString(),
                            },
                          }));
                          setLocationError("");
                        },
                        (error) => {
                          setLocationError(
                            "Unable to retrieve your location. Please enter manually."
                          );
                        }
                      );
                    }
                  }}
                >
                  Use My Location
                </Button>
              </div>

              {/* Incident Description */}
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-sm font-medium text-gray-700"
                >
                  Incident Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Provide a clear and detailed explanation of what happened..."
                  className="min-h-[120px] resize-none"
                  maxLength={500}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{formData.description.length} / 500 characters</span>
                </div>
                {descriptionError && (
                  <p className="text-red-500 text-xs mt-1">
                    {descriptionError}
                  </p>
                )}
              </div>

              {/* Upload Evidence */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Upload Evidence
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="space-y-2">
                      <Camera className="w-12 h-12 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        JPG, JPEG, PNG (Max 5MB)
                      </p>
                    </div>
                  </label>
                  {formData.image && (
                    <p className="text-sm text-green-600 mt-2">
                      {formData.image.name} uploaded
                    </p>
                  )}
                  {imageSizeError && (
                    <p className="text-red-500 text-xs mt-1">
                      {imageSizeError}
                    </p>
                  )}
                </div>
              </div>

              {/* Date & Time */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Date & Time of Incident{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <DateTimePicker
                  value={formData.timestamp}
                  onChange={(value) => handleInputChange("timestamp", value)}
                  className="w-full"
                />
              </div>

              {/* Reporter Information */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Reporter Information
                </Label>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">User ID:</span>
                    <span className="font-medium">
                      {formData.reporter.userId}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">
                      {formData.reporter.userEmail}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Full Name:</span>
                    <span className="font-medium">
                      {formData.reporter.userFullName}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Information auto-filled from your account
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t bg-gray-50 px-6 py-4">
              <Button type="button" variant="outline">
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Submit Report
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ReportIncidentForm;
