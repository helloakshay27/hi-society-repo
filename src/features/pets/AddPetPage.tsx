import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Avatar, Box, FormControl, FormHelperText, FormLabel,
  Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputLabel, MenuItem, Select, TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  AlertTriangle, Bird, Camera, Cat, ClipboardCheck, Dog, FileText, Loader2, PawPrint, Rabbit, Syringe, Upload, UserRound, X,
} from "lucide-react";
import {
  DEFAULT_BREEDS, DEFAULT_SETTINGS, Pet, PetSettings, PetType,
  VACCINATION_STATUSES, VaccinationStatus,
} from "./types";
import {
  apiErrorMessage, apiFieldErrors, certificateState, createPet, fetchPet, fetchPetSettings, formatDate, getDueStatus, updatePet,
} from "./petsApi";
import { FormFooter, PageHeader, SectionCard } from "./FormLayout";

const REGISTER_PATH = "/settings/pets";
const PHOTO_TYPES = ["JPG", "PNG"];
const PHOTO_MAX_MB = 5;
const PET_TYPES_IN_ORDER: PetType[] = ["Dog", "Cat", "Bird", "Other"];

// ── Same field look as Add User (settings/manage-users/add) ─────────────────
const fieldStyles = {
  "& .MuiOutlinedInput-root": {
    fontSize: "14px",
    backgroundColor: "#fff",
    "& fieldset": { borderColor: "#ddd" },
    "&:hover fieldset": { borderColor: "#1A1A18" },
    "&.Mui-focused fieldset": { borderColor: "#1A1A18" },
  },
  "& .MuiInputLabel-root": { fontSize: "14px", "&.Mui-focused": { color: "#1A1A18" } },
  "& .MuiFormLabel-asterisk": { color: "#1A1A18" },
};

const legendStyles = {
  fontSize: "14px",
  color: "rgba(0, 0, 0, 0.6)",
  marginBottom: "4px",
  "&.Mui-focused": { color: "rgba(0, 0, 0, 0.6)" },
  "& .MuiFormLabel-asterisk": { color: "#1A1A18" },
};

const TYPE_ICONS: Record<PetType, React.ElementType> = { Dog, Cat, Bird, Other: Rabbit };

