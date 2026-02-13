import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  DollarSign,
  FileImage,
  Image,
  LampFloor,
  MessageSquareX,
  NotepadText,
  ReceiptText,
  Settings,
  Share,
  Share2,
  Tv,
  Upload,
  User,
  X,
} from "lucide-react";
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { toast } from "sonner";

// Custom theme for MUI components
const muiTheme = createTheme({
  components: {
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: "16px",
        },
      },
      defaultProps: {
        shrink: true,
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          width: "100%",
          "& .MuiOutlinedInput-root": {
            borderRadius: "6px",
            height: "36px",
            "@media (min-width: 768px)": {
              height: "45px",
            },
          },
          "& .MuiOutlinedInput-input": {
            padding: "8px 14px",
            "@media (min-width: 768px)": {
              padding: "12px 14px",
            },
          },
        },
      },
      defaultProps: {
        InputLabelProps: {
          shrink: true,
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          width: "100%",
          "& .MuiOutlinedInput-root": {
            borderRadius: "6px",
            height: "36px",
            "@media (min-width: 768px)": {
              height: "45px",
            },
          },
          "& .MuiSelect-select": {
            padding: "8px 14px",
            "@media (min-width: 768px)": {
              padding: "12px 14px",
            },
          },
        },
      },
    },
  },
});

