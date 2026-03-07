import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { AlertCircle, Bell, Eye, Pencil, Plus, Wallet } from "lucide-react";
import { getFullUrl, getAuthHeader, API_CONFIG } from "@/config/apiConfig";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────
interface Organization {
  id: number;
  name: string;
}

interface RawSettings {
  alert_enabled: string | null;
  org_admin_threshold: string | number;
  super_admin_threshold: string | number;
  org_admin_emails: string[];
  super_admin_emails: string[];
}

interface OrgAlertRow {
  organization_id: number;
  organization_name: string;
  settings: RawSettings;
}

// Flat form shape used internally
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

const flattenRow = (row: OrgAlertRow): AlertForm => ({
  organization_id: row.organization_id,
  organization_name: row.organization_name,
  alert_enabled: parseAlertEnabled(row.settings?.alert_enabled),
  org_admin_threshold: Number(row.settings?.org_admin_threshold) || 0,
  super_admin_threshold: Number(row.settings?.super_admin_threshold) || 0,
  org_admin_emails: parseEmails(row.settings?.org_admin_emails || []),
  super_admin_emails: parseEmails(row.settings?.super_admin_emails || []),
});

const emptyForm = (): AlertForm => ({
  organization_id: 0,
  organization_name: "",
  alert_enabled: true,
  org_admin_threshold: 0,
  super_admin_threshold: 0,
  org_admin_emails: "",
  super_admin_emails: "",
});

const PAGE_SIZE = 10;

