import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getBaseUrl, getToken } from "@/utils/auth";
import { useToast } from "@/hooks/use-toast";

const CampaignsReferralSetupEdit: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    bannerEnabled: false,
    referralBannerEnabled: false,
    projectName: "",
    projectReferenceId: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch referral setup details from API
  useEffect(() => {
    const fetchReferralSetupDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const baseUrl = getBaseUrl();
        const token = getToken();

        if (!baseUrl || !token) {
          throw new Error("Authentication required. Please login again.");
        }

        const apiUrl = `${baseUrl}/crm/admin/referral_setups/${id}.json`;
        console.log("🔍 Fetching referral setup detail from:", apiUrl);

        const response = await axios.get(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("✅ Referral Setup Detail Response:", response.data);

        // Map API response to form data
        if (response.data) {
          setFormData({
            bannerEnabled: response.data.active === 1,
            referralBannerEnabled: !!response.data.banner,
            projectName: response.data.project_name || "",
            projectReferenceId:
              response.data.project_reference_id?.toString() || "",
          });
        }
      } catch (err) {
        const error = err as Error;
        console.error("❌ Error fetching referral setup detail:", error);
        setError(error.message || "Failed to fetch referral setup details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReferralSetupDetail();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
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

      // Prepare PUT data matching the API structure
      const putData = {
        project_name: formData.projectName,
        project_reference_id: formData.projectReferenceId,
        active: formData.bannerEnabled ? 1 : 0,
        banner: formData.referralBannerEnabled ? "enabled" : null,
        society_id: societyId,
      };

      const apiUrl = `${baseUrl}/crm/admin/referral_setups/${id}.json`;
      console.log("📝 Updating referral setup:", apiUrl);
      console.log("📦 PUT Data:", putData);

      const response = await axios.put(apiUrl, putData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Update Response:", response.data);

      if (response.data.code === 200 || response.status === 200) {
        toast({
          title: "Success",
          description: "Referral setup updated successfully!",
        });

        // Navigate back to list page
        navigate("/campaigns/referral-setup");
      } else {
        throw new Error(
          response.data.message || "Failed to update referral setup"
        );
      }
    } catch (err) {
      const error = err as Error;
      console.error("❌ Error updating referral setup:", error);

      toast({
        title: "Error",
        description:
          error.message || "Failed to update referral setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleChange = (field: string, value: boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRemove = () => {
    // Handle remove action - connect to API
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

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a8a]"></div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="mt-2 bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Form */}
          {!loading && !error && (
            <form onSubmit={handleSubmit} className="p-6">
              {/* Remove Button */}
              <div className="flex justify-center mb-6">
                <Button
                  type="button"
                  onClick={handleRemove}
                  className="bg-red-500 hover:bg-red-600 text-white px-6"
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>

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
                  <Label
                    htmlFor="projectName"
                    className="text-gray-600 text-sm"
                  >
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
                  disabled={submitting}
                  className="bg-[#10b981] hover:bg-[#059669] text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Updating..." : "Submit"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignsReferralSetupEdit;
