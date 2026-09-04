import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Loader2 } from "lucide-react";
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

interface APNSApp {
  id: number;
  sandbox_mode: boolean;
  created_at: string;
  updated_at: string;
  apns_dev_cert?: string;
  apns_prod_cert?: string;
}

interface APNSFormData {
  apns_dev_cert: string;
  apns_prod_cert: string;
  sandbox_mode: boolean;
}

const defaultForm: APNSFormData = {
  apns_dev_cert: "",
  apns_prod_cert: "",
  sandbox_mode: false,
};

const authHeaders = () => ({
  Authorization: `Bearer ${API_CONFIG.TOKEN}`,
  "Content-Type": "application/json",
});

export const APNSList = () => {
  const baseURL = API_CONFIG.BASE_URL;

  const [apps, setApps] = useState<APNSApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<APNSApp | null>(null);
  const [formData, setFormData] = useState<APNSFormData>(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${baseURL}/rails_push_notifications/apns_apps`,
        { headers: authHeaders() }
      );
      const data = response.data?.data ?? [];
      const pagination = response.data?.pagination;
      setApps(data);
      setTotalPages(pagination?.total_pages ?? 1);
    } catch {
      toast.error("Failed to load APNS apps");
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, [baseURL]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps, currentPage]);

  const filteredApps = apps.filter((app) =>
    String(app.id).includes(searchTerm)
  );

  const openCreate = () => {
    setFormData(defaultForm);
    setCreateOpen(true);
  };

  const openEdit = async (app: APNSApp) => {
    setSelectedApp(app);
    try {
      const response = await axios.get(
        `${baseURL}/rails_push_notifications/apns_apps/${app.id}`,
        { headers: authHeaders() }
      );
      const detail: APNSApp = response.data?.data ?? app;
      setFormData({
        apns_dev_cert: detail.apns_dev_cert ?? "",
        apns_prod_cert: detail.apns_prod_cert ?? "",
        sandbox_mode: detail.sandbox_mode ?? false,
      });
    } catch {
      setFormData({
        apns_dev_cert: "",
        apns_prod_cert: "",
        sandbox_mode: app.sandbox_mode ?? false,
      });
    }
    setEditOpen(true);
  };

  const validateForm = (data: APNSFormData): boolean => {
    if (!data.apns_dev_cert.trim() && !data.apns_prod_cert.trim()) {
      toast.error("At least one certificate (dev or prod) is required");
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm(formData)) return;

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        sandbox_mode: formData.sandbox_mode,
      };
      if (formData.apns_dev_cert.trim())
        payload.apns_dev_cert = formData.apns_dev_cert;
      if (formData.apns_prod_cert.trim())
        payload.apns_prod_cert = formData.apns_prod_cert;

      await axios.post(
        `${baseURL}/rails_push_notifications/apns_apps`,
        { apns_app: payload },
        { headers: authHeaders() }
      );
      toast.success("APNS app created successfully");
      setCreateOpen(false);
      fetchApps();
    } catch {
      toast.error("Failed to create APNS app");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedApp) return;

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        sandbox_mode: formData.sandbox_mode,
      };
      if (formData.apns_dev_cert.trim())
        payload.apns_dev_cert = formData.apns_dev_cert;

      await axios.patch(
        `${baseURL}/rails_push_notifications/apns_apps/${selectedApp.id}`,
        { apns_app: payload },
        { headers: authHeaders() }
      );
      toast.success("APNS app updated successfully");
      setEditOpen(false);
      fetchApps();
    } catch {
      toast.error("Failed to update APNS app");
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
          APNS Apps
        </h1>
        <Button
          onClick={openCreate}
          className="bg-[#C72030] hover:bg-[#A01828] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add APNS App
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
        <div className="mb-6">
          <Input
            placeholder="Search by ID..."
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
                  Sandbox Mode
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
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading APNS apps...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredApps.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-gray-500"
                  >
                    {searchTerm
                      ? "No apps found matching your search"
                      : "No APNS apps found"}
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
                    <TableCell>
                      {app.sandbox_mode ? (
                        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                          Sandbox
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          Production
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
            <DialogTitle>Add APNS App</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <input
                type="checkbox"
                id="create_sandbox_mode"
                title="Sandbox Mode"
                checked={formData.sandbox_mode}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, sandbox_mode: e.target.checked }))
                }
                className="h-4 w-4 accent-[#C72030]"
              />
              <div>
                <Label htmlFor="create_sandbox_mode" className="cursor-pointer font-medium">
                  Sandbox Mode
                </Label>
                <p className="text-xs text-gray-500">
                  Enable for development/testing; disable for production
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="create_dev_cert">
                Development Certificate (PEM)
              </Label>
              <Textarea
                id="create_dev_cert"
                placeholder={"-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"}
                rows={6}
                className="font-mono text-xs"
                value={formData.apns_dev_cert}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, apns_dev_cert: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="create_prod_cert">
                Production Certificate (PEM)
              </Label>
              <Textarea
                id="create_prod_cert"
                placeholder={"-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"}
                rows={6}
                className="font-mono text-xs"
                value={formData.apns_prod_cert}
                onChange={(e) =>
                  setFormData((f) => ({
                    ...f,
                    apns_prod_cert: e.target.value,
                  }))
                }
              />
            </div>
            <p className="text-xs text-gray-500">
              At least one certificate (dev or prod) is required.
            </p>
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
            <DialogTitle>Edit APNS App #{selectedApp?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <input
                type="checkbox"
                id="edit_sandbox_mode"
                title="Sandbox Mode"
                checked={formData.sandbox_mode}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, sandbox_mode: e.target.checked }))
                }
                className="h-4 w-4 accent-[#C72030]"
              />
              <div>
                <Label htmlFor="edit_sandbox_mode" className="cursor-pointer font-medium">
                  Sandbox Mode
                </Label>
                <p className="text-xs text-gray-500">
                  Enable for development/testing; disable for production
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit_dev_cert">
                Development Certificate (PEM)
              </Label>
              <Textarea
                id="edit_dev_cert"
                placeholder={"-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"}
                rows={6}
                className="font-mono text-xs"
                value={formData.apns_dev_cert}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, apns_dev_cert: e.target.value }))
                }
              />
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

export default APNSList;
