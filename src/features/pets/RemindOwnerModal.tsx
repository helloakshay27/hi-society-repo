import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CHANNELS, Channel, Pet, PetSettings, TEMPLATES, Template } from "./types";
import {
  apiErrorMessage, bulkRemind, fetchMessagePreview, getDueStatus, remindOwner, templateForStatus,
} from "./petsApi";

interface Props {
  pets: Pet[]; // one = row action (7.2), many = bulk (7.3)
  settings: PetSettings;
  onClose: () => void;
  /** ids that were actually reminded */
  onSent: (petIds: number[]) => void;
}

// Sheet 4 section B — manual "Remind owner"
export const RemindOwnerModal = ({ pets, settings, onClose, onSent }: Props) => {
  const single = pets.length === 1 ? pets[0] : null;
  const [template, setTemplate] = useState<Template>("Due soon");
  const [message, setMessage] = useState("");
  const [channels, setChannels] = useState<Channel[]>(settings.channels);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // 7.1 — preview text for a single pet whenever the template changes
  const loadPreview = async (pet: Pet, t: Template) => {
    setPreviewLoading(true);
    try {
      const preview = await fetchMessagePreview(pet.id, t);
      setMessage(preview.message || "");
    } catch {
      setMessage("");
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (!pets.length) return;
    const t = templateForStatus(getDueStatus(pets[0], settings.due_soon_window));
    setTemplate(t);
    setChannels(settings.channels);
    setMessage("");
    if (pets.length === 1) loadPreview(pets[0], t);
  }, [pets, settings]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeTemplate = (t: Template) => {
    setTemplate(t);
    if (single) loadPreview(single, t);
  };

  const send = async () => {
    if (!channels.length) {
      toast.error("Pick at least one channel");
      return;
    }
    if (single && message.length > 300) {
      toast.error("Message can be at most 300 characters");
      return;
    }
    setSending(true);
    try {
      if (single) {
        await remindOwner(single.id, { template, message: message.trim() || undefined, channels });
        toast.success(`Reminder sent to ${single.owner_name}`);
        onSent([single.id]);
      } else {
        const { sent, skipped } = await bulkRemind({ ids: pets.map((p) => p.id), template, channels });
        if (sent.length) toast.success(`Reminders sent to ${sent.length} owner${sent.length > 1 ? "s" : ""}`);
        if (skipped.length) toast.info(`${skipped.length} pet(s) skipped — reminders are off or they are up to date`);
        onSent(sent);
      }
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not send the reminder. Please try again."));
    } finally {
      setSending(false);
    }
  };

  // Closed (no pets picked) — render nothing
  if (!pets.length) return null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle>{single ? "Remind owner" : `Remind ${pets.length} owners`}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[#888780]">Recipient</div>
            {single ? (
              <div className="text-sm">
                {single.owner_name} · {single.tower_flat} <span className="text-[#888780]">({single.name})</span>
              </div>
            ) : (
              <div className="max-h-24 overflow-y-auto text-sm">
                {pets.map((p) => `${p.owner_name} · ${p.tower_flat}`).join(", ")}
              </div>
            )}
          </div>

          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[#888780]">Message template</div>
            <Select value={template} onValueChange={(v) => changeTemplate(v as Template)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TEMPLATES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[#888780]">Message</div>
            {single ? (
              <>
                <div className="relative">
                  <Textarea rows={4} maxLength={300} value={message} onChange={(e) => setMessage(e.target.value)} disabled={previewLoading} />
                  {previewLoading && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-[#888780]" />}
                </div>
                <div className="mt-1 text-right text-xs text-[#888780]">{message.length}/300</div>
              </>
            ) : (
              <div className="rounded-md bg-[#f6f4ee] p-3 text-sm text-[#5f5e58]">
                Each owner gets the “{template}” message with their own pet’s name and date. A custom message isn’t possible for bulk reminders.
              </div>
            )}
          </div>

          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[#888780]">Channels</div>
            <div className="flex flex-wrap gap-4">
              {CHANNELS.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={channels.includes(c)}
                    onCheckedChange={() => setChannels((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]))}
                  />
                  {c}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={sending}>Cancel</Button>
          <Button variant="ghost" className="btn-primary" onClick={send} disabled={sending || previewLoading}>
            {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send reminder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
