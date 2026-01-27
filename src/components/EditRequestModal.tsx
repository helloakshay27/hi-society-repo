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
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface EditRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { status: string; reason: string; token?: string }) => void;
  token?: string;
}

export const EditRequestModal: React.FC<EditRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  token,
}) => {
  const [status, setStatus] = React.useState("Cancel");
  const [reason, setReason] = React.useState("");

  const handleSubmit = () => {
    onSubmit({ status, reason, token });
    setReason(""); // Reset for next time
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="bg-[#f6f4ee] px-4 py-2.5 flex flex-row items-center justify-between border-b border-[#D5DbDB]">
          <div className="flex-1 text-center">
            <DialogTitle className="text-[#1a1a1a] font-bold text-lg inline-block">
              Edit Request
            </DialogTitle>
          </div>
          <button
            onClick={onClose}
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
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full border-gray-300 focus:ring-0 focus:border-gray-400 h-10 shadow-none">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent className="z-[60]">
                <SelectItem value="Cancel">Cancel</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
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
              className="min-h-[80px] border-gray-300 focus:ring-0 focus:border-gray-400 shadow-none text-sm p-3"
            />
          </div>
        </div>

        <div className="bg-white px-6 py-4 flex justify-center border-t border-[#D5DbDB]">
          <Button
            onClick={handleSubmit}
            className="bg-[#00A65A] hover:bg-[#008D4C] text-white px-10 h-10 font-semibold rounded-md transition-all active:scale-95"
          >
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
