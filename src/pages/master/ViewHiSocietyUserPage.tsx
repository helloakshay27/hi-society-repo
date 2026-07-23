import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { useAppSelector } from "@/store/hooks";
import {
  fetchHiSocietyUserDetail,
  fetchHiSocietyRoles,
  fetchHiSocietySocieties,
  fetchHiSocietyFlats,
  fetchHiSocietyCompanies,
  fetchHiSocietySnagProjects,
  clearDetail,
  clearFlats,
} from "@/store/slices/hiSocietyUsersSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Divider,
  Box,
} from "@mui/material";
import { MuiSearchableDropdown } from "@/components/MuiSearchableDropdown";
import { ArrowLeft, User, Mail, Phone, Building, Briefcase, Layers } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import moment from "moment";
import { HI_SOCIETY_CONFIG } from "@/config/apiConfig";

const fieldStyles = {
  height: { xs: 28, sm: 36, md: 45 },
  "& .MuiInputBase-input, & .MuiSelect-select": {
    padding: { xs: "8px", sm: "10px", md: "12px" },
  },
};

const selectMenuProps = {
  PaperProps: {
    style: {
      maxHeight: 224,
      width: "10%",
      backgroundColor: "white",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      boxShadow:
        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      zIndex: 9999,
    },
  },
  disablePortal: true,
  disableAutoFocus: true,
  disableEnforceFocus: true,
};

const getStatusBadge = (status: string) => {
  if (status === "Approved") return <Badge className="bg-green-600 text-white">Approved</Badge>;
  if (status === "Pending") return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
  if (status === "Rejected") return <Badge className="bg-red-500 text-white">Rejected</Badge>;
  return <Badge className="bg-gray-500 text-white">{status || "Unknown"}</Badge>;
};

