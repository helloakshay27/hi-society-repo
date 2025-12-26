import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { API_CONFIG } from "@/config/apiConfig";
import { ChevronRight, ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";


const LockRoleList = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const [lockRoles, setLockRoles] = useState([]);
  const [lockFunctions, setLockFunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [functionsLoading, setFunctionsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editedPermissions, setEditedPermissions] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    fetchLockRoles();
    fetchLockFunctions();
  }, []);

  useEffect(() => {
    if (selectedRole && lockFunctions.length > 0) {
      try {
        let permissions = {};

        if (
          selectedRole.permissions_hash &&
          selectedRole.permissions_hash !== ""
        ) {
          permissions = JSON.parse(selectedRole.permissions_hash);
        }

        lockFunctions.forEach((func) => {
          const functionName =
            func.action_name || func.name.toLowerCase().replace(/\s+/g, "_");
          if (!permissions[functionName]) {
            permissions[functionName] = {
              all: "false",
              create: "false",
              show: "false",
              update: "false",
              destroy: "false",
            };
          }
        });

        setEditedPermissions(permissions);
      } catch (error) {
        console.error("Error parsing permissions:", error);

        const defaultPermissions = {};
        lockFunctions.forEach((func) => {
          const functionName =
            func.action_name || func.name.toLowerCase().replace(/\s+/g, "_");
          defaultPermissions[functionName] = {
            all: "false",
            create: "false",
            show: "false",
            update: "false",
            destroy: "false",
          };
        });

        setEditedPermissions(defaultPermissions);
      }
    } else {
      setEditedPermissions({});
    }
  }, [selectedRole, lockFunctions]);

  const fetchLockFunctions = async () => {
    toast.dismiss();
    try {
      setFunctionsLoading(true);
      const response = await axios.get(`${baseURL}/lock_functions.json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      });

      setLockFunctions(response.data || []);
    } catch (error) {
      console.error("Error fetching lock functions:", error);
      toast.error("Failed to load lock functions");
    } finally {
      setFunctionsLoading(false);
    }
  };

  const fetchLockRoles = async () => {
    toast.dismiss();
    try {
      setLoading(true);
      const response = await axios.get(`${baseURL}/lock_roles.json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      });

      // Ensure we always have an array
      const rolesData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.lock_roles && Array.isArray(response.data.lock_roles))
        ? response.data.lock_roles
        : [];

      setLockRoles(rolesData);

      if (rolesData.length > 0) {
        setSelectedRole(rolesData[0]);
      } else {
        setSelectedRole(null);
      }
    } catch (error) {
      console.error("Error fetching lock roles:", error);
      toast.error("Failed to load lock roles");
      setLockRoles([]); // Ensure it's always an array on error
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handlePermissionChange = (functionName, permType) => {
    const updatedPermissions = { ...editedPermissions };

    const currentValue = updatedPermissions[functionName][permType];
    updatedPermissions[functionName][permType] =
      currentValue === "true" ? "false" : "true";

    if (
      permType === "all" &&
      updatedPermissions[functionName][permType] === "true"
    ) {
      updatedPermissions[functionName].create = "true";
      updatedPermissions[functionName].show = "true";
      updatedPermissions[functionName].update = "true";
      updatedPermissions[functionName].destroy = "true";
    }

    if (
      permType === "all" &&
      updatedPermissions[functionName][permType] === "false"
    ) {
      updatedPermissions[functionName].create = "false";
      updatedPermissions[functionName].show = "false";
      updatedPermissions[functionName].update = "false";
      updatedPermissions[functionName].destroy = "false";
    }

    if (permType !== "all") {
      const allChecked =
        updatedPermissions[functionName].create === "true" &&
        updatedPermissions[functionName].show === "true" &&
        updatedPermissions[functionName].update === "true" &&
        updatedPermissions[functionName].destroy === "true";

      updatedPermissions[functionName].all = allChecked ? "true" : "false";
    }

    setEditedPermissions(updatedPermissions);
  };

  const savePermissions = async () => {
    toast.dismiss();
    if (!selectedRole) return;

    try {
      const permissionsHash = JSON.stringify(editedPermissions);

      await axios.put(
        `${baseURL}/lock_roles/${selectedRole.id}.json`,
        {
          lock_role: {
            permissions_hash: permissionsHash,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      const updatedRoles = lockRoles.map((role) =>
        role.id === selectedRole.id
          ? { ...role, permissions_hash: permissionsHash }
          : role
      );

      setLockRoles(updatedRoles);
      toast.success("Role Updated successfully!");
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Failed to update role.");
    }
  };

  const filteredRoles = Array.isArray(lockRoles)
    ? lockRoles.filter(
        (role) =>
          role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (role.display_name &&
            role.display_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  const formatFunctionName = (name) => {
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getFunctionDisplayName = (functionName) => {
    const func = lockFunctions.find(
      (f) =>
        (f.action_name && f.action_name === functionName) ||
        (f.name && f.name.toLowerCase().replace(/\s+/g, "_") === functionName)
    );

    if (func) {
      return func.name;
    }

    return formatFunctionName(functionName);
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
            <span className="text-[#C72030] font-medium">User Role</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">USER ROLE</h1>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Search and Add Button - Above Tables */}
        <div className="mb-4">
          <EnhancedTable
            data={[]}
            columns={[]}
            renderCell={() => null}
            enableGlobalSearch={true}
            onGlobalSearch={handleSearch}
            leftActions={
              <Button
                onClick={() => navigate("/setup-member/lock-role-create")}
                className="bg-[#C72030] hover:bg-[#A01828] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Role
              </Button>
            }
            enableExport={false}
            hideTable={true}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Roles List Sidebar */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-[#F6F4EE] px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Roles List</h3>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="text-center py-12">
                    <div
                      className="inline-block w-8 h-8 border-4 border-gray-200 border-t-[#c72030] rounded-full animate-spin"
                      role="status"
                    >
                      <span className="sr-only">Loading...</span>
                    </div>
                  </div>
                ) : filteredRoles.length > 0 ? (
                  <div>
                    {filteredRoles.map((role) => (
                      <div
                        key={role.id}
                        className={`px-6 py-4 border-b border-gray-100 cursor-pointer transition-colors ${
                          selectedRole && selectedRole.id === role.id
                            ? "bg-[#C72030] text-white font-semibold"
                            : "hover:bg-gray-50 text-gray-700"
                        }`}
                        onClick={() => handleRoleSelect(role)}
                      >
                        {role.name || "Unnamed Role"}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No roles found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Permissions Table */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="bg-[#F6F4EE] px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">
                  Role Permissions
                  {selectedRole && (
                    <span className="ml-2 text-sm font-normal text-gray-600">
                      - {selectedRole.name}
                    </span>
                  )}
                </h3>
              </div>
              <div className="p-6">
                {loading || functionsLoading ? (
                  <div className="text-center py-12">
                    <div
                      className="inline-block w-8 h-8 border-4 border-gray-200 border-t-[#c72030] rounded-full animate-spin"
                      role="status"
                    >
                      <span className="sr-only">Loading...</span>
                    </div>
                  </div>
                ) : selectedRole ? (
                  <div>
                    {!editedPermissions ||
                    typeof editedPermissions !== "object" ? (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg">
                        Unable to load permissions. Using default empty
                        permissions.
                      </div>
                    ) : (
                      <>
                        <div className="rounded-lg border border-gray-200 overflow-hidden">
                          <Table className="border-separate">
                            <TableHeader>
                              <TableRow
                                className="hover:bg-gray-50"
                                style={{ backgroundColor: "#e6e2d8" }}
                              >
                                <TableHead
                                  className="font-semibold text-gray-900 py-3 px-4 border-r"
                                  style={{ borderColor: "#fff" }}
                                >
                                  Functions
                                </TableHead>
                                <TableHead
                                  className="font-semibold text-gray-900 py-3 px-4 border-r text-center"
                                  style={{ borderColor: "#fff" }}
                                >
                                  All
                                </TableHead>
                                <TableHead
                                  className="font-semibold text-gray-900 py-3 px-4 border-r text-center"
                                  style={{ borderColor: "#fff" }}
                                >
                                  Add
                                </TableHead>
                                <TableHead
                                  className="font-semibold text-gray-900 py-3 px-4 border-r text-center"
                                  style={{ borderColor: "#fff" }}
                                >
                                  View
                                </TableHead>
                                <TableHead
                                  className="font-semibold text-gray-900 py-3 px-4 border-r text-center"
                                  style={{ borderColor: "#fff" }}
                                >
                                  Edit
                                </TableHead>
                                <TableHead
                                  className="font-semibold text-gray-900 py-3 px-4 text-center"
                                  style={{ borderColor: "#fff" }}
                                >
                                  Disable
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.keys(editedPermissions).map(
                                (functionName) => (
                                  <TableRow
                                    key={functionName}
                                    className="hover:bg-gray-50 transition-colors"
                                  >
                                    <TableCell className="py-3 px-4 font-medium">
                                      {getFunctionDisplayName(functionName)}
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-center">
                                      <input
                                        type="checkbox"
                                        className="w-4 h-4 accent-[#C72030] cursor-pointer"
                                        checked={
                                          editedPermissions[functionName]
                                            ?.all === "true"
                                        }
                                        onChange={() =>
                                          handlePermissionChange(
                                            functionName,
                                            "all"
                                          )
                                        }
                                      />
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-center">
                                      <input
                                        type="checkbox"
                                        className="w-4 h-4 accent-[#C72030] cursor-pointer"
                                        checked={
                                          editedPermissions[functionName]
                                            ?.create === "true"
                                        }
                                        onChange={() =>
                                          handlePermissionChange(
                                            functionName,
                                            "create"
                                          )
                                        }
                                      />
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-center">
                                      <input
                                        type="checkbox"
                                        className="w-4 h-4 accent-[#C72030] cursor-pointer"
                                        checked={
                                          editedPermissions[functionName]
                                            ?.show === "true"
                                        }
                                        onChange={() =>
                                          handlePermissionChange(
                                            functionName,
                                            "show"
                                          )
                                        }
                                      />
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-center">
                                      <input
                                        type="checkbox"
                                        className="w-4 h-4 accent-[#C72030] cursor-pointer"
                                        checked={
                                          editedPermissions[functionName]
                                            ?.update === "true"
                                        }
                                        onChange={() =>
                                          handlePermissionChange(
                                            functionName,
                                            "update"
                                          )
                                        }
                                      />
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-center">
                                      <input
                                        type="checkbox"
                                        className="w-4 h-4 accent-[#C72030] cursor-pointer"
                                        checked={
                                          editedPermissions[functionName]
                                            ?.destroy === "true"
                                        }
                                        onChange={() =>
                                          handlePermissionChange(
                                            functionName,
                                            "destroy"
                                          )
                                        }
                                      />
                                    </TableCell>
                                  </TableRow>
                                )
                              )}
                            </TableBody>
                          </Table>
                        </div>

                        <div className="flex justify-end mt-6">
                          <button
                            className="px-6 py-2 bg-[#C72030] text-white rounded hover:bg-[#B8252F] transition-colors font-medium shadow-sm"
                            onClick={savePermissions}
                          >
                            Update Permissions
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Select a role to view and edit permissions
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LockRoleList;
