import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Users,
  QrCode,
  Image as ImageIcon,
  Settings,
  Download,
  Mail,
  Eye,
  Loader2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";
import { toast } from "sonner";

// ─────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────
const participantColumns = [
  { key: "action", label: "Action" },
  { key: "full_name", label: "Requestor Name" },
  { key: "mobile", label: "Requestor Number" },
  { key: "email", label: "Requestor Mail" },
  { key: "organisation", label: "Organisation" },
  { key: "created_at", label: "Request Date" },
  { key: "status", label: "Status" },
];

const formatRequestDate = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
};

// ─────────────────────────────────────────────
// Shared participant table renderer
// ─────────────────────────────────────────────
const ParticipantTable = ({
  data,
  loading,
  selectable = false,
  selectedItems = [],
  onSelectAll,
  onSelectItem,
  onNavigate,
}: {
  data: any[];
  loading: boolean;
  selectable?: boolean;
  selectedItems?: string[];
  onSelectAll?: (checked: boolean) => void;
  onSelectItem?: (id: string, checked: boolean) => void;
  onNavigate: (id: number) => void;
}) => {
  const allSelected = data.length > 0 && selectedItems.length === data.length;

  const renderValue = (item: any, key: string) => {
    switch (key) {
      case "action":
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(item.id)}
            className="text-[#C72030] hover:bg-red-50"
          >
            <Eye className="w-4 h-4" />
          </Button>
        );
      case "full_name":
        return (
          `${item?.user?.firstname ?? ""} ${item?.user?.lastname ?? ""}`.trim() ||
          "-"
        );
      case "mobile":
        return item?.user?.mobile || "-";
      case "email":
        return item?.user?.email || "-";
      case "organisation":
        return item?.user?.organization?.name || "-";
      case "created_at":
        return formatRequestDate(item.created_at);
      case "status":
        return item.status
          ? item.status.charAt(0).toUpperCase() + item.status.slice(1)
          : "-";
      default:
        return item[key] || "-";
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow style={{ backgroundColor: "#E6E2D8" }}>
            {selectable && (
              <TableHead className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  className="accent-[#C72030] w-4 h-4 cursor-pointer"
                />
              </TableHead>
            )}
            {participantColumns.map((col) => (
              <TableHead
                key={col.key}
                className="font-semibold text-gray-900 py-3 px-4 border-r border-white last:border-r-0"
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={
                  selectable
                    ? participantColumns.length + 1
                    : participantColumns.length
                }
                className="text-center py-12"
              >
                <Loader2 className="w-7 h-7 animate-spin text-[#C72030] mx-auto" />
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={
                  selectable
                    ? participantColumns.length + 1
                    : participantColumns.length
                }
                className="text-center py-10 text-gray-500"
              >
                No records found
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={item.id} className="hover:bg-gray-50">
                {selectable && (
                  <TableCell className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(String(item.id))}
                      onChange={(e) =>
                        onSelectItem?.(String(item.id), e.target.checked)
                      }
                      className="accent-[#C72030] w-4 h-4 cursor-pointer"
                    />
                  </TableCell>
                )}
                {participantColumns.map((col) => (
                  <TableCell
                    key={col.key}
                    className="py-3 px-4 text-sm text-gray-800"
                  >
                    {renderValue(item, col.key)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

// ─────────────────────────────────────────────
// Waiting List sub-tab
// ─────────────────────────────────────────────
const WaitingListTab = ({ eventId }: { eventId: string }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const baseUrl = localStorage.getItem("baseUrl");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `https://${baseUrl}/pms/admin/events/${eventId}/registered_users.json`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setData(res.data?.registered_users || res.data || []);
      } catch {
        toast.error("Failed to load waiting list");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [eventId]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-[#F6F4EE] p-4 flex items-center gap-3 border-b border-gray-200">
        <div className="w-8 h-8 rounded-full bg-[#E5E0D3] flex items-center justify-center text-[#C72030]">
          <FileText size={16} />
        </div>
        <span className="font-semibold text-lg text-gray-800">
          Requestor Details
        </span>
      </div>
      <ParticipantTable
        data={data}
        loading={loading}
        onNavigate={(id) => navigate(`users/${id}`)}
      />
    </div>
  );
};

// ─────────────────────────────────────────────
// Approved sub-tab
// ─────────────────────────────────────────────
const ApprovedTab = ({ eventId }: { eventId: string }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const baseUrl = localStorage.getItem("baseUrl");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `https://${baseUrl}/pms/admin/events/${eventId}/registered_users.json?q[status_eq]=approved`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setData(res.data?.registered_users || res.data || []);
      } catch {
        toast.error("Failed to load approved list");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [eventId]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-[#F6F4EE] p-4 flex items-center gap-3 border-b border-gray-200">
        <div className="w-8 h-8 rounded-full bg-[#E5E0D3] flex items-center justify-center text-[#C72030]">
          <FileText size={16} />
        </div>
        <span className="font-semibold text-lg text-gray-800">
          Requestor Details
        </span>
      </div>
      <ParticipantTable
        data={data}
        loading={loading}
        onNavigate={(id) => navigate(`users/${id}`)}
      />
    </div>
  );
};

// ─────────────────────────────────────────────
// Pending sub-tab (with approve / deny)
// ─────────────────────────────────────────────
const PendingTab = ({
  eventId,
  eventCapacity,
  totalRegistered,
}: {
  eventId: string;
  eventCapacity: number;
  totalRegistered: number;
}) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const baseUrl = localStorage.getItem("baseUrl");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `https://${baseUrl}/pms/admin/events/${eventId}/registered_users.json?q[status_eq]=pending`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(res.data?.registered_users || res.data || []);
      setSelectedItems([]);
    } catch {
      toast.error("Failed to load pending list");
    } finally {
      setLoading(false);
    }
  }, [eventId, baseUrl, token]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleStatusUpdate = async (status: "approved" | "rejected") => {
    if (selectedItems.length === 0) return;
    setIsUpdating(true);
    try {
      await axios.get(
        `https://${baseUrl}/pms/admin/events/${eventId}/update_approval_status.json`,
        {
          params: {
            "event_user_ids[]": selectedItems,
            status,
          },
          headers: { Authorization: `Bearer ${token}` },
          paramsSerializer: { indexes: null },
        }
      );
      toast.success(
        `Selected users have been ${status === "approved" ? "approved" : "denied"} successfully.`
      );
      fetchPending();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error ||
          `Failed to ${status === "approved" ? "approve" : "deny"} users.`
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const atCapacity = totalRegistered >= eventCapacity && eventCapacity > 0;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-[#F6F4EE] p-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#E5E0D3] flex items-center justify-center text-[#C72030]">
            <FileText size={16} />
          </div>
          <span className="font-semibold text-lg text-gray-800">
            Requestor Details
          </span>
        </div>
        {data.length > 0 && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-[#C72030] text-[#C72030] hover:bg-[#C72030] hover:text-white px-6 h-9 disabled:opacity-50"
              onClick={() => handleStatusUpdate("rejected")}
              disabled={selectedItems.length === 0 || isUpdating || atCapacity}
            >
              {isUpdating && (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              )}
              Deny
            </Button>
            <Button
              className="bg-[#00A651] hover:bg-[#008C44] text-white px-6 h-9 disabled:opacity-50"
              onClick={() => handleStatusUpdate("approved")}
              disabled={selectedItems.length === 0 || isUpdating || atCapacity}
            >
              {isUpdating && (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              )}
              Approve
            </Button>
          </div>
        )}
      </div>
      <ParticipantTable
        data={data}
        loading={loading}
        selectable={true}
        selectedItems={selectedItems}
        onSelectAll={(checked) =>
          setSelectedItems(checked ? data.map((d) => String(d.id)) : [])
        }
        onSelectItem={(id, checked) =>
          setSelectedItems((prev) =>
            checked ? [...prev, id] : prev.filter((i) => i !== id)
          )
        }
        onNavigate={(id) => navigate(`users/${id}`)}
      />
    </div>
  );
};

// ─────────────────────────────────────────────
// Participants Details tab wrapper
// ─────────────────────────────────────────────
const ParticipantsDetailsTab = ({
  eventId,
  eventCapacity,
  totalRegistered,
}: {
  eventId: string;
  eventCapacity: number;
  totalRegistered: number;
}) => {
  const [activeParticipantTab, setActiveParticipantTab] =
    useState("waitingList");

  return (
    <div className="space-y-4">
      {/* Sub-tabs bar */}
      <Tabs
        value={activeParticipantTab}
        onValueChange={setActiveParticipantTab}
        className="w-full"
      >
        <TabsList className="w-full grid grid-cols-3 bg-white border border-gray-200 rounded-none h-10 p-0">
          {[
            { value: "waitingList", label: "Waiting List" },
            { value: "approved", label: "Approved" },
            { value: "pending", label: "Pending" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="h-full rounded-none border-r border-gray-200 last:border-r-0 font-medium text-sm
                data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030]
                data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="waitingList" className="mt-4">
          <WaitingListTab eventId={eventId} />
        </TabsContent>
        <TabsContent value="approved" className="mt-4">
          <ApprovedTab eventId={eventId} />
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          <PendingTab
            eventId={eventId}
            eventCapacity={eventCapacity}
            totalRegistered={totalRegistered}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main page component
// ─────────────────────────────────────────────
const LoyaltyEventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // QR Code mock data
  const [qrCodeData] = useState([
    {
      id: 1,
      srNo: 1,
      cpName: "Kshitij Rasal",
      companyName: "ABD Tech",
      emailId: "kshitij.r@demomail.com",
      qrCodeId: "QR-EVT-1767003965366-cp2-176700403055",
    },
    {
      id: 2,
      srNo: 2,
      cpName: "Sohail Ansari",
      companyName: "XYZ Ltd",
      emailId: "sohail.a@demomail.com",
      qrCodeId: "QR-EVT-1767003965366-cp3-176700403056",
    },
    {
      id: 3,
      srNo: 3,
      cpName: "Hamza Quazi",
      companyName: "XYZ Ltd",
      emailId: "hamza.q@demomail.com",
      qrCodeId: "QR-EVT-1767003965366-cp4-176700403057",
    },
    {
      id: 4,
      srNo: 4,
      cpName: "Shahab Mirza",
      companyName: "XYZ Ltd",
      emailId: "shahab.m@demomail.com",
      qrCodeId: "QR-EVT-1767003965366-cp4-176700403058",
    },
  ]);

  const eventId = id as string;

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${API_CONFIG.BASE_URL}/crm/admin/events/${eventId}.json`,
          {
            headers: {
              Authorization: getAuthHeader(),
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setEventData(response.data);
        setError(null);
      } catch {
        setError("Failed to load event details");
        toast.error("Failed to load event details");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) fetchEventData();
  }, [eventId]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (isoString: string) => {
    if (!isoString) return "—";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "—";
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "—";
    }
  };

  const handleDownloadQRCode = (qrCodeId: string, cpName: string) =>
    toast.success(`Downloading QR Code for ${cpName}`);
  const handleSendQRCodeEmail = (email: string, cpName: string) =>
    toast.success(`Sending QR Code to ${email}`);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-[#C72030]" />
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">{error || "Event not found"}</div>
      </div>
    );
  }

  const tabs = [
    { label: "Event Details", value: "event-details" },
    { label: "Events Related Images", value: "images" },
    // { label: "Participants Details", value: "participants-details" },
  ];

  return (
    <div className="p-6">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Event List
        </button>
      </div>

      <div
        className="rounded-lg border-r border-b border-gray-200 shadow-sm"
        style={{
          borderTop: "none",
          borderLeft: "none",
          backgroundColor: "rgba(250, 250, 250, 1)",
        }}
      >
        <style>{`
          .top-level-tabs button[data-state="active"] {
            background-color: rgba(237, 234, 227, 1) !important;
            color: rgba(199, 32, 48, 1) !important;
          }
        `}</style>

        <Tabs defaultValue="event-details" className="w-full">
          {/* Top-level tab bar */}
          <TabsList
            className="top-level-tabs w-full flex flex-nowrap rounded-t-lg p-0 overflow-x-auto"
            style={{
              gap: 0,
              padding: 0,
              backgroundColor: "rgba(246, 247, 247, 1)",
              height: "50px",
              marginBottom: "0",
            }}
          >
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030]"
                style={{
                  width: "230px",
                  paddingTop: "10px",
                  paddingRight: "20px",
                  paddingBottom: "10px",
                  paddingLeft: "20px",
                  borderRadius: "0",
                  border: "none",
                  margin: "0",
                  fontFamily: "Work Sans",
                  fontWeight: 500,
                  fontSize: "14px",
                  lineHeight: "100%",
                  color: "rgba(26, 26, 26, 1)",
                  backgroundColor: "rgba(246, 247, 247, 1)",
                }}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Event Details ── */}
          <TabsContent
            value="event-details"
            className="p-6 space-y-6"
            style={{ backgroundColor: "rgba(250, 249, 247, 1)" }}
          >
            {/* Event Details Card */}
            <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 bg-[#F6F4EE] py-3 px-4 border-b border-[#D9D9D9]">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E5E0D3]">
                  <FileText className="w-5 h-5 text-[#C72030]" />
                </div>
                <h3 className="text-lg font-semibold text-black">
                  Event Details
                </h3>
              </div>
              <div className="bg-[#FBFBFA] px-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                  <div className="flex items-start gap-2">
                    <p className="text-sm text-gray-500 min-w-[140px]">
                      Event Name
                    </p>
                    <p className="text-base font-medium text-gray-900">
                      {eventData?.event_name || "N/A"}
                    </p>
                  </div>
                  {/* <div className="flex items-start gap-2">
                    <p className="text-sm text-gray-500 min-w-[140px]">
                      Event Shared
                    </p>
                    <p className="text-base font-medium text-gray-900">
                      {eventData?.shared === "0" || eventData?.shared === 0
                        ? "All"
                        : "Individual"}
                    </p>
                  </div> */}
                    <div className="flex items-start gap-2">
                    <p className="text-sm text-gray-500 min-w-[140px]">
                      Event Venue
                    </p>
                    <p className="text-base font-medium text-gray-900">
                      {eventData?.event_at || "-"}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <p className="text-sm text-gray-500 min-w-[140px]">
                      Event Description
                    </p>
                    <p className="text-base font-medium text-gray-900 flex-1 break-words">
                      {eventData?.description || "-"}
                    </p>
                  </div>               
                  <div className="flex items-start gap-2">
                    <p className="text-sm text-gray-500 min-w-[140px]">
                      Start Date
                    </p>
                    <p className="text-base font-medium text-gray-900">
                      {eventData?.from_time
                        ? formatDate(eventData.from_time)
                        : "N/A"}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <p className="text-sm text-gray-500 min-w-[140px]">
                      Start Time
                    </p>
                    <p className="text-base font-medium text-gray-900">
                      {eventData?.from_time
                        ? `${formatTime(eventData.from_time)}`
                        : "N/A"}
                    </p>
                  </div>
                   <div className="flex items-start gap-2">
                    <p className="text-sm text-gray-500 min-w-[140px]">
                      End Date
                    </p>
                    <p className="text-base font-medium text-gray-900">
                      {eventData?.to_time
                        ? formatDate(eventData.to_time)
                        : "N/A"}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <p className="text-sm text-gray-500 min-w-[140px]">
                      End Time
                    </p>
                    <p className="text-base font-medium text-gray-900">
                      {eventData?.to_time
                        ? `${formatTime(eventData.to_time)}`
                        : "N/A"}
                    </p>
                  </div>
                    <div className="flex items-start gap-2">
                    <p className="text-sm text-gray-500 min-w-[140px]">
                      Send Email
                    </p>
                    <p className="text-base font-medium text-gray-900">
                      {eventData?.email_trigger_enabled === "1" ||
                      eventData?.email_trigger_enabled === 1 ||
                      eventData?.email_trigger_enabled === true
                        ? "Yes"
                        : "No"}
                    </p>
                  </div>
                   <div className="flex items-start gap-2">
                    <p className="text-sm text-gray-500 min-w-[140px]">
                      RSVP Action
                    </p>
                    <p className="text-base font-medium text-gray-900">
                      {eventData?.rsvp_action === "1" ||
                      eventData?.rsvp_action === 1 ||
                      eventData?.rsvp_action_int === 1
                        ? "Yes"
                        : "No"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visibility Card */}
            <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 bg-[#F6F4EE] py-3 px-4 border-b border-[#D9D9D9]">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E5E0D3]">
                  <Settings className="w-5 h-5 text-[#C72030]" />
                </div>
                <h3 className="text-lg font-semibold text-black">Visibility</h3>
              </div>
              <div className="bg-[#FBFBFA] px-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
                  <div className="flex items-start gap-2">
                    <p className="text-sm text-gray-500 min-w-[140px]">
                      Show on Home Page
                    </p>
                    <p className="text-base font-medium text-gray-900">
                      {eventData?.show_on_home_page === "1" ||
                      eventData?.show_on_home === 1 ||
                      eventData?.show_on_home === true
                        ? "Yes"
                        : "No"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Events Related Images ── */}
          <TabsContent
            value="images"
            className="p-6 space-y-6"
            style={{ backgroundColor: "rgba(250, 249, 247, 1)" }}
          >
            <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 bg-[#F6F4EE] py-3 px-4 border-b border-[#D9D9D9]">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E5E0D3]">
                  <ImageIcon className="w-6 h-6 text-[#C72030]" />
                </div>
                <h3 className="text-lg font-semibold text-black">
                  Event Related Images
                </h3>
              </div>
              <div className="bg-[#FBFBFA] px-6 py-6 space-y-6">
                {/* Cover Images */}
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-3">
                    Cover Images
                  </h4>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow style={{ backgroundColor: "#E6E2D8" }}>
                          <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">
                            File Name
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">
                            File Type
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">
                            Updated At
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3 px-4">
                            Image
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="bg-white">
                        {(() => {
                          const coverGroups = [
                            eventData.cover_image_1_by_1,
                            eventData.cover_image_9_by_16,
                            eventData.cover_image_3_by_2,
                            eventData.cover_image_16_by_9,
                          ];
                          const images = coverGroups
                            .map((g) =>
                              Array.isArray(g)
                                ? g
                                : g && typeof g === "object"
                                  ? [g]
                                  : []
                            )
                            .flat()
                            .filter((img) => img?.document_url);
                          return images.length > 0 ? (
                            images.map((file, i) => (
                              <TableRow key={i} className="hover:bg-gray-50">
                                <TableCell className="py-3 px-4">
                                  {file.document_file_name}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  {file.document_content_type}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  {formatDateTime(file.document_updated_at)}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  <img
                                    src={file.document_url}
                                    alt={`Cover ${i}`}
                                    className="w-20 h-20 object-cover rounded"
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                className="text-center py-8 text-gray-600"
                              >
                                No Cover Images
                              </TableCell>
                            </TableRow>
                          );
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Event Gallery */}
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-3">
                    Event Gallery
                  </h4>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow style={{ backgroundColor: "#E6E2D8" }}>
                          <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">
                            File Name
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">
                            File Type
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">
                            Updated At
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3 px-4">
                            Image
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="bg-white">
                        {(() => {
                          const groups = [
                            eventData.event_images_1_by_1,
                            eventData.event_images_9_by_16,
                            eventData.event_images_3_by_2,
                            eventData.event_images_16_by_9,
                          ];
                          const images = groups
                            .filter(Array.isArray)
                            .flat()
                            .filter((img) => img?.document_url);
                          return images.length > 0 ? (
                            images.map((file, i) => (
                              <TableRow key={i} className="hover:bg-gray-50">
                                <TableCell className="py-3 px-4">
                                  {file.document_file_name}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  {file.document_content_type}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  {formatDateTime(file.document_updated_at)}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  <img
                                    src={file.document_url}
                                    alt={`Event ${i}`}
                                    className="w-20 h-20 object-cover rounded"
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                className="text-center py-8 text-gray-600"
                              >
                                No Event Images
                              </TableCell>
                            </TableRow>
                          );
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Participants Details ── */}
          <TabsContent
            value="participants-details"
            className="p-6 space-y-4"
            style={{ backgroundColor: "rgba(250, 249, 247, 1)" }}
          >
            <ParticipantsDetailsTab
              eventId={eventId}
              eventCapacity={Number(eventData?.capacity ?? 0)}
              totalRegistered={Number(eventData?.total_registed_count ?? 0)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LoyaltyEventDetails;
