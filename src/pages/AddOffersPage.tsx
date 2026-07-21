import React, { useState, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button as MuiButton,
  IconButton,
  CircularProgress,
  styled,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Info, ImagePlus, X, ArrowLeft } from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";

const SectionCard = styled(Paper)(() => ({
  backgroundColor: "white",
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  borderRadius: 0,
  overflow: "hidden",
  marginBottom: "24px",
}));

const SectionHeader = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "16px 24px",
  backgroundColor: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
}));

const RedIcon = styled(Box)(() => ({
  color: "white",
  backgroundColor: "var(--color-primary, #da7756)",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  flexShrink: 0,
}));

const RedButton = styled(MuiButton)(() => ({
  backgroundColor: "#C72030",
  color: "white",
  borderRadius: 0,
  textTransform: "none",
  padding: "8px 24px",
  fontFamily: "Work Sans, sans-serif",
  fontWeight: 500,
  minWidth: "100px",
  "&:hover": { backgroundColor: "#a01828" },
  "&.Mui-disabled": { backgroundColor: "#e57373", color: "white" },
}));

const DraftButton = styled(MuiButton)(() => ({
  backgroundColor: "#e7e3d9",
  color: "#C72030",
  borderRadius: 0,
  textTransform: "none",
  padding: "8px 24px",
  fontFamily: "Work Sans, sans-serif",
  fontWeight: 500,
  "&:hover": { backgroundColor: "#d9d5c9" },
}));

const fieldStyles = {
  "& .MuiOutlinedInput-root": {
    fontSize: "14px",
    backgroundColor: "#fff",
    "& fieldset": { borderColor: "#ddd" },
    "&:hover fieldset": { borderColor: "#C72030" },
    "&.Mui-focused fieldset": { borderColor: "#C72030" },
  },
  "& .MuiInputLabel-root": {
    fontSize: "14px",
    "&.Mui-focused": { color: "#C72030" },
  },
};

const MAX_CHARS = 500;

// HTML date input gives YYYY-MM-DD; API expects DD/MM/YYYY
const toApiDate = (value: string) => {
  if (!value) return "";
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
};

