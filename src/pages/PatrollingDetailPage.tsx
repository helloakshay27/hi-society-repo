import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  MapPin,
  ListChecks,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  FileTextIcon,
  QrCode,
  Activity,
  Shield,
  Eye,
  Download,
  Info,
  Plus,
  AlertCircle,
  Code,
  GripVertical,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { LocationSelectionPanel } from "@/components/LocationSelectionPanel";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { API_CONFIG, getFullUrl, getAuthHeader } from "@/config/apiConfig";
import { toast } from "sonner";
import { DeletePatrollingModal } from "@/components/DeletePatrollingModal";
import { TicketPagination } from "@/components/TicketPagination";
import { CheckpointFilterDialog } from "@/components/CheckpointFilterDialog";
import {
  CheckpointFilters,
  EMPTY_CP_FILTERS,
} from "@/types/checkpointFilters";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Type definitions matching the API response
interface ChecklistData {
  id: number;
  name: string;
  check_type: string;
  snag_audit_category_id: number;
  company_id: number;
  user_id: number;
  active: number;
  created_at: string;
  updated_at: string;
}

interface QuestionData {
  id: number;
  task: string;
  type: string;
  mandatory: boolean;
  qnumber: number;
  options: string[];
  created_at: string;
  updated_at: string;
}

interface CronSetting {
  id: number;
  cron_period: string | null;
  cron_dom: string | null;
  cron_month: string | null;
  cron_mins: string | null;
  cron_dow: string | null;
  cron_time_hour: string | null;
  cron_time_min: string | null;
  cron_of: string;
  cron_of_id: number;
  active: boolean | null;
  created_at: string;
  updated_at: string;
  cron_expression: string;
}

interface ScheduleData {
  id: number;
  assigned_guard_id: number;
  assigned_guard_name?: string;
  supervisor_name?: string;
  supervisor_id: number;
  active: boolean;
  cron_setting?: CronSetting;
  created_at: string;
  updated_at: string;
  name?: string; // Optional as it might not be in the actual API response
  frequency_type?: string; // Optional as it might not be in the actual API response
  start_time?: string; // Optional as it might not be in the actual API response
  end_time?: string; // Optional as it might not be in the actual API response
}

interface CheckpointData {
  id: number;
  name: string;
  description: string;
  order_sequence: number;
  building_id: number | null;
  wing_id: number | null;
  floor_id: number | null;
  room_id: number | null;
  area_id?: number | null;
  area_name?: string;
  estimated_time_minutes: number;
  snag_checklist_id?: number | null;
  schedule_ids?: number[];
  created_at: string;
  updated_at: string;
  qr_code_available: boolean;
  qr_code_url?: string;
  location_qr_code_url?: string | null;
  building_name?: string;
  wing_name?: string;
  floor_name?: string;
  room_name?: string;
}

interface PatrollingDetail {
  id: number;
  name: string;
  description: string;
  estimated_duration_minutes: number;
  auto_ticket: boolean;
  validity_start_date: string;
  validity_end_date: string;
  grace_period_minutes: number;
  active: boolean;
  resource_type: string;
  resource_id: number;
  created_by_id: number;
  created_at: string;
  updated_at: string;
  checklist?: ChecklistData | null;
  questions: QuestionData[];
  schedules: ScheduleData[];
  checkpoints: CheckpointData[];
  recent_sessions: any[];
  summary: {
    questions_count: number;
    schedules_count: number;
    checkpoints_count: number;
    recent_sessions_count: number;
    total_sessions_count: number;
  };
}

// ── Sortable row component for checkpoint drag-and-drop reordering ──────────
interface SortableCheckpointRowProps {
  item: {
    id: number;
    order_sequence: number;
    name: string;
    description: string;
    building_name: string;
    floor_name: string;
    room_name: string;
    qr_code_url: string | null;
    created_at: string;
  };
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  children: React.ReactNode; // rendered cells
}

