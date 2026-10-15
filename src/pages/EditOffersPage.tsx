import React, { useState, useRef, useEffect } from "react";
import { TextField } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { Info, ImagePlus, X, ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import axios from "axios";
import { OFFER_PAGE_STYLES } from "./offerPageStyles";

const MAX_CHARS = 500;

// HTML date input gives YYYY-MM-DD; API expects DD/MM/YYYY
const toApiDate = (value: string) => {
  if (!value) return "";
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
};

const EditOffersPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing offer data
  useEffect(() => {
    if (!id) return;
    const baseUrl = localStorage.getItem("baseUrl") || "";
    const token = localStorage.getItem("token") || "";

    axios
      .get(`https://${baseUrl}/crm/admin/log_offers/${id}.json`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const offer = res.data;
        setStartDate(offer.start_date ?? "");
        setEndDate(offer.end_date ?? "");
        setUrl(offer.url ?? "");
        setDescription(offer.description ?? "");
      })
      .catch(() => setError("Failed to load offer details."))
      .finally(() => setIsFetching(false));
  }, [id]);

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

      await axios.put(
        `https://${baseUrl}/crm/admin/log_offers/${id}.json`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

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
    <div className="p-6 min-h-screen offer-ref-page">
      <style>{OFFER_PAGE_STYLES}</style>

      <div className="mb-[22px]">
        <div className="flex items-center gap-2 text-[13px] font-medium mb-3 text-[rgba(26,26,24,0.48)]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F5F4F0] transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span>Offers</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-[#1A1A18]">Edit Offer</span>
        </div>
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] text-[#1A1A18]">
          Edit Offer
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="ref-card">
          <div className="ref-card-head">
            <span className="ref-chip">
              <Info />
            </span>
            <h2>Offer Details</h2>
          </div>

          {isFetching ? (
            <div className="ref-card-body flex justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-[rgba(26,26,24,0.48)]" />
            </div>
          ) : (
          <div className="ref-card-body grid grid-cols-1 md:grid-cols-2 gap-5">
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <div className="md:col-span-2">
              <label htmlFor="offer-description" className="ref-label">
                Description
              </label>
              <textarea
                id="offer-description"
                value={description}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CHARS) setDescription(e.target.value);
                }}
                placeholder="Provide a brief description of the offer..."
                maxLength={MAX_CHARS}
                rows={4}
                className="ref-textarea"
              />
              <div className="flex justify-between mt-1.5 text-[11px]">
                <span className="text-[rgba(26,26,24,0.48)]">Keep it concise and informative</span>
                <span
                  className={
                    isNearLimit ? "font-semibold text-[#A63D49]" : "text-[rgba(26,26,24,0.4)]"
                  }
                >
                  {charCount}/{MAX_CHARS}
                </span>
              </div>
            </div>

            <div className="md:col-span-2">
              <span className="ref-label">Offer Image</span>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />

              <div
                onClick={() => imageInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`ref-dropzone ${isDragOver ? "is-over" : ""}`}
              >
                {imagePreview ? (
                  <div className="flex items-center gap-6">
                    <div className="relative shrink-0">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-[110px] h-[110px] object-cover rounded-xl border border-[rgba(26,26,24,0.08)] block"
                      />
                      <button
                        type="button"
                        onClick={handleImageRemove}
                        className="ref-remove"
                        aria-label="Remove image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-semibold text-[#1A1A18] mb-1 break-words">
                        {image?.name}
                      </p>
                      <p className="text-xs text-[rgba(26,26,24,0.48)] mb-2">
                        {image ? (image.size / 1024).toFixed(1) + " KB" : ""}
                      </p>
                      <p className="text-xs font-medium text-[#1A1A18] underline underline-offset-2">
                        Click to replace
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="ref-dropzone-icon mb-1">
                      <ImagePlus size={20} />
                    </span>
                    <p className="text-[13.5px] font-medium text-[#1A1A18]">Drag & drop image here</p>
                    <p className="text-xs text-[rgba(26,26,24,0.48)]">
                      or{" "}
                      <span className="font-medium text-[#1A1A18] underline underline-offset-2">
                        browse to upload
                      </span>
                    </p>
                    <p className="text-[11px] text-[rgba(26,26,24,0.32)] mt-0.5">
                      PNG, JPG, GIF · Max 10 MB
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
        </div>

        {error && <p className="mt-4 text-[13px] text-right text-[#A63D49]">{error}</p>}

        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
            className="btn-cancel h-9 px-4 text-sm font-medium bg-white border border-[#da7756] text-[#da7756] hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isFetching}
            className="btn-primary h-9 px-4 text-sm font-medium inline-flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? "Updating..." : "Update"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditOffersPage;
