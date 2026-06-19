import React, { useState, useEffect } from "react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Edit, Printer } from "lucide-react";
import { API_CONFIG, getFullUrl, getAuthHeader } from "@/config/apiConfig";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
  schedules?: {
    id: number;
    name?: string;
    frequency_type?: string;
    frequency_data?: Record<string, unknown> | string | null;
    start_date?: string;
    end_date?: string;
    start_time?: string;
    end_time?: string;
    supervisor_id?: number | null;
    notes?: string;
    cron_setting?: { id?: number; cron_expression?: string };
  }[];
  checkpoints?: {
    id: number;
    name: string;
    description?: string;
    order_sequence?: number;
    estimated_time_minutes?: number;
    area_name?: string;
    qr_code_url?: string;
    building_id?: number | null;
    wing_id?: number | null;
    floor_id?: number | null;
    area_id?: number | null;
    room_id?: number | null;
    snag_checklist_id?: number | null;
    schedule_ids?: number[];
  }[];
}

interface PatrollingLog {
  id: number;
  comment?: string;
  created_at?: string;
  session_date?: string;
  status?: string;
  guard_name?: string;
  progress?: string | number;
  attachments?: { id: number; url: string }[];
  created_by_id?: number;
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

const formatDateForApi = (date: Date) => date.toISOString().split("T")[0];

const addYears = (date: Date, years: number) => {
  const nextDate = new Date(date);
  nextDate.setFullYear(nextDate.getFullYear() + years);
  return nextDate;
};

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

const formatApiTimeForUi = (timeValue?: string) => {
  const apiTime = timeValue ? parseUiTimeToApi(timeValue) : null;
  if (!apiTime) return "";

  const [hourText, minuteText] = apiTime.split(":");
  const hours = Number(hourText);
  const modifier = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${minuteText} ${modifier}`;
};

const getMinutesOfDay = (apiTime: string) => {
  const [hours, minutes] = apiTime.split(":").map(Number);
  return hours * 60 + minutes;
};

const getDurationMinutes = (startTime: string, endTime: string) => {
  const startMinutes = getMinutesOfDay(startTime);
  const endMinutes = getMinutesOfDay(endTime);
  const sameDayDuration = endMinutes - startMinutes;
  return sameDayDuration > 0 ? sameDayDuration : sameDayDuration + 24 * 60;
};

const normalizeHours = (hours: string[]) =>
  hours
    .map((hour) => Number(hour))
    .filter((hour) => Number.isInteger(hour) && hour >= 0 && hour <= 23)
    .sort((a, b) => a - b);

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

const compactObject = (value: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== "")
  );

const Petrolling = () => {
  const [data, setData] = useState<PatrollingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
  });

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [selectedPatrol, setSelectedPatrol] = useState<PatrollingItem | null>(null);
  const [logs, setLogs] = useState<PatrollingLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    area: "",
    frequencyStart: "12:00 AM",
    frequencyEnd: "11:00 PM",
    occurrenceType: "specific", // 'every' or 'specific'
    everyHours: "",
    selectedHours: ["12"] as string[],
  });

  // Notification State
  const [notificationInterval, setNotificationInterval] = useState("5");
  const [isSavingNotification, setIsSavingNotification] = useState(false);

  const columns: ColumnConfig[] = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "area", label: "Area", sortable: true },
    { key: "created_on", label: "Created On", sortable: true },
    { key: "active_inactive", label: "Active/Inactive", sortable: true },
    { key: "qr_code", label: "Qr Code", sortable: false },
  ];

  const logColumns: ColumnConfig[] = [
    { key: "id", label: "ID", sortable: true },
    { key: "patrolling_date", label: "Patrolling Date", sortable: true },
    { key: "patrolling_time", label: "Patrolling Time", sortable: true },
    { key: "comments", label: "Comments", sortable: true },
    { key: "submitted_by", label: "Submitted By", sortable: true },
    { key: "attachments", label: "Attachments", sortable: false },
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

  const fetchPatrollingLogs = async (id: number) => {
    setLogsLoading(true);
    try {
      const apiUrl = getFullUrl(`/patrolling/setup/${id}.json?page=1&per_page=10`);
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
      if (result.data && result.data.recent_sessions) {
        setLogs(result.data.recent_sessions);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Failed to load patrolling logs");
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchSocietySettings = async () => {
    try {
      // Endpoint provided by user: /societies/3492.json
      const apiUrl = getFullUrl(`/societies/3492.json`);
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": getAuthHeader(),
        },
      });
      if (response.ok) {
        const result = await response.json();
        // Fallback or specific field if found
        if (result.society?.patrolling_notification_interval) {
          setNotificationInterval(result.society.patrolling_notification_interval.toString());
        }
      }
    } catch (error) {
      console.error("Error fetching society settings:", error);
    }
  };

  useEffect(() => {
    fetchPatrollingData();
    fetchSocietySettings();
  }, []);

  const handleView = (item: PatrollingItem) => {
    setSelectedPatrol(item);
    setIsViewOpen(true);
    fetchPatrollingLogs(item.id);
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

      // Parse schedule data back into the small modal fields.
      const schedule = detail.schedules?.[0];
      const frequencyData = parseFrequencyData(schedule?.frequency_data);
      let occurrenceType = "specific";
      let everyHours = "";
      let selectedHours: string[] = [];

      const everyHoursValue = frequencyData.every_hours ?? frequencyData.interval_hours;
      const dataHours = frequencyData.hours ?? frequencyData.specific_hours;
      if (everyHoursValue !== undefined && everyHoursValue !== null) {
        occurrenceType = "every";
        everyHours = String(everyHoursValue);
      } else if (Array.isArray(dataHours)) {
        occurrenceType = "specific";
        selectedHours = dataHours.map((hour) => String(hour).padStart(2, "0"));
      }

      const cronExpr = schedule?.cron_setting?.cron_expression;
      if (cronExpr) {
        const parts = cronExpr.split(" ");
        if (parts.length >= 2) {
          const hourPart = parts[1];
          if (hourPart.startsWith("*/")) {
            // Every N hours pattern: 0 */2 * * *
            occurrenceType = "every";
            everyHours = hourPart.replace("*/", "");
          } else if (hourPart !== "*") {
            // Specific hours pattern: 0 8,12,18 * * *
            occurrenceType = "specific";
            selectedHours = hourPart.split(",");
          }
        }
      }

      setFormData({
        area: detail.name || "",
        frequencyStart: formatApiTimeForUi(schedule?.start_time) || "12:00 AM",
        frequencyEnd: formatApiTimeForUi(schedule?.end_time) || "11:00 PM",
        occurrenceType,
        everyHours,
        selectedHours: selectedHours.length ? selectedHours : ["12"],
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
    if (!formData.area.trim()) {
      toast.error("Please enter an area name");
      return;
    }
    if (formData.occurrenceType === "specific" && formData.selectedHours.length === 0) {
      toast.error("Please select at least one hour");
      return;
    }
    if (formData.occurrenceType === "every") {
      const everyHours = Number(formData.everyHours);
      if (!Number.isInteger(everyHours) || everyHours < 1 || everyHours > 23) {
        toast.error("Please enter a valid hourly interval");
        return;
      }
    }
    if (isEdit && !selectedPatrol?.id) {
      toast.error("Patrolling area details are not loaded");
      return;
    }

    const startTime = parseUiTimeToApi(formData.frequencyStart);
    const endTime = parseUiTimeToApi(formData.frequencyEnd);
    if (!startTime || !endTime) {
      toast.error("Please enter valid start and end times");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = isEdit 
        ? getFullUrl(`/patrolling/setup/${selectedPatrol?.id}.json`)
        : getFullUrl(`/patrolling/setup.json`);

      const routeName = formData.area.trim();
      const today = new Date();
      const validityStartDate = selectedPatrol?.validity_start_date || formatDateForApi(today);
      const validityEndDate =
        selectedPatrol?.validity_end_date || formatDateForApi(addYears(today, 1));
      const estimatedDurationMinutes =
        selectedPatrol?.estimated_duration_minutes || getDurationMinutes(startTime, endTime);
      const frequencyData =
        formData.occurrenceType === "specific"
          ? {
              days: DEFAULT_PATROL_DAYS,
              hours: normalizeHours(formData.selectedHours),
            }
          : {
              days: DEFAULT_PATROL_DAYS,
              every_hours: Number(formData.everyHours),
            };

      const schedules = isEdit && selectedPatrol?.schedules?.length
        ? selectedPatrol.schedules.map((schedule, index) =>
            compactObject({
              id: schedule.id,
              name: schedule.name || `${routeName} Schedule`,
              frequency_type: schedule.frequency_type || "daily",
              frequency_data: index === 0 ? frequencyData : schedule.frequency_data,
              start_date: schedule.start_date || validityStartDate,
              end_date: schedule.end_date || validityEndDate,
              start_time: index === 0 ? startTime : schedule.start_time,
              end_time: index === 0 ? endTime : schedule.end_time,
              supervisor_id: schedule.supervisor_id,
              notes: schedule.notes,
            })
          )
        : [
            compactObject({
              name: `${routeName} Schedule`,
              frequency_type: "daily",
              frequency_data: frequencyData,
              start_date: validityStartDate,
              end_date: validityEndDate,
              start_time: startTime,
              end_time: endTime,
            }),
          ];

      const checkpoints = isEdit && selectedPatrol?.checkpoints?.length
        ? selectedPatrol.checkpoints.map((cp, index) =>
            compactObject({
              id: cp.id,
              name: cp.name || routeName,
              description: cp.description,
              order_sequence: cp.order_sequence ?? index + 1,
              estimated_time_minutes: cp.estimated_time_minutes,
              building_id: cp.building_id,
              wing_id: cp.wing_id,
              floor_id: cp.floor_id,
              area_id: cp.area_id,
              room_id: cp.room_id,
              snag_checklist_id: cp.snag_checklist_id,
              schedule_ids: cp.schedule_ids,
            })
          )
        : [
            compactObject({
              name: routeName,
              order_sequence: 1,
              estimated_time_minutes: estimatedDurationMinutes,
            }),
          ];

      const payload = compactObject({
        name: routeName,
        description: selectedPatrol?.description,
        estimated_duration_minutes: estimatedDurationMinutes,
        grace_period_minutes: selectedPatrol?.grace_period_minutes,
        validity_start_date: validityStartDate,
        validity_end_date: validityEndDate,
        schedules,
        checkpoints,
      });

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
      setFormData({
        area: "",
        frequencyStart: "12:00 AM",
        frequencyEnd: "11:00 PM",
        occurrenceType: "specific",
        everyHours: "",
        selectedHours: ["12"],
      });
      setSelectedPatrol(null);
      fetchPatrollingData();
    } catch (error: any) {
      console.error("Error saving patrolling area:", error);
      toast.error(error.message || "Failed to save patrolling area");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSubmit = async () => {
    setIsSavingNotification(true);
    try {
      const apiUrl = getFullUrl(`/societies/3492.json`);
      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": getAuthHeader(),
        },
        body: JSON.stringify({
          society: {
            patrolling_notification_interval: parseInt(notificationInterval),
          },
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      toast.success("Notification settings updated successfully!");
    } catch (error: any) {
      console.error("Error updating notification settings:", error);
      toast.error("Failed to update notification settings");
    } finally {
      setIsSavingNotification(false);
    }
  };

  const toggleHourSelection = (hour: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedHours: prev.selectedHours.includes(hour)
        ? prev.selectedHours.filter((h) => h !== hour)
        : [...prev.selectedHours, hour],
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
    const date = dateValue ? new Date(dateValue) : null;
    switch (columnKey) {
      case "patrolling_date":
        return date ? date.toLocaleDateString("en-GB") : "N/A";
      case "patrolling_time":
        return date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A";
      case "comments":
        return log.comment || log.status?.replace(/_/g, " ") || "N/A";
      case "submitted_by":
        return log.guard_name || (log.created_by_id ? `User ${log.created_by_id}` : "N/A");
      case "attachments":
        return (
          <div className="flex gap-1">
            {log.attachments?.length ? log.attachments.map((att, idx) => {
              let url = decodeURIComponent(att.url);
              if (url.startsWith("//")) url = "https:" + url;
              return (
                <img 
                  key={idx} 
                  src={url} 
                  alt="Attachment" 
                  className="w-10 h-10 object-cover rounded border border-gray-200 cursor-pointer"
                  onClick={() => window.open(url, '_blank')}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=IMG';
                  }}
                />
              );
            }) : <span className="text-xs text-gray-400">N/A</span>}
          </div>
        );
      default:
        return (log as any)[columnKey] || "N/A";
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));

  const renderModalForm = (title: string, isEdit = false) => (
    <>
      <DialogHeader className="p-2 border-b bg-gray-50 flex flex-row items-center justify-between">
        <DialogTitle className="text-md font-bold text-center w-full">{title}</DialogTitle>
      </DialogHeader>
      <div className="p-4 space-y-3">
        <div className="space-y-1">
          <Input 
            placeholder="Enter Area" 
            className="h-9 rounded-none border-gray-300 text-sm"
            value={formData.area}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, area: e.target.value }))
            }
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-700">Frequency</h3>
          <div className="flex gap-3">
            <Input 
              value={formData.frequencyStart}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  frequencyStart: e.target.value,
                }))
              }
              className="h-8 rounded-none border-gray-300 text-sm"
            />
            <Input 
              value={formData.frequencyEnd}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  frequencyEnd: e.target.value,
                }))
              }
              className="h-8 rounded-none border-gray-300 text-sm"
            />
          </div>

          <RadioGroup 
            value={formData.occurrenceType} 
            onValueChange={(val) =>
              setFormData((prev) => ({
                ...prev,
                occurrenceType: val as 'every' | 'specific',
              }))
            }
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="every" id="every" className="w-4 h-4" />
              <Label htmlFor="every" className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                Every 
                <Input 
                  className="w-12 h-7 rounded-none inline-block border-gray-300 text-xs px-1" 
                  value={formData.everyHours}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      everyHours: e.target.value,
                    }))
                  }
                  onClick={(e) => e.stopPropagation()}
                /> 
                hour(s)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="specific" id="specific" className="w-4 h-4" />
              <Label htmlFor="specific" className="text-sm font-normal cursor-pointer">Specific Hours</Label>
            </div>
          </RadioGroup>

          {formData.occurrenceType === 'specific' && (
            <div className="grid grid-cols-6 gap-0 border border-gray-200 bg-gray-50 p-2">
              {hours.map((hour) => (
                <div 
                  key={hour}
                  onClick={() => toggleHourSelection(hour)}
                  className={`h-8 flex items-center justify-center cursor-pointer text-xs border border-transparent hover:border-gray-300 ${formData.selectedHours.includes(hour) ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
                >
                  {hour}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="p-3 border-t bg-gray-50 flex justify-center">
        <Button 
          className="bg-[#00A65A] hover:bg-[#008d4c] text-white h-9 px-6 rounded-none text-sm"
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

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Petrolling</h1>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Label htmlFor="notification-after" className="text-gray-600 whitespace-nowrap">
            Send Notification After(mins):
          </Label>
          <Input 
            id="notification-after"
            type="number"
            value={notificationInterval}
            onChange={(e) => setNotificationInterval(e.target.value)}
            className="w-24 h-9 rounded-none border-gray-300"
          />
          <Button 
            className="bg-[#00A65A] hover:bg-[#008d4c] text-white h-9 px-6 rounded-none"
            onClick={handleNotificationSubmit}
            disabled={isSavingNotification}
          >
            {isSavingNotification ? "..." : "Submit"}
          </Button>
        </div>

        <div className="flex">
          <Button 
            onClick={() => {
              setSelectedPatrol(null);
              setFormData({
                area: "",
                frequencyStart: "12:00 AM",
                frequencyEnd: "11:00 PM",
                occurrenceType: "specific",
                everyHours: "",
                selectedHours: ["12"],
              });
              setIsAddOpen(true);
            }}
            className="bg-[#1C2434] hover:bg-[#2c3a52] text-white rounded-none h-10 px-6 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
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
      />

      {/* Add Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg bg-white rounded-none p-0 flex flex-col border border-gray-300">
          {renderModalForm("Add", false)}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg bg-white rounded-none p-0 flex flex-col border border-gray-300">
          {renderModalForm("Edit", true)}
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-none p-0 flex flex-col border-none">
          <DialogHeader className="p-6 border-b">
            <DialogTitle className="text-xl font-bold text-gray-800">
              Patrolling Details - <span className="text-blue-600">{selectedPatrol?.area}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 flex-1 overflow-auto bg-gray-50">
             <EnhancedTable
                data={logs}
                columns={logColumns}
                renderCell={renderLogCell}
                loading={logsLoading}
                pagination={true}
                pageSize={10}
                currentPage={1}
                totalPages={1}
                onPageChange={() => {}}
                hideTableSearch={true}
                hideColumnsButton={true}
                hideTableExport={true}
                emptyMessage="No logs found"
             />
          </div>
          <div className="p-4 border-t bg-white flex justify-end">
            <Button onClick={() => setIsViewOpen(false)} variant="outline">Close</Button>
          </div>
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
