import React, { useState } from "react";
import {
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
  Typography,
} from "@mui/material";
import { Button as MuiButton } from "@mui/material";
import { toast } from "sonner";
import { HI_SOCIETY_CONFIG } from "@/config/apiConfig";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteSocietyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  societyId: number | null;
  societyName: string;
  canEdit: boolean;
}

export const DeleteSocietyModal: React.FC<DeleteSocietyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  societyId,
  societyName,
  canEdit,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!societyId) return;

    setIsDeleting(true);

    try {
      const baseUrl = HI_SOCIETY_CONFIG.BASE_URL;
      const token = HI_SOCIETY_CONFIG.TOKEN;
      const url = `${baseUrl}/admin/societies/${societyId}.json?token=${token}`;

      console.log("🗑️ Deleting society ID:", societyId);

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete society");
      }

      toast.success("Society deleted successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error deleting society:", error);
      toast.error(error.message || "Failed to delete society");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <MuiDialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <MuiDialogTitle
        sx={{
          bgcolor: "#fee2e2",
          color: "#991b1b",
          fontWeight: "bold",
          borderBottom: "1px solid #fecaca",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <AlertTriangle className="w-5 h-5" />
        Delete Society
      </MuiDialogTitle>

      <MuiDialogContent sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Are you sure you want to delete the society <strong>"{societyName}"</strong>?
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This action cannot be undone. All associated data will be permanently removed.
        </Typography>
      </MuiDialogContent>

      <MuiDialogActions sx={{ p: 2, bgcolor: "#f9fafb", borderTop: "1px solid #e2e8f0" }}>
        <MuiButton
          onClick={onClose}
          disabled={isDeleting}
          sx={{ color: "#64748b" }}
        >
          Cancel
        </MuiButton>
        <MuiButton
          onClick={handleDelete}
          disabled={isDeleting || !canEdit}
          variant="contained"
          sx={{
            bgcolor: "#dc2626",
            "&:hover": { bgcolor: "#b91c1c" },
            "&:disabled": { bgcolor: "#e2e8f0" },
          }}
        >
          {isDeleting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Deleting...
            </>
          ) : (
            "Delete"
          )}
        </MuiButton>
      </MuiDialogActions>
    </MuiDialog>
  );
};
