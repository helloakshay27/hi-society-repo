import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API_CONFIG, getFullUrl, getAuthHeader } from "@/config/apiConfig";
import { ChevronRight, ArrowLeft, Shield } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { TextField, FormControl, InputLabel } from "@mui/material";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

const LockRoleCreate = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();

  const fieldStyles = {
    height: '45px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    '& .MuiOutlinedInput-root': {
      height: '45px',
      '& fieldset': {
        borderColor: '#ddd',
      },
      '&:hover fieldset': {
        borderColor: '#C72030',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#C72030',
      },
    },
    '& .MuiInputLabel-root': {
      '&.Mui-focused': {
        color: '#C72030',
      },
    },
  };

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [lockFunctions, setLockFunctions] = useState([]);
  const [permissionsHash, setPermissionsHash] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    display_name: "",
    active: 1,
    role_for: "pms",
  });

  const standardActions = ["all", "create", "show", "update", "destroy"];
  const actionLabels = {
    all: "All",
    create: "Add",
    show: "View", 
    update: "Edit",
    destroy: "Disable"
  };

  useEffect(() => {
    const fetchLockFunctions = async () => {
      try {
      const response = await axios.get(getFullUrl('/lock_functions.json'), {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
      });

        const functionsData = Array.isArray(response.data) ? response.data : [];
        setLockFunctions(functionsData);

        const initialPermissions = {};
        functionsData.forEach(func => {
          initialPermissions[func.action_name] = {};
          standardActions.forEach(action => {
            initialPermissions[func.action_name][action] = "false";
          });
        });
        
        setPermissionsHash(initialPermissions);
      } catch (error) {
        console.error("Error fetching lock functions:", error);
        toast.error("Failed to fetch lock functions");
        setLockFunctions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLockFunctions();
  }, [baseURL]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    });
  };

  const handlePermissionChange = (actionName, action, checked) => {
    setPermissionsHash(prevPermissions => {
      const updatedPermissions = { ...prevPermissions };
      
      if (!updatedPermissions[actionName]) {
        updatedPermissions[actionName] = {};
      }
      
      updatedPermissions[actionName][action] = checked ? "true" : "false";
      
      if (action === "all" && checked) {
        standardActions.forEach(act => {
          updatedPermissions[actionName][act] = "true";
        });
      }
      
      if (action === "all" && !checked) {
        standardActions.forEach(act => {
          updatedPermissions[actionName][act] = "false";
        });
      }
      
      if (action !== "all" && !checked) {
        updatedPermissions[actionName]["all"] = "false";
      }
      
      if (action !== "all" && checked) {
        const allOtherActionsChecked = standardActions
          .filter(act => act !== "all")
          .every(act => updatedPermissions[actionName][act] === "true");
          
        if (allOtherActionsChecked) {
          updatedPermissions[actionName]["all"] = "true";
        }
      }
      
      return updatedPermissions;
    });
  };

  const validateForm = () => {
    let newErrors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Role title is required";
      toast.error("Role title is required");
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        lock_role: {
          name: formData.name,
          display_name: formData.name,
          access_level: null,
          access_to: null,
          active: formData.active,
          role_for: formData.role_for,
        },
        permissions_hash: permissionsHash,
        lock_modules: null
      };

      await axios.post(getFullUrl('/lock_roles.json'), payload, {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
      });

      toast.success("Lock role created successfully");
      navigate("/setup-member/lock-role-list");
    } catch (error) {
      console.error("Error creating lock role:", error);
      toast.error(`Error creating lock role: ${error.response?.data?.message || error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full bg-gray-50">
      <div className="p-6 max-w-full h-[calc(100vh-50px)] overflow-y-auto">
        {/* Header with Back Button and Breadcrumbs */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-[#C72030] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-400">Setup Member</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-400">User Module</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#C72030] font-medium">Create Role</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CREATE LOCK ROLE</h1>
        </div>

        {/* Main Content */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                  <Shield size={16} color="#C72030" />
                </span>
                Role Details
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Role Title */}
                <TextField
                  label="Role Title"
                  name="name"
                  placeholder="Enter role title"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  slotProps={{ inputLabel: { shrink: true } }}
                  InputProps={{ sx: fieldStyles }}
                  required
                  error={!!errors.name}
                  helperText={errors.name as string}
                />

                {/* Active Status */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <div className="flex items-center pt-2">
                    <input
                      type="checkbox"
                      name="active"
                      id="isActive"
                      checked={formData.active === 1}
                      onChange={handleChange}
                      disabled={submitting}
                      className="w-4 h-4 text-[#c72030] bg-gray-100 border-gray-300 rounded focus:ring-[#c72030] focus:ring-2"
                    />
                    <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 cursor-pointer">
                      Active
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                  <Shield size={16} color="#C72030" />
                </span>
                Role Permissions
              </h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-[#c72030] rounded-full animate-spin" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <Table className="border-separate">
                    <TableHeader>
                      <TableRow className="hover:bg-gray-50" style={{ backgroundColor: "#e6e2d8" }}>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r" style={{ borderColor: "#fff", minWidth: "250px" }}>
                          Functions
                        </TableHead>
                        {standardActions.map(action => (
                          <TableHead key={action} className="font-semibold text-gray-900 py-3 px-4 border-r text-center" style={{ borderColor: "#fff", width: "100px" }}>
                            {actionLabels[action]}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lockFunctions.length > 0 ? (
                        lockFunctions.map((func) => (
                          <TableRow key={func.id} className="hover:bg-gray-50 transition-colors">
                            <TableCell className="py-3 px-4 font-medium">{func.name}</TableCell>
                            {standardActions.map(action => (
                              <TableCell key={`${func.action_name}-${action}`} className="py-3 px-4 text-center">
                                <input
                                  type="checkbox"
                                  name={`${func.action_name}-${action}`}
                                  className="w-4 h-4 accent-[#C72030] cursor-pointer"
                                  checked={permissionsHash[func.action_name]?.[action] === "true"}
                                  onChange={(e) => handlePermissionChange(func.action_name, action, e.target.checked)}
                                  disabled={submitting}
                                />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={standardActions.length + 1} className="text-center py-12 text-gray-500">
                            No functions available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pt-6">
            <button
              type="submit"
              disabled={submitting || loading}
              className={`px-8 py-2 bg-[#C72030] hover:bg-[#B8252F] text-white rounded transition-colors font-medium ${
                (submitting || loading) ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {submitting ? "Creating..." : "Create Role"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={submitting}
              className="px-8 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
        </div>
    </div>
  );
};

export default LockRoleCreate;