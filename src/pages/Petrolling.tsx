import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Edit, Printer, Trash2, MapPin } from "lucide-react";
import { API_CONFIG, getFullUrl, getAuthHeader } from "@/config/apiConfig";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormControl, InputLabel, MenuItem, Select as MuiSelect } from "@mui/material";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PatrollingItem {
  id: number;
  area: string;
  name?: string;
  description?: string;
  active: boolean;
  qr_code: {
    url: string | null;
  };
  created_at: string;
  updated_at: string;
  resource_id: number;
  resource_type: string;
  created_by_id: number;
  occurrence_type?: number;
  frequency_start?: number;
  frequency_end?: number;
  occurrences?: string[];
  validity_start_date?: string;
  validity_end_date?: string;
  grace_period_minutes?: number;
  estimated_duration_minutes?: number;
  auto_ticket?: boolean;
  patrol_config?: {
    alert_on_missed?: boolean;
    alert_recipient_role?: string;
  };
  schedules?: {
    id: number;
    name?: string;
    frequency_type?: string;
    frequency_data?: Record<string, unknown> | string | null;
    start_date?: string;
    end_date?: string;
    start_time?: string;
    end_time?: string;
    assigned_guard_id?: number | null;
    supervisor_id?: number | null;
    notes?: string;
    active?: boolean;
    cron_setting?: { id?: number; cron_expression?: string };
  }[];
  checkpoints?: {
    id: number;
    name: string;
    description?: string;
    order_sequence?: number;
    estimated_time_minutes?: number;
    area_name?: string;
    building_name?: string;
    wing_name?: string;
    floor_name?: string;
    room_name?: string;
    qr_code_url?: string;
    location_qr_code_url?: string | null;
    building_id?: number | null;
    wing_id?: number | null;
    floor_id?: number | null;
    area_id?: number | null;
    room_id?: number | null;
    snag_checklist_id?: number | null;
    schedule_ids?: number[];
  }[];
  checklist?: {
    id?: number;
    name?: string;
    check_type?: string;
    active?: boolean;
  } | null;
  recent_sessions?: PatrollingLog[];
  summary?: {
    questions_count?: number;
    schedules_count?: number;
    checkpoints_count?: number;
    recent_sessions_count?: number;
    total_sessions_count?: number;
  };
}

interface PatrollingLog {
  id: number;
  comment?: string;
  created_at?: string;
  session_date?: string;
  status?: string;
  guard_name?: string;
  progress?: string | number;
  attachments?: { id?: number; url?: string | null }[];
  created_by_id?: number;
  checkpoints_completed?: number;
  total_checkpoints?: number;
}

interface OptionItem {
  id: number;
  name: string;
  description?: string;
  status?: number | boolean;
  active?: number | boolean;
  building_id?: number | null;
  wing_id?: number | null;
  area_id?: number | null;
  floor_id?: number | null;
}

interface UserOption {
  id: number;
  full_name: string;
}

interface PatrolCheckpointForm {
  id?: number;
  name: string;
  description: string;
  order_sequence: string;
  estimated_time_minutes: string;
  building_id: string;
  wing_id: string;
  floor_id: string;
  area_id: string;
  room_id: string;
  snag_checklist_id: string;
}

interface PatrolScheduleForm {
  id?: number;
  name: string;
  frequency_type: string;
  days: string[];
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  assigned_guard_id: string;
  supervisor_id: string;
  notes: string;
}

interface PatrolFormData {
  name: string;
  description: string;
  estimated_duration_minutes: string;
  grace_period_minutes: string;
  validity_start_date: string;
  validity_end_date: string;
  auto_ticket: boolean;
  alert_on_missed: boolean;
  alert_recipient_role: string;
  question_checklist_id: string;
  checkpoints: PatrolCheckpointForm[];
  schedules: PatrolScheduleForm[];
}

const DEFAULT_PATROL_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const PATROL_DAY_OPTIONS = DEFAULT_PATROL_DAYS.map((day) => ({
  value: day,
  label: day.charAt(0).toUpperCase() + day.slice(1),
}));