// ────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────
const ThresholdAlerts: React.FC = () => {
  const navigate = useNavigate();
  const token = API_CONFIG.TOKEN || "";

  // List data
  const [rows, setRows] = useState<AlertForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination (client-side)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Organizations (for Add dropdown)
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("edit");
  const [editForm, setEditForm] = useState<AlertForm>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch organizations for Add dropdown ──────────────────
  const fetchOrgs = useCallback(async () => {
    setLoadingOrgs(true);
    try {
      const url = getFullUrl(`/organizations.json?token=${token}`);
      const res = await fetch(url, {
        headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOrganizations(data.organizations || []);
    } catch {
      setOrganizations([]);
    } finally {
      setLoadingOrgs(false);
    }
  }, [token]);

  // ── Fetch all orgs alert settings ─────────────────────────
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const url = getFullUrl(`/admin/wallet_alert_settings?token=${token}`);
      const res = await fetch(url, {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: OrgAlertRow[] = await res.json();
      const flat = (Array.isArray(data) ? data : []).map(flattenRow);
      setRows(flat);
      setTotalPages(Math.ceil(flat.length / PAGE_SIZE));
      setCurrentPage(1);
    } catch {
      toast.error("Failed to fetch threshold alert settings.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchList();
    fetchOrgs();
  }, [fetchList, fetchOrgs]);

  // ── Search / pagination helpers ─────────────────────────────
  const filtered = rows.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.organization_name.toLowerCase().includes(q) ||
      r.org_admin_emails.toLowerCase().includes(q) ||
      r.super_admin_emails.toLowerCase().includes(q)
    );
  });

  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    setTotalPages(
      Math.ceil(
        rows.filter((r) => {
          const q = term.toLowerCase();
          return (
            r.organization_name.toLowerCase().includes(q) ||
            r.org_admin_emails.toLowerCase().includes(q) ||
            r.super_admin_emails.toLowerCase().includes(q)
          );
        }).length / PAGE_SIZE
      )
    );
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) setCurrentPage(page);
  };

  // ── Modal helpers ──────────────────────────────────────────
  const openAdd = () => {
    setModalMode("add");
    setEditForm(emptyForm());
    setFormError(null);
    setFormSuccess(null);
    setModalOpen(true);
  };

  const openEdit = (row: AlertForm) => {
    setModalMode("edit");
    setEditForm({ ...row });
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
    setEditForm((prev) => ({ ...prev, [field]: value }));
    setFormError(null);
    setFormSuccess(null);
  };

  const handleSubmit = async () => {
    if (!editForm.organization_id) {
      setFormError("Organization ID is missing.");
      return;
    }
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
    // API body: emails as comma-separated string (not array)
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
        `/admin/wallet_alert_settings/${editForm.organization_id}?organization_id=${editForm.organization_id}`
      );
      // PATCH for create, PUT for edit
      const method = modalMode === "add" ? "PATCH" : "PATCH";
      const res = await fetch(url, {
        method,
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
      const successMsg = modalMode === "add"
        ? "Alert setting created successfully!"
        : "Alert setting updated successfully!";
      setFormSuccess(successMsg);
      toast.success(successMsg);
      await fetchList();
      setTimeout(() => closeModal(), 1000);
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Failed to save setting."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Custom actions (Add button) ────────────────────────────
  const renderCustomActions = () => (
    <Button
      onClick={openAdd}
      className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium flex items-center gap-2"
    >
      <Plus className="w-4 h-4" />
      Add
    </Button>
  );

  // ── Table columns ───────────────────────────────────────────
  const columns = [
    { key: "actions", label: "Action", sortable: false },
    { key: "sr", label: "Sr No", sortable: false },
    { key: "organization_name", label: "Organization", sortable: true },
    { key: "alert_enabled", label: "Status", sortable: false },
    { key: "org_admin_threshold", label: "Org Admin Threshold (₹)", sortable: true },
    { key: "super_admin_threshold", label: "Super Admin Threshold (₹)", sortable: true },
    { key: "org_admin_emails", label: "Org Admin Emails", sortable: false },
    { key: "super_admin_emails", label: "Super Admin Emails", sortable: false },
  ];

  const renderCell = (item: AlertForm, columnKey: string, index: number) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                navigate(`/settings/threshold-alerts/${item.organization_id}`)
              }
              title="View"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEdit(item)}
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>
        );
      case "sr":
        return (
          <span className="text-sm text-gray-700">
            {(currentPage - 1) * PAGE_SIZE + index + 1}
          </span>
        );
      case "organization_name":
        return (
          <span className="font-medium text-[#1a1a1a] text-sm">
            {item.organization_name || `Org #${item.organization_id}`}
          </span>
        );
      case "alert_enabled":
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              item.alert_enabled
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {item.alert_enabled ? "Active" : "Inactive"}
          </span>
        );
      case "org_admin_threshold":
        return (
          <span className="text-sm text-gray-700">
            ₹{item.org_admin_threshold.toLocaleString("en-IN")}
          </span>
        );
      case "super_admin_threshold":
        return (
          <span className="text-sm text-gray-700">
            ₹{item.super_admin_threshold.toLocaleString("en-IN")}
          </span>
        );
      case "org_admin_emails":
        return (
          <span
            className="text-sm text-gray-700 max-w-[180px] truncate block"
            title={item.org_admin_emails}
          >
            {item.org_admin_emails || "-"}
          </span>
        );
      case "super_admin_emails":
        return (
          <span
            className="text-sm text-gray-700 max-w-[180px] truncate block"
            title={item.super_admin_emails}
          >
            {item.super_admin_emails || "-"}
          </span>
        );
      default:
        return "-";
    }
  };

  // ── Pagination items ────────────────────────────────────────
  const renderPaginationItems = () => {
    const items: React.ReactNode[] = [];
    const delta = 2;
    const left = currentPage - delta;
    const right = currentPage + delta;
    let last = 0;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i <= right)) {
        if (last && i - last > 1) {
          items.push(
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          );
        }
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(i);
              }}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
        last = i;
      }
    }
    return items;
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Toaster position="top-right" richColors closeButton />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <Bell className="w-5 h-5 text-[#C72030]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Threshold Alerts</h1>
          <p className="text-sm text-gray-500">
            Manage wallet balance threshold alerts per organization
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#F6F4EE] p-6 rounded-lg shadow-[0px_1px_8px_rgba(45,45,45,0.05)] flex items-center gap-4">
          <div className="w-14 h-14 bg-[#C4B89D54] flex items-center justify-center rounded">
            <Bell className="w-6 h-6 text-[#C72030]" />
          </div>
          <div>
            <div className="text-2xl font-semibold text-[#1A1A1A]">{rows.length}</div>
            <div className="text-sm font-medium text-[#1A1A1A]">Total Organizations</div>
          </div>
        </div>
        <div className="bg-[#F6F4EE] p-6 rounded-lg shadow-[0px_1px_8px_rgba(45,45,45,0.05)] flex items-center gap-4">
          <div className="w-14 h-14 bg-[#C4B89D54] flex items-center justify-center rounded">
            <AlertCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <div className="text-2xl font-semibold text-[#1A1A1A]">
              {rows.filter((r) => r.alert_enabled).length}
            </div>
            <div className="text-sm font-medium text-[#1A1A1A]">Active Alerts</div>
          </div>
        </div>
        <div className="bg-[#F6F4EE] p-6 rounded-lg shadow-[0px_1px_8px_rgba(45,45,45,0.05)] flex items-center gap-4">
          <div className="w-14 h-14 bg-[#C4B89D54] flex items-center justify-center rounded">
            <Wallet className="w-6 h-6 text-gray-500" />
          </div>
          <div>
            <div className="text-2xl font-semibold text-[#1A1A1A]">
              {rows.filter((r) => !r.alert_enabled).length}
            </div>
            <div className="text-sm font-medium text-[#1A1A1A]">Inactive Alerts</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <EnhancedTable
        data={paginated}
        columns={columns}
        renderCell={renderCell}
        pagination={false}
        enableExport={true}
        exportFileName="threshold-alerts"
        storageKey="threshold-alerts-table"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search by organization or email…"
        leftActions={renderCustomActions()}
        loading={loading}
        loadingMessage="Loading threshold alert settings…"
      />

      {/* Pagination */}
      {!searchTerm && totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(currentPage - 1);
                  }}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(currentPage + 1);
                  }}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* ───── Edit Modal ───── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1a1a1a]">
              <Bell className="h-5 w-5 text-[#C72030]" />
              {modalMode === "add"
                ? "Add Threshold Alert Setting"
                : `Edit Threshold Alert — ${editForm.organization_name}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {formError && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-700">{formError}</AlertDescription>
              </Alert>
            )}
            {formSuccess && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-700">{formSuccess}</AlertDescription>
              </Alert>
            )}

            {/* Organization dropdown — shown only in Add mode */}
            {modalMode === "add" && (
              <div className="space-y-1.5">
                <Label className="text-[#1a1a1a]">
                  Organization <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={editForm.organization_id ? editForm.organization_id.toString() : ""}
                  onValueChange={(v) => {
                    const org = organizations.find((o) => o.id === parseInt(v));
                    setEditForm((prev) => ({
                      ...prev,
                      organization_id: parseInt(v),
                      organization_name: org?.name || "",
                    }));
                    setFormError(null);
                  }}
                  disabled={loadingOrgs}
                >
                  <SelectTrigger className="border-[#e5e1d8] focus:border-[#C72030] focus:ring-[#C72030]">
                    <SelectValue
                      placeholder={loadingOrgs ? "Loading organizations…" : "Select organization"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingOrgs ? (
                      <SelectItem value="__loading" disabled>Loading…</SelectItem>
                    ) : organizations.length === 0 ? (
                      <SelectItem value="__empty" disabled>No organizations found</SelectItem>
                    ) : (
                      organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id.toString()}>
                          {org.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
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
                      <p className="font-semibold text-[#C72030] text-sm">Threshold Alerts</p>
                      <p className="text-xs text-gray-500">Get notified when balance is low</p>
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
                  Org Admin Threshold (₹) <span className="text-red-500">*</span>
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
                  Super Admin Threshold (₹) <span className="text-red-500">*</span>
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
                <p className="text-xs text-gray-400">Separate multiple emails with commas</p>
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
                <p className="text-xs text-gray-400">Separate multiple emails with commas</p>
              </div>
            </div>

            {/* Recipients preview */}
            {(editForm.org_admin_emails || editForm.super_admin_emails) && (
              <div className="bg-[#ede8df] rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#C72030] mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-[#C72030] text-sm">Alert Recipients Preview</p>
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
              {submitting ? "Saving…" : modalMode === "add" ? "Create Setting" : "Update Setting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ThresholdAlerts;
