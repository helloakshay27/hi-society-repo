import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CampaignsReferralCreate: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    project: "",
    flatType: "",
    clientName: "",
    mobile: "",
    alternateMobile: "",
    clientEmail: "",
    leadStage: "",
    activity: "",
    leadStatus: "",
    leadSource: "",
    leadSubSource: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.project || !formData.clientName || !formData.mobile) {
      alert(
        "Please fill in all required fields: Project, Client Name, and Mobile"
      );
      return;
    }

    // Generate unique IDs
    const timestamp = Date.now();
    const displayId = `#${Math.floor(1000 + Math.random() * 9000)}`;
    const uniqueId = Math.random().toString(36).substring(2, 10);

    // Get current date in DD/MM/YYYY format
    const currentDate = new Date();
    const formattedDate = `${String(currentDate.getDate()).padStart(2, "0")}/${String(currentDate.getMonth() + 1).padStart(2, "0")}/${currentDate.getFullYear()}`;

    // Create new referral object
    const newReferral = {
      id: timestamp.toString(),
      displayId: displayId,
      createdBy: formData.clientName, // Using client name as created by
      uniqueId: uniqueId,
      project: formData.project,
      lead: formData.clientName,
      mobile: formData.mobile,
      status: formData.leadStatus === "active" ? "ACT" : "",
      createdOn: formattedDate,
    };

    // Save to localStorage to pass to list page
    localStorage.setItem("newReferral", JSON.stringify(newReferral));

    // Navigate back to referrals list
    navigate("/campaigns/referrals");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-[#F2EEE9] text-[#BF213E] px-4 py-3 mb-6 rounded-t">
          <h1 className="text-lg font-medium">CREATE LED</h1>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-b shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project */}
            <div className="space-y-2">
              <Label htmlFor="project" className="text-gray-600">
                Project <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.project}
                onValueChange={(value) => handleInputChange("project", value)}
              >
                <SelectTrigger id="project" className="bg-gray-50">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project1">Project 1</SelectItem>
                  <SelectItem value="project2">Project 2</SelectItem>
                  <SelectItem value="project3">Project 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Flat Type */}
            <div className="space-y-2">
              <Label htmlFor="flatType" className="text-gray-600">
                Flat Type
              </Label>
              <Select
                value={formData.flatType}
                onValueChange={(value) => handleInputChange("flatType", value)}
              >
                <SelectTrigger id="flatType" className="bg-gray-50">
                  <SelectValue placeholder="Select Flat Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1bhk">1 BHK</SelectItem>
                  <SelectItem value="2bhk">2 BHK</SelectItem>
                  <SelectItem value="3bhk">3 BHK</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Client Name */}
            <div className="space-y-2">
              <Label htmlFor="clientName" className="text-gray-600">
                Client Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="clientName"
                type="text"
                placeholder="Client Name"
                className="bg-gray-50"
                value={formData.clientName}
                onChange={(e) =>
                  handleInputChange("clientName", e.target.value)
                }
              />
            </div>

            {/* Mobile */}
            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-gray-600">
                Mobile <span className="text-red-500">*</span>
              </Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="Phone"
                className="bg-gray-50"
                value={formData.mobile}
                onChange={(e) => handleInputChange("mobile", e.target.value)}
              />
            </div>

            {/* Alternate Mobile */}
            <div className="space-y-2">
              <Label htmlFor="alternateMobile" className="text-gray-600">
                Alternate Mobile
              </Label>
              <Input
                id="alternateMobile"
                type="tel"
                placeholder="Alternate Phone"
                className="bg-gray-50"
                value={formData.alternateMobile}
                onChange={(e) =>
                  handleInputChange("alternateMobile", e.target.value)
                }
              />
            </div>

            {/* Client Email */}
            <div className="space-y-2">
              <Label htmlFor="clientEmail" className="text-gray-600">
                Client Email
              </Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="Email"
                className="bg-gray-50"
                value={formData.clientEmail}
                onChange={(e) =>
                  handleInputChange("clientEmail", e.target.value)
                }
              />
            </div>

            {/* Lead Stage */}
            <div className="space-y-2">
              <Label htmlFor="leadStage" className="text-gray-600">
                Lead Stage
              </Label>
              <Select
                value={formData.leadStage}
                onValueChange={(value) => handleInputChange("leadStage", value)}
              >
                <SelectTrigger id="leadStage" className="bg-gray-50">
                  <SelectValue placeholder="Select Lead Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Activity */}
            <div className="space-y-2">
              <Label htmlFor="activity" className="text-gray-600">
                Activity
              </Label>
              <Select
                value={formData.activity}
                onValueChange={(value) => handleInputChange("activity", value)}
              >
                <SelectTrigger id="activity" className="bg-gray-50">
                  <SelectValue placeholder="Select Activity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lead Status */}
            <div className="space-y-2">
              <Label htmlFor="leadStatus" className="text-gray-600">
                Lead Status
              </Label>
              <Select
                value={formData.leadStatus}
                onValueChange={(value) =>
                  handleInputChange("leadStatus", value)
                }
              >
                <SelectTrigger id="leadStatus" className="bg-gray-50">
                  <SelectValue placeholder="select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lead Source */}
            <div className="space-y-2">
              <Label htmlFor="leadSource" className="text-gray-600">
                Lead Source
              </Label>
              <Select
                value={formData.leadSource}
                onValueChange={(value) =>
                  handleInputChange("leadSource", value)
                }
              >
                <SelectTrigger id="leadSource" className="bg-gray-50">
                  <SelectValue placeholder="Select Lead Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="walkin">Walk-in</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lead Sub Source */}
            <div className="space-y-2">
              <Label htmlFor="leadSubSource" className="text-gray-600">
                Lead Sub Source
              </Label>
              <Select
                value={formData.leadSubSource}
                onValueChange={(value) =>
                  handleInputChange("leadSubSource", value)
                }
              >
                <SelectTrigger id="leadSubSource" className="bg-gray-50">
                  <SelectValue placeholder="Select Lead Sub Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                </SelectContent>
              </Select>
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
  );
};

export default CampaignsReferralCreate;
