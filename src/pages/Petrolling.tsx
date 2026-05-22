import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Edit, QrCode as QrIcon, Printer } from "lucide-react";
import { API_CONFIG, getFullUrl, getAuthHeader } from "@/config/apiConfig";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
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
  active: boolean;
  qr_code: {
    url: string;
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
}

interface PatrollingLog {
  id: number;
  comment: string;
  created_at: string;
  attachments: { id: number; url: string }[];
  created_by_id?: number;
}

const Petrolling = () => {
  const navigate = useNavigate();
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
    selectedHours: [] as string[],
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

  const fetchPatrollingData = async (page = 1) => {
    setLoading(true);
    try {
      const apiUrl = getFullUrl(`/crm/admin/patrolling_details.json?page=${page}`);
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
      if (result.patrolling_details) {
        setData(result.patrolling_details);
        setTotal(result.total || result.patrolling_details.length);
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

  const fetchPatrollingLogs = async (patrolId: number) => {
    setLogsLoading(true);
    try {
      const apiUrl = getFullUrl(`/crm/admin/patrolling_details/${patrolId}.json`);
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
      if (result.patrolling_histories) {
        setLogs(result.patrolling_histories);
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

  const formatHour = (hour: number | undefined) => {
    if (hour === undefined) return "12:00 AM";
    let h = hour % 12;
    if (h === 0) h = 12;
    const modifier = hour >= 12 ? "PM" : "AM";
    return `${h.toString().padStart(2, "0")}:00 ${modifier}`;
  };

  const handleEdit = async (item: PatrollingItem) => {
    setSelectedPatrol(item);
    setLoading(true);
    try {
      const apiUrl = getFullUrl(`/crm/admin/patrolling_details/${item.id}.json`);
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
      const detail = result.patrolling_detail;

      setFormData({
        area: detail.area || "",
        frequencyStart: formatHour(detail.frequency_start),
        frequencyEnd: formatHour(detail.frequency_end),
        occurrenceType: detail.occurrence_type === 1 ? "specific" : "every",
        everyHours: detail.occurrence_type === 2 ? (detail.occurrences?.[0] || "") : "",
        selectedHours: detail.occurrence_type === 1 ? (detail.occurrences || []) : [],
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
      const apiUrl = getFullUrl(`/crm/admin/patrolling_details/${item.id}.json`);
      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": getAuthHeader(),
        },
        body: JSON.stringify({
          ...item,
          active: !item.active,
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
    if (!formData.area) {
      toast.error("Please enter an area name");
      return;
    }
    setLoading(true);
    try {
      const apiUrl = isEdit 
        ? getFullUrl(`/crm/admin/patrolling_details/${selectedPatrol?.id}.json`)
        : getFullUrl(`/crm/admin/patrolling_details.json`);
      
      const parseHour = (timeStr: string) => {
        const [time, modifier] = timeStr.split(" ");
        let [hours] = time.split(":").map(Number);
        if (modifier === "PM" && hours < 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;
        return hours;
      };

      const payload = {
        area: formData.area,
        frequency_start: parseHour(formData.frequencyStart),
        frequency_end: parseHour(formData.frequencyEnd),
        occurrence_type: formData.occurrenceType === "specific" ? 1 : 2,
        occurrences: formData.occurrenceType === "specific" ? formData.selectedHours : [formData.everyHours],
        resource_id: selectedPatrol?.resource_id || 3919, 
        resource_type: selectedPatrol?.resource_type || "Society",
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

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      toast.success(isEdit ? "Patrolling area updated successfully!" : "Patrolling area added successfully!");
      setIsAddOpen(false);
      setIsEditOpen(false);
      setFormData({
        area: "",
        frequencyStart: "12:00 AM",
        frequencyEnd: "11:00 PM",
        occurrenceType: "specific",
        everyHours: "",
        selectedHours: [],
      });
      fetchPatrollingData();
    } catch (error: any) {
      console.error("Error saving patrolling area:", error);
      toast.error("Failed to save patrolling area");
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
            {item.qr_code?.url ? (
              <div 
                className="bg-white p-1 rounded border border-gray-200 cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => {
                  setSelectedPatrol(item);
                  setIsQrOpen(true);
                }}
              >
                 <img 
                   src={`${API_CONFIG.BASE_URL}${item.qr_code.url}`} 
                   alt="QR Code" 
                   className="w-10 h-10 object-contain"
                   onError={(e) => {
                     (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=QR';
                   }}
                 />
              </div>
            ) : (
              <div className="bg-gray-100 p-2 rounded border border-gray-200">
                <span className="text-xs text-gray-400">No QR</span>
              </div>
            )}
          </div>
        );
      default:
        return (item as any)[columnKey] || "N/A";
    }
  };

  const renderLogCell = (log: PatrollingLog, columnKey: string) => {
    const date = new Date(log.created_at);
    switch (columnKey) {
      case "patrolling_date":
        return date.toLocaleDateString("en-GB");
      case "patrolling_time":
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case "comments":
        return log.comment || "N/A";
      case "submitted_by":
        return `User ${log.created_by_id}`;
      case "attachments":
        return (
          <div className="flex gap-1">
            {log.attachments?.map((att, idx) => {
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
            })}
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
    const apiUrl = getFullUrl(`/crm/admin/patrolling_details/download_qr_codes.json`);
    window.open(`${apiUrl}&token=${API_CONFIG.TOKEN || ''}`, '_blank');
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
              setFormData({
                area: "",
                frequencyStart: "12:00 AM",
                frequencyEnd: "11:00 PM",
                occurrenceType: "specific",
                everyHours: "",
                selectedHours: [],
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
        onGlobalSearch={(term) => console.log("Searching for:", term)}
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
                   src={`${API_CONFIG.BASE_URL}${selectedPatrol.qr_code.url}`} 
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