export const AddBookingSetupClubPage = () => {
  const navigate = useNavigate();
  const baseUrl = localStorage.getItem("baseUrl");
  const token = localStorage.getItem("token");

  const coverImageRef = useRef(null);
  const bookingImageRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState<File[]>([]);
  const [selectedBookingFiles, setSelectedBookingFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    facilityName: "",
    shareable: "",
    linkToBilling: "",
    minGuarantee: "",
    isBookable: true,
    isRequest: false,
    active: "1",
    addSubFacility: false,
    postpaid: false,
    prepaid: false,
    payOnFacility: false,
    complimentary: false,
    gstPercentage: "",
    sgstPercentage: "",
    igstPercentage: "",
    bookingAllowedBefore: { day: "", hour: "", minute: "" },
    advanceBooking: { day: "", hour: "", minute: "" },
    canCancelBefore: { day: "", hour: "", minute: "" },
    facilityBookings: [
      {
        id: "default-1",
        isChecked: true,
        times: "",
        unit: "Select",
      },
    ] as Array<{
      id: string;
      isChecked: boolean;
      times: string;
      unit: string;
    }>,
    description: "",
    termsConditions: "",
    cancellationText: "",
    slots: {
      startTime: { hour: "00", minute: "00" },
      breakTimeStart: { hour: "00", minute: "00" },
      breakTimeEnd: { hour: "00", minute: "00" },
      endTime: { hour: "00", minute: "00" },
      concurrentSlots: "",
      slotBy: 15,
      wrapTime: "",
      consecutiveSlotsAllowed: true,
    },
    customSlots: [
      {
        startTime: { hour: "00", minute: "00" },
        endTime: { hour: "00", minute: "00" },
        amount: "",
      },
    ],
    chargeSetup: {
      member: { selected: false, adult: "", child: "" },
      guest: { selected: false, adult: "", child: "" },
      nonMember: { selected: false, adult: "", child: "" },
      tenant: { selected: false, adult: "", child: "" },
      minimumPersonAllowed: "1",
      maximumPersonAllowed: "1",
      refundableDeposit: "0.0",
    },
    subFacilities: [] as Array<{
      id: string;
      name: string;
      status: string;
      chargeSetup: {
        member: { selected: boolean; adult: string; child: string };
        guest: { selected: boolean; adult: string; child: string };
        nonMember: { selected: boolean; adult: string; child: string };
        tenant: { selected: boolean; adult: string; child: string };
      };
      minimumPersonAllowed: string;
      maximumPersonAllowed: string;
      gst: string;
      refundableDeposit: string;
    }>,
  });

  const [cancellationRules, setCancellationRules] = useState([
    {
      description:
        "If user cancels the booking selected hours/days prior to schedule, a percentage of the amount will be deducted",
      time: { type: "00", value: "00", day: "0" },
      deduction: "",
    },
    {
      description:
        "If user cancels the booking selected hours/days prior to schedule, a percentage of the amount will be deducted",
      time: { type: "00", value: "00", day: "0" },
      deduction: "",
    },
    {
      description:
        "If user cancels the booking selected hours/days prior to schedule, a percentage of the amount will be deducted",
      time: { type: "00", value: "00", day: "0" },
      deduction: "",
    },
  ]);

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFile(files);
  };

  const handleBookingImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedBookingFiles(files);
  };

  const removeCoverImage = (indexToRemove) => {
    setSelectedFile(selectedFile.filter((_, index) => index !== indexToRemove));
  };

  const removeBookingImage = (indexToRemove) => {
    setSelectedBookingFiles(
      selectedBookingFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  const triggerFileSelect = () => {
    coverImageRef.current?.click();
  };

  const triggerBookingImgSelect = () => {
    bookingImageRef.current?.click();
  };

  const validateForm = () => {
    if (!formData.facilityName) {
      toast.error("Please enter Facility Name");
      return false;
    } else if (
      formData.facilityBookings.length === 0 ||
      !formData.facilityBookings.some((fb) => fb.isChecked && fb.times)
    ) {
      toast.error("Please add at least one facility booking rule");
      return false;
    } else if (!formData.termsConditions) {
      toast.error("Please enter Terms and Conditions");
      return false;
    } else if (!formData.cancellationText) {
      toast.error("Please enter Cancellation Policies");
      return false;
    }

    // Validate slots
    const slot = formData.slots;

    const startHour = parseInt(slot.startTime.hour);
    const breakStartHour = parseInt(slot.breakTimeStart.hour);
    const breakEndHour = parseInt(slot.breakTimeEnd.hour);
    const endHour = parseInt(slot.endTime.hour);

    if (slot.startTime.hour !== "00") {
      if (
        slot.breakTimeStart.hour === "00" ||
        slot.breakTimeEnd.hour === "00" ||
        slot.endTime.hour === "00"
      ) {
        toast.error(
          `Slot: All subsequent time fields must be selected when Start Time is set`
        );
        return false;
      }

      if (breakStartHour < startHour) {
        toast.error(
          `Slot: Break Time Start hour must be greater than or equal to Start Time hour`
        );
        return false;
      }
      if (breakEndHour < startHour) {
        toast.error(
          `Slot: Break Time End hour must be greater than or equal to Start Time hour`
        );
        return false;
      }
      if (endHour < startHour) {
        toast.error(
          `Slot: End Time hour must be greater than or equal to Start Time hour`
        );
        return false;
      }
    }

    if (slot.breakTimeStart.hour !== "00") {
      if (slot.breakTimeEnd.hour === "00" || slot.endTime.hour === "00") {
        toast.error(
          `Slot: Break Time End and End Time must be selected when Break Time Start is set`
        );
        return false;
      }

      if (breakEndHour < breakStartHour) {
        toast.error(
          `Slot: Break Time End hour must be greater than or equal to Break Time Start hour`
        );
        return false;
      }
      if (endHour < breakStartHour) {
        toast.error(
          `Slot: End Time hour must be greater than or equal to Break Time Start hour`
        );
        return false;
      }
    }

    if (slot.breakTimeEnd.hour !== "00") {
      if (slot.endTime.hour === "00") {
        toast.error(
          `Slot: End Time must be selected when Break Time End is set`
        );
        return false;
      }

      if (endHour < breakEndHour) {
        toast.error(
          `Slot: End Time hour must be greater than or equal to Break Time End hour`
        );
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();

      // Basic Facility Info
      formDataToSend.append(
        "facility_setup[fac_type]",
        formData.isBookable ? "bookable" : "request"
      );
      formDataToSend.append("facility_setup[fac_name]", formData.facilityName);
      formDataToSend.append("facility_setup[active]", formData.active);
      formDataToSend.append("facility_setup[shareable]", formData.shareable);
      formDataToSend.append(
        "facility_setup[link_to_billing]",
        formData.linkToBilling
      );
      formDataToSend.append(
        "facility_setup[min_guarantee]",
        formData.minGuarantee
      );
      formDataToSend.append(
        "facility_setup[sub_facility_enabled]",
        formData.addSubFacility ? "1" : "0"
      );

      // Charge Setup - Member charges and boolean
      formDataToSend.append(
        "facility_setup[facility_charge_attributes][member]",
        formData.chargeSetup.member.selected ? "true" : "false"
      );
      if (formData.chargeSetup.member.selected) {
        if (formData.chargeSetup.member.adult) {
          formDataToSend.append(
            "facility_setup[facility_charge_attributes][adult_member]",
            "true"
          );
          formDataToSend.append(
            "facility_setup[facility_charge_attributes][adult_member_charge]",
            formData.chargeSetup.member.adult || "0"
          );
        }
        if (formData.chargeSetup.member.child) {
          formDataToSend.append(
            "facility_setup[facility_charge_attributes][child_member]",
            "true"
          );
          formDataToSend.append(
            "facility_setup[facility_charge_attributes][child_member_charge]",
            formData.chargeSetup.member.child || "0"
          );
        }
      }

      // Charge Setup - Guest charges and boolean
      formDataToSend.append(
        "facility_setup[facility_charge_attributes][guest]",
        formData.chargeSetup.guest.selected ? "true" : "false"
      );
      if (formData.chargeSetup.guest.selected) {
        if (formData.chargeSetup.guest.adult) {
          formDataToSend.append(
            "facility_setup[facility_charge_attributes][adult_guest]",
            "true"
          );
          formDataToSend.append(
            "facility_setup[facility_charge_attributes][adult_guest_charge]",
            formData.chargeSetup.guest.adult || "0"
          );
        }
        if (formData.chargeSetup.guest.child) {
          formDataToSend.append(
            "facility_setup[facility_charge_attributes][child_guest]",
            "true"
          );
          formDataToSend.append(
            "facility_setup[facility_charge_attributes][child_guest_charge]",
            formData.chargeSetup.guest.child || "0"
          );
        }
      }

      // Charge Setup - Non-member charges and boolean
      formDataToSend.append(
        "facility_setup[facility_charge_attributes][non_member]",
        formData.chargeSetup.nonMember.selected ? "true" : "false"
      );
      if (formData.chargeSetup.nonMember.selected) {
        if (formData.chargeSetup.nonMember.adult) {
          formDataToSend.append(
            "facility_setup[facility_charge_attributes][adult_non_member]",
            "true"
          );
          formDataToSend.append(
            "facility_setup[facility_charge_attributes][adult_non_member_charge]",
            formData.chargeSetup.nonMember.adult || "0"
          );
        }
        if (formData.chargeSetup.nonMember.child) {
          formDataToSend.append(
            "facility_setup[facility_charge_attributes][child_non_member]",
            "true"
          );
          formDataToSend.append(
            "facility_setup[facility_charge_attributes][child_non_member_charge]",
            formData.chargeSetup.nonMember.child || "0"
          );
        }
      }

      // Charge Setup - Tenent charges and boolean
      formDataToSend.append(
        "facility_setup[facility_charge_attributes][tenant]",
        formData.chargeSetup.tenant.selected ? "true" : "false"
      );
      if (formData.chargeSetup.tenant.selected) {
        if (formData.chargeSetup.tenant.adult) {
          formDataToSend.append(
            "facility_setup[facility_charge_attributes][adult_tenant]",
            "true"
          );
          formDataToSend.append(
            "facility_setup[facility_charge_attributes][adult_tenant_charge]",
            formData.chargeSetup.tenant.adult || "0"
          );
        }
        if (formData.chargeSetup.tenant.child) {
          formDataToSend.append(
            "facility_setup[facility_charge_attributes][child_tenant]",
            "true"
          );
          formDataToSend.append(
            "facility_setup[facility_charge_attributes][child_tenant_charge]",
            formData.chargeSetup.tenant.child || "0"
          );
        }
      }
      // Charge Setup - Person limits and GST
      formDataToSend.append(
        "facility_setup[min_people]",
        formData.chargeSetup.minimumPersonAllowed || "1"
      );
      formDataToSend.append(
        "facility_setup[max_people]",
        formData.chargeSetup.maximumPersonAllowed || "1"
      );

      if (formData.isRequest) {
        formDataToSend.append(
          "facility_setup[deposit]",
          formData.chargeSetup.refundableDeposit
        );
      }

      if (formData.addSubFacility) {
        formData.subFacilities.forEach((subFacility, idx) => {
          formDataToSend.append(
            `facility_setup[sub_facilities_attributes][${idx}][name]`,
            subFacility.name
          );

          formDataToSend.append(
            `facility_setup[sub_facilities_attributes][${idx}][active]`,
            subFacility.status
          );

          formDataToSend.append(
            `facility_setup[sub_facilities_attributes][${idx}][facility_charge_attributes][member]`,
            subFacility.chargeSetup.member.selected ? "true" : "false"
          );

          if (subFacility.chargeSetup.member.selected) {
            if (subFacility.chargeSetup.member.adult) {
              formDataToSend.append(
                `facility_setup[sub_facilities_attributes][${idx}][facility_charge_attributes][adult_member]`,
                "true"
              );
              formDataToSend.append(
                `facility_setup[sub_facilities_attributes][${idx}][facility_charge_attributes][adult_member_charge]`,
                subFacility.chargeSetup.member.adult
              );
            }
            if (subFacility.chargeSetup.member.child) {
              formDataToSend.append(
                `facility_setup[sub_facilities_attributes][${idx}][facility_charge_attributes][child_member]`,
                "true"
              );
              formDataToSend.append(
                `facility_setup[sub_facilities_attributes][${idx}][facility_charge_attributes][child_member_charge]`,
                subFacility.chargeSetup.member.child
              );
            }
          }

          formDataToSend.append(
            `facility_setup[sub_facilities_attributes][${idx}][facility_charge_attributes][guest]`,
            subFacility.chargeSetup.guest.selected ? "true" : "false"
          );

          if (subFacility.chargeSetup.guest.selected) {
            if (subFacility.chargeSetup.guest.adult) {
              formDataToSend.append(
                `facility_setup[sub_facilities_attributes][${idx}][facility_charge_attributes][adult_guest]`,
                "true"
              );
              formDataToSend.append(
                `facility_setup[sub_facilities_attributes][${idx}][facility_charge_attributes][adult_guest_charge]`,
                subFacility.chargeSetup.guest.adult
              );
            }
            if (subFacility.chargeSetup.guest.child) {
              formDataToSend.append(
                `facility_setup[sub_facilities_attributes][${idx}][facility_charge_attributes][child_guest]`,
                "true"
              );
              formDataToSend.append(
                `facility_setup[sub_facilities_attributes][${idx}][facility_charge_attributes][child_guest_charge]`,
                subFacility.chargeSetup.guest.child
              );
            }
          }

          formDataToSend.append(
            `facility_setup[sub_facilities_attributes][${idx}][facility_charge_attributes][non_member]`,
            subFacility.chargeSetup.nonMember.selected ? "true" : "false"
          );

          if (subFacility.chargeSetup.nonMember.selected) {
            if (subFacility.chargeSetup.nonMember.adult) {
              formDataToSend.append(
                `facility_setup[sub_facilities_attributes][${idx}][facility_charge_attributes][adult_non_member]`,
                "true"
              );
              formDataToSend.append(
                `facility_setup[sub_facilities_attributes][${idx}][facility_charge_attributes][adult_non_member_charge]`,
                subFacility.chargeSetup.nonMember.adult
              );
            }
            if (subFacility.chargeSetup.nonMember.child) {
              formDataToSend.append(
                `facility_setup[sub_facilities_attributes][${idx}][facility_charge_attributes][child_non_member]`,
                "true"
              );
              formDataToSend.append(
                `facility_setup[sub_facilities_attributes][${idx}][facility_charge_attributes][child_non_member_charge]`,
                subFacility.chargeSetup.nonMember.child
              );
            }
          }

          formDataToSend.append(
            `facility_setup[sub_facilities_attributes][${idx}][facility_charge_attributes][tenant]`,
            subFacility.chargeSetup.tenant.selected ? "true" : "false"
          );

          if (subFacility.chargeSetup.tenant.selected) {
            if (subFacility.chargeSetup.tenant.adult) {
              formDataToSend.append(
                `facility_setup[sub_facilities_attributes][${idx}][facility_charge_attributes][adult_tenant]`,
                "true"
              );
              formDataToSend.append(
                `facility_setup[sub_facilities_attributes][${idx}][facility_charge_attributes][adult_tenant_charge]`,
                subFacility.chargeSetup.tenant.adult
              );
            }
            if (subFacility.chargeSetup.tenant.child) {
              formDataToSend.append(
                `facility_setup[sub_facilities_attributes][${idx}][facility_charge_attributes][child_tenant]`,
                "true"
              );
              formDataToSend.append(
                `facility_setup[sub_facilities_attributes][${idx}][facility_charge_attributes][child_tenant_charge]`,
                subFacility.chargeSetup.tenant.child
              );
            }
          }

          formDataToSend.append(
            `facility_setup[sub_facilities_attributes][${idx}][min_people]`,
            subFacility.minimumPersonAllowed || "1"
          );
          formDataToSend.append(
            `facility_setup[sub_facilities_attributes][${idx}][max_people]`,
            subFacility.maximumPersonAllowed || "1"
          );

          if (formData.isBookable) {
            formDataToSend.append(
              `facility_setup[sub_facilities_attributes][${idx}][gst]`,
              subFacility.gst || "0.0"
            );
          }

          if (formData.isRequest) {
            formDataToSend.append(
              `facility_setup[sub_facilities_attributes][${idx}][deposit]`,
              subFacility.refundableDeposit
            );
          }
        });
      }

      // Facility Slots
      const slot = formData.slots;
      formDataToSend.append(`facility_slots[][slot_no]`, "1");
      formDataToSend.append(`facility_slots[][dayofweek]`, "");
      formDataToSend.append(
        `facility_slots[][start_hour]`,
        slot.startTime.hour
      );
      formDataToSend.append(
        `facility_slots[][start_min]`,
        slot.startTime.minute
      );
      formDataToSend.append(
        `facility_slots[][break_start_hour]`,
        slot.breakTimeStart.hour
      );
      formDataToSend.append(
        `facility_slots[][break_start_min]`,
        slot.breakTimeStart.minute
      );
      formDataToSend.append(
        `facility_slots[][break_end_hour]`,
        slot.breakTimeEnd.hour
      );
      formDataToSend.append(
        `facility_slots[][break_end_min]`,
        slot.breakTimeEnd.minute
      );
      formDataToSend.append(`facility_slots[][end_hour]`, slot.endTime.hour);
      formDataToSend.append(`facility_slots[][end_min]`, slot.endTime.minute);
      formDataToSend.append(
        `facility_slots[][max_bookings]`,
        slot.concurrentSlots || "1"
      );
      formDataToSend.append(
        `facility_slots[][breakminutes]`,
        slot.slotBy.toString()
      );
      formDataToSend.append(
        `facility_slots[][wrap_time]`,
        slot.wrapTime || "0"
      );

      formDataToSend.append(
        `facility_setup[consecutive_slot]`,
        formData.slots.consecutiveSlotsAllowed ? "1" : "0"
      );

      if (formData.isRequest) {
        formData.customSlots.forEach((slot, idx) => {
          formDataToSend.append(
            `facility_request_slots[][slot_no]`,
            String(idx + 1)
          );

          formDataToSend.append(
            `facility_request_slots[][start_hour]`,
            slot.startTime.hour
          );
          formDataToSend.append(
            `facility_request_slots[][start_min]`,
            slot.startTime.minute
          );
          formDataToSend.append(
            `facility_request_slots[][end_hour]`,
            slot.endTime.hour
          );
          formDataToSend.append(
            `facility_request_slots[][end_min]`,
            slot.endTime.minute
          );

          formDataToSend.append(
            `facility_request_slots[][tentative_price]`,
            slot.amount
          );
        });
      }

      // Booking Window Configs
      formDataToSend.append(
        "book_before_day",
        formData.bookingAllowedBefore.day
      );
      formDataToSend.append(
        "book_before_hour",
        formData.bookingAllowedBefore.hour
      );
      formDataToSend.append(
        "book_before_min",
        formData.bookingAllowedBefore.minute
      );
      formDataToSend.append("advance_booking_day", formData.advanceBooking.day);
      formDataToSend.append(
        "advance_booking_hour",
        formData.advanceBooking.hour
      );
      formDataToSend.append(
        "advance_booking_min",
        formData.advanceBooking.minute
      );
      formDataToSend.append("cancel_day", formData.canCancelBefore.day);
      formDataToSend.append("cancel_hour", formData.canCancelBefore.hour);
      formDataToSend.append("cancel_min", formData.canCancelBefore.minute);

      formData.facilityBookings.forEach((fb, idx) => {
        formDataToSend.append(
          `facility_setup[facility_booking_rules_attributes][${idx}][user_society_id]`,
          localStorage.getItem("selectedUserSociety")
        );

        formDataToSend.append(
          `facility_setup[facility_booking_rules_attributes][${idx}][active]`,
          fb.isChecked ? "1" : "0"
        );

        formDataToSend.append(
          `facility_setup[facility_booking_rules_attributes][${idx}][enumerator]`,
          fb.times
        );

        formDataToSend.append(
          `facility_setup[facility_booking_rules_attributes][${idx}][level]`,
          fb.unit
        );
      });

      formDataToSend.append(
        "facility_setup[postpaid]",
        formData.postpaid ? "1" : "0"
      );
      formDataToSend.append(
        "facility_setup[prepaid]",
        formData.prepaid ? "1" : "0"
      );
      formDataToSend.append(
        "facility_setup[pay_on_facility]",
        formData.payOnFacility ? "1" : "0"
      );
      formDataToSend.append(
        "facility_setup[complementary]",
        formData.complimentary ? "1" : "0"
      );
      formDataToSend.append("facility_setup[gst]", formData.gstPercentage);
      formDataToSend.append("facility_setup[sgst]", formData.sgstPercentage);
      formDataToSend.append("facility_setup[igst]", formData.igstPercentage);

      selectedFile.forEach((file) => {
        formDataToSend.append(`cover_image`, file);
      });

      selectedBookingFiles.forEach((file) => {
        formDataToSend.append(`attachments[]`, file);
      });

      formDataToSend.append(
        "facility_setup[description]",
        formData.termsConditions || ""
      );
      formDataToSend.append(
        "facility_setup[terms]",
        formData.termsConditions || ""
      );

      formDataToSend.append(
        "facility_setup[cutoff_day]",
        cancellationRules[0].time.day
      );
      formDataToSend.append(
        "facility_setup[cutoff_hr]",
        cancellationRules[0].time.type
      );
      formDataToSend.append(
        "facility_setup[cutoff_min]",
        cancellationRules[0].time.value
      );
      formDataToSend.append(
        "facility_setup[return_percentage]",
        cancellationRules[0].deduction
      );
      formDataToSend.append(
        "facility_setup[cutoff_second_day]",
        cancellationRules[1].time.day
      );
      formDataToSend.append(
        "facility_setup[cutoff_second_hr]",
        cancellationRules[1].time.type
      );
      formDataToSend.append(
        "facility_setup[cutoff_second_min]",
        cancellationRules[1].time.value
      );
      formDataToSend.append(
        "facility_setup[return_percentage_second]",
        cancellationRules[1].deduction
      );
      formDataToSend.append(
        "facility_setup[cutoff_third_day]",
        cancellationRules[2].time.day
      );
      formDataToSend.append(
        "facility_setup[cutoff_third_hr]",
        cancellationRules[2].time.type
      );
      formDataToSend.append(
        "facility_setup[cutoff_third_min]",
        cancellationRules[2].time.value
      );
      formDataToSend.append(
        "facility_setup[return_percentage_third]",
        cancellationRules[2].deduction
      );

      formDataToSend.append(
        "facility_setup[cancellation_policy]",
        formData.cancellationText || ""
      );

      formDataToSend.append("facility_setup[book_by]", "slot");
      formDataToSend.append(
        "facility_setup[create_by]",
        JSON.parse(localStorage.getItem("user")).id
      );

      const response = await fetch(
        `https://${baseUrl}/crm/admin/facility_setups.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        }
      );

      if (response.ok) {
        toast.success("Booking setup saved successfully");
        navigate(-1);
      } else {
        console.error("Failed to save booking setup:", response.statusText);
      }
    } catch (error) {
      console.error("Error saving booking setup:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  const addSubFacility = () => {
    const newSubFacility = {
      id: Date.now().toString(),
      name: "",
      status: "true",
      chargeSetup: {
        member: { selected: false, adult: "", child: "" },
        guest: { selected: false, adult: "", child: "" },
        nonMember: { selected: false, adult: "", child: "" },
        tenant: { selected: false, adult: "", child: "" },
      },
      minimumPersonAllowed: "1",
      maximumPersonAllowed: "1",
      gst: "",
      refundableDeposit: "0.0",
    };
    setFormData({
      ...formData,
      subFacilities: [...formData.subFacilities, newSubFacility],
    });
  };

  const updateSubFacility = (id: string, updatedData: any) => {
    setFormData({
      ...formData,
      subFacilities: formData.subFacilities.map((sf) =>
        sf.id === id ? { ...sf, ...updatedData } : sf
      ),
    });
  };

  const deleteSubFacility = (id: string) => {
    setFormData({
      ...formData,
      subFacilities: formData.subFacilities.filter((sf) => sf.id !== id),
    });
  };

  const addFacilityBooking = () => {
    const newFacilityBooking = {
      id: Date.now().toString(),
      isChecked: true,
      times: "",
      unit: "Select",
    };
    setFormData({
      ...formData,
      facilityBookings: [...formData.facilityBookings, newFacilityBooking],
    });
  };

  const updateFacilityBooking = (id: string, updatedData: any) => {
    setFormData({
      ...formData,
      facilityBookings: formData.facilityBookings.map((fb) =>
        fb.id === id ? { ...fb, ...updatedData } : fb
      ),
    });
  };

  const deleteFacilityBooking = (id: string) => {
    setFormData({
      ...formData,
      facilityBookings: formData.facilityBookings.filter((fb) => fb.id !== id),
    });
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <div className="p-6 bg-white">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
              <p className="text-gray-600 text-sm">Back</p>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border-2 p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12  h-12  rounded-full flex items-center justify-center bg-[#E5E0D3] text-[#C72030]">
                <User className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-semibold uppercase text-[#1A1A1A]">
                BASIC INFo
              </h3>
            </div>

            <div className="space-y-6 py-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <TextField
                  label="Facility Name"
                  placeholder="Enter Facility Name"
                  value={formData.facilityName}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow letters and spaces, no numbers
                    if (/^[a-zA-Z\s]*$/.test(value)) {
                      setFormData({ ...formData, facilityName: value });
                    }
                  }}
                  variant="outlined"
                  required
                  InputLabelProps={{
                    classes: {
                      asterisk: "text-red-500", // Tailwind class for red color
                    },
                    shrink: true,
                  }}
                />

                <FormControl>
                  <InputLabel className="bg-[#F6F7F7]">Shareable</InputLabel>
                  <Select
                    value={formData.shareable}
                    onChange={(e) =>
                      setFormData({ ...formData, shareable: e.target.value })
                    }
                    label="Shareable"
                    displayEmpty
                  >
                    <MenuItem value="">Select</MenuItem>
                    <MenuItem value="Yes">Yes</MenuItem>
                    <MenuItem value="No">No</MenuItem>
                  </Select>
                </FormControl>

                <FormControl>
                  <InputLabel className="bg-[#F6F7F7]">
                    Link to billing
                  </InputLabel>
                  <Select
                    value={formData.linkToBilling}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        linkToBilling: e.target.value,
                      })
                    }
                    label="Link to billing"
                    displayEmpty
                  >
                    <MenuItem value="">Select</MenuItem>
                    <MenuItem value="Yes">Yes</MenuItem>
                    <MenuItem value="No">No</MenuItem>
                  </Select>
                </FormControl>

                {formData.isRequest && (
                  <FormControl>
                    <InputLabel className="bg-[#F6F7F7]">
                      Min.guarantee
                    </InputLabel>
                    <Select
                      value={formData.minGuarantee}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minGuarantee: e.target.value,
                        })
                      }
                      label="Min.guarantee"
                      displayEmpty
                    >
                      <MenuItem value="">Select</MenuItem>
                      <MenuItem value="Yes">Yes</MenuItem>
                      <MenuItem value="No">No</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </div>

              <div className="flex gap-6 px-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="bookable"
                    name="type"
                    checked={formData.isBookable}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        isBookable: true,
                        isRequest: false,
                      })
                    }
                    className="text-blue-600"
                  />
                  <label htmlFor="bookable">Bookable</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="request"
                    name="type"
                    checked={formData.isRequest}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        isBookable: false,
                        isRequest: true,
                      })
                    }
                    className="text-blue-600"
                  />
                  <label htmlFor="request">Request</label>
                </div>

                <div className="">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.addSubFacility}
                      onChange={(e) => {
                        if (
                          e.target.checked &&
                          formData.subFacilities.length === 0
                        ) {
                          // Create one default sub-facility when toggled on
                          const newSubFacility = {
                            id: Date.now().toString(),
                            name: "",
                            status: "true",
                            chargeSetup: {
                              member: { selected: false, adult: "", child: "" },
                              guest: { selected: false, adult: "", child: "" },
                              nonMember: {
                                selected: false,
                                adult: "",
                                child: "",
                              },
                              tenant: { selected: false, adult: "", child: "" },
                            },
                            minimumPersonAllowed: "1",
                            maximumPersonAllowed: "1",
                            gst: "0.0",
                            refundableDeposit: "0.0",
                          };
                          setFormData({
                            ...formData,
                            addSubFacility: e.target.checked,
                            subFacilities: [newSubFacility],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            addSubFacility: e.target.checked,
                          });
                        }
                      }}
                      // disabled={updatingStatus}
                      sx={{
                        "& .MuiSwitch-switchBase": {
                          color: "#ef4444",
                          "&.Mui-checked": {
                            color: "#22c55e",
                          },
                          "&.Mui-checked + .MuiSwitch-track": {
                            backgroundColor: "#22c55e",
                          },
                        },
                        "& .MuiSwitch-track": {
                          backgroundColor: "#ef4444",
                        },
                      }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Add Sub-Facility
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {formData.addSubFacility ? (
            <div className="bg-white rounded-lg border-2 p-6 space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#E5E0D3] text-[#C72030]">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-semibold uppercase text-[#1A1A1A]">
                    Sub Facilities
                  </h3>
                </div>

                <Button
                  onClick={addSubFacility}
                  className="bg-[#C72030] hover:bg-[#A01828] text-white"
                >
                  + Add
                </Button>
              </div>

              {/* Display all sub-facilities */}
              {formData.subFacilities.map((subFacility) => (
                <div key={subFacility.id} className="border-b-2 pb-6 mb-6">
                  {/* Header with delete button */}
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-semibold text-[#1A1A1A]">
                      Sub-Facility Form
                    </h4>
                    <button
                      onClick={() => deleteSubFacility(subFacility.id)}
                      className="bg-red-600 text-white w-8 h-8 flex items-center justify-center rounded hover:bg-red-700"
                    >
                      ×
                    </button>
                  </div>

                  {/* Sub-Facility Name and Status */}
                  <div className="flex items-center gap-4 mb-6">
                    <TextField
                      label="Sub-Facility Name"
                      placeholder="Enter Sub-Facility Name"
                      value={subFacility.name}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow letters and spaces, no numbers
                        if (/^[a-zA-Z\s]*$/.test(value)) {
                          updateSubFacility(subFacility.id, { name: value });
                        }
                      }}
                      variant="outlined"
                      required
                      InputLabelProps={{
                        classes: {
                          asterisk: "text-red-500",
                        },
                        shrink: true,
                      }}
                    />
                    <FormControl>
                      <InputLabel className="bg-[#F6F7F7]">Active</InputLabel>
                      <Select
                        value={subFacility.status}
                        onChange={(e) =>
                          updateSubFacility(subFacility.id, {
                            status: e.target.value,
                          })
                        }
                        label="Active"
                        displayEmpty
                      >
                        <MenuItem value="">Select</MenuItem>
                        <MenuItem value="true">Active</MenuItem>
                        <MenuItem value="false">Inactive</MenuItem>
                      </Select>
                    </FormControl>
                  </div>

                  {formData.isBookable && (
                    <div className="overflow-x-auto mb-6">
                      <table className="w-full border">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                              Member Type
                            </th>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                              Adult
                            </th>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                              Child
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={
                                    subFacility.chargeSetup.member.selected
                                  }
                                  onCheckedChange={(checked) =>
                                    updateSubFacility(subFacility.id, {
                                      chargeSetup: {
                                        ...subFacility.chargeSetup,
                                        member: {
                                          ...subFacility.chargeSetup.member,
                                          selected: !!checked,
                                        },
                                      },
                                    })
                                  }
                                />
                                <span>Member</span>
                              </div>
                            </td>
                            <td className="border border-gray-300 px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <Checkbox
                                  checked={
                                    !!subFacility.chargeSetup.member.adult
                                  }
                                  onCheckedChange={(checked) => {
                                    if (!checked) {
                                      updateSubFacility(subFacility.id, {
                                        chargeSetup: {
                                          ...subFacility.chargeSetup,
                                          member: {
                                            ...subFacility.chargeSetup.member,
                                            adult: "",
                                          },
                                        },
                                      });
                                    }
                                  }}
                                />
                                <TextField
                                  size="small"
                                  variant="outlined"
                                  value={subFacility.chargeSetup.member.adult}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (
                                      value === "" ||
                                      /^\d*\.?\d{0,2}$/.test(value)
                                    ) {
                                      updateSubFacility(subFacility.id, {
                                        chargeSetup: {
                                          ...subFacility.chargeSetup,
                                          member: {
                                            ...subFacility.chargeSetup.member,
                                            adult: value,
                                          },
                                        },
                                      });
                                    }
                                  }}
                                  className="w-full max-w-[200px]"
                                />
                              </div>
                            </td>
                            <td className="border border-gray-300 px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <Checkbox
                                  checked={
                                    !!subFacility.chargeSetup.member.child
                                  }
                                  onCheckedChange={(checked) => {
                                    updateSubFacility(subFacility.id, {
                                      chargeSetup: {
                                        ...subFacility.chargeSetup,
                                        member: {
                                          ...subFacility.chargeSetup.member,
                                          child: checked
                                            ? subFacility.chargeSetup.member
                                              .child || ""
                                            : "",
                                        },
                                      },
                                    });
                                  }}
                                />
                                <TextField
                                  size="small"
                                  variant="outlined"
                                  value={subFacility.chargeSetup.member.child}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (
                                      value === "" ||
                                      /^\d*\.?\d{0,2}$/.test(value)
                                    ) {
                                      updateSubFacility(subFacility.id, {
                                        chargeSetup: {
                                          ...subFacility.chargeSetup,
                                          member: {
                                            ...subFacility.chargeSetup.member,
                                            child: value,
                                          },
                                        },
                                      });
                                    }
                                  }}
                                  className="w-full max-w-[200px]"
                                />
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={
                                    subFacility.chargeSetup.guest.selected
                                  }
                                  onCheckedChange={(checked) =>
                                    updateSubFacility(subFacility.id, {
                                      chargeSetup: {
                                        ...subFacility.chargeSetup,
                                        guest: {
                                          ...subFacility.chargeSetup.guest,
                                          selected: !!checked,
                                        },
                                      },
                                    })
                                  }
                                />
                                <span>Guest</span>
                              </div>
                            </td>
                            <td className="border border-gray-300 px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <Checkbox
                                  checked={
                                    !!subFacility.chargeSetup.guest.adult
                                  }
                                  onCheckedChange={(checked) => {
                                    if (!checked) {
                                      updateSubFacility(subFacility.id, {
                                        chargeSetup: {
                                          ...subFacility.chargeSetup,
                                          guest: {
                                            ...subFacility.chargeSetup.guest,
                                            adult: "",
                                          },
                                        },
                                      });
                                    }
                                  }}
                                />
                                <TextField
                                  size="small"
                                  variant="outlined"
                                  value={subFacility.chargeSetup.guest.adult}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (
                                      value === "" ||
                                      /^\d*\.?\d{0,2}$/.test(value)
                                    ) {
                                      updateSubFacility(subFacility.id, {
                                        chargeSetup: {
                                          ...subFacility.chargeSetup,
                                          guest: {
                                            ...subFacility.chargeSetup.guest,
                                            adult: value,
                                          },
                                        },
                                      });
                                    }
                                  }}
                                  className="w-full max-w-[200px]"
                                />
                              </div>
                            </td>
                            <td className="border border-gray-300 px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <Checkbox
                                  checked={
                                    !!subFacility.chargeSetup.guest.child
                                  }
                                  onCheckedChange={(checked) => {
                                    updateSubFacility(subFacility.id, {
                                      chargeSetup: {
                                        ...subFacility.chargeSetup,
                                        guest: {
                                          ...subFacility.chargeSetup.guest,
                                          child: checked
                                            ? subFacility.chargeSetup.guest
                                              .child || ""
                                            : "",
                                        },
                                      },
                                    });
                                  }}
                                />
                                <TextField
                                  size="small"
                                  variant="outlined"
                                  value={subFacility.chargeSetup.guest.child}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (
                                      value === "" ||
                                      /^\d*\.?\d{0,2}$/.test(value)
                                    ) {
                                      updateSubFacility(subFacility.id, {
                                        chargeSetup: {
                                          ...subFacility.chargeSetup,
                                          guest: {
                                            ...subFacility.chargeSetup.guest,
                                            child: value,
                                          },
                                        },
                                      });
                                    }
                                  }}
                                  className="w-full max-w-[200px]"
                                />
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={
                                    subFacility.chargeSetup.nonMember.selected
                                  }
                                  onCheckedChange={(checked) =>
                                    updateSubFacility(subFacility.id, {
                                      chargeSetup: {
                                        ...subFacility.chargeSetup,
                                        nonMember: {
                                          ...subFacility.chargeSetup.nonMember,
                                          selected: !!checked,
                                        },
                                      },
                                    })
                                  }
                                />
                                <span>Non-Member</span>
                              </div>
                            </td>
                            <td className="border border-gray-300 px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <Checkbox
                                  checked={
                                    !!subFacility.chargeSetup.nonMember.adult
                                  }
                                  onCheckedChange={(checked) => {
                                    if (!checked) {
                                      updateSubFacility(subFacility.id, {
                                        chargeSetup: {
                                          ...subFacility.chargeSetup,
                                          nonMember: {
                                            ...subFacility.chargeSetup
                                              .nonMember,
                                            adult: "",
                                          },
                                        },
                                      });
                                    }
                                  }}
                                />
                                <TextField
                                  size="small"
                                  variant="outlined"
                                  value={
                                    subFacility.chargeSetup.nonMember.adult
                                  }
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (
                                      value === "" ||
                                      /^\d*\.?\d{0,2}$/.test(value)
                                    ) {
                                      updateSubFacility(subFacility.id, {
                                        chargeSetup: {
                                          ...subFacility.chargeSetup,
                                          nonMember: {
                                            ...subFacility.chargeSetup
                                              .nonMember,
                                            adult: value,
                                          },
                                        },
                                      });
                                    }
                                  }}
                                  className="w-full max-w-[200px]"
                                />
                              </div>
                            </td>
                            <td className="border border-gray-300 px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <Checkbox
                                  checked={
                                    !!subFacility.chargeSetup.nonMember.child
                                  }
                                  onCheckedChange={(checked) => {
                                    updateSubFacility(subFacility.id, {
                                      chargeSetup: {
                                        ...subFacility.chargeSetup,
                                        nonMember: {
                                          ...subFacility.chargeSetup.nonMember,
                                          child: checked
                                            ? subFacility.chargeSetup.nonMember
                                              .child || ""
                                            : "",
                                        },
                                      },
                                    });
                                  }}
                                />
                                <TextField
                                  size="small"
                                  variant="outlined"
                                  value={
                                    subFacility.chargeSetup.nonMember.child
                                  }
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (
                                      value === "" ||
                                      /^\d*\.?\d{0,2}$/.test(value)
                                    ) {
                                      updateSubFacility(subFacility.id, {
                                        chargeSetup: {
                                          ...subFacility.chargeSetup,
                                          nonMember: {
                                            ...subFacility.chargeSetup
                                              .nonMember,
                                            child: value,
                                          },
                                        },
                                      });
                                    }
                                  }}
                                  className="w-full max-w-[200px]"
                                />
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={
                                    subFacility.chargeSetup.tenant.selected
                                  }
                                  onCheckedChange={(checked) =>
                                    updateSubFacility(subFacility.id, {
                                      chargeSetup: {
                                        ...subFacility.chargeSetup,
                                        tenant: {
                                          ...subFacility.chargeSetup.tenant,
                                          selected: !!checked,
                                        },
                                      },
                                    })
                                  }
                                />
                                <span>Tenant</span>
                              </div>
                            </td>
                            <td className="border border-gray-300 px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <Checkbox
                                  checked={
                                    !!subFacility.chargeSetup.tenant.adult
                                  }
                                  onCheckedChange={(checked) => {
                                    if (!checked) {
                                      updateSubFacility(subFacility.id, {
                                        chargeSetup: {
                                          ...subFacility.chargeSetup,
                                          tenant: {
                                            ...subFacility.chargeSetup.tenant,
                                            adult: "",
                                          },
                                        },
                                      });
                                    }
                                  }}
                                />
                                <TextField
                                  size="small"
                                  variant="outlined"
                                  value={subFacility.chargeSetup.tenant.adult}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (
                                      value === "" ||
                                      /^\d*\.?\d{0,2}$/.test(value)
                                    ) {
                                      updateSubFacility(subFacility.id, {
                                        chargeSetup: {
                                          ...subFacility.chargeSetup,
                                          tenant: {
                                            ...subFacility.chargeSetup.tenant,
                                            adult: value,
                                          },
                                        },
                                      });
                                    }
                                  }}
                                  className="w-full max-w-[200px]"
                                />
                              </div>
                            </td>
                            <td className="border border-gray-300 px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <Checkbox
                                  checked={
                                    !!subFacility.chargeSetup.tenant.child
                                  }
                                  onCheckedChange={(checked) => {
                                    updateSubFacility(subFacility.id, {
                                      chargeSetup: {
                                        ...subFacility.chargeSetup,
                                        tenant: {
                                          ...subFacility.chargeSetup.tenant,
                                          child: checked
                                            ? subFacility.chargeSetup.tenant
                                              .child || ""
                                            : "",
                                        },
                                      },
                                    });
                                  }}
                                />
                                <TextField
                                  size="small"
                                  variant="outlined"
                                  value={subFacility.chargeSetup.tenant.child}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (
                                      value === "" ||
                                      /^\d*\.?\d{0,2}$/.test(value)
                                    ) {
                                      updateSubFacility(subFacility.id, {
                                        chargeSetup: {
                                          ...subFacility.chargeSetup,
                                          tenant: {
                                            ...subFacility.chargeSetup.tenant,
                                            child: value,
                                          },
                                        },
                                      });
                                    }
                                  }}
                                  className="w-full max-w-[200px]"
                                />
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Min/Max Person Allowed */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-semibold whitespace-nowrap">
                        Minimum Person Allowed
                      </label>
                      <TextField
                        size="small"
                        variant="outlined"
                        value={subFacility.minimumPersonAllowed}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || /^[1-9]\d*$/.test(value)) {
                            updateSubFacility(subFacility.id, {
                              minimumPersonAllowed: value,
                            });
                            if (
                              subFacility.maximumPersonAllowed &&
                              parseInt(subFacility.maximumPersonAllowed) <=
                              parseInt(value)
                            ) {
                              toast.error(
                                "Maximum Person Allowed must be greater than Minimum Person Allowed"
                              );
                            }
                          }
                        }}
                        className="w-32"
                        placeholder="1"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-semibold whitespace-nowrap">
                        Maximum Person Allowed
                      </label>
                      <TextField
                        size="small"
                        variant="outlined"
                        value={subFacility.maximumPersonAllowed}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || /^[1-9]\d*$/.test(value)) {
                            if (
                              subFacility.minimumPersonAllowed &&
                              parseInt(value) <=
                              parseInt(subFacility.minimumPersonAllowed)
                            ) {
                              toast.error(
                                "Maximum Person Allowed must be greater than Minimum Person Allowed"
                              );
                            }
                            updateSubFacility(subFacility.id, {
                              maximumPersonAllowed: value,
                            });
                          }
                        }}
                        className="w-32"
                        placeholder="1"
                      />
                    </div>
                    {formData.isBookable ? (
                      <div className="flex items-center gap-3">
                        {/* <label className="text-sm font-semibold whitespace-nowrap">
                          GST
                        </label>
                        <TextField
                          size="small"
                          variant="outlined"
                          value={subFacility.gst}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
                              updateSubFacility(subFacility.id, {
                                gst: value,
                              });
                            }
                          }}
                          className="w-32"
                          placeholder="0.0"
                        /> */}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold whitespace-nowrap">
                          Refundable Deposit
                        </label>
                        <TextField
                          size="small"
                          variant="outlined"
                          value={subFacility.refundableDeposit}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
                              updateSubFacility(subFacility.id, {
                                refundableDeposit: value,
                              });
                            }
                          }}
                          className="w-32"
                          placeholder="0.0"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border-2 p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#E5E0D3] text-[#C72030]">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-semibold uppercase text-[#1A1A1A]">
                  CHARGE SETUP
                </h3>
              </div>

              {formData.isBookable && (
                <div className="overflow-x-auto">
                  <table className="w-full border">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                          Member Type
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                          Adult
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                          Child
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={formData.chargeSetup.member.selected}
                              onCheckedChange={(checked) =>
                                setFormData({
                                  ...formData,
                                  chargeSetup: {
                                    ...formData.chargeSetup,
                                    member: {
                                      ...formData.chargeSetup.member,
                                      selected: !!checked,
                                    },
                                  },
                                })
                              }
                            />
                            <span>Member</span>
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Checkbox
                              checked={!!formData.chargeSetup.member.adult}
                              onCheckedChange={(checked) => {
                                if (!checked) {
                                  setFormData({
                                    ...formData,
                                    chargeSetup: {
                                      ...formData.chargeSetup,
                                      member: {
                                        ...formData.chargeSetup.member,
                                        adult: "",
                                      },
                                    },
                                  });
                                }
                              }}
                            />
                            <TextField
                              size="small"
                              variant="outlined"
                              value={formData.chargeSetup.member.adult}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Allow only positive numbers with max 2 decimal places
                                if (
                                  value === "" ||
                                  /^\d*\.?\d{0,2}$/.test(value)
                                ) {
                                  setFormData({
                                    ...formData,
                                    chargeSetup: {
                                      ...formData.chargeSetup,
                                      member: {
                                        ...formData.chargeSetup.member,
                                        adult: value,
                                      },
                                    },
                                  });
                                }
                              }}
                              className="w-full max-w-[200px]"
                            />
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Checkbox
                              checked={!!formData.chargeSetup.member.child}
                              onCheckedChange={(checked) => {
                                setFormData({
                                  ...formData,
                                  chargeSetup: {
                                    ...formData.chargeSetup,
                                    member: {
                                      ...formData.chargeSetup.member,
                                      child: checked
                                        ? formData.chargeSetup.member.child ||
                                        ""
                                        : "",
                                    },
                                  },
                                });
                              }}
                            />
                            <TextField
                              size="small"
                              variant="outlined"
                              value={formData.chargeSetup.member.child}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Allow only positive numbers with max 2 decimal places
                                if (
                                  value === "" ||
                                  /^\d*\.?\d{0,2}$/.test(value)
                                ) {
                                  setFormData({
                                    ...formData,
                                    chargeSetup: {
                                      ...formData.chargeSetup,
                                      member: {
                                        ...formData.chargeSetup.member,
                                        child: value,
                                      },
                                    },
                                  });
                                }
                              }}
                              className="w-full max-w-[200px]"
                            />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={formData.chargeSetup.guest.selected}
                              onCheckedChange={(checked) =>
                                setFormData({
                                  ...formData,
                                  chargeSetup: {
                                    ...formData.chargeSetup,
                                    guest: {
                                      ...formData.chargeSetup.guest,
                                      selected: !!checked,
                                    },
                                  },
                                })
                              }
                            />
                            <span>Guest</span>
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Checkbox
                              checked={!!formData.chargeSetup.guest.adult}
                              onCheckedChange={(checked) => {
                                if (!checked) {
                                  setFormData({
                                    ...formData,
                                    chargeSetup: {
                                      ...formData.chargeSetup,
                                      guest: {
                                        ...formData.chargeSetup.guest,
                                        adult: "",
                                      },
                                    },
                                  });
                                }
                              }}
                            />
                            <TextField
                              size="small"
                              variant="outlined"
                              value={formData.chargeSetup.guest.adult}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Allow only positive numbers with max 2 decimal places
                                if (
                                  value === "" ||
                                  /^\d*\.?\d{0,2}$/.test(value)
                                ) {
                                  setFormData({
                                    ...formData,
                                    chargeSetup: {
                                      ...formData.chargeSetup,
                                      guest: {
                                        ...formData.chargeSetup.guest,
                                        adult: value,
                                      },
                                    },
                                  });
                                }
                              }}
                              className="w-full max-w-[200px]"
                            />
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Checkbox
                              checked={!!formData.chargeSetup.guest.child}
                              onCheckedChange={(checked) => {
                                setFormData({
                                  ...formData,
                                  chargeSetup: {
                                    ...formData.chargeSetup,
                                    guest: {
                                      ...formData.chargeSetup.guest,
                                      child: checked
                                        ? formData.chargeSetup.guest.child || ""
                                        : "",
                                    },
                                  },
                                });
                              }}
                            />
                            <TextField
                              size="small"
                              variant="outlined"
                              value={formData.chargeSetup.guest.child}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Allow only positive numbers with max 2 decimal places
                                if (
                                  value === "" ||
                                  /^\d*\.?\d{0,2}$/.test(value)
                                ) {
                                  setFormData({
                                    ...formData,
                                    chargeSetup: {
                                      ...formData.chargeSetup,
                                      guest: {
                                        ...formData.chargeSetup.guest,
                                        child: value,
                                      },
                                    },
                                  });
                                }
                              }}
                              className="w-full max-w-[200px]"
                            />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={formData.chargeSetup.nonMember.selected}
                              onCheckedChange={(checked) =>
                                setFormData({
                                  ...formData,
                                  chargeSetup: {
                                    ...formData.chargeSetup,
                                    nonMember: {
                                      ...formData.chargeSetup.nonMember,
                                      selected: !!checked,
                                    },
                                  },
                                })
                              }
                            />
                            <span>Non-Member</span>
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Checkbox
                              checked={!!formData.chargeSetup.nonMember.adult}
                              onCheckedChange={(checked) => {
                                if (!checked) {
                                  setFormData({
                                    ...formData,
                                    chargeSetup: {
                                      ...formData.chargeSetup,
                                      nonMember: {
                                        ...formData.chargeSetup.nonMember,
                                        adult: "",
                                      },
                                    },
                                  });
                                }
                              }}
                            />
                            <TextField
                              size="small"
                              variant="outlined"
                              value={formData.chargeSetup.nonMember.adult}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Allow only positive numbers with max 2 decimal places
                                if (
                                  value === "" ||
                                  /^\d*\.?\d{0,2}$/.test(value)
                                ) {
                                  setFormData({
                                    ...formData,
                                    chargeSetup: {
                                      ...formData.chargeSetup,
                                      nonMember: {
                                        ...formData.chargeSetup.nonMember,
                                        adult: value,
                                      },
                                    },
                                  });
                                }
                              }}
                              className="w-full max-w-[200px]"
                            />
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Checkbox
                              checked={!!formData.chargeSetup.nonMember.child}
                              onCheckedChange={(checked) => {
                                setFormData({
                                  ...formData,
                                  chargeSetup: {
                                    ...formData.chargeSetup,
                                    nonMember: {
                                      ...formData.chargeSetup.nonMember,
                                      child: checked
                                        ? formData.chargeSetup.nonMember
                                          .child || ""
                                        : "",
                                    },
                                  },
                                });
                              }}
                            />
                            <TextField
                              size="small"
                              variant="outlined"
                              value={formData.chargeSetup.nonMember.child}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Allow only positive numbers with max 2 decimal places
                                if (
                                  value === "" ||
                                  /^\d*\.?\d{0,2}$/.test(value)
                                ) {
                                  setFormData({
                                    ...formData,
                                    chargeSetup: {
                                      ...formData.chargeSetup,
                                      nonMember: {
                                        ...formData.chargeSetup.nonMember,
                                        child: value,
                                      },
                                    },
                                  });
                                }
                              }}
                              className="w-full max-w-[200px]"
                            />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={formData.chargeSetup.tenant.selected}
                              onCheckedChange={(checked) =>
                                setFormData({
                                  ...formData,
                                  chargeSetup: {
                                    ...formData.chargeSetup,
                                    tenant: {
                                      ...formData.chargeSetup.tenant,
                                      selected: !!checked,
                                    },
                                  },
                                })
                              }
                            />
                            <span>Tenant</span>
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Checkbox
                              checked={!!formData.chargeSetup.tenant.adult}
                              onCheckedChange={(checked) => {
                                if (!checked) {
                                  setFormData({
                                    ...formData,
                                    chargeSetup: {
                                      ...formData.chargeSetup,
                                      tenant: {
                                        ...formData.chargeSetup.tenant,
                                        adult: "",
                                      },
                                    },
                                  });
                                }
                              }}
                            />
                            <TextField
                              size="small"
                              variant="outlined"
                              value={formData.chargeSetup.tenant.adult}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Allow only positive numbers with max 2 decimal places
                                if (
                                  value === "" ||
                                  /^\d*\.?\d{0,2}$/.test(value)
                                ) {
                                  setFormData({
                                    ...formData,
                                    chargeSetup: {
                                      ...formData.chargeSetup,
                                      tenant: {
                                        ...formData.chargeSetup.tenant,
                                        adult: value,
                                      },
                                    },
                                  });
                                }
                              }}
                              className="w-full max-w-[200px]"
                            />
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Checkbox
                              checked={!!formData.chargeSetup.tenant.child}
                              onCheckedChange={(checked) => {
                                setFormData({
                                  ...formData,
                                  chargeSetup: {
                                    ...formData.chargeSetup,
                                    tenant: {
                                      ...formData.chargeSetup.tenant,
                                      child: checked
                                        ? formData.chargeSetup.tenant.child ||
                                        ""
                                        : "",
                                    },
                                  },
                                });
                              }}
                            />
                            <TextField
                              size="small"
                              variant="outlined"
                              value={formData.chargeSetup.tenant.child}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Allow only positive numbers with max 2 decimal places
                                if (
                                  value === "" ||
                                  /^\d*\.?\d{0,2}$/.test(value)
                                ) {
                                  setFormData({
                                    ...formData,
                                    chargeSetup: {
                                      ...formData.chargeSetup,
                                      tenant: {
                                        ...formData.chargeSetup.tenant,
                                        child: value,
                                      },
                                    },
                                  });
                                }
                              }}
                              className="w-full max-w-[200px]"
                            />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold whitespace-nowrap">
                    Minimum Person Allowed
                  </label>
                  <TextField
                    size="small"
                    variant="outlined"
                    value={formData.chargeSetup.minimumPersonAllowed}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only positive integers (no decimals, no negatives)
                      if (value === "" || /^[1-9]\d*$/.test(value)) {
                        setFormData({
                          ...formData,
                          chargeSetup: {
                            ...formData.chargeSetup,
                            minimumPersonAllowed: value,
                          },
                        });
                        // Check if maximum is valid after updating minimum
                        if (
                          formData.chargeSetup.maximumPersonAllowed &&
                          parseInt(formData.chargeSetup.maximumPersonAllowed) <=
                          parseInt(value)
                        ) {
                          toast.error(
                            "Maximum Person Allowed must be greater than Minimum Person Allowed"
                          );
                        }
                      }
                    }}
                    className="w-32"
                    placeholder="1"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold whitespace-nowrap">
                    Maximum Person Allowed
                  </label>
                  <TextField
                    size="small"
                    variant="outlined"
                    value={formData.chargeSetup.maximumPersonAllowed}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only positive integers (no decimals, no negatives)
                      if (value === "" || /^[1-9]\d*$/.test(value)) {
                        // Check if value is greater than minimum
                        if (
                          formData.chargeSetup.minimumPersonAllowed &&
                          parseInt(value) <=
                          parseInt(formData.chargeSetup.minimumPersonAllowed)
                        ) {
                          toast.error(
                            "Maximum Person Allowed must be greater than Minimum Person Allowed"
                          );
                        }
                        setFormData({
                          ...formData,
                          chargeSetup: {
                            ...formData.chargeSetup,
                            maximumPersonAllowed: value,
                          },
                        });
                      }
                    }}
                    className="w-32"
                    placeholder="1"
                  />
                </div>

                {formData.isRequest && (
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold whitespace-nowrap">
                      Refundable Deposit
                    </label>
                    <TextField
                      size="small"
                      variant="outlined"
                      value={formData.chargeSetup.refundableDeposit}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
                          setFormData({
                            ...formData,
                            chargeSetup: {
                              ...formData.chargeSetup,
                              refundableDeposit: value,
                            },
                          });
                        }
                      }}
                      className="w-32"
                      placeholder="0.0"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border-2 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12  h-12  rounded-full flex items-center justify-center bg-[#E5E0D3] text-[#C72030]">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-semibold uppercase text-[#1A1A1A]">
                  CONFIGURE SLOT
                </h3>
              </div>
              {formData.isRequest && (
                <Button
                  onClick={() => {
                    setFormData({
                      ...formData,
                      customSlots: [
                        ...formData.customSlots,
                        {
                          startTime: { hour: "00", minute: "00" },
                          endTime: { hour: "00", minute: "00" },
                          amount: "",
                        },
                      ],
                    });
                  }}
                  className="bg-purple-600 hover:bg-purple-700 mb-4"
                >
                  Add
                </Button>
              )}
            </div>

            <div>
              {formData.isBookable ? (
                <>
                  <div className="grid grid-cols-8 gap-2 mb-2 text-sm font-medium text-gray-600">
                    <div>Start Time</div>
                    <div>Break Time Start</div>
                    <div>Break Time End</div>
                    <div>End Time</div>
                    <div>Concurrent Slots</div>
                    <div>Slot by</div>
                    <div>Wrap Time</div>
                    <div>Consecutive Slots Allowed</div>
                  </div>

                  {/* Slot Rows */}
                  <div className="grid grid-cols-8 gap-2 mb-2">
                    <div className="flex gap-1">
                      <FormControl size="small">
                        <Select
                          value={formData.slots.startTime.hour}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              slots: {
                                ...formData.slots,
                                startTime: {
                                  ...formData.slots.startTime,
                                  hour: e.target.value,
                                },
                              },
                            });
                          }}
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <MenuItem
                              key={i}
                              value={i.toString().padStart(2, "0")}
                            >
                              {i.toString().padStart(2, "0")}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small">
                        <Select
                          value={formData.slots.startTime.minute}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              slots: {
                                ...formData.slots,
                                startTime: {
                                  ...formData.slots.startTime,
                                  minute: e.target.value,
                                },
                              },
                            });
                          }}
                        >
                          {Array.from({ length: 60 }, (_, i) => (
                            <MenuItem
                              key={i}
                              value={i.toString().padStart(2, "0")}
                            >
                              {i.toString().padStart(2, "0")}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </div>

                    <div className="flex gap-1">
                      <FormControl size="small">
                        <Select
                          value={formData.slots.breakTimeStart.hour}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              slots: {
                                ...formData.slots,
                                breakTimeStart: {
                                  ...formData.slots.breakTimeStart,
                                  hour: e.target.value,
                                },
                              },
                            });
                          }}
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <MenuItem
                              key={i}
                              value={i.toString().padStart(2, "0")}
                            >
                              {i.toString().padStart(2, "0")}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small">
                        <Select
                          value={formData.slots.breakTimeStart.minute}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              slots: {
                                ...formData.slots,
                                breakTimeStart: {
                                  ...formData.slots.breakTimeStart,
                                  minute: e.target.value,
                                },
                              },
                            });
                          }}
                        >
                          {Array.from({ length: 60 }, (_, i) => (
                            <MenuItem
                              key={i}
                              value={i.toString().padStart(2, "0")}
                            >
                              {i.toString().padStart(2, "0")}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </div>

                    <div className="flex gap-1">
                      <FormControl size="small">
                        <Select
                          value={formData.slots.breakTimeEnd.hour}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              slots: {
                                ...formData.slots,
                                breakTimeEnd: {
                                  ...formData.slots.breakTimeEnd,
                                  hour: e.target.value,
                                },
                              },
                            });
                          }}
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <MenuItem
                              key={i}
                              value={i.toString().padStart(2, "0")}
                            >
                              {i.toString().padStart(2, "0")}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small">
                        <Select
                          value={formData.slots.breakTimeEnd.minute}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              slots: {
                                ...formData.slots,
                                breakTimeEnd: {
                                  ...formData.slots.breakTimeEnd,
                                  minute: e.target.value,
                                },
                              },
                            });
                          }}
                        >
                          {Array.from({ length: 60 }, (_, i) => (
                            <MenuItem
                              key={i}
                              value={i.toString().padStart(2, "0")}
                            >
                              {i.toString().padStart(2, "0")}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </div>

                    <div className="flex gap-1">
                      <FormControl size="small">
                        <Select
                          value={formData.slots.endTime.hour}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              slots: {
                                ...formData.slots,
                                endTime: {
                                  ...formData.slots.endTime,
                                  hour: e.target.value,
                                },
                              },
                            });
                          }}
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <MenuItem
                              key={i}
                              value={i.toString().padStart(2, "0")}
                            >
                              {i.toString().padStart(2, "0")}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small">
                        <Select
                          value={formData.slots.endTime.minute}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              slots: {
                                ...formData.slots,
                                endTime: {
                                  ...formData.slots.endTime,
                                  minute: e.target.value,
                                },
                              },
                            });
                          }}
                        >
                          {Array.from({ length: 60 }, (_, i) => (
                            <MenuItem
                              key={i}
                              value={i.toString().padStart(2, "0")}
                            >
                              {i.toString().padStart(2, "0")}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </div>

                    <TextField
                      size="small"
                      value={formData.slots.concurrentSlots}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^[1-9]\d*$/.test(value)) {
                          setFormData({
                            ...formData,
                            slots: {
                              ...formData.slots,
                              concurrentSlots: value,
                            },
                          });
                        }
                      }}
                      variant="outlined"
                    />

                    <FormControl size="small">
                      <Select
                        value={formData.slots.slotBy}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            slots: {
                              ...formData.slots,
                              slotBy: e.target.value,
                            },
                          });
                        }}
                      >
                        <MenuItem value={15}>15 Minutes</MenuItem>
                        <MenuItem value={30}>30 Minutes</MenuItem>
                        <MenuItem value={45}>45 Minutes</MenuItem>
                        <MenuItem value={60}>1 hour</MenuItem>
                        <MenuItem value={90}>1 hour 30 minutes</MenuItem>
                        <MenuItem value={120}>2 hours</MenuItem>
                        <MenuItem value={150}>2 hours 30 minutes</MenuItem>
                        <MenuItem value={180}>3 hours</MenuItem>
                        <MenuItem value={360}>6 hours</MenuItem>
                        <MenuItem value={720}>12 hours</MenuItem>
                        <MenuItem value={1440}>24 hours</MenuItem>
                        {/* <MenuItem value={210}>3 hours 30 minutes</MenuItem>
                        <MenuItem value={240}>4 hours</MenuItem>
                        <MenuItem value={270}>4 hours 30 minutes</MenuItem> */}
                      </Select>
                    </FormControl>

                    <TextField
                      size="small"
                      value={formData.slots.wrapTime}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d+$/.test(value)) {
                          setFormData({
                            ...formData,
                            slots: {
                              ...formData.slots,
                              wrapTime: value,
                            },
                          });
                        }
                      }}
                      variant="outlined"
                    />

                    <Switch
                      checked={formData.slots.consecutiveSlotsAllowed}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          slots: {
                            ...formData.slots,
                            consecutiveSlotsAllowed: e.target.checked,
                          },
                        });
                      }}
                      sx={{
                        "& .MuiSwitch-switchBase": {
                          color: "#ef4444",
                          "&.Mui-checked": {
                            color: "#22c55e",
                          },
                          "&.Mui-checked + .MuiSwitch-track": {
                            backgroundColor: "#22c55e",
                          },
                        },
                        "& .MuiSwitch-track": {
                          backgroundColor: "#ef4444",
                        },
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2 mb-2 text-sm font-medium text-gray-600">
                    <div>Start Time</div>
                    <div>End Time</div>
                    <div>Payable Amount</div>
                  </div>

                  {formData.customSlots.map((slot, index) => (
                    <div key={index} className="grid grid-cols-3 gap-2 mb-2">
                      <div className="flex gap-1">
                        <FormControl size="small">
                          <Select
                            value={slot.startTime.hour}
                            onChange={(e) => {
                              const newCustomSlots = [...formData.customSlots];
                              newCustomSlots[index].startTime.hour =
                                e.target.value;
                              setFormData({
                                ...formData,
                                customSlots: newCustomSlots,
                              });
                            }}
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <MenuItem
                                key={i}
                                value={i.toString().padStart(2, "0")}
                              >
                                {i.toString().padStart(2, "0")}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl size="small">
                          <Select
                            value={slot.startTime.minute}
                            onChange={(e) => {
                              const newCustomSlots = [...formData.customSlots];
                              newCustomSlots[index].startTime.minute =
                                e.target.value;
                              setFormData({
                                ...formData,
                                customSlots: newCustomSlots,
                              });
                            }}
                          >
                            {Array.from({ length: 60 }, (_, i) => (
                              <MenuItem
                                key={i}
                                value={i.toString().padStart(2, "0")}
                              >
                                {i.toString().padStart(2, "0")}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </div>

                      <div className="flex gap-1">
                        <FormControl size="small">
                          <Select
                            value={slot.endTime.hour}
                            onChange={(e) => {
                              const newCustomSlots = [...formData.customSlots];
                              newCustomSlots[index].endTime.hour =
                                e.target.value;
                              setFormData({
                                ...formData,
                                customSlots: newCustomSlots,
                              });
                            }}
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <MenuItem
                                key={i}
                                value={i.toString().padStart(2, "0")}
                              >
                                {i.toString().padStart(2, "0")}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl size="small">
                          <Select
                            value={slot.endTime.minute}
                            onChange={(e) => {
                              const newCustomSlots = [...formData.customSlots];
                              newCustomSlots[index].endTime.minute =
                                e.target.value;
                              setFormData({
                                ...formData,
                                customSlots: newCustomSlots,
                              });
                            }}
                          >
                            {Array.from({ length: 60 }, (_, i) => (
                              <MenuItem
                                key={i}
                                value={i.toString().padStart(2, "0")}
                              >
                                {i.toString().padStart(2, "0")}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </div>

                      <div className="flex gap-1">
                        <TextField
                          size="small"
                          variant="outlined"
                          className="w-32"
                          placeholder="1"
                          value={slot.amount}
                          onChange={(e) => {
                            const newCustomSlots = [...formData.customSlots];
                            newCustomSlots[index].amount = e.target.value;
                            setFormData({
                              ...formData,
                              customSlots: newCustomSlots,
                            });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </>
              )}

              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Booking Allowed before :
                  </label>
                  <p className="text-sm text-gray-600 mb-2">
                    (Enter Time: DD Days, HH Hours, MM Minutes)
                  </p>
                  <div className="flex gap-2 items-center">
                    <TextField
                      placeholder="Day"
                      size="small"
                      style={{ width: "80px" }}
                      variant="outlined"
                      value={formData.bookingAllowedBefore.day}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d+$/.test(value)) {
                          setFormData({
                            ...formData,
                            bookingAllowedBefore: {
                              ...formData.bookingAllowedBefore,
                              day: value,
                            },
                          });
                        }
                      }}
                    />
                    <span>DD</span>
                    <TextField
                      placeholder="Hour"
                      size="small"
                      style={{ width: "80px" }}
                      variant="outlined"
                      value={formData.bookingAllowedBefore.hour}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d+$/.test(value)) {
                          setFormData({
                            ...formData,
                            bookingAllowedBefore: {
                              ...formData.bookingAllowedBefore,
                              hour: value,
                            },
                          });
                        }
                      }}
                    />
                    <span>HH</span>
                    <TextField
                      placeholder="Mins"
                      size="small"
                      style={{ width: "80px" }}
                      variant="outlined"
                      value={formData.bookingAllowedBefore.minute}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d+$/.test(value)) {
                          setFormData({
                            ...formData,
                            bookingAllowedBefore: {
                              ...formData.bookingAllowedBefore,
                              minute: value,
                            },
                          });
                        }
                      }}
                    />
                    <span>MM</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Advance Booking :
                  </label>
                  <div className="flex gap-2 items-center">
                    <TextField
                      placeholder="Day"
                      size="small"
                      style={{ width: "80px" }}
                      variant="outlined"
                      value={formData.advanceBooking.day}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d+$/.test(value)) {
                          setFormData({
                            ...formData,
                            advanceBooking: {
                              ...formData.advanceBooking,
                              day: value,
                            },
                          });
                        }
                      }}
                    />
                    <span>DD</span>
                    <TextField
                      placeholder="Hour"
                      size="small"
                      style={{ width: "80px" }}
                      variant="outlined"
                      value={formData.advanceBooking.hour}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d+$/.test(value)) {
                          setFormData({
                            ...formData,
                            advanceBooking: {
                              ...formData.advanceBooking,
                              hour: value,
                            },
                          });
                        }
                      }}
                    />
                    <span>HH</span>
                    <TextField
                      placeholder="Mins"
                      size="small"
                      style={{ width: "80px" }}
                      variant="outlined"
                      value={formData.advanceBooking.minute}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d+$/.test(value)) {
                          setFormData({
                            ...formData,
                            advanceBooking: {
                              ...formData.advanceBooking,
                              minute: value,
                            },
                          });
                        }
                      }}
                    />
                    <span>MM</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Can Cancel Before Schedule :
                  </label>
                  <div className="flex gap-2 items-center">
                    <TextField
                      placeholder="Day"
                      size="small"
                      style={{ width: "80px" }}
                      variant="outlined"
                      value={formData.canCancelBefore.day}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d+$/.test(value)) {
                          setFormData({
                            ...formData,
                            canCancelBefore: {
                              ...formData.canCancelBefore,
                              day: value,
                            },
                          });
                        }
                      }}
                    />
                    <span>DD</span>
                    <TextField
                      placeholder="Hour"
                      size="small"
                      style={{ width: "80px" }}
                      variant="outlined"
                      value={formData.canCancelBefore.hour}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d+$/.test(value)) {
                          setFormData({
                            ...formData,
                            canCancelBefore: {
                              ...formData.canCancelBefore,
                              hour: value,
                            },
                          });
                        }
                      }}
                    />
                    <span>HH</span>
                    <TextField
                      placeholder="Mins"
                      size="small"
                      style={{ width: "80px" }}
                      variant="outlined"
                      value={formData.canCancelBefore.minute}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d+$/.test(value)) {
                          setFormData({
                            ...formData,
                            canCancelBefore: {
                              ...formData.canCancelBefore,
                              minute: value,
                            },
                          });
                        }
                      }}
                    />
                    <span>MM</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 flex flex-col gap-4 mt-4">
                {formData.facilityBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <Checkbox
                      checked={booking.isChecked}
                      onCheckedChange={(checked) =>
                        updateFacilityBooking(booking.id, {
                          isChecked: !!checked,
                        })
                      }
                    />
                    <span>Facility can be booked</span>
                    <TextField
                      placeholder=""
                      value={booking.times}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^[1-9]\d*$/.test(value)) {
                          updateFacilityBooking(booking.id, { times: value });
                        }
                      }}
                      variant="outlined"
                      size="small"
                      style={{ width: "80px" }}
                    />
                    <span>times per day by</span>
                    <Select
                      value={booking.unit}
                      onChange={(e) =>
                        updateFacilityBooking(booking.id, {
                          unit: e.target.value,
                        })
                      }
                      displayEmpty
                      size="small"
                      style={{ width: "140px" }}
                    >
                      <MenuItem value="Select">Select</MenuItem>
                      <MenuItem value="flat">Flat</MenuItem>
                      <MenuItem value="user">User</MenuItem>
                      <MenuItem value="owner">Owner</MenuItem>
                      <MenuItem value="tenant">Tenant</MenuItem>
                    </Select>
                    <Button
                      onClick={() => deleteFacilityBooking(booking.id)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <div className="mt-4">
                  <Button
                    onClick={addFacilityBooking}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {
            formData.isBookable && (
              <div className="bg-white rounded-lg border-2 p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12  h-12  rounded-full flex items-center justify-center bg-[#E5E0D3] text-[#C72030]">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-semibold uppercase text-[#1A1A1A]">
                    CONFIGURE PAYMENT
                  </h3>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="postpaid"
                        checked={formData.postpaid}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, postpaid: !!checked })
                        }
                      />
                      <label htmlFor="postpaid">Postpaid</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="prepaid"
                        checked={formData.prepaid}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, prepaid: !!checked })
                        }
                      />
                      <label htmlFor="prepaid">Prepaid</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="payOnFacility"
                        checked={formData.payOnFacility}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, payOnFacility: !!checked })
                        }
                      />
                      <label htmlFor="payOnFacility">Pay on Facility</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="complimentary"
                        checked={formData.complimentary}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, complimentary: !!checked })
                        }
                      />
                      <label htmlFor="complimentary">Complimentary</label>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <TextField
                      label="SGST(%)"
                      value={formData.sgstPercentage}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow only non-negative numbers with max 2 decimal places
                        if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
                          setFormData({ ...formData, sgstPercentage: value });
                        }
                      }}
                      variant="outlined"
                    />
                    <TextField
                      label="GST(%)"
                      value={formData.gstPercentage}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
                          setFormData({ ...formData, gstPercentage: value });
                        }
                      }}
                      variant="outlined"
                    />
                    <TextField
                      label="IGST(%)"
                      value={formData.igstPercentage}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
                          setFormData({ ...formData, igstPercentage: value });
                        }
                      }}
                      variant="outlined"
                    />
                  </div>
                </div>
              </div>
            )
          }

          <div className="flex items-start justify-between gap-4">
            <div className="bg-white rounded-lg border-2 p-6 space-y-6 w-full">
              <div className="flex items-center gap-3">
                <div className="w-12  h-12  rounded-full flex items-center justify-center bg-[#E5E0D3] text-[#C72030]">
                  <FileImage className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-semibold uppercase text-[#1A1A1A]">
                  COVER IMAGE
                </h3>
              </div>

              <div className="p-6" style={{ border: "1px dashed #C72030" }}>
                <div
                  className="rounded-lg text-center p-6"
                  onClick={triggerFileSelect}
                >
                  <div className="text-[#C72030] mb-2">
                    <Upload className="h-8 w-8 mx-auto" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Drag & Drop or{" "}
                    <span className="text-[#C72030] cursor-pointer">
                      Choose File
                    </span>{" "}
                    No file chosen
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Accepted file formats: PNG/JPEG (height: 142px, width:
                    328px) (max 5 mb)
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleCoverImageChange}
                  ref={coverImageRef}
                  hidden
                />
              </div>
              {selectedFile.length > 0 && (
                <div className="mt-4 flex gap-2 flex-wrap">
                  {selectedFile.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`cover-preview-${index}`}
                        className="h-[80px] w-20 rounded border border-gray-200"
                      />
                      <button
                        onClick={() => removeCoverImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg border-2 p-6 space-y-6 w-full">
              <div className="flex items-center gap-3">
                <div className="w-12  h-12  rounded-full flex items-center justify-center bg-[#E5E0D3] text-[#C72030]">
                  <Image className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-semibold uppercase text-[#1A1A1A]">
                  Booking Summary Image
                </h3>
              </div>

              <div className="p-6" style={{ border: "1px dashed #C72030" }}>
                <div
                  className="rounded-lg text-center p-6"
                  onClick={triggerBookingImgSelect}
                >
                  <div className="text-[#C72030] mb-2">
                    <Upload className="h-8 w-8 mx-auto" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Drag & Drop or{" "}
                    <span className="text-[#C72030] cursor-pointer">
                      Choose File
                    </span>{" "}
                    No file chosen
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Accepted file formats: PNG/JPEG (height: 142px, width:
                    328px) (max 5 mb)
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleBookingImageChange}
                  ref={bookingImageRef}
                  hidden
                />
              </div>
              {selectedBookingFiles.length > 0 && (
                <div className="mt-4 flex gap-2 flex-wrap">
                  {selectedBookingFiles.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`booking-preview-${index}`}
                        className="h-[80px] w-20 rounded border border-gray-200 bg-cover"
                      />
                      <button
                        onClick={() => removeBookingImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Gallery Images Card */}
          {/* <div className="bg-white rounded-lg border-2 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12  h-12  rounded-full flex items-center justify-center bg-[#E5E0D3] text-[#C72030]">
                  <Image className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-semibold uppercase text-[#1A1A1A]">
                  GALLERY IMAGES [{selectedGalleryImages.length}]
                </h3>
              </div>
              <Button
                onClick={handleGalleryModalOpen}
                className="bg-[#C72030] hover:bg-[#A01828] text-white"
              >
                + Add
              </Button>
            </div>

            {selectedGalleryImages.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#E5E0D3]">
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Image Name</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Preview</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Ratio</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Enable to App</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGalleryImages.map((image: any, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3">
                          <input
                            type="text"
                            value={image.name || `Image ${index + 1}`}
                            onChange={(e) => {
                              const newImages = [...selectedGalleryImages];
                              newImages[index] = { ...newImages[index], name: e.target.value };
                              setSelectedGalleryImages(newImages);
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#C72030]"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="flex justify-center">
                            <img
                              src={image.preview}
                              alt={`gallery-preview-${index}`}
                              className="h-20 w-20 rounded border border-gray-200 object-cover"
                            />
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          {image.ratio || '1:1'}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={image.enableToApp ?? true}
                              onCheckedChange={(checked) => {
                                const newImages = [...selectedGalleryImages];
                                newImages[index] = { ...newImages[index], enableToApp: !!checked };
                                setSelectedGalleryImages(newImages);
                              }}
                              className="w-5 h-5 mx-auto"
                            />
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedGalleryImages(
                                selectedGalleryImages.filter((_: any, i: number) => i !== index)
                              );
                            }}
                            className="bg-[#C72030] text-white w-8 h-8 flex items-center justify-center rounded hover:bg-[#A01828] mx-auto"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div> */}

          <div className="bg-white rounded-lg border-2 p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12  h-12  rounded-full flex items-center justify-center bg-[#E5E0D3] text-[#C72030]">
                <NotepadText className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-semibold uppercase text-[#1A1A1A]">
                DESCRIPTION
              </h3>
            </div>

            <div>
              <Textarea
                placeholder="Enter description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="min-h-[100px]"
              />
            </div>
          </div>

          {/* Terms & Conditions and Cancellation Text */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div className="bg-white rounded-lg border-2 p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12  h-12  rounded-full flex items-center justify-center bg-[#E5E0D3] text-[#C72030]">
                  <ReceiptText className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-semibold uppercase text-[#1A1A1A]">
                  TERMS & CONDITIONS*
                </h3>
              </div>

              <div>
                <Textarea
                  placeholder="Enter terms and conditions"
                  value={formData.termsConditions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      termsConditions: e.target.value,
                    })
                  }
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border-2 p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12  h-12  rounded-full flex items-center justify-center bg-[#E5E0D3] text-[#C72030]">
                <Settings className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-semibold uppercase text-[#1A1A1A]">
                RULE SETUP
              </h3>
            </div>

            <div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="font-medium text-gray-700">
                  Rules Description
                </div>
                <div className="font-medium text-gray-700">Time</div>
                <div className="font-medium text-gray-700">Deduction</div>
              </div>
              {cancellationRules.map((rule, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 gap-4 mb-2 items-center"
                >
                  {/* Description */}
                  <div className="text-sm text-gray-600">
                    {rule.description}
                  </div>

                  {/* Time Type & Value */}
                  <div className="flex gap-2 items-center">
                    {/* Day Input */}
                    <TextField
                      placeholder="Day"
                      size="small"
                      style={{ width: "80px" }}
                      variant="outlined"
                      value={rule.time.day}
                      onChange={(e) => {
                        const newRules = [...cancellationRules];
                        newRules[index].time.day = e.target.value;
                        setCancellationRules(newRules);
                      }}
                    />
                    <span>DD</span>

                    {/* Type: Hr or Day */}
                    <FormControl size="small" style={{ width: "80px" }}>
                      <Select
                        value={rule.time.type}
                        onChange={(e) => {
                          const newRules = [...cancellationRules];
                          newRules[index].time.type = e.target.value;
                          setCancellationRules(newRules);
                        }}
                      >
                        {Array.from({ length: 25 }, (_, i) => (
                          <MenuItem
                            key={i}
                            value={i.toString().padStart(2, "0")}
                          >
                            {i.toString().padStart(2, "0")}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <span>HH</span>

                    {/* Value: 0 - 59 */}
                    <FormControl size="small" style={{ width: "80px" }}>
                      <Select
                        value={rule.time.value}
                        onChange={(e) => {
                          const newRules = [...cancellationRules];
                          newRules[index].time.value = e.target.value;
                          setCancellationRules(newRules);
                        }}
                      >
                        {Array.from({ length: 60 }, (_, i) => (
                          <MenuItem
                            key={i}
                            value={i.toString().padStart(2, "0")}
                          >
                            {i.toString().padStart(2, "0")}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <span>MM</span>
                  </div>

                  {/* Percentage Input */}
                  <TextField
                    placeholder="%"
                    size="small"
                    variant="outlined"
                    value={rule.deduction}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only non-negative numbers with max 2 decimal places and not more than 100
                      if (
                        value === "" ||
                        (/^\d*\.?\d{0,2}$/.test(value) && Number(value) <= 100)
                      ) {
                        const newRules = [...cancellationRules];
                        newRules[index].deduction = value;
                        setCancellationRules(newRules);
                      }
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="font-medium text-gray-700">
                Cancellation Policy <span>*</span>
              </div>
              <Textarea
                placeholder="Enter cancellation text"
                value={formData.cancellationText}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cancellationText: e.target.value,
                  })
                }
                className="min-h-[100px]"
              />
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-purple-600 hover:bg-purple-700 text-white w-full"
              disabled={isSubmitting}
              style={{ maxWidth: "90px" }}
            >
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Gallery Image Upload Modal */}
      {/* {galleryModalOpen && (
        <ClubGalleryImageUpload
          showAsModal={galleryModalOpen}
          onClose={handleGalleryModalClose}
          onContinue={handleGalleryModalContinue}
          label="Upload Gallery Images"
          description="Upload images supporting multiple aspect ratios."
          ratios={[
            { label: '16:9', ratio: 16 / 9, width: 200, height: 112 },
            { label: '9:16', ratio: 9 / 16, width: 120, height: 213 },
            { label: '1:1', ratio: 1, width: 150, height: 150 },
            { label: '3:2', ratio: 3 / 2, width: 180, height: 120 }
          ]}
          enableCropping={true}
          initialImages={selectedGalleryImages}
          onImagesChange={setSelectedGalleryImages}
        />
      )} */}
    </ThemeProvider>
  );
};