export const ViewHiSocietyUserPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch<AppDispatch>();

  const {
    selectedDetail,
    detailLoading,
    roles,
    societies,
    flats,
    companies,
    snagProjects,
    flatsLoading,
    societiesLoading,
    companiesLoading,
    snagProjectsLoading,
  } = useAppSelector((state: RootState) => state.hiSocietyUsers);

  const [statusModal, setStatusModal] = useState(false);
  const [editingSociety, setEditingSociety] = useState<{ id: number; society_id: string; role_id: number; status: string } | null>(null);
  const [statusForm, setStatusForm] = useState({ approve: "true", role_id: "" });
  const [statusLoading, setStatusLoading] = useState(false);

  const [assocSocietyModal, setAssocSocietyModal] = useState(false);
  const [selectedSociety, setSelectedSociety] = useState<string | number>("");
  const [selectedFlat, setSelectedFlat] = useState<string | number>("");
  const [ownership, setOwnership] = useState("owner");
  const [intercom, setIntercom] = useState("");
  const [landline, setLandline] = useState("");
  const [assocSocietyLoading, setAssocSocietyLoading] = useState(false);

  const [assocCompanyModal, setAssocCompanyModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string | number>("");
  const [assocCompanyLoading, setAssocCompanyLoading] = useState(false);

  const [assocSnagModal, setAssocSnagModal] = useState(false);
  const [selectedSnag, setSelectedSnag] = useState<string | number>("");
  const [assocSnagLoading, setAssocSnagLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<"societies" | "companies" | "snag">("societies");
  const [associatedCompanies, setAssociatedCompanies] = useState<any[]>([]);
  const [assocCompaniesLoading, setAssocCompaniesLoading] = useState(false);
  const [associatedSnagProjects, setAssociatedSnagProjects] = useState<any[]>([]);
  const [assocSnagProjectsLoading, setAssocSnagProjectsLoading] = useState(false);

  // UsPhase modal
  const [usPhaseModal, setUsPhaseModal] = useState(false);
  const [usPhaseRow, setUsPhaseRow] = useState<{ id: number; id_society: string } | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string | number>("");
  const [usPhaseLoading, setUsPhaseLoading] = useState(false);

  const fetchAssociatedCompanies = useCallback(async () => {
    if (!id) return;
    setAssocCompaniesLoading(true);
    try {
      const res = await axios.get(`${HI_SOCIETY_CONFIG.BASE_URL}/associate.json?token=${HI_SOCIETY_CONFIG.TOKEN}`, {
        params: { user_id: Number(id) },
      });
      setAssociatedCompanies(res.data.associated_companies || []);
    } catch {
      setAssociatedCompanies([]);
    } finally {
      setAssocCompaniesLoading(false);
    }
  }, [id]);

  const fetchAssociatedSnagProjects = useCallback(async () => {
    if (!id) return;
    setAssocSnagProjectsLoading(true);
    try {
      const res = await axios.get(`${HI_SOCIETY_CONFIG.BASE_URL}/associate_snag.json?token=${HI_SOCIETY_CONFIG.TOKEN}`, {
        params: { user_id: Number(id) },
      });
      setAssociatedSnagProjects(res.data.associated_snag_projects || []);
    } catch {
      setAssociatedSnagProjects([]);
    } finally {
      setAssocSnagProjectsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      dispatch(fetchHiSocietyUserDetail(Number(id)));
      dispatch(fetchHiSocietyRoles());
      fetchAssociatedCompanies();
      fetchAssociatedSnagProjects();
    }
    return () => { dispatch(clearDetail()); };
  }, [id, dispatch, fetchAssociatedCompanies, fetchAssociatedSnagProjects]);

  const refreshDetail = () => {
    if (id) dispatch(fetchHiSocietyUserDetail(Number(id)));
  };

  const openStatusModal = (us: { id: number; id_society: string; role_id: number; status: string }) => {
    setEditingSociety({ id: us.id, society_id: us.id_society, role_id: us.role_id, status: us.status });
    setStatusForm({ approve: us.status === "Approved" ? "true" : "false", role_id: String(us.role_id) });
    setStatusModal(true);
  };

  const handleStatusSubmit = async () => {
    if (!editingSociety) return;
    setStatusLoading(true);
    try {
      await axios.put(
        `${HI_SOCIETY_CONFIG.BASE_URL}/admin/user_societies/${editingSociety.id}.json?token=${HI_SOCIETY_CONFIG.TOKEN}`,
        { id_society: Number(editingSociety.society_id), approve: statusForm.approve === "true", role_id: Number(statusForm.role_id) }
      );
      toast.success("User society updated successfully");
      setStatusModal(false);
      refreshDetail();
    } catch {
      toast.error("Failed to update user society");
    } finally {
      setStatusLoading(false);
    }
  };

  const openAssocSocietyModal = () => {
    dispatch(fetchHiSocietySocieties());
    dispatch(clearFlats());
    setSelectedSociety("");
    setSelectedFlat("");
    setOwnership("owner");
    setIntercom("");
    setLandline("");
    setAssocSocietyModal(true);
  };

  const handleSocietyChange = (val: string | number) => {
    setSelectedSociety(val);
    setSelectedFlat("");
    if (val) dispatch(fetchHiSocietyFlats(Number(val)));
    else dispatch(clearFlats());
  };

  const handleAssocSocietySubmit = async () => {
    if (!selectedSociety || !selectedFlat) {
      toast.error("Please select society and flat");
      return;
    }
    setAssocSocietyLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("user_flat[id_user]", id!);
      formData.append("user_flat[society_id]", String(selectedSociety));
      formData.append("user_flat[society_flat_id]", String(selectedFlat));
      formData.append("user_flat[ownership]", ownership);
      formData.append("user_flat[intercom]", intercom);
      formData.append("user_flat[landline]", landline);
      await axios.post(
        `${HI_SOCIETY_CONFIG.BASE_URL}/admin/user_flats.json?token=${HI_SOCIETY_CONFIG.TOKEN}`,
        formData,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      toast.success("Society associated successfully");
      setAssocSocietyModal(false);
      refreshDetail();
    } catch (error: any) {
      const errData = error?.response?.data;
      if (errData?.id_user?.some((m: string) => m.includes("has already been taken"))) {
        toast.error("Society has already been associated");
      } else {
        toast.error(errData ? JSON.stringify(errData) : "Failed to associate society");
      }
    } finally {
      setAssocSocietyLoading(false);
    }
  };

  const openAssocCompanyModal = () => {
    dispatch(fetchHiSocietyCompanies());
    setSelectedCompany("");
    setAssocCompanyModal(true);
  };

  const handleAssocCompanySubmit = async () => {
    if (!selectedCompany) { toast.error("Please select a company"); return; }
    setAssocCompanyLoading(true);
    try {
      await axios.post(
        `${HI_SOCIETY_CONFIG.BASE_URL}/associate.json?token=${HI_SOCIETY_CONFIG.TOKEN}`,
        { company_id: Number(selectedCompany), pms_company_setup: { user_id: Number(id) } }
      );
      toast.success("Company associated successfully");
      setAssocCompanyModal(false);
      fetchAssociatedCompanies();
    } catch {
      toast.error("Failed to associate company");
    } finally {
      setAssocCompanyLoading(false);
    }
  };

  const openUsPhaseModal = (us: { id: number; id_society: string }) => {
    setUsPhaseRow(us);
    setSelectedPhase("");
    setUsPhaseModal(true);
  };

  const handleUsPhaseSubmit = async () => {
    if (!selectedPhase || !usPhaseRow) { toast.error("Please select a phase"); return; }
    setUsPhaseLoading(true);
    try {
      await axios.post(
        `${HI_SOCIETY_CONFIG.BASE_URL}/us_phases.json?token=${HI_SOCIETY_CONFIG.TOKEN}`,
        { user_society_id: usPhaseRow.id, phase: String(selectedPhase) }
      );
      toast.success("Phase associated successfully");
      setUsPhaseModal(false);
      refreshDetail();
    } catch {
      toast.error("Failed to associate phase");
    } finally {
      setUsPhaseLoading(false);
    }
  };

  const openAssocSnagModal = () => {
    dispatch(fetchHiSocietySnagProjects());
    setSelectedSnag("");
    setAssocSnagModal(true);
  };

  const handleAssocSnagSubmit = async () => {
    if (!selectedSnag) { toast.error("Please select a snag project"); return; }
    setAssocSnagLoading(true);
    try {
      await axios.post(
        `${HI_SOCIETY_CONFIG.BASE_URL}/associate_snag.json?token=${HI_SOCIETY_CONFIG.TOKEN}`,
        { snag_project_id: Number(selectedSnag), pms_company_setup: { user_id: Number(id) } }
      );
      toast.success("Snag project associated successfully");
      setAssocSnagModal(false);
      fetchAssociatedSnagProjects();
    } catch {
      toast.error("Failed to associate snag project");
    } finally {
      setAssocSnagLoading(false);
    }
  };

  if (detailLoading) {
    return (
      <div className="w-full p-6 flex items-center justify-center h-64">
        <div className="text-lg">Loading user details...</div>
      </div>
    );
  }

  if (!selectedDetail) {
    return (
      <div className="w-full p-6 flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">User not found</div>
      </div>
    );
  }

  const { user, user_societies } = selectedDetail;

  const societyOptions = societies.map((s) => ({ id: s.id, value: String(s.id), label: s.building_name }));
  const flatOptions = flats.map((f) => ({ id: f.id, value: String(f.id), label: f.flat_no + (f.block_no ? ` (${f.block_no})` : "") }));
  const companyOptions = companies.map((c) => ({ id: c.id, value: String(c.id), label: c.name }));
  const snagOptions = snagProjects.map((s) => ({ id: s.id, value: String(s.id), label: s.name }));

  const modalPaperProps = {
    sx: {
      borderRadius: "12px",
      minWidth: 480,
      maxWidth: 520,
    },
  };

  const btnCancel = {
    variant: "outlined" as const,
    sx: {
      flex: 1,
      height: 44,
      borderColor: "#e2e8f0",
      color: "#374151",
      textTransform: "none",
      borderRadius: "8px",
      "&:hover": { borderColor: "#C72030", color: "#C72030" },
    },
  };

  const btnSubmit = {
    variant: "contained" as const,
    sx: {
      flex: 1,
      height: 44,
      backgroundColor: "#C72030",
      textTransform: "none",
      borderRadius: "8px",
      "&:hover": { backgroundColor: "#a01828" },
    },
  };

  return (
    <div className="w-full p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex gap-2">
          <Button size="sm" onClick={openAssocSocietyModal} className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Building className="w-4 h-4" />
            Associate Society
          </Button>
          <Button size="sm" onClick={openAssocCompanyModal} className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Briefcase className="w-4 h-4" />
            Associate Company
          </Button>
          <Button size="sm" onClick={openAssocSnagModal} className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Layers className="w-4 h-4" />
            Associate Snag
          </Button>
        </div>
      </div>

      {/* User profile card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#f97316] to-[#d9660f] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-white">
                {user.firstname?.charAt(0) || user.email.charAt(0).toUpperCase()}
                {user.lastname?.charAt(0) || ""}
              </span>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-800">{user.full_name || user.email}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1"><Mail className="w-4 h-4" />{user.email}</div>
                {user.mobile && <div className="flex items-center gap-1"><Phone className="w-4 h-4" />{user.mobile}</div>}
                <div className="flex items-center gap-1"><User className="w-4 h-4" />ID: {user.id}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Societies / Companies / Snag */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b bg-gray-50 px-0 pt-0">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("societies")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "societies"
                  ? "border-[#C72030] text-[#C72030]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              User Societies
            </button>
            <button
              onClick={() => setActiveTab("companies")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "companies"
                  ? "border-[#C72030] text-[#C72030]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              User Companies
            </button>
            <button
              onClick={() => setActiveTab("snag")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "snag"
                  ? "border-[#C72030] text-[#C72030]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              User Snag
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Societies Tab */}
          {activeTab === "societies" && (
            user_societies.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No societies associated</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Society</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Add Phase</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Phases</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Approval</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user_societies.map((us) => (
                      <tr key={us.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700">{us.building_name}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openUsPhaseModal({ id: us.id, id_society: us.id_society })}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                          >
                            UsPhase
                          </button>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{us.phase_names || "-"}</td>
                        <td className="px-4 py-3">{getStatusBadge(us.status)}</td>
                        <td className="px-4 py-3 text-gray-700">{us.role_name}</td>
                        <td className="px-4 py-3 text-gray-500">{moment(us.created_at).format("DD/MM/YYYY HH:mm")}</td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openStatusModal({ id: us.id, id_society: us.id_society, role_id: us.role_id, status: us.status })}
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Companies Tab */}
          {activeTab === "companies" && (
            assocCompaniesLoading ? (
              <div className="p-6 text-center text-gray-500">Loading companies...</div>
            ) : associatedCompanies.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No companies associated</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Company Name</th>
                      {/* <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {associatedCompanies.map((uc: any, idx: number) => (
                      <tr key={uc.id || idx} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700">{uc.id}</td>
                        <td className="px-4 py-3 text-gray-700">{uc.name || `Company #${uc.id}`}</td>
                        {/* <td className="px-4 py-3">
                          <Button size="sm" variant="outline" disabled>
                            Edit
                          </Button>
                        </td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Snag Tab */}
          {activeTab === "snag" && (
            assocSnagProjectsLoading ? (
              <div className="p-6 text-center text-gray-500">Loading snag projects...</div>
            ) : associatedSnagProjects.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No snag projects associated</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Project Name</th>
                      {/* <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {associatedSnagProjects.map((us: any, idx: number) => (
                      <tr key={us.id || idx} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700">{us.id}</td>
                        <td className="px-4 py-3 text-gray-700">{us.name || `Project #${us.id}`}</td>
                          {/* <td className="px-4 py-3">
                            <Button size="sm" variant="outline" disabled>
                              Edit
                            </Button>
                          </td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Status/Role Change Modal */}
      <Dialog open={statusModal} onClose={() => setStatusModal(false)} PaperProps={modalPaperProps}>
        <DialogTitle sx={{ fontWeight: 600, fontSize: 18, pb: 1 }}>Update User Society</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2, pb: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink>Status</InputLabel>
              <Select
                value={statusForm.approve}
                onChange={(e) => setStatusForm((p) => ({ ...p, approve: e.target.value as string }))}
                label="Status"
                displayEmpty
                MenuProps={selectMenuProps}
                sx={fieldStyles}
              >
                <MenuItem value="true">Approve</MenuItem>
                <MenuItem value="false">Reject</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink>Role</InputLabel>
              <Select
                value={statusForm.role_id}
                onChange={(e) => setStatusForm((p) => ({ ...p, role_id: e.target.value as string }))}
                label="Role"
                displayEmpty
                MenuProps={selectMenuProps}
                sx={fieldStyles}
              >
                <MenuItem value=""><em>Select Role</em></MenuItem>
                {roles.map((r) => (
                  <MenuItem key={r.id} value={String(r.id)}>{r.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Box component="button" onClick={() => setStatusModal(false)} {...btnCancel}
            sx={{ ...btnCancel.sx, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", borderRadius: "8px", height: 44, flex: 1 }}
          >
            Cancel
          </Box>
          <Box
            component="button"
            onClick={handleStatusSubmit}
            disabled={statusLoading}
            sx={{ ...btnSubmit.sx, border: "none", cursor: "pointer", color: "white", height: 44, flex: 1 }}
          >
            {statusLoading ? "Updating..." : "Update"}
          </Box>
        </DialogActions>
      </Dialog>

      {/* Associate Society Modal */}
      <Dialog open={assocSocietyModal} onClose={() => setAssocSocietyModal(false)} PaperProps={modalPaperProps}>
        <DialogTitle sx={{ fontWeight: 600, fontSize: 18, pb: 1 }}>Associate Society</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2, pb: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink>Society</InputLabel>
              <Select
                value={selectedSociety?.toString() || ""}
                onChange={(e) => handleSocietyChange(e.target.value as string)}
                label="Society"
                displayEmpty
                MenuProps={selectMenuProps}
                sx={fieldStyles}
              >
                <MenuItem value="" disabled>
                  Select Society
                </MenuItem>
                {societyOptions.map((s) => (
                  <MenuItem key={s.id} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink>Flat</InputLabel>
              <Select
                value={selectedFlat?.toString() || ""}
                onChange={(e) => setSelectedFlat(e.target.value as string)}
                label="Flat"
                displayEmpty
                MenuProps={selectMenuProps}
                sx={fieldStyles}
                disabled={!selectedSociety || flatsLoading}
              >
                <MenuItem value="" disabled>
                  {!selectedSociety
                    ? "Select society first"
                    : flatsLoading
                      ? "Loading flats..."
                      : flatOptions.length === 0
                        ? "No flats available"
                        : "Select Flat"}
                </MenuItem>
                {flatOptions.map((f) => (
                  <MenuItem key={f.id} value={f.value}>
                    {f.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink>Ownership</InputLabel>
              <Select
                value={ownership}
                onChange={(e) => setOwnership(e.target.value as string)}
                label="Ownership"
                displayEmpty
                MenuProps={selectMenuProps}
                sx={fieldStyles}
              >
                <MenuItem value="owner">Owner</MenuItem>
                <MenuItem value="tenant">Tenant</MenuItem>
                <MenuItem value="occupant">Occupant</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Intercom"
              placeholder="Intercom number"
              value={intercom}
              onChange={(e) => setIntercom(e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />
            <TextField
              label="Landline"
              placeholder="Landline number"
              value={landline}
              onChange={(e) => setLandline(e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Box component="button" onClick={() => setAssocSocietyModal(false)}
            sx={{ ...btnCancel.sx, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", borderRadius: "8px", height: 44, flex: 1, "&:hover": { borderColor: "#f97316", color: "#f97316" } }}
          >
            Cancel
          </Box>
          <Box component="button" onClick={handleAssocSocietySubmit} disabled={assocSocietyLoading}
            className="flex-1 bg-[#C72030] hover:bg-[#B01C29] text-white px-10 h-11 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assocSocietyLoading ? "Associating..." : "Associate"}
          </Box>
        </DialogActions>
      </Dialog>

      {/* Associate Company Modal */}
      <Dialog open={assocCompanyModal} onClose={() => setAssocCompanyModal(false)} PaperProps={modalPaperProps}>
        <DialogTitle sx={{ fontWeight: 600, fontSize: 18, pb: 1 }}>Associate Company</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2, pb: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <MuiSearchableDropdown
              label="Company"
              value={selectedCompany}
              onChange={setSelectedCompany}
              options={companyOptions}
              placeholder="Select Company"
              loading={companiesLoading}
              loadingText="Loading companies..."
              fullWidth
            />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Box component="button" onClick={() => setAssocCompanyModal(false)}
            sx={{ ...btnCancel.sx, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", borderRadius: "8px", height: 44, flex: 1, "&:hover": { borderColor: "#f97316", color: "#f97316" } }}
          >
            Cancel
          </Box>
          <Box component="button" onClick={handleAssocCompanySubmit} disabled={assocCompanyLoading}
            className="flex-1 bg-[#C72030] hover:bg-[#B01C29] text-white px-10 h-11 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assocCompanyLoading ? "Associating..." : "Associate"}
          </Box>
        </DialogActions>
      </Dialog>

      {/* UsPhase Modal */}
      <Dialog open={usPhaseModal} onClose={() => setUsPhaseModal(false)} PaperProps={modalPaperProps}>
        <DialogTitle sx={{ fontWeight: 600, fontSize: 18, pb: 1 }}>Select Phase</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2, pb: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink>Phases</InputLabel>
              <Select
                value={selectedPhase}
                onChange={(e) => setSelectedPhase(e.target.value as string)}
                label="Phases"
                displayEmpty
                MenuProps={selectMenuProps}
                sx={fieldStyles}
              >
                <MenuItem value=""><em>Select Phases</em></MenuItem>
                {["Live In Site", "Post Possession", "Post Sales", "Pre Sales", "Brokerz", "Appointmentz", "Engineering"].map((phase) => (
                  <MenuItem key={phase} value={phase}>{phase}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Box component="button" onClick={() => setUsPhaseModal(false)}
            sx={{ ...btnCancel.sx, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", borderRadius: "8px", height: 44, flex: 1 }}
          >
            Cancel
          </Box>
          <Box component="button" onClick={handleUsPhaseSubmit} disabled={usPhaseLoading}
            sx={{ ...btnSubmit.sx, border: "none", cursor: "pointer", color: "white", height: 44, flex: 1 }}
          >
            {usPhaseLoading ? "Submitting..." : "Submit"}
          </Box>
        </DialogActions>
      </Dialog>

      {/* Associate Snag Modal */}
      <Dialog open={assocSnagModal} onClose={() => setAssocSnagModal(false)} PaperProps={modalPaperProps}>
        <DialogTitle sx={{ fontWeight: 600, fontSize: 18, pb: 1 }}>Associate Snag Project</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2, pb: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <MuiSearchableDropdown
              label="Snag Project"
              value={selectedSnag}
              onChange={setSelectedSnag}
              options={snagOptions}
              placeholder="Select Snag Project"
              loading={snagProjectsLoading}
              loadingText="Loading snag projects..."
              fullWidth
            />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Box component="button" onClick={() => setAssocSnagModal(false)}
            sx={{ ...btnCancel.sx, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", borderRadius: "8px", height: 44, flex: 1, "&:hover": { borderColor: "#f97316", color: "#f97316" } }}
          >
            Cancel
          </Box>
          <Box component="button" onClick={handleAssocSnagSubmit} disabled={assocSnagLoading}
            className="flex-1 bg-[#C72030] hover:bg-[#B01C29] text-white px-10 h-11 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assocSnagLoading ? "Associating..." : "Associate"}
          </Box>
        </DialogActions>
      </Dialog>
    </div>
  );
};
