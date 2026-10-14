import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch } from "@/store/hooks";
import {
  FacilityBookingDetails,
  fetchBookingDetails,
  getLogs,
} from "@/store/slices/facilityBookingsSlice";
import { ArrowLeft, Logs, Pencil, Download, Loader } from "lucide-react";
import { CustomTabs } from "@/components/CustomTabs";
import { FACILITY_BOOKING_STYLES, PILL_BASE, PILL_DANGER, PILL_SUCCESS, PILL_WARNING } from "@/pages/facilityBookingStyles";
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
  const [downloadingReceipt, setDownloadingReceipt] = useState(false)
  const [error, setError] = useState("")
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
      setError(error);
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
    setStatusUpdating(Number(id));
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
    if (!refundFormData.refundable_amount || !refundFormData.refund_mode || !refundFormData.transaction_number) {
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

  // const handleRefundChange = (e: any) => {
  //   const { name, value } = e.target;
  //   setRefundFormData((prev) => ({ ...prev, [name]: value }));
  // };

  const handleRefundChange = (e: any) => {
    const { name, value } = e.target;

    let updatedValue = value;

    // Allow only numbers for refundable_amount
    if (name === "refundable_amount") {
      updatedValue = value.replace(/\D/g, "");
    }

    setRefundFormData((prev) => ({
      ...prev,
      [name]: updatedValue,
    }));
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

  const handleDownloadReceipt = async (id) => {
    setDownloadingReceipt(true);
    try {
      const response = await axios.get(`https://${baseUrl}/crm_facility_bookings/payment_details_pdf?lock_payment_id=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "payment_details.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.log(error)
      toast.error("Failed to download receipt");
    } finally {
      setDownloadingReceipt(false);
    }
  }

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
        <div className="ref-card">
          <div className="ref-card-bar">
            <h2 className="text-[15px] font-semibold text-[#1A1A18]">
              {bookings?.facility_name}
            </h2>
            <div className="flex items-center gap-2">
              {(bookings?.pg_state === "Pending" || bookings?.pg_state === "NA") && (
                <Button
                  onClick={() => setIsCaptureDialogOpen(true)}
                  className="btn-primary h-9 px-4 text-sm font-medium flex items-center gap-2"
                >
                  Capture Payment
                </Button>
              )}
              {bookings?.current_status === "Confirmed" &&
                bookings?.pg_state === "Pending" && (
                  <Button onClick={sendPaymentRequest} className="btn-primary h-9 px-4 text-sm font-medium flex items-center gap-2">
                    Payment Request
                  </Button>
                )}
              {bookings?.can_refund && (
                <Button
                  onClick={() => {
                    setRefundFormData((prev) => ({
                      ...prev,
                      refundable_amount: (
                        (bookings?.returned_amount && bookings.returned_amount > 0)
                          ? bookings.returned_amount.toString()
                          : bookings?.amount_paid?.toString() ?? ""
                      ),
                    }));
                    setIsRefundDialogOpen(true);
                  }}
                  className="ref-danger-btn h-9 px-4 text-sm font-medium"
                >
                  Refund
                </Button>
              )}
              {
                bookings?.fac_type === "Request" && (
                  <Button
                    variant="outline"
                    className="ref-edit-btn w-9 px-0 justify-center"
                    aria-label="Edit status"
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

          <div className="p-6 ref-kv">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4">
              {/* Left Column */}
              <div className="space-y-5">
                <div className="flex items-start text-sm">
                  <span className="text-gray-500 w-32 shrink-0">
                    Sub Facility
                  </span>
                  <span className="text-gray-900 font-medium">
                    {bookings?.sub_facility_name || "-"}
                  </span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-gray-500 w-32 shrink-0">
                    Booking ID
                  </span>
                  <span className="text-gray-900 font-medium">
                    {bookings?.id}
                  </span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-gray-500 w-32 shrink-0">Status</span>
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
                            PILL_BASE,
                            bookings?.current_status === "Confirmed"
                              ? PILL_SUCCESS
                              : bookings?.current_status === "Cancelled"
                                ? PILL_DANGER
                                : PILL_WARNING
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
                    Scheduled Date
                  </span>
                  <span className="text-gray-900 font-medium">
                    {bookings?.startdate
                      ? new Date(bookings.startdate).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                      : "-"}
                  </span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-gray-500 w-32 shrink-0">
                    Selected Slot
                  </span>
                  <span className="text-gray-900 font-medium">
                    {bookings?.show_schedule_24_hour}
                  </span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-gray-500 w-32 shrink-0">
                    Booked On
                  </span>
                  <span className="text-gray-900 font-medium">
                    {bookings?.created_at
                      ? new Date(bookings.created_at).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      : "-"}
                  </span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-gray-500 w-32 shrink-0">
                    Booked By
                  </span>
                  <span className="text-gray-900 font-medium">
                    {bookings?.booked_by_name || bookings?.created_by_name}
                  </span>
                </div>
                {/* <div className="flex items-start text-sm">
                  <span className="text-gray-500 w-32 shrink-0">Notes</span>
                  <span className="text-gray-900 font-medium">
                    {bookings?.comment || "None"}
                  </span>
                </div> */}
              </div>

              {/* Right Column */}
              <div className="space-y-5">
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
                    Transaction ID
                  </span>
                  <span className="text-gray-900 font-medium">
                    {bookings?.lock_payment?.pg_transaction_id || "-"}
                  </span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-gray-500 w-36 shrink-0">
                    Payment Status
                  </span>
                  <Badge
                    className={cn(
                      PILL_BASE,
                      bookings?.pg_state === "Success"
                        ? PILL_SUCCESS
                        : bookings?.pg_state === "Failed"
                          ? PILL_DANGER
                          : PILL_WARNING
                    )}
                  >
                    {bookings?.pg_state || "Pending"}
                  </Badge>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-gray-500 w-36 shrink-0">
                    Payment Method
                  </span>
                  <span className="text-gray-900 font-medium">
                    {bookings?.payment_method
                      ?.replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase()) || "-"}
                  </span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-gray-500 w-36 shrink-0">
                    Amount Paid
                  </span>
                  <span className="text-gray-900 font-medium">
                    ₹ {bookings?.amount_paid || "0.0"}
                  </span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-gray-500 w-36 shrink-0">
                    Payment Mode
                  </span>
                  <span className="text-gray-900 font-medium">
                    {bookings?.payment_mode
                      ?.replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase()) || "NA"}
                  </span>
                </div>
              </div>
            </div>

            {/* Refundable Amount Section */}
            {bookings?.can_refund && bookings?.amount_paid && (
              <div className="mt-8">
                <h3 className="text-[14px] font-semibold text-[#1A1A18] border-b border-[rgba(26,26,24,0.08)] pb-3 mb-4">
                  Refundable Amount
                </h3>
                <div className="bg-[#FAF9F7] rounded-xl border border-[rgba(26,26,24,0.08)] p-5 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Total Paid</span>
                    <span className="text-gray-900 font-medium">
                      INR {bookings.amount_paid.toFixed(2)}
                    </span>
                  </div>
                  {/* {bookings.return_percentage !== null && bookings.return_percentage !== undefined && ( */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Deduction Charges ({bookings.return_percentage ?? 0}%)</span>
                    <span className="text-gray-900 font-medium">
                      INR {(bookings.amount_paid * (bookings.return_percentage / 100)).toFixed(2)}
                    </span>
                  </div>
                  {/* )} */}
                  <div className="border-t border-[rgba(26,26,24,0.1)] pt-3 flex justify-between items-center">
                    <span className="text-gray-900 font-bold">Total Refundable Amount</span>
                    <span className="text-gray-900 font-bold text-lg">
                      INR {(
                        bookings.return_percentage !== null && bookings.return_percentage !== undefined
                          ? bookings.returned_amount ?? (bookings.amount_paid * (1 - bookings.return_percentage / 100))
                          : bookings.amount_paid
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}


            {/* Members Details Table */}
            {bookings?.fac_type === "Bookable" && (
              <div className="mt-8">
                <h3 className="text-[14px] font-semibold text-[#1A1A18] border-b border-[rgba(26,26,24,0.08)] pb-3 mb-4">
                  Members Details
                </h3>
                <div className="overflow-x-auto ref-table">
                  <table className="w-full text-sm text-left">
                    <thead className="border-b border-[rgba(26,26,24,0.08)]">
                      <tr>
                        <th className="py-3 px-4 px-4">Type</th>
                        <th className="py-3 px-4 px-4 text-center">Count</th>
                        <th className="py-3 px-4 px-4 text-center">Charge</th>
                        <th className="py-3 px-4 px-4 text-right">Total Charge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(26,26,24,0.06)]">
                      {bookings?.booked_members &&
                        bookings?.booked_members.length > 0 ? (
                        bookings?.booked_members.map(
                          (memberData: any, index: number) => {
                            const member = memberData.booked_member;
                            return (
                              <tr key={index}>
                                <td className="py-3 px-4 text-gray-900 capitalize">
                                  {member?.oftype?.replace(/_/g, " ")}
                                </td>
                                <td className="py-3 px-4 text-center text-gray-900">
                                  {member?.total || 0}
                                </td>
                                <td className="py-3 px-4 text-center text-gray-900">
                                  ₹ {member?.charge || "0.0"}
                                </td>
                                <td className="py-3 px-4 text-right text-gray-900">
                                  ₹ {member?.total_charge || "0.0"}
                                </td>
                              </tr>
                            );
                          }
                        )
                      ) : (
                        <>
                          <tr>
                            <td className="py-3 px-4 text-gray-900 font-medium">
                              Member
                            </td>
                            <td className="py-3 px-4 text-center text-gray-900">
                              -
                            </td>
                            <td className="py-3 px-4 text-center text-gray-900">-</td>
                            <td className="py-3 px-4 text-right text-gray-900">-</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 text-gray-900 font-medium">
                              Guest
                            </td>
                            <td className="py-3 px-4 text-center text-gray-900">
                              -
                            </td>
                            <td className="py-3 px-4 text-center text-gray-900">-</td>
                            <td className="py-3 px-4 text-right text-gray-900">-</td>
                          </tr>
                        </>
                      )}
                      <tr className="border-t border-[rgba(26,26,24,0.12)] bg-[#FAF9F7]">
                        <td className="py-3 px-4 font-bold text-gray-900 uppercase" colSpan={3}>
                          Sub Total
                        </td>
                        <td
                          className="py-3 px-4 text-right font-bold text-gray-900"
                        >
                          ₹ {bookings?.amount_full || "0.0"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Payment Details Card */}
            {bookings?.lock_payment && (
              <div className="mt-8">
                <h3 className="text-[14px] font-semibold text-[#1A1A18] border-b border-[rgba(26,26,24,0.08)] pb-3 mb-4">
                  Payment Details
                </h3>
                <div className="bg-white border border-[rgba(26,26,24,0.09)] rounded-2xl p-5">
                  {/* Header with Payment ID and Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">
                        Payment #{bookings.lock_payment.id || bookings.lock_payment.pg_transaction_id}
                      </h4>
                      <p className="text-xs text-gray-500">Status: {bookings.lock_payment.payment_status || 'Pending'}</p>
                    </div>
                    <Badge
                      className={cn(
                        PILL_BASE, "capitalize",
                        bookings.lock_payment.payment_status?.toLowerCase() === 'success'
                          ? PILL_SUCCESS
                          : bookings.lock_payment.payment_status?.toLowerCase() === 'pending'
                            ? PILL_WARNING
                            : PILL_DANGER
                      )}
                    >
                      {bookings.lock_payment.payment_status || 'Pending'}
                    </Badge>
                  </div>

                  {/* Payment Details Grid */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Transaction ID</span>
                      <span className="text-gray-900 font-medium">{bookings.lock_payment.pg_transaction_id || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Payment Method</span>
                      <span className="text-gray-900 font-medium">{bookings.lock_payment.payment_method || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Paid Amount</span>
                      <span className="text-lg font-semibold text-[#1A1A18]">
                        ₹{(bookings.lock_payment.paid_amount || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                    {bookings.lock_payment.notes && (
                      <div className="flex items-start justify-between text-sm pt-3 border-t border-gray-100">
                        <span className="text-gray-600">Notes</span>
                        <span className="text-gray-900 font-medium">{bookings.lock_payment.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Download Button */}
                  <Button
                    disabled={downloadingReceipt}
                    onClick={() => handleDownloadReceipt(bookings.lock_payment.id || bookings.lock_payment.pg_transaction_id)}
                    variant="outline"
                    className="ref-edit-btn w-full justify-center"
                    size="sm"
                  >
                    {
                      downloadingReceipt ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-3 h-3 mr-2" />
                    }
                    Download Receipt
                  </Button>
                </div>
              </div>
            )}

            {/* Refund Details Card */}
            {bookings?.lock_payment && bookings.lock_payment.refunded_amount && bookings.lock_payment.refunded_amount > 0 && (
              <div className="mt-8">
                <h3 className="text-[14px] font-semibold text-[#1A1A18] border-b border-[rgba(26,26,24,0.08)] pb-3 mb-4">
                  Refund Details
                </h3>
                <div className="bg-white border border-[rgba(26,26,24,0.09)] rounded-2xl p-5">
                  {/* Header with Refund ID and Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">
                        Refund Processing
                      </h4>
                      <p className="text-xs text-gray-500">Status: Refunded</p>
                    </div>
                    <Badge
                      className={cn(PILL_BASE, PILL_SUCCESS, "capitalize")}
                    >
                      Completed
                    </Badge>
                  </div>

                  {/* Refund Details Grid */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Refund Amount</span>
                      <span className="text-lg font-semibold text-[#56683F]">
                        ₹{(bookings.lock_payment.refunded_amount || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Refund Mode</span>
                      <span className="text-gray-900 font-medium capitalize">{bookings.lock_payment.refund_mode || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Transaction Number</span>
                      <span className="text-gray-900 font-medium">{bookings.lock_payment.refund_transaction_no || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Refunded By</span>
                      <span className="text-gray-900 font-medium">{bookings.lock_payment.refunded_by_user || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Refunded On</span>
                      <span className="text-gray-900 font-medium">
                        {bookings.lock_payment.refunded_on
                          ? new Date(bookings.lock_payment.refunded_on).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          : '-'}
                      </span>
                    </div>
                    {bookings.lock_payment.refund_note && (
                      <div className="flex items-start justify-between text-sm pt-3 border-t border-gray-100">
                        <span className="text-gray-600">Refund Note</span>
                        <span className="text-gray-900 font-medium text-right max-w-xs">{bookings.lock_payment.refund_note}</span>
                      </div>
                    )}
                  </div>
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
        <div className="ref-card p-6 space-y-6">
          <div className="flex items-center gap-2.5">
            <span className="ref-chip"><Logs /></span>
            <h3 className="text-[14px] font-semibold text-[#1A1A18]">
              Logs
            </h3>
          </div>
          <div className="overflow-x-auto px-3">
            <LogsTimeline logs={logs} />
          </div>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[300px] p-10">
        <div className="text-center bg-white border border-[rgba(26,26,24,0.09)] rounded-2xl p-6 max-w-md w-full">
          <h2 className="text-[15px] font-semibold text-[#A63D49]">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            We were unable to fetch the booking details.
          </p>

          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="btn-primary mt-4 h-9 px-4 text-sm font-medium"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!bookings) {
    return (
      <div className="bg-[#FDFDFB] h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[rgba(26,26,24,0.12)] border-t-[#1A1A18] mx-auto mb-4"></div>
          <p className="text-[13px] text-[rgba(26,26,24,0.55)]">Loading booking details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen booking-ref-page">
      <style>{FACILITY_BOOKING_STYLES}</style>
      <button type="button" onClick={() => navigate(-1)} className="ref-back">
        <ArrowLeft className="w-4 h-4" />
        Back to Bookings
      </button>
      <>
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] text-[#1A1A18]">
              {bookings.facility_name}
            </h1>
            <p className="mt-1 text-[13px] text-[rgba(26,26,24,0.55)]">Booking #{bookings.id}</p>
          </div>
          {
            bookings.can_cancel && (
              <Button
                variant="outline"
                className="ref-edit-btn"
                onClick={() => setIsCancelDialogOpen(true)}
              >
                Cancel Booking
              </Button>
            )
          }
        </div>

        <div className="ref-tabs-card">
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
            borderRadius: "16px",
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
            bgcolor: "#FFFFFF",
            borderBottom: "1px solid rgba(26, 26, 24, 0.08)",
            position: "relative",
          }}
        >
          <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 600, color: "#1A1A18" }}>
            Capture Payment
          </Typography>
          <IconButton
            aria-label="close"
            onClick={() => setIsCaptureDialogOpen(false)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "rgba(26, 26, 24, 0.6)",
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
            className="btn-primary h-9 px-4 text-sm font-medium flex items-center gap-2"
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
            borderRadius: "16px",
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
            bgcolor: "#FFFFFF",
            borderBottom: "1px solid rgba(26, 26, 24, 0.08)",
            position: "relative",
          }}
        >
          <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 600, color: "#1A1A18" }}>
            Cancel Booking
          </Typography>
          <IconButton
            aria-label="close"
            onClick={() => setIsCancelDialogOpen(false)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "rgba(26, 26, 24, 0.6)",
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
            className="bg-[#A63D49] hover:bg-[#8E3440] text-white h-9 px-4 text-sm font-medium"
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
            borderRadius: "16px",
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
            bgcolor: "#FFFFFF",
            borderBottom: "1px solid rgba(26, 26, 24, 0.08)",
            position: "relative",
          }}
        >
          <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 600, color: "#1A1A18" }}>
            Refund Payment
          </Typography>
          <IconButton
            aria-label="close"
            onClick={() => setIsRefundDialogOpen(false)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "rgba(26, 26, 24, 0.6)",
            }}
          >
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box className="space-y-4 pt-2">
            <div>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Refundable Amount <span className="text-red-500">*</span>
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
                Refund Mode <span className="text-red-500">*</span>
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
                Cheque/Transaction Number <span className="text-red-500">*</span>
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
            className="btn-primary h-9 px-4 text-sm font-medium"
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
            borderRadius: "16px",
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
            bgcolor: "#FFFFFF",
            borderBottom: "1px solid rgba(26, 26, 24, 0.08)",
            position: "relative",
          }}
        >
          <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 600, color: "#1A1A18" }}>
            Edit Status
          </Typography>
          <IconButton
            aria-label="close"
            onClick={() => setIsEditStatusDialogOpen(false)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "rgba(26, 26, 24, 0.6)",
            }}
          >
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box className="space-y-6 pt-2">
            <div>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Select Status <span className="text-red-500">*</span>
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
            className="btn-primary h-9 px-4 text-sm font-medium"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default BookingDetailsPage;
