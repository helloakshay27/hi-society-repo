import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { TextField } from "@mui/material";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const CampaignsOtherProjectConfig: React.FC = () => {
  const navigate = useNavigate();

  const [configForm, setConfigForm] = useState({
    name: "",
    address: "",
    about: "",
    coverImage: null as File | null,
    projectLogo: null as File | null,
    showOnOtherProject: false,
    projectReferenceId: "",
    geoLocationURL: "",
    receptionMobile1: "",
    receptionMobile2: "",
    latitude: "",
    longitude: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Generate unique ID
    const timestamp = Date.now();

    // Create new project object
    const newProject = {
      id: timestamp.toString(),
      project: configForm.name,
      projectReferenceId: configForm.projectReferenceId,
      address: configForm.address,
      geoLocation: configForm.geoLocationURL,
      receptionMobile1: configForm.receptionMobile1,
      receptionMobile2: configForm.receptionMobile2,
      active: configForm.showOnOtherProject,
    };

    // Save to localStorage
    localStorage.setItem("newOtherProject", JSON.stringify(newProject));

    // Navigate back to the other project page
    navigate("/campaigns/other-project");
  };

  return (
    <div className="p-[30px] min-h-screen bg-transparent">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2 cursor-pointer">
        <button
          onClick={() => navigate("/campaigns/other-project")}
          className="flex items-center gap-1 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-[24px] font-semibold text-[#1a1a1a]">
          Configure Project
        </h1>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow border-2 p-6 space-y-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Row 1: Name and Cover Image */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <TextField
                  fullWidth
                  size="small"
                  value={configForm.name}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, name: e.target.value })
                  }
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Image
                </label>
                <TextField
                  fullWidth
                  size="small"
                  type="file"
                  InputLabelProps={{ shrink: true }}
                  onChange={(e: any) =>
                    setConfigForm({
                      ...configForm,
                      coverImage: e.target.files ? e.target.files[0] : null,
                    })
                  }
                />
              </div>
            </div>

            {/* Row 2: Address and About */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={3}
                  maxRows={6}
                  value={configForm.address}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, address: e.target.value })
                  }
                  placeholder="Enter address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  About
                </label>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={3}
                  maxRows={6}
                  value={configForm.about}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, about: e.target.value })
                  }
                  placeholder="Enter description"
                />
              </div>
            </div>

            {/* Row 3: Show on other project and Project Logo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="showOnOtherProject"
                  checked={configForm.showOnOtherProject}
                  onCheckedChange={(checked) =>
                    setConfigForm({
                      ...configForm,
                      showOnOtherProject: checked as boolean,
                    })
                  }
                />
                <Label
                  htmlFor="showOnOtherProject"
                  className="text-sm text-gray-700"
                >
                  Show on other project
                </Label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Logo
                </label>
                <TextField
                  fullWidth
                  size="small"
                  type="file"
                  InputLabelProps={{ shrink: true }}
                  onChange={(e: any) =>
                    setConfigForm({
                      ...configForm,
                      projectLogo: e.target.files ? e.target.files[0] : null,
                    })
                  }
                />
              </div>
            </div>

            {/* Row 4: Project Reference Id and Geo Location URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Reference Id
                </label>
                <TextField
                  fullWidth
                  size="small"
                  value={configForm.projectReferenceId}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      projectReferenceId: e.target.value,
                    })
                  }
                  placeholder="Enter reference ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Geo Location URL
                </label>
                <TextField
                  fullWidth
                  size="small"
                  value={configForm.geoLocationURL}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      geoLocationURL: e.target.value,
                    })
                  }
                  placeholder="Enter geo location URL"
                />
              </div>
            </div>

            {/* Row 5: Reception Mobiles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reception Mobile - 1
                </label>
                <TextField
                  fullWidth
                  size="small"
                  value={configForm.receptionMobile1}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      receptionMobile1: e.target.value,
                    })
                  }
                  placeholder="Enter mobile number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reception Mobile - 2
                </label>
                <TextField
                  fullWidth
                  size="small"
                  value={configForm.receptionMobile2}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      receptionMobile2: e.target.value,
                    })
                  }
                  placeholder="Enter mobile number"
                />
              </div>
            </div>

            {/* Row 6: Latitude and Longitude */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude
                </label>
                <TextField
                  fullWidth
                  size="small"
                  value={configForm.latitude}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, latitude: e.target.value })
                  }
                  placeholder="Enter latitude"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude
                </label>
                <TextField
                  fullWidth
                  size="small"
                  value={configForm.longitude}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, longitude: e.target.value })
                  }
                  placeholder="Enter longitude"
                />
              </div>
            </div>

            {/* Gallery Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gallery images
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center">
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amenities
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Enter amenity name"
                />
              </div>
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments
              </label>
              <TextField
                fullWidth
                size="small"
                type="file"
                InputLabelProps={{ shrink: true }}
              />
              <Button
                type="button"
                className="bg-orange-500 hover:bg-orange-600 text-white mt-2"
              >
                Add More
              </Button>
            </div>

            {/* Documents */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Documents
              </label>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enter document name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachments
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    type="file"
                    InputLabelProps={{ shrink: true }}
                  />
                </div>
              </div>
              <Button
                type="button"
                className="bg-orange-500 hover:bg-orange-600 text-white mt-2"
              >
                Add More
              </Button>
            </div>

            {/* Floor Plans */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Floor Plans
              </label>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enter floor plan name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachments
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    type="file"
                    InputLabelProps={{ shrink: true }}
                  />
                </div>
              </div>
              <Button
                type="button"
                className="bg-orange-500 hover:bg-orange-600 text-white mt-2"
              >
                Add More
              </Button>
            </div>

            {/* Unit Plans */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Plans
              </label>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enter unit plan name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachments
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    type="file"
                    InputLabelProps={{ shrink: true }}
                  />
                </div>
              </div>
              <Button
                type="button"
                className="bg-orange-500 hover:bg-orange-600 text-white mt-2"
              >
                Add More
              </Button>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 justify-center pt-4">
              <Button
                type="submit"
                className="bg-[#10b981] hover:bg-[#059669] text-white px-8"
              >
                Submit
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/campaigns/other-project")}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignsOtherProjectConfig;
