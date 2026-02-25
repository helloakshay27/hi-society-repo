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
import { Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useApiConfig } from "@/hooks/useApiConfig";
import { getBaseUrl } from "@/utils/auth";

interface EditTDSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizationId: number;
}

interface TDSSettings {
  organization_id: number;
  tds_applicable: boolean;
  tds_percentage: number;
  tds_limit: number;
}

export const EditTDSModal: React.FC<EditTDSModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  organizationId,
}) => {
  const { getFullUrl, getAuthHeader } = useApiConfig();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [organizationName, setOrganizationName] = useState("");
  const [tdsApplicable, setTdsApplicable] = useState(false);
  const [tdsPercentage, setTdsPercentage] = useState<string>("");
  const [tdsLimit, setTdsLimit] = useState<string>("");

  useEffect(() => {
    if (isOpen && organizationId) {
      fetchOrganizationAndTDS();
    }
  }, [isOpen, organizationId]);

  const fetchOrganizationAndTDS = async () => {
    setLoading(true);
    try {
      // Fetch organization details
      const storedBaseUrl = getBaseUrl();
      const storedToken = localStorage.getItem("token");

      let orgUrl: string;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (storedBaseUrl) {
        orgUrl = `${storedBaseUrl}/organizations/${organizationId}.json`;
      } else {
        orgUrl = getFullUrl(`/organizations/${organizationId}.json`);
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

      const orgResponse = await fetch(orgUrl, {
        method: "GET",
        headers,
      });

      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        setOrganizationName(orgData.name || "");
      }

      // Fetch TDS settings
      let tdsUrl: string;
      if (storedBaseUrl) {
        tdsUrl = `${storedBaseUrl}/admin/organization_tds_settings/${organizationId}`;
      } else {
        tdsUrl = getFullUrl(`/admin/organization_tds_settings/${organizationId}`);
      }

      if (storedToken) {
        tdsUrl += `?token=${storedToken}`;
      } else {
        try {
          const token = getAuthHeader().replace("Bearer ", "");
          tdsUrl += `?token=${token}`;
        } catch (e) {
          console.warn("No token available:", e);
        }
      }

      const tdsResponse = await fetch(tdsUrl, {
        method: "GET",
        headers,
      });

      if (tdsResponse.ok) {
        const tdsData = await tdsResponse.json();
        setTdsApplicable(tdsData.tds_applicable || false);
        setTdsPercentage(tdsData.tds_percentage?.toString() || "");
        setTdsLimit(tdsData.tds_limit?.toString() || "");
      } else {
        // No TDS settings found, set defaults
        setTdsApplicable(false);
        setTdsPercentage("");
        setTdsLimit("");
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        organization_id: organizationId,
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

      toast.success("TDS settings saved successfully!");
      onSuccess();
    } catch (error: any) {
      console.error("Error saving TDS settings:", error);
      toast.error(`Failed to save TDS settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {loading ? "Loading..." : `Edit TDS Settings - ${organizationName}`}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#C72030]" />
            <span className="ml-2 text-gray-600">Loading TDS settings...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
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
                disabled={saving}
                className="bg-[#C72030] hover:bg-[#A01828]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
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
