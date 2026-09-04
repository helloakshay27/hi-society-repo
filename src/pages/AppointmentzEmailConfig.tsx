import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  Loader2,
  Upload,
  Mail,
  Save,
  Sparkles,
  Eye,
  Edit3,
} from "lucide-react";
import {
  getScheduleSetup,
  updateEmailTemplate,
  uploadSiteSchedulerAsset,
} from "@/services/appointmentzService";

const panelClass =
  "space-y-4 rounded-xl border border-[#D5DbDB] bg-white p-5 shadow-xs";
const panelTitleClass = "text-sm font-bold text-[#1A1A1A]";
const fieldLabelClass = "block text-xs font-semibold text-[#6B7280]";
const uploadButtonClass =
  "btn-primary text-white px-4 py-1.5 rounded-md text-xs font-semibold h-8 shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50";
const fileInputClass =
  "text-xs text-[#4B5563] file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border file:border-[#D5DbDB] file:text-xs file:bg-white file:text-[#1A1A1A] hover:file:bg-[#f6f4ee] file:cursor-pointer w-full border border-[#D5DbDB] rounded-md p-1 bg-white";

const DYNAMIC_VARIABLES = [
  { key: "society_name", label: "Society Name", displayTag: "[Society Name]", example: "Runwal Demo" },
  { key: "flat", label: "Flat No", displayTag: "[Flat No]", example: "A-1204" },
  { key: "rm_name", label: "RM Name", displayTag: "[RM Name]", example: "Rahul Verma" },
  { key: "rm_mobile", label: "RM Mobile", displayTag: "[RM Mobile]", example: "+91 98765 43210" },
  { key: "scheduled_at", label: "Scheduled Date", displayTag: "[Scheduled Date]", example: "28/08/2026" },
  { key: "booking_link", label: "Booking Link", displayTag: "[Booking Link]", example: "https://hisociety.lockated.com/site_schedule_requests/..." },
];

/**
 * Converts raw template from backend (with {{tag}} or {tag}) to clean UI format [Tag Name]
 */
const toCleanDisplayFormat = (rawText: string): string => {
  if (!rawText) return "";
  let text = rawText;

  DYNAMIC_VARIABLES.forEach((v) => {
    text = text.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, "gi"), v.displayTag);
    text = text.replace(new RegExp(`\\{${v.key}\\}`, "gi"), v.displayTag);
  });

  // Also replace any other leftover double braces
  text = text.replace(/\{\{flat_no\}\}/gi, "[Flat No]");
  text = text.replace(/\{flat_no\}/gi, "[Flat No]");

  return text;
};

/**
 * Converts clean UI text (with [Tag Name]) back to standard backend format {{key}}
 */
const toBackendFormat = (uiText: string): string => {
  if (!uiText) return "";
  let text = uiText;

  DYNAMIC_VARIABLES.forEach((v) => {
    // Replace [Society Name] or [society_name] with {{society_name}}
    text = text.replace(new RegExp(`\\[${v.label}\\]`, "gi"), `{{${v.key}}}`);
    text = text.replace(new RegExp(`\\[${v.key}\\]`, "gi"), `{{${v.key}}}`);
    // Also catch any raw double or single braces just in case
    text = text.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, "gi"), `{{${v.key}}}`);
  });

  return text;
};

