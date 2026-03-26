import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
    TextField,
    FormControl,
    InputLabel,
    Select as MuiSelect,
    MenuItem,
} from "@mui/material";
import {
    Camera,
    X,
    Plus,
    Trash2,
    User,
    Truck,
    Upload,
    FileText,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ticketManagementAPI } from "@/services/ticketManagementAPI";
import { useSelector } from "react-redux";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export const AddVisitorPage = () => {
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [selectedCamera, setSelectedCamera] = useState<string | undefined>(
        undefined
    );
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);

    // API Data State
    const [personToMeet, setPersonToMeet] = useState<Array<{ id: number; name: string }>>([]);
    const [gates, setGates] = useState<Array<{ id: number; name: string }>>([]);
    const [visitPurposes, setVisitPurposes] = useState<Array<{ purpose: string }>>([]);
    const [supportCategories, setSupportCategories] = useState<Array<{ id: number; name: string }>>([]);
    const [loadingDropdownData, setLoadingDropdownData] = useState(false);

    const selectedSite = useSelector((state: any) => state.site.selectedSite);

    const fieldStyles = {
        height: "45px",
        backgroundColor: "#fff",
        borderRadius: "4px",
        "& .MuiOutlinedInput-root": {
            height: "45px",
            "& fieldset": { borderColor: "#ddd" },
            "&:hover fieldset": { borderColor: "#4d494aff" },
            "&.Mui-focused fieldset": { borderColor: "#C72030" },
        },
        "& .MuiInputLabel-root": {
            "&.Mui-focused": { color: "#201f20ff" },
            "& .MuiInputLabel-asterisk": {
                color: "#C72030 !important",
            },
        },
        "& .MuiFormLabel-asterisk": {
            color: "#C72030 !important",
        },
    };

    const [formData, setFormData] = useState({
        visitorType: "Guest",
        supportCategory: undefined,
        flatNumber: undefined,
        visitorName: "",
        additionalVisitor: "",
        mobileNumber: "",
        vehicleNumber: "",
        notes: "",
        parkingSlot: undefined,
        societyGate: undefined,
        visitPurpose: undefined,
        skipHostApproval: false,
        goodsInGatepass: false,
        requestSupervisorApproval: false,
        visitor_documents: [] as File[],
    });

    const [item, setItem] = useState({ description: "", quantity: 1 });

    const [showCameraModal, setShowCameraModal] = useState(false);
    const [isPhotoSaved, setIsPhotoSaved] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVideoReady, setIsVideoReady] = useState(false);

    useEffect(() => {
        getCameraDevices();
        fetchVisitorPageData();
        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    const getCameraDevices = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(
                (device) => device.kind === "videoinput"
            );
            setCameras(videoDevices);
            if (videoDevices.length > 0) {
                setSelectedCamera(videoDevices[0].deviceId);
            }
        } catch (error) {
            console.error("Error getting camera devices:", error);
        }
    };

    const fetchVisitorPageData = async () => {
        setLoadingDropdownData(true);
        try {
            const response = await axios.get(`https://${localStorage.getItem("baseUrl")}/crm/admin/visitors/new.json`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            const data = response.data.data;

            if (data.persons_to_meet) {
                setPersonToMeet(data.persons_to_meet);
            }

            if (data.gates) {
                setGates(data.gates);
            }

            if (data.visit_purposes) {
                setVisitPurposes(data.visit_purposes);
            }

            if (data.support_staff_categories) {
                setSupportCategories(data.support_staff_categories);
            }

            toast.success("Visitor data loaded successfully!");
        } catch (error) {
            console.error("Error fetching visitor page data:", error);
            toast.error("Failed to load visitor data. Please try again.");
        } finally {
            setLoadingDropdownData(false);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const initializeCamera = async () => {
        try {
            // Request camera permissions and get device list
            await navigator.mediaDevices.getUserMedia({ video: true });

            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(
                (device) => device.kind === "videoinput"
            );
            setCameras(videoDevices);

            if (videoDevices.length > 0) {
                const defaultCamera = videoDevices[0].deviceId;
                setSelectedCamera(defaultCamera);
                await startCamera(defaultCamera);
            } else {
                toast.error(
                    "No camera devices found. Please connect a camera and try again."
                );
            }
        } catch (error) {
            console.error("Error accessing camera:", error);
            toast.error(
                "Camera permission denied or no camera available. Please allow camera access and try again."
            );
        }
    };

    const handleCameraClick = () => {
        setIsVideoReady(false);
        setCapturedPhoto(null);
        setShowCameraModal(true);
        initializeCamera();
    };

    const startCamera = async (deviceId: string) => {
        try {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }

            const constraints = {
                video: deviceId ? { deviceId: { exact: deviceId } } : true,
                audio: false,
            };

            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(newStream);

            if (videoRef.current) {
                videoRef.current.srcObject = newStream;

                // Wait for video to load metadata
                videoRef.current.onloadedmetadata = () => {
                    setIsVideoReady(true);
                    if (videoRef.current) {
                        videoRef.current.play().catch(console.error);
                    }
                };
            }
        } catch (error) {
            console.error("Error starting camera:", error);
            toast.error(
                "Failed to access camera. Please check permissions and try again."
            );
        }
    };

    const handleCapturePhoto = () => {
        if (videoRef.current && canvasRef.current && stream) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");

            if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = canvas.toDataURL("image/jpeg", 0.8);

                setCapturedPhoto(imageData);
                setIsPhotoSaved(true);

                // Stop the camera stream
                stream.getTracks().forEach((track) => track.stop());
                setStream(null);
                setShowCameraModal(false);

                toast.success("Photo captured successfully!");
            } else {
                console.error('❌ Failed to capture - invalid video dimensions');
                toast.error("Failed to capture photo. Please try again.");
            }
        } else {
            console.error('❌ Failed to capture - missing refs or stream');
            toast.error("Camera not ready. Please try again.");
        }
    };

    const handleSavePhoto = () => {
        // Photo is already saved after capture
        setShowCameraModal(false);
    };

    const handleRetakePhoto = () => {
        setCapturedPhoto(null);
        setIsPhotoSaved(false);
        setShowCameraModal(true);
        initializeCamera();
    };

    const handleCameraChange = (deviceId: string) => {
        setSelectedCamera(deviceId);
        setIsVideoReady(false);
        startCamera(deviceId);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            const validFiles: File[] = [];
            const invalidFiles: string[] = [];

            Array.from(files).forEach((file) => {
                if (file.size > 5 * 1024 * 1024) {
                    invalidFiles.push(`${file.name} - File too large (max 5MB)`);
                    return;
                }

                const allowedTypes = [
                    "image/jpeg",
                    "image/jpg",
                    "image/png",
                    "image/gif",
                    "application/pdf",
                ];
                if (!allowedTypes.includes(file.type)) {
                    invalidFiles.push(
                        `${file.name} - Invalid file type (only images and PDFs allowed)`
                    );
                    return;
                }

                validFiles.push(file);
            });

            if (invalidFiles.length > 0) {
                invalidFiles.forEach((error) => toast.error(error));
            }

            if (validFiles.length > 0) {
                setFormData((prev) => ({
                    ...prev,
                    visitor_documents: [...prev.visitor_documents, ...validFiles],
                }));

                if (validFiles.length === 1) {
                    toast.success(`File "${validFiles[0].name}" added successfully`);
                } else {
                    toast.success(`${validFiles.length} files added successfully`);
                }
            }
        }

        event.target.value = "";
    };

    const removeUploadedFile = (indexToRemove?: number) => {
        setFormData((prev) => ({
            ...prev,
            visitor_documents:
                indexToRemove !== undefined
                    ? prev.visitor_documents.filter((_, index) => index !== indexToRemove)
                    : [],
        }));
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.flatNumber) {
            toast.error("Please select a flat/person to meet");
            return;
        }

        if (!formData.visitorName) {
            toast.error("Please enter visitor name");
            return;
        }

        if (!formData.mobileNumber || formData.mobileNumber.length !== 10) {
            toast.error("Please enter a valid 10-digit mobile number");
            return;
        }

        if (!formData.societyGate) {
            toast.error("Please select a society gate");
            return;
        }

        if (formData.visitorType === "support" && !formData.supportCategory) {
            toast.error("Please select a support staff category");
            return;
        }

        if (!formData.visitPurpose) {
            toast.error("Please select a visit purpose");
            return;
        }

        setIsSubmitting(true);

        try {
            const siteId = selectedSite?.id?.toString() || "";

            const convertToBase64 = (file: File): Promise<string> => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();

                    reader.readAsDataURL(file);

                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = (error) => reject(error);
                });
            };

            const mimoData = formData.goodsInGatepass
                ? {
                    mimo_type: "move_in",
                    item_number: item.quantity,
                    details: item.description,
                    need_approval: formData.requestSupervisorApproval,
                    documents: await Promise.all(
                        formData.visitor_documents.map((file) => convertToBase64(file))
                    ),
                }
                : {};

            const payload = {
                gatekeeper: {
                    image: capturedPhoto,
                    approve: 0,
                    guest_type: formData.visitorType,
                    support_staff_id: formData.supportCategory,
                    user_society_id: formData.flatNumber,
                    guest_name: formData.visitorName,
                    plus_person: formData.additionalVisitor,
                    guest_number: formData.mobileNumber,
                    guest_vehicle_number: formData.vehicleNumber,
                    notes: formData.notes,
                    visitor_parking_slot_id: formData.parkingSlot,
                    society_gate_id: formData.societyGate,
                    visit_purpose: formData.visitPurpose,
                    mimo: mimoData,
                },
                skip_approval: formData.skipHostApproval,
            }

            await axios.post(`https://${localStorage.getItem("baseUrl")}/crm/admin/new_visitor.json`, payload, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
            });

            toast.success("Visitor added successfully!");
            navigate("/smartsecure/visitor-history");
        } catch (error) {
            console.error("Error creating visitor:", error);
            toast.error("Failed to add visitor. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Add New Visitor</h1>
                    <p className="text-gray-600 mt-2">
                        Enter visitor details and complete the check-in process
                    </p>
                </div>

                {/* Camera Modal */}
                {showCameraModal && (
                    <div className="fixed top-20 left-8 z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-medium">Camera</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setShowCameraModal(false);
                                    if (stream) {
                                        stream.getTracks().forEach((track) => track.stop());
                                    }
                                }}
                                className="h-6 w-6 p-0 hover:bg-gray-100"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="relative mb-4 bg-gray-900 rounded-lg overflow-hidden">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-48 object-cover"
                            />
                            <div className="absolute top-2 right-2">
                                <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                                    📹 Preview
                                </span>
                            </div>
                        </div>

                        <div className="mb-4">
                            <FormControl fullWidth variant="outlined" sx={fieldStyles}>
                                <InputLabel shrink>Select Camera</InputLabel>
                                <MuiSelect
                                    value={selectedCamera || ""}
                                    onChange={(e) => handleCameraChange(e.target.value)}
                                    label="Select Camera"
                                    notched
                                    displayEmpty
                                >
                                    <MenuItem value="">Select Camera</MenuItem>
                                    {cameras
                                        .filter(
                                            (camera) =>
                                                camera.deviceId && camera.deviceId.trim() !== ""
                                        )
                                        .map((camera) => (
                                            <MenuItem key={camera.deviceId} value={camera.deviceId}>
                                                {camera.label ||
                                                    `USB2.0 HD UVC WebCam (${camera.deviceId.slice(
                                                        0,
                                                        4
                                                    )}:...)`}
                                            </MenuItem>
                                        ))}
                                </MuiSelect>
                            </FormControl>
                        </div>

                        <div className="space-y-2">
                            <Button
                                onClick={handleCapturePhoto}
                                className="w-full bg-pink-200 hover:bg-pink-300 text-gray-800 rounded-full"
                                disabled={!stream || !isVideoReady}
                            >
                                {!isVideoReady ? "Loading Camera..." : "Capture Photo"}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowCameraModal(false);
                                    if (stream) {
                                        stream.getTracks().forEach((track) => track.stop());
                                        setStream(null);
                                    }
                                }}
                                className="w-full rounded-full"
                            >
                                Close
                            </Button>
                        </div>

                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                )}

                {/* Main Form */}
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    {/* Photo Section */}
                    <div className="overflow-hidden">
                        <div className="text-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Capture Image
                            </h3>
                        </div>
                        <div className="flex justify-center mb-6">
                            {!capturedPhoto ? (
                                <button
                                    type="button"
                                    onClick={handleCameraClick}
                                    className="w-32 h-24 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors"
                                >
                                    <Camera className="h-8 w-8 text-gray-600" />
                                </button>
                            ) : (
                                <div className="text-center">
                                    <div className="w-32 h-24 bg-black rounded-lg mb-2 overflow-hidden relative group cursor-pointer">
                                        <img
                                            src={capturedPhoto}
                                            alt="Captured"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    {!isPhotoSaved ? (
                                        <div className="flex gap-2 justify-center">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleRetakePhoto}
                                                className="h-8 px-3 text-xs"
                                            >
                                                Retake
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={handleSavePhoto}
                                                className="h-8 px-3 text-xs bg-red-600 hover:bg-red-700 text-white"
                                            >
                                                Save
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="link"
                                            onClick={handleRetakePhoto}
                                            className="text-xs text-gray-600"
                                        >
                                            Change Photo
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Visitor Details Section */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-6 py-3 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900 flex items-center">
                                <span
                                    className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                                    style={{ backgroundColor: "#E5E0D3" }}
                                >
                                    <User size={16} color="#C72030" />
                                </span>
                                Visitor Details
                            </h2>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Visitor Type */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">
                                    Visitor Type <span className="text-red-500">*</span>
                                </label>
                                <RadioGroup
                                    value={formData.visitorType}
                                    onValueChange={(v) => handleInputChange("visitorType", v)}
                                    className="flex gap-6"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Guest" id="guest" />
                                        <label htmlFor="guest" className="cursor-pointer">
                                            Guest
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Support Staff" id="support" />
                                        <label htmlFor="support" className="cursor-pointer">
                                            Support Staff
                                        </label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Support Category - Show only for Support Staff */}
                            {formData.visitorType === "Support Staff" && (
                                <FormControl
                                    fullWidth
                                    variant="outlined"
                                    required
                                    sx={fieldStyles}
                                >
                                    <InputLabel shrink>Support Staff Category</InputLabel>
                                    <MuiSelect
                                        value={formData.supportCategory || ""}
                                        onChange={(e) =>
                                            handleInputChange("supportCategory", e.target.value)
                                        }
                                        label="Support Staff Category"
                                        notched
                                        disabled={loadingDropdownData}
                                        displayEmpty
                                    >
                                        <MenuItem value="">
                                            {loadingDropdownData ? "Loading..." : "Select Support Staff Category"}
                                        </MenuItem>
                                        {supportCategories.map((c) => (
                                            <MenuItem key={c.id} value={c.id.toString()}>
                                                {c.name}
                                            </MenuItem>
                                        ))}
                                    </MuiSelect>
                                </FormControl>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Flat Number */}
                                <FormControl
                                    fullWidth
                                    variant="outlined"
                                    required
                                    sx={fieldStyles}
                                >
                                    <InputLabel shrink>Flat Number</InputLabel>
                                    <MuiSelect
                                        value={formData.flatNumber || ""}
                                        onChange={(e) =>
                                            handleInputChange("flatNumber", e.target.value)
                                        }
                                        label="Flat Number"
                                        notched
                                        disabled={loadingDropdownData}
                                        displayEmpty
                                    >
                                        <MenuItem value="">
                                            {loadingDropdownData ? "Loading..." : "Select Person to Meet"}
                                        </MenuItem>
                                        {personToMeet.map((person) => (
                                            <MenuItem key={person.id} value={person.id}>
                                                {person.name}
                                            </MenuItem>
                                        ))}
                                    </MuiSelect>
                                </FormControl>

                                {/* Visitor Name */}
                                <TextField
                                    label="Visitor Name"
                                    placeholder="Visitor Name"
                                    value={formData.visitorName}
                                    onChange={(e) =>
                                        handleInputChange("visitorName", e.target.value)
                                    }
                                    fullWidth
                                    required
                                    variant="outlined"
                                    InputLabelProps={{ shrink: true }}
                                    sx={fieldStyles}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Additional Visitor */}
                                <TextField
                                    label="Additional Visitor"
                                    placeholder="Additional visitor"
                                    value={formData.additionalVisitor}
                                    onChange={(e) =>
                                        handleInputChange("additionalVisitor", e.target.value)
                                    }
                                    fullWidth
                                    variant="outlined"
                                    InputLabelProps={{ shrink: true }}
                                    sx={fieldStyles}
                                />

                                {/* Mobile Number */}
                                <TextField
                                    label="Mobile Number"
                                    placeholder="Mobile Number"
                                    value={formData.mobileNumber}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, "");
                                        if (value.length <= 10) {
                                            handleInputChange("mobileNumber", value);
                                        }
                                    }}
                                    fullWidth
                                    required
                                    variant="outlined"
                                    InputLabelProps={{ shrink: true }}
                                    sx={fieldStyles}
                                    inputProps={{
                                        inputMode: "numeric",
                                        pattern: "[0-9]{10}",
                                        maxLength: 10,
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Vehicle Number */}
                                <TextField
                                    label="Vehicle Number"
                                    placeholder="Vehicle Number"
                                    value={formData.vehicleNumber}
                                    onChange={(e) =>
                                        handleInputChange("vehicleNumber", e.target.value)
                                    }
                                    fullWidth
                                    variant="outlined"
                                    InputLabelProps={{ shrink: true }}
                                    sx={fieldStyles}
                                />

                                {/* Notes */}
                                <TextField
                                    label="Notes (Optional)"
                                    placeholder="Notes"
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange("notes", e.target.value)}
                                    fullWidth
                                    variant="outlined"
                                    InputLabelProps={{ shrink: true }}
                                    sx={fieldStyles}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Parking Slot */}
                                <FormControl
                                    fullWidth
                                    variant="outlined"
                                    sx={fieldStyles}
                                >
                                    <InputLabel shrink>Parking Slot</InputLabel>
                                    <MuiSelect
                                        value={formData.parkingSlot || ""}
                                        onChange={(e) =>
                                            handleInputChange("parkingSlot", e.target.value)
                                        }
                                        label="Parking Slot"
                                        notched
                                        disabled={!formData.vehicleNumber || formData.vehicleNumber.trim() === ""}
                                        displayEmpty
                                    >
                                        <MenuItem value="">Select Parking Slot</MenuItem>
                                        {[].map((slot) => (
                                            <MenuItem key={slot.id} value={slot.id}>
                                                {slot.name}
                                            </MenuItem>
                                        ))}
                                    </MuiSelect>
                                </FormControl>

                                {/* Society Gate */}
                                <FormControl
                                    fullWidth
                                    variant="outlined"
                                    required
                                    sx={fieldStyles}
                                >
                                    <InputLabel shrink>Society Gate</InputLabel>
                                    <MuiSelect
                                        value={formData.societyGate || ""}
                                        onChange={(e) =>
                                            handleInputChange("societyGate", e.target.value)
                                        }
                                        label="Society Gate"
                                        notched
                                        disabled={loadingDropdownData}
                                        displayEmpty
                                    >
                                        <MenuItem value="">
                                            {loadingDropdownData ? "Loading..." : "Select Gate"}
                                        </MenuItem>
                                        {gates.map((gate) => (
                                            <MenuItem key={gate.id} value={gate.id}>
                                                {gate.name}
                                            </MenuItem>
                                        ))}
                                    </MuiSelect>
                                </FormControl>
                            </div>

                            {/* Visit Purpose */}
                            <FormControl
                                fullWidth
                                variant="outlined"
                                required
                                sx={fieldStyles}
                            >
                                <InputLabel shrink>Visit Purpose</InputLabel>
                                <MuiSelect
                                    value={formData.visitPurpose || ""}
                                    onChange={(e) =>
                                        handleInputChange("visitPurpose", e.target.value)
                                    }
                                    label="Visit Purpose"
                                    notched
                                    disabled={loadingDropdownData}
                                    displayEmpty
                                >
                                    <MenuItem value="">
                                        {loadingDropdownData ? "Loading..." : "Select Visit Purpose"}
                                    </MenuItem>
                                    {visitPurposes.map((purpose, index) => (
                                        <MenuItem key={index} value={purpose.purpose}>
                                            {purpose.purpose}
                                        </MenuItem>
                                    ))}
                                </MuiSelect>
                            </FormControl>

                            {/* Checkboxes */}
                            <div className="space-y-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="skipHostApproval"
                                        checked={formData.skipHostApproval}
                                        onCheckedChange={(c) =>
                                            handleInputChange("skipHostApproval", c as boolean)
                                        }
                                    />
                                    <label
                                        htmlFor="skipHostApproval"
                                        className="text-sm font-medium cursor-pointer"
                                    >
                                        Skip Host Approval
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="goodsInGatepass"
                                        checked={formData.goodsInGatepass}
                                        onCheckedChange={(c) =>
                                            handleInputChange("goodsInGatepass", c as boolean)
                                        }
                                    />
                                    <label
                                        htmlFor="goodsInGatepass"
                                        className="text-sm font-medium cursor-pointer"
                                    >
                                        Goods In Gatepass
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Description Section */}
                    {formData.goodsInGatepass && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-3">
                                    <span
                                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                                        style={{ backgroundColor: "#E5E0D3" }}
                                    >
                                        <Truck size={18} color="#C72030" />
                                    </span>
                                    Items Description
                                </h2>
                            </div>
                            <div className="p-6 space-y-5">
                                {/* Single Item Row */}
                                <div className="space-y-3">
                                    <div className="flex gap-4 items-stretch">
                                        <div className="flex-1">
                                            <TextField
                                                placeholder="Item description"
                                                value={item?.description || ""}
                                                onChange={(e) =>
                                                    setItem({
                                                        ...item,
                                                        description: e.target.value
                                                    })
                                                }
                                                fullWidth
                                                multiline
                                                rows={3}
                                                variant="outlined"
                                                InputLabelProps={{ shrink: true }}
                                                sx={{
                                                    ...fieldStyles,
                                                    height: "auto",
                                                    "& .MuiOutlinedInput-root": {
                                                        ...fieldStyles["& .MuiOutlinedInput-root"],
                                                        height: "auto",
                                                        minHeight: "120px",
                                                    },
                                                    "& .MuiOutlinedInput-input": {
                                                        resize: "vertical",
                                                    },
                                                }}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2 items-center">
                                            <div className="w-24">
                                                <TextField
                                                    type="number"
                                                    placeholder="Qty"
                                                    value={item?.quantity || 1}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        if (val > 0) {
                                                            setItem({
                                                                ...item,
                                                                quantity: val
                                                            });
                                                        }
                                                    }}
                                                    fullWidth
                                                    variant="outlined"
                                                    InputLabelProps={{ shrink: true }}
                                                    inputProps={{
                                                        min: 1,
                                                        style: { textAlign: "center", fontSize: "16px", fontWeight: "500" }
                                                    }}
                                                    sx={{
                                                        ...fieldStyles,
                                                        "& input": { textAlign: "center" },
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-200">
                                    <label className="text-sm font-bold text-gray-900 mb-4 block">
                                        Browse Items/Documents
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            id="items-upload"
                                            multiple
                                        />
                                        <label
                                            htmlFor="items-upload"
                                            className="flex items-center justify-center w-full h-14 border-2 border-red-600 rounded-lg cursor-pointer hover:bg-red-50 hover:border-red-700 transition-all duration-200 group"
                                        >
                                            <span className="text-red-600 font-semibold flex items-center gap-2.5 group-hover:text-red-700">
                                                <Upload className="h-5 w-5" />
                                                Browse
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {formData.visitor_documents.length > 0 && (
                                    <div className="space-y-2.5 max-h-52 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-4">
                                        {formData.visitor_documents.map((file, index) => {
                                            const isImage = file.type.startsWith("image/");
                                            const isPDF = file.type === "application/pdf";
                                            const fileURL = URL.createObjectURL(file);

                                            return (
                                                <div
                                                    key={`${file.name}-${index}`}
                                                    className="flex items-center justify-between bg-white p-3.5 rounded-lg border border-gray-150 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                                                >
                                                    <div className="flex items-center flex-1 min-w-0 gap-3.5">
                                                        <div className="flex-shrink-0">
                                                            {isImage ? (
                                                                <img
                                                                    src={fileURL}
                                                                    alt={file.name}
                                                                    className="h-12 w-12 object-cover rounded-lg border border-gray-200 shadow-sm"
                                                                />
                                                            ) : isPDF ? (
                                                                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center border border-red-150 shadow-sm">
                                                                    <FileText className="h-6 w-6 text-red-600" />
                                                                </div>
                                                            ) : (
                                                                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center border border-blue-150 shadow-sm">
                                                                    <FileText className="h-6 w-6 text-blue-600" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-col min-w-0 flex-1">
                                                            <span
                                                                className="text-sm font-semibold text-gray-900 truncate leading-snug"
                                                                title={file.name}
                                                            >
                                                                {file.name}
                                                            </span>
                                                            {/* <span className="text-xs text-gray-500 font-medium">
                                                                {(
                                                                    file.size /
                                                                    1024 /
                                                                    1024
                                                                ).toFixed(2)}{" "}
                                                                MB
                                                            </span> */}
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            URL.revokeObjectURL(fileURL);
                                                            removeUploadedFile(index);
                                                        }}
                                                        className="ml-3 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 border border-transparent hover:border-red-200 flex-shrink-0"
                                                        title="Remove file"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="requestSupervisorApproval"
                                        checked={formData.requestSupervisorApproval}
                                        onCheckedChange={(c) =>
                                            handleInputChange("requestSupervisorApproval", c as boolean)
                                        }
                                    />
                                    <label
                                        htmlFor="requestSupervisorApproval"
                                        className="text-sm font-medium cursor-pointer"
                                    >
                                        Request for Supervisor Approval
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex gap-4 pt-6">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 rounded-lg font-medium text-lg"
                        >
                            {isSubmitting ? "Submitting..." : "Submit"}
                        </Button>
                        <Button
                            type="button"
                            onClick={() => navigate(-1)}
                            variant="outline"
                            className="flex-1 py-6 rounded-lg font-medium text-lg"
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddVisitorPage;
