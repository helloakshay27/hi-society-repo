import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Tag, CheckSquare, AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFullUrl, getAuthHeader, API_CONFIG } from "@/config/apiConfig";

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
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "voucher_category":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "mile_category":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "indian_lounge":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f4ee] p-6">
      <div className=" mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="hover:bg-[#DBC2A9]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a]">Generic Categories</h1>
            <p className="text-sm text-[#666666]">
              Assign generic categories to an organization
            </p>
          </div>
        </div>

        {/* ── Organization Selection ── */}
        <Card className="border-[#e5e1d8] mb-6">
          <CardHeader className="bg-gradient-to-r from-[#f6f4ee] to-[#e5e1d8]">
            <CardTitle className="flex items-center gap-2 text-[#1a1a1a]">
              <Tag className="h-5 w-5" />
              Select Organization
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2">
              <Label htmlFor="org_select" className="text-[#1a1a1a]">
                Organization <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedOrgId}
                onValueChange={(value) => {
                  setSelectedOrgId(value);
                  setError(null);
                  setSuccess(null);
                }}
                disabled={loadingOrgs}
              >
                <SelectTrigger
                  id="org_select"
                  className="border-[#e5e1d8] focus:border-[#C72030] focus:ring-[#C72030]"
                >
                  <SelectValue
                    placeholder={loadingOrgs ? "Loading..." : "Select organization"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {loadingOrgs ? (
                    <SelectItem value="loading" disabled>
                      Loading organizations...
                    </SelectItem>
                  ) : organizations.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      No organizations found
                    </SelectItem>
                  ) : (
                    organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id.toString()}>
                        {org.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ── Category Selection (only shown after org is selected) ── */}
        {selectedOrgId && (
          <form onSubmit={handleSubmit}>
            <Card className="border-[#e5e1d8] mb-6">
              <CardHeader className="bg-gradient-to-r from-[#f6f4ee] to-[#e5e1d8]">
                <CardTitle className="flex items-center gap-2 text-[#1a1a1a]">
                  <CheckSquare className="h-5 w-5" />
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
                {error && (
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
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#C72030] mr-3" />
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
                            className={`flex items-start gap-3 w-full rounded-xl border-2 p-4 text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#C72030] focus:ring-offset-1 ${
                              isSelected
                                ? "border-[#C72030] bg-red-50 shadow-sm"
                                : "border-[#e5e1d8] bg-white hover:border-[#C72030] hover:bg-[#fdf7f7]"
                            }`}
                          >
                            {/* Checkbox indicator */}
                            <span
                              className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                isSelected
                                  ? "bg-[#C72030] border-[#C72030]"
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
                  <Button
                    type="submit"
                    disabled={saving || loadingCategories}
                    className="bg-[#C72030] hover:bg-[#A01828] text-white px-8 py-2 text-base font-semibold rounded shadow-none"
                  >
                    {saving ? "Saving..." : "Save Categories"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        )}

        {/* ── Active Categories Summary ── */}
        {selectedOrgId && activeCategories.length > 0 && (
          <Card className="border-[#e5e1d8]">
            <CardHeader className="bg-gradient-to-r from-[#f6f4ee] to-[#e5e1d8]">
              <CardTitle className="text-[#1a1a1a] text-base">
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