export const AppointmentzEmailConfig: React.FC = () => {
  const [displayText, setDisplayText] = useState<string>("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [activeViewMode, setActiveViewMode] = useState<"edit" | "preview" | "split">("split");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [backdropFile, setBackdropFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [backdropPreview, setBackdropPreview] = useState<string>("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBackdrop, setIsUploadingBackdrop] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Read current society name from account
  const currentSocietyName = useMemo(() => {
    try {
      const acc = localStorage.getItem("hiSocietyAccount");
      if (acc) {
        const parsed = JSON.parse(acc);
        if (parsed?.society?.name) return parsed.society.name;
        if (parsed?.selected_user_society_name) return parsed.selected_user_society_name;
      }
    } catch {}
    return "Runwal Demo";
  }, []);

  useEffect(() => {
    const fetchSetup = async () => {
      setIsLoading(true);
      try {
        const data = await getScheduleSetup();
        if (data?.settings?.email_template) {
          setDisplayText(toCleanDisplayFormat(data.settings.email_template));
        } else {
          setDisplayText(
            `Greetings from [Society Name],\n\nWe are pleased to invite you to schedule your site inspection for flat [Flat No].\n\nYour assigned Relationship Manager is [RM Name] (Contact: [RM Mobile]).\n\nPlease select your preferred slot using the link below:\n[Booking Link]\n\nWarm regards,\nManagement Team`
          );
        }
        if (data?.assets?.logo_url) setLogoPreview(data.assets.logo_url);
        if (data?.assets?.backdrop_url) setBackdropPreview(data.assets.backdrop_url);
      } catch (err) {
        console.warn("Could not fetch schedule setup from /rm_users/site_schedules:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSetup();
  }, []);

  // Compute rendered email with real sample data (no brackets or braces)
  const renderedEmailPreview = useMemo(() => {
    if (!displayText) return "";
    let result = displayText;

    const replacements: Record<string, string> = {
      "[Society Name]": currentSocietyName,
      "[Flat No]": "A-1204",
      "[RM Name]": "Rahul Verma",
      "[RM Mobile]": "+91 98765 43210",
      "[Scheduled Date]": "28/08/2026",
      "[Booking Link]": "https://hisociety.lockated.com/site_schedule_requests/C0C941D6AFE5/schedule",
    };

    Object.entries(replacements).forEach(([tag, val]) => {
      result = result.replaceAll(tag, val);
    });

    // Clean up any remaining double or single braces if present
    result = result.replace(/\{\{[^}]+\}\}/g, "");
    result = result.replace(/\{[^}]+\}/g, "");

    return result;
  }, [displayText, currentSocietyName]);

  // Save Email Template
  const handleSaveEmailTemplate = async () => {
    if (!displayText.trim()) {
      toast.error("Please enter email template content");
      return;
    }
    setIsSavingTemplate(true);
    try {
      const payloadString = toBackendFormat(displayText);
      await updateEmailTemplate(payloadString);
      toast.success("Email template updated successfully");
    } catch (err) {
      console.error("Error saving email template:", err);
      toast.error("Failed to save email template");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Insert Dynamic Tag in clean format
  const handleInsertTag = (displayTag: string) => {
    setDisplayText((prev) => {
      const separator = prev.endsWith(" ") || prev.endsWith("\n") || prev === "" ? "" : " ";
      return prev + separator + displayTag;
    });
    toast.info(`Inserted ${displayTag}`);
  };

  // Handle Logo file change
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // Upload Logo
  const handleUploadLogo = async () => {
    if (!logoFile) {
      toast.error("Please select an image first");
      return;
    }
    setIsUploadingLogo(true);
    try {
      await uploadSiteSchedulerAsset(logoFile, "SiteSchedulerLogo");
      toast.success("Site Scheduler (Email) Logo uploaded successfully");
    } catch {
      toast.error("Failed to upload logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Handle Backdrop file change
  const handleBackdropFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackdropFile(file);
      setBackdropPreview(URL.createObjectURL(file));
    }
  };

  // Upload Backdrop
  const handleUploadBackdrop = async () => {
    if (!backdropFile) {
      toast.error("Please select an image first");
      return;
    }
    setIsUploadingBackdrop(true);
    try {
      await uploadSiteSchedulerAsset(backdropFile, "SiteSchedulerBackdrop");
      toast.success("Backdrop image uploaded successfully");
    } catch {
      toast.error("Failed to upload backdrop image");
    } finally {
      setIsUploadingBackdrop(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-xl border border-[#D5DbDB] shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#DA7756] text-white flex items-center justify-center shadow-xs">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">Email Configuration</h1>
            <p className="text-xs text-[#6B7280]">
              Configure Site Scheduler Email Template, Logo, and Resident Booking Backdrop Image
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Email Template Editor & Live Rendered Preview */}
      <div className="bg-white p-5 rounded-xl border border-[#D5DbDB] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#DA7756]" />
              Site Scheduler Email Template
            </h2>
            <p className="text-xs text-[#6B7280]">
              Automated invitation email sent to residents for site scheduling
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#f6f4ee] p-1 rounded-lg border border-[#D5DbDB]">
              <button
                type="button"
                onClick={() => setActiveViewMode("edit")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  activeViewMode === "edit"
                    ? "bg-white text-[#DA7756] shadow-2xs"
                    : "text-[#6B7280] hover:text-[#1A1A1A]"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode("split")}
                className={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  activeViewMode === "split"
                    ? "bg-white text-[#DA7756] shadow-2xs"
                    : "text-[#6B7280] hover:text-[#1A1A1A]"
                }`}
              >
                <span>Split View</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode("preview")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  activeViewMode === "preview"
                    ? "bg-white text-[#DA7756] shadow-2xs"
                    : "text-[#6B7280] hover:text-[#1A1A1A]"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Email View</span>
              </button>
            </div>

            <Button
              onClick={handleSaveEmailTemplate}
              disabled={isSavingTemplate || isLoading}
              className="btn-primary text-xs font-semibold px-4 h-8 shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSavingTemplate ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save Email Template</span>
            </Button>
          </div>
        </div>

        {/* Dynamic Tags Helper Chips - Clean, no braces */}
        <div className="space-y-1.5 bg-[#f6f4ee] p-3.5 rounded-lg border border-[#D5DbDB]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1A1A1A]">
              <Sparkles className="w-3.5 h-3.5 text-[#DA7756]" />
              <span>Click variable to insert into template:</span>
            </div>
            <span className="text-[11px] text-[#6B7280]">
              Variables automatically populate with real resident information
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {DYNAMIC_VARIABLES.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => handleInsertTag(v.displayTag)}
                className="inline-flex items-center gap-1.5 text-xs bg-white border border-[#D5DbDB] hover:border-[#DA7756] hover:bg-[#DA7756]/10 px-3 py-1 rounded-md text-[#1A1A1A] font-semibold cursor-pointer transition-all shadow-2xs group"
                title={`Insert ${v.label} (e.g. ${v.example})`}
              >
                <span className="text-[#DA7756] font-bold">+</span>
                <span>{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dual Layout: Editor & Rendered Email */}
        <div
          className={`grid gap-5 ${
            activeViewMode === "split"
              ? "grid-cols-1 md:grid-cols-2"
              : "grid-cols-1"
          }`}
        >
          {/* Column 1: Template Editor */}
          {(activeViewMode === "edit" || activeViewMode === "split") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className={fieldLabelClass}>Template Editor</Label>
                <span className="text-[11px] text-[#6B7280]">
                  Click tags above to insert dynamic variables
                </span>
              </div>
              <Textarea
                rows={12}
                value={displayText}
                onChange={(e) => setDisplayText(e.target.value)}
                placeholder="Write your email template content here..."
                className="border-[#D5DbDB] text-xs bg-white focus:ring-[#DA7756] leading-relaxed p-3.5 h-[300px]"
              />
            </div>
          )}

          {/* Column 2: Live Rendered Email */}
          {(activeViewMode === "preview" || activeViewMode === "split") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Live Rendered Output (What Resident Sees)</span>
                </Label>
                <span className="text-[11px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                  Variables Populated
                </span>
              </div>

              {/* Realistic Email Box */}
              <div className="border border-[#D5DbDB] rounded-lg bg-white p-5 shadow-2xs h-[300px] overflow-y-auto space-y-4">
                {/* Email Header with Logo */}
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                  <div className="flex items-center gap-2.5">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="h-7 w-auto object-contain"
                      />
                    ) : (
                      <div className="h-7 px-2.5 rounded bg-[#DA7756]/10 text-[#DA7756] text-xs font-bold flex items-center">
                        {currentSocietyName}
                      </div>
                    )}
                    <span className="text-xs font-bold text-[#1A1A1A]">
                      {currentSocietyName}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#6B7280]">Official Notification</span>
                </div>

                {/* Email Content */}
                <div className="text-xs text-[#1F2937] leading-relaxed whitespace-pre-wrap font-sans">
                  {renderedEmailPreview}
                </div>

                {/* Footer */}
                <div className="border-t border-[#E5E7EB] pt-3 flex items-center justify-between text-[11px] text-[#9CA3AF]">
                  <span>Site Scheduling Portal</span>
                  <span>Powered by Lockated</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: 2-Column Asset Branding Grid (Logo + Backdrop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel 1: Site Scheduler (Email) Logo */}
        <div className={panelClass}>
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <div className={panelTitleClass}>Site Scheduler (Email) Logo:</div>
            <span className="text-[11px] text-[#6B7280]">Email header branding</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-2">
            <div className="flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#D5DbDB] bg-[#f6f4ee] shadow-2xs">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Scheduler Logo"
                  className="max-h-full max-w-full object-contain p-2"
                />
              ) : (
                <div className="flex flex-col items-center text-[#6B7280]">
                  <ImageIcon className="mb-1 h-8 w-8 text-gray-400" />
                  <span className="text-[11px]">No Logo</span>
                </div>
              )}
            </div>

            <div className="space-y-3 flex-1 w-full">
              <div className="space-y-1.5">
                <Label className={fieldLabelClass}>Select image</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  className={fileInputClass}
                />
              </div>

              <div>
                <Button
                  onClick={handleUploadLogo}
                  disabled={isUploadingLogo || !logoFile}
                  className={uploadButtonClass}
                >
                  {isUploadingLogo ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  <span>Upload Logo</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Backdrop Image */}
        <div className={panelClass}>
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <div className={panelTitleClass}>Backdrop Image:</div>
            <span className="text-[11px] text-[#6B7280]">Resident booking portal</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-2">
            <div className="flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#D5DbDB] bg-[#f6f4ee] shadow-2xs">
              {backdropPreview ? (
                <img
                  src={backdropPreview}
                  alt="Backdrop"
                  className="max-h-full max-w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center text-[#6B7280]">
                  <ImageIcon className="mb-1 h-8 w-8 text-gray-400" />
                  <span className="text-[11px]">No Image</span>
                </div>
              )}
            </div>

            <div className="space-y-3 flex-1 w-full">
              <div className="space-y-1.5">
                <Label className={fieldLabelClass}>Select image</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBackdropFileChange}
                  className={fileInputClass}
                />
              </div>

              <div>
                <Button
                  onClick={handleUploadBackdrop}
                  disabled={isUploadingBackdrop || !backdropFile}
                  className={uploadButtonClass}
                >
                  {isUploadingBackdrop ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  <span>Upload Backdrop</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentzEmailConfig;
