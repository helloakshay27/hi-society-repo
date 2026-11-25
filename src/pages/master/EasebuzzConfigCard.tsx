import React, { useEffect, useState } from "react";
import { CreditCard, Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useApiConfig } from "@/hooks/useApiConfig";

// GET /pms/easebuzz/org_config?organization_id=:id
// key/salt come back masked (first 3 + last 2 chars).
interface EasebuzzConfig {
  exists: boolean;
  organization_id: number;
  enabled?: boolean;
  key?: string;
  salt?: string;
  mode?: "test" | "prod";
  auth_url?: string;
  callback_url?: string;
}

interface EasebuzzFormState {
  enabled: boolean;
  key: string;
  salt: string;
  mode: "test" | "prod";
  auth_url: string;
  callback_url: string;
}

const EMPTY_FORM: EasebuzzFormState = {
  enabled: true,
  key: "",
  salt: "",
  mode: "test",
  auth_url: "",
  callback_url: "",
};

interface EasebuzzConfigCardProps {
  organizationId: number;
}

export const EasebuzzConfigCard: React.FC<EasebuzzConfigCardProps> = ({
  organizationId,
}) => {
  const { getFullUrl, getAuthHeader } = useApiConfig();

  const [config, setConfig] = useState<EasebuzzConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<EasebuzzFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof EasebuzzFormState, string>>>({});

  const isConfigured = !!config?.exists;

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        getFullUrl(`/pms/easebuzz/org_config?organization_id=${organizationId}`),
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: getAuthHeader(),
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: EasebuzzConfig = await response.json();
      setConfig(data);
    } catch (error) {
      console.error("Error fetching Easebuzz config:", error);
      toast.error("Failed to load Easebuzz configuration");
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const openModal = () => {
    // Key and salt are masked in the GET response, so they must be re-entered
    // to update; everything else is pre-filled from the existing config.
    setForm(
      isConfigured
        ? {
            enabled: config?.enabled ?? true,
            key: "",
            salt: "",
            mode: config?.mode === "prod" ? "prod" : "test",
            auth_url: config?.auth_url || "",
            callback_url: config?.callback_url || "",
          }
        : EMPTY_FORM
    );
    setErrors({});
    setIsModalOpen(true);
  };

  const updateField = <K extends keyof EasebuzzFormState>(
    field: K,
    value: EasebuzzFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const next: Partial<Record<keyof EasebuzzFormState, string>> = {};
    if (!form.key.trim()) next.key = "Merchant key is required";
    if (!form.salt.trim()) next.salt = "Merchant salt is required";
    if (!form.callback_url.trim()) {
      next.callback_url = "Callback URL is required";
    } else if (!/^https?:\/\/\S+$/i.test(form.callback_url.trim())) {
      next.callback_url = "Enter a valid URL";
    }
    if (form.auth_url.trim() && !/^https?:\/\/\S+$/i.test(form.auth_url.trim())) {
      next.auth_url = "Enter a valid URL";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        organization_id: organizationId,
        enabled: form.enabled,
        key: form.key.trim(),
        salt: form.salt.trim(),
        mode: form.mode,
        callback_url: form.callback_url.trim(),
      };
      // auth_url is optional — backend derives it from mode when omitted.
      if (form.auth_url.trim()) payload.auth_url = form.auth_url.trim();

      const response = await fetch(getFullUrl("/pms/easebuzz/org_config"), {
        method: isConfigured ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || data?.message || `HTTP error! status: ${response.status}`);
      }

      toast.success(data?.message || "Easebuzz configuration saved");
      setIsModalOpen(false);
      // Re-fetch so the card shows the masked values the server returns.
      fetchConfig();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error saving Easebuzz config:", error);
      toast.error(`Failed to save Easebuzz configuration: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[#C72030]" />
          Easebuzz Payment Gateway
        </h2>
        {isConfigured && !loading && (
          <Button
            variant="outline"
            size="sm"
            onClick={openModal}
            className="flex items-center gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#C72030]" />
        </div>
      ) : isConfigured ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <span
              className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                config?.enabled ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {config?.enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Mode</label>
            <span
              className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                config?.mode === "prod"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {config?.mode === "prod" ? "Production" : "Test"}
            </span>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Merchant Key</label>
            <p className="text-sm text-gray-900 font-mono">{config?.key || "-"}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Merchant Salt</label>
            <p className="text-sm text-gray-900 font-mono">{config?.salt || "-"}</p>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Auth URL</label>
            <p className="text-sm text-gray-900 font-mono break-all">{config?.auth_url || "-"}</p>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Callback URL</label>
            <p className="text-sm text-gray-900 font-mono break-all">
              {config?.callback_url || "-"}
            </p>
          </div>
        </div>
      ) : (
        // Plain div (not <button>) + brand-* tokens (not #C72030 literals):
        // theme.css has global [class*="...#C72030"] / button overrides that
        // hijack text and hover background colours on this element.
        <div
          role="button"
          tabIndex={0}
          onClick={openModal}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openModal();
            }
          }}
          className="group w-full flex flex-col items-center justify-center gap-2 py-8 bg-white border-2 border-dashed border-gray-300 rounded-lg cursor-pointer transition-colors hover:border-brand hover:bg-brand-selected focus:outline-none focus-visible:border-brand"
        >
          <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center transition-colors group-hover:bg-brand">
            <Plus className="w-5 h-5 text-gray-600 transition-colors group-hover:text-white" />
          </span>
          <span className="text-sm font-medium text-gray-700 transition-colors group-hover:text-brand">
            Easebuzz is not configured
          </span>
          <span className="text-xs text-gray-500">
            Click to add payment gateway credentials
          </span>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={(open) => !submitting && setIsModalOpen(open)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isConfigured ? "Update Easebuzz Configuration" : "Configure Easebuzz"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label htmlFor="easebuzz-enabled">Enabled</Label>
                <p className="text-xs text-gray-500">
                  Allow residents to pay facility bookings via Easebuzz
                </p>
              </div>
              <Switch
                id="easebuzz-enabled"
                checked={form.enabled}
                onCheckedChange={(checked) => updateField("enabled", checked)}
                className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="easebuzz-key">
                  Merchant Key <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="easebuzz-key"
                  value={form.key}
                  onChange={(e) => updateField("key", e.target.value)}
                  placeholder={isConfigured ? config?.key : "Enter merchant key"}
                  autoComplete="off"
                />
                {errors.key && <p className="text-xs text-red-500">{errors.key}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="easebuzz-salt">
                  Merchant Salt <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="easebuzz-salt"
                  type="password"
                  value={form.salt}
                  onChange={(e) => updateField("salt", e.target.value)}
                  placeholder={isConfigured ? config?.salt : "Enter merchant salt"}
                  autoComplete="new-password"
                />
                {errors.salt && <p className="text-xs text-red-500">{errors.salt}</p>}
              </div>
            </div>
            {isConfigured && (
              <p className="text-xs text-gray-500 -mt-2">
                Key and salt are masked for security — re-enter both to save changes.
              </p>
            )}

            <div className="space-y-1.5">
              <Label>
                Mode <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.mode}
                onValueChange={(value) => updateField("mode", value as "test" | "prod")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">Test</SelectItem>
                  <SelectItem value="prod">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="easebuzz-callback">
                Callback URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="easebuzz-callback"
                value={form.callback_url}
                onChange={(e) => updateField("callback_url", e.target.value)}
                placeholder="https://<backend-host>/pms/easebuzz/callback"
              />
              {errors.callback_url && (
                <p className="text-xs text-red-500">{errors.callback_url}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="easebuzz-auth-url">Auth URL (optional)</Label>
              <Input
                id="easebuzz-auth-url"
                value={form.auth_url}
                onChange={(e) => updateField("auth_url", e.target.value)}
                placeholder="Auto-set from mode if left blank"
              />
              {errors.auth_url && <p className="text-xs text-red-500">{errors.auth_url}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-[#C72030] hover:bg-[#A01828] text-white"
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isConfigured ? "Update" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EasebuzzConfigCard;
