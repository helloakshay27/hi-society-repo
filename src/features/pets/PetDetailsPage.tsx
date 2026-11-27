import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Avatar, Box, Tab, Tabs, Typography } from "@mui/material";
import {
  Archive, ArrowLeft, BellRing, Calendar, Check, ClipboardCheck, Edit, File, FileText,
  Files, Home, Image as ImageIcon, Info, Loader2, PawPrint, Syringe, Trash2, User as UserIcon, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormControl, InputLabel, MenuItem, Select as MuiSelect, TextField } from "@mui/material";
import { fieldStyles, menuProps } from "@/components/ticket-management/fieldStyles";
import { ARCHIVE_REASONS, DEFAULT_SETTINGS, Pet, PetSettings } from "./types";
import {
  apiErrorMessage, approvePet, archivePet, certificateState as certState, daysToNextDose, declinePet, deletePet,
  fetchPet, fetchPetSettings, formatDate, getDueStatus, rejectCertificate, verifyCertificate,
} from "./petsApi";
import { RemindOwnerModal } from "./RemindOwnerModal";

const REGISTER_PATH = "/settings/pets";
const REMINDABLE = new Set(["Due soon", "Overdue", "Not vaccinated"]);

// ── Same building blocks as View User (settings/manage-users/:id) ───────────
const InfoField = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Box>
    <Typography variant="body2" sx={{ color: "rgba(26, 26, 24, 0.48)", fontSize: "11px", mb: 0.5, fontWeight: 500 }}>
      {label}
    </Typography>
    <Typography component="div" variant="body2" sx={{ color: "#1A1A18", fontWeight: 500, fontSize: "13.5px" }}>
      {value || "-"}
    </Typography>
  </Box>
);

const cardSx = {
  mb: 2.5,
  background: "#FFFFFF",
  border: "1px solid rgba(26, 26, 24, 0.09)",
  borderRadius: "16px",
  p: "22px 24px",
};

const SectionTitle = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#F5F4F0]">
      <Icon className="h-[14px] w-[14px]" style={{ color: "#1A1A18" }} />
    </span>
    <Typography sx={{ fontSize: "14px", fontWeight: 600, lineHeight: 1.4, color: "#1A1A18", m: 0 }}>{title}</Typography>
  </Box>
);

// Status pill — same shape/colours as the user status badge
const PILL: Record<string, { bg: string; fg: string }> = {
  green: { bg: "rgba(18, 161, 80, 0.12)", fg: "#0E7F3F" },
  red: { bg: "rgba(229, 72, 77, 0.12)", fg: "#A32126" },
  amber: { bg: "rgba(242, 163, 18, 0.3)", fg: "#8A5B00" },
  grey: { bg: "rgba(26, 26, 24, 0.08)", fg: "rgba(26, 26, 24, 0.68)" },
};
const PILL_TONE: Record<string, keyof typeof PILL> = {
  Active: "green", "Up to date": "green", Verified: "green", Completely: "green",
  "Pending approval": "amber", "Due soon": "amber", Partially: "amber", "Not checked": "grey",
  Declined: "red", Overdue: "red", "Not vaccinated": "red", "Not taken": "red", Rejected: "red", Missing: "red",
  Archived: "grey",
};
const StatusPill = ({ value }: { value: string }) => {
  const tone = PILL[PILL_TONE[value] ?? "grey"];
  return (
    <Box
      sx={{
        display: "inline-flex", alignItems: "center", gap: 1, px: 1.25, py: 0.375, borderRadius: "999px",
        backgroundColor: tone.bg, color: tone.fg, fontSize: "11px", fontWeight: 600,
      }}
    >
      <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "currentColor" }} />
      {value}
    </Box>
  );
};

