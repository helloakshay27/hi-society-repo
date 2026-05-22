import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Loader2, CheckCircle, XCircle } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { API_CONFIG } from "@/config/apiConfig";

interface GCMApp {
  id: number;
  gcm_key: string | null;
  project_code: string;
  firebase_json_configured: boolean;
  firebase_json?: string;
  created_at: string;
  updated_at: string;
}

interface GCMFormData {
  project_code: string;
  firebase_json: string;
}

const defaultForm: GCMFormData = {
  project_code: "",
  firebase_json: "",
};

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  "Content-Type": "application/json",
});

export const GCMList = () => {
  const baseURL = API_CONFIG.BASE_URL;

  const [apps, setApps] = useState<GCMApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<GCMApp | null>(null);
  const [formData, setFormData] = useState<GCMFormData>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [jsonError, setJsonError] = useState("");

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${baseURL}/rails_push_notifications/gcm_apps.json`,
        { headers: authHeaders() }
      );
      const data = response.data?.data ?? [];
      const pagination = response.data?.pagination;
      setApps(data);
      setTotalPages(pagination?.total_pages ?? 1);
    } catch {
      toast.error("Failed to load GCM apps");
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, [baseURL]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps, currentPage]);

  const filteredApps = apps.filter((app) =>
    app.project_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateJson = (value: string): boolean => {
    if (!value.trim()) {
      setJsonError("Firebase JSON is required");
      return false;
    }
    try {
      JSON.parse(value);
      setJsonError("");
      return true;
    } catch {
      setJsonError("Invalid JSON format");
      return false;
    }
  };

  const openCreate = () => {
    setFormData(defaultForm);
    setJsonError("");
    setCreateOpen(true);
  };

  const openEdit = async (app: GCMApp) => {
    setSelectedApp(app);
    setJsonError("");
    try {
      const response = await axios.get(
        `${baseURL}/rails_push_notifications/gcm_apps/${app.id}.json`,
        { headers: authHeaders() }
      );
      const detail: GCMApp = response.data?.data ?? app;
      setFormData({
        project_code: detail.project_code ?? "",
        firebase_json:
          typeof detail.firebase_json === "string"
            ? detail.firebase_json
            : detail.firebase_json
            ? JSON.stringify(detail.firebase_json, null, 2)
            : "",
      });
    } catch {
      setFormData({ project_code: app.project_code ?? "", firebase_json: "" });
    }
    setEditOpen(true);
  };

  const handleCreate = async () => {
    if (!formData.project_code.trim()) {
      toast.error("Project code is required");
      return;
    }
    if (!validateJson(formData.firebase_json)) return;

    setSubmitting(true);
    try {
      await axios.post(
        `${baseURL}/rails_push_notifications/gcm_apps.json`,
        {
          gcm_app: {
            project_code: formData.project_code,
            firebase_json: JSON.parse(formData.firebase_json),
          },
        },
        { headers: authHeaders() }
      );
      toast.success("GCM app created successfully");
      setCreateOpen(false);
      fetchApps();
    } catch {
      toast.error("Failed to create GCM app");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedApp) return;
    if (!validateJson(formData.firebase_json)) return;

    setSubmitting(true);
    try {
      await axios.patch(
        `${baseURL}/rails_push_notifications/gcm_apps/${selectedApp.id}`,
        {
          gcm_app: {
            firebase_json: JSON.parse(formData.firebase_json),
          },
        },
        { headers: authHeaders() }
      );
      toast.success("GCM app updated successfully");
      setEditOpen(false);
      fetchApps();
    } catch {
      toast.error("Failed to update GCM app");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) =>
    dateStr ? new Date(dateStr).toLocaleDateString("en-IN") : "-";

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <Toaster position="top-right" richColors closeButton />

      <div className="flex justify-between items-center">
        <h1 className="text-xl lg:text-2xl font-bold text-[#1a1a1a]">
          GCM Apps
        </h1>
        <Button
          onClick={openCreate}
          className="bg-[#C72030] hover:bg-[#A01828] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add GCM App
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
        <div className="mb-6">
          <Input
            placeholder="Search by project code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">
                  Actions
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  ID
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Project Code
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Firebase Configured
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Created At
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Updated At
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading GCM apps...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredApps.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-gray-500"
                  >
                    {searchTerm
                      ? "No apps found matching your search"
                      : "No GCM apps found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredApps.map((app) => (
                  <TableRow key={app.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(app)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{app.id}</TableCell>
                    <TableCell>{app.project_code || "-"}</TableCell>
                    <TableCell>
                      {app.firebase_json_configured ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3 h-3" />
                          Configured
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1 w-fit"
                        >
                          <XCircle className="w-3 h-3" />
                          Not Configured
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(app.created_at)}</TableCell>
                    <TableCell>{formatDate(app.updated_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add GCM App</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="project_code">
                Project Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="project_code"
                placeholder="e.g. flutter-resident-rustomjee"
                value={formData.project_code}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, project_code: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="firebase_json">
                Firebase JSON (Service Account){" "}
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="firebase_json"
                placeholder='{"type": "service_account", "project_id": "...", ...}'
                rows={10}
                className="font-mono text-xs"
                value={formData.firebase_json}
                onChange={(e) => {
                  setFormData((f) => ({ ...f, firebase_json: e.target.value }));
                  if (jsonError) validateJson(e.target.value);
                }}
              />
              {jsonError && (
                <p className="text-xs text-red-500">{jsonError}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting}
              className="bg-[#C72030] hover:bg-[#A01828] text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit GCM App #{selectedApp?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Project Code</Label>
              <Input value={formData.project_code} disabled className="bg-gray-50" />
              <p className="text-xs text-gray-500">Project code cannot be changed</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit_firebase_json">
                Firebase JSON (Service Account){" "}
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="edit_firebase_json"
                placeholder='{"type": "service_account", "project_id": "...", ...}'
                rows={10}
                className="font-mono text-xs"
                value={formData.firebase_json}
                onChange={(e) => {
                  setFormData((f) => ({ ...f, firebase_json: e.target.value }));
                  if (jsonError) validateJson(e.target.value);
                }}
              />
              {jsonError && (
                <p className="text-xs text-red-500">{jsonError}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={submitting}
              className="bg-[#C72030] hover:bg-[#A01828] text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GCMList;