// PT-06 — "Tile selector"
const TileSelector = ({
  options, value, onChange, error,
}: { options: PetType[]; value: string; onChange: (v: PetType) => void; error?: boolean }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="group">
    {options.map((t) => {
      const Icon = TYPE_ICONS[t];
      const on = value === t;
      return (
        <button
          key={t}
          type="button"
          aria-pressed={on}
          onClick={() => onChange(t)}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border py-3 text-sm transition-colors ${
            on
              ? "border-[#1A1A18] bg-[#F5F4F0] font-medium text-[#1A1A18]"
              : `${error ? "border-[#d32f2f]" : "border-[#ddd]"} bg-white text-[rgba(26,26,24,.68)] hover:border-[#1A1A18]`
          }`}
        >
          <Icon className="h-5 w-5" />
          {t}
        </button>
      );
    })}
  </div>
);

// PT-11, PT-13 — "Segmented"
const Segmented = <T extends string>({
  options, value, onChange, error,
}: { options: readonly T[]; value: string; onChange: (v: T) => void; error?: boolean }) => (
  <div
    role="group"
    className={`flex w-full rounded-lg border bg-[#fafafa] p-1 ${error ? "border-[#d32f2f]" : "border-[#ddd]"}`}
  >
    {options.map((o) => (
      <button
        key={o}
        type="button"
        aria-pressed={value === o}
        onClick={() => onChange(o)}
        className={`flex-1 rounded-md px-3 py-1.5 text-sm transition-colors ${
          value === o ? "bg-[#1A1A18] font-medium text-white" : "text-[rgba(26,26,24,.68)] hover:text-[#1A1A18]"
        }`}
      >
        {o}
      </button>
    ))}
  </div>
);

// PT-18 — "Camera / gallery": camera capture dialog
const CameraDialog = ({ open, onClose, onCapture }: { open: boolean; onClose: () => void; onCapture: (file: File) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    if (!open) return;
    setCameraError("");
    navigator.mediaDevices
      ?.getUserMedia({ video: true })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setCameraError("Camera not available. Allow camera access or upload a photo instead."));
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], `pet_photo_${Date.now()}.jpg`, { type: "image/jpeg" }));
        onClose();
      },
      "image/jpeg",
      0.9
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: "16px", fontWeight: 600 }}>Take photo</DialogTitle>
      <DialogContent>
        {cameraError ? (
          <Box sx={{ fontSize: "14px", color: "#9b2c37" }}>{cameraError}</Box>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", borderRadius: 8, background: "#000" }} />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-[38px] items-center rounded-lg border border-[rgba(26,26,24,.08)] bg-white px-4 text-[13px] font-semibold text-[rgba(26,26,24,.68)]"
        >
          Cancel
        </button>
        {!cameraError && (
          <button
            type="button"
            onClick={capture}
            className="inline-flex min-h-[38px] items-center rounded-lg border border-[#1A1A18] bg-[#1A1A18] px-4 text-[13px] font-semibold text-white"
          >
            Capture
          </button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const darkIconButton = {
  backgroundColor: "#1A1A18",
  color: "white",
  width: "36px",
  height: "36px",
  "&:hover": { backgroundColor: "#12100E" },
};

const PetAvatar = styled(Avatar)(() => ({
  width: 128,
  height: 128,
  backgroundColor: "#F5F4F0",
  color: "#1A1A18",
  border: "1px solid rgba(26,26,24,.09)",
}));

const gridSx = { display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: "16px" };

type ErrorKey = keyof FormState | "certificate" | "photo";

const todayIso = () => new Date().toISOString().slice(0, 10);
const plusOneYear = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};
const extOk = (file: File, types: string[]) => {
  const ext = file.name.split(".").pop()?.toUpperCase() ?? "";
  return types.includes(ext === "JPEG" ? "JPG" : ext);
};
const sizeLabel = (bytes: number) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

interface FormState {
  pet_type: PetType | "";
  pet_type_other: string;
  breed: string;
  breed_other: string;
  name: string;
  gender: string;
  date_of_birth: string;
  vaccination_status: VaccinationStatus | "";
  vaccination_date: string;
  next_vaccination_date: string;
  remarks: string;
}

const EMPTY: FormState = {
  pet_type: "", pet_type_other: "", breed: "", breed_other: "", name: "", gender: "", date_of_birth: "",
  vaccination_status: "", vaccination_date: "", next_vaccination_date: "", remarks: "",
};

// API field (3.1 / 422) → form field
const API_FIELD: Record<string, ErrorKey> = {
  pet_name: "name", pet_type: "pet_type", pet_type_other: "pet_type_other", breed: "breed", breed_other: "breed_other",
  gender: "gender", date_of_birth: "date_of_birth", vaccination_status: "vaccination_status",
  vaccination_date: "vaccination_date", next_vaccination_date: "next_vaccination_date",
  certificate: "certificate", photo: "photo", remarks: "remarks",
};

// Sheet 2 · "Add a pet" — the fields the resident app captures, entered by the admin on web
export const AddPetPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [existing, setExisting] = useState<Pet | null>(null); // edit mode — the saved pet
  const [settings, setSettings] = useState<PetSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<ErrorKey, string>>>({});
  const [certificate, setCertificate] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const certInput = useRef<HTMLInputElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  // 1.1 — society rules drive the form (allowed types, breeds, mandatory fields);
  // 4.4 — in edit mode the saved pet fills the form
  useEffect(() => {
    const loadSettings = fetchPetSettings()
      .then(setSettings)
      .catch((err) => toast.error(apiErrorMessage(err, "Could not load pet settings — using defaults")));
    const loadPet = isEdit
      ? fetchPet(Number(id))
          .then((pet) => {
            setExisting(pet);
            setForm({
              pet_type: pet.pet_type,
              pet_type_other: pet.pet_type_other || "",
              breed: pet.breed || "",
              breed_other: pet.breed_other || "",
              name: pet.name || "",
              gender: pet.gender || "",
              date_of_birth: pet.date_of_birth ? String(pet.date_of_birth).slice(0, 10) : "",
              vaccination_status: pet.vaccination_status,
              vaccination_date: pet.vaccination_date || "",
              next_vaccination_date: pet.next_vaccination_date || "",
              remarks: pet.remarks || "",
            });
            setPhotoPreview(pet.photo_url || null);
          })
          .catch((err) => {
            toast.error(apiErrorMessage(err, "Could not load the pet"));
            navigate(REGISTER_PATH);
          })
      : Promise.resolve();
    Promise.all([loadSettings, loadPet]).finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  const backPath = isEdit ? `/settings/pets/${id}` : REGISTER_PATH;

  useEffect(() => () => {
    if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const pickType = (type: PetType) => {
    setForm((f) => ({ ...f, pet_type: type, pet_type_other: "", breed: "", breed_other: "" }));
    setErrors((e) => ({ ...e, pet_type: undefined, breed: undefined, breed_other: undefined }));
  };

  // PT-08 — breeds for the chosen type, as configured in Pet settings (PS-04)
  const breedOptions = useMemo(() => {
    if (!form.pet_type || form.pet_type === "Other") return [];
    const type = form.pet_type;
    const visible = settings.breeds[type] ?? DEFAULT_BREEDS[type];
    const ordered = [
      ...DEFAULT_BREEDS[type].filter((b) => visible.includes(b) || b === "Indie / Mixed"),
      ...visible.filter((b) => !DEFAULT_BREEDS[type].includes(b)),
    ].filter((b) => b !== "Other");
    return [...new Set(ordered), "Other"];
  }, [form.pet_type, settings.breeds]);

  const pickVaccination = (status: VaccinationStatus) => {
    setForm((f) => ({
      ...f,
      vaccination_status: status,
      ...(status === "Not taken" ? { vaccination_date: "", next_vaccination_date: "" } : {}),
    }));
    if (status === "Not taken") setCertificate(null);
    setErrors((e) => ({ ...e, vaccination_status: undefined }));
  };

  const pickVaccinationDate = (iso: string) => {
    // PT-15 default = date of vaccination + 1 year
    setForm((f) => ({
      ...f,
      vaccination_date: iso,
      next_vaccination_date: f.next_vaccination_date || (iso ? plusOneYear(iso) : ""),
    }));
    setErrors((e) => ({ ...e, vaccination_date: undefined, next_vaccination_date: undefined }));
  };

  const onCertificate = (file?: File) => {
    if (!file) return;
    if (!extOk(file, settings.certificate_file_types)) {
      setErrors((e) => ({ ...e, certificate: `Only ${settings.certificate_file_types.join(", ")} files` }));
      return;
    }
    if (file.size > settings.certificate_max_mb * 1024 * 1024) {
      setErrors((e) => ({ ...e, certificate: `File must be ${settings.certificate_max_mb} MB or smaller` }));
      return;
    }
    setCertificate(file);
    setErrors((e) => ({ ...e, certificate: undefined }));
  };

  const onPhoto = (file?: File) => {
    if (!file) return;
    if (!extOk(file, PHOTO_TYPES)) {
      setErrors((e) => ({ ...e, photo: "Only JPG or PNG photos" }));
      return;
    }
    if (file.size > PHOTO_MAX_MB * 1024 * 1024) {
      setErrors((e) => ({ ...e, photo: `Photo must be ${PHOTO_MAX_MB} MB or smaller` }));
      return;
    }
    if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setErrors((e) => ({ ...e, photo: undefined }));
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(existing?.photo_url || null); // edit: back to the saved photo
  };

  // edit mode: the saved certificate / photo count for the mandatory checks
  const hasCertificate = !!certificate || !!existing?.certificate_url;
  const hasPhoto = !!photo || !!existing?.photo_url;

  const vaccinated = form.vaccination_status === "Completely" || form.vaccination_status === "Partially";
  const notTakenBlocked = form.vaccination_status === "Not taken" && !settings.allow_not_taken;
  const allowedTypes = PET_TYPES_IN_ORDER.filter((t) => settings.allowed_pet_types.includes(t));

  const validate = () => {
    const e: Partial<Record<ErrorKey, string>> = {};
    const today = todayIso();
    if (!form.pet_type) e.pet_type = "Choose a pet type";
    if (form.pet_type === "Other" && !form.pet_type_other.trim()) e.pet_type_other = "Tell us the pet type";
    if (form.pet_type && form.pet_type !== "Other" && !form.breed) e.breed = "Choose a breed";
    if ((form.pet_type === "Other" || form.breed === "Other") && !form.breed_other.trim()) e.breed_other = "Enter the breed";
    if (!form.name.trim()) e.name = "Enter the pet name";
    else if (!/^[A-Za-z ]+$/.test(form.name.trim())) e.name = "Letters and spaces only";
    if (form.date_of_birth && form.date_of_birth > today) e.date_of_birth = "Can't be in the future";
    if (!form.vaccination_status) e.vaccination_status = "Choose a vaccination status";
    if (vaccinated) {
      if (!form.vaccination_date) e.vaccination_date = "Enter the date of vaccination";
      else if (form.vaccination_date > today) e.vaccination_date = "Can't be in the future";
      if (!form.next_vaccination_date) e.next_vaccination_date = "Enter the next vaccination date";
      else if (form.vaccination_date && form.next_vaccination_date <= form.vaccination_date)
        e.next_vaccination_date = "Must be after the date of vaccination";
      if (settings.certificate_mandatory && !hasCertificate) e.certificate = "Upload the vaccination certificate";
    }
    if (settings.photo_mandatory && !hasPhoto) e.photo = "Add a photo of the pet";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!isEdit && settings.module_status !== "Active") {
      toast.error(`The Pets module is ${settings.module_status} — pets can't be added (Pet Settings)`);
      return;
    }
    if (notTakenBlocked) {
      toast.error("Society rules don't allow adding a pet that is not vaccinated");
      return;
    }
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    // 3.1 POST /my_pets.json (form-data). Owner, flat, pet ID and statuses are set by the API.
    setSaving(true);
    try {
      const fields = {
        pet_type: form.pet_type as PetType,
        pet_type_other: form.pet_type === "Other" ? form.pet_type_other.trim() : undefined,
        breed: form.pet_type === "Other" ? "Other" : form.breed,
        breed_other: form.pet_type === "Other" || form.breed === "Other" ? form.breed_other.trim() : undefined,
        pet_name: form.name.trim(),
        gender: form.gender || undefined,
        date_of_birth: form.date_of_birth || undefined,
        vaccination_status: form.vaccination_status,
        vaccination_date: vaccinated ? form.vaccination_date : undefined,
        next_vaccination_date: vaccinated ? form.next_vaccination_date : undefined,
        remarks: form.remarks.trim() || undefined,
        certificate: vaccinated ? certificate : null,
        photo,
      };
      if (isEdit && existing) {
        // 3.4 PATCH /my_pets/:id.json — clear dates / remarks explicitly when emptied
        const pet = await updatePet(existing.id, {
          ...fields,
          vaccination_date: vaccinated ? form.vaccination_date : "",
          next_vaccination_date: vaccinated ? form.next_vaccination_date : "",
          date_of_birth: form.date_of_birth,
          remarks: form.remarks.trim(),
          pet_type_other: form.pet_type === "Other" ? form.pet_type_other.trim() : "",
          breed_other: form.pet_type === "Other" || form.breed === "Other" ? form.breed_other.trim() : "",
        });
        toast.success(`${pet.name || form.name.trim()} updated`);
        navigate(`/settings/pets/${existing.id}`);
      } else {
        const pet = await createPet(fields);
        toast.success(`${pet.name || form.name.trim()} added${pet.pet_code ? ` (${pet.pet_code})` : ""}`);
        navigate(pet.id ? `/settings/pets/${pet.id}` : REGISTER_PATH);
      }
    } catch (error) {
      // 422 → show each message under its field; "base" (e.g. max pets per flat) as a toast
      const fieldErrors = apiFieldErrors(error);
      const mapped: Partial<Record<ErrorKey, string>> = {};
      Object.entries(fieldErrors).forEach(([k, v]) => {
        const key = API_FIELD[k];
        if (key) mapped[key] = v.charAt(0).toUpperCase() + v.slice(1);
      });
      if (Object.keys(mapped).length) setErrors((e) => ({ ...e, ...mapped }));
      toast.error(
        fieldErrors.base ||
          apiErrorMessage(error, isEdit ? "Could not update the pet. Please try again." : "Could not add the pet. Please try again.")
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFDFB]">
        <Loader2 className="h-6 w-6 animate-spin text-[#888780]" />
      </div>
    );
  }

  const err = (key: ErrorKey) => ({ error: !!errors[key], helperText: errors[key] });

  // PT-19 — same rule the register uses
  const dueStatusPreview = getDueStatus(
    {
      vaccination_status: (form.vaccination_status || "Not taken") as VaccinationStatus,
      next_vaccination_date: vaccinated ? form.next_vaccination_date || null : null,
    } as Pet,
    settings.due_soon_window
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#FDFDFB",
        padding: "24px",
        // theme.css forces every required "*" to danger red with !important
        // (html body .MuiFormControl-root … .MuiFormLabel-asterisk). Add User
        // overrides it to black; this selector is stronger, so Add Pet matches.
        "html body & .MuiFormLabel-root .MuiFormLabel-asterisk.MuiFormLabel-asterisk.MuiFormLabel-asterisk": {
          color: "#1A1A18 !important",
        },
      }}
    >
      <PageHeader
        title={isEdit ? "Edit Pet" : "Add Pet"}
        subtitle={isEdit && existing ? `${existing.pet_code} · ${existing.owner_name}${existing.tower_flat ? ` · ${existing.tower_flat}` : ""}` : undefined}
        onBack={() => navigate(backPath)}
      />

      {!isEdit && settings.module_status !== "Active" && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-[#e7848e] bg-[rgba(231,132,142,0.12)] p-3 text-sm text-[#9b2c37]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          The Pets module is {settings.module_status}. Set it to Active in Pet Settings to add pets.
        </div>
      )}

      {/* B. Pet details (+ D. photo on the left, like the profile photo on Add User) */}
      <SectionCard icon={PawPrint} title="Pet Details">
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: "24px", pt: 1 }}>
          {/* Photo — PT-18 */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <Box sx={{ position: "relative" }}>
              <PetAvatar>
                {photoPreview ? (
                  <img src={photoPreview} alt="Pet" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <PawPrint size={56} />
                )}
              </PetAvatar>
              {photo && (
                <IconButton
                  size="small"
                  onClick={removePhoto}
                  title="Remove photo"
                  sx={{ ...darkIconButton, position: "absolute", top: "-8px", left: "-8px", width: "24px", height: "24px" }}
                >
                  <X size={14} />
                </IconButton>
              )}
            </Box>
            <input
              ref={photoInput}
              type="file"
              hidden
              accept=".jpg,.jpeg,.png"
              onChange={(e) => {
                onPhoto(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Box sx={{ display: "flex", gap: "8px", mt: "4px" }}>
              <IconButton size="small" title="Take photo with camera" onClick={() => setCameraOpen(true)} sx={darkIconButton}>
                <Camera size={18} />
              </IconButton>
              <IconButton size="small" title="Upload from gallery" onClick={() => photoInput.current?.click()} sx={darkIconButton}>
                <Upload size={18} />
              </IconButton>
            </Box>
            <CameraDialog open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={onPhoto} />
            <Box sx={{ fontSize: "12px", color: errors.photo ? "#d32f2f" : "#888780", textAlign: "center", maxWidth: 150 }}>
              {errors.photo || `Pet photo${settings.photo_mandatory ? " *" : ""} · JPG / PNG, up to ${PHOTO_MAX_MB} MB`}
            </Box>
          </Box>

          {/* Fields — PT-06 … PT-12 */}
          <Box sx={{ flex: 1, ...gridSx, alignContent: "start" }}>
            <FormControl component="fieldset" error={!!errors.pet_type} sx={{ gridColumn: { md: "1 / -1" } }}>
              <FormLabel component="legend" required sx={legendStyles}>Pet Type</FormLabel>
              <Box sx={{ maxWidth: 560 }}>
                <TileSelector options={allowedTypes} value={form.pet_type} onChange={pickType} error={!!errors.pet_type} />
              </Box>
              {errors.pet_type && <FormHelperText>{errors.pet_type}</FormHelperText>}
            </FormControl>

            {form.pet_type === "Other" && (
              <TextField
                fullWidth required size="small" label="Pet Type (if Other)" placeholder="e.g. Rabbit"
                value={form.pet_type_other}
                onChange={(e) => set("pet_type_other", e.target.value)}
                inputProps={{ maxLength: 20 }}
                sx={fieldStyles}
                {...err("pet_type_other")}
              />
            )}

            {form.pet_type && form.pet_type !== "Other" && (
              <FormControl fullWidth required size="small" sx={fieldStyles} error={!!errors.breed}>
                <InputLabel>Breed</InputLabel>
                <Select
                  value={form.breed}
                  label="Breed"
                  onChange={(e) => {
                    set("breed", e.target.value);
                    if (e.target.value !== "Other") set("breed_other", "");
                  }}
                  MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
                >
                  {/* the app-wide globalMUISelectSearchEnhancer adds the search box */}
                  {breedOptions.map((b) => (
                    <MenuItem key={b} value={b}>{b}</MenuItem>
                  ))}
                </Select>
                {errors.breed && <FormHelperText>{errors.breed}</FormHelperText>}
              </FormControl>
            )}

            {(form.breed === "Other" || form.pet_type === "Other") && (
              <TextField
                fullWidth required size="small"
                label={form.pet_type === "Other" ? "Breed" : "Breed (if Other)"}
                value={form.breed_other}
                onChange={(e) => set("breed_other", e.target.value)}
                inputProps={{ maxLength: 30 }}
                sx={fieldStyles}
                {...err("breed_other")}
              />
            )}

            <TextField
              fullWidth required size="small" label="Pet Name" placeholder="e.g. Bruno"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              inputProps={{ maxLength: 20 }}
              sx={fieldStyles}
              {...err("name")}
            />

            {/* PT-12 */}
            <TextField
              fullWidth size="small" type="date" label="Date of Birth"
              value={form.date_of_birth}
              onChange={(e) => set("date_of_birth", e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: todayIso() }}
              sx={fieldStyles}
              {...err("date_of_birth")}
            />

            <FormControl component="fieldset">
              <FormLabel component="legend" sx={legendStyles}>Gender</FormLabel>
              <Segmented options={["Male", "Female"] as const} value={form.gender} onChange={(v) => set("gender", v)} />
            </FormControl>

            <TextField
              fullWidth size="small" label="Remarks" placeholder="Optional"
              value={form.remarks}
              onChange={(e) => set("remarks", e.target.value)}
              inputProps={{ maxLength: 250 }}
              sx={{ ...fieldStyles, gridColumn: { md: "1 / -1" } }}
            />
          </Box>
        </Box>
      </SectionCard>

      {/* A. Owner — PT-02 … PT-05: never sent; the API tags the logged-in user's society, flat and mobile */}
      <SectionCard icon={UserRound} title="Owner Details">
        <Box sx={{ pt: 1, fontSize: "13.5px", color: "rgba(26,26,24,.68)" }}>
          Owner name, role, tower / flat and mobile are filled in automatically from the logged-in user’s flat.
        </Box>
      </SectionCard>

      {/* C. Vaccination — PT-13 … PT-17 */}
      <SectionCard icon={Syringe} title="Vaccination">
        <Box sx={{ ...gridSx, pt: 1 }}>
          <FormControl component="fieldset" error={!!errors.vaccination_status} sx={{ gridColumn: { md: "1 / -1" } }}>
            <FormLabel component="legend" required sx={legendStyles}>Vaccinated?</FormLabel>
            <Box sx={{ maxWidth: 560 }}>
              <Segmented
                options={VACCINATION_STATUSES}
                value={form.vaccination_status}
                onChange={pickVaccination}
                error={!!errors.vaccination_status}
              />
            </Box>
            {errors.vaccination_status && <FormHelperText>{errors.vaccination_status}</FormHelperText>}
          </FormControl>

          {vaccinated && (
            <>
              <TextField
                fullWidth required size="small" type="date" label="Date of Vaccination"
                value={form.vaccination_date}
                onChange={(e) => pickVaccinationDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: todayIso() }}
                sx={fieldStyles}
                error={!!errors.vaccination_date}
                helperText={errors.vaccination_date || (form.vaccination_status === "Partially" ? "Date of the latest dose" : undefined)}
              />
              <TextField
                fullWidth required size="small" type="date" label="Next Vaccination"
                value={form.next_vaccination_date}
                onChange={(e) => set("next_vaccination_date", e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: form.vaccination_date || undefined }}
                sx={fieldStyles}
                {...err("next_vaccination_date")}
              />

              {/* PT-16 certificate */}
              <Box>
                <input
                  ref={certInput}
                  type="file"
                  hidden
                  accept={settings.certificate_file_types.map((t) => (t === "JPG" ? ".jpg,.jpeg" : `.${t.toLowerCase()}`)).join(",")}
                  onChange={(e) => {
                    onCertificate(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                {certificate ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: "10px", border: "1px solid #ddd", borderRadius: "4px", px: 1.5, height: 40 }}>
                    <FileText size={16} color="#1A1A18" />
                    <Box sx={{ minWidth: 0, flex: 1, fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {certificate.name} <span style={{ color: "#888780" }}>· {sizeLabel(certificate.size)}</span>
                    </Box>
                    <IconButton size="small" onClick={() => setCertificate(null)} title="Remove certificate">
                      <X size={14} />
                    </IconButton>
                  </Box>
                ) : isEdit && existing?.certificate_url ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: "10px", border: "1px solid #ddd", borderRadius: "4px", px: 1.5, height: 40 }}>
                    <FileText size={16} color="#1A1A18" />
                    <a
                      href={existing.certificate_url}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 flex-1 truncate text-[13px] text-[#1A1A18] hover:underline"
                      title="Open saved certificate"
                    >
                      {existing.certificate_name || "Saved certificate"}
                    </a>
                    <button
                      type="button"
                      onClick={() => certInput.current?.click()}
                      className="shrink-0 text-[12px] font-semibold text-[#1A1A18] hover:underline"
                    >
                      Replace
                    </button>
                  </Box>
                ) : (
                  <button
                    type="button"
                    onClick={() => certInput.current?.click()}
                    className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded border bg-white text-sm text-[#1A1A18] hover:border-[#1A1A18] ${errors.certificate ? "border-[#d32f2f]" : "border-[#ddd]"}`}
                  >
                    <Upload size={16} /> Vaccination Certificate{settings.certificate_mandatory ? " *" : ""}
                  </button>
                )}
                <FormHelperText error={!!errors.certificate} sx={{ mx: "14px" }}>
                  {errors.certificate ||
                    (isEdit && existing?.certificate_status === "Rejected" && !certificate
                      ? `Rejected${existing.certificate_reject_reason ? `: ${existing.certificate_reject_reason}` : ""} — upload a new certificate`
                      : form.vaccination_status === "Partially"
                      ? "Upload the latest certificate. Add remaining doses later from My pets."
                      : `${settings.certificate_file_types.join(" / ")}, up to ${settings.certificate_max_mb} MB`)}
                </FormHelperText>
              </Box>
            </>
          )}

          {form.vaccination_status === "Not taken" && (
            <Box
              sx={{ gridColumn: { md: "1 / -1" } }}
              className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
                notTakenBlocked
                  ? "border-[#e7848e] bg-[rgba(231,132,142,0.12)] text-[#9b2c37]"
                  : "border-[#edc488] bg-[rgba(237,196,136,0.2)] text-[#8a5a12]"
              }`}
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {notTakenBlocked
                ? "Society rules don't allow adding a pet until the first dose is done (Pet settings › Allow adding a pet when “Not taken”)."
                : settings.not_taken_warning}
            </Box>
          )}
        </Box>
      </SectionCard>

      {/* E. System — PT-01, PT-19 … PT-23 are set by the API */}
      <SectionCard
        icon={ClipboardCheck}
        title="Status"
        hint={isEdit ? "Statuses change only through the actions on the pet details page" : "Filled automatically when the pet is added"}
      >
        <Box sx={{ ...gridSx, pt: 1 }}>
          <TextField fullWidth size="small" label="Pet ID" value={existing?.pet_code || "Auto-generated"} disabled sx={fieldStyles} />
          <TextField
            fullWidth size="small" label="Registration Status" disabled sx={fieldStyles}
            value={existing?.registration_status || (settings.approval_required ? "Pending approval" : "Active")}
            helperText={!isEdit && settings.approval_required ? "Admin approval is on in Pet Settings" : undefined}
          />
          <TextField
            fullWidth size="small" label="Due Status" disabled sx={fieldStyles}
            value={form.vaccination_status ? dueStatusPreview : "—"}
            helperText="Calculated daily from the next vaccination date"
          />
          {vaccinated && (
            <TextField
              fullWidth size="small" label="Certificate Status" disabled sx={fieldStyles}
              value={
                certificate
                  ? "Not checked"
                  : existing?.certificate_url
                    ? certificateState(existing)
                    : "Missing"
              }
              helperText={isEdit && certificate && existing?.certificate_url ? "A new certificate resets the status to Not checked" : undefined}
            />
          )}
          <TextField fullWidth size="small" label="Added On" value={formatDate(existing?.created_at || todayIso())} disabled sx={fieldStyles} />
          {isEdit && (
            <TextField fullWidth size="small" label="Last Updated" value={formatDate(existing?.updated_at)} disabled sx={fieldStyles} />
          )}
        </Box>
      </SectionCard>

      <FormFooter
        onCancel={() => navigate(backPath)}
        onSave={handleSave}
        saving={saving}
        saveLabel={isEdit ? "Save" : "Submit"}
        savingLabel={isEdit ? "Saving..." : "Submitting..."}
      />
    </Box>
  );
};

export default AddPetPage;
