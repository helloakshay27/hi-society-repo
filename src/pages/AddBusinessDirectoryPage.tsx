import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import axios from "axios";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

interface SubCategory {
  id: string;
  name: string;
  bd_category_id: number;
}

const AddBusinessDirectoryPage: React.FC = () => {
  const baseUrl = localStorage.getItem("baseUrl");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    address: "",
    mobile: "",
    landline1: "",
    landline2: "",
    extIntercom: "",
    primaryEmail: "",
    secondaryEmail: "",
    website: "",
    category: "",
    subCategory: "",
    keyOffering: "",
    description: "",
    profile: "",
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [gallery, setGallery] = useState<File[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchSubCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        `https://${baseUrl}/crm/admin/bd_categories.json`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCategories(response.data.bd_categories);
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch categories");
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await axios.get(
        `https://${baseUrl}/crm/admin/bd_sub_categories.json`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSubCategories(response.data.bd_sub_categories);
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch sub categories");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setLogo(e.target.files[0]);
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setGallery((prev) => [...prev, e.target.files![0]]);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGallery((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.companyName || !form.mobile || !form.primaryEmail || !form.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const payload = {
        business_directory: {
          company_name: form.companyName,
          contact_name: form.contactPerson,
          mobile: form.mobile,
          landline_1: form.landline1,
          landline_2: form.landline2,
          extension: form.extIntercom,
          primary_email: form.primaryEmail,
          secondary_email: form.secondaryEmail,
          website: form.website,
          category_id: parseInt(form.category),
          sub_category_id: form.subCategory ? parseInt(form.subCategory) : null,
          key_offering: form.keyOffering,
          description: form.description,
          profile: form.profile,
          active: true,
          address: form.address,
        },
      };

      await axios.post(
        `https://${baseUrl}/crm/admin/business_directories.json`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Upload Logo if exists
      // Note: The curl example was JSON only, but typically file uploads require FormData or separate calls.
      // Assuming standard JSON payload for data first as per user request.
      // If image upload is needed, it might be a separate call or multipart/form-data.
      // Given the user request specifically asked for the JSON payload structure, I will stick to that first.
      // However, usually "company_logo" would be part of the payload if supported, or a separate upload.
      // For now, I'll assume the JSON payload is the primary goal and warn/comment about images.

      toast.success("Business directory added successfully");
      navigate(-1);
    } catch (error) {
      console.error(error);
      toast.error("Failed to add business directory");
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const filteredSubCategories = subCategories.filter(
    (sub) => sub.bd_category_id === parseInt(form.category)
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Add Business Directory
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Create a new business listing for the directory
              </p>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-sm ring-1 ring-gray-200 bg-white overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-[#C72030]/10 flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-[#C72030]" />
              </div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Business Details
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Logo Upload Section */}
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/30 hover:bg-gray-50/80 transition-colors">
                <div className="text-center space-y-4">
                  <div className="relative group">
                    <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-white flex items-center justify-center">
                      {logo ? (
                        <img
                          src={URL.createObjectURL(logo)}
                          alt="Company Logo"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-12 w-12 text-gray-300" />
                      )}
                    </div>
                    <label
                      htmlFor="logo-upload"
                      className="absolute bottom-0 right-0 p-2 bg-[#C72030] rounded-full text-white cursor-pointer hover:bg-[#a31b28] shadow-lg transition-transform hover:scale-105"
                    >
                      <Upload className="h-4 w-4" />
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                    </label>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Company Logo
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG up to 5MB
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-100" />

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="Enter company name"
                    value={form.companyName}
                    onChange={(e) =>
                      handleInputChange("companyName", e.target.value)
                    }
                    className="h-10 border-gray-200 focus:border-[#C72030] focus:ring-[#C72030]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person Name</Label>
                  <Input
                    id="contactPerson"
                    placeholder="Enter contact person name"
                    value={form.contactPerson}
                    onChange={(e) =>
                      handleInputChange("contactPerson", e.target.value)
                    }
                    className="h-10 border-gray-200 focus:border-[#C72030] focus:ring-[#C72030]/20"
                  />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter complete address"
                    value={form.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    className="min-h-[80px] border-gray-200 focus:border-[#C72030] focus:ring-[#C72030]/20 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile">
                    Mobile Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
                      +91
                    </span>
                    <Input
                      id="mobile"
                      placeholder="9876543210"
                      value={form.mobile}
                      onChange={(e) =>
                        handleInputChange("mobile", e.target.value)
                      }
                      className="rounded-l-none border-gray-200 focus:border-[#C72030] focus:ring-[#C72030]/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landline1">Landline 1</Label>
                  <Input
                    id="landline1"
                    placeholder="Enter landline number"
                    value={form.landline1}
                    onChange={(e) =>
                      handleInputChange("landline1", e.target.value)
                    }
                    className="h-10 border-gray-200 focus:border-[#C72030] focus:ring-[#C72030]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landline2">Landline 2</Label>
                  <Input
                    id="landline2"
                    placeholder="Enter landline number"
                    value={form.landline2}
                    onChange={(e) =>
                      handleInputChange("landline2", e.target.value)
                    }
                    className="h-10 border-gray-200 focus:border-[#C72030] focus:ring-[#C72030]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extIntercom">Extension / Intercom</Label>
                  <Input
                    id="extIntercom"
                    placeholder="Ext / Intercom"
                    value={form.extIntercom}
                    onChange={(e) =>
                      handleInputChange("extIntercom", e.target.value)
                    }
                    className="h-10 border-gray-200 focus:border-[#C72030] focus:ring-[#C72030]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryEmail">
                    Primary Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="primaryEmail"
                    type="email"
                    placeholder="email@example.com"
                    value={form.primaryEmail}
                    onChange={(e) =>
                      handleInputChange("primaryEmail", e.target.value)
                    }
                    className="h-10 border-gray-200 focus:border-[#C72030] focus:ring-[#C72030]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryEmail">Secondary Email</Label>
                  <Input
                    id="secondaryEmail"
                    type="email"
                    placeholder="secondary@example.com"
                    value={form.secondaryEmail}
                    onChange={(e) =>
                      handleInputChange("secondaryEmail", e.target.value)
                    }
                    className="h-10 border-gray-200 focus:border-[#C72030] focus:ring-[#C72030]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    placeholder="www.example.com"
                    value={form.website}
                    onChange={(e) =>
                      handleInputChange("website", e.target.value)
                    }
                    className="h-10 border-gray-200 focus:border-[#C72030] focus:ring-[#C72030]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) =>
                      handleInputChange("category", value)
                    }
                  >
                    <SelectTrigger className="h-10 border-gray-200 focus:border-[#C72030] focus:ring-[#C72030]/20">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subCategory">Sub Category</Label>
                  <Select
                    value={form.subCategory}
                    onValueChange={(value) =>
                      handleInputChange("subCategory", value)
                    }
                    disabled={!form.category}
                  >
                    <SelectTrigger className="h-10 border-gray-200 focus:border-[#C72030] focus:ring-[#C72030]/20">
                      <SelectValue placeholder="Select Sub Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSubCategories.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id.toString()}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label htmlFor="keyOffering">Key Offering</Label>
                  <Input
                    id="keyOffering"
                    placeholder="Enter key offerings"
                    value={form.keyOffering}
                    onChange={(e) =>
                      handleInputChange("keyOffering", e.target.value)
                    }
                    className="h-10 border-gray-200 focus:border-[#C72030] focus:ring-[#C72030]/20"
                  />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter business description"
                    value={form.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    className="min-h-[100px] border-gray-200 focus:border-[#C72030] focus:ring-[#C72030]/20"
                  />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label htmlFor="profile">Profile</Label>
                  <Textarea
                    id="profile"
                    placeholder="Enter business profile"
                    value={form.profile}
                    onChange={(e) =>
                      handleInputChange("profile", e.target.value)
                    }
                    className="min-h-[100px] border-gray-200 focus:border-[#C72030] focus:ring-[#C72030]/20"
                  />
                </div>
              </div>

              <Separator className="bg-gray-100" />

              {/* Gallery Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">
                      Gallery Images
                    </h3>
                    <p className="text-sm text-gray-500">
                      Add images to showcase your business
                    </p>
                  </div>
                  <label htmlFor="gallery-upload">
                    <Button
                      variant="outline"
                      className="cursor-pointer border-dashed border-gray-300 hover:border-[#C72030] hover:text-[#C72030] transition-colors"
                      asChild
                    >
                      <span className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Add Images
                      </span>
                    </Button>
                    <input
                      id="gallery-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleGalleryChange}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {gallery.map((file, idx) => (
                    <div
                      key={idx}
                      className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Gallery ${idx + 1}`}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(idx)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {gallery.length === 0 && (
                    <div className="col-span-full py-8 text-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                      <ImageIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        No images added yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="px-6 bg-white hover:bg-gray-50 text-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="px-6 bg-[#C72030] hover:bg-[#a31b28] text-white shadow-sm"
          >
            Submit Listing
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddBusinessDirectoryPage;