const tabsSx = {
  minHeight: 0,
  "& .MuiTabs-flexContainer": { gap: "3px" },
  "& .MuiTab-root": {
    textTransform: "none", fontSize: "12.5px", fontWeight: 600, color: "rgba(26, 26, 24, 0.55)",
    minHeight: 0, py: "8px", px: "16px", borderRadius: "8px", display: "flex", alignItems: "center", gap: 1,
    "&:hover": { color: "#1A1A18" },
  },
  // same override View User uses so the selected MUI tab is highlighted under theme.css
  "& .MuiTabs-flexContainer[role='tablist'] .MuiTab-root.Mui-selected.Mui-selected.Mui-selected": {
    color: "#1A1A18 !important",
    backgroundColor: "#FFFFFF !important",
    boxShadow: "0 1px 2px rgba(26, 26, 24, 0.1), 0 0 0 1px rgba(26, 26, 24, 0.05) !important",
  },
  "& .MuiTabs-indicator": { display: "none" },
};

const isImageFile = (name?: string | null) => /\.(jpe?g|png|gif|webp)$/i.test(name || "");
const petTypeLabel = (p: Pet) => (p.pet_type === "Other" ? p.pet_type_other || "Other" : p.pet_type);
const breedLabel = (p: Pet) => (p.breed === "Other" ? p.breed_other || "Other" : p.breed);

