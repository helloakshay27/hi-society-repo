import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getBaseUrl, getToken } from "@/utils/auth";
import { useToast } from "@/hooks/use-toast";

const CampaignsReferralSetupCreate: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    bannerEnabled: false,
    referralBannerEnabled: false,
    projectName: "",
    projectReferenceId: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const baseUrl = getBaseUrl();
      const token = getToken();
      const societyId = localStorage.getItem("selectedUserSociety");

      if (!baseUrl || !token) {
        toast({
          title: "Authentication Error",
          description: "Please login again to continue.",
          variant: "destructive",
        });
        return;
      }

      if (!societyId) {
        toast({
          title: "Society Required",
          description: "Please select a society first.",
          variant: "destructive",
        });
        return;
      }

      // Prepare POST data
      const postData = {
        project_name: formData.projectName,
        project_reference_id: formData.projectReferenceId,
        active: formData.bannerEnabled ? 1 : 0,
        banner: formData.referralBannerEnabled ? "enabled" : "",
        society_id: societyId,
      };

      const apiUrl = `${baseUrl}/crm/admin/referral_setups.json`;
      console.log("📤 Creating referral setup:", apiUrl);
      console.log("📦 POST Data:", postData);

      const response = await axios.post(apiUrl, postData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Create Response:", response.data);

      if (
        response.data.code === 200 ||
        response.status === 200 ||
        response.status === 201
      ) {
        toast({
          title: "Success",
          description: "Referral setup created successfully!",
        });

        // Navigate back to list page
        navigate("/campaigns/referral-setup");
      } else {
        throw new Error(
          response.data.message || "Failed to create referral setup"
        );
      }
    } catch (err) {
      const error = err as Error;
      console.error("❌ Error creating referral setup:", error);

      toast({
        title: "Error",
        description:
          error.message || "Failed to create referral setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
                disabled={loading}
                className="bg-[#10b981] hover:bg-[#059669] text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Submit"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CampaignsReferralSetupCreate;
