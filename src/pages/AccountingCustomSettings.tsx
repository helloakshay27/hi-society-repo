import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FormControl, InputLabel, Select as MuiSelect, MenuItem, TextField } from "@mui/material";
import { fieldStyles, menuProps } from "@/components/ticket-management/fieldStyles";
import { toast } from "sonner";
import { Upload, Plus, Pencil, Trash2, Download, X } from "lucide-react";

type SettingsTab = "invoices" | "receipts";
type NumberMode = "auto" | "manual";

interface DocAddress {
  id: string;
  title: string;
  buildingName: string;
  address: string;
  state: string;
  telNo: string;
  faxNo: string;
  email: string;
  registrationNo: string;
  panNumber: string;
  gstNumber: string;
  chequeInFavourOf: string;
  notes: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  bankBranchName: string;
  ifscCode: string;
}

interface BreakupFile {
  id: string;
  date: string;
  fileName: string;
  fileUrl?: string;
}

interface InvoiceSetupRow {
  id: string;
  name: string;
  invoiceType: string;
}

// The GET response shape for /crm/admin/admin_invoices/setup_invoice hasn't
// been confirmed against a real payload — these mappers try several common
// key-naming variants (snake_case, camelCase, and a couple of likely
// synonyms) for each field, the same defensive-fallback style already used
// elsewhere in this codebase (see normalizeOptions in AccountingInvoiceCreation.tsx).
const pick = (obj: any, ...keys: string[]): any => {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
};

// The logo field comes back as either a plain URL string or an
// { id, url } object (confirmed via a runtime "object with keys {id, url}"
// render error) — normalize either shape down to just the URL string.
const pickUrlString = (value: any): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return String(value.url ?? value.logo_url ?? "");
  return "";
};

const mapApiAddress = (item: any): DocAddress => ({
  id: String(pick(item, "id") ?? `${Date.now()}-${Math.random()}`),
  title: pick(item, "title", "address_title", "name") ?? "",
  buildingName: pick(item, "building_name", "buildingName") ?? "",
  address: pick(item, "address", "address_line", "full_address") ?? "",
  state: pick(item, "state", "state_code", "state_name") ?? "",
  telNo: pick(item, "tel_no", "telno", "telephone_number", "phone") ?? "",
  faxNo: pick(item, "fax_no", "faxno") ?? "",
  email: pick(item, "email", "email_address") ?? "",
  registrationNo: pick(item, "registration_number", "registration_no", "regd_no") ?? "",
  panNumber: pick(item, "pan_number", "pan_no", "pan") ?? "",
  gstNumber: pick(item, "gst_number", "gst_no", "gstin") ?? "",
  chequeInFavourOf: pick(item, "cheque_in_favour_of", "cheque_favour", "cheque_in_favor_of") ?? "",
  notes: pick(item, "notes", "note") ?? "",
  accountNumber: pick(item, "account_number", "bank_account_number") ?? "",
  accountName: pick(item, "account_name", "bank_account_name") ?? "",
  accountType: pick(item, "account_type", "bank_account_type") ?? "",
  bankBranchName: pick(item, "bank_branch_name", "bank_name", "branch_name") ?? "",
  ifscCode: pick(item, "ifsc_code", "ifsc") ?? "",
});

const mapApiBreakupFile = (item: any): BreakupFile => ({
  id: String(pick(item, "id") ?? `${Date.now()}-${Math.random()}`),
  date: pick(item, "date", "created_at", "breakup_date") ?? "",
  fileName: pick(item, "file_name", "filename", "name") ?? "File",
  fileUrl: pick(item, "file_url", "url", "document_url"),
});

const mapApiInvoiceSetupRow = (item: any): InvoiceSetupRow => ({
  id: String(pick(item, "id") ?? `${Date.now()}-${Math.random()}`),
  name: pick(item, "name", "title") ?? "",
  invoiceType: pick(item, "invoice_type", "type", "receipt_type") ?? "",
});

const STATE_OPTIONS = [
  "Maharashtra", "Karnataka", "Tamil Nadu", "Delhi", "Gujarat", "Telangana", "West Bengal",
];

const emptyAddress = (): DocAddress => ({
  id: "",
  title: "",
  buildingName: "",
  address: "",
  state: "",
  telNo: "",
  faxNo: "",
  email: "",
  registrationNo: "",
  panNumber: "",
  gstNumber: "",
  chequeInFavourOf: "",
  notes: "",
  accountNumber: "",
  accountName: "",
  accountType: "",
  bankBranchName: "",
  ifscCode: "",
});

