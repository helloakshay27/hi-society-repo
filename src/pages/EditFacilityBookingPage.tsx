import { Button } from '@/components/ui/button';
import { useAppDispatch } from '@/store/hooks';
import { fetchBookingDetails } from '@/store/slices/facilityBookingsSlice';
import { fetchActiveFacilities } from '@/store/slices/facilitySetupsSlice';
import { MenuItem, TextField } from '@mui/material';
import axios from 'axios';
import { ArrowLeft, CalendarDays, ChevronRight, Receipt } from 'lucide-react';
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner';
import { FACILITY_BOOKING_STYLES, PILL_BASE, PILL_DANGER, PILL_SUCCESS, PILL_WARNING } from '@/pages/facilityBookingStyles';

const fieldStyles = {
    backgroundColor: 'white',
};

const EditFacilityBookingPage = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { id } = useParams();

    const token = localStorage.getItem('token') || ''
    const baseUrl = localStorage.getItem('baseUrl') || ''

    const [selectedUser, setSelectedUser] = useState("")
    const [users, setUsers] = useState<any[]>([])
    const [selectedFacility, setSelectedFacility] = useState<any>("")
    const [facilities, setFacilities] = useState<any[]>([])
    const [facilitySetupsLoading, setFacilitySetupsLoading] = useState(false)
    const [selectedDate, setSelectedDate] = useState("")
    const [comment, setComment] = useState("")
    const [subTotal, setSubTotal] = useState("")
    const [gstPercentage, setGstPercentage] = useState("")
    const [sgstPercentage, setSgstPercentage] = useState("")
    const [amountFull, setAmountFull] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [currentStatus, setCurrentStatus] = useState<string>("");
    const [statusUpdating, setStatusUpdating] = useState(false);
    const gstAmount = (parseFloat(subTotal) * Number(gstPercentage)) / 100 || 0
    const sgstAmount = (parseFloat(subTotal) * Number(sgstPercentage)) / 100 || 0
    const grandTotal = parseFloat(subTotal) + gstAmount + sgstAmount || 0

    const getUsers = async () => {
        try {
            const response = await axios.get(
                `https://${baseUrl}/pms/users/get_escalate_to_users.json?type=Asset`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setUsers(response.data.users || []);

        } catch (error) {
            console.log(error);
            toast.error(error);
        }
    };

    const getFacilitySetups = async () => {
        setFacilitySetupsLoading(true);
        try {
            const response = await dispatch(fetchActiveFacilities({ baseUrl, token })).unwrap();
            setFacilities(response.facility_setups);
        } catch (error) {
            console.log(error)
        } finally {
            setFacilitySetupsLoading(false);
        }
    }

    const fetchDetails = async () => {
        try {
            const response = await dispatch(
                fetchBookingDetails({ baseUrl, token, id })
            ).unwrap();

            const bookingDetails = (response as any) || response as any;
            setSelectedUser(bookingDetails.user_id?.toString() || "");
            setSelectedFacility(bookingDetails.facility_id?.toString() || "");
            if (bookingDetails.startdate) {
                const dateStr = bookingDetails.startdate.split(' ')[0];
                setSelectedDate(dateStr);
            }
            setComment(bookingDetails.comment || "");
            setSubTotal(bookingDetails.sub_total || "");
            setGstPercentage(bookingDetails.gst?.toString() || "");
            setSgstPercentage(bookingDetails.sgst?.toString() || "");
            setAmountFull(bookingDetails.amount_full || "");
            setCurrentStatus(bookingDetails.current_status || "");
        } catch (error) {
            console.error("Error fetching booking details:", error);
            toast.error("Failed to fetch booking details");
        }
    };

    useEffect(() => {
        getUsers();
        fetchDetails();
        getFacilitySetups();
    }, [])

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        if (!id) {
            toast.error('Booking ID is missing');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                facility_booking: {
                    sgst: sgstPercentage ? parseFloat(sgstPercentage) : '',
                    gst: gstPercentage ? parseFloat(gstPercentage) : '',
                    sub_total: Number(subTotal),
                    amount_full: grandTotal,
                    amount_paid: grandTotal,
                }
            };

            const response = await axios.put(
                `https://${baseUrl}/pms/facility_bookings/${id}.json`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                }
            );

            if (response.status === 200 || response.status === 204) {
                toast.success('Facility booking updated successfully');
                navigate(-1);
            }
        } catch (error: any) {
            console.error('Error updating booking:', error);
            toast.error(error.response?.data?.message || 'Failed to update facility booking');
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleStatusChange = async (newStatus: string) => {
        setStatusUpdating(true);
        try {
            await axios.patch(
                `https://${baseUrl}/pms/admin/facility_bookings/${id}.json`,
                { current_status: newStatus.toLowerCase() },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setCurrentStatus(newStatus);
            toast.success(`Booking status updated to ${newStatus}`);
        } catch (error) {
            console.error('Error updating booking status:', error);
            toast.error('Failed to update booking status');
        } finally {
            setStatusUpdating(false);
        }
    };

    return (
        <div className="p-6 min-h-screen booking-ref-page">
            <style>{FACILITY_BOOKING_STYLES}</style>
            <div className="mb-6">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[#1A1A18] hover:bg-[#F5F4F0] transition-colors"
                                aria-label="Back"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <span className="text-[13px] text-[rgba(26,26,24,0.55)]">Facility Bookings</span>
                            <ChevronRight className="w-3.5 h-3.5 text-[rgba(26,26,24,0.4)]" />
                            <span className="text-[13px] font-semibold text-[#1A1A18]">Edit Booking</span>
                        </div>
                        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] text-[#1A1A18]">
                            Edit Facility Booking
                        </h1>
                    </div>
                    {currentStatus && (
                        <div className="flex items-center gap-3 h-10 px-3 bg-white rounded-xl border border-[rgba(26,26,24,0.09)]">
                            <span className="text-[12px] font-semibold text-[rgba(26,26,24,0.6)]">Status</span>
                            <Select
                                value={currentStatus}
                                onValueChange={(newStatus) => handleStatusChange(newStatus)}
                                disabled={statusUpdating}
                            >
                                <SelectTrigger className="border-none bg-transparent p-0 h-auto [&>svg]:hidden">
                                    <div
                                        className={`${PILL_BASE} inline-flex items-center gap-1.5 cursor-pointer ${currentStatus === "Cancelled"
                                            ? PILL_DANGER
                                            : currentStatus === "Confirmed"
                                                ? PILL_SUCCESS
                                                : PILL_WARNING
                                            }`}
                                    >
                                        <span className="rounded-full w-1.5 h-1.5 inline-block bg-current"></span>
                                        {currentStatus}
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pending">
                                        Pending
                                    </SelectItem>
                                    <SelectItem value="Confirmed">
                                        Confirmed
                                    </SelectItem>
                                    <SelectItem value="Cancelled">
                                        Cancelled
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="ref-card">
                <div className="ref-card-head">
                    <span className="ref-chip"><CalendarDays /></span>
                    <h2>Booking Info</h2>
                </div>
                <div className="ref-card-body space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <TextField
                            select
                            required
                            label="User"
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            variant="outlined"
                            fullWidth
                            SelectProps={{ displayEmpty: true }}
                            InputLabelProps={{
                                classes: {
                                    asterisk: "text-red-500", // Tailwind class for red color
                                },
                                shrink: true
                            }}
                            sx={fieldStyles}
                            disabled
                        >
                            <MenuItem value="" disabled>
                                <em>
                                    Select User
                                </em>
                            </MenuItem>
                            {users.map((user) => (
                                <MenuItem key={user.id} value={user.id.toString()}>
                                    {user.full_name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </div>

                    <div className="space-y-2">
                        <TextField
                            select
                            required
                            label="Facility"
                            value={selectedFacility}
                            variant="outlined"
                            fullWidth
                            SelectProps={{ displayEmpty: true }}
                            InputLabelProps={{
                                classes: {
                                    asterisk: "text-red-500", // Tailwind class for red color
                                },
                                shrink: true
                            }}
                            sx={fieldStyles}
                            disabled
                        >
                            <MenuItem value="" disabled>
                                <em>
                                    Select Facility
                                </em>
                            </MenuItem>
                            {facilitySetupsLoading && (
                                <MenuItem value="" disabled>
                                    Loading facilities...
                                </MenuItem>
                            )}
                            {!facilitySetupsLoading && facilities.length === 0 && (
                                <MenuItem value="" disabled>
                                    No facilities available
                                </MenuItem>
                            )}
                            {facilities.map((facility) => (
                                <MenuItem key={facility.id} value={facility.id}>
                                    {facility.fac_name} ({facility.fac_type.charAt(0).toUpperCase() + facility.fac_type.slice(1)})
                                </MenuItem>
                            ))}
                        </TextField>
                    </div>

                    <div className="space-y-2">
                        <TextField
                            type="date"
                            label="Date"
                            required
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            variant="outlined"
                            fullWidth
                            disabled
                            InputLabelProps={{
                                classes: {
                                    asterisk: "text-red-500", // Tailwind class for red color
                                },
                                shrink: true
                            }}
                            inputProps={{
                                min: new Date().toISOString().split("T")[0],
                            }}
                            sx={fieldStyles}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <TextField
                        label="Comment"
                        value={comment}
                        variant="outlined"
                        fullWidth
                        multiline
                        rows={4}
                        disabled
                        InputLabelProps={{ shrink: true }}
                        sx={{
                            mt: 1,
                            "& .MuiOutlinedInput-root": {
                                height: "auto !important",
                                padding: "2px !important",
                                display: "flex",
                            },
                            "& .MuiInputBase-input[aria-hidden='true']": {
                                flex: 0,
                                width: 0,
                                height: 0,
                                padding: "0 !important",
                                margin: 0,
                                display: "none",
                            },
                            "& .MuiInputBase-input": {
                                resize: "none !important",
                            },
                        }}
                        helperText={<span style={{ textAlign: 'right', display: 'block' }}>{`${comment.length}/255 characters`}</span>}
                        error={comment.length > 255}
                    />
                </div>
                </div>
                </div>

                <div className="ref-card">
                    <div className="ref-card-head">
                        <span className="ref-chip"><Receipt /></span>
                        <h2>Cost Summary</h2>
                    </div>
                    <div className="ref-card-body space-y-1">

                        {/* Subtotal Before Discount */}
                        <div className="flex justify-between items-center py-3 border-b border-[rgba(26,26,24,0.08)]">
                            <span className="text-[13.5px] text-[rgba(26,26,24,0.7)] font-medium">Subtotal</span>
                            <span className="text-[13.5px] font-semibold text-[#1A1A18]">
                                ₹ <input
                                    type="number"
                                    value={subTotal}
                                    onChange={(e) => setSubTotal(e.target.value)}
                                    className='ref-num-input w-24 text-right'
                                />
                            </span>
                        </div>

                        {/* GST */}
                        <div className="flex justify-between items-center py-3 border-b border-[rgba(26,26,24,0.08)]">
                            <div className="flex items-center gap-2">
                                <span className="text-[13.5px] text-[rgba(26,26,24,0.7)] font-medium">GST</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="text-sm text-gray-500">
                                    <input
                                        type="number"
                                        value={gstPercentage}
                                        onChange={(e) => setGstPercentage(e.target.value)}
                                        className='ref-num-input w-20 text-right ml-2'
                                    /> %
                                </span>
                                <span className="text-[13.5px] font-semibold text-[#1A1A18]">₹{gstAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* SGST */}
                        <div className="flex justify-between items-center py-3 border-b border-[rgba(26,26,24,0.08)]">
                            <div className="flex items-center gap-2">
                                <span className="text-[13.5px] text-[rgba(26,26,24,0.7)] font-medium">SGST</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="text-sm text-gray-500">
                                    <input
                                        type="number"
                                        value={sgstPercentage}
                                        onChange={(e) => setSgstPercentage(e.target.value)}
                                        className='ref-num-input w-20 text-right ml-2'
                                    /> %
                                </span>
                                <span className="text-[13.5px] font-semibold text-[#1A1A18]">₹{sgstAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Grand Total */}
                        <div className="ref-summary flex justify-between items-center py-3 px-4 mt-3">
                            <span className="text-[15px] font-semibold text-[#1A1A18]">Grand Total</span>
                            <span className="text-[18px] font-semibold text-[#1A1A18]">₹{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-2">
                    <Button
                        type="button"
                        onClick={() => navigate(-1)}
                        variant="outline"
                        className="btn-cancel h-9 px-4 text-sm font-medium bg-white border border-[#da7756] text-[#da7756] hover:bg-gray-100"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary h-9 px-4 text-sm font-medium disabled:opacity-60"
                    >
                        {isSubmitting ? 'Updating...' : 'Update Booking'}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default EditFacilityBookingPage