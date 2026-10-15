import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Info, ArrowLeft, Pencil, Clock, Loader2 } from "lucide-react";
import axios from "axios";
import { OFFER_PAGE_STYLES } from "./offerPageStyles";

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

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="ref-kv-label">{label}</div>
    <div className="ref-kv-value">{children || "-"}</div>
  </div>
);

const statusTone: Record<string, string> = {
  Active: "success",
  Inactive: "neutral",
  Expired: "danger",
  Scheduled: "warning",
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

  const statusPill = offer?.status ? (
    <span className={`ref-pill ref-pill-${statusTone[offer.status] ?? "neutral"}`}>
      {offer.status}
    </span>
  ) : null;

  return (
    <div className="p-6 min-h-screen offer-ref-page">
      <style>{OFFER_PAGE_STYLES}</style>

      <button type="button" onClick={() => navigate(-1)} className="ref-back">
        <ArrowLeft className="w-4 h-4" />
        Back to Offers
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] text-[#1A1A18]">
            View Offer
          </h1>
          {statusPill}
        </div>
        {offer && (
          <button
            type="button"
            onClick={() => navigate(`/bms/offers/edit/${id}`)}
            className="ref-edit-btn"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        )}
      </div>

      {isFetching ? (
        <div className="ref-card">
          <div className="ref-card-body flex justify-center py-12">
            <Loader2 className="w-7 h-7 animate-spin text-[rgba(26,26,24,0.48)]" />
          </div>
        </div>
      ) : error ? (
        <div className="ref-card">
          <p className="ref-card-body text-center py-10 text-[13.5px] text-[#A63D49]">{error}</p>
        </div>
      ) : offer ? (
        <div className="space-y-6">
          <div className="ref-card">
            <div className="ref-card-head">
              <span className="ref-chip">
                <Info />
              </span>
              <h2>Offer Details</h2>
            </div>
            <div className="ref-card-body grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
              <Field label="Start Date">{formatDate(offer.start_date)}</Field>
              <Field label="End Date">{formatDate(offer.end_date)}</Field>
              <Field label="Status">{statusPill}</Field>
              <div className="sm:col-span-2 lg:col-span-3">
                <Field label="URL">
                  {offer.url ? (
                    <a href={offer.url} target="_blank" rel="noopener noreferrer" className="ref-link">
                      {offer.url}
                    </a>
                  ) : null}
                </Field>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <Field label="Description">
                  <span className="whitespace-pre-wrap leading-relaxed">
                    {offer.description || "No description provided"}
                  </span>
                </Field>
              </div>
            </div>
          </div>

          <div className="ref-card">
            <div className="ref-card-head">
              <span className="ref-chip">
                <Clock />
              </span>
              <h2>Record Info</h2>
            </div>
            <div className="ref-card-body grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
              <Field label="Created At">{formatDateTime(offer.created_at)}</Field>
              <Field label="Last Updated">{formatDateTime(offer.updated_at)}</Field>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default BMSOfferViewPage;
