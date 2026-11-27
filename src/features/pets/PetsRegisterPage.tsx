import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BellRing, Bird, Cat, CheckCircle2, Clock, Dog, Edit, Eye, FileDown, Home,
  PawPrint, Plus, Rabbit, Settings2, ShieldAlert, Syringe, X, XCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormControl, InputLabel, MenuItem, Select as MuiSelect } from "@mui/material";
import { fieldStyles, menuProps } from "@/components/ticket-management/fieldStyles";
import { StatsCard } from "@/components/StatsCard";
import { SelectionPanel } from "@/components/water-asset-details/PannelTab";
import { getFullUrl } from "@/config/apiConfig";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import {
  CERTIFICATE_STATUSES, DEFAULT_SETTINGS, DUE_STATUSES, EMPTY_FILTERS, PET_TYPES, Pet,
  PetFilters, PetSettings, REGISTRATION_STATUSES, VACCINATION_STATUSES,
} from "./types";
import {
  EMPTY_DASHBOARD, PetDashboard, apiErrorMessage, certificateState, daysToNextDose, fetchAllPets,
  fetchDashboard, fetchPetSettings, fetchPets, formatDate, getDueStatus,
} from "./petsApi";
import { PetPhoto, Tag } from "./PetTags";
import { RemindOwnerModal } from "./RemindOwnerModal";

const PER_PAGE = 20;

// Columns in the order of sheet 7 "Sample admin register" (AR-09 … AR-19).
// Actions + SR.NO first, as on Manage Users. Extra register fields are hidden
// by default and can be switched on from the column menu.
const COLUMNS: ColumnConfig[] = [
  { key: "actions", label: "Actions", sortable: false, hideable: false, draggable: false },
  { key: "srNo", label: "SR.NO", sortable: false, hideable: false, draggable: false },
  { key: "pet_code", label: "Pet ID", sortable: true, hideable: false, draggable: true },
  { key: "name", label: "Pet name", sortable: true, hideable: false, draggable: true },
  { key: "pet_type_label", label: "Pet type", sortable: true, hideable: true, draggable: true },
  { key: "breed_label", label: "Breed", sortable: true, hideable: true, draggable: true },
  { key: "owner_name", label: "Owner", sortable: true, hideable: true, draggable: true },
  { key: "resident_role", label: "Role", sortable: true, hideable: true, draggable: true },
  { key: "tower_flat", label: "Tower · flat", sortable: true, hideable: true, draggable: true },
  { key: "vaccination_status", label: "Vaccinated?", sortable: true, hideable: true, draggable: true },
  { key: "vaccination_date", label: "Date of vaccination", sortable: true, hideable: true, draggable: true },
  { key: "next_vaccination_date", label: "Next vaccination", sortable: true, hideable: true, draggable: true },
  { key: "certificate_name", label: "Certificate", sortable: true, hideable: true, draggable: true },
  { key: "has_photo", label: "Photo", sortable: true, hideable: true, draggable: true },
  { key: "days", label: "Days to next dose", sortable: true, hideable: true, draggable: true },
  { key: "due", label: "Due status", sortable: true, hideable: true, draggable: true },
  { key: "certificate_state", label: "Certificate status", sortable: true, hideable: true, draggable: true, defaultVisible: false },
  { key: "last_reminder_sent", label: "Last reminder sent", sortable: true, hideable: true, draggable: true, defaultVisible: false },
  { key: "registration_status", label: "Status", sortable: true, hideable: true, draggable: true, defaultVisible: false },
];

const REMINDABLE = new Set(["Due soon", "Overdue", "Not vaccinated"]);

type Row = Pet & {
  due: ReturnType<typeof getDueStatus>;
  days: number | null;
  pet_type_label: string;
  breed_label: string;
  has_photo: "Yes" | "No";
  certificate_state: string;
};