// Sheet 3 · AR-23 — pet detail: all PT fields + certificate + reminder history + actions
export const PetDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState<Pet | null>(null);
  const [settings, setSettings] = useState<PetSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState(0);
  const [reasonMode, setReasonMode] = useState<"reject" | "archive" | "decline" | "delete" | null>(null);
  const [reason, setReason] = useState("");
  const [remindOpen, setRemindOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchPetSettings().then(setSettings).catch(() => undefined);
    fetchPet(Number(id))
      .then(setPet)
      .catch((err) => {
        setPet(null);
        toast.error(apiErrorMessage(err, "Could not load the pet"));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const reload = useCallback(() => {
    fetchPet(Number(id)).then(setPet).catch(() => undefined);
  }, [id]);

  // 6.x admin actions — each returns the updated pet
  const run = useCallback(async (fn: () => Promise<Pet>, message: string) => {
    setBusy(true);
    try {
      setPet(await fn());
      toast.success(message);
      return true;
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not update the pet. Please try again."));
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  // stable list so the remind modal does not reset its message on re-render
  const remindPets = useMemo(() => (remindOpen && pet ? [pet] : []), [remindOpen, pet]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", minHeight: "60vh", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="h-6 w-6 animate-spin text-[#888780]" />
      </Box>
    );
  }

  if (!pet) {
    return (
      <Box sx={{ p: 3, background: "#FDFDFB", minHeight: "100vh" }}>
        <button
          type="button"
          onClick={() => navigate(REGISTER_PATH)}
          className="mb-[14px] inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[rgba(26,26,24,0.48)] transition-colors hover:text-[#1A1A18]"
        >
          <ArrowLeft className="h-[18px] w-[18px]" /> Back to Pets
        </button>
        <Box sx={cardSx}>Pet not found.</Box>
      </Box>
    );
  }

  const due = getDueStatus(pet, settings.due_soon_window);
  const days = daysToNextDose(pet);
  const vaccinated = pet.vaccination_status !== "Not taken";
  const certificateState = certState(pet);
  const isArchived = pet.registration_status === "Archived";
  const canRemind =
    typeof pet.can_remind === "boolean"
      ? pet.can_remind
      : settings.reminders_enabled && pet.registration_status === "Active" && REMINDABLE.has(due);
  const reminders = pet.reminders ?? [];

  const attachments = [
    ...(pet.certificate_url ? [{ label: "Vaccination certificate", name: pet.certificate_name || "Certificate", url: pet.certificate_url }] : []),
    ...(pet.photo_url ? [{ label: "Pet photo", name: `${pet.name}_photo`, url: pet.photo_url, image: true }] : []),
  ];

  const sections: { title: string; icon: React.ElementType; fields: { label: string; value: React.ReactNode }[] }[] = [
    {
      title: "Pet Details",
      icon: PawPrint,
      fields: [
        { label: "Pet ID", value: pet.pet_code },
        { label: "Pet Name", value: pet.name },
        { label: "Pet Type", value: petTypeLabel(pet) },
        { label: "Breed", value: breedLabel(pet) },
        { label: "Gender", value: pet.gender },
        {
          label: "Date of Birth",
          value: pet.date_of_birth ? formatDate(pet.date_of_birth) : "-",
        },
        { label: "Added On", value: formatDate(pet.created_at) },
        { label: "Last Updated", value: formatDate(pet.updated_at || pet.created_at) },
        ...(pet.remarks ? [{ label: "Remarks", value: pet.remarks }] : []),
      ],
    },
    {
      title: "Owner Details",
      icon: UserIcon,
      fields: [
        { label: "Owner Name", value: pet.owner_name },
        { label: "Resident Role", value: pet.resident_role },
        { label: "Tower / Flat", value: pet.tower_flat || "-" },
        { label: "Mobile Number", value: pet.mobile },
      ],
    },
    {
      title: "Vaccination",
      icon: Syringe,
      fields: [
        { label: "Vaccinated?", value: <StatusPill value={pet.vaccination_status} /> },
        { label: "Due Status", value: <StatusPill value={due} /> },
        ...(vaccinated
          ? [
              { label: "Date of Vaccination", value: formatDate(pet.vaccination_date) },
              {
                label: "Next Vaccination",
                value:
                  formatDate(pet.next_vaccination_date) +
                  (days !== null ? ` (${days < 0 ? `${-days} days overdue` : `in ${days} days`})` : ""),
              },
              { label: "Certificate", value: pet.certificate_name || "Not uploaded" },
              { label: "Certificate Status", value: <StatusPill value={certificateState} /> },
              ...(pet.certificate_status === "Rejected" && pet.certificate_reject_reason
                ? [{ label: "Rejection Reason", value: pet.certificate_reject_reason }]
                : []),
            ]
          : [{ label: "Note", value: "Added without a vaccination record" }]),
      ],
    },
    {
      title: "Status",
      icon: ClipboardCheck,
      fields: [
        { label: "Registration Status", value: <StatusPill value={pet.registration_status} /> },
        ...(isArchived ? [{ label: "Archive Reason", value: pet.archive_reason }] : []),
        { label: "Last Reminder Sent", value: formatDate(pet.last_reminder_sent) },
        { label: "Reminders Sent", value: String(reminders.length) },
      ],
    },
  ];

  const confirmReason = async () => {
    if (reasonMode === "delete") {
      setBusy(true);
      try {
        await deletePet(pet.id);
        toast.success(`${pet.name} deleted`);
        navigate(REGISTER_PATH);
      } catch (err) {
        toast.error(apiErrorMessage(err, "Could not delete the pet"));
      } finally {
        setBusy(false);
      }
      return;
    }
    if (!reason.trim()) return;
    let ok = false;
    if (reasonMode === "reject") ok = await run(() => rejectCertificate(pet.id, reason.trim()), "Certificate rejected — resident notified");
    else if (reasonMode === "archive") ok = await run(() => archivePet(pet.id, reason), `${pet.name} archived`);
    else if (reasonMode === "decline") ok = await run(() => declinePet(pet.id, reason.trim()), `${pet.name} declined — resident notified`);
    if (ok) {
      setReasonMode(null);
      setReason("");
    }
  };

  const openReason = (mode: "reject" | "archive" | "decline" | "delete") => {
    setReason("");
    setReasonMode(mode);
  };

  const actionBtn = "btn-cancel h-9 px-4 text-sm font-medium inline-flex items-center gap-1.5";

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, background: "#FDFDFB", minHeight: "100vh" }}>
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate(REGISTER_PATH)}
        className="mb-[14px] inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[rgba(26,26,24,0.48)] transition-colors hover:text-[#1A1A18]"
      >
        <ArrowLeft className="h-[18px] w-[18px]" />
        Back to Pets
      </button>

      {/* Header — avatar, name, info line, status */}
      <Box sx={{ ...cardSx, mb: 0, position: "relative" }}>
        {/* Edit Button — same place and style as "Edit User" */}
        {!isArchived && (
          <Box sx={{ position: "absolute", top: 16, right: 16 }}>
            <Button
              size="sm"
              className="btn-primary h-9 px-4 text-sm font-medium inline-flex items-center gap-1.5 [&_svg]:!text-white"
              onClick={() => navigate(`/settings/pets/edit/${pet.id}`)}
            >
              <Edit className="mr-1 h-4 w-4" />
              Edit Pet
            </Button>
          </Box>
        )}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3 }}>
          <Avatar
            sx={{
              width: 72, height: 72, bgcolor: "#F5F4F0", color: "#1A1A18", border: "none", boxShadow: "none",
              cursor: pet.photo_url ? "zoom-in" : "default",
            }}
            onClick={() => pet.photo_url && window.open(pet.photo_url, "_blank")}
          >
            {pet.photo_url ? (
              <img src={pet.photo_url} alt={pet.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <PawPrint size={32} />
            )}
          </Avatar>
          <Box sx={{ flex: 1, color: "rgba(26, 26, 24, 0.48)" }}>
            <Typography sx={{ fontSize: "22px", fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.015em", color: "#1A1A18", mb: 1 }}>
              {pet.name}
            </Typography>
            <Box sx={{ display: "flex", gap: 3, mb: 1.5, flexWrap: "wrap" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Home className="h-4 w-4" />
                <Typography variant="body2">{pet.tower_flat || "-"}</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PawPrint className="h-4 w-4" />
                <Typography variant="body2">{`${petTypeLabel(pet)} · ${breedLabel(pet)}`}</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <UserIcon className="h-4 w-4" />
                <Typography variant="body2">{`${pet.owner_name} (${pet.resident_role})`}</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Calendar className="h-4 w-4" />
                <Typography variant="body2">{pet.pet_code}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <StatusPill value={pet.registration_status} />
              <StatusPill value={due} />
            </Box>
          </Box>
        </Box>

        {/* Actions — AR-22, 24, 25, 26 */}
        {!isArchived && (
          <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 3, gap: 2, flexWrap: "wrap" }}>
            {pet.registration_status === "Pending approval" && (
              <>
                <Button className={actionBtn} disabled={busy} onClick={() => run(() => approvePet(pet.id), `${pet.name} approved — resident notified`)}>
                  <Check className="mr-1 h-4 w-4" /> Approve Pet
                </Button>
                <Button className={actionBtn} disabled={busy} onClick={() => openReason("decline")}>
                  <X className="mr-1 h-4 w-4" /> Decline Pet
                </Button>
              </>
            )}
            {settings.verify_certificates && pet.certificate_url && pet.certificate_status !== "Verified" && (
              <Button
                className={actionBtn}
                disabled={busy}
                onClick={() => run(() => verifyCertificate(pet.id), "Certificate verified — resident notified")}
              >
                <Check className="mr-1 h-4 w-4" /> Verify Certificate
              </Button>
            )}
            {settings.verify_certificates && pet.certificate_url && pet.certificate_status !== "Rejected" && (
              <Button className={actionBtn} disabled={busy} onClick={() => openReason("reject")}>
                <X className="mr-1 h-4 w-4" /> Reject Certificate
              </Button>
            )}
            {canRemind && (
              <Button className={actionBtn} disabled={busy} onClick={() => setRemindOpen(true)}>
                <BellRing className="mr-1 h-4 w-4" /> Remind Owner
              </Button>
            )}
            <Button className={actionBtn} disabled={busy} onClick={() => openReason("archive")}>
              <Archive className="mr-1 h-4 w-4" /> Archive Pet
            </Button>
            <Button className={actionBtn} disabled={busy} onClick={() => openReason("delete")}>
              <Trash2 className="mr-1 h-4 w-4" /> Delete Pet
            </Button>
          </Box>
        )}
        {isArchived && (
          <Box sx={{ display: "flex", mt: 3, gap: 2 }}>
            <Button className={actionBtn} disabled={busy} onClick={() => openReason("delete")}>
              <Trash2 className="mr-1 h-4 w-4" /> Delete Pet
            </Button>
          </Box>
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ mt: 3, mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={tabsSx}>
          <Tab label="Pet Info" icon={<Info className="h-4 w-4" />} iconPosition="start" />
          <Tab label={`Reminder History (${reminders.length})`} icon={<BellRing className="h-4 w-4" />} iconPosition="start" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <Box>
          {sections.map((section) => (
            <Box key={section.title} sx={cardSx}>
              <SectionTitle icon={section.icon} title={section.title} />
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: "18px 24px" }}>
                {section.fields.map((f) => (
                  <InfoField key={f.label} label={f.label} value={f.value} />
                ))}
              </Box>
            </Box>
          ))}

          {/* Attachments — same card grid as View User */}
          <Box sx={cardSx}>
            <SectionTitle icon={Files} title={`Attachments (${attachments.length})`} />
            {attachments.length ? (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" }, gap: 2 }}>
                {attachments.map((a) => {
                  const image = a.image || isImageFile(a.name);
                  const openable = a.url && a.url !== "#";
                  return (
                    <Box
                      key={a.label}
                      onClick={() => (openable ? window.open(a.url, "_blank") : toast.info("File preview is available once the pets API is connected"))}
                      sx={{
                        display: "flex", flexDirection: "column", alignItems: "center", p: 2.5,
                        border: "2px solid #e5e7eb", borderRadius: "12px", backgroundColor: "#fff", cursor: "pointer",
                        transition: "all 0.3s ease", "&:hover": { borderColor: "#c4b89d" },
                      }}
                    >
                      <Box
                        sx={{
                          width: "100%", height: "140px", display: "flex", alignItems: "center", justifyContent: "center",
                          backgroundColor: "#fafafa", borderRadius: "8px", mb: 2, overflow: "hidden",
                        }}
                      >
                        {image && openable ? (
                          <img src={a.url} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : image ? (
                          <ImageIcon className="h-10 w-10 text-green-500" />
                        ) : /\.pdf$/i.test(a.name) ? (
                          <FileText className="h-10 w-10 text-red-500" />
                        ) : (
                          <File className="h-10 w-10 text-gray-500" />
                        )}
                      </Box>
                      <Typography
                        variant="caption"
                        title={a.name}
                        sx={{ fontWeight: 600, color: "#1A1A1A", display: "block", mb: 0.7, width: "100%", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "12px" }}
                      >
                        {a.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "rgba(26, 26, 24, 0.48)", fontSize: "11px", fontWeight: 500 }}>
                        {a.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Typography sx={{ fontSize: "13px", color: "rgba(26, 26, 24, 0.48)" }}>No certificate or photo uploaded</Typography>
            )}
          </Box>
        </Box>
      )}

      {tab === 1 && (
        <Box sx={cardSx}>
          <SectionTitle icon={BellRing} title="Reminder History" />
          {!settings.reminders_enabled && (
            <Typography sx={{ fontSize: "12px", color: "rgba(26, 26, 24, 0.48)", mb: 2 }}>
              Vaccination reminders are off in Pet Settings.
            </Typography>
          )}
          {reminders.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[rgba(26,26,24,0.09)] text-[11px] font-medium text-[rgba(26,26,24,0.48)]">
                    <th className="py-2 pr-4 font-medium">Sent On</th>
                    <th className="py-2 pr-4 font-medium">Sent By</th>
                    <th className="py-2 pr-4 font-medium">Channel</th>
                    <th className="py-2 pr-4 font-medium">Trigger</th>
                    <th className="py-2 pr-4 font-medium">Template</th>
                    <th className="py-2 pr-4 font-medium">Message</th>
                    <th className="py-2 font-medium">Resident Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reminders.map((r, i) => (
                    <tr key={r.id ?? i} className="border-b border-[rgba(26,26,24,0.06)] align-top font-medium text-[#1A1A18] last:border-0">
                      <td className="whitespace-nowrap py-2.5 pr-4">{formatDate(r.sent_on)}</td>
                      <td className="py-2.5 pr-4">{r.sent_by}</td>
                      <td className="py-2.5 pr-4">
                        {r.channel}
                        {r.delivery && (
                          <div className="text-[11px] font-normal text-[rgba(26,26,24,0.48)]">
                            {Object.entries(r.delivery).map(([ch, st]) => `${ch}: ${st}`).join(" · ")}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">{r.mode}</td>
                      <td className="py-2.5 pr-4">{r.template || "-"}</td>
                      <td className="min-w-[220px] py-2.5 pr-4 font-normal">{r.message || "-"}</td>
                      <td className="py-2.5">
                        {r.resident_action || "-"}
                        {r.opened_at && (
                          <div className="text-[11px] font-normal text-[rgba(26,26,24,0.48)]">{formatDate(r.opened_at)}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Typography sx={{ fontSize: "13px", color: "rgba(26, 26, 24, 0.48)" }}>No reminders sent yet</Typography>
          )}
        </Box>
      )}

      {/* Reject certificate / archive — reason dialog */}
      <Dialog open={!!reasonMode} onOpenChange={(o) => !o && setReasonMode(null)}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>
              {{ reject: "Reject Certificate", archive: "Archive Pet", decline: "Decline Pet", delete: "Delete Pet" }[reasonMode ?? "archive"]}
            </DialogTitle>
          </DialogHeader>
          {reasonMode === "delete" ? (
            <p className="text-sm text-[rgba(26,26,24,0.68)]">
              This permanently deletes {pet.name} and its history. To keep the record, archive the pet instead.
            </p>
          ) : reasonMode === "reject" || reasonMode === "decline" ? (
            <TextField
              label="Reason"
              placeholder={
                reasonMode === "reject"
                  ? "Why is the certificate rejected? The resident is notified."
                  : "Why is the pet declined? The resident is notified."
              }
              multiline
              minRows={3}
              fullWidth
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              inputProps={{ maxLength: 200 }}
              InputLabelProps={{ shrink: true }}
              sx={fieldStyles}
            />
          ) : (
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: "white", px: 1 }}>Archive Reason</InputLabel>
              <MuiSelect
                value={reason}
                onChange={(e) => setReason(e.target.value as string)}
                displayEmpty
                label="Archive Reason"
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value="" disabled>
                  <span className="text-gray-400">Select reason</span>
                </MenuItem>
                {ARCHIVE_REASONS.map((r) => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setReasonMode(null)}
              className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[rgba(26,26,24,.08)] bg-white px-[22px] text-[13px] font-semibold text-[rgba(26,26,24,.68)] hover:border-[rgba(26,26,24,.28)] hover:text-[#1A1A18]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || (reasonMode !== "delete" && !reason.trim())}
              onClick={confirmReason}
              className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[#1A1A18] bg-[#1A1A18] px-[22px] text-[13px] font-semibold text-white hover:bg-[#12100E] disabled:opacity-60"
            >
              {busy ? "Please wait..." : { reject: "Reject", archive: "Archive", decline: "Decline", delete: "Delete" }[reasonMode ?? "archive"]}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <RemindOwnerModal
        pets={remindPets}
        settings={settings}
        onClose={() => setRemindOpen(false)}
        onSent={reload}
      />
    </Box>
  );
};

export default PetDetailsPage;
