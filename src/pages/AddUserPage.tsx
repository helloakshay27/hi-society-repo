import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Floating Label Field Component
const FloatingLabelField = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => {
  return (
    <div className="relative">
      <div className="border-2 border-gray-300 rounded px-3 py-2">
        <label className="absolute -top-3 left-3 bg-white px-2 text-sm font-medium text-gray-700">
          {required && <span className="text-red-500">* </span>}
          {label}
        </label>
        <div className="pt-2">
          {children}
        </div>
      </div>
    </div>
  );
};

export const AddUserPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "+91",
    mobile: "",
    password: "",
    phase: "",
    status: "",
    tower: "",
    flat: "",
    category: "",
    alternateAddress: "",
    residentType: "Owner",
    membershipType: "Primary",
    livesHere: "Yes",
    allowFitout: "No",
    birthDate: "",
    anniversary: "",
    spouseBirthDate: "",
    alternateEmail1: "",
    alternateEmail2: "",
    landlineNumber: "",
    intercomNumber: "",
    gstNumber: "",
    panNumber: "",
    evConnection: "",
    noOfPets: "",
    noOfAdults: "",
    noOfChildren: "",
    differentlyAbled: "No",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log("Form submitted:", formData);
    // Add your submit logic here
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-[#F6F4EE] rounded-lg shadow-sm mb-6">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-[#1A1A1A]">Add User</h1>
          </div>
        </div>

        {/* Primary Details Section with Border Title */}
        <div className="relative mb-6">
          <div className="border-2 border-gray-300 rounded-lg pt-6 pb-6 px-6">
            <div className="absolute -top-4 left-6 bg-[#fafafa] px-3">
              <span className="text-lg font-semibold text-[#1A1A1A]">Primary Details</span>
            </div>

            <div className="flex gap-6">
              {/* Profile Photo */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-32 h-32 rounded-full bg-[#1e3a5f] flex items-center justify-center relative">
                  <User className="w-16 h-16 text-white" />
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#C72031] rounded-full flex items-center justify-center hover:bg-[#a01828] transition-colors">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Title */}
                <FloatingLabelField label="Select Title" required>
                  <Select
                    value={formData.title}
                    onValueChange={(value) => handleInputChange("title", value)}
                  >
                    <SelectTrigger className="border-0 p-0">
                      <SelectValue placeholder="Select Title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr">Mr</SelectItem>
                      <SelectItem value="Mrs">Mrs</SelectItem>
                      <SelectItem value="Ms">Ms</SelectItem>
                      <SelectItem value="Dr">Dr</SelectItem>
                    </SelectContent>
                  </Select>
                </FloatingLabelField>

                {/* First Name */}
                <FloatingLabelField label="First Name" required>
                  <Input
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    placeholder="First Name"
                    className="border-0 p-0 focus:outline-none focus:ring-0"
                  />
                </FloatingLabelField>

                {/* Last Name */}
                <FloatingLabelField label="Last Name" required>
                  <Input
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    placeholder="Last Name"
                    className="border-0 p-0 focus:outline-none focus:ring-0"
                  />
                </FloatingLabelField>

                {/* Email */}
                <FloatingLabelField label="Email" required>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="runwal.gardens@lockated.com"
                    className="border-0 p-0 focus:outline-none focus:ring-0"
                  />
                </FloatingLabelField>

                {/* Mobile */}
                <FloatingLabelField label="Mobile">
                  <div className="flex gap-2">
                    <Select
                      value={formData.countryCode}
                      onValueChange={(value) =>
                        handleInputChange("countryCode", value)
                      }
                    >
                      <SelectTrigger className="w-24 border-0 p-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+91">🇮🇳 +91</SelectItem>
                        <SelectItem value="+1">🇺🇸 +1</SelectItem>
                        <SelectItem value="+44">🇬🇧 +44</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) =>
                        handleInputChange("mobile", e.target.value)
                      }
                      placeholder="Mobile Number"
                      className="flex-1 border-0 p-0 focus:outline-none focus:ring-0"
                    />
                  </div>
                </FloatingLabelField>

                {/* Password */}
                <FloatingLabelField label="Password" required>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      placeholder="••••••••••"
                      className="border-0 p-0 focus:outline-none focus:ring-0 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </FloatingLabelField>

                {/* Phase */}
                <FloatingLabelField label="Select Phase" required>
                  <Select
                    value={formData.phase}
                    onValueChange={(value) => handleInputChange("phase", value)}
                  >
                    <SelectTrigger className="border-0 p-0">
                      <SelectValue placeholder="Select Phase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Phase 1">Phase 1</SelectItem>
                      <SelectItem value="Phase 2">Phase 2</SelectItem>
                      <SelectItem value="Phase 3">Phase 3</SelectItem>
                    </SelectContent>
                  </Select>
                </FloatingLabelField>

                {/* Status */}
                <FloatingLabelField label="Select Status" required>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleInputChange("status", value)
                    }
                  >
                    <SelectTrigger className="border-0 p-0">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </FloatingLabelField>

                {/* Tower */}
                <FloatingLabelField label="Select Tower" required>
                  <Select
                    value={formData.tower}
                    onValueChange={(value) => handleInputChange("tower", value)}
                  >
                    <SelectTrigger className="border-0 p-0">
                      <SelectValue placeholder="Select Tower" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tower A">Tower A</SelectItem>
                      <SelectItem value="Tower B">Tower B</SelectItem>
                      <SelectItem value="Tower C">Tower C</SelectItem>
                    </SelectContent>
                  </Select>
                </FloatingLabelField>

                {/* Flat */}
                <FloatingLabelField label="Select Flat" required>
                  <Select
                    value={formData.flat}
                    onValueChange={(value) => handleInputChange("flat", value)}
                  >
                    <SelectTrigger className="border-0 p-0">
                      <SelectValue placeholder="Select Flat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="101">101</SelectItem>
                      <SelectItem value="102">102</SelectItem>
                      <SelectItem value="103">103</SelectItem>
                    </SelectContent>
                  </Select>
                </FloatingLabelField>

                {/* Category */}
                <FloatingLabelField label="Select Category" required>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      handleInputChange("category", value)
                    }
                  >
                    <SelectTrigger className="border-0 p-0">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Resident">Resident</SelectItem>
                      <SelectItem value="Staff">Staff</SelectItem>
                      <SelectItem value="Vendor">Vendor</SelectItem>
                    </SelectContent>
                  </Select>
                </FloatingLabelField>

                {/* Alternate Address */}
                <div className="space-y-2 md:col-span-3 relative">
                  <div className="border-2 border-gray-300 rounded px-3 py-2">
                    <label className="absolute -top-3 left-3 bg-white px-2 text-sm font-medium text-gray-700">
                      Alternate Address
                    </label>
                    <Textarea
                      value={formData.alternateAddress}
                      onChange={(e) =>
                        handleInputChange("alternateAddress", e.target.value)
                      }
                      placeholder="Alternate Address"
                      className="border-0 focus:outline-none focus:ring-0 min-h-[80px] mt-2"
                    />
                  </div>
                </div>

                {/* Resident Type */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Resident Type:</Label>
                  <RadioGroup
                    value={formData.residentType}
                    onValueChange={(value) =>
                      handleInputChange("residentType", value)
                    }
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Owner" id="owner" />
                      <Label htmlFor="owner" className="font-normal cursor-pointer">
                        Owner
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Tenant" id="tenant" />
                      <Label htmlFor="tenant" className="font-normal cursor-pointer">
                        Tenant
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Membership Type */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Membership Type:</Label>
                  <RadioGroup
                    value={formData.membershipType}
                    onValueChange={(value) =>
                      handleInputChange("membershipType", value)
                    }
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Primary" id="primary" />
                      <Label htmlFor="primary" className="font-normal cursor-pointer">
                        Primary
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Secondary" id="secondary" />
                      <Label htmlFor="secondary" className="font-normal cursor-pointer">
                        Secondary
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Lives Here */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Lives Here:</Label>
                  <RadioGroup
                    value={formData.livesHere}
                    onValueChange={(value) =>
                      handleInputChange("livesHere", value)
                    }
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Yes" id="lives-yes" />
                      <Label htmlFor="lives-yes" className="font-normal cursor-pointer">
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="No" id="lives-no" />
                      <Label htmlFor="lives-no" className="font-normal cursor-pointer">
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Allow Fitout */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Allow Fitout:</Label>
                  <RadioGroup
                    value={formData.allowFitout}
                    onValueChange={(value) =>
                      handleInputChange("allowFitout", value)
                    }
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Yes" id="fitout-yes" />
                      <Label htmlFor="fitout-yes" className="font-normal cursor-pointer">
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="No" id="fitout-no" />
                      <Label htmlFor="fitout-no" className="font-normal cursor-pointer">
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Section with Border Title */}
        <div className="relative mb-6">
          <div className="border-2 border-gray-300 rounded-lg pt-6 pb-6 px-6">
            <div className="absolute -top-4 left-6 bg-[#fafafa] px-3">
              <span className="text-lg font-semibold text-[#1A1A1A]">Additional Info</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Birth Date */}
              <FloatingLabelField label="Birth Date">
                <Input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) =>
                    handleInputChange("birthDate", e.target.value)
                  }
                  className="border-0 p-0 focus:outline-none focus:ring-0"
                />
              </FloatingLabelField>

              {/* Anniversary */}
              <FloatingLabelField label="Anniversary">
                <Input
                  type="date"
                  value={formData.anniversary}
                  onChange={(e) =>
                    handleInputChange("anniversary", e.target.value)
                  }
                  placeholder="Anniversary Date"
                  className="border-0 p-0 focus:outline-none focus:ring-0"
                />
              </FloatingLabelField>

              {/* Spouse Birth Date */}
              <FloatingLabelField label="Spouse Birth Date">
                <Input
                  type="date"
                  value={formData.spouseBirthDate}
                  onChange={(e) =>
                    handleInputChange("spouseBirthDate", e.target.value)
                  }
                  placeholder="Spouse Birth Date"
                  className="border-0 p-0 focus:outline-none focus:ring-0"
                />
              </FloatingLabelField>

              {/* Alternate Email 1 */}
              <FloatingLabelField label="Alternate Email-1">
                <Input
                  type="email"
                  value={formData.alternateEmail1}
                  onChange={(e) =>
                    handleInputChange("alternateEmail1", e.target.value)
                  }
                  placeholder="Alternate Email-1"
                  className="border-0 p-0 focus:outline-none focus:ring-0"
                />
              </FloatingLabelField>

              {/* Alternate Email 2 */}
              <FloatingLabelField label="Alternate Email-2">
                <Input
                  type="email"
                  value={formData.alternateEmail2}
                  onChange={(e) =>
                    handleInputChange("alternateEmail2", e.target.value)
                  }
                  placeholder="Alternate Email-2"
                  className="border-0 p-0 focus:outline-none focus:ring-0"
                />
              </FloatingLabelField>

              {/* Landline Number */}
              <FloatingLabelField label="Landline Number">
                <Input
                  type="tel"
                  value={formData.landlineNumber}
                  onChange={(e) =>
                    handleInputChange("landlineNumber", e.target.value)
                  }
                  placeholder="Landline Number"
                  className="border-0 p-0 focus:outline-none focus:ring-0"
                />
              </FloatingLabelField>

              {/* Intercom Number */}
              <FloatingLabelField label="Intercom Number">
                <Input
                  type="text"
                  value={formData.intercomNumber}
                  onChange={(e) =>
                    handleInputChange("intercomNumber", e.target.value)
                  }
                  placeholder="Intercom Number"
                  className="border-0 p-0 focus:outline-none focus:ring-0"
                />
              </FloatingLabelField>

              {/* GST Number */}
              <FloatingLabelField label="GST Number">
                <Input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) =>
                    handleInputChange("gstNumber", e.target.value)
                  }
                  placeholder="GST Number"
                  className="border-0 p-0 focus:outline-none focus:ring-0"
                />
              </FloatingLabelField>

              {/* PAN Number */}
              <FloatingLabelField label="PAN Number">
                <Input
                  type="text"
                  value={formData.panNumber}
                  onChange={(e) =>
                    handleInputChange("panNumber", e.target.value)
                  }
                  placeholder="PAN Number"
                  className="border-0 p-0 focus:outline-none focus:ring-0"
                />
              </FloatingLabelField>

              {/* EV Connection */}
              <FloatingLabelField label="EV Connection">
                <Select
                  value={formData.evConnection}
                  onValueChange={(value) =>
                    handleInputChange("evConnection", value)
                  }
                >
                  <SelectTrigger className="border-0 p-0">
                    <SelectValue placeholder="NA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NA">NA</SelectItem>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </FloatingLabelField>

              {/* No. of Pets */}
              <FloatingLabelField label="No. of Pets">
                <Input
                  type="number"
                  value={formData.noOfPets}
                  onChange={(e) =>
                    handleInputChange("noOfPets", e.target.value)
                  }
                  placeholder="Pets"
                  className="border-0 p-0 focus:outline-none focus:ring-0"
                />
              </FloatingLabelField>

              {/* No. of Adult Family Members Residing */}
              <FloatingLabelField label="No. of Adults Residing">
                <Input
                  type="number"
                  value={formData.noOfAdults}
                  onChange={(e) =>
                    handleInputChange("noOfAdults", e.target.value)
                  }
                  placeholder="Adults"
                  className="border-0 p-0 focus:outline-none focus:ring-0"
                />
              </FloatingLabelField>

              {/* No. of Children Residing */}
              <FloatingLabelField label="No. of Children Residing">
                <Input
                  type="number"
                  value={formData.noOfChildren}
                  onChange={(e) =>
                    handleInputChange("noOfChildren", e.target.value)
                  }
                  placeholder="Children"
                  className="border-0 p-0 focus:outline-none focus:ring-0"
                />
              </FloatingLabelField>

              {/* Differently Abled */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">
                  Differently Abled:
                </Label>
                <RadioGroup
                  value={formData.differentlyAbled}
                  onValueChange={(value) =>
                    handleInputChange("differentlyAbled", value)
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="abled-yes" />
                    <Label htmlFor="abled-yes" className="font-normal cursor-pointer">
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="abled-no" />
                    <Label htmlFor="abled-no" className="font-normal cursor-pointer">
                      No
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={handleSubmit}
            className="bg-[#1e3a5f] hover:bg-[#152d4a] text-white px-12"
          >
            Submit
          </Button>
          <Button
            onClick={handleCancel}
            className="bg-gray-400 hover:bg-gray-500 text-white px-12"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