const petTypeLabel = (p: Pet) => (p.pet_type === "Other" ? p.pet_type_other || "Other" : p.pet_type);
const breedLabel = (p: Pet) => (p.breed === "Other" ? p.breed_other || "Other" : p.breed);

const today = () => new Date().toISOString().slice(0, 10);

export const PetsRegisterPage = () => {
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [settings, setSettings] = useState<PetSettings>(DEFAULT_SETTINGS);
  const [dashboard, setDashboard] = useState<PetDashboard>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<PetFilters>(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState<PetFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [remindPets, setRemindPets] = useState<Pet[]>([]);
  const [towers, setTowers] = useState<string[]>([]);
  const [exporting, setExporting] = useState<string | null>(null);
  const requestId = useRef(0);

  // ── Settings, dashboard counts (5.1) and tower list — once ────────────────
  const loadDashboard = useCallback(() => {
    fetchDashboard().then(setDashboard).catch(() => setDashboard(EMPTY_DASHBOARD));
  }, []);

  useEffect(() => {
    fetchPetSettings()
      .then(setSettings)
      .catch((err) => toast.error(apiErrorMessage(err, "Could not load pet settings")));
    loadDashboard();
    const token = localStorage.getItem("token");
    const societyId = localStorage.getItem("selectedSocietyId");
    if (token && societyId) {
      axios
        .get(getFullUrl(`/get_society_blocks.json?token=${token}&society_id=${societyId}`))
        .then((res) => setTowers((res.data?.society_blocks ?? []).map((b: any) => String(b.name)).filter(Boolean)))
        .catch(() => setTowers([]));
    }
  }, [loadDashboard]);

  // search box → API after a short pause
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  // ── List (4.1) — server-side search, filters and pagination ───────────────
  const loadPets = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const res = await fetchPets({ page, perPage: PER_PAGE, filters, search: debouncedSearch });
      if (id !== requestId.current) return; // a newer request is in flight
      setPets(res.pets);
      setTotalPages(Math.max(1, res.totalPages));
      setTotalCount(res.totalCount);
    } catch (err) {
      if (id !== requestId.current) return;
      setPets([]);
      toast.error(apiErrorMessage(err, "Could not load pets"));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [page, filters, debouncedSearch]);

  useEffect(() => {
    loadPets();
  }, [loadPets]);

  // back to page 1 whenever the query changes
  useEffect(() => {
    setPage(1);
    setSelected([]);
  }, [filters, debouncedSearch]);

  const rows: Row[] = useMemo(
    () =>
      pets.map((p) => ({
        ...p,
        due: getDueStatus(p, settings.due_soon_window),
        days: p.vaccination_status === "Not taken" ? null : daysToNextDose(p),
        pet_type_label: petTypeLabel(p),
        breed_label: breedLabel(p),
        has_photo: p.photo_url ? ("Yes" as const) : ("No" as const),
        certificate_state: certificateState(p),
      })),
    [pets, settings.due_soon_window]
  );

  // breed filter options follow the pet type picked in the filter dialog
  const draftBreedOptions = useMemo(() => {
    const t = draftFilters.pet_type;
    const types = t && t !== "Other" ? [t] : ["Dog", "Cat", "Bird"];
    return [...new Set(types.flatMap((x) => settings.breeds[x as "Dog" | "Cat" | "Bird"] ?? []))];
  }, [settings.breeds, draftFilters.pet_type]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // API sends can_remind; fall back to the same rule if it doesn't
  const canRemind = useCallback(
    (p: Pet) =>
      typeof p.can_remind === "boolean"
        ? p.can_remind
        : settings.reminders_enabled && p.registration_status === "Active" && REMINDABLE.has(getDueStatus(p, settings.due_soon_window)),
    [settings.reminders_enabled, settings.due_soon_window]
  );

  const applyCardFilter = (patch: Partial<PetFilters>) => {
    setFilters({ ...EMPTY_FILTERS, ...patch });
  };

  const handleRemindersSent = () => {
    setSelected([]);
    loadPets(); // refresh "Last reminder sent"
  };

  // ── Export (AR-27) — all pages for the current filters ───────────────────
  const exportRows = (list: Pet[]) =>
    list.map((r) => {
      const days = r.vaccination_status === "Not taken" ? null : daysToNextDose(r);
      return {
        "Pet ID": r.pet_code,
        "Pet name": r.name,
        "Pet type": petTypeLabel(r),
        Breed: breedLabel(r),
        Owner: r.owner_name,
        Role: r.resident_role,
        "Tower · flat": r.tower_flat || "",
        "Vaccinated?": r.vaccination_status,
        "Date of vaccination": r.vaccination_date ? formatDate(r.vaccination_date) : "",
        "Next vaccination": r.next_vaccination_date ? formatDate(r.next_vaccination_date) : "",
        Certificate: r.certificate_name || "",
        Photo: r.photo_url ? "Yes" : "No",
        "Days to next dose": days ?? "",
        "Due status": getDueStatus(r, settings.due_soon_window),
        "Certificate status": certificateState(r),
        "Last reminder sent": r.last_reminder_sent ? formatDate(r.last_reminder_sent) : "",
        Status: r.registration_status,
      };
    });

  const exportExcel = async (exportFilters: PetFilters = filters, fileName = "pet_register", exportSearch = debouncedSearch) => {
    setExporting(fileName);
    try {
      const list = await fetchAllPets(exportFilters, exportSearch);
      if (!list.length) {
        toast.error("No pets to export");
        return;
      }
      const sheet = XLSX.utils.json_to_sheet(exportRows(list));
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, sheet, "Pet register");
      XLSX.writeFile(book, `${fileName}_${today()}.xlsx`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not export pets"));
    } finally {
      setExporting(null);
    }
  };

  const exportPdf = async () => {
    setExporting("pdf");
    try {
      const list = await fetchAllPets(filters, debouncedSearch);
      if (!list.length) {
        toast.error("No pets to export");
        return;
      }
      const data = exportRows(list);
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(14);
      doc.text("Pet register", 14, 14);
      doc.setFontSize(9);
      doc.text(
        `Total ${dashboard.total_pets} · Completely ${dashboard.vaccinated_completely} · Partially ${dashboard.partially_vaccinated} · Not vaccinated ${dashboard.not_vaccinated} · Due soon ${dashboard.due_soon} · Overdue ${dashboard.overdue}`,
        14,
        20
      );
      autoTable(doc, {
        startY: 25,
        head: [Object.keys(data[0])],
        body: data.map((d) => Object.values(d)),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [218, 119, 86] },
      });
      doc.save(`pet_register_${today()}.pdf`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not export pets"));
    } finally {
      setExporting(null);
    }
  };

  // ── Table cells ────────────────────────────────────────────────────────────
  const renderCell = (r: Row, key: string) => {
    switch (key) {
      case "actions":
        return (
          <div className="flex items-center justify-center gap-2" data-actions>
            <button onClick={() => navigate(`/settings/pets/${r.id}`)} className="rounded p-1 hover:bg-gray-100" title="View">
              <Eye className="h-4 w-4 text-[#1A1A1A]" />
            </button>
            {r.registration_status !== "Archived" && (
              <button onClick={() => navigate(`/settings/pets/edit/${r.id}`)} className="rounded p-1 hover:bg-gray-100" title="Edit">
                <Edit className="h-4 w-4 !text-[#1A1A1A]" />
              </button>
            )}
            {canRemind(r) && (
              <button onClick={() => setRemindPets([r])} className="rounded p-1 hover:bg-gray-100" title="Remind owner">
                <BellRing className="h-4 w-4 text-[#1A1A1A]" />
              </button>
            )}
          </div>
        );
      case "srNo":
        return <span className="text-sm font-medium text-gray-600">{(page - 1) * PER_PAGE + rows.indexOf(r) + 1}</span>;
      case "pet_code":
        return <span className="whitespace-nowrap">{r.pet_code}</span>;
      case "name":
        return (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <PetPhoto pet={r} size={28} />
            <span className="font-medium">{r.name}</span>
          </div>
        );
      case "pet_type_label":
        return r.pet_type_label;
      case "breed_label":
        return <span className="whitespace-nowrap">{r.breed_label || "—"}</span>;
      case "owner_name":
        return <span className="whitespace-nowrap">{r.owner_name || "—"}</span>;
      case "resident_role":
        return <span className="whitespace-nowrap">{r.resident_role || "—"}</span>;
      case "tower_flat":
        return <span className="whitespace-nowrap">{r.tower_flat || "—"}</span>;
      case "vaccination_status":
        return <span className="whitespace-nowrap">{r.vaccination_status}</span>;
      case "vaccination_date":
        return <span className="whitespace-nowrap">{r.vaccination_date ? formatDate(r.vaccination_date) : ""}</span>;
      case "next_vaccination_date":
        return <span className="whitespace-nowrap">{r.next_vaccination_date ? formatDate(r.next_vaccination_date) : ""}</span>;
      case "certificate_name":
        if (!r.certificate_url) return r.vaccination_status === "Not taken" ? "" : <Tag value="Missing" />;
        return (
          <a
            href={r.certificate_url}
            target="_blank"
            rel="noreferrer"
            data-actions
            title={r.certificate_name || "Certificate"}
            className="inline-block max-w-[180px] truncate align-middle text-[#1A1A18] hover:text-[#da7756] hover:underline"
          >
            {r.certificate_name || "Certificate"}
          </a>
        );
      case "has_photo":
        return r.photo_url ? (
          <a href={r.photo_url} target="_blank" rel="noreferrer" data-actions className="hover:text-[#da7756] hover:underline">
            Yes
          </a>
        ) : (
          "No"
        );
      case "days":
        return r.days === null ? (
          ""
        ) : (
          <span className={`block text-right tabular-nums ${r.days < 0 ? "font-semibold text-[#9b2c37]" : ""}`}>{r.days}</span>
        );
      case "due":
        return <Tag value={r.due} />;
      case "certificate_state":
        return <Tag value={r.certificate_state} />;
      case "last_reminder_sent":
        return formatDate(r.last_reminder_sent);
      case "registration_status":
        return <Tag value={r.registration_status} />;
      default:
        return null;
    }
  };

  const remindSelected = () => {
    const chosen = rows.filter((r) => selected.includes(String(r.id)));
    const eligible = chosen.filter(canRemind);
    if (!eligible.length) {
      toast.error("None of the selected pets are Due soon, Overdue or Not vaccinated");
      return;
    }
    if (eligible.length < chosen.length) {
      toast.info(`${chosen.length - eligible.length} selected pet(s) can't be reminded and were left out`);
    }
    setRemindPets(eligible);
  };

  const stat = (title: string, value: number, icon: React.ReactNode, patch: Partial<PetFilters>, fileName: string) => {
    const isOn =
      Object.keys(patch).length > 0 &&
      Object.entries(patch).every(([k, v]) => filters[k as keyof PetFilters] === v) &&
      activeFilterCount === Object.keys(patch).length;
    return (
      <StatsCard
        title={title}
        value={value.toString()}
        icon={icon}
        selected={isOn}
        onClick={() => applyCardFilter(isOn ? {} : patch)}
        downloadData={[]}
        downloading={exporting === fileName}
        onDownload={() => exportExcel({ ...EMPTY_FILTERS, status: "Active", ...patch }, fileName, "")}
      />
    );
  };
  const iconCls = "w-5 h-5 text-[#C72030]";

  return (
    <div className="min-h-screen bg-[#fafafa] p-6">
      <div className="max-w-full mx-auto">
        {/* Stats Cards - First Row (AR-01 … AR-03) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
          {stat("Total Pets", dashboard.total_pets, <PawPrint className={iconCls} />, {}, "total_pets")}
          {stat("Flats With Pets", dashboard.flats_with_pets, <Home className={iconCls} />, {}, "flats_with_pets")}
          {stat("Dogs", dashboard.dogs, <Dog className={iconCls} />, { pet_type: "Dog" }, "dogs")}
          {stat("Cats", dashboard.cats, <Cat className={iconCls} />, { pet_type: "Cat" }, "cats")}
          {stat("Birds", dashboard.birds, <Bird className={iconCls} />, { pet_type: "Bird" }, "birds")}
          {stat("Other Pets", dashboard.other, <Rabbit className={iconCls} />, { pet_type: "Other" }, "other_pets")}
        </div>

        {/* Stats Cards - Second Row (AR-04 … AR-08) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {stat("Vaccinated Completely", dashboard.vaccinated_completely, <CheckCircle2 className={iconCls} />, { vaccination: "Completely" }, "vaccinated_completely")}
          {stat("Partially Vaccinated", dashboard.partially_vaccinated, <Syringe className={iconCls} />, { vaccination: "Partially" }, "partially_vaccinated")}
          {stat("Not Vaccinated", dashboard.not_vaccinated, <XCircle className={iconCls} />, { vaccination: "Not taken" }, "not_vaccinated")}
          {stat("Due Soon", dashboard.due_soon, <Clock className={iconCls} />, { due_status: "Due soon" }, "due_soon")}
          {stat("Overdue", dashboard.overdue, <ShieldAlert className={iconCls} />, { due_status: "Overdue" }, "overdue")}
          <StatsCard
            title="Pending Approval"
            value={dashboard.pending_approval.toString()}
            icon={<Clock className={iconCls} />}
            selected={filters.status === "Pending approval" && activeFilterCount === 1}
            onClick={() => applyCardFilter(filters.status === "Pending approval" ? {} : { status: "Pending approval" })}
          />
        </div>

        {settings.module_status !== "Active" && (
          <div className="mb-4 rounded-lg border border-[#e5e5e5] bg-white p-3 text-sm text-[#888780]">
            The Pets module is <b>{settings.module_status}</b> — residents can’t add pets from the app.
          </div>
        )}

        {/* Action Panel — same as Manage Users */}
        {(showActionPanel || selected.length > 0) && (
          <SelectionPanel
            onAdd={() => navigate("/settings/pets/add")}
            addLabel="Add Pet"
            onClearSelection={() => {
              setShowActionPanel(false);
              setSelected([]);
            }}
            actions={[
              { label: "Pet Settings", icon: Settings2, onClick: () => navigate("/settings/pets/settings") },
              ...(settings.reminders_enabled && selected.length > 0
                ? [{ label: "Remind Owners", icon: BellRing, onClick: remindSelected }]
                : []),
              { label: "Export PDF", icon: FileDown, onClick: exportPdf, loading: exporting === "pdf" },
            ]}
          />
        )}

        {activeFilterCount > 0 && (
          <div className="mb-3 flex items-center gap-2 text-sm text-[#888780]">
            {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} applied · {totalCount} pet{totalCount === 1 ? "" : "s"}
            <button onClick={() => applyCardFilter({})} className="inline-flex items-center gap-1 text-[#C72030] hover:underline">
              <X className="h-3 w-3" /> Clear
            </button>
          </div>
        )}

        <div className="">
          <EnhancedTable
            data={rows}
            columns={COLUMNS}
            renderCell={renderCell}
            storageKey="pets_register_v2"
            getItemId={(r) => String(r.id)}
            selectable={true}
            enableSelection={true}
            selectedItems={selected}
            onSelectAll={(checked) => setSelected(checked ? rows.map((r) => String(r.id)) : [])}
            onSelectItem={(id, checked) => setSelected((s) => (checked ? [...s, id] : s.filter((x) => x !== id)))}
            selectAllLabel="Select all pets"
            searchTerm={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search pet, owner, flat or pet ID"
            disableClientSearch
            onFilterClick={() => {
              setDraftFilters(filters);
              setShowFilters(true);
            }}
            enableExport={true}
            handleExport={() => exportExcel()}
            onRowClick={(r) => navigate(`/settings/pets/${r.id}`)}
            pagination={true}
            manualPagination={true}
            pageSize={PER_PAGE}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            leftActions={
              <Button
                size="sm"
                variant="ghost"
                className="btn-primary h-9 px-4 text-sm font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActionPanel(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Action
              </Button>
            }
            loading={loading}
            emptyMessage={activeFilterCount || search ? "No pets match these filters" : "No pets registered yet"}
          />
        </div>
      </div>

      {/* AR-21 — Advance Filter, same style as Manage Users */}
      <Dialog modal={false} open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="max-w-[700px] p-0 overflow-hidden bg-white rounded-2xl border border-[rgba(26,26,24,.09)] shadow-2xl max-h-[90vh] flex flex-col focus:outline-none focus-visible:outline-none">
          <DialogHeader className="py-4 px-6 flex flex-row items-center justify-between space-y-0 shrink-0">
            <DialogTitle className="text-lg font-semibold text-[#1A1A18]">Advance Filter</DialogTitle>
            <button
              type="button"
              onClick={() => setShowFilters(false)}
              aria-label="Close"
              className="flex items-center justify-center w-8 h-8 rounded-md text-[rgba(26,26,24,.68)] hover:bg-[#F5F4F0] hover:text-[#1A1A18] transition-colors focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>

          <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {(
                [
                  ["tower", "Tower", towers],
                  ["pet_type", "Pet Type", PET_TYPES],
                  ["breed", "Breed", draftBreedOptions],
                  ["vaccination", "Vaccination", VACCINATION_STATUSES],
                  ["due_status", "Due Status", DUE_STATUSES],
                  ["certificate", "Certificate", CERTIFICATE_STATUSES],
                  ["status", "Status", REGISTRATION_STATUSES],
                ] as [keyof PetFilters, string, readonly string[]][]
              ).map(([key, label, options]) => (
                <FormControl key={key} fullWidth variant="outlined">
                  <InputLabel shrink sx={{ backgroundColor: "white", px: 1 }}>{label}</InputLabel>
                  <MuiSelect
                    value={draftFilters[key]}
                    onChange={(e) => {
                      const v = e.target.value as string;
                      setDraftFilters((f) => ({ ...f, [key]: v, ...(key === "pet_type" ? { breed: "" } : {}) }));
                    }}
                    displayEmpty
                    label={label}
                    sx={fieldStyles}
                    MenuProps={menuProps}
                  >
                    <MenuItem value="">
                      <span className="text-gray-400">Select {label}</span>
                    </MenuItem>
                    {options.map((o) => (
                      <MenuItem key={o} value={o}>{o}</MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDraftFilters(EMPTY_FILTERS);
                  setFilters(EMPTY_FILTERS);
                  setShowFilters(false);
                }}
                className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[rgba(26,26,24,.08)] bg-white px-[22px] text-[13px] font-semibold text-[rgba(26,26,24,.68)] transition-all hover:border-[rgba(26,26,24,.28)] hover:text-[#1A1A18]"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilters(draftFilters);
                  setShowFilters(false);
                }}
                className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[#1A1A18] bg-[#1A1A18] px-[22px] text-[13px] font-semibold text-white transition-colors hover:bg-[#12100E] disabled:opacity-60"
              >
                Apply
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <RemindOwnerModal
        pets={remindPets}
        settings={settings}
        onClose={() => setRemindPets([])}
        onSent={handleRemindersSent}
      />
    </div>
  );
};

export default PetsRegisterPage;
