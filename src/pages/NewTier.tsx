import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage, FieldArray } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_CONFIG, getFullUrl, getAuthHeader } from "@/config/apiConfig";
import { toast } from "sonner";
import { ChevronRight, ArrowLeft, X, Plus } from "lucide-react";

// Form styling matched to the Facility Setup add / details pages
const PAGE_CARD = "bg-white border border-[rgba(26,26,24,0.09)] rounded-2xl px-6 py-[22px]";
const CARD_TITLE = "text-sm font-semibold text-[#1A1A18]";
const CARD_SUBTITLE = "text-[12.5px] text-[rgba(26,26,24,0.55)] mt-1";
const FIELD_LABEL = "block text-[12.5px] font-semibold text-[rgba(26,26,24,0.68)]";
const FIELD_INPUT =
  "w-full h-11 px-3.5 text-[13.5px] font-medium text-[#1A1A18] bg-white border border-[rgba(26,26,24,0.08)] rounded-xl outline-none transition-shadow placeholder:text-[rgba(26,26,24,0.3)] hover:border-[rgba(26,26,24,0.28)] focus:border-[#1A1A18] focus:shadow-[0_0_0_4px_rgba(26,26,24,0.1)]";
const FIELD_TEXTAREA =
  "w-full px-3.5 py-2.5 text-[13.5px] font-medium text-[#1A1A18] bg-white border border-[rgba(26,26,24,0.08)] rounded-xl outline-none transition-shadow resize-none placeholder:text-[rgba(26,26,24,0.3)] hover:border-[rgba(26,26,24,0.28)] focus:border-[#1A1A18] focus:shadow-[0_0_0_4px_rgba(26,26,24,0.1)]";
const FIELD_ERROR = "text-red-500 text-xs mt-1";

const validationSchema = Yup.object().shape({
  name: Yup.string()
    .required("Tier name is required")
    .test("unique-name", "Tier name already exists.", async function (value) {
      if (!value) return true;
      try {
        const storedValue = sessionStorage.getItem("selectedId");
        const token = API_CONFIG.TOKEN || "";
        const url = getFullUrl(`/loyalty/tiers.json?q[loyalty_type_id_eq]=1&token=${token}`);
        const response = await axios.get(url, {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            "Content-Type": "application/json",
          },
        });
        let tiersArray = [];
        if (Array.isArray(response.data)) {
          tiersArray = response.data;
        } else if (Array.isArray(response.data.tiers)) {
          tiersArray = response.data.tiers;
        }
        if (tiersArray.length > 0) {
          const existingTier = tiersArray.find(
            (tier) =>
              tier.name && tier.name.toLowerCase() === value.toLowerCase()
          );
          if (existingTier) return false;
        }
        const { tiers } = this.parent;
        if (tiers && tiers.length > 0) {
          const duplicateCount = tiers.filter(
            (tier) =>
              tier.name && tier.name.toLowerCase() === value.toLowerCase()
          ).length;
          return duplicateCount === 0;
        }
        return true;
      } catch (error) {
        console.error("Error checking tier name:", error);
        return true;
      }
    }),
  title: Yup.string().required("Title is required"),
  description: Yup.string(),
  exit_points: Yup.number()
    .required("Exit points are required")
    .positive("Exit points must be a positive number"),
  // multipliers: Yup.number()
  //   .required("Multipliers are required")
  //   .positive("Multipliers must be a positive number"),
  welcome_bonus: Yup.number()
    .required("Welcome bonus is required")
    .positive("Welcome bonus must be a positive number"),
  point_type: Yup.string().required("Point type is required"),
  tiers: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().required("Tier name is required"),
      title: Yup.string().required("Title is required"),
      description: Yup.string(),
      exit_points: Yup.number()
        .required("Exit points are required")
        .positive("Exit points must be a positive number"),
      // multipliers: Yup.number()
      //   .required("Multipliers are required")
      //   .positive("Multipliers must be a positive number"),
      welcome_bonus: Yup.number()
        .required("Welcome bonus is required")
        .positive("Welcome bonus must be a positive number"),
    })
  ),
});

