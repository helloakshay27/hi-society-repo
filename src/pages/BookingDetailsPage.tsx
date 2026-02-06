import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch } from "@/store/hooks";
import {
  FacilityBookingDetails,
  fetchBookingDetails,
  getLogs,
} from "@/store/slices/facilityBookingsSlice";
import { ArrowLeft, Logs, Pencil } from "lucide-react";
import { CustomTabs } from "@/components/CustomTabs";
import { LogsTimeline } from "@/components/LogTimeline";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectItem,
} from "@/components/ui/select";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  MenuItem,
  Select as MuiSelect,
  Typography,
  Box,
  IconButton,
  TextareaAutosize,
} from "@mui/material";
import { X } from "lucide-react";

const BookingDetailsPage = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<FacilityBookingDetails | null>(null);
  console.log(bookings);
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [logs, setLogs] = useState([
    {
      id: "",
      description: "",
      timestamp: "",
    },
  ]);

  const [isCaptureDialogOpen, setIsCaptureDialogOpen] = useState(false);
  const [captureFormData, setCaptureFormData] = useState({
    usage_charges: "",
    total_payable: "",
    payment_mode: "",
    transaction_number: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [refundFormData, setRefundFormData] = useState({
    refundable_amount: "",
    refund_mode: "",
    transaction_number: "",
    notes: "",
  });
  const [isEditStatusDialogOpen, setIsEditStatusDialogOpen] = useState(false);
  const [editStatusFormData, setEditStatusFormData] = useState({
    status: "",
    reason: "",
  });

  useEffect(() => {
    if (bookings) {
      setCaptureFormData((prev) => ({
        ...prev,
        usage_charges: bookings.amount_full?.toString() || "",
        total_payable: bookings.amount_full?.toString() || "",
      }));
    }
  }, [bookings]);

  const baseUrl = localStorage.getItem("baseUrl");
  const token = localStorage.getItem("token");

  const fetchDetails = async () => {
    try {
      const response = await dispatch(
        fetchBookingDetails({ baseUrl, token, id })
      ).unwrap();
      setBookings(response);
    } catch (error) {
      console.error("Error fetching booking details:", error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await dispatch(getLogs({ baseUrl, token, id })).unwrap();
      setLogs(
        response.logs.map((log, index) => ({
          id: index,
          description: log.text,
          timestamp: log.date + " " + log.time,
        }))
      );
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  useEffect(() => {
    fetchDetails();
    fetchLogs();
  }, []);

  const handleStatusChange = async (newStatus: string) => {
    setStatusUpdating(id);
    try {
      await axios.patch(
        `https://${baseUrl}/crm/admin/facility_bookings/${id}.json`,
        { current_status: newStatus.toLowerCase() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success(`Booking ${id} status updated to ${newStatus}`);
      fetchDetails();
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error("Failed to update booking status");
    } finally {
      setStatusUpdating(null);
    }
  };
  const handleCaptureSubmit = async () => {
    setIsSubmitting(true);
    try {
      await axios.post(
        `https://${baseUrl}/crm/admin/facility_bookings/${id}/payment.json`,
        {
          facility_booking: {
            pg_state: "SUCCESS",
          },
          lock_payment: {
            paid_amount: captureFormData.total_payable,
            payment_method: captureFormData.payment_mode,
            pg_transaction_id: captureFormData.transaction_number,
            notes: captureFormData.notes,
            payment_status: "SUCCESS",
            resource_id: localStorage.getItem("selectedUserSociety"),
            resource_type: "Society",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Payment captured successfully");
      setIsCaptureDialogOpen(false);
      fetchDetails();
    } catch (error) {
      console.error("Error capturing payment:", error);
      toast.error("Failed to capture payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendPaymentRequest = async () => {
    try {
      await axios.get(`https://${baseUrl}/crm/admin/facility_bookings/${id}/send_payment_request.json`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      toast.success("Payment request sent successfully");
    } catch (error) {
      console.log(error)
      toast.error("Failed to send payment request");
    }
  }

  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }
    setIsSubmitting(true);
    try {
      await axios.put(
        `https://${baseUrl}/crm/admin/facility_bookings/${id}.json`,
        {
          facility_booking: {
            canceled_by: "admin",
            canceler_id: localStorage.getItem("userId"),
            comment: cancelReason,
            current_status: "cancelled",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Booking cancelled successfully");
      setIsCancelDialogOpen(false);
      setCancelReason("");
      fetchDetails();
      fetchLogs();
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefundSubmit = async () => {
    if (!refundFormData.refundable_amount || !refundFormData.refund_mode) {
      toast.error("Please fill in all mandatory fields");
      return;
    }
    setIsSubmitting(true);
    try {
      await axios.post(
        `https://${baseUrl}/crm/admin/facility_bookings/${id}/refund_payment.json`,
        {
          lock_payment: {
            refunded_amount: refundFormData.refundable_amount,
            refund_mode: refundFormData.refund_mode,
            refund_transaction_no: refundFormData.transaction_number,
            refund_note: refundFormData.notes,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Refund processed successfully");
      setIsRefundDialogOpen(false);
      setRefundFormData({
        refundable_amount: "",
        refund_mode: "",
        transaction_number: "",
        notes: "",
      });
      fetchDetails();
      fetchLogs();
    } catch (error) {
      console.error("Error processing refund:", error);
      toast.error("Failed to process refund");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefundChange = (e: any) => {
    const { name, value } = e.target;
    setRefundFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditStatusChange = (e: any) => {
    const { name, value } = e.target;
    setEditStatusFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusSubmit = async () => {
    if (!editStatusFormData.status) {
      toast.error("Please select a status");
      return;
    }

    if (editStatusFormData.status === "cancelled" && !editStatusFormData.reason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        osr_log: {
          about: "FacilityBooking",
          about_id: id,
          current_status: editStatusFormData.status,
          comment: editStatusFormData.reason,
        },
      };

      await axios.post(
        `https://${baseUrl}/crm/create_osr_log.json`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(`Booking status updated to ${editStatusFormData.status}`);
      setIsEditStatusDialogOpen(false);
      setEditStatusFormData({ status: "", reason: "" });
      fetchDetails();
      fetchLogs();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCaptureChange = (e: any) => {
    const { name, value } = e.target;
    setCaptureFormData((prev) => ({ ...prev, [name]: value }));
  };
  console.log(logs);

  const tabs = [
    {
      value: "details",
      label: "Details",
      content: (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              {bookings?.facility_name}
            </h2>
            <div className="flex gap-3">
              {bookings?.pg_state === "Pending" && (
                <Button
                  onClick={() => setIsCaptureDialogOpen(true)}
                  className="bg-[#16B364] hover:bg-[#129a55] text-white text-xs font-semibold px-4 py-2 h-auto"
                >
                  Capture Payment
                </Button>
              )}
              {bookings?.current_status === "Confirmed" &&
                bookings?.pg_state === "Pending" && (
                  <Button onClick={sendPaymentRequest} className="bg-[#F7941D] hover:bg-[#e0861a] text-white text-xs font-semibold px-4 py-2 h-auto">
                    Payment Request
                  </Button>
                )}
              {bookings?.can_refund && (
                <Button
                  onClick={() => {
                    setRefundFormData((prev) => ({
                      ...prev,
                      refundable_amount: bookings?.amount_paid?.toString() || "",
                    }));
                    setIsRefundDialogOpen(true);
                  }}
                  className="bg-[#D92E14] hover:bg-[#b02510] text-white text-xs font-semibold px-4 py-2 h-auto"
                >
                  Refund
                </Button>
              )}
              {
                bookings?.fac_type === "Request" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditStatusFormData({
                        status: bookings?.current_status || "",
                        reason: "",
                      });
                      setIsEditStatusDialogOpen(true);
                    }}
                  >
                    <Pencil size={16} />
                  </Button>
                )
              }
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="flex items-start text-sm">
                  <span className="text-gray-500 w-32 shrink-0">
                    Sub Facility:
                  </span>
                  <span className="text-gray-900 font-medium">
                    {bookings?.sub_facility_name || "-"}
                  </span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-gray-500 w-32 shrink-0">
                    Booking ID:
                  </span>
                  <span className="text-gray-900 font-medium">
                    {bookings?.id}
                  </span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-gray-500 w-32 shrink-0">Status:</span>
                  <div className="flex items-center">
                    <Select
                      value={bookings?.current_status}
                      onValueChange={(newStatus) =>
                        handleStatusChange(newStatus)
                      }
                    >
                      <SelectTrigger className="border-none bg-transparent p-0 h-auto [&>svg]:hidden">
                        <Badge
                          className={cn(
                            "px-2 py-0.5 text-[11px] font-semibold rounded",
                            bookings?.current_status === "Confirmed"
                              ? "bg-[#16B364] text-white hover:bg-[#16B364]"
                              : bookings?.current_status === "Cancelled"
                                ? "bg-[#D92E14] text-white hover:bg-[#D92E14]"
                                : "bg-[#F7941D] text-white hover:bg-[#F7941D]"
                          )}
                        >
                          {bookings?.current_status}
                        </Badge>
                      </SelectTrigger>
                      {bookings?.fac_type === "Request" && (
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Confirmed">Confirmed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      )}
                    </Select>
                  </div>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-gray-500 w-32 shrink-0">
                    Scheduled Date:
                  </span>
                  <span className="text-gray-900 font-medium">
                    {bookings?.startdate?.split("T")[0]}
                  </span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-gray-500 w-32 shrink-0">
                    Selected Slot:
                  </span>
                  <span className="text-gray-900 font-medium">
                    {bookings?.show_schedule_24_hour}
                  </span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-gray-500 w-32 shrink-0">
                    Booked On:
                  </span>
                  <span className="text-gray-900 font-medium">
                    {bookings?.created_at?.split("T")[0]}
                  </span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-gray-500 w-32 shrink-0">
                    Booked By:
                  </span>
                  <span className="text-gray-900 font-medium">
                    {bookings?.booked_by_name || bookings?.created_by_name}
                  </span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-gray-500 w-32 shrink-0">Notes:</span>
                  <span className="text-gray-900 font-medium">
                    {bookings?.comment || "None"}
                  </span>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="flex items-start text-sm">
                  <span className="text-gray-500 w-36 shrink-0">GST</span>
                  <span className="text-gray-900 font-medium">
                    ₹ {bookings?.gst || "0.0"}
                  </span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-gray-500 w-36 shrink-0">
                    Payable Amount
                  </span>
                  <span className="text-gray-900 font-medium">
                    ₹ {bookings?.amount_full || "0.0"}
                  </span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-gray-500 w-36 shrink-0">
                    Transaction ID:
                  </span>
                  <span className="text-gray-900 font-medium">
                    {bookings?.transaction_id || "-"}
                  </span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-gray-500 w-36 shrink-0">
                    Payment Status:
                  </span>
                  <Badge
                    className={cn(
                      "px-2 py-0.5 text-[11px] font-semibold rounded",
                      bookings?.pg_state === "Success"
                        ? "bg-[#16B364] text-white hover:bg-[#16B364]"
                        : bookings?.pg_state === "Failed"
                          ? "bg-[#D92E14] text-white hover:bg-[#D92E14]"
                          : "bg-[#F7941D] text-white hover:bg-[#F7941D]"
                    )}
                  >
                    {bookings?.pg_state || "Pending"}
                  </Badge>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-gray-500 w-36 shrink-0">
                    Payment Method:
                  </span>
                  <span className="text-gray-900 font-medium">
                    {bookings?.payment_method
                      ?.replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase()) || "-"}
                  </span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-gray-500 w-36 shrink-0">
                    Amount Paid:
                  </span>
                  <span className="text-gray-900 font-medium">
                    ₹ {bookings?.amount_paid || "0.0"}
                  </span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-gray-500 w-36 shrink-0">
                    Payment Mode:
                  </span>
                  <span className="text-gray-900 font-medium">
                    {bookings?.payment_mode
                      ?.replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase()) || "NA"}
                  </span>
                </div>
              </div>
            </div>

            {/* Members Details Table */}
            {bookings?.fac_type === "Bookable" && (
              <div className="mt-10">
                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">
                  Members Details
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-gray-500 font-medium border-b border-gray-100">
                      <tr>
                        <th className="py-2">Type</th>
                        <th className="py-2 text-center">Count</th>
                        <th className="py-2 text-center">Charge</th>
                        <th className="py-2 text-right">Total Charge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {bookings?.booked_members &&
                        bookings?.booked_members.length > 0 ? (
                        bookings?.booked_members.map(
                          (memberData: any, index: number) => {
                            const member = memberData.booked_member;
                            return (
                              <tr key={index}>
                                <td className="py-3 text-gray-900 capitalize">
                                  {member?.oftype?.replace(/_/g, " ")}
                                </td>
                                <td className="py-3 text-center text-gray-900">
                                  {member?.total || 0}
                                </td>
                                <td className="py-3 text-center text-gray-900">
                                  ₹ {member?.charge || "0.0"}
                                </td>
                                <td className="py-3 text-right text-gray-900">
                                  ₹ {member?.total_charge || "0.0"}
                                </td>
                              </tr>
                            );
                          }
                        )
                      ) : (
                        <>
                          <tr>
                            <td className="py-3 text-gray-900 font-medium">
                              Member
                            </td>
                            <td className="py-3 text-center text-gray-900">
                              -
                            </td>
                            <td className="py-3 text-center text-gray-900">-</td>
                            <td className="py-3 text-right text-gray-900">-</td>
                          </tr>
                          <tr>
                            <td className="py-3 text-gray-900 font-medium">
                              Guest
                            </td>
                            <td className="py-3 text-center text-gray-900">
                              -
                            </td>
                            <td className="py-3 text-center text-gray-900">-</td>
                            <td className="py-3 text-right text-gray-900">-</td>
                          </tr>
                        </>
                      )}
                      <tr className="border-t-2 border-gray-100 bg-gray-50/30">
                        <td className="py-3 font-bold text-gray-900 uppercase" colSpan={3}>
                          Sub Total
                        </td>
                        <td
                          className="py-3 text-right font-bold text-gray-900"
                        >
                          ₹ {bookings?.amount_full || "0.0"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      value: "logs",
      label: "Logs",
      content: (
        <div className="bg-white rounded-lg shadow border-2 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12  h-12  rounded-full flex items-center justify-center bg-[#E5E0D3] text-[#C72030]">
              <Logs className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-semibold uppercase text-[#1A1A1A]">
              LOGS
            </h3>
          </div>
          <div className="overflow-x-auto px-3">
            <LogsTimeline logs={logs} />
          </div>
        </div>
      ),
    },
  ];

  if (!bookings) {
    return <div className="p-10 text-gray-600">Loading booking details...</div>;
  }

  return (
    <div className="p-[30px] min-h-screen bg-transparent">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2 cursor-pointer">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>
      <>
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-[24px] font-semibold text-[#1a1a1a]">
            {bookings.facility_name}
          </h1>
          <Button
            variant="outline"
            onClick={() => setIsCancelDialogOpen(true)}
          >
            Cancel Booking
          </Button>
        </div>

        <div className="bg-white rounded-lg border-2 border-gray-200">
          <CustomTabs
            tabs={tabs}
            defaultValue="details"
            onValueChange={setActiveTab}
          />
        </div>
      </>

      <Dialog
        open={isCaptureDialogOpen}
        onClose={() => setIsCaptureDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          style: {
            borderRadius: "8px",
          },
        }}
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            bgcolor: "#f5f5f5",
            position: "relative",
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Capture Payment
          </Typography>
          <IconButton
            aria-label="close"
            onClick={() => setIsCaptureDialogOpen(false)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "red",
            }}
          >
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box className="space-y-4 pt-2">
            <div>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Usage Charges
              </Typography>
              <TextField
                fullWidth
                name="usage_charges"
                value={captureFormData.usage_charges}
                onChange={handleCaptureChange}
                variant="outlined"
                size="small"
                disabled
              />
            </div>
            <div>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Total Payable Amount
              </Typography>
              <TextField
                fullWidth
                name="total_payable"
                value={captureFormData.total_payable}
                onChange={handleCaptureChange}
                variant="outlined"
                size="small"
              />
            </div>
            <div>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Payment Mode
              </Typography>
              <FormControl fullWidth size="small">
                <MuiSelect
                  name="payment_mode"
                  value={captureFormData.payment_mode}
                  onChange={handleCaptureChange}
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    Select Mode
                  </MenuItem>
                  <MenuItem value="UPI">UPI</MenuItem>
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="cheque">Cheque</MenuItem>
                  <MenuItem value="NEFT">NEFT</MenuItem>
                  <MenuItem value="RTGS">RTGS</MenuItem>
                  <MenuItem value="credit card">Credit Card</MenuItem>
                  <MenuItem value="debit card">Debit Card</MenuItem>
                  <MenuItem value="net banking">Net Banking</MenuItem>
                </MuiSelect>
              </FormControl>
            </div>
            <div>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Cheque/Transaction Number
              </Typography>
              <TextField
                fullWidth
                name="transaction_number"
                value={captureFormData.transaction_number}
                onChange={handleCaptureChange}
                variant="outlined"
                size="small"
              />
            </div>
            <div>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Notes
              </Typography>
              <TextareaAutosize
                minRows={3}
                name="notes"
                value={captureFormData.notes}
                onChange={handleCaptureChange}
                placeholder="Write note"
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  fontFamily: "inherit",
                  fontSize: "14px",
                }}
              />
            </div>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <Button
            onClick={handleCaptureSubmit}
            disabled={isSubmitting}
            className="bg-[#00A65A] hover:bg-[#008d4c] text-white px-8 py-2 font-semibold"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          style: {
            borderRadius: "8px",
          },
        }}
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            bgcolor: "#f5f5f5",
            position: "relative",
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Cancel Booking
          </Typography>
          <IconButton
            aria-label="close"
            onClick={() => setIsCancelDialogOpen(false)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "red",
            }}
          >
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box className="space-y-4 pt-2">
            <div>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Reason for Cancellation
              </Typography>
              <TextareaAutosize
                minRows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Write reason"
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  fontFamily: "inherit",
                  fontSize: "14px",
                }}
              />
            </div>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <Button
            onClick={handleCancelSubmit}
            disabled={isSubmitting}
            className="bg-[#D92E14] hover:bg-[#b02510] text-white px-8 py-2 font-semibold"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isRefundDialogOpen}
        onClose={() => setIsRefundDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          style: {
            borderRadius: "8px",
          },
        }}
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            bgcolor: "#f5f5f5",
            position: "relative",
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Refund Payment
          </Typography>
          <IconButton
            aria-label="close"
            onClick={() => setIsRefundDialogOpen(false)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "red",
            }}
          >
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box className="space-y-4 pt-2">
            <div>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Refundable Amount
              </Typography>
              <TextField
                fullWidth
                name="refundable_amount"
                value={refundFormData.refundable_amount}
                onChange={handleRefundChange}
                variant="outlined"
                size="small"
              />
            </div>
            <div>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Refund Mode
              </Typography>
              <FormControl fullWidth size="small">
                <MuiSelect
                  name="refund_mode"
                  value={refundFormData.refund_mode}
                  onChange={handleRefundChange}
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    Select Mode
                  </MenuItem>
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="cheque">Cheque</MenuItem>
                  <MenuItem value="NEFT/RTGS">NEFT/RTGS</MenuItem>
                </MuiSelect>
              </FormControl>
            </div>
            <div>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Cheque/Transaction Number
              </Typography>
              <TextField
                fullWidth
                name="transaction_number"
                value={refundFormData.transaction_number}
                onChange={handleRefundChange}
                variant="outlined"
                size="small"
              />
            </div>
            <div>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Notes
              </Typography>
              <TextareaAutosize
                minRows={3}
                name="notes"
                value={refundFormData.notes}
                onChange={handleRefundChange}
                placeholder="Write note"
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  fontFamily: "inherit",
                  fontSize: "14px",
                }}
              />
            </div>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <Button
            onClick={handleRefundSubmit}
            disabled={isSubmitting}
            className="bg-[#00A65A] hover:bg-[#008d4c] text-white px-8 py-2 font-semibold"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isEditStatusDialogOpen}
        onClose={() => setIsEditStatusDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          style: {
            borderRadius: "8px",
          },
        }}
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            bgcolor: "#f5f5f5",
            position: "relative",
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Edit Status
          </Typography>
          <IconButton
            aria-label="close"
            onClick={() => setIsEditStatusDialogOpen(false)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "red",
            }}
          >
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box className="space-y-6 pt-2">
            <div>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Select Status
              </Typography>
              <FormControl fullWidth size="small">
                <MuiSelect
                  name="status"
                  value={editStatusFormData.status}
                  onChange={handleEditStatusChange}
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    Select Status
                  </MenuItem>
                  <MenuItem value="Confirmed">Confirmed</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                </MuiSelect>
              </FormControl>
            </div>

            <div className="space-y-4">
              <TextareaAutosize
                minRows={3}
                name="reason"
                value={editStatusFormData.reason}
                onChange={handleEditStatusChange}
                placeholder="Write Reason"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  fontFamily: "inherit",
                  fontSize: "14px",
                }}
              />
            </div>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <Button
            onClick={handleStatusSubmit}
            disabled={isSubmitting}
            className="bg-[#00A65A] hover:bg-[#008d4c] text-white px-8 py-2 font-semibold"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default BookingDetailsPage;
