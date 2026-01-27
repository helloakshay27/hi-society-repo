import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Users, QrCode, Image as ImageIcon, Calendar, Settings, Download, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";
import { toast } from "sonner";

const EventCommunicationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // QR Code mock data
  const [qrCodeData] = useState([
    {
      id: 1,
      srNo: 1,
      cpName: "Kshitij Rasal",
      companyName: "ABD Tech",
      emailId: "kshitij.r@demomail.com",
      qrCodeId: "QR-EVT-1767003965366-cp2-176700403055"
    },
    {
      id: 2,
      srNo: 2,
      cpName: "Sohail Ansari",
      companyName: "XYZ Ltd",
      emailId: "sohail.a@demomail.com",
      qrCodeId: "QR-EVT-1767003965366-cp3-176700403056"
    },
    {
      id: 3,
      srNo: 3,
      cpName: "Hamza Quazi",
      companyName: "XYZ Ltd",
      emailId: "hamza.q@demomail.com",
      qrCodeId: "QR-EVT-1767003965366-cp4-176700403056"
    },
    {
      id: 4,
      srNo: 4,
      cpName: "Shahab Mirza",
      companyName: "XYZ Ltd",
      emailId: "shahab.m@demomail.com",
      qrCodeId: "QR-EVT-1767003965366-cp4-176700403056"
    }
  ]);

  const eventId = id;

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_CONFIG.BASE_URL}/crm/admin/events/${eventId}.json`, {
          headers: {
                               Authorization: getAuthHeader(),
                               "Content-Type": "multipart/form-data",
                             },
        });
        console.log("Event Data:", response.data);
        setEventData(response.data);
        setError(null);
      } catch (error) {
        console.error("Error fetching event data:", error);
        setError("Failed to load event details");
        toast.error("Failed to load event details");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (isoString) => {
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
    } catch (error) {
      return "—";
    }
  };

  // QR Code handlers
  const handleDownloadQRCode = (qrCodeId, cpName) => {
    toast.success(`Downloading QR Code for ${cpName}`);
    console.log('Download QR Code:', qrCodeId);
  };

  const handleSendQRCodeEmail = (email, cpName) => {
    toast.success(`Sending QR Code to ${email}`);
    console.log('Send QR Code to:', email);
  };

  const handleDownloadAllQRCodes = () => {
    toast.success('Downloading all QR Codes');
    console.log('Download All QR Codes');
  };

  const handleSendAllQRCodesEmail = () => {
    toast.success('Sending QR Codes to all channel partners');
    console.log('Send All QR Codes via Email');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading event details...</div>
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Event List
        </button>
        <div className="flex items-center justify-between">
          {/* <h1 className="text-2xl font-bold text-[#1a1a1a]">Event Details</h1> */}
        </div>
      </div>

      <div className="rounded-lg border-r border-b border-gray-200 shadow-sm" style={{ borderTop: 'none', borderLeft: 'none', backgroundColor: 'rgba(250, 250, 250, 1)' }}>
        <style>{`
          .top-level-tabs button[data-state="active"] {
            background-color: rgba(237, 234, 227, 1) !important;
            color: rgba(199, 32, 48, 1) !important;
          }
        `}</style>
        <Tabs defaultValue="event-details" className="w-full">
          <TabsList className="top-level-tabs w-full flex flex-nowrap rounded-t-lg p-0 overflow-x-auto mb-4" style={{ gap: '0', padding: '0', backgroundColor: 'rgba(246, 247, 247, 1)', height: '50px', marginBottom: '16px' }}>
            {[
              { label: 'Event Details', value: 'event-details' },
              { label: 'Events Related Images', value: 'images' },
              { label: 'Invited CPs', value: 'invited-cps' },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030]"
                style={{
                  width: '230px',
                  // height: '36px',
                  paddingTop: '10px',
                  paddingRight: '20px',
                  paddingBottom: '10px',
                  paddingLeft: '20px',
                  borderRadius: '0',
                  border: 'none',
                  margin: '0',
                  fontFamily: 'Work Sans',
                  fontWeight: 500,
                  fontSize: '14px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: 'rgba(26, 26, 26, 1)',
                  backgroundColor: 'rgba(246, 247, 247, 1)'
                }}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Event Details Tab */}
          <TabsContent value="event-details" className="p-6 space-y-6" style={{ backgroundColor: 'rgba(250, 249, 247, 1)' }}>
            {/* Event Details Card */}
            <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between gap-3 bg-[#F6F4EE] py-3 px-4 border-b border-[#D9D9D9]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E5E0D3]">
                    <FileText className="w-5 h-5 text-[#C72030]" />
                  </div>
                  <h3 className="text-lg font-semibold text-black">
                    Event Details
                  </h3>
                </div>
              </div>              {/* Body */}
              <div className="bg-[#FBFBFA] border-t-0 px-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                  <div className="flex items-start gap-2">
                    <p className="text-sm text-gray-500 min-w-[140px]">Event Name</p>
                    <p className="text-base font-medium text-gray-900">
                      {eventData?.event_name || "N/A"}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <p className="text-sm text-gray-500 min-w-[140px]">Event Shared</p>
                    <p className="text-base font-medium text-gray-900">
                      {eventData?.shared === "0" || eventData?.shared === 0 ? "All" : "Individual"}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <p className="text-sm text-gray-500 min-w-[140px]">Event Description</p>
                    <p className="text-base font-medium text-gray-900 flex-1 break-words">
                      {eventData?.description || "-"}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <p className="text-sm text-gray-500 min-w-[140px]">Event At</p>
                    <p className="text-base font-medium text-gray-900">
                      {eventData?.event_at || "Sion"}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <p className="text-sm text-gray-500 min-w-[140px]">Send Email</p>
                    <p className="text-base font-medium text-gray-900">
                      {eventData?.email_trigger_enabled === "1" || eventData?.email_trigger_enabled === 1 || eventData?.email_trigger_enabled === true ? "Yes" : "Yes"}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <p className="text-sm text-gray-500 min-w-[140px]">Event Date</p>
                    <p className="text-base font-medium text-gray-900">
                      {eventData?.from_time ? formatDate(eventData.from_time) : "N/A"}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <p className="text-sm text-gray-500 min-w-[140px]">Event Time</p>
                    <p className="text-base font-medium text-gray-900">
                      {eventData?.from_time 
                        ? `${formatTime(eventData.from_time)}${eventData?.to_time ? ` - ${formatTime(eventData.to_time)}` : ''}`
                        : "N/A"}
                    </p>
                  </div>

                  <div className="lg:col-span-3 flex items-start gap-2">
                    <p className="text-sm text-gray-500 min-w-[140px]">RSVP Action</p>
                    <p className="text-base font-medium text-gray-900">
                      {eventData?.rsvp_action === "yes" || eventData?.rsvp_action_int === 1 ? "Yes" : "Yes"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visibility Card */}
            <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between gap-3 bg-[#F6F4EE] py-3 px-4 border-b border-[#D9D9D9]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E5E0D3]">
                    <Settings className="w-5 h-5 text-[#C72030]" />
                  </div>
                  <h3 className="text-lg font-semibold text-black">
                    Visibility
                  </h3>
                </div>
              </div>

              {/* Body */}
              <div className="bg-[#FBFBFA] border-t-0 px-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
                  <div className="flex items-start gap-2">
                    <p className="text-sm text-gray-500 min-w-[140px]">Show on Home Page</p>
                    <p className="text-base font-medium text-gray-900">
                      {eventData?.show_on_home_page === "1" || eventData?.show_on_home === 1 || eventData?.show_on_home === true ? "Yes" : "Yes"}
                    </p>
                  </div>

                  {/* <div className="flex items-start gap-2">
                    <p className="text-sm text-gray-500 min-w-[180px]">Show on Project Detail Page</p>
                    <p className="text-base font-medium text-gray-900">
                      {eventData?.show_on_project_detail_page === "1" || eventData?.show_on_project_detail_page === 1 || eventData?.show_on_project_detail_page === true ? "Yes" : "Yes"}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <p className="text-sm text-gray-500 min-w-[140px]">Show on Booking Page</p>
                    <p className="text-base font-medium text-gray-900">
                      {eventData?.show_on_booking_page === "1" || eventData?.show_on_booking_page === 1 || eventData?.show_on_booking_page === true ? "Yes" : "No"}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <p className="text-sm text-gray-500 min-w-[140px]">Featured Event</p>
                    <p className="text-base font-medium text-gray-900">
                      {eventData?.featured_event === "1" || eventData?.featured_event === 1 || eventData?.featured_event === true ? "Yes" : "Yes"}
                    </p>
                  </div> */}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Invited CPs Tab */}
          <TabsContent value="invited-cps" className="p-6 space-y-6" style={{ backgroundColor: 'rgba(250, 249, 247, 1)' }}>
            <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between gap-3 bg-[#F6F4EE] py-3 px-4 border-b border-[#D9D9D9]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E5E0D3]">
                    <Users className="w-6 h-6 text-[#C72030]" />
                  </div>
                  <h3 className="text-lg font-semibold text-black">
                    Invited CPs
                  </h3>
                </div>
              </div>
              <div className="bg-[#FBFBFA] border-t-0 px-6 py-6">
                <p className="text-gray-600">Invited CPs content will be displayed here.</p>
              </div>
            </div>
          </TabsContent>

          {/* QR Code Tab */}
          <TabsContent value="qr-code" className="p-0">
            <div className="rounded-lg shadow-sm border border-gray-200" style={{ backgroundColor: 'rgba(250, 250, 250, 1)' }}>
              <Tabs defaultValue="qr-code-sub" className="w-full">
                <TabsList className="w-full flex flex-wrap bg-gray-50 rounded-t-lg h-[36px] p-0 text-sm justify-stretch border-b border-gray-200">
                  <TabsTrigger
                    value="analytics"
                    className="flex-1 min-w-0 bg-white data-[state=active]:bg-[#EDEAE3] px-3 py-0 h-[36px] flex items-center gap-2 text-gray-700 data-[state=active]:text-[#C72030] data-[state=active]:border-0 [&_svg]:text-gray-700 data-[state=active]:[&_svg]:text-[#C72030]"
                    style={{ border: '1px solid rgba(217, 217, 217, 1)', borderRight: '1px solid rgba(209, 209, 209, 1)' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <mask id="mask0_9547_3931" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="18" height="18">
                        <rect width="18" height="18" fill="#D9D9D9" />
                      </mask>
                      <g mask="url(#mask0_9547_3931)">
                        <path d="M8.66681 13.1106C7.59669 13.0192 6.69719 12.5831 5.96831 11.8024C5.23944 11.0216 4.875 10.0875 4.875 9C4.875 7.85413 5.27606 6.88019 6.07819 6.07819C6.88019 5.27606 7.85413 4.875 9 4.875C10.0875 4.875 11.0216 5.23825 11.8024 5.96475C12.5831 6.69112 13.0192 7.58944 13.1106 8.65969L11.9179 8.30625C11.7557 7.63125 11.4066 7.07812 10.8703 6.64688C10.3342 6.21563 9.71075 6 9 6C8.175 6 7.46875 6.29375 6.88125 6.88125C6.29375 7.46875 6 8.175 6 9C6 9.7125 6.21681 10.3375 6.65044 10.875C7.08406 11.4125 7.636 11.7625 8.30625 11.925L8.66681 13.1106ZM9.56681 16.0946C9.47231 16.1149 9.37788 16.125 9.2835 16.125H9C8.01438 16.125 7.08812 15.938 6.22125 15.564C5.35437 15.19 4.60031 14.6824 3.95906 14.0413C3.31781 13.4002 2.81019 12.6463 2.43619 11.7795C2.06206 10.9128 1.875 9.98669 1.875 9.00131C1.875 8.01581 2.062 7.0895 2.436 6.22237C2.81 5.35525 3.31756 4.601 3.95869 3.95962C4.59981 3.31825 5.35375 2.81044 6.2205 2.43619C7.08725 2.06206 8.01331 1.875 8.99869 1.875C9.98419 1.875 10.9105 2.06206 11.7776 2.43619C12.6448 2.81019 13.399 3.31781 14.0404 3.95906C14.6818 4.60031 15.1896 5.35437 15.5638 6.22125C15.9379 7.08812 16.125 8.01438 16.125 9V9.27975C16.125 9.373 16.1149 9.46631 16.0946 9.55969L15 9.225V9C15 7.325 14.4187 5.90625 13.2563 4.74375C12.0938 3.58125 10.675 3 9 3C7.325 3 5.90625 3.58125 4.74375 4.74375C3.58125 5.90625 3 7.325 3 9C3 10.675 3.58125 12.0938 4.74375 13.2563C5.90625 14.4187 7.325 15 9 15H9.225L9.56681 16.0946ZM15.1052 16.2332L11.7043 12.825L10.8894 15.2884L9 9L15.2884 10.8894L12.825 11.7043L16.2332 15.1052L15.1052 16.2332Z" fill="#C72030"/>
                      </g>
                    </svg>
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger
                    value="qr-code-sub"
                    className="flex-1 min-w-0 bg-white data-[state=active]:bg-[#EDEAE3] px-3 py-0 h-[36px] flex items-center gap-2 text-gray-700 data-[state=active]:text-[#C72030] data-[state=active]:border-0 [&_svg]:text-gray-700 data-[state=active]:[&_svg]:text-[#C72030]"
                    style={{ border: '1px solid rgba(217, 217, 217, 1)' }}
                  >
                    <QrCode className="w-4 h-4" />
                    QR Code Generation
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="analytics" className="p-4 sm:p-6" style={{ backgroundColor: 'rgba(250, 250, 250, 1)' }}>
                  <div className="w-full bg-white rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between gap-3 bg-[#F6F4EE] py-3 px-4 border border-[#D9D9D9]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E5E0D3]">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 18 18" fill="none">
                            <mask id="mask0_9547_3931" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="18" height="18">
                              <rect width="18" height="18" fill="#D9D9D9" />
                            </mask>
                            <g mask="url(#mask0_9547_3931)">
                              <path d="M8.66681 13.1106C7.59669 13.0192 6.69719 12.5831 5.96831 11.8024C5.23944 11.0216 4.875 10.0875 4.875 9C4.875 7.85413 5.27606 6.88019 6.07819 6.07819C6.88019 5.27606 7.85413 4.875 9 4.875C10.0875 4.875 11.0216 5.23825 11.8024 5.96475C12.5831 6.69112 13.0192 7.58944 13.1106 8.65969L11.9179 8.30625C11.7557 7.63125 11.4066 7.07812 10.8703 6.64688C10.3342 6.21563 9.71075 6 9 6C8.175 6 7.46875 6.29375 6.88125 6.88125C6.29375 7.46875 6 8.175 6 9C6 9.7125 6.21681 10.3375 6.65044 10.875C7.08406 11.4125 7.636 11.7625 8.30625 11.925L8.66681 13.1106ZM9.56681 16.0946C9.47231 16.1149 9.37788 16.125 9.2835 16.125H9C8.01438 16.125 7.08812 15.938 6.22125 15.564C5.35437 15.19 4.60031 14.6824 3.95906 14.0413C3.31781 13.4002 2.81019 12.6463 2.43619 11.7795C2.06206 10.9128 1.875 9.98669 1.875 9.00131C1.875 8.01581 2.062 7.0895 2.436 6.22237C2.81 5.35525 3.31756 4.601 3.95869 3.95962C4.59981 3.31825 5.35375 2.81044 6.2205 2.43619C7.08725 2.06206 8.01331 1.875 8.99869 1.875C9.98419 1.875 10.9105 2.06206 11.7776 2.43619C12.6448 2.81019 13.399 3.31781 14.0404 3.95906C14.6818 4.60031 15.1896 5.35437 15.5638 6.22125C15.9379 7.08812 16.125 8.01438 16.125 9V9.27975C16.125 9.373 16.1149 9.46631 16.0946 9.55969L15 9.225V9C15 7.325 14.4187 5.90625 13.2563 4.74375C12.0938 3.58125 10.675 3 9 3C7.325 3 5.90625 3.58125 4.74375 4.74375C3.58125 5.90625 3 7.325 3 9C3 10.675 3.58125 12.0938 4.74375 13.2563C5.90625 14.4187 7.325 15 9 15H9.225L9.56681 16.0946ZM15.1052 16.2332L11.7043 12.825L10.8894 15.2884L9 9L15.2884 10.8894L12.825 11.7043L16.2332 15.1052L15.1052 16.2332Z" fill="#C72030"/>
                            </g>
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold uppercase text-black">
                          Analytics
                        </h3>
                      </div>
                    </div>
                    <div className="bg-[#FBFBFA] border border-t-0 border-[#D9D9D9] px-5 py-4">
                      <p className="text-gray-600">QR Code analytics data will be displayed here</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="qr-code-sub" className="p-4 sm:p-6" style={{ backgroundColor: 'rgba(250, 250, 250, 1)' }}>
                  <div className="w-full bg-white rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between gap-3 bg-[#F6F4EE] py-3 px-4 border border-[#D9D9D9]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E5E0D3]">
                          <QrCode className="w-6 h-6 text-[#C72030]" />
                        </div>
                        <h3 className="text-lg font-semibold uppercase text-black">
                          QR Code Generation
                        </h3>
                      </div>
                    </div>
                    <div className="bg-[#FBFBFA] border border-gray-200 overflow-hidden px-5 py-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ backgroundColor: '#E6E2D8' }}>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 text-center border-r border-white">
                          Actions
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 text-center border-r border-white">
                          Sr. No.
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">
                          CP Name
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">
                          Company Name
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">
                          Email ID
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4">
                          QR Code ID
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {qrCodeData.length > 0 ? (
                        qrCodeData.map((row) => (
                          <TableRow key={row.id} className="hover:bg-gray-50">
                            <TableCell className="py-3 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDownloadQRCode(row.qrCodeId, row.cpName)}
                                  className="p-1.5 text-[#C72030] hover:bg-[#FFF5F5] rounded transition-colors"
                                  title="Download QR Code"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSendQRCodeEmail(row.emailId, row.cpName)}
                                  className="p-1.5 text-[#C72030] hover:bg-[#FFF5F5] rounded transition-colors"
                                  title="Send via Email"
                                >
                                  <Mail className="w-4 h-4" />
                                </button>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-center font-medium">
                              {row.srNo}
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              {row.cpName}
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              {row.companyName}
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              {row.emailId}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-sm text-gray-600">
                              {row.qrCodeId}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-600">
                            No QR Codes generated yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* Events Related Images Tab */}
          <TabsContent value="images" className="p-6 space-y-6" style={{ backgroundColor: 'rgba(250, 249, 247, 1)' }}>
            <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between gap-3 bg-[#F6F4EE] py-3 px-4 border-b border-[#D9D9D9]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E5E0D3]">
                    <ImageIcon className="w-6 h-6 text-[#C72030]" />
                  </div>
                  <h3 className="text-lg font-semibold text-black">
                    Event Related Images
                  </h3>
                </div>
              </div>
              <div className="bg-[#FBFBFA] border-t-0 px-6 py-6 space-y-6">
                {/* Cover Images Section */}
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-3">Cover Images</h4>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow style={{ backgroundColor: '#E6E2D8' }}>
                          <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Name</TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Type</TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">Updated At</TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3 px-4">Image</TableHead>
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

                          const normalizedImages = coverGroups
                            .map((group) =>
                              Array.isArray(group)
                                ? group
                                : group && typeof group === "object"
                                ? [group]
                                : []
                            )
                            .flat()
                            .filter((img) => img?.document_url);

                          return normalizedImages.length > 0 ? (
                            normalizedImages.map((file, index) => (
                              <TableRow key={`cover-${index}`} className="hover:bg-gray-50">
                                <TableCell className="text-gray-900 py-3 px-4">{file.document_file_name}</TableCell>
                                <TableCell className="text-gray-900 py-3 px-4">{file.document_content_type}</TableCell>
                                <TableCell className="text-gray-900 py-3 px-4">{formatDateTime(file.document_updated_at)}</TableCell>
                                <TableCell className="py-3 px-4">
                                  <img
                                    src={file.document_url}
                                    alt={`Cover ${index}`}
                                    className="w-20 h-20 object-cover rounded"
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-gray-600">
                                No Cover Images
                              </TableCell>
                            </TableRow>
                          );
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Event Gallery Section */}
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-3">Event Gallery</h4>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow style={{ backgroundColor: '#E6E2D8' }}>
                          <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Name</TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Type</TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">Updated At</TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3 px-4">Image</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="bg-white">
                        {(() => {
                          const eventGroups = [
                            eventData.event_images_1_by_1,
                            eventData.event_images_9_by_16,
                            eventData.event_images_3_by_2,
                            eventData.event_images_16_by_9,
                          ];

                          const allEventImages = eventGroups
                            .filter((group) => Array.isArray(group) && group.length > 0)
                            .flat()
                            .filter((img) => img?.document_url);

                          return allEventImages.length > 0 ? (
                            allEventImages.map((file, index) => (
                              <TableRow key={`event-${index}`} className="hover:bg-gray-50">
                                <TableCell className="text-gray-900 py-3 px-4">{file.document_file_name}</TableCell>
                                <TableCell className="text-gray-900 py-3 px-4">{file.document_content_type}</TableCell>
                                <TableCell className="text-gray-900 py-3 px-4">{formatDateTime(file.document_updated_at)}</TableCell>
                                <TableCell className="py-3 px-4">
                                  <img
                                    src={file.document_url}
                                    alt={`Event ${index}`}
                                    className="w-20 h-20 object-cover rounded"
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-gray-600">
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
        </Tabs>
      </div>
    </div>
  );
};

export default EventCommunicationDetails;
