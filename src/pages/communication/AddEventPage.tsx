import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TextField, InputAdornment } from "@mui/material";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

interface EventFormData {
  title: string;
  venue: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  markAsImportant: boolean;
  sendEmail: boolean;
  shareWith: "all" | "individuals" | "groups";
  rsvp: boolean;
}

const AddEventPage = () => {
  const navigate = useNavigate();
  const [attachments, setAttachments] = useState<File[]>([]);
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    venue: "",
    description: "",
    startDate: "",
    startTime: "04:15",
    endDate: "",
    endTime: "04:15",
    markAsImportant: false,
    sendEmail: false,
    shareWith: "all",
    rsvp: true,
  });

  const handleInputChange = (field: keyof EventFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAttachments((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.title.trim()) {
      toast.error("Please enter event title");
      return;
    }
    if (!formData.venue.trim()) {
      toast.error("Please enter venue");
      return;
    }
    if (!formData.startDate) {
      toast.error("Please select start date");
      return;
    }
    if (!formData.endDate) {
      toast.error("Please select end date");
      return;
    }

    // In real implementation, send data to API
    console.log("Event Data:", formData);
    console.log("Attachments:", attachments);

    toast.success("Event created successfully!");
    navigate("/communication/events");
  };

  return (
    <div className="min-h-screen bg-[#fafafa] px-0 py-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-5 h-5" />
          <h1 className="text-2xl font-bold">Add Event</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Row 1: Title | Venue | Start Date */}
            <div>
  <TextField
    label="Title"
    placeholder="Title"
    value={formData.title}
    onChange={(e) => handleInputChange("title", e.target.value)}
    variant="outlined"
    fullWidth
    slotProps={{
      inputLabel: { shrink: true },
    }}
    InputProps={{
      sx: {
        backgroundColor: "#fff",
        borderRadius: "6px",
        width: "350px",
      },
    }}
    required
  />
</div>

            <div>
  <TextField
    label="Venue"
    placeholder="Enter Venue"
    value={formData.venue}
    onChange={(e) => handleInputChange("venue", e.target.value)}
    variant="outlined"
    fullWidth
    slotProps={{
      inputLabel: { shrink: true },
    }}
    InputProps={{
      sx: {
        backgroundColor: "#fff",
        borderRadius: "6px",
        width: "350px",
      },
    }}
  />
</div>

            <div>
  <TextField
    label="Start Date"
    type="date"
    value={formData.startDate}
    onChange={(e) => handleInputChange("startDate", e.target.value)}
    variant="outlined"
    fullWidth
    slotProps={{
      inputLabel: { shrink: true },
    }}
    InputProps={{
      sx: {
        backgroundColor: "#fff",
        borderRadius: "6px",
        width: "350px",
      },
    }}
  />
</div>

            {/* Row 2: Start Time | End Date | End Time */}
            <div>
  <TextField
    label="Start Time"
    type="time"
    value={formData.startTime}
    onChange={(e) => handleInputChange("startTime", e.target.value)}
    variant="outlined"
    fullWidth
    slotProps={{
      inputLabel: { shrink: true },
    }}
    InputProps={{
      sx: {
        backgroundColor: "#fff",
        borderRadius: "6px",
        width: "350px",
      },
    }}
  />
</div>

            <div>
  <TextField
    label="End Date"
    type="date"
    value={formData.endDate}
    onChange={(e) => handleInputChange("endDate", e.target.value)}
    variant="outlined"
    fullWidth
    slotProps={{
      inputLabel: { shrink: true },
    }}
    InputProps={{
      sx: {
        backgroundColor: "#fff",
        borderRadius: "6px",
        width: "350px",
      },
    }}
  />
</div>

            <div>
              <TextField
                label="End Time"
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange("endTime", e.target.value)}
                variant="outlined"
                fullWidth
                slotProps={{
                  inputLabel: { shrink: true },
                }}
                InputProps={{
                  sx: {
                    backgroundColor: "#fff",
                    borderRadius: "6px",
                    width: "350px",
                  },
                }}
              />
            </div>

            {/* Description Field */}
            <div className="col-span-3 px-6 py-4">
              <div className="relative">
                <label 
                  htmlFor="notice-description"
                  className="absolute -top-2 left-3 bg-white px-1 text-xs font-medium text-gray-600"
                >
                  Description
                </label>
                <textarea
                  id="notice-description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="
                    w-full
                    min-h-[150px]
                    border
                    border-gray-300
                    rounded-md
                    px-4
                    py-3
                    pt-4
                    text-sm
                    text-gray-700
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                    focus:border-transparent
                    resize-y
                  "
                  placeholder="Enter notice description"
                />
              </div>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="markAsImportant"
                checked={formData.markAsImportant}
                onCheckedChange={(checked) =>
                  handleInputChange('markAsImportant', checked)
                }
              />
              <label
                htmlFor="markAsImportant"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Mark as Important
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="sendEmail"
                checked={formData.sendEmail}
                onCheckedChange={(checked) =>
                  handleInputChange('sendEmail', checked)
                }
              />
              <label
                htmlFor="sendEmail"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Send Email
              </label>
            </div>
          </div>
        </div>

       {/* UPLOAD FILES Section */}
<div className="bg-white rounded-lg shadow-sm p-6 mb-6">
  {/* Header */}
  <div className="mb-6">
    <div className="bg-[#C4B89D54] text-[#1A1A1A] px-4 py-2 rounded font-medium inline-block">
      UPLOAD FILES
    </div>
  </div>

  {/* Upload Box */}
  <div className="border border-gray-300 rounded-md p-6">
    <input
      id="file-upload"
      type="file"
      multiple
      onChange={handleFileUpload}
      className="hidden"
      accept="image/*,application/pdf,.doc,.docx"
    />

    <label
      htmlFor="file-upload"
      className="inline-flex items-center gap-3 px-5 py-2 bg-[#e0d9c859] rounded cursor-pointer hover:bg-[#EFEFEF]"
    >
      <span className="text-[#1A1A1A] font-medium">
        Upload Files
      </span>
      <Upload className="w-5 h-5 text-[#C72030]" />
    </label>

    {/* Selected files */}
    {attachments.length > 0 && (
      <div className="mt-3">
        {attachments.map((file, index) => (
          <p
            key={index}
            className="text-sm text-gray-600"
          >
            Selected: {file.name}
          </p>
        ))}
      </div>
    )}
  </div>
</div>


        {/* SHARE WITH Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-[#1A1A1A] bg-[#C4B89D54] inline-block px-4 py-2 rounded">
              SHARE WITH
            </h2>
          </div>

          <RadioGroup
            value={formData.shareWith}
            onValueChange={(value: "all" | "individuals" | "groups") =>
              handleInputChange("shareWith", value)
            }
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="cursor-pointer">
                All
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="individuals" id="individuals" />
              <Label htmlFor="individuals" className="cursor-pointer">
                Individuals
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="groups" id="groups" />
              <Label htmlFor="groups" className="cursor-pointer">
                Groups
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* RSVP Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-[#1A1A1A] bg-[#C4B89D54] inline-block px-4 py-2 rounded">
              RSVP
            </h2>
          </div>

          <RadioGroup
            value={formData.rsvp ? "yes" : "no"}
            onValueChange={(value) =>
              handleInputChange("rsvp", value === "yes")
            }
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="rsvp-yes" />
              <Label htmlFor="rsvp-yes" className="cursor-pointer">
                Yes
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="rsvp-no" />
              <Label htmlFor="rsvp-no" className="cursor-pointer">
                No
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center mt-6">
          <Button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddEventPage;
