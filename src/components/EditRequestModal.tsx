import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X } from "lucide-react";

interface EditRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    status: string;
    reason: string;
    token?: string;
  }) => void | Promise<void>;
  token?: string;
  isSubmitting?: boolean;
}

export const EditRequestModal: React.FC<EditRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  token,
  isSubmitting = false,
}) => {
  const [status, setStatus] = React.useState("Cancel");
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (!isOpen) {
      setReason("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    await onSubmit({ status, reason, token });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isSubmitting && onClose()}
    >
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="px-4 py-2.5 flex flex-row items-center justify-between border-b border-[#D5DbDB]">
          <div className="flex-1 text-center">
            <DialogTitle className="text-[#1a1a1a] font-bold text-lg inline-block">
              Edit Request
            </DialogTitle>
          </div>
          <button
            onClick={() => !isSubmitting && onClose()}
            disabled={isSubmitting}
            className="text-red-500 hover:text-red-700 transition-colors p-1"
          >
            <X className="h-5 w-5 stroke-[3px]" />
          </button>
        </DialogHeader>

        <div className="p-6 space-y-6 bg-white">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Status
            </label>
            <Select
              value={status}
              onValueChange={setStatus}
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-full border-gray-300 focus:ring-0 focus:border-gray-400 h-10 shadow-none">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent className="z-[60]">
                <SelectItem value="Cancel">Cancel</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Reason
            </label>
            <Textarea
              placeholder="Add Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
              className="min-h-[80px] border-gray-300 focus:ring-0 focus:border-gray-400 shadow-none text-sm p-3"
            />
          </div>
        </div>

        <div className="bg-white px-6 py-4 flex justify-end gap-3 border-t border-[#D5DbDB]">
          <button
            type="button"
            onClick={() => !isSubmitting && onClose()}
            disabled={isSubmitting}
            className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[rgba(26,26,24,.08)] bg-white px-[22px] text-[13px] font-semibold text-[rgba(26,26,24,.68)] transition-all hover:border-[rgba(26,26,24,.28)] hover:text-[#1A1A18] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-[#1A1A18] bg-[#1A1A18] px-[22px] text-[13px] font-semibold text-white transition-colors hover:bg-[#12100E] disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
