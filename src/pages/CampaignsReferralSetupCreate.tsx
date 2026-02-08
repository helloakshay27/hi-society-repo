import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";

const CampaignsReferralSetupCreate: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    bannerEnabled: false,
    referralBannerEnabled: false,
    projectName: "",
    projectReferenceId: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Generate unique ID
    const timestamp = Date.now();

    // Use a default placeholder image
    const defaultImage =
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=150&h=100&fit=crop";

    // Create new referral setup object
    const newReferralSetup = {
      id: timestamp.toString(),
      image: defaultImage,
      projectName: formData.projectName,
      projectReferenceId: formData.projectReferenceId,
      referralProgram: formData.bannerEnabled,
      bannerStatus: formData.referralBannerEnabled,
    };

    // Save to localStorage to pass to list page
    localStorage.setItem("newReferralSetup", JSON.stringify(newReferralSetup));

    // Navigate back to referral setup list
    navigate("/campaigns/referral-setup");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleChange = (field: string, value: boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        {/* Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h1 className="text-lg font-normal text-gray-700">
              Referral Setup
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Toggle Switches Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Banner */}
              <div className="space-y-2">
                <Label htmlFor="banner" className="text-gray-600 text-sm">
                  Banner
                </Label>
                <div className="flex items-center space-x-3">
                  <Switch
                    id="banner"
                    checked={formData.bannerEnabled}
                    onCheckedChange={(checked) =>
                      handleToggleChange("bannerEnabled", checked)
                    }
                    className={
                      formData.bannerEnabled
                        ? "data-[state=checked]:bg-green-500"
                        : "data-[state=unchecked]:bg-red-500"
                    }
                  />
                  <span className="text-sm text-gray-600">
                    {formData.bannerEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>

              {/* Referral Banner */}
              <div className="space-y-2">
                <Label
                  htmlFor="referralBanner"
                  className="text-gray-600 text-sm"
                >
                  Referral banner
                </Label>
                <div className="flex items-center space-x-3">
                  <Switch
                    id="referralBanner"
                    checked={formData.referralBannerEnabled}
                    onCheckedChange={(checked) =>
                      handleToggleChange("referralBannerEnabled", checked)
                    }
                    className={
                      formData.referralBannerEnabled
                        ? "data-[state=checked]:bg-green-500"
                        : "data-[state=unchecked]:bg-red-500"
                    }
                  />
                  <span className="text-sm text-gray-600">
                    {formData.referralBannerEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>

            {/* Text Inputs Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="projectName" className="text-gray-600 text-sm">
                  Project Name
                </Label>
                <Input
                  id="projectName"
                  type="text"
                  placeholder=""
                  className="bg-white"
                  value={formData.projectName}
                  onChange={(e) =>
                    handleInputChange("projectName", e.target.value)
                  }
                />
              </div>

              {/* Project Reference Id */}
              <div className="space-y-2">
                <Label
                  htmlFor="projectReferenceId"
                  className="text-gray-600 text-sm"
                >
                  Project Reference Id
                </Label>
                <Input
                  id="projectReferenceId"
                  type="text"
                  placeholder=""
                  className="bg-white"
                  value={formData.projectReferenceId}
                  onChange={(e) =>
                    handleInputChange("projectReferenceId", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-300 my-6"></div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button
                type="submit"
                className="bg-[#10b981] hover:bg-[#059669] text-white px-8"
              >
                Submit
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CampaignsReferralSetupCreate;
