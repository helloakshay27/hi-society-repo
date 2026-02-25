import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useApiConfig } from "@/hooks/useApiConfig";
import { getBaseUrl } from "@/utils/auth";

interface AddTDSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface OrganizationItem {
  id: number;
  name: string;
  active: boolean;
}

interface TDSSettings {
  organization_id: number;
  tds_applicable: boolean;
  tds_percentage: number;
  tds_limit: number;
}

export const AddTDSModal: React.FC<AddTDSModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { getFullUrl, getAuthHeader } = useApiConfig();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [tdsApplicable, setTdsApplicable] = useState(false);
  const [tdsPercentage, setTdsPercentage] = useState<string>("");
  const [tdsLimit, setTdsLimit] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      fetchOrganizations();
      // Reset form
      setSelectedOrgId("");
      setTdsApplicable(false);
      setTdsPercentage("");
      setTdsLimit("");
    }
  }, [isOpen]);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const storedBaseUrl = getBaseUrl();
      const storedToken = localStorage.getItem("token");

      let url: string;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (storedBaseUrl) {
        url = `${storedBaseUrl}/organizations.json?per_page=1000`;
      } else {
        url = getFullUrl("/organizations.json?per_page=1000");
      }

      if (storedToken) {
        headers["Authorization"] = `Bearer ${storedToken}`;
      } else {
        try {
          headers["Authorization"] = getAuthHeader();
        } catch (e) {
          console.warn("No token available:", e);
        }
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result && result.organizations && Array.isArray(result.organizations)) {
        // Filter only active organizations
        const activeOrgs = result.organizations.filter((org: OrganizationItem) => org.active);
        setOrganizations(activeOrgs);
      } else {
        throw new Error("Invalid organizations data format");
      }
    } catch (error: any) {
      console.error("Error fetching organizations:", error);
      toast.error(`Failed to load organizations: ${error.message}`);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOrgId) {
      toast.error("Please select an organization");
      return;
    }

    if (tdsApplicable && (!tdsPercentage || !tdsLimit)) {
      toast.error("Please fill in all TDS fields when TDS is applicable");
      return;
    }

    const percentage = parseFloat(tdsPercentage);
    const limit = parseFloat(tdsLimit);

    if (tdsApplicable && (isNaN(percentage) || isNaN(limit))) {
      toast.error("Please enter valid numbers for TDS percentage and limit");
      return;
    }

    if (tdsApplicable && (percentage < 0 || percentage > 100)) {
      toast.error("TDS percentage must be between 0 and 100");
      return;
    }

    if (tdsApplicable && limit < 0) {
      toast.error("TDS limit must be a positive number");
      return;
    }

    setSaving(true);
    try {
      const storedBaseUrl = getBaseUrl();
      const storedToken = localStorage.getItem("token");

      let url: string;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (storedBaseUrl) {
        url = `${storedBaseUrl}/admin/organization_tds_settings/create_or_update`;
      } else {
        url = getFullUrl("/admin/organization_tds_settings/create_or_update");
      }

      if (storedToken) {
        headers["Authorization"] = `Bearer ${storedToken}`;
        url += `?token=${storedToken}`;
      } else {
        try {
          headers["Authorization"] = getAuthHeader();
          const token = getAuthHeader().replace("Bearer ", "");
          url += `?token=${token}`;
        } catch (e) {
          console.warn("No token available:", e);
        }
      }

      const payload: TDSSettings = {
        organization_id: parseInt(selectedOrgId),
        tds_applicable: tdsApplicable,
        tds_percentage: tdsApplicable ? percentage : 0,
        tds_limit: tdsApplicable ? limit : 0,
      };

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      toast.success("TDS settings created successfully!");
      onSuccess();
    } catch (error: any) {
      console.error("Error creating TDS settings:", error);
      toast.error(`Failed to create TDS settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add TDS Settings</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#C72030]" />
            <span className="ml-2 text-gray-600">Loading organizations...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Selection */}
            <div className="space-y-2">
              <Label htmlFor="organization">
                Select Organization <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedOrgId}
                onValueChange={setSelectedOrgId}
                required
              >
                <SelectTrigger id="organization">
                  <SelectValue placeholder="Choose an organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id.toString()}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* TDS Applicable Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="tds-applicable" className="text-base font-medium">
                  TDS Applicable
                </Label>
                <p className="text-sm text-gray-600">
                  Enable or disable TDS for this organization
                </p>
              </div>
              <Switch
                id="tds-applicable"
                checked={tdsApplicable}
                onCheckedChange={setTdsApplicable}
              />
            </div>

            {/* TDS Percentage */}
            <div className="space-y-2">
              <Label htmlFor="tds-percentage">
                TDS Percentage (%) {tdsApplicable && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="tds-percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="Enter TDS percentage (e.g., 10)"
                value={tdsPercentage}
                onChange={(e) => setTdsPercentage(e.target.value)}
                disabled={!tdsApplicable}
                required={tdsApplicable}
              />
              <p className="text-xs text-gray-500">
                The percentage of tax to be deducted (0-100)
              </p>
            </div>

            {/* TDS Limit */}
            <div className="space-y-2">
              <Label htmlFor="tds-limit">
                TDS Limit (Amount) {tdsApplicable && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="tds-limit"
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter TDS limit amount (e.g., 100012)"
                value={tdsLimit}
                onChange={(e) => setTdsLimit(e.target.value)}
                disabled={!tdsApplicable}
                required={tdsApplicable}
              />
              <p className="text-xs text-gray-500">
                The minimum transaction amount above which TDS will be applied
              </p>
            </div>

            {/* Information Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                How TDS Works:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>TDS is only applied when the transaction amount exceeds the specified limit</li>
                <li>The percentage set will be deducted from qualifying transactions</li>
                <li>Changes take effect immediately after saving</li>
                <li>Disabling TDS will stop all deductions for this organization</li>
              </ul>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={saving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || !selectedOrgId}
                className="bg-[#C72030] hover:bg-[#A01828]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create TDS Settings
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
