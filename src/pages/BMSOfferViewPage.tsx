import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  CircularProgress,
  styled,
  Chip,
} from "@mui/material";
import { Info, ArrowLeft, Pencil, Calendar, Link, FileText, Clock } from "lucide-react";
import axios from "axios";

interface Offer {
  id: number;
  society_id: number;
  start_date: string;
  end_date: string;
  url: string;
  description: string;
  user_id: number;
  status: "Active" | "Inactive" | "Expired" | "Scheduled";
  created_at: string;
  updated_at: string;
}

const SectionCard = styled(Paper)(() => ({
  backgroundColor: "white",
  boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)",
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
  backgroundColor: "#C72030",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  flexShrink: 0,
}));

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <Typography
    sx={{
      fontSize: "12px",
      fontWeight: 500,
      color: "rgba(0,0,0,0.45)",
      fontFamily: "Work Sans, sans-serif",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      mb: 0.5,
    }}
  >
    {children}
  </Typography>
);

const FieldValue = ({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
    {icon && <Box sx={{ color: "rgba(0,0,0,0.35)", display: "flex" }}>{icon}</Box>}
    <Typography
      sx={{
        fontSize: "14px",
        fontWeight: 500,
        color: "#1A1A1A",
        fontFamily: "Work Sans, sans-serif",
        wordBreak: "break-word",
      }}
    >
      {children || "-"}
    </Typography>
  </Box>
);

const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
  Active:    { bg: "#e6f4ea", color: "#1e7e34", border: "#a8d5b5" },
  Inactive:  { bg: "#f3f4f6", color: "#4b5563", border: "#d1d5db" },
  Expired:   { bg: "#fde8e8", color: "#c72030", border: "#f5c2c2" },
  Scheduled: { bg: "#e0effe", color: "#1a56db", border: "#a4cafe" },
};

function formatDate(val?: string) {
  if (!val) return "-";
  const d = new Date(val);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(val?: string) {
  if (!val) return "-";
  const d = new Date(val);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const BMSOfferViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [offer, setOffer] = useState<Offer | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const baseUrl = localStorage.getItem("baseUrl") || "";
    const token = localStorage.getItem("token") || "";

    axios
      .get(`https://${baseUrl}/crm/admin/log_offers/${id}.json`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setOffer(res.data))
      .catch(() => setError("Failed to load offer details."))
      .finally(() => setIsFetching(false));
  }, [id]);

  const statusStyle = offer?.status ? statusStyles[offer.status] ?? statusStyles.Inactive : statusStyles.Inactive;

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
            boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1)",
            marginBottom: "24px",
            padding: "12px 24px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
                View Offer
              </Typography>
            </Box>

            {/* Edit button */}
            {offer && (
              <IconButton
                onClick={() => navigate(`/bms/offers/edit/${id}`)}
                size="small"
                sx={{
                  color: "#C72030",
                  border: "1px solid #C72030",
                  borderRadius: 0,
                  padding: "6px 14px",
                  gap: 0.75,
                  "&:hover": { backgroundColor: "#fff5f5" },
                }}
              >
                <Pencil size={15} />
                <Typography sx={{ fontSize: "13px", fontFamily: "Work Sans, sans-serif", fontWeight: 500 }}>
                  Edit
                </Typography>
              </IconButton>
            )}
          </Box>
        </Paper>

        {/* Details Section */}
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
            {offer?.status && (
              <Chip
                label={offer.status}
                size="small"
                sx={{
                  ml: "auto",
                  backgroundColor: statusStyle.bg,
                  color: statusStyle.color,
                  border: `1px solid ${statusStyle.border}`,
                  borderRadius: "4px",
                  fontFamily: "Work Sans, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              />
            )}
          </SectionHeader>

          <Box sx={{ padding: "24px" }}>
            {isFetching ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress size={32} sx={{ color: "#C72030" }} />
              </Box>
            ) : error ? (
              <Typography
                sx={{ textAlign: "center", color: "#C72030", fontFamily: "Work Sans, sans-serif", py: 4 }}
              >
                {error}
              </Typography>
            ) : offer ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                  gap: "24px 32px",
                }}
              >
                {/* Start Date */}
                <Box>
                  <FieldLabel>Start Date</FieldLabel>
                  <FieldValue icon={<Calendar size={14} />}>{formatDate(offer.start_date)}</FieldValue>
                </Box>

                {/* End Date */}
                <Box>
                  <FieldLabel>End Date</FieldLabel>
                  <FieldValue icon={<Calendar size={14} />}>{formatDate(offer.end_date)}</FieldValue>
                </Box>

                {/* Status */}
                <Box>
                  <FieldLabel>Status</FieldLabel>
                  <FieldValue>{offer.status}</FieldValue>
                </Box>

                {/* URL */}
                <Box sx={{ gridColumn: { md: "span 3" } }}>
                  <FieldLabel>URL</FieldLabel>
                  {offer.url ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <Link size={14} color="rgba(0,0,0,0.35)" />
                      <Typography
                        component="a"
                        href={offer.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          fontSize: "14px",
                          fontWeight: 500,
                          fontFamily: "Work Sans, sans-serif",
                          color: "#1a56db",
                          textDecoration: "underline",
                          wordBreak: "break-all",
                        }}
                      >
                        {offer.url}
                      </Typography>
                    </Box>
                  ) : (
                    <FieldValue>-</FieldValue>
                  )}
                </Box>

                {/* Description */}
                <Box sx={{ gridColumn: { md: "span 3" } }}>
                  <FieldLabel>Description</FieldLabel>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 0.75,
                    }}
                  >
                    <Box sx={{ color: "rgba(0,0,0,0.35)", display: "flex", mt: "2px" }}>
                      <FileText size={14} />
                    </Box>
                    <Typography
                      sx={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: offer.description ? "#1A1A1A" : "rgba(0,0,0,0.35)",
                        fontFamily: "Work Sans, sans-serif",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {offer.description || "No description provided"}
                    </Typography>
                  </Box>
                </Box>

                {/* Divider */}
                <Box
                  sx={{
                    gridColumn: { md: "span 3" },
                    borderTop: "1px solid #e5e7eb",
                    my: 0.5,
                  }}
                />

                {/* Created At */}
                <Box>
                  <FieldLabel>Created At</FieldLabel>
                  <FieldValue icon={<Clock size={14} />}>{formatDateTime(offer.created_at)}</FieldValue>
                </Box>

                {/* Updated At */}
                <Box>
                  <FieldLabel>Last Updated</FieldLabel>
                  <FieldValue icon={<Clock size={14} />}>{formatDateTime(offer.updated_at)}</FieldValue>
                </Box>
              </Box>
            ) : null}
          </Box>
        </SectionCard>
      </Box>
    </Box>
  );
};

export default BMSOfferViewPage;
