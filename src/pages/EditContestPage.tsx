import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Quill from "quill";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  X,
  Plus,
  Trophy,
  Calendar,
  Clock,
} from "lucide-react";
import { toast as sonnerToast } from "sonner";
import {
  TextField,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  Typography,
  Switch,
} from "@mui/material";

interface ContestStep {
  id: number;
  title: string;
  completed: boolean;
  active: boolean;
}

interface OfferData {
  id: string | number;
  offerTitle: string;
  couponCode: string;
  displayName: string;
  partner: string;
  winningProbability: string;
  probabilityOutOf: string;
  offerDescription: string;
  bannerImage: File | null;
  bannerImageName: string;
  rewardType: string;
  pointsValue: string;
  existingImageUrl?: string;
  prizeId?: number;
}

export const EditContestPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Refs for Quill editors
  const termsEditorRef = useRef<HTMLDivElement>(null);
  const redemptionEditorRef = useRef<HTMLDivElement>(null);
  const termsQuillRef = useRef<Quill | null>(null);
  const redemptionQuillRef = useRef<Quill | null>(null);

  // Helper function to create a default offer object
  const createDefaultOffer = (): OfferData => ({
    id: Date.now().toString() + Math.random(),
    offerTitle: "",
    couponCode: "",
    displayName: "",
    partner: "",
    winningProbability: "",
    probabilityOutOf: "",
    offerDescription: "",
    bannerImage: null,
    bannerImageName: "",
    rewardType: "Coupon Code",
    pointsValue: "",
  });

  // Form data
  const [contestName, setContestName] = useState("");
  const [contestDescription, setContestDescription] = useState("");
  const [contestType, setContestType] = useState("");
  const [offers, setOffers] = useState<OfferData[]>([createDefaultOffer()]);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [usersCap, setUsersCap] = useState("");
  const [attemptsRequired, setAttemptsRequired] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [termsText, setTermsText] = useState("");
  const [redemptionText, setRedemptionText] = useState("");

  // Store original data for comparison
  const [originalData, setOriginalData] = useState<any>(null);

  // Fetch contest data
  useEffect(() => {
    if (!id) return;

    const fetchContest = async () => {
      setLoading(true);
      try {
        const baseUrl = localStorage.getItem('baseUrl') || '';
        const token = localStorage.getItem('token') || '';

        if (!baseUrl || !token) {
          throw new Error("Base URL or token not set");
        }

        const url = /^https?:\/\//i.test(baseUrl) ? baseUrl : `https://${baseUrl}`;
        const res = await fetch(`${url}/contests/${id}.json`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch contest: ${res.status}`);
        }

        const data = await res.json();

        // Store original data for comparison
        setOriginalData({
          name: data.name || "",
          description: data.description || "",
          content_type: data.content_type || "",
          active: data.active ?? true,
          user_caps: data.user_caps?.toString() || "",
          attemp_required: data.attemp_required?.toString() || "",
          terms_and_conditions: data.terms_and_conditions || "",
          redemption_guide: data.redemption_guide || "",
          start_at: data.start_at,
          end_at: data.end_at,
          prizes: data.prizes || [],
        });

        // Populate form fields
        setContestName(data.name || "");
        setContestDescription(data.description || "");
        setContestType(data.content_type ? data.content_type.charAt(0).toUpperCase() + data.content_type.slice(1) : "");
        setIsActive(data.active ?? true);
        setUsersCap(data.user_caps?.toString() || "");
        setAttemptsRequired(data.attemp_required?.toString() || "");
        setTermsText(data.terms_and_conditions || "");
        setRedemptionText(data.redemption_guide || "");

        // Parse dates and times
        if (data.start_at) {
          const startDateTime = new Date(data.start_at);
          setStartDate(startDateTime.toISOString().split('T')[0]);
          setStartTime(startDateTime.toTimeString().slice(0, 5));
        }

        if (data.end_at) {
          const endDateTime = new Date(data.end_at);
          setEndDate(endDateTime.toISOString().split('T')[0]);
          setEndTime(endDateTime.toTimeString().slice(0, 5));
        }

        // Parse prizes/offers
        if (data.prizes && data.prizes.length > 0) {
          const mappedOffers: OfferData[] = data.prizes.map((prize: any) => ({
            id: prize.id,
            prizeId: prize.id,
            offerTitle: prize.title || "",
            couponCode: prize.coupon_code || "",
            displayName: prize.display_name || "",
            partner: prize.partner_name || "",
            winningProbability: prize.probability_value?.toString() || "",
            probabilityOutOf: prize.probability_out_of?.toString() || "",
            offerDescription: prize.description || "",
            bannerImage: null,
            bannerImageName: "",
            rewardType: prize.reward_type === "points" ? "Points" : "Coupon Code",
            pointsValue: prize.points_value?.toString() || "",
            existingImageUrl: prize.image?.url || prize.icon_url || "",
          }));
          setOffers(mappedOffers);
        }

        sonnerToast.success("Contest data loaded");
      } catch (err: any) {
        console.error(err);
        sonnerToast.error(err.message || "Failed to load contest");
      } finally {
        setLoading(false);
      }
    };

    fetchContest();
  }, [id]);

  // Initialize Quill editors
  useEffect(() => {
    if (loading) return;

    // Initialize Terms & Conditions editor
    if (termsEditorRef.current && !termsQuillRef.current) {
      termsQuillRef.current = new Quill(termsEditorRef.current, {
        theme: "snow",
        placeholder: "Enter terms and conditions",
        modules: {
          toolbar: [
            ["bold", "italic", "underline"],
            [{ list: "bullet" }],
            ["link"],
          ],
        },
      });

      if (termsText) {
        termsQuillRef.current.root.innerHTML = termsText;
      }

      termsQuillRef.current.on("text-change", () => {
        const html = termsQuillRef.current?.root.innerHTML || "";
        setTermsText(html);
      });
    } else if (termsQuillRef.current && termsText) {
      termsQuillRef.current.root.innerHTML = termsText;
    }

    // Initialize Redemption Guide editor
    if (redemptionEditorRef.current && !redemptionQuillRef.current) {
      redemptionQuillRef.current = new Quill(redemptionEditorRef.current, {
        theme: "snow",
        placeholder: "Enter redemption guide",
        modules: {
          toolbar: [
            ["bold", "italic", "underline"],
            [{ list: "bullet" }],
            ["link"],
          ],
        },
      });

      if (redemptionText) {
        redemptionQuillRef.current.root.innerHTML = redemptionText;
      }

      redemptionQuillRef.current.on("text-change", () => {
        const html = redemptionQuillRef.current?.root.innerHTML || "";
        setRedemptionText(html);
      });
    } else if (redemptionQuillRef.current && redemptionText) {
      redemptionQuillRef.current.root.innerHTML = redemptionText;
    }
  }, [currentStep, loading, termsText, redemptionText]);

  const steps: ContestStep[] = [
    { id: 1, title: "Basic Info", completed: completedSteps.includes(1), active: currentStep === 1 },
    { id: 2, title: "Offers & Vouchers", completed: completedSteps.includes(2), active: currentStep === 2 },
    { id: 3, title: "Validity & Status", completed: completedSteps.includes(3), active: currentStep === 3 },
    { id: 4, title: "Terms & Conditions", completed: completedSteps.includes(4), active: currentStep === 4 },
  ];

  const contestTypes = ["Spin", "Scratch", "Flip"];

  const addOffer = () => {
    setOffers([...offers, createDefaultOffer()]);
  };

  const removeOffer = (id: string | number) => {
    if (offers.length > 1) {
      setOffers(offers.filter((offer) => offer.id !== id));
    }
  };

  const updateOffer = (
    id: string | number,
    field: keyof OfferData,
    value: string | File | null
  ) => {
    setOffers((prev) =>
      prev.map((offer) => (offer.id === id ? { ...offer, [field]: value } : offer))
    );
  };

  const handleOfferBannerUpload = (id: string | number, file: File | null) => {
    setOffers((prev) =>
      prev.map((offer) =>
        offer.id === id
          ? { ...offer, bannerImage: file, bannerImageName: file ? file.name : "" }
          : offer
      )
    );
  };

  const handleRewardTypeChange = (id: string | number, newRewardType: string) => {
    setOffers((prev) =>
      prev.map((offer) => {
        if (offer.id === id) {
          const updatedOffer = { ...offer, rewardType: newRewardType };
          if (newRewardType === "Coupon Code") {
            updatedOffer.pointsValue = "";
          } else if (newRewardType === "Points") {
            updatedOffer.couponCode = "";
          }
          return updatedOffer;
        }
        return offer;
      })
    );
  };

  const buildISO = (date: string, time: string, isEnd = false): string => {
    if (!date || !time) return "";
    const [y, m, d] = date.split("-");
    const [h, min] = time.split(":");
    const dt = new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min));
    if (isEnd) {
      dt.setHours(23, 59, 59, 999);
    }
    return dt.toISOString();
  };

  // Helper function to normalize HTML for comparison
  const normalizeHTML = (html: string): string => {
    if (!html) return "";
    // Remove extra whitespace and normalize formatting
    return html
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setSubmitting(true);

    const baseUrl = localStorage.getItem('baseUrl') || '';
    const token = localStorage.getItem('token') || '';
    const formData = new FormData();

    // Track if there are any changes
    let hasChanges = false;

    // Only add changed basic contest fields
    if (contestName.trim() !== originalData?.name) {
      formData.append('contest[name]', contestName.trim());
      hasChanges = true;
    }

    if (contestDescription.trim() !== originalData?.description) {
      formData.append('contest[description]', contestDescription.trim());
      hasChanges = true;
    }

    if (contestType.toLowerCase() !== originalData?.content_type) {
      formData.append('contest[content_type]', contestType.toLowerCase());
      hasChanges = true;
    }

    if (isActive !== originalData?.active) {
      formData.append('contest[active]', String(isActive));
      hasChanges = true;
    }

    // Check if dates/times changed
    const newStartISO = buildISO(startDate, startTime);
    const newEndISO = buildISO(endDate, endTime, true);
    
    if (newStartISO !== originalData?.start_at) {
      formData.append('contest[start_at]', newStartISO);
      hasChanges = true;
    }

    if (newEndISO !== originalData?.end_at) {
      formData.append('contest[end_at]', newEndISO);
      hasChanges = true;
    }

    if (usersCap !== originalData?.user_caps) {
      if (usersCap) {
        formData.append('contest[user_caps]', usersCap);
      }
      hasChanges = true;
    }

    if (attemptsRequired !== originalData?.attemp_required) {
      if (attemptsRequired) {
        formData.append('contest[attemp_required]', attemptsRequired);
      }
      hasChanges = true;
    }

    // Check if terms or redemption guide changed
    if (normalizeHTML(termsText) !== normalizeHTML(originalData?.terms_and_conditions || "")) {
      if (termsText.trim()) {
        formData.append('contest[terms_and_conditions]', termsText.trim());
      }
      hasChanges = true;
    }

    if (normalizeHTML(redemptionText) !== normalizeHTML(originalData?.redemption_guide || "")) {
      if (redemptionText.trim()) {
        formData.append('contest[redemption_guide]', redemptionText.trim());
      }
      hasChanges = true;
    }

    // Check if prizes changed
    const originalPrizes = originalData?.prizes || [];
    offers.forEach((offer, index) => {
      const originalPrize = originalPrizes.find((p: any) => p.id === offer.prizeId);
      let prizeChanged = false;

      if (!originalPrize) {
        // New prize
        prizeChanged = true;
      } else {
        // Check if any field changed
        if (
          offer.offerTitle.trim() !== (originalPrize.title || "") ||
          offer.couponCode.trim() !== (originalPrize.coupon_code || "") ||
          offer.displayName.trim() !== (originalPrize.display_name || "") ||
          offer.partner.trim() !== (originalPrize.partner_name || "") ||
          offer.winningProbability !== (originalPrize.probability_value?.toString() || "") ||
          offer.probabilityOutOf !== (originalPrize.probability_out_of?.toString() || "") ||
          offer.offerDescription.trim() !== (originalPrize.description || "") ||
          offer.pointsValue !== (originalPrize.points_value?.toString() || "") ||
          (offer.rewardType === "Points" ? "points" : "coupon") !== originalPrize.reward_type ||
          offer.bannerImage !== null
        ) {
          prizeChanged = true;
        }
      }

      if (prizeChanged) {
        hasChanges = true;
        formData.append(`contest[prizes_attributes][${index}][title]`, offer.offerTitle.trim());
        
        if (offer.prizeId) {
          formData.append(`contest[prizes_attributes][${index}][id]`, offer.prizeId.toString());
        }

        const rewardType = offer.rewardType === "Points" ? "points" : "coupon";
        formData.append(`contest[prizes_attributes][${index}][reward_type]`, rewardType);

        if (offer.rewardType === "Coupon Code") {
          formData.append(`contest[prizes_attributes][${index}][coupon_code]`, offer.couponCode.trim());
        }

        if (offer.rewardType === "Points") {
          formData.append(`contest[prizes_attributes][${index}][points_value]`, offer.pointsValue.trim());
        }

        if (offer.partner.trim()) {
          formData.append(`contest[prizes_attributes][${index}][partner_name]`, offer.partner.trim());
        }

        formData.append(
          `contest[prizes_attributes][${index}][probability_value]`,
          offer.winningProbability || "0"
        );
        formData.append(
          `contest[prizes_attributes][${index}][probability_out_of]`,
          offer.probabilityOutOf || "100"
        );
        formData.append(`contest[prizes_attributes][${index}][position]`, String(index + 1));
        formData.append(`contest[prizes_attributes][${index}][active]`, "true");

        if (offer.bannerImage) {
          formData.append(
            `contest[prizes_attributes][${index}][image_attributes][document]`,
            offer.bannerImage
          );
        }
      }
    });

    // Check for deleted prizes
    originalPrizes.forEach((originalPrize: any) => {
      const stillExists = offers.some(o => o.prizeId === originalPrize.id);
      if (!stillExists) {
        const index = offers.length;
        formData.append(`contest[prizes_attributes][${index}][id]`, originalPrize.id.toString());
        formData.append(`contest[prizes_attributes][${index}][_destroy]`, "true");
        hasChanges = true;
      }
    });

    if (!hasChanges) {
      sonnerToast.info("No changes detected");
      setSubmitting(false);
      return;
    }

    try {
      const url = /^https?:\/\//i.test(baseUrl) ? baseUrl : `https://${baseUrl}`;

      const res = await fetch(
        `${url}/contests/${id}.json`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API error: ${res.status} - ${errText}`);
      }

      await res.json();
      sonnerToast.success("Contest updated successfully!");
      setShowSuccessModal(true);

    } catch (err: any) {
      console.error(err);
      sonnerToast.error(err.message || "Failed to update contest");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleStepClick = (stepId: number) => {
    if (stepId <= currentStep || completedSteps.includes(stepId - 1)) {
      setCurrentStep(stepId);
    }
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!contestName.trim()) {
          sonnerToast.error("Please enter contest name");
          return false;
        }
        if (!contestDescription.trim()) {
          sonnerToast.error("Please enter contest description");
          return false;
        }
        if (!contestType) {
          sonnerToast.error("Please select contest type");
          return false;
        }
        return true;

      case 2:
        for (const offer of offers) {
          if (!offer.offerTitle.trim()) {
            sonnerToast.error("Please fill all offer titles");
            return false;
          }
          if (offer.rewardType === "Coupon Code" && !offer.couponCode.trim()) {
            sonnerToast.error("Please enter coupon code for all offers");
            return false;
          }
          if (offer.rewardType === "Points" && !offer.pointsValue.trim()) {
            sonnerToast.error("Please enter points value for all offers");
            return false;
          }
        }
        return true;

      case 3:
        if (!startDate || !startTime || !endDate || !endTime) {
          sonnerToast.error("Please fill all validity fields");
          return false;
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) {
          sonnerToast.error("End Date must be after Start Date");
          return false;
        }
        if (startDate === endDate) {
          const [startHour, startMin] = startTime.split(':').map(Number);
          const [endHour, endMin] = endTime.split(':').map(Number);
          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;
          if (endMinutes <= startMinutes) {
            sonnerToast.error("End Time must be after Start Time when on the same day");
            return false;
          }
        }
        return true;

      case 4:
        return true;

      default:
        return true;
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate(`/contests/${id}`);
  };

  const handleViewDetails = () => {
    setShowSuccessModal(false);
    navigate(`/contests/${id}`);
  };

  const textFieldSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "white",
      "& fieldset": { borderColor: "#e5e7eb" },
      "&:hover fieldset": { borderColor: "#C72030" },
      "&.Mui-focused fieldset": { borderColor: "#C72030" },
    },
    "& .MuiInputLabel-root.Mui-focused": { color: "#C72030" },
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-gray-300 border-t-[#C72030] animate-spin" />
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="shadow-sm w-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6 bg-[#F6F4EE] p-4 rounded-lg">
                <div className="w-10 h-10 bg-[#C4B89D54] flex items-center justify-center rounded">
                  <Trophy className="w-5 h-5 text-[#C72030]" />
                </div>
                <h2 className="text-lg font-semibold text-[#1A1A1A]">
                  Basic Contest Info
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField
                  fullWidth
                  label="Contest Name"
                  placeholder="Enter Title"
                  value={contestName}
                  onChange={(e) => setContestName(e.target.value)}
                  variant="outlined"
                  size="small"
                  sx={textFieldSx}
                />

                <FormControl fullWidth size="small" sx={textFieldSx}>
                  <InputLabel>Contest Type</InputLabel>
                  <MuiSelect
                    value={contestType}
                    label="Contest Type"
                    onChange={(e) => setContestType(e.target.value)}
                  >
                    {contestTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>
              </div>

              <div className="mt-6">
                <TextField
                  fullWidth
                  label="Contest Description"
                  placeholder="Enter Description"
                  value={contestDescription}
                  onChange={(e) => setContestDescription(e.target.value)}
                  variant="outlined"
                  multiline
                  rows={4}
                  sx={{
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
                />
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="shadow-sm w-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6 bg-[#F6F4EE] p-4 rounded-lg">
                <div className="w-10 h-10 bg-[#C4B89D54] flex items-center justify-center rounded">
                  <Trophy className="w-5 h-5 text-[#C72030]" />
                </div>
                <h2 className="text-lg font-semibold text-[#1A1A1A]">
                  Offers & Vouchers
                </h2>
              </div>

              {offers.map((offer, index) => (
                <div
                  key={offer.id}
                  className="border border-gray-200 rounded-lg p-6 mb-4 relative"
                >
                  {offers.length > 1 && (
                    <button
                      onClick={() => removeOffer(offer.id)}
                      className="absolute top-4 right-4 text-[#C72030] hover:text-red-800"
                    >
                      <X size={20} />
                    </button>
                  )}

                  <h3 className="text-base font-semibold text-[#1A1A1A] mb-4">
                    {index + 1}.
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      fullWidth
                      label="Offer Title *"
                      value={offer.offerTitle}
                      onChange={(e) => updateOffer(offer.id, "offerTitle", e.target.value)}
                      sx={textFieldSx}
                      size="small"
                    />

                    <FormControl fullWidth size="small" sx={textFieldSx}>
                      <InputLabel>Reward Type</InputLabel>
                      <MuiSelect
                        value={offer.rewardType}
                        label="Reward Type"
                        onChange={(e) => handleRewardTypeChange(offer.id, e.target.value)}
                      >
                        <MenuItem value="Coupon Code">Coupon Code</MenuItem>
                        <MenuItem value="Points">Points</MenuItem>
                      </MuiSelect>
                    </FormControl>

                    {offer.rewardType === "Coupon Code" && (
                      <TextField
                        fullWidth
                        label="Coupon Code"
                        value={offer.couponCode}
                        onChange={(e) => updateOffer(offer.id, "couponCode", e.target.value)}
                        sx={textFieldSx}
                        size="small"
                        required
                      />
                    )}

                    {offer.rewardType === "Points" && (
                      <TextField
                        fullWidth
                        label="Points"
                        value={offer.pointsValue}
                        onChange={(e) => updateOffer(offer.id, "pointsValue", e.target.value)}
                        sx={textFieldSx}
                        size="small"
                        type="number"
                        inputProps={{ min: 0 }}
                        required
                      />
                    )}

                    <TextField
                      fullWidth
                      label="Display Name"
                      value={offer.displayName}
                      onChange={(e) => updateOffer(offer.id, "displayName", e.target.value)}
                      sx={textFieldSx}
                      size="small"
                    />

                    <TextField
                      fullWidth
                      label="Partner (if any)"
                      value={offer.partner}
                      onChange={(e) => updateOffer(offer.id, "partner", e.target.value)}
                      sx={textFieldSx}
                      size="small"
                    />

                    <TextField
                      fullWidth
                      label="Winning Probability"
                      value={offer.winningProbability}
                      onChange={(e) => updateOffer(offer.id, "winningProbability", e.target.value)}
                      sx={textFieldSx}
                      size="small"
                      type="number"
                      inputProps={{ min: 0 }}
                    />

                    <TextField
                      fullWidth
                      label="Probability (Out of)"
                      value={offer.probabilityOutOf}
                      onChange={(e) => updateOffer(offer.id, "probabilityOutOf", e.target.value)}
                      sx={textFieldSx}
                      size="small"
                      type="number"
                      inputProps={{ min: 0 }}
                    />
                  </div>

                  <div className="mt-4">
                    <TextField
                      fullWidth
                      label="Offer Description"
                      value={offer.offerDescription}
                      onChange={(e) => updateOffer(offer.id, "offerDescription", e.target.value)}
                      variant="outlined"
                      multiline
                      rows={3}
                      sx={textFieldSx}
                    />
                  </div>

                  <div className="mt-4">
                    <Typography variant="body2" className="text-gray-700 mb-2">
                      Upload Banner Image
                      <span className="text-[#C72030]">*</span>
                    </Typography>
                    
                    {offer.existingImageUrl && !offer.bannerImage && (
                      <div className="mb-3">
                        <img 
                          src={offer.existingImageUrl} 
                          alt="Current banner" 
                          className="w-32 h-20 object-cover rounded border"
                        />
                        <p className="text-xs text-gray-500 mt-1">Current image</p>
                      </div>
                    )}
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <p className="text-sm text-gray-600 mb-2">
                        {offer.bannerImageName ||
                          "Choose a file (jpg/png) 5 MB max. or drag & drop it here"}
                      </p>
                      <input
                        type="file"
                        id={`banner-${offer.id}`}
                        className="hidden"
                        onChange={(e) =>
                          handleOfferBannerUpload(offer.id, e.target.files?.[0] || null)
                        }
                        accept="image/jpeg,image/png"
                      />
                      <label
                        htmlFor={`banner-${offer.id}`}
                        className="inline-block bg-[#F6F4EE] text-[#C72030] px-4 py-2 rounded-md cursor-pointer hover:bg-[#EDEAE3] transition-colors border border-[#C72030]"
                      >
                        Browse
                      </label>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                onClick={addOffer}
                variant="outline"
                className="w-full border-2 border-dashed border-gray-300 text-gray-600 hover:border-[#C72030] hover:text-[#C72030]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Offer
              </Button>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="shadow-sm w-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6 bg-[#F6F4EE] p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#C4B89D54] flex items-center justify-center rounded">
                    <Trophy className="w-5 h-5 text-[#C72030]" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#1A1A1A]">
                    Validity & Status
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={isActive}
                    onChange={() => setIsActive(!isActive)}
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": {
                        color: "#22c55e",
                      },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                        backgroundColor: "#22c55e",
                      },
                    }}
                  />
                  <span
                    className={`px-4 py-2 rounded-md text-sm font-medium ${isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TextField
                  fullWidth
                  label="Start Date *"
                  placeholder="DD/MM/YYYY"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  variant="outlined"
                  size="small"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    ...textFieldSx,
                    '& input[type="date"]::-webkit-datetime-edit-text': { textTransform: 'uppercase' },
                    '& input[type="date"]::-webkit-datetime-edit-month-field': { textTransform: 'uppercase' },
                    '& input[type="date"]::-webkit-datetime-edit-day-field': { textTransform: 'uppercase' },
                    '& input[type="date"]::-webkit-datetime-edit-year-field': { textTransform: 'uppercase' },
                  }}
                />

                <TextField
                  fullWidth
                  label="Start Time *"
                  placeholder="HH:MM"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  variant="outlined"
                  size="small"
                  type="time"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    placeholder: "HH:MM",
                    style: { textTransform: 'uppercase' }
                  }}
                  sx={{
                    ...textFieldSx,
                    '& input[type="time"]::-webkit-datetime-edit-text': { textTransform: 'uppercase' },
                    '& input[type="time"]::-webkit-datetime-edit-hour-field': { textTransform: 'uppercase' },
                    '& input[type="time"]::-webkit-datetime-edit-minute-field': { textTransform: 'uppercase' },
                    '& input::placeholder': { textTransform: 'uppercase' },
                  }}
                />

                <TextField
                  fullWidth
                  label="End Date *"
                  placeholder="DD/MM/YYYY"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  variant="outlined"
                  size="small"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: startDate || undefined,
                  }}
                  sx={{
                    ...textFieldSx,
                    '& input[type="date"]::-webkit-datetime-edit-text': { textTransform: 'uppercase' },
                    '& input[type="date"]::-webkit-datetime-edit-month-field': { textTransform: 'uppercase' },
                    '& input[type="date"]::-webkit-datetime-edit-day-field': { textTransform: 'uppercase' },
                    '& input[type="date"]::-webkit-datetime-edit-year-field': { textTransform: 'uppercase' },
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <TextField
                  fullWidth
                  label="End Time *"
                  placeholder="HH:MM"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  variant="outlined"
                  size="small"
                  type="time"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    placeholder: "HH:MM",
                    style: { textTransform: 'uppercase' },
                    min: (startDate && endDate && startDate === endDate) ? startTime : undefined,
                  }}
                  sx={{
                    ...textFieldSx,
                    '& input[type="time"]::-webkit-datetime-edit-text': { textTransform: 'uppercase' },
                    '& input[type="time"]::-webkit-datetime-edit-hour-field': { textTransform: 'uppercase' },
                    '& input[type="time"]::-webkit-datetime-edit-minute-field': { textTransform: 'uppercase' },
                    '& input::placeholder': { textTransform: 'uppercase' },
                  }}
                />

                <TextField
                  fullWidth
                  label="Users Cap"
                  value={usersCap}
                  onChange={(e) => setUsersCap(e.target.value)}
                  variant="outlined"
                  size="small"
                  type="number"
                  sx={textFieldSx}
                />

                <TextField
                  fullWidth
                  label="Attempts Required"
                  value={attemptsRequired}
                  onChange={(e) => setAttemptsRequired(e.target.value)}
                  variant="outlined"
                  size="small"
                  type="number"
                  sx={textFieldSx}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <div className="flex flex-col gap-6 w-full">
            <Card className="shadow-sm w-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6 bg-[#F6F4EE] p-4 rounded-lg">
                  <div className="w-10 h-10 bg-[#C4B89D54] flex items-center justify-center rounded">
                    <Trophy className="w-5 h-5 text-[#C72030]" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#1A1A1A]">
                    Terms & Conditions
                  </h2>
                </div>

                <div>
                  <div
                    ref={termsEditorRef}
                    style={{
                      width: "100%",
                      minHeight: "200px",
                      backgroundColor: "white",
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm w-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6 bg-[#F6F4EE] p-4 rounded-lg">
                  <div className="w-10 h-10 bg-[#C4B89D54] flex items-center justify-center rounded">
                    <Trophy className="w-5 h-5 text-[#C72030]" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#1A1A1A]">
                    Redemption Guide
                  </h2>
                </div>

                <div>
                  <div
                    ref={redemptionEditorRef}
                    style={{
                      width: "100%",
                      minHeight: "200px",
                      backgroundColor: "white",
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => navigate(`/contests/${id}`)}
          className="flex items-center gap-1 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Contest Details
        </button>
      </div>

      {/* Step Progress Indicator */}
      <div className="mb-4">
        <div className="relative w-full">
          <div
            className="absolute top-8 left-0 right-0 h-0.5"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right, #9CA3AF 0, #9CA3AF 6px, transparent 6px, transparent 12px)",
              height: "2px",
            }}
          ></div>

          <div className="relative flex justify-between items-start">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${step.id <= Math.max(...completedSteps, currentStep)
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-100"
                  }`}
                onClick={() => handleStepClick(step.id)}
              >
                <div className="py-2 px-3 rounded text-white font-semibold bg-white">
                  <div
                    className={`
                    px-6 py-3 rounded text-white font-semibold text-xs relative z-5 transition-colors whitespace-nowrap
                    ${step.active || step.completed || step.id < currentStep ? "bg-[#C72030]" : "bg-gray-400"}
                  `}
                  >
                    {step.id}. {step.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="w-full px-6">
        {renderStepContent()}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <Button
            onClick={() => navigate(`/contests/${id}`)}
            variant="outline"
            className="bg-[#F6F4EE] text-[#C72030] border-[#C72030] hover:bg-[#EDEAE3]"
          >
            Cancel
          </Button>
          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              className="bg-[#C72030] text-white hover:bg-[#B71C1C]"
              disabled={submitting}
            >
              Proceed to next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-[#C72030] text-white hover:bg-[#B71C1C]"
            >
              {submitting ? "Updating..." : "Update Contest"}
            </Button>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full relative">
            <button
              onClick={handleSuccessClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 mb-6">
                <svg viewBox="0 0 100 100" className="w-20 h-20">
                  <path
                    d="M50 5 L61 17 L77 12 L79 28 L95 33 L88 48 L95 63 L79 68 L77 84 L61 79 L50 91 L39 79 L23 84 L21 68 L5 63 L12 48 L5 33 L21 28 L23 12 L39 17 Z"
                    fill="#4FD1C5"
                  />
                  <path
                    d="M35 50 L45 60 L65 40"
                    stroke="white"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Contest Updated!
              </h2>

              <button
                onClick={handleViewDetails}
                className="text-[#C72030] font-medium hover:underline"
              >
                View details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditContestPage;