const SortableCheckpointRow: React.FC<SortableCheckpointRowProps> = ({
  item,
  isSelected,
  onSelect,
  children,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? "relative" : undefined,
    background: isDragging ? "#f0f0f0" : undefined,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={isSelected ? "bg-blue-50" : "hover:bg-gray-50"}
    >
      {/* Drag handle cell */}
      <TableCell className="p-3 w-10 min-w-10 text-center">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing flex items-center justify-center text-gray-400 hover:text-gray-600 touch-none"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      </TableCell>
      {/* Checkbox cell */}
      <TableCell className="p-3 w-10 min-w-10 text-center">
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            aria-label="Select row"
            className="w-4 h-4 rounded border-gray-300 cursor-pointer"
          />
        </div>
      </TableCell>
      {children}
    </TableRow>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

export const PatrollingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patrolling, setPatrolling] = useState<PatrollingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("patrol-information");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [localCheckpoints, setLocalCheckpoints] = useState<CheckpointData[]>([]);
  const [isReordering, setIsReordering] = useState(false);

  // Checkpoint table: selection state for EnhancedTable + LocationSelectionPanel
  const [selectedCheckpointIds, setSelectedCheckpointIds] = useState<number[]>([]);
  const [selectedCheckpointObjects, setSelectedCheckpointObjects] = useState<CheckpointData[]>([]);

  // Checkpoint table: search + column sort
  const [checkpointSearch, setCheckpointSearch] = useState("");
  const [checkpointSort, setCheckpointSort] = useState<{ column: string; direction: "asc" | "desc" } | null>(null);

  // Checkpoint table: location filter dialog
  const [isCpFilterOpen, setIsCpFilterOpen] = useState(false);
  const [cpFilters, setCpFilters] = useState<CheckpointFilters>(EMPTY_CP_FILTERS);

  // Checkpoint table: pagination
  const [cpPage, setCpPage] = useState(1);
  const cpPageSize = 20;

  // State for checklist questions when checklist is selected
  const [checklistQuestions, setChecklistQuestions] = useState<QuestionData[]>(
    []
  );
  const [loadingChecklistQuestions, setLoadingChecklistQuestions] =
    useState(false);

  useEffect(() => {
    if (id) {
      fetchPatrollingDetail(parseInt(id));
    }
  }, [id]);

  // Sync localCheckpoints whenever patrolling data changes
  useEffect(() => {
    if (patrolling?.checkpoints) {
      setLocalCheckpoints(
        [...patrolling.checkpoints].sort((a, b) => a.order_sequence - b.order_sequence)
      );
    }
  }, [patrolling?.checkpoints]);

  // Fetch checklist questions when patrolling has a checklist
  useEffect(() => {
    if (patrolling?.checklist?.id) {
      fetchChecklistQuestions(patrolling.checklist.id);
    }
  }, [patrolling?.checklist?.id]);

  const fetchChecklistQuestions = async (checklistId: number) => {
    setLoadingChecklistQuestions(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;

      if (!baseUrl || !token) {
        throw new Error("API configuration is missing");
      }

      const apiUrl = getFullUrl(
        `/pms/admin/snag_checklists/${checklistId}.json`
      );

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data?.snag_questions) {
        // Map checklist questions to the same format as patrolling questions
        const mappedQuestions = result.data.snag_questions.map(
          (q: any, index: number) => ({
            id: q.id,
            task: q.descr || q.task || "",
            type:
              q.qtype === "multiple"
                ? "multiple_choice"
                : q.qtype === "yesno"
                ? "yes_no"
                : q.qtype || "text",
            mandatory: !!q.quest_mandatory,
            qnumber: index + 1,
            options: q.snag_quest_options
              ? q.snag_quest_options.map((opt: any) => opt.qname || opt.name)
              : [],
            created_at: q.created_at || new Date().toISOString(),
            updated_at: q.updated_at || new Date().toISOString(),
          })
        );
        setChecklistQuestions(mappedQuestions);
      }
    } catch (error: any) {
      console.error("Error fetching checklist questions:", error);
      toast.error(`Failed to load checklist questions: ${error.message}`, {
        duration: 5000,
      });
    } finally {
      setLoadingChecklistQuestions(false);
    }
  };

  const fetchPatrollingDetail = async (patrollingId: number) => {
    setLoading(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;

      if (!baseUrl || !token) {
        throw new Error("API configuration is missing");
      }

      const apiUrl = getFullUrl(`/patrolling/setup/${patrollingId}.json`);

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setPatrolling(result.data);
      } else {
        throw new Error("Failed to fetch patrolling details");
      }
    } catch (error: any) {
      console.error("Error fetching patrolling details:", error);
      toast.error(`Failed to load patrolling details: ${error.message}`, {
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleCheckpointDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !id) return;

    const oldIndex = localCheckpoints.findIndex((c) => c.id === active.id);
    const newIndex = localCheckpoints.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder locally and assign new order_sequence values
    const reordered = arrayMove(localCheckpoints, oldIndex, newIndex).map(
      (cp, idx) => ({ ...cp, order_sequence: idx + 1 })
    );
    setLocalCheckpoints(reordered);

    setIsReordering(true);
    try {
      const apiUrl = getFullUrl(`/patrolling/routes/${id}/reorder_checkpoints`);
      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: getAuthHeader(),
        },
        body: JSON.stringify({
          checkpoints: reordered.map((cp) => ({
            id: cp.id,
            order_sequence: cp.order_sequence,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Checkpoint order updated successfully!");

      // Also update the patrolling state so re-renders stay consistent
      setPatrolling((prev) =>
        prev
          ? {
              ...prev,
              checkpoints: prev.checkpoints.map((cp) => {
                const updated = reordered.find((r) => r.id === cp.id);
                return updated ? { ...cp, order_sequence: updated.order_sequence } : cp;
              }),
            }
          : prev
      );
    } catch (error: unknown) {
      console.error("Error reordering checkpoints:", error);
      toast.error("Failed to update checkpoint order. Please try again.");
      // Revert to original order on failure
      if (patrolling?.checkpoints) {
        setLocalCheckpoints(
          [...patrolling.checkpoints].sort((a, b) => a.order_sequence - b.order_sequence)
        );
      }
    } finally {
      setIsReordering(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "—";
    try {
      return new Date(timeString).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const formatCronExpression = (cronExpression: string) => {
    if (!cronExpression) return null;

    try {
      // Parse cron expression: "minutes hours days months day-of-week"
      const parts = cronExpression.split(" ");
      if (parts.length !== 5) return null; // Return null if not standard format

      const [minutes, hours, days, months, dayOfWeek] = parts;

      const formatValue = (
        value: string,
        type: "minutes" | "hours" | "days" | "months" | "weekdays"
      ) => {
        if (value === "*") return "All";
        if (value === "?") return "Any";

        const items = value.split(",");

        if (type === "months" && items.length <= 12) {
          const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          const monthList = items.map((m) => {
            const monthNum = parseInt(m);
            return monthNames[monthNum - 1] || m;
          });
          return monthList.join(", ");
        }

        if (type === "weekdays" && items.length <= 7) {
          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const weekdayList = items.map((d) => {
            const dayNum = parseInt(d);
            return dayNames[dayNum] || d;
          });
          return weekdayList.join(", ");
        }

        if (type === "hours" && items.length <= 24) {
          return items.map((h) => h.padStart(2, "0")).join(", ");
        }

        if (type === "minutes" && items.length <= 60) {
          return items.map((m) => m.padStart(2, "0")).join(", ");
        }

        if (items.length <= 10) {
          return items.join(", ");
        }

        return `${items.length} values`;
      };

      return {
        hours: formatValue(hours, "hours"),
        minutes: formatValue(minutes, "minutes"),
        dayOfWeek: formatValue(dayOfWeek, "weekdays"),
        months: formatValue(months, "months"),
        days: formatValue(days, "days"),
      };
    } catch (error) {
      return null;
    }
  };

  const handleEdit = () => {
    navigate(`/security/patrolling/edit/${id}`);
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;

    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;

      if (!baseUrl || !token) {
        throw new Error("API configuration is missing");
      }

      const apiUrl = getFullUrl(`/patrolling/setup/${id}.json`);

      const response = await fetch(apiUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Patrolling deleted successfully!", {
        duration: 3000,
      });

      setIsDeleteModalOpen(false);
      navigate("/security/patrolling");
    } catch (error: any) {
      console.error("Error deleting patrolling:", error);
      toast.error(`Failed to delete patrolling: ${error.message}`, {
        duration: 5000,
      });
    }
  };

  // ── Checkpoint table: EnhancedTable columns + data ─────────────────────────
  interface CheckpointTableItem {
    id: number;
    order_sequence: number;
    name: string;
    description: string;
    building_name: string;
    floor_name: string;
    room_name: string;
    qr_code_url: string | null;
    created_at: string;
  }

  const checkpointTableColumns: ColumnConfig[] = [
    { key: "order_sequence", label: "Order", sortable: true, draggable: false, defaultVisible: true },
    { key: "name", label: "Name", sortable: true, draggable: false, defaultVisible: true },
    { key: "description", label: "Description", sortable: false, draggable: false, defaultVisible: true },
    { key: "building_name", label: "Tower", sortable: true, draggable: false, defaultVisible: true },
    { key: "floor_name", label: "Floor", sortable: false, draggable: false, defaultVisible: true },
    { key: "room_name", label: "Flat", sortable: false, draggable: false, defaultVisible: true },
    { key: "qr_code_url", label: "QR Code", sortable: false, draggable: false, defaultVisible: true },
    { key: "created_at", label: "Created On", sortable: true, draggable: false, defaultVisible: true },
  ];

  const checkpointTableData = useMemo((): CheckpointTableItem[] => {
    return localCheckpoints.map((cp) => ({
      id: cp.id,
      order_sequence: cp.order_sequence,
      name: cp.name,
      description: cp.description || "—",
      building_name: cp.building_name || "—",
      floor_name: cp.floor_name || "—",
      room_name: cp.room_name || "—",
      qr_code_url: cp.qr_code_available ? cp.qr_code_url || null : null,
      created_at: cp.created_at,
    }));
  }, [localCheckpoints]);

  const activeCpFilterCount = [
    cpFilters.buildingName,
    cpFilters.floorName,
    cpFilters.roomName,
  ].filter(Boolean).length;

  const clearAllCpFilters = () => setCpFilters(EMPTY_CP_FILTERS);

  // Derived: search-filtered + location-filtered + sorted checkpoint rows
  const filteredSortedCheckpointData = useMemo((): CheckpointTableItem[] => {
    const q = checkpointSearch.trim().toLowerCase();
    let rows = q
      ? checkpointTableData.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q) ||
            r.building_name.toLowerCase().includes(q) ||
            r.floor_name.toLowerCase().includes(q) ||
            r.room_name.toLowerCase().includes(q)
        )
      : [...checkpointTableData];

    // Apply location filters (name-based matching from dialog)
    if (cpFilters.buildingName) rows = rows.filter((r) => r.building_name === cpFilters.buildingName);
    if (cpFilters.floorName) rows = rows.filter((r) => r.floor_name === cpFilters.floorName);
    if (cpFilters.roomName) rows = rows.filter((r) => r.room_name === cpFilters.roomName);

    if (checkpointSort) {
      const { column, direction } = checkpointSort;
      rows = [...rows].sort((a, b) => {
        let aVal: string | number = (a as unknown as Record<string, unknown>)[column] as string | number ?? "";
        let bVal: string | number = (b as unknown as Record<string, unknown>)[column] as string | number ?? "";
        if (column === "order_sequence") {
          aVal = Number(aVal);
          bVal = Number(bVal);
          return direction === "asc" ? aVal - bVal : bVal - aVal;
        }
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
        if (aVal < bVal) return direction === "asc" ? -1 : 1;
        if (aVal > bVal) return direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [checkpointTableData, checkpointSearch, checkpointSort, cpFilters]);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setCpPage(1);
  }, [checkpointSearch, cpFilters]);

  // Paginated checkpoint data
  const cpTotalPages = Math.max(1, Math.ceil(filteredSortedCheckpointData.length / cpPageSize));
  const paginatedCheckpointData = useMemo(() => {
    const start = (cpPage - 1) * cpPageSize;
    return filteredSortedCheckpointData.slice(start, start + cpPageSize);
  }, [filteredSortedCheckpointData, cpPage, cpPageSize]);

  const handleCheckpointSortToggle = (column: string) => {
    setCheckpointSort((prev) => {
      if (prev?.column === column) {
        return prev.direction === "asc"
          ? { column, direction: "desc" }
          : null; // third click clears sort
      }
      return { column, direction: "asc" };
    });
  };

  const handleCheckpointSelect = (itemId: string, isSelected: boolean) => {
    const cpId = parseInt(itemId);
    const cp = localCheckpoints.find((c) => c.id === cpId);
    setSelectedCheckpointIds((prev) =>
      isSelected ? [...prev, cpId] : prev.filter((id) => id !== cpId)
    );
    if (cp) {
      setSelectedCheckpointObjects((prev) =>
        isSelected ? [...prev, cp] : prev.filter((c) => c.id !== cpId)
      );
    }
  };

  const handleSelectAllCheckpoints = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedCheckpointIds(localCheckpoints.map((c) => c.id));
      setSelectedCheckpointObjects([...localCheckpoints]);
    } else {
      setSelectedCheckpointIds([]);
      setSelectedCheckpointObjects([]);
    }
  };

  const handleClearCheckpointSelection = () => {
    setSelectedCheckpointIds([]);
    setSelectedCheckpointObjects([]);
  };

  const handlePrintCheckpointQR = async () => {
    if (selectedCheckpointIds.length === 0) return;
    
    try {
      const ids = selectedCheckpointIds.join(",");
      const apiUrl = getFullUrl(`/patrolling/print_qr_codes.json?checkpoint_ids=${ids}`);
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: getAuthHeader(),
          Accept: "text/html, application/xhtml+xml, application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = new Blob([await response.arrayBuffer()], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.opacity = '0';
      iframe.style.border = 'none';
      iframe.src = blobUrl;

      iframe.onload = () => {
        setTimeout(() => {
          try {
            if (iframe.contentWindow) {
              iframe.contentWindow.focus();
              iframe.contentWindow.print();
            }
          } catch (e) {
            console.warn("Iframe print blocked, opening in new tab:", e);
            window.open(blobUrl, '_blank');
          }
          
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
              URL.revokeObjectURL(blobUrl);
            }
          }, 30000);
        }, 800);
      };

      document.body.appendChild(iframe);
    } catch (error: any) {
      console.error('Error fetching QR Codes:', error);
      toast.error(`Failed to fetch QR codes: ${error.message}`);
    }
  };

  const questionColumns: ColumnConfig[] = [
    { key: "qnumber", label: "Q#", sortable: true, hideable: false, draggable: false, defaultVisible: true },
    { key: "task", label: "Question", sortable: true, hideable: true, draggable: true, defaultVisible: true },
    { key: "type", label: "Type", sortable: true, hideable: true, draggable: true, defaultVisible: true },
    { key: "mandatory", label: "Mandatory", sortable: true, hideable: true, draggable: true, defaultVisible: true },
    { key: "options", label: "Options", sortable: false, hideable: true, draggable: true, defaultVisible: true },
    { key: "created_at", label: "Created On", sortable: true, hideable: true, draggable: true, defaultVisible: true },
  ];

  const renderQuestionCell = (question: QuestionData, columnKey: string): React.ReactNode => {
    switch (columnKey) {
      case "qnumber":
        return <Badge variant="outline" className="text-xs">Q{question.qnumber}</Badge>;
      case "task":
        return <span className="font-medium">{question.task || "--"}</span>;
      case "type":
        return <Badge variant="outline" className="text-xs">{question.type}</Badge>;
      case "mandatory":
        return question.mandatory ? (
          <Badge className="text-xs !bg-[#1A1A18] !text-white border-transparent hover:!bg-[#1A1A18]">Required</Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">Optional</Badge>
        );
      case "options":
        return question.options?.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {question.options.map((option, index) => (
              <span key={index} className="text-xs bg-[#F5F4F0] px-2 py-1 rounded">{option}</span>
            ))}
          </div>
        ) : (
          "—"
        );
      case "created_at":
        return <span className="text-sm">{formatDateTime(question.created_at)}</span>;
      default:
        return "--";
    }
  };

  const renderQuestionsTable = (questions: QuestionData[], storageKey: string) => (
    <EnhancedTable
      data={questions}
      columns={questionColumns}
      renderCell={renderQuestionCell}
      storageKey={storageKey}
      pagination={false}
      enableSearch={false}
      hideTableSearch
      hideTableExport
      hideColumnsButton
      emptyMessage="No questions available."
    />
  );

  const renderCheckpointCell = (item: CheckpointTableItem, columnKey: string): React.ReactNode => {
    switch (columnKey) {
      case "order_sequence":
        return <Badge variant="outline">#{item.order_sequence}</Badge>;
      case "qr_code_url":
        return item.qr_code_url ? (
          <div className="flex items-center gap-1.5">
            {/* QR preview — click opens full size in new tab */}
            <button
              onClick={() => window.open(item.qr_code_url!, "_blank")}
              className="group flex items-center justify-center flex-shrink-0"
              title="Click to view QR code"
            >
              <img
                src={item.qr_code_url}
                alt={`QR Code – ${item.name}`}
                className="w-12 h-12 object-contain border border-gray-200 rounded group-hover:opacity-80 group-hover:border-[#C72030] transition-all cursor-pointer"
              />
            </button>
            {/* Download button — fetches the QR image and triggers browser download */}
            <button
              title="Download QR code"
              className="flex-shrink-0 p-1 rounded hover:bg-gray-100 transition-colors text-gray-500 hover:text-[#C72030]"
              onClick={async (e) => {
                e.stopPropagation();
                const qrUrl = item.qr_code_url!;
                try {
                  const response = await fetch(qrUrl);
                  if (!response.ok) throw new Error("Failed to fetch QR image");
                  const blob = await response.blob();
                  const objectUrl = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  // derive a safe filename from the checkpoint name
                  const safeName = item.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
                  link.href = objectUrl;
                  link.download = `qr_${safeName}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(objectUrl);
                  toast.success(`QR code for "${item.name}" downloaded!`);
                } catch {
                  // Fallback: open the QR image in a new tab if fetch fails (e.g. CORS)
                  window.open(qrUrl, "_blank");
                  toast.info(`Opening QR code for "${item.name}" in a new tab.`);
                }
              }}
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        );
      case "created_at":
        return <span className="text-xs text-gray-600">{formatDateTime(item.created_at)}</span>;
      default:
        return <span>{String((item as unknown as Record<string, unknown>)[columnKey] ?? "—")}</span>;
    }
  };
  // ────────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFB] p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#C72030]" />
          <span className="ml-2 text-gray-600">
            Loading patrolling details...
          </span>
        </div>
      </div>
    );
  }

  if (!patrolling) {
    return (
      <div className="min-h-screen bg-[#FDFDFB] p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">
            Patrolling not found
          </h2>
          <p className="text-gray-600 mt-2">
            The requested patrolling could not be found.
          </p>
          <Button
            onClick={() => navigate("/security/patrolling")}
            className="mt-4"
          >
            Back to Patrolling List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFB] p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/security/patrolling")}
          className="mb-4 flex items-center gap-1.5 text-[12.5px] font-semibold text-[rgba(26,26,24,.48)] transition-colors hover:text-[#1A1A18]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Patrolling List
        </button>

        <div className="my-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="mb-2 text-[22px] font-semibold text-[#1A1A18]" style={{ letterSpacing: '-0.015em', lineHeight: 1.2 }}>
              {patrolling.name}
            </h1>
            <Badge
              variant={patrolling.active ? "default" : "secondary"}
              className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${patrolling.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}
            >
              {patrolling.active ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 mr-1" />
                  Inactive
                </>
              )}
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleEdit}
              aria-label="Edit patrolling"
              variant="outline"
              className="h-[50px] rounded-[16px] !border-[rgba(26,26,24,.18)] bg-white px-[22px] text-[13px] font-semibold !text-[#1A1A18] hover:bg-[#F7F6F2]"
            >
              <Edit
                className="mr-2 h-4 w-4 !text-[#1A1A18] !stroke-[#1A1A18]"
              />
              Edit
            </Button>
            <Button
              onClick={handleDelete}
              variant="outline"
              className="h-[50px] rounded-[16px] !border-[rgba(26,26,24,.18)] bg-white px-[22px] text-[13px] font-semibold !text-[#1A1A18] hover:bg-[#F7F6F2]"
            >
              <Trash2 className="mr-2 h-4 w-4 !text-[#1A1A18] !stroke-[#1A1A18]" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Tabs */}
        <div className="w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex h-auto w-fit max-w-full flex-wrap justify-start gap-1 rounded-xl bg-[#1a1a180e] p-1 text-sm">
              {[
                { label: "Patrol Information", value: "patrol-information" },
                { label: "Questions", value: "questions" },
                { label: "Schedules", value: "schedules" },
                { label: "Checkpoints", value: "checkpoints" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="min-w-0 rounded-lg border-0 bg-transparent px-4 py-2 text-[13px] font-medium text-[rgba(26,26,24,.68)] data-[state=active]:bg-white data-[state=active]:text-[#1A1A18] data-[state=active]:shadow-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

          {/* Patrol Information */}
          <TabsContent value="patrol-information" className="mt-4 space-y-4 p-0">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="rounded-2xl border border-[rgba(26,26,24,.09)] bg-[#F5F4F0] p-4 shadow-none">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFFFFF]">
                    <Clock className="h-4 w-4 text-[#1A1A18]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-[rgba(26,26,24,.48)]">Duration</p>
                    <p className="text-[16px] font-semibold text-[#1A1A18]">
                      {patrolling.grace_period_minutes} min
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[rgba(26,26,24,.09)] bg-[#F5F4F0] p-4 shadow-none">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFFFFF]">
                    <ListChecks className="h-4 w-4 text-[#1A1A18]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-[rgba(26,26,24,.48)]">Questions</p>
                    <p className="text-[16px] font-semibold text-[#1A1A18]">
                      {patrolling.summary?.questions_count || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[rgba(26,26,24,.09)] bg-[#F5F4F0] p-4 shadow-none">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFFFFF]">
                    <Users className="h-4 w-4 text-[#1A1A18]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-[rgba(26,26,24,.48)]">Schedules</p>
                    <p className="text-[16px] font-semibold text-[#1A1A18]">
                      {patrolling.summary?.schedules_count || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[rgba(26,26,24,.09)] bg-[#F5F4F0] p-4 shadow-none">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFFFFF]">
                    <MapPin className="h-4 w-4 text-[#1A1A18]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-[rgba(26,26,24,.48)]">Checkpoints</p>
                    <p className="text-[16px] font-semibold text-[#1A1A18]">
                      {patrolling.summary?.checkpoints_count || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Patrol Information Card */}
            <Card className="mb-4 overflow-hidden rounded-2xl border border-[rgba(26,26,24,.09)] bg-white p-6 shadow-none">
              <div className="mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F4F0]">
                    <Shield className="h-[14px] w-[14px] text-[#1A1A18]" />
                  </div>
                  <h3 className="text-[14px] font-semibold text-[#1A1A18]">Patrol Information</h3>
                </div>
              </div>
              <div>
                <div className="grid grid-cols-1 gap-x-8 gap-y-5 text-sm md:grid-cols-2">
                  <div className="flex flex-col">
                    <span className="mb-1 text-[11px] font-medium text-[rgba(26,26,24,.48)]">Name</span>
                    <span className="text-[13.5px] font-medium text-[#1A1A18]">{patrolling.name}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="mb-1 text-[11px] font-medium text-[rgba(26,26,24,.48)]">Description</span>
                    <span className="text-[13.5px] font-medium text-[#1A1A18]">{patrolling.description || "—"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="mb-1 text-[11px] font-medium text-[rgba(26,26,24,.48)]">Start Date</span>
                    <span className="text-[13.5px] font-medium text-[#1A1A18]">{formatDate(patrolling.validity_start_date)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="mb-1 text-[11px] font-medium text-[rgba(26,26,24,.48)]">End Date</span>
                    <span className="text-[13.5px] font-medium text-[#1A1A18]">{formatDate(patrolling.validity_end_date)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="mb-1 text-[11px] font-medium text-[rgba(26,26,24,.48)]">Grace Period</span>
                    <span className="text-[13.5px] font-medium text-[#1A1A18]">{patrolling.grace_period_minutes} minutes</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="mb-1 text-[11px] font-medium text-[rgba(26,26,24,.48)]">Status</span>
                    <div>
                      <Badge
                        variant={patrolling.active ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {patrolling.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="mb-1 text-[11px] font-medium text-[rgba(26,26,24,.48)]">Created On</span>
                    <span className="text-[13.5px] font-medium text-[#1A1A18]">{formatDateTime(patrolling.created_at)}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Checklist Information */}
            {patrolling.checklist && (
              <Card className="mb-4 overflow-hidden rounded-2xl border border-[rgba(26,26,24,.09)] bg-white p-6 shadow-none">
                <div className="mb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F4F0]">
                      <ListChecks className="h-[14px] w-[14px] text-[#1A1A18]" />
                    </div>
                    <h3 className="text-[14px] font-semibold text-[#1A1A18]">Checklist Information</h3>
                  </div>
                </div>
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <div className="flex flex-col">
                      <span className="mb-1 text-[11px] font-medium text-[rgba(26,26,24,.48)]">Checklist Name</span>
                      <span className="text-[13.5px] font-medium text-[#1A1A18]">{patrolling.checklist.name}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="mb-1 text-[11px] font-medium text-[rgba(26,26,24,.48)]">Check Type</span>
                      <span className="text-[13.5px] font-medium text-[#1A1A18]">{patrolling.checklist.check_type}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="mb-1 text-[11px] font-medium text-[rgba(26,26,24,.48)]">Status</span>
                      <div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${patrolling.checklist.active ? "bg-red-100 text-red-800 border-red-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}
                        >
                          {patrolling.checklist.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="mb-1 text-[11px] font-medium text-[rgba(26,26,24,.48)]">Created On</span>
                      <span className="text-[13.5px] font-medium text-[#1A1A18]">{formatDateTime(patrolling.checklist.created_at)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* QR Code Section */}
            {/* {patrolling.checkpoints &&
              patrolling.checkpoints.some &&
              patrolling.checkpoints.some((cp) => cp.qr_code_available) && (
              <Card className="mb-4 overflow-hidden rounded-2xl border border-[rgba(26,26,24,.09)] bg-white p-6 shadow-none">
              <div className="mb-5">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className="figma-card-icon-wrapper">
                          <QrCode className="figma-card-icon" />
                        </div>
                        <h3 className="figma-card-title">
                          QR Codes (
                          {
                            patrolling.checkpoints.filter(
                              (cp) => cp.qr_code_available
                            ).length
                          }
                          )
                        </h3>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const baseUrl = API_CONFIG.BASE_URL;
                            const token = API_CONFIG.TOKEN;

                            if (!baseUrl || !token) {
                              throw new Error("API configuration is missing");
                            }

                            // Get all checkpoint IDs that have QR codes
                            const qrCodeCheckpoints = patrolling.checkpoints.filter(
                              (cp) => cp.qr_code_available
                            );
                            
                            if (qrCodeCheckpoints.length === 0) {
                              toast.error('No QR codes available to download');
                              return;
                            }

                            const queryString = qrCodeCheckpoints
                              .map(cp => `checkpoint_ids[]=${encodeURIComponent(cp.id)}`)
                              .join('&');
                            const apiUrl = getFullUrl(`/patrolling_setups/patrolling_qr_codes.pdf?${queryString}`);

                            const response = await fetch(apiUrl, {
                              method: "GET",
                              headers: {
                                "Content-Type": "application/json",
                                Accept: "application/json",
                                Authorization: getAuthHeader(),
                              },
                            });

                            if (!response.ok) {
                              throw new Error(`HTTP error! status: ${response.status}`);
                            }

                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `patrolling_${patrolling.id}_all_qr_codes.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                            toast.success(`Downloaded ${qrCodeCheckpoints.length} QR codes successfully!`);
                          } catch (error: any) {
                            console.error('Error downloading QR Codes:', error);
                            toast.error(`Failed to download QR codes: ${error.message}`);
                          }
                        }}
                        className="text-xs border-[#C72030] text-[#C72030] hover:bg-[#C72030] hover:text-white"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download All QR Codes
                      </Button>
                    </div>
                  </div>
                  <div className="figma-card-content">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {patrolling.checkpoints
                        .filter((cp) => cp.qr_code_available)
                        .map((checkpoint) => (
                          <div
                            key={checkpoint.id}
                            className="p-4 border rounded-lg bg-white shadow-sm"
                          >
                            <div className="text-center">
                              <div className="mb-3">
                                <p className="font-medium text-sm">
                                  {checkpoint.name}
                                </p>
                                <p className="text-xs text-gray-600">
                                  Order #{checkpoint.order_sequence}
                                </p>
                                <Badge
                                  variant="default"
                                  className="text-xs mt-1"
                                >
                                  <QrCode className="w-3 h-3 mr-1" />
                                  QR Available
                                </Badge>
                              </div>

                              {checkpoint.qr_code_url ? (
                                <div className="space-y-3">
                                  <div className="flex justify-center">
                                    <img
                                      src={checkpoint.qr_code_url}
                                      alt={`QR Code for ${checkpoint.name}`}
                                      className="w-32 h-32 object-contain border border-gray-200 rounded"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                        e.currentTarget.nextElementSibling?.classList.remove(
                                          "hidden"
                                        );
                                      }}
                                    />
                                    <div className="hidden w-32 h-32 border border-gray-200 rounded flex items-center justify-center bg-gray-50">
                                      <div className="text-center">
                                        <QrCode className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                                        <p className="text-xs text-gray-500">
                                          QR Code Error
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex gap-2 justify-center">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        window.open(
                                          checkpoint.qr_code_url,
                                          "_blank"
                                        )
                                      }
                                      className="text-xs"
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      View
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          const baseUrl = API_CONFIG.BASE_URL;
                                          const token = API_CONFIG.TOKEN;

                                          if (!baseUrl || !token) {
                                            throw new Error("API configuration is missing");
                                          }

                                          // Use the new API endpoint for downloading QR codes
                                          const apiUrl = getFullUrl(`/patrolling_setups/patrolling_qr_codes.pdf?checkpoint_ids[]=${encodeURIComponent(checkpoint.id)}`);

                                          const response = await fetch(apiUrl, {
                                            method: "GET",
                                            headers: {
                                              Authorization: getAuthHeader(),
                                              Accept: "application/pdf",
                                            },
                                          });

                                          if (!response.ok) {
                                            throw new Error(`HTTP error! status: ${response.status}`);
                                          }

                                          const blob = await response.blob();
                                          const url = window.URL.createObjectURL(blob);
                                          const a = document.createElement('a');
                                          a.href = url;
                                          a.download = `checkpoint_${checkpoint.id}_qr_code.pdf`;
                                          document.body.appendChild(a);
                                          a.click();
                                          window.URL.revokeObjectURL(url);
                                          document.body.removeChild(a);
                                          toast.success('QR Code downloaded successfully!');
                                        } catch (error: any) {
                                          console.error('Error downloading QR Code:', error);
                                          toast.error(`Failed to download QR Code: ${error.message}`);
                                        }
                                      }}
                                      className="text-xs"
                                    >
                                      <Download className="w-3 h-3 mr-1" />
                                      Download
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="w-32 h-32 border border-gray-200 rounded flex items-center justify-center bg-gray-50 mx-auto">
                                  <div className="text-center">
                                    <QrCode className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                                    <p className="text-xs text-gray-500">
                                      QR Code Available
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      No URL provided
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <QrCode className="w-5 h-5 text-gray-600" />
                        <p className="text-sm font-medium text-gray-800">
                          QR Code Summary
                        </p>
                      </div>
                      <p className="text-sm text-gray-700">
                        <strong>
                          {
                            patrolling.checkpoints.filter(
                              (cp) => cp.qr_code_available
                            ).length
                          }
                        </strong>{" "}
                        out of <strong>{patrolling.checkpoints.length}</strong>{" "}
                        checkpoints have QR codes available.
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Guards can scan these QR codes to check in at each
                        checkpoint during patrol.
                      </p>
                    </div>
                  </div>
                </Card>
              )} */}
          </TabsContent>

          {/* Questions */}
          <TabsContent value="questions" className="mt-4 space-y-4 p-0">
            {patrolling.checklist && checklistQuestions.length > 0 ? (
              // Show checklist questions
              <>
                <div className="mb-4 p-4 bg-[#F5F4F0] border border-[rgba(26,26,24,.09)] rounded-lg">
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-[rgba(26,26,24,.48)]" />
                    <div>
                      <p className="text-sm font-medium text-[#1A1A18]">
                        Questions from Checklist
                      </p>
                      <p className="text-xs text-[rgba(26,26,24,.48)]">
                        Questions are loaded from the selected checklist:{" "}
                        <strong>{patrolling.checklist.name}</strong>
                      </p>
                    </div>
                  </div>
                </div>

                <Card className="mb-4 overflow-hidden rounded-2xl border border-[rgba(26,26,24,.09)] bg-white p-6 shadow-none">
                  <div className="mb-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F4F0]">
                        <ListChecks className="h-[14px] w-[14px] text-[#1A1A18]" />
                      </div>
                      <h3 className="text-[14px] font-semibold text-[#1A1A18]">
                        Checklist Questions ({checklistQuestions.length})
                        {loadingChecklistQuestions && (
                          <Loader2 className="w-4 h-4 animate-spin ml-2 text-[#da7756]" />
                        )}
                      </h3>
                    </div>
                  </div>
                  {renderQuestionsTable(checklistQuestions, "patrolling-checklist-questions")}
                </Card>
              </>
            ) : (
              // Show patrolling questions
              <Card className="mb-4 overflow-hidden rounded-2xl border border-[rgba(26,26,24,.09)] bg-white p-6 shadow-none">
                <div className="mb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F4F0]">
                      <ListChecks className="h-[14px] w-[14px] text-[#1A1A18]" />
                    </div>
                    <h3 className="text-[14px] font-semibold text-[#1A1A18]">
                      Questions ({patrolling.questions?.length || 0})
                      {patrolling.checklist && loadingChecklistQuestions && (
                        <Loader2 className="w-4 h-4 animate-spin ml-2 text-[#da7756]" />
                      )}
                    </h3>
                  </div>
                </div>
                {renderQuestionsTable(patrolling.questions || [], "patrolling-questions")}
              </Card>
            )}
          </TabsContent>

          {/* Schedules */}
          <TabsContent value="schedules" className="mt-4 space-y-4 p-0">
            <Card className="mb-4 overflow-hidden rounded-2xl border border-[rgba(26,26,24,.09)] bg-white p-6 shadow-none">
              <div className="mb-5 flex w-full items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F4F0]">
                    <Calendar className="h-[14px] w-[14px] text-[#1A1A18]" />
                  </div>
                  <h3 className="text-[14px] font-semibold text-[#1A1A18]">Schedules ({patrolling.schedules?.length || 0})</h3>
                </div>
                {patrolling.schedules && patrolling.schedules.length > 0 && (
                  <div className="flex items-center gap-4 text-[12px] font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#798c5e]" />
                      <span className="text-[#1A1A18]">Active: {patrolling.schedules.filter(s => s.active).length}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#d3d1c7]" />
                      <span className="text-[rgba(26,26,24,.48)]">Inactive: {patrolling.schedules.filter(s => !s.active).length}</span>
                    </div>
                  </div>
                )}
              </div>

              {patrolling.schedules && patrolling.schedules.length > 0 ? (
                <div className="space-y-4">
                  {patrolling.schedules.map((schedule) => {
                    const cronData = schedule.cron_setting?.cron_expression
                      ? formatCronExpression(schedule.cron_setting.cron_expression)
                      : null;
                    const timing = cronData
                      ? [
                          { label: "Hours", value: cronData.hours },
                          { label: "Minutes", value: cronData.minutes },
                          { label: "Day of Week", value: cronData.dayOfWeek },
                          { label: "Month", value: cronData.months },
                        ]
                      : [];
                    const people = [
                      { label: "Guard", icon: Shield, name: schedule.assigned_guard_name, id: schedule.assigned_guard_id },
                      { label: "Supervisor", icon: Eye, name: schedule.supervisor_name, id: schedule.supervisor_id },
                    ];
                    return (
                      <div key={schedule.id} className="rounded-xl border border-[rgba(26,26,24,.09)] bg-white p-5">
                        {/* Header */}
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(26,26,24,.09)] pb-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 min-w-10 items-center justify-center rounded-full bg-[#F5F4F0] px-2 text-[12px] font-semibold text-[#1A1A18]">
                              #{schedule.id}
                            </div>
                            <div>
                              <h4 className="text-[14px] font-semibold text-[#1A1A18]">Schedule #{schedule.id}</h4>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-[rgba(26,26,24,.48)]">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Created {formatDateTime(schedule.created_at)}
                                </span>
                                {schedule.cron_setting?.cron_expression && (
                                  <Badge variant="outline" className="px-2 py-0.5 text-[11px]">
                                    <Clock className="mr-1 h-3 w-3" />
                                    Scheduled
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge className={schedule.active ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-gray-100 text-gray-600 hover:bg-gray-100"}>
                            {schedule.active ? "ACTIVE" : "INACTIVE"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          {/* Personnel */}
                          <div>
                            <h5 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[#1A1A18]">
                              <Users className="h-4 w-4 text-[rgba(26,26,24,.48)]" />
                              Personnel Assignment
                            </h5>
                            <div className="space-y-3">
                              {people.map(({ label, icon: Icon, name, id: personId }) => (
                                <div key={label} className="rounded-lg border border-[rgba(26,26,24,.09)] bg-[#FDFDFB] p-3">
                                  <div className="mb-1 flex items-center gap-2 text-[11px] font-medium text-[rgba(26,26,24,.48)]">
                                    <Icon className="h-3.5 w-3.5" />
                                    {label}
                                  </div>
                                  <p className="text-[13.5px] font-medium text-[#1A1A18]">
                                    {name || (personId ? `ID: ${personId}` : "--")}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Timing */}
                          <div>
                            <h5 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[#1A1A18]">
                              <Clock className="h-4 w-4 text-[rgba(26,26,24,.48)]" />
                              Schedule Timing
                            </h5>
                            {schedule.cron_setting?.cron_expression ? (
                              cronData ? (
                                <div className="grid grid-cols-2 gap-3">
                                  {timing.map((t) => (
                                    <div key={t.label} className="rounded-lg border border-[rgba(26,26,24,.09)] bg-[#FDFDFB] p-3">
                                      <div className="mb-1 text-[11px] font-medium text-[rgba(26,26,24,.48)]">{t.label}</div>
                                      <div className="text-[13.5px] font-medium text-[#1A1A18]">{t.value}</div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Badge variant="outline" className="text-xs">
                                    <AlertCircle className="mr-1 h-3 w-3" />
                                    Custom Schedule
                                  </Badge>
                                  <div className="overflow-x-auto rounded-lg border bg-[#F5F4F0] p-3 font-mono text-xs text-[#1A1A18]">
                                    {schedule.cron_setting.cron_expression}
                                  </div>
                                </div>
                              )
                            ) : (
                              <div className="rounded-lg border border-[rgba(26,26,24,.09)] bg-[#FDFDFB] py-6 text-center text-[rgba(26,26,24,.48)]">
                                <Clock className="mx-auto mb-2 h-6 w-6 opacity-50" />
                                <p className="text-[13px] font-medium">No schedule timing configured</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[rgba(26,26,24,.15)] bg-white py-12 text-center">
                  <Calendar className="mx-auto mb-4 h-12 w-12 text-[#d3d1c7]" />
                  <h3 className="mb-2 text-[14px] font-semibold text-[#1A1A18]">No Schedules Configured</h3>
                  <p className="mx-auto mb-6 max-w-md text-[13px] text-[rgba(26,26,24,.48)]">
                    No patrol schedules have been set up yet. Schedules define when and how often patrols should be conducted.
                  </p>
                  <Button
                    onClick={() => navigate(`/security/patrolling/edit/${id}`)}
                    className="min-h-[42px] rounded-lg !bg-[#1A1A18] px-[22px] text-[13px] font-semibold !text-white hover:!bg-[#12100E]"
                  >
                    <Plus className="mr-2 h-4 w-4" style={{ color: "#FFFFFF" }} />
                    <span style={{ color: "#FFFFFF" }}>Add Schedule</span>
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Checkpoints */}
          <TabsContent value="checkpoints" className="mt-4 space-y-4 p-0">
            <Card className="mb-4 overflow-hidden rounded-2xl border border-[rgba(26,26,24,.09)] bg-white shadow-none">
              <CardHeader className="mb-2 bg-white px-6 pt-5">
                <CardTitle className="text-lg flex items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F4F0]">
                    <MapPin className="h-[14px] w-[14px] text-[#1A1A18]" />
                  </div>
                  <span className="text-[14px] font-semibold text-[#1A1A18]">Checkpoints ({patrolling.checkpoints?.length || 0})</span>
                  {isReordering && (
                    <span className="ml-4 flex items-center gap-1 text-sm font-normal text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin text-[#C72030]" />
                      Saving order...
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative px-6 pb-6 pt-0">
                {selectedCheckpointIds.length > 0 && (
                  <LocationSelectionPanel
                    selectedLocations={selectedCheckpointIds}
                    selectedLocationObjects={selectedCheckpointObjects.map((cp) => ({
                      site_name: "",
                      building_name: cp.name,
                    }))}
                    onMoveAssets={() => {}}
                    onPrintQR={handlePrintCheckpointQR}
                    onDownload={() => {}}
                    onDispose={() => {}}
                    onClearSelection={handleClearCheckpointSelection}
                  />
                )}

                {/* Search bar + Filter button — above table */}
                <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {(checkpointSearch || activeCpFilterCount > 0) && (
                      <span className="text-xs text-gray-500">
                        {filteredSortedCheckpointData.length} of {checkpointTableData.length} results
                      </span>
                    )}
                    {/* Active filter tags */}
                    {activeCpFilterCount > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {cpFilters.buildingName && (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5 gap-1">
                            Tower: {cpFilters.buildingName}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => setCpFilters((prev) => ({ ...prev, buildingId: "", buildingName: "", floorId: "", floorName: "", roomId: "", roomName: "" }))} />
                          </Badge>
                        )}
                        {cpFilters.floorName && (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5 gap-1">
                            Floor: {cpFilters.floorName}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => setCpFilters((prev) => ({ ...prev, floorId: "", floorName: "", roomId: "", roomName: "" }))} />
                          </Badge>
                        )}
                        {cpFilters.roomName && (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5 gap-1">
                            Flat: {cpFilters.roomName}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => setCpFilters((prev) => ({ ...prev, roomId: "", roomName: "" }))} />
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllCpFilters}
                          className="text-xs text-[#C72030] hover:text-[#C72030] hover:bg-red-50 h-6 px-1.5"
                        >
                          Clear All
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <Input
                        placeholder="Search checkpoints..."
                        value={checkpointSearch}
                        onChange={(e) => setCheckpointSearch(e.target.value)}
                        className="pl-9 h-9 text-sm"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCpFilterOpen(true)}
                      className={`flex items-center gap-1.5 h-9 text-sm ${
                        activeCpFilterCount > 0
                          ? "border-[#C72030] text-[#C72030] bg-red-50 hover:bg-red-100"
                          : ""
                      }`}
                    >
                      <Filter className="w-4 h-4" />
                             {/* Filter */}
                      {/* {activeCpFilterCount > 0 && (
                        <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">
                          {activeCpFilterCount}
                        </Badge>
                      )} */}
                    </Button>
                  </div>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleCheckpointDragEnd}
                >
                  <SortableContext
                    items={paginatedCheckpointData.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="bg-white rounded-lg border border-[#D5DbDB] overflow-auto">
                      <Table className="w-full min-w-full table-fixed">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="bg-[#f6f4ee] w-10 min-w-10" />
                            <TableHead className="bg-[#f6f4ee] w-10 min-w-10 text-center">
                              <div className="flex justify-center">
                                <input
                                  type="checkbox"
                                  checked={
                                    paginatedCheckpointData.length > 0 &&
                                    paginatedCheckpointData.every((r) =>
                                      selectedCheckpointIds.includes(r.id)
                                    )
                                  }
                                  ref={(el) => {
                                    if (el) {
                                      const selected = paginatedCheckpointData.filter((r) =>
                                        selectedCheckpointIds.includes(r.id)
                                      ).length;
                                      el.indeterminate =
                                        selected > 0 && selected < paginatedCheckpointData.length;
                                    }
                                  }}
                                  onChange={(e) => handleSelectAllCheckpoints(e.target.checked)}
                                  aria-label="Select all checkpoints"
                                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                                />
                              </div>
                            </TableHead>
                            {/* Sortable column headers */}
                            {([
                              { key: "order_sequence", label: "Order", sortable: true, minW: "w-[7%] min-w-[72px]" },
                              { key: "name", label: "Name", sortable: true, minW: "w-[16%] min-w-[140px]" },
                              { key: "description", label: "Description", sortable: false, minW: "w-[22%] min-w-[180px]" },
                              { key: "building_name", label: "Tower", sortable: true, minW: "w-[12%] min-w-[120px]" },
                              { key: "floor_name", label: "Floor", sortable: false, minW: "w-[10%] min-w-[100px]" },
                              { key: "room_name", label: "Flat", sortable: false, minW: "w-[10%] min-w-[100px]" },
                              { key: "location_qr_code_url", label: "QR Code", sortable: false, minW: "w-[10%] min-w-[92px]" },
                              { key: "created_at", label: "Created On", sortable: true, minW: "w-[13%] min-w-[130px]" },
                            ] as { key: string; label: string; sortable: boolean; minW: string }[]).map((col) => (
                              <TableHead
                                key={col.key}
                                className={`bg-[#f6f4ee] text-black ${col.minW} ${col.sortable ? "cursor-pointer select-none" : ""}`}
                                onClick={col.sortable ? () => handleCheckpointSortToggle(col.key) : undefined}
                              >
                                <div className="flex items-center gap-1">
                                  {col.label}
                                  {col.sortable && (
                                    checkpointSort?.column === col.key ? (
                                      checkpointSort.direction === "asc" ? (
                                        <ChevronUp className="w-3.5 h-3.5 text-[#C72030]" />
                                      ) : (
                                        <ChevronDown className="w-3.5 h-3.5 text-[#C72030]" />
                                      )
                                    ) : (
                                      <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                                    )
                                  )}
                                </div>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedCheckpointData.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={12} className="text-center py-8 text-gray-500">
                                {checkpointSearch || activeCpFilterCount > 0
                                  ? `No checkpoints match the current filters`
                                  : "No checkpoints available"}
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedCheckpointData.map((item) => (
                              <SortableCheckpointRow
                                key={item.id}
                                item={item}
                                isSelected={selectedCheckpointIds.includes(item.id)}
                                onSelect={(checked) => handleCheckpointSelect(String(item.id), checked)}
                              >
                                <TableCell className="p-3 align-top">{renderCheckpointCell(item, "order_sequence")}</TableCell>
                                <TableCell className="p-3 align-top">{renderCheckpointCell(item, "name")}</TableCell>
                                <TableCell className="p-3 align-top text-sm text-gray-600 break-words">{renderCheckpointCell(item, "description")}</TableCell>
                                <TableCell className="p-3 align-top text-sm text-gray-600">{renderCheckpointCell(item, "building_name")}</TableCell>
                                <TableCell className="p-3 align-top text-sm text-gray-600">{renderCheckpointCell(item, "floor_name")}</TableCell>
                                <TableCell className="p-3 align-top text-sm text-gray-600">{renderCheckpointCell(item, "room_name")}</TableCell>
                                <TableCell className="p-3 align-top">{renderCheckpointCell(item, "qr_code_url")}</TableCell>
                                <TableCell className="p-3 align-top">{renderCheckpointCell(item, "created_at")}</TableCell>
                              </SortableCheckpointRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </SortableContext>
                </DndContext>

                {/* Pagination */}
                {filteredSortedCheckpointData.length > 0 && (
                  <TicketPagination
                    currentPage={cpPage}
                    totalPages={cpTotalPages}
                    totalRecords={filteredSortedCheckpointData.length}
                    perPage={cpPageSize}
                    isLoading={false}
                    onPageChange={(page) => setCpPage(page)}
                    onPerPageChange={() => {}}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Sessions */}
          <TabsContent value="recent-sessions" className="mt-4 space-y-4 p-0">
            <Card className="mb-4 overflow-hidden rounded-2xl border border-[rgba(26,26,24,.09)] bg-white p-6 shadow-none">
              <div className="mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F4F0]">
                    <Activity className="h-[14px] w-[14px] text-[#1A1A18]" />
                  </div>
                  <h3 className="text-[14px] font-semibold text-[#1A1A18]">Recent Sessions ({patrolling.recent_sessions?.length || 0})</h3>
                </div>
              </div>
              <div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Session Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Guard</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white">
                      {patrolling.recent_sessions &&
                      patrolling.recent_sessions.length > 0 ? (
                        patrolling.recent_sessions.map((session) => (
                          <TableRow key={session.id}>
                            <TableCell>
                              {formatDateTime(session.session_date)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  session.status === "completed"
                                    ? "default"
                                    : session.status === "in_progress"
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {session.status.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>{session.guard_name || "—"}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {session.checkpoints_completed}/
                                {session.total_checkpoints} checkpoints
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                  <div
                                    className="bg-[#C72030] h-2 rounded-full"
                                    style={{
                                      width: `${
                                        (session.checkpoints_completed /
                                          session.total_checkpoints) *
                                        100
                                      }%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center text-gray-600 py-8"
                          >
                            <div className="flex flex-col items-center">
                              <Activity className="w-12 h-12 text-gray-300 mb-2" />
                              <p>No recent sessions found.</p>
                              <p className="text-sm text-gray-500">
                                Sessions will appear here once patrolling
                                starts.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {id && (
        <DeletePatrollingModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          patrollingId={parseInt(id)}
        />
      )}

      {/* Checkpoint location filter dialog */}
      <CheckpointFilterDialog
        isOpen={isCpFilterOpen}
        onClose={() => setIsCpFilterOpen(false)}
        onApply={(filters) => setCpFilters(filters)}
        currentFilters={cpFilters}
      />
    </div>
  );
};