const parseUiTimeToApi = (timeValue: string): string | null => {
  const trimmed = timeValue.trim();
  const time24 = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
  if (time24) {
    return `${time24[1].padStart(2, "0")}:${time24[2]}`;
  }

  const time12 = trimmed.match(/^(\d{1,2})(?::([0-5]\d))?\s*(AM|PM)$/i);
  if (!time12) return null;

  let hours = Number(time12[1]);
  if (hours < 1 || hours > 12) return null;

  const minutes = time12[2] || "00";
  const modifier = time12[3].toUpperCase();

  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, "0")}:${minutes}`;
};

const normalizeApiTimeForInput = (timeValue: unknown, fallback = "") => {
  if (typeof timeValue !== "string") return fallback;
  return parseUiTimeToApi(timeValue) || fallback;
};

const parseFrequencyData = (frequencyData: unknown): Record<string, unknown> => {
  if (!frequencyData) return {};
  if (typeof frequencyData === "string") {
    try {
      const parsed = JSON.parse(frequencyData);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  return typeof frequencyData === "object" && !Array.isArray(frequencyData)
    ? (frequencyData as Record<string, unknown>)
    : {};
};

const createDefaultSchedule = (startDate = "", endDate = ""): PatrolScheduleForm => ({
  name: "",
  frequency_type: "",
  days: [],
  start_date: startDate,
  end_date: endDate,
  start_time: "",
  end_time: "",
  assigned_guard_id: "",
  supervisor_id: "",
  notes: "",
});

const createDefaultCheckpoint = (): PatrolCheckpointForm => ({
  name: "",
  description: "",
  order_sequence: "",
  estimated_time_minutes: "",
  building_id: "",
  wing_id: "",
  floor_id: "",
  area_id: "",
  room_id: "",
  snag_checklist_id: "",
});

const createDefaultPatrolForm = (): PatrolFormData => ({
  name: "",
  description: "",
  estimated_duration_minutes: "",
  grace_period_minutes: "",
  validity_start_date: "",
  validity_end_date: "",
  auto_ticket: false,
  alert_on_missed: false,
  alert_recipient_role: "",
  question_checklist_id: "",
  checkpoints: [createDefaultCheckpoint()],
  schedules: [createDefaultSchedule()],
});

const toPositiveInteger = (value: string) => {
  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  const parsed = Number(trimmedValue);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const toNonNegativeInteger = (value: string) => {
  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  const parsed = Number(trimmedValue);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
};

const getValidDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDisplayDate = (value?: string | null) => {
  const date = getValidDate(value);
  return date ? date.toLocaleDateString("en-GB") : "N/A";
};

const formatDisplayTime = (value?: string | null) => {
  const date = getValidDate(value);
  return date ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A";
};

const formatStatus = (value?: string | null) => value?.replace(/_/g, " ") || "N/A";

const resolveAttachmentUrl = (value?: string | null) => {
  if (!value || typeof value !== "string") return null;
  let url = value;
  try {
    url = decodeURIComponent(value);
  } catch {
    url = value;
  }

  return url.startsWith("//") ? `https:${url}` : url;
};

const Petrolling = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<PatrollingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
  });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [selectedPatrol, setSelectedPatrol] = useState<PatrollingItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<PatrolFormData>(() => createDefaultPatrolForm());
  const [buildingOptions, setBuildingOptions] = useState<OptionItem[]>([]);
  const [areaOptions, setAreaOptions] = useState<OptionItem[]>([]);
  const [floorOptions, setFloorOptions] = useState<OptionItem[]>([]);
  const [roomOptions, setRoomOptions] = useState<OptionItem[]>([]);
  const [flatOptions, setFlatOptions] = useState<OptionItem[]>([]);
  const [checklistOptions, setChecklistOptions] = useState<OptionItem[]>([]);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [formOptionsLoading, setFormOptionsLoading] = useState(false);

  const columns: ColumnConfig[] = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "area", label: "Area", sortable: true },
    { key: "checkpoints_count", label: "No. of Checkpoints", sortable: true },
    { key: "created_on", label: "Start Date", sortable: true },
    { key: "grace_period", label: "Grace Time", sortable: true },
    { key: "active_inactive", label: "Status", sortable: true },
    // { key: "qr_code", label: "Qr Code", sortable: false },
  ];

  const fetchPatrollingData = async (page = 1, searchTerm: string = "") => {
    setLoading(true);
    try {
      const searchValue = encodeURIComponent(searchTerm.trim());
      const apiUrl = getFullUrl(
        `/patrolling/setup.json?page=${page}&per_page=${pagination.pageSize}&q[name_cont]=${searchValue}`
      );

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": getAuthHeader(),
        },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      if (result.data) {
        // Map the new API structure to match the existing PatrollingItem type
        const mappedData = result.data.map((item: any) => ({
          ...item,
          area: item.name, // Map name to area for the table
          qr_code: {
            // Attempt to use the first checkpoint's QR code if available
            url: item.checkpoints?.[0]?.qr_code_url || null
          }
        }));

        setData(mappedData);
        setTotal(result.pagination?.total_count || mappedData.length);
        setPagination((prev) => ({
          ...prev,
          currentPage: page,
        }));
      }
    } catch (error: any) {
      console.error("Error fetching patrolling data:", error);
      toast.error("Failed to load patrolling data");
    } finally {
      setLoading(false);
    }
  };

  const extractOptionItems = (result: any, collectionKeys: string[] = []): OptionItem[] => {
    const source =
      (Array.isArray(result) && result) ||
      collectionKeys.map((key) => result?.[key]).find(Array.isArray) ||
      result?.data ||
      [];

    return (Array.isArray(source) ? source : [])
      .map((item: any) => ({
        id: Number(item.id),
        name:
          item.name ||
          item.floor_name ||
          item.floor_no ||
          item.flat_no ||
          item.block_no ||
          item.area_name ||
          item.title ||
          `#${item.id}`,
        description: item.description || "",
        status: item.status,
        active: item.active,
        building_id: item.building_id ?? item.pms_building_id ?? item.society_block_id ?? item.society_location_id ?? null,
        wing_id: item.wing_id ?? item.pms_wing_id ?? item.society_wing_id ?? null,
        area_id: item.area_id ?? item.pms_area_id ?? null,
        floor_id: item.floor_id ?? item.pms_floor_id ?? item.society_floor_id ?? null,
      }))
      .filter((item) => Number.isInteger(item.id));
  };

  const loadFormOptions = async () => {
    setFormOptionsLoading(true);
    try {
      const token = API_CONFIG.TOKEN;
      const requestHeaders = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": getAuthHeader(),
      };
      const [areasResult, floorsResult, roomsResult, flatsResult, checklistsResult, societyBlocksResult, usersResult] = await Promise.allSettled([
        fetch(getFullUrl("/pms/areas.json"), {
          headers: requestHeaders,
        }).then((response) => (response.ok ? response.json() : Promise.reject(response))),
        fetch(getFullUrl("/society_floors.json?society_block_id=5"), {
          headers: requestHeaders,
        }).then((response) => (response.ok ? response.json() : Promise.reject(response))),
        fetch(getFullUrl("/pms/rooms.json"), {
          headers: requestHeaders,
        }).then((response) => (response.ok ? response.json() : Promise.reject(response))),
        fetch(getFullUrl(`/admin/society_flats.json?token=${encodeURIComponent(token)}&society_id=3399`), {
          headers: requestHeaders,
        }).then((response) => (response.ok ? response.json() : Promise.reject(response))),
        fetch(getFullUrl("/pms/admin/snag_checklists.json?site_id=null&q[name_cont]=&q[snag_audit_sub_category_id_eq]=&q[generic_tag_category_name_eq]=&q[check_type_eq]="), {
          headers: requestHeaders,
        }).then((response) => (response.ok ? response.json() : Promise.reject(response))),
        fetch(getFullUrl(`/crm/admin/society_blocks.json?token=${encodeURIComponent(token)}`), {
          headers: requestHeaders,
        }).then((response) => (response.ok ? response.json() : Promise.reject(response))),
        fetch(getFullUrl("/pms/users/get_escalate_to_users.json"), {
          headers: requestHeaders,
        }).then((response) => (response.ok ? response.json() : Promise.reject(response))),
      ]);

      if (areasResult.status === "fulfilled") {
        setAreaOptions(extractOptionItems(areasResult.value, ["areas", "pms_areas"]));
      }

      if (floorsResult.status === "fulfilled") {
        setFloorOptions(extractOptionItems(floorsResult.value, ["society_floors", "floors", "pms_floors"]));
      }

      if (roomsResult.status === "fulfilled") {
        setRoomOptions(extractOptionItems(roomsResult.value, ["rooms", "pms_rooms"]));
      }

      if (flatsResult.status === "fulfilled") {
        setFlatOptions(extractOptionItems(flatsResult.value, ["society_flats"]));
      }

      if (checklistsResult.status === "fulfilled") {
        setChecklistOptions(extractOptionItems(checklistsResult.value, ["snag_checklists", "checklists"]));
      }

      if (societyBlocksResult.status === "fulfilled") {
        const societyBlocks = extractOptionItems(societyBlocksResult.value, ["society_blocks"]);
        setBuildingOptions(societyBlocks);
      }

      if (usersResult.status === "fulfilled") {
        const users = Array.isArray(usersResult.value)
          ? usersResult.value
          : usersResult.value?.users || usersResult.value?.data || [];
        setUserOptions(
          (Array.isArray(users) ? users : [])
            .map((user: any) => ({
              id: Number(user.id),
              full_name: user.full_name || user.name || `${user.firstname || ""} ${user.lastname || ""}`.trim() || `User ${user.id}`,
            }))
            .filter((user) => Number.isInteger(user.id))
        );
      }
    } catch (error) {
      console.error("Error loading patrolling form options:", error);
    } finally {
      setFormOptionsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatrollingData();
    loadFormOptions();
  }, []);

  const handleView = (item: PatrollingItem) => {
    navigate(`/security/patrolling/details/${item.id}`);
  };

  const handleEdit = async (item: PatrollingItem) => {
    setSelectedPatrol(item);
    setLoading(true);
    try {
      const apiUrl = getFullUrl(`/patrolling/setup/${item.id}.json?page=1&per_page=10`);
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": getAuthHeader(),
        },
      });
      if (!response.ok) throw new Error("Failed to fetch detail");
      const result = await response.json();
      const detail = result.data || {};

      // Store full detail in selectedPatrol so handleSubmit can use it
      setSelectedPatrol({
        ...item,
        ...detail,
        area: detail.name || item.area,
        schedules: detail.schedules || [],
        checkpoints: detail.checkpoints || [],
      });

      const fallbackForm = createDefaultPatrolForm();
      const routeName = detail.name || item.name || item.area || "";
      const validityStartDate =
        detail.validity_start_date || item.validity_start_date || fallbackForm.validity_start_date;
      const validityEndDate =
        detail.validity_end_date || item.validity_end_date || fallbackForm.validity_end_date;
      const schedules =
        Array.isArray(detail.schedules) && detail.schedules.length
          ? detail.schedules.map((schedule: any) => {
              const frequencyData = parseFrequencyData(schedule.frequency_data);
              const days = Array.isArray(frequencyData.days)
                ? frequencyData.days.map(String).filter(Boolean)
                : [...DEFAULT_PATROL_DAYS];

              return {
                id: schedule.id,
                name: schedule.name || `${routeName} Schedule`,
                frequency_type: schedule.frequency_type || "daily",
                days: days.length ? days : [...DEFAULT_PATROL_DAYS],
                start_date: schedule.start_date || validityStartDate,
                end_date: schedule.end_date || validityEndDate,
                start_time: normalizeApiTimeForInput(schedule.start_time, fallbackForm.schedules[0].start_time),
                end_time: normalizeApiTimeForInput(schedule.end_time, fallbackForm.schedules[0].end_time),
                assigned_guard_id:
                  schedule.assigned_guard_id !== undefined && schedule.assigned_guard_id !== null
                    ? String(schedule.assigned_guard_id)
                    : "",
                supervisor_id:
                  schedule.supervisor_id !== undefined && schedule.supervisor_id !== null
                    ? String(schedule.supervisor_id)
                    : "",
                notes: schedule.notes || "",
              };
            })
          : [createDefaultSchedule(validityStartDate, validityEndDate)];

      const checkpoints =
        Array.isArray(detail.checkpoints) && detail.checkpoints.length
          ? detail.checkpoints.map((checkpoint: any, index: number) => ({
              id: checkpoint.id,
              name: checkpoint.name || "",
              description: checkpoint.description || "",
              order_sequence: String(checkpoint.order_sequence ?? checkpoint.sequence ?? index + 1),
              estimated_time_minutes:
                checkpoint.estimated_time_minutes !== undefined && checkpoint.estimated_time_minutes !== null
                  ? String(checkpoint.estimated_time_minutes)
                  : "5",
              building_id:
                checkpoint.building_id !== undefined && checkpoint.building_id !== null
                  ? String(checkpoint.building_id)
                  : "",
              wing_id:
                checkpoint.wing_id !== undefined && checkpoint.wing_id !== null ? String(checkpoint.wing_id) : "",
              floor_id:
                checkpoint.floor_id !== undefined && checkpoint.floor_id !== null ? String(checkpoint.floor_id) : "",
              area_id:
                checkpoint.area_id !== undefined && checkpoint.area_id !== null ? String(checkpoint.area_id) : "",
              room_id:
                checkpoint.room_id !== undefined && checkpoint.room_id !== null ? String(checkpoint.room_id) : "",
              snag_checklist_id:
                checkpoint.snag_checklist_id !== undefined && checkpoint.snag_checklist_id !== null
                  ? String(checkpoint.snag_checklist_id)
                  : "",
            }))
          : [createDefaultCheckpoint()];
      const questionChecklistId =
        detail.checklist_id !== undefined && detail.checklist_id !== null
          ? String(detail.checklist_id)
          : detail.checklist?.id !== undefined && detail.checklist?.id !== null
            ? String(detail.checklist.id)
            : checkpoints.find((checkpoint) => checkpoint.snag_checklist_id)?.snag_checklist_id || "";

      setFormData({
        name: routeName,
        description: detail.description || "",
        estimated_duration_minutes:
          detail.estimated_duration_minutes !== undefined && detail.estimated_duration_minutes !== null
            ? String(detail.estimated_duration_minutes)
            : fallbackForm.estimated_duration_minutes,
        grace_period_minutes:
          detail.grace_period_minutes !== undefined && detail.grace_period_minutes !== null
            ? String(detail.grace_period_minutes)
            : fallbackForm.grace_period_minutes,
        validity_start_date: validityStartDate,
        validity_end_date: validityEndDate,
        auto_ticket: detail.auto_ticket ?? fallbackForm.auto_ticket,
        alert_on_missed: detail.patrol_config?.alert_on_missed ?? fallbackForm.alert_on_missed,
        alert_recipient_role:
          detail.patrol_config?.alert_recipient_role || fallbackForm.alert_recipient_role,
        question_checklist_id: questionChecklistId,
        schedules,
        checkpoints,
      });
      setIsEditOpen(true);
    } catch (error) {
      console.error("Error loading edit data:", error);
      toast.error("Failed to load patrolling area details");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (item: PatrollingItem) => {
    try {
      const apiUrl = getFullUrl(`/patrolling/setup/${item.id}.json`);
      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": getAuthHeader(),
        },
        body: JSON.stringify({
          patrolling: {
            active: !item.active,
          }
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      setData((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, active: !item.active } : i))
      );
      toast.success(`Patrolling ${!item.active ? "activated" : "deactivated"} successfully!`);
    } catch (error: any) {
      console.error("Error toggling status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleSubmit = async (isEdit = false) => {
    if (isEdit && !selectedPatrol?.id) {
      toast.error("Patrolling area details are not loaded");
      return;
    }

    const estimatedDuration = toPositiveInteger(formData.estimated_duration_minutes);
    const gracePeriod = toNonNegativeInteger(formData.grace_period_minutes);
    if (!formData.name.trim()) {
      toast.error("Please enter patrol name");
      return;
    }
    if (!estimatedDuration) {
      toast.error("Estimated duration must be a positive whole number");
      return;
    }
    if (gracePeriod === null) {
      toast.error("Grace period must be zero or a positive whole number");
      return;
    }
    if (!formData.validity_start_date || !formData.validity_end_date) {
      toast.error("Please select validity start and end dates");
      return;
    }
    if (new Date(formData.validity_end_date) < new Date(formData.validity_start_date)) {
      toast.error("Validity end date cannot be before start date");
      return;
    }
    if (formData.question_checklist_id && !toPositiveInteger(formData.question_checklist_id)) {
      toast.error("Please select a valid checklist");
      return;
    }

    if (!formData.checkpoints.length) {
      toast.error("Please add at least one checkpoint");
      return;
    }
    for (const [index, checkpoint] of formData.checkpoints.entries()) {
      const buildingId = toPositiveInteger(checkpoint.building_id);

      if (!buildingId) {
        toast.error(`Please select checkpoint ${index + 1} building`);
        return;
      }
      const optionalLocationIds = [
        checkpoint.floor_id,
        checkpoint.room_id,
      ];
      if (optionalLocationIds.some((value) => value && !toPositiveInteger(value))) {
        toast.error(`Checkpoint ${index + 1} location selection is invalid`);
        return;
      }
      if (checkpoint.snag_checklist_id && !toPositiveInteger(checkpoint.snag_checklist_id)) {
        toast.error(`Checkpoint ${index + 1} checklist ID must be a positive whole number`);
        return;
      }
    }

    if (!formData.schedules.length) {
      toast.error("Please add at least one schedule");
      return;
    }
    for (const [index, schedule] of formData.schedules.entries()) {
      if (!schedule.name.trim()) {
        toast.error(`Please enter schedule ${index + 1} name`);
        return;
      }
      if (!schedule.frequency_type.trim()) {
        toast.error(`Please select schedule ${index + 1} frequency`);
        return;
      }
      if (!schedule.days.length) {
        toast.error(`Please select at least one day for schedule ${index + 1}`);
        return;
      }
      if (!schedule.start_date || !schedule.end_date) {
        toast.error(`Please select schedule ${index + 1} start and end dates`);
        return;
      }
      if (new Date(schedule.end_date) < new Date(schedule.start_date)) {
        toast.error(`Schedule ${index + 1} end date cannot be before start date`);
        return;
      }
      if (!parseUiTimeToApi(schedule.start_time) || !parseUiTimeToApi(schedule.end_time)) {
        toast.error(`Please enter valid start and end times for schedule ${index + 1}`);
        return;
      }
      if (!toPositiveInteger(schedule.assigned_guard_id)) {
        toast.error(`Please enter assigned guard ID for schedule ${index + 1}`);
        return;
      }
      if (!toPositiveInteger(schedule.supervisor_id)) {
        toast.error(`Please enter supervisor ID for schedule ${index + 1}`);
        return;
      }
    }

    if (!formData.alert_recipient_role.trim()) {
      toast.error("Please enter alert recipient role");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = isEdit 
        ? getFullUrl(`/patrolling/setup/${selectedPatrol?.id}.json`)
        : getFullUrl(`/patrolling/setup.json`);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        estimated_duration_minutes: estimatedDuration,
        grace_period_minutes: gracePeriod,
        validity_start_date: formData.validity_start_date,
        validity_end_date: formData.validity_end_date,
        auto_ticket: formData.auto_ticket,
        patrol_config: {
          alert_on_missed: formData.alert_on_missed,
          alert_recipient_role: formData.alert_recipient_role.trim(),
        },
        checkpoints: formData.checkpoints.map((checkpoint, index) => ({
          ...(isEdit && checkpoint.id ? { id: checkpoint.id } : {}),
          name: checkpoint.name.trim() || getGeneratedCheckpointName(checkpoint, index),
          description: checkpoint.description.trim(),
          order_sequence: toPositiveInteger(checkpoint.order_sequence) || index + 1,
          estimated_time_minutes: toPositiveInteger(checkpoint.estimated_time_minutes) || estimatedDuration,
          building_id: toPositiveInteger(checkpoint.building_id),
          wing_id: checkpoint.wing_id ? toPositiveInteger(checkpoint.wing_id) : null,
          area_id: checkpoint.area_id ? toPositiveInteger(checkpoint.area_id) : null,
          floor_id: checkpoint.floor_id ? toPositiveInteger(checkpoint.floor_id) : null,
          room_id: checkpoint.room_id ? toPositiveInteger(checkpoint.room_id) : null,
          snag_checklist_id: checkpoint.snag_checklist_id
            ? toPositiveInteger(checkpoint.snag_checklist_id)
            : null,
        })),
        schedules: formData.schedules.map((schedule) => ({
          ...(isEdit && schedule.id ? { id: schedule.id } : {}),
          name: schedule.name.trim(),
          frequency_type: schedule.frequency_type,
          frequency_data: {
            days: schedule.days,
          },
          start_date: schedule.start_date,
          end_date: schedule.end_date,
          start_time: parseUiTimeToApi(schedule.start_time),
          end_time: parseUiTimeToApi(schedule.end_time),
          assigned_guard_id: toPositiveInteger(schedule.assigned_guard_id),
          supervisor_id: toPositiveInteger(schedule.supervisor_id),
          notes: schedule.notes.trim(),
        })),
      };

      const response = await fetch(apiUrl, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMsg = `HTTP error! status: ${response.status}`;
        if (errorData.message) errorMsg = errorData.message;
        else if (errorData.error) errorMsg = errorData.error;
        else if (errorData.errors) errorMsg = JSON.stringify(errorData.errors);
        throw new Error(errorMsg);
      }

      const result = await response.json();

      const successMessage = result.message || (isEdit ? "Patrolling area updated successfully!" : "Patrolling area added successfully!");
      toast.success(successMessage);

      setIsAddOpen(false);
      setIsEditOpen(false);
      setFormData(createDefaultPatrolForm());
      setSelectedPatrol(null);
      fetchPatrollingData();
    } catch (error: any) {
      console.error("Error saving patrolling area:", error);
      toast.error(error.message || "Failed to save patrolling area");
    } finally {
      setLoading(false);
    }
  };

  const handleFormCancel = (isEdit = false) => {
    if (isEdit) {
      setIsEditOpen(false);
    } else {
      setIsAddOpen(false);
      setFormData(createDefaultPatrolForm());
    }

    setSelectedPatrol(null);
  };

  const updateFormField = <K extends keyof PatrolFormData>(field: K, value: PatrolFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateQuestionChecklist = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      question_checklist_id: value,
      checkpoints: prev.checkpoints.map((checkpoint) => ({
        ...checkpoint,
        snag_checklist_id:
          !checkpoint.snag_checklist_id || checkpoint.snag_checklist_id === prev.question_checklist_id
            ? value
            : checkpoint.snag_checklist_id,
      })),
    }));
  };

  const updateCheckpointField = <K extends keyof PatrolCheckpointForm>(
    index: number,
    field: K,
    value: PatrolCheckpointForm[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      checkpoints: prev.checkpoints.map((checkpoint, checkpointIndex) =>
        checkpointIndex === index ? { ...checkpoint, [field]: value } : checkpoint
      ),
    }));
  };

  const updateCheckpointLocationField = (
    index: number,
    field: "building_id" | "wing_id" | "area_id" | "floor_id" | "room_id",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      checkpoints: prev.checkpoints.map((checkpoint, checkpointIndex) => {
        if (checkpointIndex !== index) return checkpoint;

        if (field === "building_id") {
          return {
            ...checkpoint,
            building_id: value,
            wing_id: "",
            area_id: "",
            floor_id: "",
            room_id: "",
          };
        }

        if (field === "wing_id") {
          return {
            ...checkpoint,
            wing_id: value,
            area_id: "",
            floor_id: "",
            room_id: "",
          };
        }

        if (field === "area_id") {
          return {
            ...checkpoint,
            area_id: value,
            floor_id: "",
            room_id: "",
          };
        }

        if (field === "floor_id") {
          return {
            ...checkpoint,
            floor_id: value,
            room_id: "",
          };
        }

        return {
          ...checkpoint,
          room_id: value,
        };
      }),
    }));
  };

  const updateScheduleField = <K extends keyof PatrolScheduleForm>(
    index: number,
    field: K,
    value: PatrolScheduleForm[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      schedules: prev.schedules.map((schedule, scheduleIndex) =>
        scheduleIndex === index ? { ...schedule, [field]: value } : schedule
      ),
    }));
  };

  const addCheckpoint = () => {
    setFormData((prev) => ({
      ...prev,
      checkpoints: [
        ...prev.checkpoints,
        {
          ...createDefaultCheckpoint(),
          snag_checklist_id: prev.question_checklist_id,
        },
      ],
    }));
  };

  const removeCheckpoint = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      checkpoints: prev.checkpoints
        .filter((_, checkpointIndex) => checkpointIndex !== index)
        .map((checkpoint, checkpointIndex) => ({
          ...checkpoint,
          order_sequence: String(checkpointIndex + 1),
        })),
    }));
  };

  const addSchedule = () => {
    setFormData((prev) => ({
      ...prev,
      schedules: [
        ...prev.schedules,
        createDefaultSchedule(prev.validity_start_date, prev.validity_end_date),
      ],
    }));
  };

  const removeSchedule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((_, scheduleIndex) => scheduleIndex !== index),
    }));
  };

  const toggleScheduleDay = (scheduleIndex: number, day: string) => {
    setFormData((prev) => ({
      ...prev,
      schedules: prev.schedules.map((schedule, index) => {
        if (index !== scheduleIndex) return schedule;
        return {
          ...schedule,
          days: schedule.days.includes(day)
            ? schedule.days.filter((selectedDay) => selectedDay !== day)
            : [...schedule.days, day],
        };
      }),
    }));
  };

  const handlePrint = () => {
    const printContent = document.getElementById('qr-print-area');
    if (printContent) {
      const windowUrl = 'about:blank';
      const uniqueName = new Date().getTime();
      const windowName = 'Print' + uniqueName;
      const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');
      
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print QR Code</title>
              <style>
                body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; }
                img { width: 300px; height: 300px; margin-bottom: 20px; }
                h1 { font-size: 24px; color: #333; }
                @media print {
                  body { height: auto; }
                }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
              <script>
                window.onload = function() {
                  window.print();
                  window.close();
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const renderCell = (item: PatrollingItem, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleView(item)}
              className="p-1 text-blue-500 hover:text-blue-700"
              title="View"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleEdit(item)}
              className="p-1 text-gray-500 hover:text-gray-700"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        );
      case "area":
        return <div className="font-medium text-gray-600">{item.area}</div>;
      case "checkpoints_count":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-black">
            {item.summary?.checkpoints_count || item.checkpoints?.length || 0}
          </span>
        );
      case "grace_period":
        return (
          <span className="text-gray-600">
            {item.grace_period_minutes ? `${item.grace_period_minutes} min` : "N/A"}
          </span>
        );
      case "created_on":
        return (
          <div className="text-gray-600">
            {item.created_at ? new Date(item.created_at).toLocaleDateString("en-GB") : "N/A"}
          </div>
        );
      case "active_inactive":
        return (
          <div className="flex items-center">
            <div 
              onClick={() => handleToggleStatus(item)}
              className={`w-11 h-6 rounded-full relative cursor-pointer transition-all duration-200 shadow-inner ${
                item.active ? 'bg-green-600' : 'bg-red-600'
              }`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${
                item.active ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </div>
          </div>
        );
      case "qr_code":
        return (
          <div className="flex items-center">
            {typeof item.qr_code?.url === 'string' && item.qr_code.url.trim() !== '' ? (
              <div 
                className="bg-white p-1 rounded border border-gray-200 cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => {
                  setSelectedPatrol(item);
                  setIsQrOpen(true);
                }}
              >
                 <img 
                   src={item.qr_code.url.startsWith('http') ? item.qr_code.url : `${API_CONFIG.BASE_URL}${item.qr_code.url}`}
                   alt="QR Code" 
                   className="w-10 h-10 object-contain"
                   onError={(e) => {
                     (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=QR';
                   }}
                 />
              </div>
            ) : (
              <div className="w-10 h-10 border bg-gray-100 flex items-center justify-center text-xs text-gray-400 rounded">
                No QR
              </div>
            )}
          </div>
        );
      default:
        return (item as any)[columnKey] || "N/A";
    }
  };

  const renderLogCell = (log: PatrollingLog, columnKey: string) => {
    const dateValue = log.created_at || log.session_date;
    switch (columnKey) {
      case "patrolling_date":
        return formatDisplayDate(dateValue);
      case "patrolling_time":
        return formatDisplayTime(dateValue);
      case "comments":
        return log.comment || formatStatus(log.status);
      case "submitted_by":
        return log.guard_name || (log.created_by_id ? `User ${log.created_by_id}` : "N/A");
      case "attachments":
        {
          const attachmentUrls =
            log.attachments
              ?.map((att) => resolveAttachmentUrl(att.url))
              .filter((url): url is string => Boolean(url)) || [];

          return (
            <div className="flex gap-1">
              {attachmentUrls.length ? (
                attachmentUrls.map((url, idx) => (
                  <img
                    key={url || idx}
                    src={url}
                    alt="Attachment"
                    className="w-10 h-10 object-cover rounded border border-gray-200 cursor-pointer"
                    onClick={() => window.open(url, "_blank")}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/40?text=IMG";
                    }}
                  />
                ))
              ) : (
                <span className="text-xs text-gray-400">N/A</span>
              )}
            </div>
          );
        }
      default:
        return (log as any)[columnKey] || "N/A";
    }
  };

  const checkpointFieldSx = {
    height: 41,
    borderRadius: "4px",
    backgroundColor: "#fff",
    "& .MuiInputBase-input, & .MuiSelect-select": {
      padding: "10px 12px",
      fontSize: "14px",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#c8c8c8",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#a8a8a8",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#666",
      borderWidth: "1px",
    },
  };

  const optionMatchesParent = (optionValue: number | null | undefined, selectedValue: string) =>
    !selectedValue || optionValue === null || optionValue === undefined || String(optionValue) === selectedValue;

  const getCheckpointLocationOptions = (checkpoint: PatrolCheckpointForm) => {
    const filteredAreas = areaOptions.filter((area) =>
      optionMatchesParent(area.building_id, checkpoint.building_id)
    );
    const filteredFloors = floorOptions.filter((floor) =>
      optionMatchesParent(floor.building_id, checkpoint.building_id) &&
      optionMatchesParent(floor.area_id, checkpoint.area_id)
    );
    const filteredRooms = roomOptions.filter((room) =>
      optionMatchesParent(room.building_id, checkpoint.building_id) &&
      optionMatchesParent(room.area_id, checkpoint.area_id) &&
      optionMatchesParent(room.floor_id, checkpoint.floor_id)
    );
    return {
      areas: filteredAreas.length || !checkpoint.building_id ? filteredAreas : areaOptions,
      floors: filteredFloors.length || !checkpoint.building_id ? filteredFloors : floorOptions,
      rooms: filteredRooms.length || !checkpoint.floor_id ? filteredRooms : roomOptions,
      forms: flatOptions,
    };
  };

  const getOptionNameById = (options: OptionItem[], value: string) =>
    options.find((option) => String(option.id) === value)?.name || "";

  const getGeneratedCheckpointName = (checkpoint: PatrolCheckpointForm, index: number) => {
    const nameParts = [
      getOptionNameById(buildingOptions, checkpoint.building_id),
      getOptionNameById(floorOptions, checkpoint.floor_id),
      getOptionNameById(flatOptions, checkpoint.room_id),
    ].filter(Boolean);

    return nameParts.length ? nameParts.join(" / ") : `Checkpoint ${index + 1}`;
  };

  const renderCheckpointSelect = (
    label: string,
    value: string,
    placeholder: string,
    options: OptionItem[],
    onChange: (value: string) => void,
    required = false,
    disabled = false
  ) => (
    <FormControl fullWidth variant="outlined" size="small" disabled={disabled}>
      <InputLabel shrink>
        {label}
        {required && <span className="text-red-500">*</span>}
      </InputLabel>
      <MuiSelect
        value={value}
        onChange={(event) => onChange(event.target.value as string)}
        displayEmpty
        label={`${label}${required ? " *" : ""}`}
        notched
        renderValue={(selected) => {
          if (!selected) return <span className="text-gray-400">{placeholder}</span>;
          const selectedOption = options.find((option) => String(option.id) === String(selected));
          return selectedOption?.name || placeholder;
        }}
        sx={checkpointFieldSx}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 320,
            },
          },
        }}
      >
        <MenuItem value="">{placeholder}</MenuItem>
        {options.map((option) => (
          <MenuItem key={option.id} value={String(option.id)}>
            {option.name}
          </MenuItem>
        ))}
      </MuiSelect>
    </FormControl>
  );

  const renderPatrolForm = (title: string, isEdit = false, mode: "dialog" | "page" = "dialog") => (
    <>
      {mode === "page" ? (
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <Button
            variant="outline"
            className="h-9 rounded-none"
            onClick={() => handleFormCancel(isEdit)}
          >
            Back
          </Button>
        </div>
      ) : (
        <DialogHeader className="p-2 border-b bg-gray-50 flex flex-row items-center justify-between">
          <DialogTitle className="text-md font-bold text-center w-full">{title}</DialogTitle>
        </DialogHeader>
      )}
      <div className={mode === "page" ? "p-4 space-y-5" : "p-4 space-y-5 max-h-[75vh] overflow-y-auto"}>
        <datalist id="patrolling-area-options">
          {areaOptions.map((area) => (
            <option key={area.id} value={String(area.id)} label={area.name} />
          ))}
        </datalist>
        <datalist id="patrolling-checklist-options">
          {checklistOptions.map((checklist) => (
            <option key={checklist.id} value={String(checklist.id)} label={checklist.name} />
          ))}
        </datalist>
        <datalist id="patrolling-user-options">
          {userOptions.map((user) => (
            <option key={user.id} value={String(user.id)} label={user.full_name} />
          ))}
        </datalist>

        {formOptionsLoading && (
          <div className="text-xs text-gray-500">Loading area, block, checklist and user suggestions...</div>
        )}

        <section className="space-y-3">
          <h3 className="text-sm font-bold text-gray-700">Route Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Name *</Label>
              <Input
                className="h-9 rounded-none border-gray-300 text-sm"
                value={formData.name}
                onChange={(e) => updateFormField("name", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Estimated Duration (mins) *</Label>
              <Input
                type="number"
                min="1"
                className="h-9 rounded-none border-gray-300 text-sm"
                value={formData.estimated_duration_minutes}
                onChange={(e) => updateFormField("estimated_duration_minutes", e.target.value)}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs text-gray-600">Description</Label>
              <Textarea
                className="rounded-none border-gray-300 text-sm min-h-[70px]"
                value={formData.description}
                onChange={(e) => updateFormField("description", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Validity Start Date *</Label>
              <Input
                type="date"
                className="h-9 rounded-none border-gray-300 text-sm"
                value={formData.validity_start_date}
                onChange={(e) => updateFormField("validity_start_date", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Validity End Date *</Label>
              <Input
                type="date"
                className="h-9 rounded-none border-gray-300 text-sm"
                value={formData.validity_end_date}
                onChange={(e) => updateFormField("validity_end_date", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Grace Period (mins) *</Label>
              <Input
                type="number"
                min="0"
                className="h-9 rounded-none border-gray-300 text-sm"
                value={formData.grace_period_minutes}
                onChange={(e) => updateFormField("grace_period_minutes", e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Checkbox
                id="patrolling-auto-ticket"
                checked={formData.auto_ticket}
                onCheckedChange={(checked) => updateFormField("auto_ticket", checked === true)}
              />
              <Label htmlFor="patrolling-auto-ticket" className="text-sm font-normal cursor-pointer">
                Auto Ticket
              </Label>
            </div>
          </div>
        </section>

        <section className="space-y-3 border-t pt-4">
          <h3 className="text-sm font-bold text-gray-700">Patrol Config</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="patrolling-alert-missed"
                checked={formData.alert_on_missed}
                onCheckedChange={(checked) => updateFormField("alert_on_missed", checked === true)}
              />
              <Label htmlFor="patrolling-alert-missed" className="text-sm font-normal cursor-pointer">
                Alert on Missed
              </Label>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Alert Recipient Role *</Label>
              <Input
                className="h-9 rounded-none border-gray-300 text-sm"
                value={formData.alert_recipient_role}
                onChange={(e) => updateFormField("alert_recipient_role", e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="space-y-3 border-t pt-4">
          <h3 className="text-sm font-bold text-gray-700">Question</h3>
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Checklist</Label>
            <FormControl fullWidth size="small">
              <MuiSelect
                value={formData.question_checklist_id}
                onChange={(e) => updateQuestionChecklist(e.target.value as string)}
                displayEmpty
                disabled={formOptionsLoading}
                renderValue={(selected) => {
                  if (!selected) return "Select Checklist";
                  const selectedChecklist = checklistOptions.find(
                    (checklist) => String(checklist.id) === String(selected)
                  );
                  return selectedChecklist?.name || "Select Checklist";
                }}
                sx={{
                  height: 36,
                  borderRadius: 0,
                  backgroundColor: "#fff",
                  fontSize: "0.875rem",
                  "& .MuiSelect-select": {
                    padding: "7px 12px",
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 320,
                    },
                  },
                }}
              >
                <MenuItem value="" disabled>
                  Select Checklist
                </MenuItem>
                {checklistOptions.map((checklist) => (
                  <MenuItem key={checklist.id} value={String(checklist.id)}>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-800">{checklist.name}</span>
                      {checklist.description?.trim() && (
                        <span className="text-xs text-gray-500">{checklist.description}</span>
                      )}
                    </div>
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
          </div>
        </section>

        <section className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-gray-700">Schedules</h3>
            <Button
              className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={addSchedule}
              type="button"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Schedule
            </Button>
          </div>

          {formData.schedules.map((schedule, scheduleIndex) => (
            <div key={schedule.id ?? scheduleIndex} className="relative border border-gray-200 bg-gray-50 p-3 space-y-3">
              {formData.schedules.length > 1 && (
                <button
                  type="button"
                  className="absolute right-2 top-2 text-red-600 hover:text-red-800"
                  onClick={() => removeSchedule(scheduleIndex)}
                  aria-label={`Remove schedule ${scheduleIndex + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <div className="text-xs font-semibold text-gray-500">Schedule {scheduleIndex + 1}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Name *</Label>
                  <Input
                    className="h-9 rounded-none border-gray-300 text-sm"
                    value={schedule.name}
                    onChange={(e) => updateScheduleField(scheduleIndex, "name", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Frequency Type *</Label>
                  <select
                    className="h-9 w-full rounded-none border border-gray-300 bg-white px-3 text-sm"
                    value={schedule.frequency_type}
                    onChange={(e) => updateScheduleField(scheduleIndex, "frequency_type", e.target.value)}
                  >
                    <option value=""></option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Start Date *</Label>
                  <Input
                    type="date"
                    className="h-9 rounded-none border-gray-300 text-sm"
                    value={schedule.start_date}
                    onChange={(e) => updateScheduleField(scheduleIndex, "start_date", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">End Date *</Label>
                  <Input
                    type="date"
                    className="h-9 rounded-none border-gray-300 text-sm"
                    value={schedule.end_date}
                    onChange={(e) => updateScheduleField(scheduleIndex, "end_date", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Start Time *</Label>
                  <Input
                    type="time"
                    className="h-9 rounded-none border-gray-300 text-sm"
                    value={schedule.start_time}
                    onChange={(e) => updateScheduleField(scheduleIndex, "start_time", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">End Time *</Label>
                  <Input
                    type="time"
                    className="h-9 rounded-none border-gray-300 text-sm"
                    value={schedule.end_time}
                    onChange={(e) => updateScheduleField(scheduleIndex, "end_time", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Assigned Guard ID *</Label>
                  <Input
                    list="patrolling-user-options"
                    type="number"
                    min="1"
                    className="h-9 rounded-none border-gray-300 text-sm"
                    value={schedule.assigned_guard_id}
                    onChange={(e) => updateScheduleField(scheduleIndex, "assigned_guard_id", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Supervisor ID *</Label>
                  <Input
                    list="patrolling-user-options"
                    type="number"
                    min="1"
                    className="h-9 rounded-none border-gray-300 text-sm"
                    value={schedule.supervisor_id}
                    onChange={(e) => updateScheduleField(scheduleIndex, "supervisor_id", e.target.value)}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs text-gray-600">Notes</Label>
                  <Textarea
                    className="rounded-none border-gray-300 text-sm min-h-[60px]"
                    value={schedule.notes}
                    onChange={(e) => updateScheduleField(scheduleIndex, "notes", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Days *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {PATROL_DAY_OPTIONS.map((day) => (
                    <label key={day.value} className="flex items-center gap-2 text-xs text-gray-700">
                      <Checkbox
                        checked={schedule.days.includes(day.value)}
                        onCheckedChange={() => toggleScheduleDay(scheduleIndex, day.value)}
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-lg border border-[#d8c7ad] bg-white">
          <div className="flex items-center gap-3 border-b border-[#d8c7ad] px-6 py-4">
            <MapPin className="h-4 w-4 text-[#f05a28]" />
            <h3 className="text-sm font-bold uppercase text-gray-900">Checkpoint Setup</h3>
          </div>

          <div className="space-y-6 px-5 py-5">
            {formData.checkpoints.map((checkpoint, checkpointIndex) => {
              const locationOptions = getCheckpointLocationOptions(checkpoint);

              return (
                <div
                  key={checkpoint.id ?? checkpointIndex}
                  className="relative rounded-md border border-dashed border-[#d8c7ad] bg-white px-4 pb-4 pt-5"
                >
                  {formData.checkpoints.length > 1 && (
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-red-600 hover:text-red-800"
                      onClick={() => removeCheckpoint(checkpointIndex)}
                      aria-label={`Remove checkpoint ${checkpointIndex + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="mb-3 text-sm font-semibold text-gray-500">
                    Checkpoint {checkpointIndex + 1}
                  </div>

                  <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">Checkpoint Name*</Label>
                      <Input
                        className="h-9 rounded-none border-gray-300 text-sm"
                        placeholder="Enter checkpoint name"
                        value={checkpoint.name}
                        onChange={(e) => updateCheckpointField(checkpointIndex, "name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">Description</Label>
                      <Input
                        className="h-9 rounded-none border-gray-300 text-sm"
                        placeholder="Enter checkpoint description"
                        value={checkpoint.description}
                        onChange={(e) => updateCheckpointField(checkpointIndex, "description", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      {renderCheckpointSelect(
                        "Tower",
                        checkpoint.building_id,
                        "Select Tower",
                        buildingOptions,
                        (value) => updateCheckpointLocationField(checkpointIndex, "building_id", value),
                        true,
                        formOptionsLoading
                      )}
                    </div>

                    <div>
                      {renderCheckpointSelect(
                        "Floor",
                        checkpoint.floor_id,
                        "Select Floor",
                        locationOptions.floors,
                        (value) => updateCheckpointLocationField(checkpointIndex, "floor_id", value),
                        false,
                        formOptionsLoading
                      )}
                    </div>

                    <div>
                      {renderCheckpointSelect(
                        "Flat",
                        checkpoint.room_id,
                        "Select Flat",
                        locationOptions.forms,
                        (value) => updateCheckpointLocationField(checkpointIndex, "room_id", value),
                        false,
                        formOptionsLoading
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-end pt-1">
              <Button
                className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={addCheckpoint}
                type="button"
              >
                <Plus className="mr-2 h-3.5 w-3.5" />
                Add Checkpoint
              </Button>
            </div>
          </div>
        </section>
      </div>
      <div className="p-3 border-t bg-gray-50 flex justify-center gap-3">
        <Button
          variant="outline"
          className="h-9 px-6 rounded-none text-sm"
          onClick={() => handleFormCancel(isEdit)}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => handleSubmit(isEdit)}
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </>
  );

  const handleExportQrCodes = () => {
    const checkpointIds = data
      .flatMap((item) => item.checkpoints || [])
      .map((checkpoint) => checkpoint.id)
      .filter((id): id is number => Number.isInteger(id));

    if (checkpointIds.length === 0) {
      toast.error("No checkpoint QR codes available to export");
      return;
    }

    const queryString = checkpointIds
      .map((id) => `checkpoint_ids[]=${encodeURIComponent(id)}`)
      .join("&");
    const apiUrl = getFullUrl(`/patrolling_setups/patrolling_qr_codes?${queryString}`);

    window.open(apiUrl, "_blank");
  };

  if (isAddOpen) {
    return (
      <div className="p-6 bg-white min-h-screen">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Petrolling</h1>
        </div>

        <div className="border border-gray-300 bg-white">
          {renderPatrolForm("Add", false, "page")}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Petrolling</h1>
      </div>

      <EnhancedTable
        data={data}
        columns={columns}
        renderCell={renderCell}
        loading={loading}
        pagination={true}
        pageSize={pagination.pageSize}
        currentPage={pagination.currentPage}
        totalPages={Math.ceil(total / pagination.pageSize)}
        onPageChange={(page) => fetchPatrollingData(page)}
        enableGlobalSearch={true}
        onGlobalSearch={(term) => fetchPatrollingData(1, term)}
        searchPlaceholder="Search"
        enableExport={true}
        onExport={handleExportQrCodes}
        leftActions={
          <Button
            onClick={() => {
              navigate("/security/patrolling/create");
            }}
            className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        }
      />

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl bg-white rounded-none p-0 flex flex-col border border-gray-300">
          {renderPatrolForm("Edit", true)}
        </DialogContent>
      </Dialog>

      {/* QR Print Modal */}
      <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
        <DialogContent className="max-w-md bg-white rounded-none p-0 flex flex-col border border-gray-300">
          <DialogHeader className="p-3 border-b bg-gray-50 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-bold text-center w-full">Print QR Code</DialogTitle>
          </DialogHeader>
          <div className="p-8 flex flex-col items-center space-y-4">
            <div id="qr-print-area" className="flex flex-col items-center">
               {selectedPatrol?.qr_code?.url ? (
                 <img 
                   src={selectedPatrol.qr_code.url.startsWith('http') ? selectedPatrol.qr_code.url : `${API_CONFIG.BASE_URL}${selectedPatrol.qr_code.url}`}
                   alt="QR Code" 
                   className="w-64 h-64 object-contain border p-2 bg-white"
                 />
               ) : (
                 <div className="w-64 h-64 bg-gray-100 flex items-center justify-center border text-gray-400">
                    No QR Image
                 </div>
               )}
               <h1 className="mt-4 text-xl font-bold text-gray-700">{selectedPatrol?.area}</h1>
            </div>
          </div>
          <div className="p-4 border-t bg-gray-50 flex justify-center">
            <Button 
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-none flex items-center gap-2"
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4" />
              Print QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Petrolling;
