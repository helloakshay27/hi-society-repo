import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Camera, X } from 'lucide-react';
import { staffService, StaffFormData, ScheduleData, StaffAttachments, Unit, Department, WorkType } from '@/services/staffService';
import { toast } from 'sonner';
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem } from '@mui/material';
import { getUser } from '@/utils/auth';

// Field styles for Material-UI components
const fieldStyles = {
  height: '45px',
  backgroundColor: '#fff',
  borderRadius: '4px',
  '& .MuiOutlinedInput-root': {
    height: '45px',
    '& fieldset': {
      borderColor: '#ddd',
    },
    '&:hover fieldset': {
      borderColor: '#C72030',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#C72030',
    },
  },
  '& .MuiInputLabel-root': {
    '&.Mui-focused': {
      color: '#C72030',
    },
  },
};

export const AddStaffPage = () => {
  const navigate = useNavigate();
  
  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<string | undefined>(undefined);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isPhotoSaved, setIsPhotoSaved] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    mobile: '',
    unit: '',
    department: '',
    workType: '',
    staffId: '',
    vendorName: '',
    validFrom: '',
    validTill: '',
    status: ''
  });

  const [schedule, setSchedule] = useState({
    monday: { checked: false, startTime: '00', startMinute: '00', endTime: '00', endMinute: '00' },
    tuesday: { checked: false, startTime: '00', startMinute: '00', endTime: '00', endMinute: '00' },
    wednesday: { checked: false, startTime: '00', startMinute: '00', endTime: '00', endMinute: '00' },
    thursday: { checked: false, startTime: '00', startMinute: '00', endTime: '00', endMinute: '00' },
    friday: { checked: false, startTime: '00', startMinute: '00', endTime: '00', endMinute: '00' },
    saturday: { checked: false, startTime: '00', startMinute: '00', endTime: '00', endMinute: '00' },
    sunday: { checked: false, startTime: '00', startMinute: '00', endTime: '00', endMinute: '00' }
  });

  const [attachments, setAttachments] = useState<StaffAttachments>({});
  const [documents, setDocuments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingWorkTypes, setLoadingWorkTypes] = useState(true);

  // Camera functions
  useEffect(() => {
    getCameraDevices();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const getCameraDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');
      setCameras(videoDevices);
    } catch (error) {
      console.error('Error getting camera devices:', error);
    }
  };

  const initializeCamera = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');
      setCameras(videoDevices);

      if (videoDevices.length > 0) {
        const defaultCamera = videoDevices[0].deviceId;
        setSelectedCamera(defaultCamera);
        await startCamera(defaultCamera);
      } else {
        toast.error('No camera devices found. Please connect a camera and try again.');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Camera permission denied or no camera available. Please allow camera access and try again.');
    }
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
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play();
          }
        };
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      toast.error('Failed to access camera. Please check permissions and try again.');
    }
  };

  const handleCameraChange = (deviceId: string) => {
    setSelectedCamera(deviceId);
    startCamera(deviceId);
  };

  const handleCameraClick = () => {
    setShowCameraModal(true);
    initializeCamera();
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    setIsPhotoSaved(false);
    setShowCameraModal(true);
    initializeCamera();
  };

  const handleCaptureAndClose = () => {
    if (videoRef.current && canvasRef.current && stream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        setCapturedPhoto(imageData);
        setIsPhotoSaved(true);

        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
        setShowCameraModal(false);
        
        toast.success('Photo captured successfully!');
      } else {
        console.error('❌ Failed to capture - invalid video dimensions');
        toast.error('Failed to capture photo. Please try again.');
      }
    } else {
      console.error('❌ Failed to capture - missing refs or stream');
      toast.error('Camera not ready. Please try again.');
    }
  };

  const handleAllowThisTime = () => {
    if (videoRef.current && canvasRef.current && stream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        setCapturedPhoto(imageData);
        setIsPhotoSaved(true);

        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
        setShowCameraModal(false);
        
        toast.success('Photo captured successfully!');
      } else {
        console.error('❌ Failed to capture - invalid video dimensions');
        toast.error('Failed to capture photo. Please try again.');
      }
    } else {
      console.error('❌ Failed to capture - missing refs or stream');
      toast.error('Camera not ready. Please try again.');
    }
  };

  // Fetch units, departments, and work types on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [unitsData, departmentsData, workTypesData] = await Promise.all([
          staffService.getUnits(),
          staffService.getDepartments(),
          staffService.getWorkTypes()
        ]);
        setUnits(unitsData);
        setDepartments(departmentsData);
        setWorkTypes(workTypesData);
      } catch (error) {
        console.error('Failed to fetch dropdown data:', error);
      } finally {
        setLoadingUnits(false);
        setLoadingDepartments(false);
        setLoadingWorkTypes(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleScheduleChange = (day: string, field: string, value: string | boolean) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const handleFileChange = (field: keyof StaffAttachments, file: File | null) => {
    setAttachments(prev => ({
      ...prev,
      [field]: file || undefined
    }));
  };

  const handleDocumentsChange = (files: File[]) => {
    setDocuments(files);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.mobile) {
      toast.error('Please fill in all required fields (First Name, Last Name, Mobile)');
      return;
    }

    if (!formData.validFrom) {
      toast.error('Please select a valid from date');
      return;
    }

    // Get current user ID
    const currentUser = getUser();
    if (!currentUser || !currentUser.id) {
      toast.error('Unable to get current user information. Please try logging in again.');
      return;
    }

    // If validTill is not provided, calculate it from validFrom + 90 days
    let validTill = formData.validTill;
    if (!validTill && formData.validFrom) {
      const fromDate = new Date(formData.validFrom);
      fromDate.setDate(fromDate.getDate() + 90);
      validTill = fromDate.toISOString().split('T')[0];
    }

    setIsSubmitting(true);
    try {
      const staffDataWithCalculated = {
        ...formData,
        validTill,
        status: formData.status || 'active',
        userId: currentUser.id // Add current user ID
      };
      
      await staffService.createSocietyStaff(staffDataWithCalculated, schedule, {
        profilePicture: attachments.profilePicture,
        documents: documents
      });
      toast.success('Society staff created successfully!');
      navigate('/security/staff'); // Navigate back to staff dashboard
    } catch (error) {
      console.error('Failed to create staff:', error);
      // Error is already handled in the service with toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/security/staff'); // Go back to staff dashboard
  };

  const timeOptions = Array.from({ length: 24 }, (_, i) => 
    String(i).padStart(2, '0')
  );

  const minuteOptions = ['00', '15', '30', '45'];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed top-20 left-8 z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
          {/* Close Button */}
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Camera</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (stream) {
                  stream.getTracks().forEach((track) => track.stop());
                  setStream(null);
                }
                setShowCameraModal(false);
              }}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Camera permissions checkbox */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                defaultChecked
                aria-label="Remember camera permission decision"
              />
              <span>Remember this decision</span>
            </label>
          </div>

          {/* Camera Preview */}
          <div className="relative mb-4 bg-gray-900 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-48 object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Camera Selection Dropdown */}
          <div className="mb-4">
            <label htmlFor="camera-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Camera
            </label>
            <select
              id="camera-select"
              value={selectedCamera || ''}
              onChange={(e) => handleCameraChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C72030] focus:border-[#C72030]"
            >
              {cameras.map((camera) => (
                <option key={camera.deviceId} value={camera.deviceId}>
                  {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
                </option>
              ))}
            </select>
          </div>

          {/* Camera Control Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleAllowThisTime}
              className="w-full bg-[#C72030] hover:bg-[#C72030]/90 text-white"
            >
              Allow this time
            </Button>
            <Button
              onClick={handleCaptureAndClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Capture & Close
            </Button>
            <Button
              onClick={() => {
                if (stream) {
                  stream.getTracks().forEach((track) => track.stop());
                  setStream(null);
                }
                setShowCameraModal(false);
              }}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">NEW STAFF</h1>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
        {/* Section 1: Staff Details */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              Staff Details
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TextField
                label="First Name*"
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />
              
              <TextField
                label="Last Name*"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />
              
              <TextField
                label="Email"
                placeholder="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />
              
              <TextField
                label="Password"
                placeholder="Password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />
              
              <TextField
                label="Mobile*"
                placeholder="Mobile Number"
                value={formData.mobile}
                onChange={(e) => handleInputChange('mobile', e.target.value)}
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />
              
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ '&.Mui-focused': { color: '#C72030' } }}>
                  Unit
                </InputLabel>
                <MuiSelect
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  label="Unit"
                  displayEmpty
                  sx={fieldStyles}
                >
                  <MenuItem value="" disabled>
                    {loadingUnits ? "Loading units..." : "Select Unit"}
                  </MenuItem>
                  {units.map((unit) => (
                    <MenuItem key={unit.id} value={unit.unit_name}>
                      {unit.unit_name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
              
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ '&.Mui-focused': { color: '#C72030' } }}>
                  Department
                </InputLabel>
                <MuiSelect
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  label="Department"
                  displayEmpty
                  sx={fieldStyles}
                >
                  <MenuItem value="" disabled>
                    {loadingDepartments ? "Loading departments..." : "Select Department"}
                  </MenuItem>
                  {departments.map((department) => (
                    <MenuItem key={department.id} value={department.department_name}>
                      {department.department_name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
              
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ '&.Mui-focused': { color: '#C72030' } }}>
                  Work Type
                </InputLabel>
                <MuiSelect
                  value={formData.workType}
                  onChange={(e) => handleInputChange('workType', e.target.value)}
                  label="Work Type"
                  displayEmpty
                  sx={fieldStyles}
                >
                  <MenuItem value="" disabled>
                    {loadingWorkTypes ? "Loading work types..." : "Select Work Type"}
                  </MenuItem>
                  {workTypes.map((workType) => (
                    <MenuItem key={workType.id} value={workType.id.toString()}>
                      {workType.staff_type}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
              
              <TextField
                label="Staff ID"
                placeholder="Enter Staff ID"
                value={formData.staffId}
                onChange={(e) => handleInputChange('staffId', e.target.value)}
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />
              
              <TextField
                label="Vendor Name"
                placeholder="Vendor Name"
                value={formData.vendorName}
                onChange={(e) => handleInputChange('vendorName', e.target.value)}
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />
              
              <TextField
                label="Valid From*"
                type="date"
                value={formData.validFrom}
                onChange={(e) => handleInputChange('validFrom', e.target.value)}
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />
              
              <TextField
                label="Valid Till*"
                type="date"
                value={formData.validTill}
                onChange={(e) => handleInputChange('validTill', e.target.value)}
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
              />
              
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ '&.Mui-focused': { color: '#C72030' } }}>
                  Status
                </InputLabel>
                <MuiSelect
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  label="Status"
                  displayEmpty
                  sx={fieldStyles}
                >
                  <MenuItem value="" disabled>Select Status</MenuItem>
                  <MenuItem value="1">Approved</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="0">Rejected</MenuItem>
                </MuiSelect>
              </FormControl>
            </div>
          </div>
        </div>

        {/* Section 2: Attachments */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              Add Attachments
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Profile Picture Upload</Label>
                
                {/* Camera Capture Button */}
                <div className="mb-4">
                  <Button
                    type="button"
                    onClick={handleCameraClick}
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 border-[#C72030] text-[#C72030] hover:bg-[#C72030]/10"
                  >
                    <Camera className="w-4 h-4" />
                    Capture Photo
                  </Button>
                </div>

                {/* Camera Captured Photo Preview */}
                {isPhotoSaved && capturedPhoto && (
                  <div className="mb-4 p-4 border-2 border-green-500 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-600">Captured Photo</span>
                      <Button
                        type="button"
                        onClick={handleRetakePhoto}
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-[#C72030] hover:bg-[#C72030]/10"
                      >
                        Retake
                      </Button>
                    </div>
                    <img
                      src={capturedPhoto}
                      alt="Captured"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('profilePicture', e.target.files?.[0] || null)}
                    className="hidden"
                    id="profile-picture-upload"
                  />
                  <label htmlFor="profile-picture-upload" className="cursor-pointer">
                    {attachments.profilePicture ? (
                      <div className="space-y-2">
                        <img
                          src={URL.createObjectURL(attachments.profilePicture)}
                          alt="Profile Preview"
                          className="w-16 h-16 object-cover rounded-lg mx-auto"
                        />
                        <p className="text-xs text-red-600 font-medium">{attachments.profilePicture.name}</p>
                        <p className="text-xs text-gray-500">Click to change</p>
                      </div>
                    ) : (
                      <>
                        <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
                          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-600">
                          Drag & Drop or <span className="text-red-500 cursor-pointer font-medium">Choose File</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                      </>
                    )}
                  </label>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Documents Upload</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleDocumentsChange(e.target.files ? Array.from(e.target.files) : [])}
                    className="hidden"
                    id="manuals-upload"
                  />
                  <label htmlFor="manuals-upload" className="cursor-pointer">
                    <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
                      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600">
                      Drag & Drop or <span className="text-red-500 cursor-pointer font-medium">Choose File</span>
                    </p>
                    <p className="text-xs mt-1">
                      {documents.length > 0 ? (
                        <span className="text-red-600 font-medium">{documents.length} file(s) selected</span>
                      ) : (
                        <span className="text-gray-500">PDF, DOC up to 10MB</span>
                      )}
                    </p>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Schedule */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              Schedule Information
            </h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-4 text-left font-medium text-gray-700">Day</th>
                    <th className="border border-gray-200 p-4 text-center font-medium text-gray-700">Start Time</th>
                    <th className="border border-gray-200 p-4 text-center font-medium text-gray-700">End Time</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(schedule).map(([day, data]) => (
                    <tr key={day} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={data.checked}
                            onChange={(e) => handleScheduleChange(day, 'checked', e.target.checked)}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-600"
                            aria-label={`Enable ${day}`}
                          />
                          <span className="capitalize font-medium text-gray-700">{day}</span>
                        </div>
                      </td>
                      <td className="border border-gray-200 p-4">
                        <div className="flex gap-2 justify-center">
                          <Select 
                            value={data.startTime} 
                            onValueChange={(value) => handleScheduleChange(day, 'startTime', value)}
                          >
                            <SelectTrigger className="w-16 h-8 border-gray-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timeOptions.map(time => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="flex items-center text-gray-500">:</span>
                          <Select 
                            value={data.startMinute} 
                            onValueChange={(value) => handleScheduleChange(day, 'startMinute', value)}
                          >
                            <SelectTrigger className="w-16 h-8 border-gray-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {minuteOptions.map(minute => (
                                <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                      <td className="border border-gray-200 p-4">
                        <div className="flex gap-2 justify-center">
                          <Select 
                            value={data.endTime} 
                            onValueChange={(value) => handleScheduleChange(day, 'endTime', value)}
                          >
                            <SelectTrigger className="w-16 h-8 border-gray-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timeOptions.map(time => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="flex items-center text-gray-500">:</span>
                          <Select 
                            value={data.endMinute} 
                            onValueChange={(value) => handleScheduleChange(day, 'endMinute', value)}
                          >
                            <SelectTrigger className="w-16 h-8 border-gray-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {minuteOptions.map(minute => (
                                <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-6">
          <Button 
            type="submit"
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-2"
          >
            {isSubmitting ? 'Creating...' : 'Submit'}
          </Button>
          <Button 
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-2"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