const NewTier = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const [step, setStep] = useState(1);
  const [timeframe, setTimeframe] = useState("");
  const [timeframeError, setTimeframeError] = useState("");
  const navigate = useNavigate();

  const handleTimeframeChange = (value) => {
    setTimeframe(value);
    setTimeframeError("");
  };

  const nextStep = () => {
    if (step === 1 && timeframe) {
      setStep(2);
    } else if (!timeframe) {
      setTimeframeError("Please select a timeframe.");
    }
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      // Always fetch the latest tiers for uniqueness validation
      const token = API_CONFIG.TOKEN || "";
      const getTiersUrl = getFullUrl(`/loyalty/tiers.json?q[loyalty_type_id_eq]=1&token=${token}`);
      const existingTiersResponse = await axios.get(getTiersUrl, {
        headers: { "Content-Type": "application/json", Authorization: getAuthHeader() },
      });
      let existingTiers = [];
      if (Array.isArray(existingTiersResponse.data)) {
        existingTiers = existingTiersResponse.data;
      } else if (Array.isArray(existingTiersResponse.data.tiers)) {
        existingTiers = existingTiersResponse.data.tiers;
      } else if (Array.isArray(existingTiersResponse.data.data)) {
        existingTiers = existingTiersResponse.data.data;
      }
      // Check for duplicate names (case-insensitive)
      const allNewTierNames = [
        values.name,
        ...(values.tiers || []).map((tier) => tier.name),
      ];
      const lowerCaseNewNames = allNewTierNames
        .map((name) => name?.toLowerCase().trim())
        .filter(Boolean);
      const conflictingTier = existingTiers.find((existingTier) =>
        lowerCaseNewNames.some(
          (newName) =>
            existingTier.name &&
            existingTier.name.toLowerCase().trim() === newName
        )
      );
      if (conflictingTier) {
        toast.error(`Tier name "${conflictingTier.name}" already exists.`);
        setSubmitting(false);
        return;
      }
      const hasDuplicates =
        lowerCaseNewNames.length !== new Set(lowerCaseNewNames).size;
      if (hasDuplicates) {
        toast.error("Tier name already exists in your submission.");
        setSubmitting(false);
        return;
      }
      const formattedTiers = values.tiers?.map((tier) => ({
        loyalty_type_id: 1,
        name: tier.name,
        title: tier.title,
        description: tier.description,
        exit_points: Number(tier.exit_points),
        // multipliers: Number(tier.multipliers),
        welcome_bonus: Number(tier.welcome_bonus),
        point_type: timeframe,
      }));
      const newTier = {
        loyalty_type_id: 1,
        name: values.name,
        title: values.title,
        description: values.description,
        exit_points: Number(values.exit_points),
        // multipliers: Number(values.multipliers),
        welcome_bonus: Number(values.welcome_bonus),
        point_type: timeframe,
      };
      const data = {
        loyalty_tier:
          formattedTiers?.length > 0 ? [...formattedTiers, newTier] : newTier,
      };
      let postUrl = "";
      if (formattedTiers?.length > 0) {
        postUrl = getFullUrl(`/loyalty/tiers/bulk_create?token=${token}`);
      } else {
        postUrl = getFullUrl(`/loyalty/tiers.json?token=${token}`);
      }
      const response = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        toast.success("Tier saved successfully!");
        setTimeout(() => {
          resetForm();
          navigate("/loyalty/loyalty-tiers-list");
        }, 1500);
      } else {
        const errorData = await response.json();
        let errorMsg = errorData.message || `Unexpected response: ${response.status}`;
        if (response.status === 422) {
          // API might return validation errors keyed by field
          if (errorData.exit_points && Array.isArray(errorData.exit_points) && errorData.exit_points.length > 0) {
            errorMsg = "Exit points already exist";
          }
          // you can extend for other fields later
        }
        throw new Error(errorMsg);
      }
    } catch (error) {
      toast.error(error.message || "Failed to create tier. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full bg-[#FDFDFB]">
      <div className="p-6 max-w-full h-[calc(100vh-50px)] overflow-y-auto">
        {step === 1 ? (
          <>
            {/* Header with Back Button and Breadcrumbs */}
            <div className="mb-[22px]">
              <div className="flex items-center gap-2 text-[13px] font-medium mb-3 text-[rgba(26,26,24,0.48)]">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F5F4F0] transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span>Tiers</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="font-semibold text-[#1A1A18]">Tier Setting</span>
              </div>
              <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] text-[#1A1A18]">
                Tier Setting
              </h1>
            </div>

            {/* Main Content */}
            <div className={PAGE_CARD}>
              <div className="mb-5">
                <h3 className={CARD_TITLE}>
                  Point Accumulation Timeframe
                </h3>
                <p className={CARD_SUBTITLE}>
                  Establish how members enter into higher tiers on points
                  earning and time frame.
                </p>
              </div>
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => handleTimeframeChange("lifetime")}
                    className={`p-5 rounded-xl border transition-all ${timeframe === "lifetime"
                        ? "border-[#1A1A18] bg-[#FAF9F7] shadow-[0_0_0_1px_#1A1A18]"
                        : "border-[rgba(26,26,24,0.09)] hover:border-[rgba(26,26,24,0.28)]"
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${timeframe === "lifetime"
                            ? "border-[#1A1A18]"
                            : "border-[rgba(26,26,24,0.25)]"
                          }`}
                      >
                        {timeframe === "lifetime" && (
                          <div className="w-2 h-2 rounded-full bg-[#1A1A18]" />
                        )}
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-semibold text-[#1A1A18] mb-1">
                          Lifetime
                        </h4>
                        <p className="text-[12.5px] leading-relaxed text-[rgba(26,26,24,0.55)]">
                          Members accumulate points throughout their lifetime
                          and tier progression is permanent.
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTimeframeChange("yearly")}
                    className={`p-5 rounded-xl border transition-all ${timeframe === "yearly"
                        ? "border-[#1A1A18] bg-[#FAF9F7] shadow-[0_0_0_1px_#1A1A18]"
                        : "border-[rgba(26,26,24,0.09)] hover:border-[rgba(26,26,24,0.28)]"
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${timeframe === "yearly"
                            ? "border-[#1A1A18]"
                            : "border-[rgba(26,26,24,0.25)]"
                          }`}
                      >
                        {timeframe === "yearly" && (
                          <div className="w-2 h-2 rounded-full bg-[#1A1A18]" />
                        )}
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-semibold text-[#1A1A18] mb-1">
                          Rolling Year
                        </h4>
                        <p className="text-[12.5px] leading-relaxed text-[rgba(26,26,24,0.55)]">
                          Points reset annually and tier status is re-evaluated
                          each year based on current points.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {timeframeError && (
                  <p className="text-red-500 text-xs -mt-3 mb-4">{timeframeError}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-5">
              <button
                type="button"
                onClick={() => navigate("/loyalty/loyalty-tiers-list")}
                className="btn-cancel h-9 px-4 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="btn-primary h-9 px-4 text-sm font-medium"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Header with Back Button and Breadcrumbs */}
            <div className="mb-[22px]">
              <div className="flex items-center gap-2 text-[13px] font-medium mb-3 text-[rgba(26,26,24,0.48)]">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F5F4F0] transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span>Tiers</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="font-semibold text-[#1A1A18]">New Tier</span>
              </div>
              <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] text-[#1A1A18]">
                Create New Tier
              </h1>
            </div>

            {/* Main Content */}
            <div className={PAGE_CARD}>
              <div className="mb-5">
                <h3 className={CARD_TITLE}>
                  Tier Details
                </h3>
              </div>
              <div>
                <Formik
                  initialValues={{
                    name: "",
                    title: "",
                    description: "",
                    exit_points: "",
                    // multipliers: "",
                    welcome_bonus: "",
                    point_type: timeframe,
                    tiers: [],
                  }}
                  validationSchema={validationSchema}
                  onSubmit={handleSubmit}
                >
                  {({ values, isSubmitting }) => (
                    <Form>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                        {/* Tier Name */}
                        <div className="space-y-2">
                          <label className={FIELD_LABEL}>
                            Tier Name
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <Field
                            name="name"
                            placeholder="Enter tier name"
                            className={FIELD_INPUT}
                          />
                          <ErrorMessage
                            name="name"
                            component="div"
                            className={FIELD_ERROR}
                          />
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                          <label className={FIELD_LABEL}>
                            Title
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <Field
                            name="title"
                            placeholder="Enter title"
                            className={FIELD_INPUT}
                          />
                          <ErrorMessage
                            name="title"
                            component="div"
                            className={FIELD_ERROR}
                          />
                        </div>

                        {/* Exit Points */}
                        <div className="space-y-2">
                          <label className={FIELD_LABEL}>
                            Exit Points
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <Field
                            name="exit_points"
                            type="number"
                            placeholder="Enter exit points"
                            className={FIELD_INPUT}
                          />
                          <ErrorMessage
                            name="exit_points"
                            component="div"
                            className={FIELD_ERROR}
                          />
                        </div>

                        {/* Welcome Bonus */}
                        <div className="space-y-2">
                          <label className={FIELD_LABEL}>
                            Welcome Bonus
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <Field
                            name="welcome_bonus"
                            type="number"
                            placeholder="Enter welcome bonus"
                            className={FIELD_INPUT}
                          />
                          <ErrorMessage
                            name="welcome_bonus"
                            component="div"
                            className={FIELD_ERROR}
                          />
                        </div>
                      </div>

                      {/* Description - full width */}
                      <div className="space-y-2 mb-6">
                        <label className={FIELD_LABEL}>
                          Description
                        </label>
                        <Field
                          as="textarea"
                          name="description"
                          rows={3}
                          placeholder="Enter description"
                          className={FIELD_TEXTAREA}
                        />
                        <ErrorMessage
                          name="description"
                          component="div"
                          className={FIELD_ERROR}
                        />
                      </div>

                      {/* Additional Tiers */}
                      <FieldArray name="tiers">
                        {({ remove, push }) => (
                          <div className="space-y-4 mb-6">
                            {values.tiers.length > 0 && (
                              <h4 className={`${CARD_TITLE} mb-4`}>
                                Additional Tiers
                              </h4>
                            )}
                            {values.tiers.map((tier, index) => (
                              <div
                                key={index}
                                className="relative p-5 border border-[rgba(26,26,24,0.09)] rounded-xl bg-white"
                              >
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-[rgba(26,26,24,0.55)] hover:bg-[#F5F4F0] hover:text-[#1A1A18] transition-colors"
                                  title="Remove tier"
                                >
                                  <X className="w-4 h-4" />
                                </button>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                                  <div className="space-y-2">
                                    <label className={FIELD_LABEL}>
                                      Tier Name
                                      <span className="text-red-500 ml-1">
                                        *
                                      </span>
                                    </label>
                                    <Field
                                      name={`tiers[${index}].name`}
                                      placeholder="Enter tier name"
                                      className={FIELD_INPUT}
                                    />
                                    <ErrorMessage
                                      name={`tiers[${index}].name`}
                                      component="div"
                                      className={FIELD_ERROR}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className={FIELD_LABEL}>
                                      Title
                                      <span className="text-red-500 ml-1">
                                        *
                                      </span>
                                    </label>
                                    <Field
                                      name={`tiers[${index}].title`}
                                      placeholder="Enter title"
                                      className={FIELD_INPUT}
                                    />
                                    <ErrorMessage
                                      name={`tiers[${index}].title`}
                                      component="div"
                                      className={FIELD_ERROR}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className={FIELD_LABEL}>
                                      Exit Points
                                      <span className="text-red-500 ml-1">
                                        *
                                      </span>
                                    </label>
                                    <Field
                                      name={`tiers[${index}].exit_points`}
                                      type="number"
                                      placeholder="Enter exit points"
                                      className={FIELD_INPUT}
                                    />
                                    <ErrorMessage
                                      name={`tiers[${index}].exit_points`}
                                      component="div"
                                      className={FIELD_ERROR}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className={FIELD_LABEL}>
                                      Welcome Bonus
                                      <span className="text-red-500 ml-1">
                                        *
                                      </span>
                                    </label>
                                    <Field
                                      name={`tiers[${index}].welcome_bonus`}
                                      type="number"
                                      placeholder="Enter welcome bonus"
                                      className={FIELD_INPUT}
                                    />
                                    <ErrorMessage
                                      name={`tiers[${index}].welcome_bonus`}
                                      component="div"
                                      className={FIELD_ERROR}
                                    />
                                  </div>
                                </div>
                                {/* Description - full width */}
                                <div className="space-y-2">
                                  <label className={FIELD_LABEL}>
                                    Description
                                  </label>
                                  <Field
                                    as="textarea"
                                    name={`tiers[${index}].description`}
                                    rows={2}
                                    placeholder="Enter description"
                                    className={FIELD_TEXTAREA}
                                  />
                                  <ErrorMessage
                                    name={`tiers[${index}].description`}
                                    component="div"
                                    className={FIELD_ERROR}
                                  />
                                </div>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() =>
                                push({
                                  name: "",
                                  title: "",
                                  description: "",
                                  exit_points: "",
                                  // multipliers: "",
                                  welcome_bonus: "",
                                })
                              }
                              className="btn-cancel h-9 px-4 text-sm font-medium inline-flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Add New Tier
                            </button>
                          </div>
                        )}
                      </FieldArray>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end gap-2 pt-5 border-t border-[rgba(26,26,24,0.08)]">
                        <button
                          type="button"
                          onClick={() =>
                            navigate("/loyalty/loyalty-tiers-list")
                          }
                          disabled={isSubmitting}
                          className="btn-cancel h-9 px-4 text-sm font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="btn-primary h-9 px-4 text-sm font-medium disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <span className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Saving...
                            </span>
                          ) : (
                            "Submit"
                          )}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NewTier;