const NumberingSection: React.FC<{
  title: string;
  mode: NumberMode;
  onModeChange: (mode: NumberMode) => void;
  prefix: string;
  onPrefixChange: (value: string) => void;
  nextNumber: string;
  onNextNumberChange: (value: string) => void;
  onSubmit: () => void;
  autoLabel: string;
}> = ({ title, mode, onModeChange, prefix, onPrefixChange, nextNumber, onNextNumberChange, onSubmit, autoLabel }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h2 className="text-lg font-medium text-gray-900 mb-4">{title}</h2>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="radio"
            checked={mode === "auto"}
            onChange={() => onModeChange("auto")}
            className="h-4 w-4 accent-[#C72030]"
          />
          {autoLabel}
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="radio"
            checked={mode === "manual"}
            onChange={() => onModeChange("manual")}
            className="h-4 w-4 accent-[#C72030]"
          />
          I will add them manually each time
        </label>
      </div>
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Prefix"
          value={prefix}
          disabled={mode === "manual"}
          onChange={(e) => onPrefixChange(e.target.value)}
          className="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:border-[#C72030] focus:outline-none"
        />
        <input
          type="text"
          placeholder="Next Number"
          value={nextNumber}
          disabled={mode === "manual"}
          onChange={(e) => onNextNumberChange(e.target.value)}
          className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:border-[#C72030] focus:outline-none"
        />
      </div>
    </div>
    <Button
      onClick={onSubmit}
      className="mt-4 !bg-[#C72030]    !text-white h-8 px-5 text-sm"
    >
      Submit
    </Button>
  </div>
);

const AccountingCustomSettings: React.FC = () => {
  const location = useLocation();
  const activeTab: SettingsTab = location.pathname.endsWith("/receipts") ? "receipts" : "invoices";
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Per-tab state, keyed by tab so Invoices and Receipts don't share data.
  const [logoFile, setLogoFile] = useState<Record<SettingsTab, File | null>>({
    invoices: null,
    receipts: null,
  });
  const [onlinePaymentAllowed, setOnlinePaymentAllowed] = useState(true);

  const [invoiceNumberMode, setInvoiceNumberMode] = useState<NumberMode>("manual");
  const [invoicePrefix, setInvoicePrefix] = useState("");
  const [invoiceNextNumber, setInvoiceNextNumber] = useState("");

  const [receiptNumberMode, setReceiptNumberMode] = useState<Record<SettingsTab, NumberMode>>({
    invoices: "manual",
    receipts: "manual",
  });
  const [receiptPrefix, setReceiptPrefix] = useState<Record<SettingsTab, string>>({
    invoices: "",
    receipts: "",
  });
  const [receiptNextNumber, setReceiptNextNumber] = useState<Record<SettingsTab, string>>({
    invoices: "",
    receipts: "",
  });

  const [addresses, setAddresses] = useState<Record<SettingsTab, DocAddress[]>>({
    invoices: [],
    receipts: [],
  });
  const [breakupFiles, setBreakupFiles] = useState<Record<SettingsTab, BreakupFile[]>>({
    invoices: [],
    receipts: [],
  });
  const [invoiceSetupRows, setInvoiceSetupRows] = useState<Record<SettingsTab, InvoiceSetupRow[]>>({
    invoices: [],
    receipts: [],
  });
  const [existingLogoUrl, setExistingLogoUrl] = useState<Record<SettingsTab, string>>({
    invoices: "",
    receipts: "",
  });
  const [loadingSetup, setLoadingSetup] = useState(false);

  // GET /crm/admin/admin_invoices/setup_invoice — pre-populates this page
  // with whatever is already configured. Re-fetched whenever the Invoices/
  // Receipts tab changes, passing `doc_type` so the backend can (if it
  // distinguishes the two) return the right config; if it always returns
  // one combined payload, this just refetches the same data harmlessly. Also
  // called again after every address add/edit/delete so the list (and the
  // ids used for further edits/deletes) always comes from the server rather
  // than a locally-fabricated id.
  const fetchSetupInvoice = React.useCallback(async () => {
      setLoadingSetup(true);
      try {
        const baseUrl = localStorage.getItem("baseUrl");
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `https://${baseUrl}/crm/admin/admin_invoices/setup_invoice.json`,
          {
            params: { doc_type: activeTab === "receipts" ? "receipt" : "invoice" },
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const payload = response.data?.setup_invoice ?? response.data?.data ?? response.data ?? {};

        setExistingLogoUrl((prev) => ({
          ...prev,
          [activeTab]: pickUrlString(pick(payload, "logo_url", "logo", "logo_path")),
        }));

        setOnlinePaymentAllowed(
          Boolean(pick(payload, "online_payment_allowed", "online_payment", "allow_online_payment") ?? true)
        );

        const invoiceNumberCfg = pick(payload, "invoice_number", "invoice_number_setting") ?? payload;
        setInvoiceNumberMode(
          pick(invoiceNumberCfg, "auto_generate", "invoice_auto_generate") ? "auto" : "manual"
        );
        setInvoicePrefix(pick(invoiceNumberCfg, "prefix", "invoice_prefix") ?? "");
        setInvoiceNextNumber(String(pick(invoiceNumberCfg, "next_number", "invoice_next_number") ?? ""));

        const receiptNumberCfg = pick(payload, "receipt_number", "receipt_number_setting") ?? payload;
        setReceiptNumberMode((prev) => ({
          ...prev,
          [activeTab]: pick(receiptNumberCfg, "auto_generate", "receipt_auto_generate") ? "auto" : "manual",
        }));
        setReceiptPrefix((prev) => ({
          ...prev,
          [activeTab]: pick(receiptNumberCfg, "prefix", "receipt_prefix") ?? "",
        }));
        setReceiptNextNumber((prev) => ({
          ...prev,
          [activeTab]: String(pick(receiptNumberCfg, "next_number", "receipt_next_number") ?? ""),
        }));

        const setupRows = pick(payload, "invoice_setups", "receipt_setups", "invoice_setup", "setups");
        setInvoiceSetupRows((prev) => ({
          ...prev,
          [activeTab]: Array.isArray(setupRows) ? setupRows.map(mapApiInvoiceSetupRow) : [],
        }));

        const addressList = pick(payload, "addresses", "address");
        setAddresses((prev) => ({
          ...prev,
          [activeTab]: Array.isArray(addressList) ? addressList.map(mapApiAddress) : [],
        }));

        const breakupList = pick(payload, "breakup_files", "breakups");
        setBreakupFiles((prev) => ({
          ...prev,
          [activeTab]: Array.isArray(breakupList) ? breakupList.map(mapApiBreakupFile) : [],
        }));
      } catch (error) {
        console.error("Error fetching setup_invoice:", error);
        toast.error("Failed to load custom settings");
      } finally {
        setLoadingSetup(false);
      }
  }, [activeTab]);

  useEffect(() => {
    fetchSetupInvoice();
  }, [fetchSetupInvoice]);

  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DocAddress | null>(null);
  const [addressForm, setAddressForm] = useState<DocAddress>(emptyAddress());
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [breakupDialogOpen, setBreakupDialogOpen] = useState(false);
  const [breakupDate, setBreakupDate] = useState("");
  const [breakupFileToAdd, setBreakupFileToAdd] = useState<File | null>(null);

  const handleLogoUploadClick = () => fileInputRef.current?.click();

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogoFile((prev) => ({ ...prev, [activeTab]: file }));
  };

  const handleLogoSubmit = async () => {
    const file = logoFile[activeTab];
    if (!file) {
      toast.error("Please choose a logo file first");
      return;
    }
    try {
      const baseUrl = localStorage.getItem("baseUrl");
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("logo", file);
      const response = await axios.post(
        `https://${baseUrl}/crm/admin/admin_invoices/create_logo.json`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExistingLogoUrl((prev) => {
        const picked = pick(response.data, "logo_url", "logo", "logo_path");
        return { ...prev, [activeTab]: picked ? pickUrlString(picked) : prev[activeTab] };
      });
      toast.success("Logo updated successfully");
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to update logo");
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const baseUrl = localStorage.getItem("baseUrl");
      const token = localStorage.getItem("token");
      await axios.get(`https://${baseUrl}/crm/admin/admin_invoices/remove_logo.json`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExistingLogoUrl((prev) => ({ ...prev, [activeTab]: "" }));
      setLogoFile((prev) => ({ ...prev, [activeTab]: null }));
      toast.success("Logo removed successfully");
    } catch (error) {
      console.error("Error removing logo:", error);
      toast.error("Failed to remove logo");
    }
  };

  const handleInvoiceNumberSubmit = async () => {
    try {
      const baseUrl = localStorage.getItem("baseUrl");
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("auto_inv", String(invoiceNumberMode === "auto"));
      formData.append("prefix", invoicePrefix);
      formData.append("next_number", invoiceNextNumber);
      formData.append("online_payment_allowed", String(onlinePaymentAllowed));
      await axios.post(
        `https://${baseUrl}/crm/admin/admin_invoices/inv_prefix_setup.json`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Invoice numbering preference saved");
    } catch (error) {
      console.error("Error saving invoice number setting:", error);
      toast.error("Failed to save invoice numbering preference");
    }
  };

  const handleReceiptNumberSubmit = async () => {
    try {
      const baseUrl = localStorage.getItem("baseUrl");
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("auto_rec", String(receiptNumberMode[activeTab] === "auto"));
      formData.append("prefix", receiptPrefix[activeTab]);
      formData.append("next_number", receiptNextNumber[activeTab]);
      await axios.post(
        `https://${baseUrl}/crm/admin/invoice_reciepts/rec_auto_setup.json`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Receipt numbering preference saved");
    } catch (error) {
      console.error("Error saving receipt number setting:", error);
      toast.error("Failed to save receipt numbering preference");
    }
  };

  const handleOpenAddAddress = () => {
    setEditingAddress(null);
    setAddressForm(emptyAddress());
    setAddressDialogOpen(true);
  };

  const handleOpenEditAddress = (address: DocAddress) => {
    setEditingAddress(address);
    setAddressForm(address);
    setAddressDialogOpen(true);
  };

  const handleAddressFormChange = (field: keyof DocAddress, value: string) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
  };

  // Tel/Fax/Account Number are numeric-only fields — strip anything but
  // digits as the user types instead of only rejecting on submit.
  const handleNumericAddressFieldChange = (field: keyof DocAddress, value: string) => {
    handleAddressFormChange(field, value.replace(/\D/g, ""));
  };

  // GST/PAN/IFSC are conventionally written in uppercase — normalize as the
  // user types so the submit-time format check isn't tripped by casing alone.
  const handleUppercaseAddressFieldChange = (field: keyof DocAddress, value: string) => {
    handleAddressFormChange(field, value.toUpperCase());
  };

  // Format validation, checked on submit and only when the field actually has
  // a value (none of these are mandatory) — mirrors real-world identifier
  // formats rather than just "digits only".
  const ADDRESS_FIELD_VALIDATIONS: {
    field: keyof DocAddress;
    label: string;
    pattern: RegExp;
    message: string;
  }[] = [
    {
      field: "email",
      label: "Email Address",
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Email Address must be a valid email, e.g. name@example.com",
    },
    {
      field: "telNo",
      label: "Tel.No",
      pattern: /^\d{10}$/,
      message: "Tel.No must be a valid 10-digit phone number",
    },
    {
      field: "faxNo",
      label: "Fax No",
      pattern: /^\d{10}$/,
      message: "Fax No must be a valid 10-digit number",
    },
    {
      field: "gstNumber",
      label: "GST Number",
      pattern: /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      message: "GST Number must be a valid 15-character GSTIN, e.g. 27ABCDE1234F1Z5",
    },
    {
      field: "panNumber",
      label: "PAN Number",
      pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
      message: "PAN Number must be a valid 10-character PAN, e.g. ABCDE1234F",
    },
    {
      field: "accountNumber",
      label: "Account Number",
      pattern: /^\d{9,18}$/,
      message: "Account Number must be 9 to 18 digits",
    },
    {
      field: "ifscCode",
      label: "IFSC Code",
      pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/,
      message: "IFSC Code must be a valid 11-character IFSC, e.g. SBIN0001234",
    },
  ];

  const buildAddressFormData = (form: DocAddress): FormData => {
    const formData = new FormData();
    const fields: [string, string][] = [
      ["title", form.title],
      ["building_name", form.buildingName],
      ["address", form.address],
      ["state", form.state],
      ["tel_no", form.telNo],
      ["fax_no", form.faxNo],
      ["email", form.email],
      ["registration_number", form.registrationNo],
      ["pan_number", form.panNumber],
      ["gst_number", form.gstNumber],
      ["cheque_in_favour_of", form.chequeInFavourOf],
      ["notes", form.notes],
      ["account_number", form.accountNumber],
      ["account_name", form.accountName],
      ["account_type", form.accountType],
      ["bank_branch_name", form.bankBranchName],
      ["ifsc_code", form.ifscCode],
    ];
    fields.forEach(([key, value]) => formData.append(`admin_invoice_address[${key}]`, value));
    return formData;
  };

  const handleSubmitAddress = async () => {
    if (!addressForm.title.trim()) {
      toast.error("Address Title is required");
      return;
    }

    for (const { field, pattern, message } of ADDRESS_FIELD_VALIDATIONS) {
      const value = addressForm[field];
      if (value && !pattern.test(value)) {
        toast.error(message);
        return;
      }
    }

    try {
      const baseUrl = localStorage.getItem("baseUrl");
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const formData = buildAddressFormData(addressForm);

      if (editingAddress) {
        await axios.put(
          `https://${baseUrl}/crm/admin/admin_invoices/${editingAddress.id}/update_address.json`,
          formData,
          { headers }
        );
        toast.success("Address updated successfully");
      } else {
        await axios.post(
          `https://${baseUrl}/crm/admin/admin_invoices/add_address.json`,
          formData,
          { headers }
        );
        toast.success("Address added successfully");
      }
      // Re-fetch instead of splicing local state — the address list (and the
      // ids used for further edits/deletes) should come from the server, not
      // a client-generated placeholder id.
      await fetchSetupInvoice();
      setAddressDialogOpen(false);
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const baseUrl = localStorage.getItem("baseUrl");
      const token = localStorage.getItem("token");
      await axios.delete(`https://${baseUrl}/crm/admin/admin_invoices/${id}/destroy_address.json`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Address deleted successfully");
      await fetchSetupInvoice();
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete address");
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleOpenAddBreakupFile = () => {
    setBreakupDate("");
    setBreakupFileToAdd(null);
    setBreakupDialogOpen(true);
  };

  const handleSubmitBreakupFile = () => {
    if (!breakupDate || !breakupFileToAdd) {
      toast.error("Please pick a date and a file");
      return;
    }
    setBreakupFiles((prev) => ({
      ...prev,
      [activeTab]: [
        ...prev[activeTab],
        { id: `${Date.now()}`, date: breakupDate, fileName: breakupFileToAdd.name },
      ],
    }));
    toast.success("Breakup file added successfully");
    setBreakupDialogOpen(false);
  };

  const currentAddresses = addresses[activeTab];
  const currentBreakupFiles = breakupFiles[activeTab];
  const currentSetupRows = invoiceSetupRows[activeTab];
  const setupLabel = activeTab === "invoices" ? "Invoice Setup" : "Receipt Setup";

  return (
    <div className="min-h-screen bg-[#f6f4ee]">
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">
          Custom Settings — {activeTab === "invoices" ? "Invoices" : "Receipts"}
          {loadingSetup && <span className="ml-3 text-sm font-normal text-gray-400">Loading…</span>}
        </h1>
        {/* Logo Setup */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Logo Setup</h2>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleLogoUploadClick}
              className="flex-1 flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-50 focus:bg-gray-50"
            >
              <Upload className="h-4 w-4" />
              {logoFile[activeTab]?.name || existingLogoUrl[activeTab] || "Upload File"}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFileChange} />
            <Button onClick={handleLogoSubmit} className="!bg-[#C72030] !text-white h-auto px-6">
              Submit
            </Button>
            <Button
              onClick={handleRemoveLogo}
              className="h-auto px-6 !border !border-[#da7756] !bg-white hover:!bg-white active:!bg-white focus:!bg-white focus-visible:!bg-white !text-[#da7756] hover:!text-[#da7756] active:!text-[#da7756] focus:!text-[#da7756] focus-visible:!text-[#da7756] hover:!border-[#da7756]"
            >
              Remove
            </Button>
          </div>
        </div>

        {activeTab === "invoices" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Online Payment Allowed</span>
            <button
              type="button"
              onClick={() => setOnlinePaymentAllowed((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                onlinePaymentAllowed ? "bg-[#C72030]" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  onlinePaymentAllowed ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        )}

        {activeTab === "invoices" && (
          <NumberingSection
            title="Invoice Number"
            autoLabel="Continue auto-generating invoice numbers"
            mode={invoiceNumberMode}
            onModeChange={setInvoiceNumberMode}
            prefix={invoicePrefix}
            onPrefixChange={setInvoicePrefix}
            nextNumber={invoiceNextNumber}
            onNextNumberChange={setInvoiceNextNumber}
            onSubmit={handleInvoiceNumberSubmit}
          />
        )}

        <NumberingSection
          title="Receipt Number"
          autoLabel="Continue auto-generating receipt numbers"
          mode={receiptNumberMode[activeTab]}
          onModeChange={(mode) => setReceiptNumberMode((prev) => ({ ...prev, [activeTab]: mode }))}
          prefix={receiptPrefix[activeTab]}
          onPrefixChange={(value) => setReceiptPrefix((prev) => ({ ...prev, [activeTab]: value }))}
          nextNumber={receiptNextNumber[activeTab]}
          onNextNumberChange={(value) => setReceiptNextNumber((prev) => ({ ...prev, [activeTab]: value }))}
          onSubmit={handleReceiptNumberSubmit}
        />

        {/* Invoice / Receipt Setup table */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{setupLabel}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-600">
                <th className="py-2 pr-4 font-medium">#</th>
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 font-medium">{activeTab === "invoices" ? "Invoice Type" : "Receipt Type"}</th>
              </tr>
            </thead>
            <tbody>
              {currentSetupRows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-gray-400">
                    No records found
                  </td>
                </tr>
              ) : (
                currentSetupRows.map((row, index) => (
                  <tr key={row.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4">{index + 1}</td>
                    <td className="py-2 pr-4">{row.name}</td>
                    <td className="py-2">{row.invoiceType}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Address */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Address</h2>
            <Button onClick={handleOpenAddAddress} className="!bg-[#C72030]  !text-white h-9 px-4 text-sm">
              Add New Address
            </Button>
          </div>
          {currentAddresses.length === 0 ? (
            <p className="text-sm text-gray-400">No addresses added yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {currentAddresses.map((address) => (
                <div key={address.id} className="rounded-lg border border-gray-200">
                  <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 font-medium text-gray-800">
                    {address.title}
                  </div>
                  <div className="space-y-1 px-4 py-3 text-sm text-gray-700">
                    {address.buildingName && <p className="font-medium">{address.buildingName}</p>}
                    {address.registrationNo && <p>Regd.No.{address.registrationNo}</p>}
                    {address.gstNumber && <p>GST.No.{address.gstNumber}</p>}
                    {address.address && <p className="text-gray-500">{address.address}</p>}
                  </div>
                  <div className="flex gap-2 border-t border-gray-200 px-4 py-2">
                    <Button
                      size="sm"
                      className="h-7 px-3 text-xs !bg-[#C72030] "
                      onClick={() => handleOpenEditAddress(address)}
                    >
                      <Pencil className="mr-1 h-3 w-3" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 px-3 text-xs !bg-[#C72030] "
                      onClick={() => setDeleteTargetId(address.id)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Breakup Files */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Breakup Files</h2>
            <Button onClick={handleOpenAddBreakupFile} className="!bg-[#C72030] !text-white h-9 px-4 text-sm">
              Add New Breakup File
            </Button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-600">
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 font-medium">Export</th>
              </tr>
            </thead>
            <tbody>
              {currentBreakupFiles.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-4 text-center text-gray-400">
                    No breakup files added yet.
                  </td>
                </tr>
              ) : (
                currentBreakupFiles.map((file) => (
                  <tr key={file.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4">{file.date}</td>
                    <td className="py-2">
                      {file.fileUrl ? (
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#3b82c4] hover:underline"
                        >
                          <Download className="h-3.5 w-3.5" /> {file.fileName}
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#3b82c4]">
                          <Download className="h-3.5 w-3.5" /> {file.fileName}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Address Dialog */}
      <Dialog open={addressDialogOpen} modal={false} onOpenChange={setAddressDialogOpen}>
        <DialogContent className="sm:max-w-2xl overflow-hidden p-0 [&>button]:hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">
              {editingAddress ? "Edit Address" : `${activeTab === "invoices" ? "Invoice" : "Receipt"} Address Setup`}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddressDialogOpen(false)}
              className="h-6 w-6 p-0 hover:!bg-transparent active:!bg-transparent focus:!bg-transparent focus-visible:!bg-transparent"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="max-h-[65vh] space-y-4 overflow-y-auto px-6 py-4">
            <TextField
              label={<>Address Title <span style={{ color: "#C72030" }}>*</span></>}
              placeholder="Enter Address Title"
              value={addressForm.title}
              onChange={(e) => handleAddressFormChange("title", e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />
            <TextField
              label="Building Name"
              placeholder="Enter Building Name"
              value={addressForm.buildingName}
              onChange={(e) => handleAddressFormChange("buildingName", e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />
            <div>
              <div className="relative">
                <textarea
                  className="peer w-full rounded-md border border-gray-300 p-3 focus:border-[#DA7756] focus:outline-none focus:ring-1 focus:ring-[#DA7756] resize-y"
                  rows={2}
                  value={addressForm.address}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) handleAddressFormChange("address", e.target.value);
                  }}
                  placeholder="Enter Address"
                  maxLength={500}
                />
                <label className="absolute -top-2 left-3 bg-white px-1 text-xs font-normal text-black/60 peer-focus:text-[#DA7756]">
                  Address
                </label>
              </div>
              <div className="mt-1 text-right text-xs text-gray-400">{addressForm.address.length}/500</div>
            </div>

            <FormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: "white", px: 1 }}>
                State
              </InputLabel>
              <MuiSelect
                value={addressForm.state}
                onChange={(e) => handleAddressFormChange("state", e.target.value as string)}
                displayEmpty
                label="State"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value="">
                  <em>Select state</em>
                </MenuItem>
                {STATE_OPTIONS.map((state) => (
                  <MenuItem key={state} value={state}>
                    {state}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                label="Tel.No"
                placeholder="Enter Telephone Number"
                value={addressForm.telNo}
                onChange={(e) => handleNumericAddressFieldChange("telNo", e.target.value)}
                inputMode="numeric"
                inputProps={{ maxLength: 10 }}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
              <TextField
                label="Fax No"
                placeholder="Enter Fax Number"
                value={addressForm.faxNo}
                onChange={(e) => handleNumericAddressFieldChange("faxNo", e.target.value)}
                inputMode="numeric"
                inputProps={{ maxLength: 10 }}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
            </div>

            <TextField
              label="Email Address"
              placeholder="e.g. name@example.com"
              value={addressForm.email}
              onChange={(e) => handleAddressFormChange("email", e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                label="Registration No"
                placeholder="Enter Registration No."
                value={addressForm.registrationNo}
                onChange={(e) => handleAddressFormChange("registrationNo", e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
              <TextField
                label="PAN Number"
                placeholder="Enter PAN Number, e.g. ABCDE1234F"
                value={addressForm.panNumber}
                onChange={(e) => handleUppercaseAddressFieldChange("panNumber", e.target.value)}
                inputProps={{ maxLength: 10 }}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
            </div>

            <TextField
              label="GST Number"
              placeholder="Enter GST Number, e.g. 27ABCDE1234F1Z5"
              value={addressForm.gstNumber}
              onChange={(e) => handleUppercaseAddressFieldChange("gstNumber", e.target.value)}
              inputProps={{ maxLength: 15 }}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />
            <TextField
              label="Cheque In Favour Of"
              placeholder="Cheque In Favour Of"
              value={addressForm.chequeInFavourOf}
              onChange={(e) => handleAddressFormChange("chequeInFavourOf", e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />
            <div>
              <div className="relative">
                <textarea
                  className="peer w-full rounded-md border border-gray-300 p-3 focus:border-[#DA7756] focus:outline-none focus:ring-1 focus:ring-[#DA7756] resize-y"
                  rows={2}
                  value={addressForm.notes}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) handleAddressFormChange("notes", e.target.value);
                  }}
                  placeholder="notes"
                  maxLength={500}
                />
                <label className="absolute -top-2 left-3 bg-white px-1 text-xs font-normal text-black/60 peer-focus:text-[#DA7756]">
                  Notes
                </label>
              </div>
              <div className="mt-1 text-right text-xs text-gray-400">{addressForm.notes.length}/500</div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-800">Bank Details</h3>
              <div className="space-y-4">
                <TextField
                  label="Account Number"
                  placeholder="Enter Account Number"
                  value={addressForm.accountNumber}
                  onChange={(e) => handleNumericAddressFieldChange("accountNumber", e.target.value)}
                  inputMode="numeric"
                  inputProps={{ maxLength: 18 }}
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: fieldStyles }}
                />
                <TextField
                  label="Account Name"
                  placeholder="Enter Account Name"
                  value={addressForm.accountName}
                  onChange={(e) => handleAddressFormChange("accountName", e.target.value)}
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: fieldStyles }}
                />
                <FormControl fullWidth variant="outlined">
                  <InputLabel shrink sx={{ backgroundColor: "white", px: 1 }}>
                    Account type
                  </InputLabel>
                  <MuiSelect
                    value={addressForm.accountType}
                    onChange={(e) => handleAddressFormChange("accountType", e.target.value as string)}
                    displayEmpty
                    label="Account type"
                    sx={fieldStyles}
                    MenuProps={menuProps}
                  >
                    <MenuItem value="">
                      <em>Select Account type</em>
                    </MenuItem>
                    <MenuItem value="Savings">Savings</MenuItem>
                    <MenuItem value="Current">Current</MenuItem>
                  </MuiSelect>
                </FormControl>
                <TextField
                  label="Bank & Branch Name"
                  placeholder="Enter Bank & Branch Name"
                  value={addressForm.bankBranchName}
                  onChange={(e) => handleAddressFormChange("bankBranchName", e.target.value)}
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: fieldStyles }}
                />
                <TextField
                  label="IFSC Code"
                  placeholder="Enter IFSC Code, e.g. SBIN0001234"
                  value={addressForm.ifscCode}
                  onChange={(e) => handleUppercaseAddressFieldChange("ifscCode", e.target.value)}
                  inputProps={{ maxLength: 11 }}
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: fieldStyles }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3 border-t border-gray-200 px-6 py-4">
            <Button onClick={handleSubmitAddress} className="!bg-[#C72030] !text-white px-8">
              Submit
            </Button>
            <Button
              onClick={() => setAddressDialogOpen(false)}
              className="h-10 w-full !border !border-[#da7756] !bg-white hover:!bg-white active:!bg-white focus:!bg-white focus-visible:!bg-white !text-[#da7756] hover:!text-[#da7756] active:!text-[#da7756] focus:!text-[#da7756] focus-visible:!text-[#da7756] hover:!border-[#da7756] px-6 sm:w-auto sm:px-8"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Address confirmation */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="!border !border-[#da7756] !bg-white hover:!bg-white active:!bg-white focus:!bg-white focus-visible:!bg-white !text-[#da7756] hover:!text-[#da7756] active:!text-[#da7756] focus:!text-[#da7756] focus-visible:!text-[#da7756] hover:!border-[#da7756]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="!bg-[#C72030] hover:!bg-[#C72030] active:!bg-[#C72030] focus:!bg-[#C72030] focus-visible:!bg-[#C72030] !text-white px-8"
              onClick={() => deleteTargetId && handleDeleteAddress(deleteTargetId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Breakup File Dialog */}
      <Dialog open={breakupDialogOpen} modal={false} onOpenChange={setBreakupDialogOpen}>
        <DialogContent className="sm:max-w-md overflow-hidden p-0 [&>button]:hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Add New Breakup File</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setBreakupDialogOpen(false)}
              className="h-6 w-6 p-0 hover:!bg-transparent active:!bg-transparent focus:!bg-transparent focus-visible:!bg-transparent"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-4 px-6 py-4">
            <TextField
              label="Date"
              type="date"
              value={breakupDate}
              onChange={(e) => setBreakupDate(e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />
            <div>
              <label className="mb-1 block text-xs text-gray-600">File</label>
              <input
                type="file"
                onChange={(e) => setBreakupFileToAdd(e.target.files?.[0] || null)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-center gap-3 border-t border-gray-200 px-6 py-4">
            <Button onClick={handleSubmitBreakupFile} className="!bg-[#C72030] !text-white px-8">
              Submit
            </Button>
            <Button
              onClick={() => setBreakupDialogOpen(false)}
              className="h-10 w-full !border !border-[#da7756] !bg-white hover:!bg-white active:!bg-white focus:!bg-white focus-visible:!bg-white !text-[#da7756] hover:!text-[#da7756] active:!text-[#da7756] focus:!text-[#da7756] focus-visible:!text-[#da7756] hover:!border-[#da7756] px-6 sm:w-auto sm:px-8"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingCustomSettings;
