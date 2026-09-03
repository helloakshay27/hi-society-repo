import { useEffect, useMemo, useRef, useState } from "react";
import { X, Mail, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  FormControl as MuiFormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  TextField,
} from "@mui/material";
import { fieldStyles, menuProps } from "@/components/ticket-management/fieldStyles";
import { toast } from "sonner";
import {
  emailTemplatesApi,
  EmailTemplate,
  EmailRecipient,
  DEFAULT_MERGE_TAGS,
} from "@/api/emailTemplates";

interface SendEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: EmailRecipient[];
}

type Mode = "template" | "compose";

export const SendEmailModal = ({ open, onOpenChange, recipients }: SendEmailModalProps) => {
  const [mode, setMode] = useState<Mode>("template");
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [mergeTags, setMergeTags] = useState<Record<string, string[]>>(DEFAULT_MERGE_TAGS);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const validRecipients = useMemo(
    () => recipients.filter((r) => r.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email)),
    [recipients]
  );
  const skipped = recipients.length - validRecipients.length;

  useEffect(() => {
    if (!open) return;
    setLoadingTemplates(true);
    emailTemplatesApi
      .list({ active: true })
      .then((list) => {
        setTemplates(list);
        setTemplateId((prev) => (prev === "" && list.length ? String(list[0].id) : prev));
        if (!list.length) setMode("compose");
      })
      .catch(() => toast.error("Could not load email templates."))
      .finally(() => setLoadingTemplates(false));
    emailTemplatesApi.mergeTags().then((t) => Object.keys(t).length && setMergeTags(t)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectedTemplate = templates.find((t) => String(t.id) === templateId);

  const insertTag = (tag: string) => {
    const el = bodyRef.current;
    if (mode === "compose" && el) {
      const start = el.selectionStart ?? body.length;
      const end = el.selectionEnd ?? body.length;
      setBody(body.slice(0, start) + tag + body.slice(end));
      requestAnimationFrame(() => {
        el.focus();
        el.selectionStart = el.selectionEnd = start + tag.length;
      });
    } else {
      setSubject((s) => s + tag);
    }
  };

  const handleSend = async () => {
    if (validRecipients.length === 0) {
      toast.error("None of the selected users have a valid email address.");
      return;
    }
    if (mode === "template" && !templateId) {
      toast.error("Please choose a template.");
      return;
    }
    if (mode === "compose" && (!subject.trim() || !body.trim())) {
      toast.error("Subject and body are required.");
      return;
    }

    setSending(true);
    try {
      const result = await emailTemplatesApi.sendBulk({
        ...(mode === "template"
          ? { template_id: Number(templateId), subject: subject.trim() || undefined }
          : { subject: subject.trim(), body_html: body }),
        recipients: validRecipients,
      });
      if (result.failed === 0) {
        toast.success(`Email sent to ${result.sent} recipient${result.sent === 1 ? "" : "s"}.`);
        onOpenChange(false);
        setSubject("");
        setBody("");
      } else {
        toast.warning(`Sent ${result.sent}, failed ${result.failed}.`);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to send emails.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog modal={false} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Send Email</DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Recipients */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                <strong>{validRecipients.length}</strong> recipient{validRecipients.length === 1 ? "" : "s"}
              </span>
              {skipped > 0 && (
                <span className="text-xs text-[#C72030]">{skipped} skipped (no valid email)</span>
              )}
            </div>
            {validRecipients.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {validRecipients.slice(0, 30).map((r) => (
                  <span
                    key={r.email}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-700"
                    title={r.email}
                  >
                    {r.name || r.email}
                  </span>
                ))}
                {validRecipients.length > 30 && (
                  <span className="text-[11px] px-2 py-0.5 text-gray-400">
                    +{validRecipients.length - 30} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Mode toggle */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Send using:</Label>
            {(["template", "compose"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={
                  mode === m
                    ? "px-4 py-1.5 rounded text-sm font-medium bg-[#C72030] text-white transition-colors"
                    : "px-4 py-1.5 rounded text-sm font-medium border border-gray-300 text-gray-600 hover:border-[#C72030] transition-colors"
                }
              >
                {m === "template" ? "Template" : "Compose"}
              </button>
            ))}
          </div>

          {/* Fields */}
          {mode === "template" ? (
            <div className="grid grid-cols-1 gap-4">
              {loadingTemplates ? (
                <p className="text-sm text-gray-500">Loading templates…</p>
              ) : templates.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No active templates. Create one in Settings → Email Templates, or switch to Compose.
                </p>
              ) : (
                <>
                  <MuiFormControl fullWidth variant="outlined">
                    <InputLabel shrink sx={{ backgroundColor: "white", px: 1 }}>
                      Template <span style={{ color: "red" }}>*</span>
                    </InputLabel>
                    <MuiSelect
                      value={templateId}
                      onChange={(e) => setTemplateId(e.target.value as string)}
                      displayEmpty
                      label="Template *"
                      sx={fieldStyles}
                      MenuProps={menuProps}
                    >
                      <MenuItem value="" disabled>
                        <em>Select Template</em>
                      </MenuItem>
                      {templates.map((t) => (
                        <MenuItem key={t.id} value={String(t.id)}>
                          {t.name}
                          {t.category ? ` — ${t.category}` : ""}
                        </MenuItem>
                      ))}
                    </MuiSelect>
                  </MuiFormControl>

                  <TextField
                    label="Subject (override optional)"
                    placeholder={selectedTemplate?.subject || "Uses the template subject"}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    fullWidth
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ sx: fieldStyles }}
                  />

                  {selectedTemplate && (
                    <div>
                      <button
                        onClick={() => setShowPreview((s) => !s)}
                        className="text-xs flex items-center gap-1 mb-1.5 text-[#C72030]"
                      >
                        <Eye className="h-3.5 w-3.5" /> {showPreview ? "Hide preview" : "Preview template"}
                      </button>
                      {showPreview && (
                        <div
                          className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm max-h-56 overflow-auto"
                          dangerouslySetInnerHTML={{ __html: selectedTemplate.body_html || "<em>No content</em>" }}
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <TextField
                label="Subject"
                placeholder="Enter subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
              <TextField
                label="Body (HTML supported)"
                placeholder="Write your message. HTML and merge tags like {{user.name}} are supported."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                inputRef={bodyRef}
                fullWidth
                multiline
                minRows={7}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "white" } }}
              />
            </div>
          )}

          {/* Merge tags */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Insert merge tag</Label>
            <div className="flex flex-wrap gap-2">
              {Object.values(mergeTags)
                .flat()
                .map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertTag(tag)}
                    className="text-xs px-2.5 py-1 rounded-md border border-gray-300 text-gray-600 hover:border-[#C72030] hover:text-[#C72030] transition-colors"
                  >
                    {tag}
                  </button>
                ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleSend}
              disabled={sending || validRecipients.length === 0}
              className="bg-[#C72030] hover:bg-[#C72030]/90 text-white px-8"
            >
              {sending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendEmailModal;
