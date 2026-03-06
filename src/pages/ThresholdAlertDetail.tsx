import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Building2,
  Mail,
  Pencil,
  Shield,
  Wallet,
} from "lucide-react";
import { getFullUrl, getAuthHeader, API_CONFIG } from "@/config/apiConfig";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────
interface RawDetail {
  alert_enabled: string | null;
  org_admin_threshold: string | number;
  super_admin_threshold: string | number;
  org_admin_emails: string[];
  super_admin_emails: string[];
}

interface AlertForm {
  organization_id: number;
  organization_name: string;
  alert_enabled: boolean;
  org_admin_threshold: number;
  super_admin_threshold: number;
  org_admin_emails: string; // comma-separated
  super_admin_emails: string; // comma-separated
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────
const parseAlertEnabled = (val: string | null | undefined): boolean =>
  val === "alert_enabled" || val === "true";

/** Clean stringified JSON array elements like ["\"ops@system.com\""] */
const parseEmails = (emails: string[]): string => {
  if (!emails || emails.length === 0) return "";
  return emails
    .flatMap((e) => {
      const cleaned = e.replace(/[\[\]"\\]/g, "").trim();
      return cleaned.split(",").map((x) => x.trim()).filter(Boolean);
    })
    .filter(Boolean)
    .join(", ");
};

const parseEmailsArray = (emails: string[]): string[] => {
  if (!emails || emails.length === 0) return [];
  return emails
    .flatMap((e) => {
      const cleaned = e.replace(/[\[\]"\\]/g, "").trim();
      return cleaned.split(",").map((x) => x.trim()).filter(Boolean);
    })
    .filter(Boolean);
};

// ────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────
const ThresholdAlertDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = API_CONFIG.TOKEN || "";

  const [detail, setDetail] = useState<AlertForm | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<AlertForm | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch detail ─────────────────────────────────────────────
  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const url = getFullUrl(
        `/admin/wallet_alert_settings/${id}?organization_id=${id}&token=${token}`
      );
      const res = await fetch(url, {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: RawDetail = await res.json();

      const flat: AlertForm = {
        organization_id: Number(id),
        organization_name: "", // not returned by detail endpoint
        alert_enabled: parseAlertEnabled(data.alert_enabled),
        org_admin_threshold: Number(data.org_admin_threshold) || 0,
        super_admin_threshold: Number(data.super_admin_threshold) || 0,
        org_admin_emails: parseEmails(data.org_admin_emails || []),
        super_admin_emails: parseEmails(data.super_admin_emails || []),
      };
      setDetail(flat);
    } catch {
      toast.error("Failed to fetch threshold alert details.");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // ── Edit modal helpers ──────────────────────────────────────
  const openEdit = () => {
    if (!detail) return;
    setEditForm({ ...detail });
    setFormError(null);
    setFormSuccess(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleFormChange = (
    field: keyof AlertForm,
    value: string | number | boolean
  ) => {
    setEditForm((prev) => (prev ? { ...prev, [field]: value } : prev));
    setFormError(null);
    setFormSuccess(null);
  };

  const handleSubmit = async () => {
    if (!editForm) return;
    if (editForm.org_admin_threshold <= 0) {
      setFormError("Org Admin Threshold must be greater than 0.");
      return;
    }
    if (editForm.super_admin_threshold <= 0) {
      setFormError("Super Admin Threshold must be greater than 0.");
      return;
    }
    if (!editForm.org_admin_emails.trim()) {
      setFormError("Please enter at least one Org Admin email.");
      return;
    }
    if (!editForm.super_admin_emails.trim()) {
      setFormError("Please enter at least one Super Admin email.");
      return;
    }

    setSubmitting(true);
    // API body: emails as comma-separated string
    const body = {
      organization_id: editForm.organization_id,
      alert_enabled: editForm.alert_enabled ? "alert_enabled" : "alert_disabled",
      org_admin_threshold: editForm.org_admin_threshold,
      super_admin_threshold: editForm.super_admin_threshold,
      org_admin_emails: editForm.org_admin_emails.trim(),
      super_admin_emails: editForm.super_admin_emails.trim(),
    };

    try {
      const url = getFullUrl(
        `/admin/wallet_alert_settings?organization_id=${editForm.organization_id}`
      );
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || `Error ${res.status}`);
      }
      setFormSuccess("Setting updated successfully!");
      toast.success("Threshold alert setting updated!");
      await fetchDetail();
      setTimeout(() => closeModal(), 1000);
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Failed to save setting."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render helpers ─────────────────────────────────────────
  const InfoRow = ({
    label,
    value,
    icon: Icon,
  }: {
    label: string;
    value: React.ReactNode;
    icon?: React.ElementType;
  }) => (
    <div className="flex items-start gap-3 py-3 border-b border-[#e5e1d8] last:border-0">
      {Icon && (
        <div className="mt-0.5 w-8 h-8 rounded-full bg-[#F2EEE9] flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-[#C72030]" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
          {label}
        </p>
        <div className="mt-0.5 text-sm text-[#1a1a1a] font-medium break-words">
          {value}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#C72030]" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-6 text-center text-gray-500">
        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
        <p>No data found for this organization.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/settings/threshold-alerts")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
      </div>
    );
  }

  const orgEmails = parseEmailsArray(
    detail.org_admin_emails.split(",").map((e) => e.trim()).filter(Boolean)
  );
  const superEmails = parseEmailsArray(
    detail.super_admin_emails.split(",").map((e) => e.trim()).filter(Boolean)
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6 space-y-6">
      <Toaster position="top-right" richColors closeButton />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/settings/threshold-alerts")}
            className="text-gray-500 hover:text-[#C72030]"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <Bell className="w-5 h-5 text-[#C72030]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1a1a1a]">
              Threshold Alert Details
            </h1>
            <p className="text-sm text-gray-500">
              Organization ID: {detail.organization_id}
            </p>
          </div>
        </div>
        <Button
          onClick={openEdit}
          className="bg-[#C72030] hover:bg-[#A01828] text-white flex items-center gap-2"
        >
          <Pencil className="w-4 h-4" />
          Edit Settings
        </Button>
      </div>

      {/* Status banner */}
      <div
        className={`rounded-lg px-4 py-3 flex items-center gap-3 ${
          detail.alert_enabled
            ? "bg-green-50 border border-green-200"
            : "bg-gray-50 border border-gray-200"
        }`}
      >
        <AlertCircle
          className={`w-5 h-5 ${detail.alert_enabled ? "text-green-600" : "text-gray-400"}`}
        />
        <span
          className={`text-sm font-semibold ${detail.alert_enabled ? "text-green-700" : "text-gray-500"}`}
        >
          Threshold Alerts are{" "}
          {detail.alert_enabled ? "Active" : "Inactive"} for this organization
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threshold Settings */}
        <Card className="border-[#e5e1d8] shadow-none">
          <CardHeader className="bg-gradient-to-r from-[#f6f4ee] to-[#e5e1d8] py-3 px-4 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-[#1a1a1a] text-sm font-semibold">
              <Wallet className="h-4 w-4 text-[#C72030]" />
              Threshold Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-1">
            <InfoRow
              label="Organization ID"
              value={`#${detail.organization_id}`}
              icon={Building2}
            />
            <InfoRow
              label="Org Admin Threshold"
              value={`₹${detail.org_admin_threshold.toLocaleString("en-IN")}`}
              icon={Wallet}
            />
            <InfoRow
              label="Super Admin Threshold"
              value={`₹${detail.super_admin_threshold.toLocaleString("en-IN")}`}
              icon={Shield}
            />
            <InfoRow
              label="Alert Status"
              value={
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    detail.alert_enabled
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {detail.alert_enabled ? "Active" : "Inactive"}
                </span>
              }
              icon={Bell}
            />
          </CardContent>
        </Card>

        {/* Email Recipients */}
        <Card className="border-[#e5e1d8] shadow-none">
          <CardHeader className="bg-gradient-to-r from-[#f6f4ee] to-[#e5e1d8] py-3 px-4 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-[#1a1a1a] text-sm font-semibold">
              <Mail className="h-4 w-4 text-[#C72030]" />
              Alert Recipients
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Org Admin Emails */}
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
                Org Admin Email(s)
              </p>
              {orgEmails.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No emails configured</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {orgEmails.map((email, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 bg-[#F2EEE9] text-[#C72030] text-xs font-medium px-2.5 py-1 rounded-full"
                    >
                      <Mail className="w-3 h-3" />
                      {email}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Super Admin Emails */}
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
                Super Admin Email(s)
              </p>
              {superEmails.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No emails configured</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {superEmails.map((email, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full"
                    >
                      <Mail className="w-3 h-3" />
                      {email}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ───── Edit Modal ───── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1a1a1a]">
              <Bell className="h-5 w-5 text-[#C72030]" />
              Edit Threshold Alert — Org #{editForm?.organization_id}
            </DialogTitle>
          </DialogHeader>

          {editForm && (
            <div className="space-y-5 py-2">
              {formError && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-700">
                    {formError}
                  </AlertDescription>
                </Alert>
              )}
              {formSuccess && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-700">
                    {formSuccess}
                  </AlertDescription>
                </Alert>
              )}

              {/* Alert toggle */}
              <Card className="border-[#e5e1d8] shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#C72030] text-sm">
                          Threshold Alerts
                        </p>
                        <p className="text-xs text-gray-500">
                          Get notified when balance is low
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          editForm.alert_enabled
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {editForm.alert_enabled ? "Active" : "Inactive"}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={editForm.alert_enabled ? "true" : "false"}
                        onClick={() =>
                          handleFormChange("alert_enabled", !editForm.alert_enabled)
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          editForm.alert_enabled ? "bg-[#C72030]" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            editForm.alert_enabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Thresholds */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[#1a1a1a]">
                    Org Admin Threshold (₹){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center border border-[#e5e1d8] rounded bg-white focus-within:border-[#C72030]">
                    <span className="px-3 text-gray-500 font-medium">₹</span>
                    <input
                      type="number"
                      min={1}
                      title="Org Admin Threshold"
                      placeholder="e.g. 50000"
                      className="flex-1 py-2 px-2 outline-none bg-transparent border-0 text-sm"
                      value={editForm.org_admin_threshold || ""}
                      onChange={(e) =>
                        handleFormChange(
                          "org_admin_threshold",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Alert org admins when balance falls below this amount
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[#1a1a1a]">
                    Super Admin Threshold (₹){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center border border-[#e5e1d8] rounded bg-white focus-within:border-[#C72030]">
                    <span className="px-3 text-gray-500 font-medium">₹</span>
                    <input
                      type="number"
                      min={1}
                      title="Super Admin Threshold"
                      placeholder="e.g. 20000"
                      className="flex-1 py-2 px-2 outline-none bg-transparent border-0 text-sm"
                      value={editForm.super_admin_threshold || ""}
                      onChange={(e) =>
                        handleFormChange(
                          "super_admin_threshold",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Alert super admins when balance falls below this amount
                  </p>
                </div>
              </div>

              {/* Emails */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[#1a1a1a]">
                    Org Admin Email(s) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="admin@org.com, accounts@org.com"
                    value={editForm.org_admin_emails}
                    onChange={(e) =>
                      handleFormChange("org_admin_emails", e.target.value)
                    }
                    className="border-[#e5e1d8] focus:border-[#C72030] focus:ring-[#C72030]"
                  />
                  <p className="text-xs text-gray-400">
                    Separate multiple emails with commas
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[#1a1a1a]">
                    Super Admin Email(s) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="ops@system.com, finance@system.com"
                    value={editForm.super_admin_emails}
                    onChange={(e) =>
                      handleFormChange("super_admin_emails", e.target.value)
                    }
                    className="border-[#e5e1d8] focus:border-[#C72030] focus:ring-[#C72030]"
                  />
                  <p className="text-xs text-gray-400">
                    Separate multiple emails with commas
                  </p>
                </div>
              </div>

              {/* Recipients preview */}
              {(editForm.org_admin_emails || editForm.super_admin_emails) && (
                <div className="bg-[#ede8df] rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[#C72030] mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-[#C72030] text-sm">
                      Alert Recipients Preview
                    </p>
                    {editForm.org_admin_emails && (
                      <p className="text-xs text-[#1a1a1a] mt-1">
                        <span className="font-medium">Org Admins:</span>{" "}
                        {editForm.org_admin_emails}
                      </p>
                    )}
                    {editForm.super_admin_emails && (
                      <p className="text-xs text-[#1a1a1a] mt-0.5">
                        <span className="font-medium">Super Admins:</span>{" "}
                        {editForm.super_admin_emails}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={closeModal}
              disabled={submitting}
              className="border-[#e5e1d8] text-[#1a1a1a]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-[#C72030] hover:bg-[#A01828] text-white px-6"
            >
              {submitting ? "Saving…" : "Update Setting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ThresholdAlertDetail;