const AddOffersPage: React.FC = () => {
  const navigate = useNavigate();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyImage = (file: File) => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) applyImage(selected);
  };

  const handleImageRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.type.startsWith("image/")) applyImage(dropped);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const baseUrl = localStorage.getItem("baseUrl") || "";
      const token = localStorage.getItem("token") || "";

      const formData = new FormData();
      formData.append("log_offer[start_date]", toApiDate(startDate));
      formData.append("log_offer[end_date]", toApiDate(endDate));
      formData.append("log_offer[url]", url);
      formData.append("log_offer[description]", description);
      if (image) formData.append("attachments", image);

      await axios.post(`https://${baseUrl}/crm/admin/log_offers.json`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      navigate(-1);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const charCount = description.length;
  const isNearLimit = charCount > MAX_CHARS * 0.85;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#fafafa",
        padding: "24px",
        fontFamily: "Work Sans, sans-serif",
      }}
    >
      <Box sx={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Page Header */}
        <Paper
          sx={{
            backgroundColor: "#f6f4ee",
            borderRadius: 0,
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
            marginBottom: "24px",
            padding: "12px 24px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconButton
              onClick={() => navigate(-1)}
              size="small"
              sx={{ color: "#C72030", "&:hover": { backgroundColor: "#f6eaea" } }}
            >
              <ArrowLeft size={20} />
            </IconButton>
            <Typography
              sx={{ fontSize: "20px", fontWeight: 600, color: "#1A1A1A", fontFamily: "Work Sans, sans-serif" }}
            >
              Add Offer
            </Typography>
          </Box>
        </Paper>

        {/* Offer Details Section */}
        <SectionCard>
          <SectionHeader>
            <RedIcon>
              <Info size={16} />
            </RedIcon>
            <Typography
              sx={{ fontSize: "16px", fontWeight: 600, color: "#1A1A1A", fontFamily: "Work Sans, sans-serif" }}
            >
              Offer Details
            </Typography>
          </SectionHeader>

          <Box sx={{ padding: "24px" }}>
            <form onSubmit={handleSubmit}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                  gap: "16px",
                  mb: 3,
                }}
              >
                {/* Start Date */}
                <TextField
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={fieldStyles}
                  size="small"
                  fullWidth
                />

                {/* End Date */}
                <TextField
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={fieldStyles}
                  size="small"
                  fullWidth
                />

                {/* URL */}
                <TextField
                  label="URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  sx={fieldStyles}
                  size="small"
                  fullWidth
                />

                {/* Description — full width with character counter */}
                <Box sx={{ marginTop: 1, gridColumn: { md: "span 2" } }}>
                  <TextField
                    label="Description"
                    value={description}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_CHARS) setDescription(e.target.value);
                    }}
                    placeholder="Provide a brief description of the offer..."
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "auto !important",
                        padding: "2px !important",
                        display: "flex",
                      },
                      "& .MuiInputBase-input[aria-hidden='true']": {
                        flex: 0,
                        width: 0,
                        height: 0,
                        padding: "0 !important",
                        margin: 0,
                        display: "none",
                      },
                      "& .MuiInputBase-input": {
                        resize: "none !important",
                      },
                    }}
                    size="small"
                    fullWidth
                    multiline
                    rows={4}
                    inputProps={{ maxLength: MAX_CHARS }}
                    helperText={
                      <Box
                        component="span"
                        sx={{ display: "flex", justifyContent: "space-between", pt: "2px" }}
                      >
                        <Typography
                          component="span"
                          sx={{ fontSize: "11px", color: "rgba(0,0,0,0.45)", fontFamily: "Work Sans, sans-serif" }}
                        >
                          Keep it concise and informative
                        </Typography>
                        <Typography
                          component="span"
                          sx={{
                            fontSize: "11px",
                            fontFamily: "Work Sans, sans-serif",
                            color: isNearLimit ? "#C72030" : "rgba(0,0,0,0.38)",
                            fontWeight: isNearLimit ? 600 : 400,
                          }}
                        >
                          {charCount}/{MAX_CHARS}
                        </Typography>
                      </Box>
                    }
                    FormHelperTextProps={{ sx: { mx: 0 } }}
                  />
                </Box>

                {/* Image Picker — full width drag-and-drop */}
                <Box sx={{ gridColumn: { md: "span 2" } }}>
                  <Typography
                    sx={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "rgba(0,0,0,0.6)",
                      mb: 1,
                      fontFamily: "Work Sans, sans-serif",
                    }}
                  >
                    Offer Image
                  </Typography>

                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />

                  <Box
                    onClick={() => imageInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    sx={{
                      border: `2px dashed ${isDragOver ? "#C72030" : "#ddd"}`,
                      borderRadius: "6px",
                      padding: "28px 24px",
                      textAlign: "center",
                      cursor: "pointer",
                      backgroundColor: isDragOver ? "#fff5f5" : "#fafafa",
                      transition: "border-color 0.2s, background-color 0.2s",
                      minHeight: "160px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      "&:hover": { borderColor: "#C72030", backgroundColor: "#fff5f5" },
                    }}
                  >
                    {imagePreview ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Box sx={{ position: "relative", flexShrink: 0 }}>
                          <img
                            src={imagePreview}
                            alt="Preview"
                            style={{
                              width: "110px",
                              height: "110px",
                              objectFit: "cover",
                              borderRadius: "6px",
                              border: "1px solid #e5e7eb",
                              display: "block",
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={handleImageRemove}
                            sx={{
                              position: "absolute",
                              top: -10,
                              right: -10,
                              backgroundColor: "#C72030",
                              color: "white",
                              width: "22px",
                              height: "22px",
                              "&:hover": { backgroundColor: "#a01828" },
                            }}
                          >
                            <X size={12} />
                          </IconButton>
                        </Box>
                        <Box sx={{ textAlign: "left" }}>
                          <Typography
                            sx={{
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "#1A1A1A",
                              fontFamily: "Work Sans, sans-serif",
                              mb: 0.5,
                              wordBreak: "break-word",
                            }}
                          >
                            {image?.name}
                          </Typography>
                          <Typography
                            sx={{ fontSize: "12px", color: "rgba(0,0,0,0.45)", fontFamily: "Work Sans, sans-serif", mb: 1 }}
                          >
                            {image ? (image.size / 1024).toFixed(1) + " KB" : ""}
                          </Typography>
                          <Typography
                            sx={{ fontSize: "12px", color: "#C72030", fontFamily: "Work Sans, sans-serif", textDecoration: "underline" }}
                          >
                            Click to replace
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                        <Box
                          sx={{
                            width: 52,
                            height: 52,
                            borderRadius: "50%",
                            backgroundColor: "#f6f4ee",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mb: 0.5,
                          }}
                        >
                          <ImagePlus size={24} color="#C72030" />
                        </Box>
                        <Typography
                          sx={{ fontSize: "14px", fontWeight: 500, color: "#1A1A1A", fontFamily: "Work Sans, sans-serif" }}
                        >
                          Drag & drop image here
                        </Typography>
                        <Typography sx={{ fontSize: "12px", color: "rgba(0,0,0,0.45)", fontFamily: "Work Sans, sans-serif" }}>
                          or{" "}
                          <span style={{ color: "#C72030", textDecoration: "underline" }}>
                            browse to upload
                          </span>
                        </Typography>
                        <Typography
                          sx={{ fontSize: "11px", color: "rgba(0,0,0,0.3)", fontFamily: "Work Sans, sans-serif", mt: 0.5 }}
                        >
                          PNG, JPG, GIF · Max 10 MB
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Error message */}
              {error && (
                <Typography
                  sx={{
                    fontSize: "13px",
                    color: "#C72030",
                    fontFamily: "Work Sans, sans-serif",
                    textAlign: "center",
                    mb: 2,
                  }}
                >
                  {error}
                </Typography>
              )}

              {/* Action Buttons */}
              <Box
                sx={{
                  borderTop: "1px solid #e5e7eb",
                  pt: 2,
                  display: "flex",
                  justifyContent: "center",
                  gap: 2,
                }}
              >
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => navigate(-1)}
                  disabled={isSubmitting}
                  className="bg-[#C72030] hover:bg-[#A01828] !text-white border-0"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#C72030] hover:bg-[#A01828] !text-white border-0"
                >
                  {isSubmitting ? (
                    <CircularProgress size={16} sx={{ color: "white" }} />
                  ) : (
                    "Save"
                  )}
                </Button>
              </Box>
            </form>
          </Box>
        </SectionCard>
      </Box>
    </Box>
  );
};

export default AddOffersPage;
