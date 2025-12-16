import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function CameraCapture({ value, setImage, setIsCameraActive }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Start camera: just set cameraActive, stream will be set in useEffect
  const startCamera = async () => {
    if (stream) return;
    if (setIsCameraActive) setIsCameraActive(true);
    setCameraActive(true);
  };

  // When cameraActive is true and videoRef is ready, get stream and assign srcObject
  useEffect(() => {
    if (!cameraActive || stream) return;
    let active = true;
    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 320 },
          height: { ideal: 240 },
        },
      })
      .then((mediaStream) => {
        if (active && videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
        }
      })
      .catch((err) => {
        alert("Could not access camera: " + err.message);
        setCameraActive(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line
  }, [cameraActive]);
  useEffect(() => {
    if (value === null) {
      setPhoto(null);
    }
  }, [value]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      if (setIsCameraActive) setIsCameraActive(false);
      setStream(null);
    }
    setCameraActive(false);
    if (setIsCameraActive) setIsCameraActive(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = 320;
    const height = 240;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, width, height);
    const image = canvas.toDataURL("image/jpeg");
    setPhoto(image);
    if (setImage) setImage(image);
    stopCamera();
  };

  const retakePhoto = () => {
    setPhoto(null);
    if (setImage) setImage(null);
    if (setIsCameraActive) setIsCameraActive(true);
    setCameraActive(true);
  };

  return (
    <div className="space-y-4 text-center">
      {!photo ? (
        <>
          {cameraActive ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                width={320}
                height={240}
                className="rounded-xl mx-auto"
                style={{ maxWidth: 320, maxHeight: 240 }}
              />
              <Button
                type="button"
                onClick={capturePhoto}
                className="w-full mt-2"
              >
                Capture Photo 📸
              </Button>
            </>
          ) : (
            <Button type="button" onClick={startCamera} className="w-full">
              Open Camera
            </Button>
          )}
        </>
      ) : (
        <>
          <img
            src={photo}
            className="w-full rounded-xl"
            style={{ maxWidth: 320, maxHeight: 240, margin: "0 auto" }}
          />
          <Button
            variant="outline"
            onClick={retakePhoto}
            className="w-full mt-2"
            type="button"
          >
            Retake Photo
          </Button>
        </>
      )}
      <canvas ref={canvasRef} hidden />
    </div>
  );
}
