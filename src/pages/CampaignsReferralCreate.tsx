import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem } from "@mui/material";
import {
  createCampaignReferral,
  getLeadStages,
  getActivities,
  getLeadStatuses,
  getLeadSubSources,
  getProjects,
  getProjectLeadSources,
  getProjectFlatTypes,
  LeadStage,
  Activity,
  LeadStatus,
  LeadSource,
  LeadSubSource,
  Project,
  FlatType,
} from "@/services/campaignReferralService";

const fieldStyles = {
  height: "45px",
  backgroundColor: "#fff",
  borderRadius: "4px",
  "& .MuiOutlinedInput-root": {
    height: "45px",
    "& fieldset": { borderColor: "#ddd" },
    "&:hover fieldset": { borderColor: "#C72030" },
    "&.Mui-focused fieldset": { borderColor: "#C72030" },
  },
  "& .MuiInputLabel-root": {
    "&.Mui-focused": { color: "#C72030" },
  },
};

const CampaignsReferralCreate: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dropdown data from APIs
  const [projects, setProjects] = useState<Project[]>([]);
  const [flatTypes, setFlatTypes] = useState<FlatType[]>([]);
  const [leadStages, setLeadStages] = useState<LeadStage[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [leadSubSources, setLeadSubSources] = useState<LeadSubSource[]>([]);

  const [formData, setFormData] = useState({
    projectId: "",
    flatTypeId: "",
    clientName: "",
    mobile: "",
    alternateMobile: "",
    clientEmail: "",
    leadStage: "",
    activity: "",
    leadStatus: "",
    leadSource: "",
    leadSubSource: "",
  });

  // Fetch static dropdown data on mount
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [projectsData, stagesData, activitiesData, statusesData] =
          await Promise.all([
            getProjects(),
            getLeadStages(),
            getActivities(),
            getLeadStatuses(),
          ]);
        setProjects(Array.isArray(projectsData) ? projectsData : []);
        setLeadStages(Array.isArray(stagesData) ? stagesData : []);
        setActivities(Array.isArray(activitiesData) ? activitiesData : []);
        setLeadStatuses(Array.isArray(statusesData) ? statusesData : []);
      } catch (err) {
        console.error("Failed to fetch dropdown data:", err);
      }
    };
    fetchDropdownData();
  }, []);

  // Fetch project-specific lead sources & flat types when project changes
  useEffect(() => {
    if (!formData.projectId) {
      setLeadSources([]);
      setFlatTypes([]);
      setFormData((prev) => ({ ...prev, leadSource: "", leadSubSource: "", flatTypeId: "" }));
      return;
    }
    const pid = parseInt(formData.projectId, 10);
    const fetchProjectData = async () => {
      try {
        const [sourcesData, flatsData] = await Promise.all([
          getProjectLeadSources(pid),
          getProjectFlatTypes(pid),
        ]);
        setLeadSources(Array.isArray(sourcesData) ? sourcesData : []);
        setFlatTypes(Array.isArray(flatsData) ? flatsData : []);
      } catch (err) {
        console.error("Failed to fetch project data:", err);
        setLeadSources([]);
        setFlatTypes([]);
      }
    };
    fetchProjectData();
  }, [formData.projectId]);

  // Fetch sub-sources when lead source changes
  useEffect(() => {
    if (!formData.leadSource) {
      setLeadSubSources([]);
      return;
    }
    const fetchSubSources = async () => {
      try {
        const data = await getLeadSubSources(parseInt(formData.leadSource, 10));
        setLeadSubSources(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch sub-sources:", err);
        setLeadSubSources([]);
      }
    };
    fetchSubSources();
  }, [formData.leadSource]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "leadSource") {
      setFormData((prev) => ({ ...prev, leadSource: value, leadSubSource: "" }));
    }
    if (field === "projectId") {
      setFormData((prev) => ({
        ...prev,
        projectId: value,
        flatTypeId: "",
        leadSource: "",
        leadSubSource: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.projectId || !formData.clientName || !formData.mobile) {
      alert("Please fill in all required fields: Project, Client Name, and Mobile");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const selectedProject = projects.find((p) => String(p.id) === formData.projectId);
      const payload = {
        referral: {
          ref_phone: formData.mobile,
          ref_name: formData.clientName,
          project_name: selectedProject?.name || selectedProject?.project_name || "",
          project_id: formData.projectId ? parseInt(formData.projectId, 10) : null,
          status: formData.leadStatus || undefined,
          alternate_mob: formData.alternateMobile || null,
          client_email: formData.clientEmail || null,
          flat_type_id: formData.flatTypeId ? parseInt(formData.flatTypeId, 10) : null,
          lead_stage_id: formData.leadStage ? parseInt(formData.leadStage, 10) : null,
          activity_id: formData.activity ? parseInt(formData.activity, 10) : null,
          lead_source_id: formData.leadSource ? parseInt(formData.leadSource, 10) : null,
          lead_sub_source_id: formData.leadSubSource ? parseInt(formData.leadSubSource, 10) : null,
        },
      };

      await createCampaignReferral(payload);
      navigate("/campaigns/referrals");
    } catch (err) {
      console.error("Failed to create referral:", err);
      setError("Failed to create referral. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="mx-auto">
        {/* Header */}
        <div className="bg-[#F2EEE9] text-[#BF213E] px-4 py-3 mb-6 rounded-t">
          <h1 className="text-lg font-medium">CREATE LEAD</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-b shadow-sm overflow-hidden">
          {error && (
            <div className="mx-6 mt-6 p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Project - Dynamic dropdown */}
            <FormControl fullWidth variant="outlined" required sx={fieldStyles}>
              <InputLabel shrink>
                Project <span style={{ color: "#C72030" }}>*</span>
              </InputLabel>
              <MuiSelect
                value={formData.projectId}
                onChange={(e) => handleInputChange("projectId", e.target.value)}
                label="Project *"
                notched
                displayEmpty
              >
                <MenuItem value="">Select Project</MenuItem>
                {projects.map((p) => (
                  <MenuItem key={p.id} value={String(p.id)}>
                    {p.name || p.project_name}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>

            {/* Flat Type - Dynamic dropdown based on selected project */}
            <FormControl
              fullWidth
              variant="outlined"
              disabled={!formData.projectId}
              sx={fieldStyles}
            >
              <InputLabel shrink>Flat Type</InputLabel>
              <MuiSelect
                value={formData.flatTypeId}
                onChange={(e) => handleInputChange("flatTypeId", e.target.value)}
                label="Flat Type"
                notched
                displayEmpty
              >
                <MenuItem value="">
                  {formData.projectId ? "Select Flat Type" : "Select Project first"}
                </MenuItem>
                {flatTypes.map((ft) => (
                  <MenuItem key={ft.id} value={String(ft.id)}>
                    {ft.appartment_type
                      ? `${ft.society_flat_type} (${ft.appartment_type})`
                      : ft.society_flat_type}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>

            {/* Client Name */}
            <TextField
              label={
                <span>
                  Client Name <span style={{ color: "#C72030" }}>*</span>
                </span>
              }
              placeholder="Client Name"
              value={formData.clientName}
              onChange={(e) => handleInputChange("clientName", e.target.value)}
              fullWidth
              variant="outlined"
              required
              InputLabelProps={{ shrink: true }}
              sx={fieldStyles}
            />

            {/* Mobile */}
            <TextField
              label={
                <span>
                  Mobile <span style={{ color: "#C72030" }}>*</span>
                </span>
              }
              placeholder="Phone"
              value={formData.mobile}
              onChange={(e) => handleInputChange("mobile", e.target.value)}
              fullWidth
              variant="outlined"
              required
              type="tel"
              InputLabelProps={{ shrink: true }}
              sx={fieldStyles}
            />

            {/* Alternate Mobile */}
            <TextField
              label="Alternate Mobile"
              placeholder="Alternate Phone"
              value={formData.alternateMobile}
              onChange={(e) => handleInputChange("alternateMobile", e.target.value)}
              fullWidth
              variant="outlined"
              type="tel"
              InputLabelProps={{ shrink: true }}
              sx={fieldStyles}
            />

            {/* Client Email */}
            <TextField
              label="Client Email"
              placeholder="Email"
              value={formData.clientEmail}
              onChange={(e) => handleInputChange("clientEmail", e.target.value)}
              fullWidth
              variant="outlined"
              type="email"
              InputLabelProps={{ shrink: true }}
              sx={fieldStyles}
            />

            {/* Lead Stage */}
            <FormControl fullWidth variant="outlined" sx={fieldStyles}>
              <InputLabel shrink>Lead Stage</InputLabel>
              <MuiSelect
                value={formData.leadStage}
                onChange={(e) => handleInputChange("leadStage", e.target.value)}
                label="Lead Stage"
                notched
                displayEmpty
              >
                <MenuItem value="">Select Lead Stage</MenuItem>
                {leadStages.map((stage) => (
                  <MenuItem key={stage.id} value={String(stage.id)}>
                    {stage.lead_stage}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>

            {/* Activity */}
            <FormControl fullWidth variant="outlined" sx={fieldStyles}>
              <InputLabel shrink>Activity</InputLabel>
              <MuiSelect
                value={formData.activity}
                onChange={(e) => handleInputChange("activity", e.target.value)}
                label="Activity"
                notched
                displayEmpty
              >
                <MenuItem value="">Select Activity</MenuItem>
                {activities.map((activity) => (
                  <MenuItem key={activity.id} value={String(activity.id)}>
                    {activity.activity_name}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>

            {/* Lead Status */}
            <FormControl fullWidth variant="outlined" sx={fieldStyles}>
              <InputLabel shrink>Lead Status</InputLabel>
              <MuiSelect
                value={formData.leadStatus}
                onChange={(e) => handleInputChange("leadStatus", e.target.value)}
                label="Lead Status"
                notched
                displayEmpty
              >
                <MenuItem value="">Select Status</MenuItem>
                {leadStatuses.map((status) => (
                  <MenuItem key={status.id} value={status.name}>
                    {status.name}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>

            {/* Lead Source - depends on selected project */}
            <FormControl
              fullWidth
              variant="outlined"
              disabled={!formData.projectId}
              sx={fieldStyles}
            >
              <InputLabel shrink>Lead Source</InputLabel>
              <MuiSelect
                value={formData.leadSource}
                onChange={(e) => handleInputChange("leadSource", e.target.value)}
                label="Lead Source"
                notched
                displayEmpty
              >
                <MenuItem value="">
                  {formData.projectId ? "Select Lead Source" : "Select Project first"}
                </MenuItem>
                {leadSources.map((source) => (
                  <MenuItem key={source.id} value={String(source.id)}>
                    {source.source_name}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>

            {/* Lead Sub Source - depends on selected lead source */}
            <FormControl
              fullWidth
              variant="outlined"
              disabled={!formData.leadSource}
              sx={fieldStyles}
            >
              <InputLabel shrink>Lead Sub Source</InputLabel>
              <MuiSelect
                value={formData.leadSubSource}
                onChange={(e) => handleInputChange("leadSubSource", e.target.value)}
                label="Lead Sub Source"
                notched
                displayEmpty
              >
                <MenuItem value="">
                  {formData.leadSource ? "Select Lead Sub Source" : "Select Lead Source first"}
                </MenuItem>
                {leadSubSources.map((sub) => (
                  <MenuItem key={sub.id} value={String(sub.id)}>
                    {sub.subsource_name}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-gray-300 mx-6" />

          {/* Submit Button */}
          <div className="flex justify-center py-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignsReferralCreate;