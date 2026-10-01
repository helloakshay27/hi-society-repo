import React, { useEffect, useRef, useState } from "react";
import baseClient from "@/utils/withoutTokenBase";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, RotateCcw, CheckCircle2, DoorOpen } from "lucide-react";

const DEFAULT_VISIT_PURPOSES = [
  // "Personal",
  // "Business",
  // "Delivery",
  // "Interview",
  // "Other",
  "Meeting",
  "Guest",
];

interface InvitedVisitorFormProps {
  visitorPageId?: string;
}

export const InvitedVisitorForm: React.FC<InvitedVisitorFormProps> = ({
  visitorPageId,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const [visitPurposes, setVisitPurposes] = useState<string[]>(
    DEFAULT_VISIT_PURPOSES
  );

  const now = new Date();
  const defaultDate = now.toISOString().slice(0, 10);
  const defaultTime = now.toTimeString().slice(0, 5);

  const [formData, setFormData] = useState({
    mobileNumber: "",
    name: "",
    expectedDate: defaultDate,
    expectedTime: defaultTime,
    visitingPurpose: "Meeting",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [resolvedSocietyId, setResolvedSocietyId] = useState<string | null>(
    null
  );
  const [societyName, setSocietyName] = useState<string | null>(null);
  const [hostName, setHostName] = useState<string | null>(null);
  const [flatLabel, setFlatLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!visitorPageId) return;

    const fetchDecryptedUserSociety = async () => {
      try {
        const response = await baseClient.get(
          `crm/admin/user_societies/decrypted_user_society/${visitorPageId}`
        );
        const result = response.data?.result;
        if (result?.user_society_id !== undefined && result?.user_society_id !== null) {
          setResolvedSocietyId(String(result.user_society_id));
        }
        if (result?.society_building_name) {
          setSocietyName(result.society_building_name);
        }
        const name = [result?.firstname, result?.lastname]
          .filter(Boolean)
          .join(" ")
          .trim();
        if (name) {
          setHostName(name);
        }
        if (result?.block_no && result?.flat_no) {
          setFlatLabel(`${result.block_no}-${result.flat_no}`);
        } else if (result?.flat_no) {
          setFlatLabel(String(result.flat_no));
        }
      } catch (error) {
        console.error("Failed to resolve invited visitor society:", error);
      }
    };

    fetchDecryptedUserSociety();
  }, [visitorPageId]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await baseClient.get(
          "crm/admin/visitors/new.json",
          visitorPageId ? { params: { id: visitorPageId } } : undefined
        );
        const data = response.data?.data;
        if (data?.visit_purposes?.length) {
          setVisitPurposes(
            data.visit_purposes.map(
              (p: { purpose: string } | string) =>
                typeof p === "string" ? p : p.purpose
            )
          );
        }
      } catch (error) {
        console.error("Failed to load invited visitor options:", error);
      }
    };

    fetchOptions();
  }, [visitorPageId]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const stopCameraStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsVideoReady(false);
  };

  const openCamera = async () => {
    setShowCameraDialog(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsVideoReady(true);
          videoRef.current?.play().catch(() => undefined);
        };
      }
    } catch (error) {
      console.error("Failed to access camera:", error);
      toast.error("Unable to access camera. Please allow camera permission.");
      setShowCameraDialog(false);
    }
  };

  const closeCameraDialog = () => {
    stopCameraStream();
    setShowCameraDialog(false);
  };

  const handleCapturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedPhoto(canvas.toDataURL("image/jpeg", 0.8));

    stopCameraStream();
    setShowCameraDialog(false);
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    openCamera();
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const dataUrlToBlob = (dataUrl: string): Blob => {
    const [meta, base64] = dataUrl.split(",");
    const mime = meta.match(/:(.*?);/)?.[1] || "image/jpeg";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  };

  const validate = (): boolean => {
    if (!capturedPhoto) {
      toast.error("Please capture your photo to continue.");
      return false;
    }
    if (!formData.mobileNumber || formData.mobileNumber.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return false;
    }
    if (!formData.name.trim()) {
      toast.error("Please enter your name.");
      return false;
    }
    if (!formData.expectedDate) {
      toast.error("Please select the expected date.");
      return false;
    }
    if (!formData.expectedTime) {
      toast.error("Please select the expected time.");
      return false;
    }
    if (!formData.visitingPurpose) {
      toast.error("Please select the purpose of your visit.");
      return false;
    }
    if (formData.expectedDate < defaultDate) {
      toast.error("Expected date cannot be in the past.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate() || !capturedPhoto) return;

    setIsSubmitting(true);
    try {
      const form = new FormData();
      form.append(
        "gatekeeper[user_society_id]",
        resolvedSocietyId || visitorPageId || ""
      );
      form.append("gatekeeper[guest_name]", formData.name);
      form.append("gatekeeper[guest_number]", formData.mobileNumber);
      form.append(
        "gatekeeper[expected_at]",
        `${formData.expectedDate} ${formData.expectedTime}`
      );
      form.append("gatekeeper[visit_purpose]", formData.visitingPurpose);
      form.append(
        "gatekeeper[image]",
        dataUrlToBlob(capturedPhoto),
        "visitor-photo.jpg"
      );

      await baseClient.post("register_expected_visitor", form);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Failed to submit invited visitor details:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center px-system-md py-system-lg">
        <div className="bg-brand-card rounded-lg shadow-brand-card w-full max-w-md p-system-xl text-center">
          <CheckCircle2 className="h-14 w-14 text-brand-green mx-auto mb-system-md" />
          <h1 className="text-brand-h2 font-semibold text-brand-text mb-system-sm">
            Thank you!
          </h1>
          <p className="text-brand-body-4 text-brand-text-light">
            Registration successful, your digital gate pass has been sent by
            SMS.
          </p>
          <p className="text-brand-body-4 text-brand-text-light mt-2">
            Please scan the QR code at the gate to enter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-system-md py-system-lg">
      <div className="bg-brand-card rounded-lg shadow-brand-card w-full max-w-md p-system-lg">
        {/* Welcome header */}
        <div className="flex flex-col items-center text-center mb-system-lg">
          <div className="h-12 w-12 rounded-full bg-brand-light flex items-center justify-center mb-system-sm">
            <DoorOpen className="h-6 w-6 text-brand" />
          </div>
          <h1 className="text-brand-h2 font-semibold text-brand-text">
            {societyName ? `Welcome to ${societyName}` : "Welcome!"}
          </h1>
          <p className="text-brand-body-4 text-brand-text-light mt-1">
            {hostName && flatLabel ? (
              <>
                You are visiting <strong className="font-semibold text-brand-text">{hostName}</strong>{" "}
                at flat <strong className="font-semibold text-brand-text">{flatLabel}</strong>. Please
                enter your details to continue.
              </>
            ) : (
              "Please fill the below details to enter the society and meet your host."
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-system-md" noValidate>
          <div className="flex gap-system-md items-start">
            {/* Photo capture */}
            <div className="shrink-0">
              <label className="text-brand-body-5 text-brand-text-light block mb-1">
                Photo <span className="text-red-500">*</span>
              </label>
              {!capturedPhoto ? (
                <button
                  type="button"
                  onClick={openCamera}
                  className="w-28 h-28 rounded-md bg-brand-bg border border-dashed border-brand-card-border flex flex-col items-center justify-center gap-1 hover:bg-brand-selected transition-colors"
                >
                  <Camera className="h-6 w-6 text-brand-text-light" />
                  <span className="text-brand-body-5 text-brand-text-light">
                    Add Photo
                  </span>
                </button>
              ) : (
                <div className="relative w-28 h-28 rounded-md overflow-hidden">
                  <img
                    src={capturedPhoto}
                    alt="Captured visitor"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRetakePhoto}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 flex items-center justify-center"
                    aria-label="Retake photo"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
              )}
            </div>

            {/* Mobile + Name */}
            <div className="flex-1 space-y-system-sm">
              <div>
                <label className="text-brand-body-5 text-brand-text-light">
                  Mobile No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={formData.mobileNumber}
                  onChange={(e) =>
                    handleChange(
                      "mobileNumber",
                      e.target.value.replace(/\D/g, "").slice(0, 10)
                    )
                  }
                  placeholder="Enter Mobile Number"
                  className="w-full border-b border-brand-card-border bg-transparent py-1 text-brand-body-4 text-brand-text focus:outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="text-brand-body-5 text-brand-text-light">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Enter Name"
                  className="w-full border-b border-brand-card-border bg-transparent py-1 text-brand-body-4 text-brand-text focus:outline-none focus:border-brand"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-system-md">
            <div className="flex-1">
              <label className="text-brand-body-5 text-brand-text-light">
                Expected Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                min={defaultDate}
                value={formData.expectedDate}
                onChange={(e) => handleChange("expectedDate", e.target.value)}
                className="w-full border-b border-brand-card-border bg-transparent py-1 text-brand-body-4 text-brand-text focus:outline-none focus:border-brand"
              />
            </div>
            <div className="flex-1">
              <label className="text-brand-body-5 text-brand-text-light">
                Expected Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.expectedTime}
                onChange={(e) => handleChange("expectedTime", e.target.value)}
                className="w-full border-b border-brand-card-border bg-transparent py-1 text-brand-body-4 text-brand-text focus:outline-none focus:border-brand"
              />
            </div>
          </div>

          <div>
            <label className="text-brand-body-5 text-brand-text-light">
              Visiting Purpose <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.visitingPurpose}
              onValueChange={(value) =>
                handleChange("visitingPurpose", value)
              }
            >
              <SelectTrigger className="border-0 border-b border-brand-card-border rounded-none px-0 focus:ring-0">
                <SelectValue placeholder="Select Purpose" />
              </SelectTrigger>
              <SelectContent>
                {visitPurposes.map((purpose) => (
                  <SelectItem key={purpose} value={purpose}>
                    {purpose}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#da7756] hover:bg-[#da7756] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold tracking-wide py-3 rounded-md transition-colors"
          >
            {isSubmitting ? "SUBMITTING..." : "SUBMIT"}
          </button>
        </form>
      </div>

      {/* Camera capture dialog */}
      <Dialog
        open={showCameraDialog}
        onOpenChange={(open) => {
          if (!open) closeCameraDialog();
        }}
      >
        {/* invite-visitor-camera-dialog opts this dialog out of the
            site-wide "dialogs become a bottom sheet under 640px" rule
            (see src/index.css) so it stays centered on mobile. */}
        <DialogContent className="invite-visitor-camera-dialog max-w-sm max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Capture Photo</DialogTitle>
          </DialogHeader>
          <div className="relative bg-black rounded-md overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 object-cover"
            />
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-system-sm">
            <button
              type="button"
              onClick={handleCapturePhoto}
              disabled={!isVideoReady}
              className="flex-1 bg-brand hover:bg-brand-hover disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2 rounded-md transition-colors"
            >
              {isVideoReady ? "Capture Photo" : "Loading Camera..."}
            </button>
            <button
              type="button"
              onClick={closeCameraDialog}
              className="px-4 py-2 rounded-md border border-brand-card-border text-brand-text hover:bg-brand-selected transition-colors"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
