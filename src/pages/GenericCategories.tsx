import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Tag, CheckSquare, AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getFullUrl, getAuthHeader, API_CONFIG } from "@/config/apiConfig";
import { FormControl, InputLabel, Select as MuiSelect, MenuItem } from "@mui/material";
import { fieldStyles } from "@/components/ticket-management/fieldStyles";

interface Organization {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
  cat_type: string;
  resource_type: string;
  resource_id: number;
  products_count: number;
}

const CAT_TYPE_LABEL: Record<string, string> = {
  merchandise: "Merchandise",
  voucher_category: "Voucher",
  mile_category: "Miles",
  indian_lounge: "Lounge",
};

const GenericCategories: React.FC = () => {
  const navigate = useNavigate();
  const token = API_CONFIG.TOKEN || "";

  // Organizations
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");

  // All available categories (dropdown)
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Active (assigned) categories for selected org
  const [activeCategories, setActiveCategories] = useState<Category[]>([]);

  // Selected category IDs (multi-select)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ── Fetch organizations ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoadingOrgs(true);
      try {
        const url = getFullUrl(`/organizations.json?token=${token}`);
        const response = await fetch(url, {
          headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error("Failed to fetch organizations");
        const data = await response.json();
        setOrganizations(data.organizations || []);
      } catch (err) {
        console.error("Error fetching organizations:", err);
        setError("Failed to load organizations");
      } finally {
        setLoadingOrgs(false);
      }
    };
    fetchOrganizations();
  }, [token]);

  // ── Fetch all categories from /generic_categories ────────────────────────
  const fetchAvailableCategories = useCallback(async () => {
    if (!selectedOrgId) return;
    setLoadingCategories(true);
    try {
      const url = getFullUrl(`/generic_categories?token=${token}&organization_id=${selectedOrgId}`);
      const response = await fetch(url, {
        headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setAvailableCategories(data.categories || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setAvailableCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, [selectedOrgId, token]);

  // ── Fetch active categories for org from /generic_categories/manage (GET) ─
  const fetchActiveCategories = useCallback(async () => {
    if (!selectedOrgId) return;
    try {
      const url = getFullUrl(`/generic_categories/manage?token=${token}&organization_id=${selectedOrgId}`);
      const response = await fetch(url, {
        headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" },
      });
      if (!response.ok) return;
      const data = await response.json();
      const active: Category[] = data.active_categories || [];
      setActiveCategories(active);
      // Pre-select the currently active category ids
      setSelectedCategoryIds(active.map((c) => c.id));
    } catch (err) {
      console.error("Error fetching active categories:", err);
    }
  }, [selectedOrgId, token]);

  useEffect(() => {
    if (!selectedOrgId) {
      setAvailableCategories([]);
      setActiveCategories([]);
      setSelectedCategoryIds([]);
      setError(null);
      setSuccess(null);
      return;
    }
    fetchAvailableCategories();
    fetchActiveCategories();
  }, [selectedOrgId, fetchAvailableCategories, fetchActiveCategories]);

  // ── Toggle a category in selectedCategoryIds ─────────────────────────────
  const toggleCategory = (id: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
    setError(null);
    setSuccess(null);
  };

  const removeCategory = (id: number) => {
    setSelectedCategoryIds((prev) => prev.filter((cid) => cid !== id));
    setError(null);
    setSuccess(null);
  };

  // ── Save / submit ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId) {
      setError("Please select an organization first");
      return;
    }
    if (selectedCategoryIds.length === 0) {
      setError("Please select at least one category");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const url = getFullUrl(`/generic_categories/manage?token=${token}`);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: getAuthHeader(),
        },
        body: JSON.stringify({
          organization_id: parseInt(selectedOrgId),
          category_ids: selectedCategoryIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to save categories (${response.status})`);
      }

      const data = await response.json();
      const active: Category[] = data.active_categories || [];
      setActiveCategories(active);
      setSelectedCategoryIds(active.map((c) => c.id));
      setSuccess("Generic categories updated successfully!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save categories";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  // ── Derive selected category objects for the badge display ────────────────
  const selectedCategories = availableCategories.filter((c) =>
    selectedCategoryIds.includes(c.id)
  );

  const unselectedCategories = availableCategories.filter(
    (c) => !selectedCategoryIds.includes(c.id)
  );

  const catTypeBadgeColor = (catType: string) => {
    switch (catType) {
      case "merchandise":
        return "bg-[rgba(158,200,186,0.25)] text-[#3f6b5c] border-[rgba(158,200,186,0.6)]";
      case "voucher_category":
        return "bg-[rgba(206,203,246,0.35)] text-[#55508f] border-[rgba(206,203,246,0.8)]";
      case "mile_category":
        return "bg-[rgba(237,196,136,0.25)] text-[#8a6327] border-[rgba(237,196,136,0.6)]";
      case "indian_lounge":
        return "bg-[rgba(121,140,94,0.15)] text-[#56663f] border-[rgba(121,140,94,0.35)]";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB] p-6">
      <div className=" mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a]">Generic Categories</h1>
            <p className="text-sm text-[#666666]">
              Assign generic categories to an organization
            </p>
          </div>
        </div>

        {/* ── Organization Selection ── */}
        <Card className="bg-white rounded-2xl border border-[rgba(26,26,24,.09)] shadow-none mb-6">
          <CardHeader className="pt-[22px]">
            <CardTitle className="flex items-center gap-3 text-sm font-semibold leading-[1.4] text-[#1A1A18]">
              <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#F5F4F0' }}>
                <Tag size={14} color="#1A1A18" />
              </span>
              Select Organization
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2">
              <FormControl
                fullWidth
                variant="outlined"
                required
                disabled={loadingOrgs}
                sx={{ '& .MuiInputBase-root': fieldStyles, '& .MuiFormLabel-asterisk': { color: '#1A1A18' } }}
              >
                <InputLabel shrink>Organization</InputLabel>
                <MuiSelect
                  id="org_select"
                  value={selectedOrgId}
                  onChange={(e) => {
                    setSelectedOrgId(e.target.value);
                    setError(null);
                    setSuccess(null);
                  }}
                  label="Organization"
                  notched
                  displayEmpty
                  disabled={loadingOrgs}
                >
                  <MenuItem value="">
                    {loadingOrgs ? "Loading..." : "Select organization"}
                  </MenuItem>
                  {loadingOrgs ? (
                    <MenuItem value="loading" disabled>
                      Loading organizations...
                    </MenuItem>
                  ) : organizations.length === 0 ? (
                    <MenuItem value="empty" disabled>
                      No organizations found
                    </MenuItem>
                  ) : (
                    organizations.map((org) => (
                      <MenuItem key={org.id} value={org.id.toString()}>
                        {org.name}
                      </MenuItem>
                    ))
                  )}
                </MuiSelect>
              </FormControl>
            </div>
          </CardContent>
        </Card>

        {/* ── Category Selection (only shown after org is selected) ── */}
        {selectedOrgId && (
          <form onSubmit={handleSubmit}>
            <Card className="bg-white rounded-2xl border border-[rgba(26,26,24,.09)] shadow-none mb-6">
              <CardHeader className="pt-[22px]">
                <CardTitle className="flex items-center gap-3 text-sm font-semibold leading-[1.4] text-[#1A1A18]">
              <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#F5F4F0' }}>
                <CheckSquare size={14} color="#1A1A18" />
              </span>
                  Select Categories
                  <span className="text-xs font-normal text-[#666] ml-1">
                    (multiple selection allowed)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">

                {/* Alerts */}
                {success && (
                  <Alert className="bg-green-50 border-green-200">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                  </Alert>
                )}
                {!loadingCategories && error && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Selected badges */}
                {selectedCategories.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-[#1a1a1a] mb-2">
                      Selected ({selectedCategories.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCategories.map((cat) => (
                        <span
                          key={cat.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${catTypeBadgeColor(cat.cat_type)}`}
                        >
                          {cat.name}
                          <button
                            type="button"
                            onClick={() => removeCategory(cat.id)}
                            className="ml-0.5 hover:opacity-70 transition-opacity"
                            title={`Remove ${cat.name}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category grid */}
                {loadingCategories ? (
                  <div className="flex items-center justify-center py-10 text-[#666]">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1A1A18] mr-3" />
                    Loading categories...
                  </div>
                ) : availableCategories.length === 0 ? (
                  <p className="text-center text-[#666] py-8">
                    No categories available for this organization.
                  </p>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-[#1a1a1a] mb-3">
                      Available Categories
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {availableCategories.map((cat) => {
                        const isSelected = selectedCategoryIds.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleCategory(cat.id)}
                            className={`flex items-start gap-3 w-full rounded-xl border-2 p-4 text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#1A1A18] focus:ring-offset-1 ${
                              isSelected
                                ? "border-[#1A1A18] bg-[rgba(26,26,24,0.08)]"
                                : "border-[rgba(26,26,24,.09)] bg-white hover:border-[#1A1A18] hover:bg-[rgba(26,26,24,0.04)]"
                            }`}
                          >
                            {/* Checkbox indicator */}
                            <span
                              className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                isSelected
                                  ? "bg-[#1A1A18] border-[#1A1A18]"
                                  : "border-gray-300 bg-white"
                              }`}
                            >
                              {isSelected && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  viewBox="0 0 12 12"
                                  fill="none"
                                >
                                  <path
                                    d="M2 6l3 3 5-5"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </span>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-[#1a1a1a] text-sm">
                                  {cat.name}
                                </span>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full border font-medium ${catTypeBadgeColor(cat.cat_type)}`}
                                >
                                  {CAT_TYPE_LABEL[cat.cat_type] || cat.cat_type}
                                </span>
                              </div>
                              <p className="text-xs text-[#888] mt-1">
                                {cat.products_count} product{cat.products_count !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving || loadingCategories}
                    className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[#1A1A18] bg-[#1A1A18] px-[22px] text-[13px] font-semibold text-white transition-colors hover:bg-[#12100E] disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Categories"}
                  </button>
                </div>
              </CardContent>
            </Card>
          </form>
        )}

        {/* ── Active Categories Summary ── */}
        {selectedOrgId && activeCategories.length > 0 && (
          <Card className="bg-white rounded-2xl border border-[rgba(26,26,24,.09)] shadow-none">
            <CardHeader className="pt-[22px]">
              <CardTitle className="flex items-center gap-3 text-sm font-semibold leading-[1.4] text-[#1A1A18]">
                <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#F5F4F0' }}>
                  <Tag size={14} color="#1A1A18" />
                </span>
                Currently Active Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 rounded-lg border border-[#e5e1d8] bg-white p-4"
                  >
                    <span
                      className={`text-xs px-2 py-1 rounded-full border font-medium ${catTypeBadgeColor(cat.cat_type)}`}
                    >
                      {CAT_TYPE_LABEL[cat.cat_type] || cat.cat_type}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#1a1a1a]">{cat.name}</p>
                      <p className="text-xs text-[#888]">
                        {cat.products_count} product{cat.products_count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GenericCategories;
