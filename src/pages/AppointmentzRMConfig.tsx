import React, { useState, useEffect, useCallback } from "react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  getRMUsers,
  getRMUserById,
  createRMUser,
  updateRMUser,
  updateRMUserActiveStatus,
  RMUserData as APIRMUser,
} from "@/services/appointmentzService";
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";

interface RMUser {
  id: number;
  userId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  userType: string;
  createdOn: string;
  status: boolean;
}

const parseActiveStatus = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();
    return normalizedValue === "true" || normalizedValue === "1";
  }
  return false;
};

const AppointmentzRMConfig = () => {
  const [data, setData] = useState<RMUser[]>([]);
  const { shouldShow } = useDynamicPermissions();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<
    Record<number, boolean>
  >({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingUserName, setEditingUserName] = useState("");
  const [defaultRoleId, setDefaultRoleId] = useState<number | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    userType: "",
  });

  // Validation Errors State
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch RM users on component mount
  const fetchRMUsers = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await getRMUsers(page);

      // Transform API data to component format
      // List API returns only full_name (no separate firstname/lastname)
      const transformedData: RMUser[] = response.data.map((user) => {
        const fullName = user.full_name || "";
        const nameParts = fullName.trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ");

        const userTypeLabel =
          user.user_type === "cs_user"
            ? "Customer Support"
            : user.user_type === "rm_user"
            ? "RM User"
            : user.user_type || "-";

        return {
          id: user.id,
          userId: `${user.user_id}`,
          name: fullName,
          firstName,
          lastName,
          email: user.email || "",
          mobile: user.mobile || "",
          userType: userTypeLabel,
          createdOn: user.created_at
            ? new Date(user.created_at).toLocaleDateString("en-GB")
            : "",
          status: parseActiveStatus(user.active),
        };
      });
      setData(transformedData);
      setTotalPages(response.pagination.total_pages);
      setTotalCount(response.pagination.total_count);
    } catch (error: unknown) {
      console.error("Error fetching RM users:", error);

      let errorMessage = "Failed to fetch RM users";

      if (error && typeof error === 'object' && 'response' in error && error.response) {
        interface ErrorResp {
          message?: string;
          error?: string | unknown;
        }
        const errorData = (error as { response?: { data?: ErrorResp } }).response?.data;
        if (errorData?.message && typeof errorData.message === 'string') {
          errorMessage = errorData.message;
        } else if (errorData?.error) {
          errorMessage = typeof errorData.error === 'string'
            ? errorData.error
            : JSON.stringify(errorData.error);
        }
      }

      setTimeout(() => {
        toast.error(errorMessage);
      }, 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRMUsers(currentPage);
  }, [fetchRMUsers, currentPage]);

  // Discover a valid role_id from the first existing user (API requires role_id but roles endpoint is unavailable)
  useEffect(() => {
    if (defaultRoleId !== null) return; // already discovered
    getRMUsers(1)
      .then(async (res) => {
        if (res.data.length > 0) {
          try {
            const userDetail = await getRMUserById(res.data[0].id);
            if (userDetail.data.role_id) {
              setDefaultRoleId(userDetail.data.role_id);
            }
          } catch {
            // silently ignore
          }
        }
      })
      .catch(() => { /* silently ignore */ });
  }, [defaultRoleId]);




  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const columns = [
    { key: "srNo", label: "Sr. No.", sortable: false },
    { key: "actions", label: "Actions", sortable: false },
    { key: "id", label: "ID", sortable: true },
    { key: "userId", label: "User ID", sortable: true },
    { key: "name", label: "Full Name", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "mobile", label: "Mobile", sortable: true },
    { key: "userType", label: "User Type", sortable: true },
    { key: "createdOn", label: "Created On", sortable: true },
    { key: "status", label: "Status", sortable: false },
  ];

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    // Search is handled by filtering the already-fetched data
    // For server-side search, you would call the API with search params
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "mobile") {
      // Only allow numbers and max 10 digits
      const cleanedValue = value.replace(/\D/g, "");
      if (cleanedValue.length <= 10) {
        setFormData((prev) => ({ ...prev, [name]: cleanedValue }));
      }
      return;
    }
    if (name === "email") {
      setFormData((prev) => ({ ...prev, [name]: value.trim() }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value.trim() }));
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, userType: value }));
  };

  const handleStatusToggle = async (item: RMUser, nextStatus: boolean) => {
    if (updatingStatus[item.id]) return;

    setUpdatingStatus((prev) => ({ ...prev, [item.id]: true }));
    setData((prev) =>
      prev.map((row) =>
        row.id === item.id ? { ...row, status: nextStatus } : row
      )
    );

    try {
      const response = await updateRMUserActiveStatus(item.id);

      setTimeout(() => {
        toast.success(
          response.message ||
            `User ${nextStatus ? "activated" : "deactivated"} successfully`
        );
      }, 0);
    } catch (error: unknown) {
      console.error("Error updating user status:", error);

      setData((prev) =>
        prev.map((row) =>
          row.id === item.id ? { ...row, status: item.status } : row
        )
      );

      let errorMessage = "Failed to update status";
      if (error && typeof error === "object" && "response" in error) {
        const errorData = (
          error as {
            response?: { data?: { message?: string; error?: unknown } };
          }
        ).response?.data;
        if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.error) {
          errorMessage =
            typeof errorData.error === "string"
              ? errorData.error
              : JSON.stringify(errorData.error);
        }
      }

      setTimeout(() => {
        toast.error(errorMessage);
      }, 0);
    } finally {
      setUpdatingStatus((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }
  };

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setSelectedId(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
      password: "",
      userType: "",
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = async (item: RMUser) => {
    if (editingRowId || isSubmitting) return;

    setEditingRowId(item.id);
    try {
      setIsEditMode(true);
      setSelectedId(item.id);
      setEditingUserName(`${item.firstName} ${item.lastName}`);
      setFormErrors({}); // Clear errors when opening dialog

      // Fetch the latest user details from API
      const response = await getRMUserById(item.id);
      const user = response.data;

      // Capture role_id for auto-assignment
      if (user.role_id && defaultRoleId === null) {
        setDefaultRoleId(user.role_id);
      }

      setFormData({
        firstName: user.firstname || user.first_name || "",
        lastName: user.lastname || user.last_name || "",
        email: user.email,
        mobile: user.mobile,
        password: "",
        userType: user.user_type === "cs_user" ? "cs_user" : "rm_user",
      });
      setIsAddModalOpen(true);
    } catch (error: unknown) {
      console.error("Error fetching user details:", error);

      let errorMessage = "Failed to fetch user details";

      if (error && typeof error === 'object' && 'response' in error) {
        interface ErrorResponse {
          message?: string;
          error?: string;
          errors?: Record<string, unknown>;
        }
        const errorData = (error as { response?: { data?: ErrorResponse } }).response?.data;
        if (errorData) {
          if (errorData.message && typeof errorData.message === 'string') {
            errorMessage = errorData.message;
          } else if (errorData.error && typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else if (errorData.errors) {
            errorMessage = Object.keys(errorData.errors).map((key) => {
              const errors = errorData.errors?.[key];
              return `${key}: ${Array.isArray(errors) ? errors.join(', ') : String(errors)}`;
            }).join(', ');
          }
        }
      }

      setTimeout(() => {
        toast.error(errorMessage);
      }, 0);
    } finally {
      setEditingRowId(null);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Reset errors
    setFormErrors({});
    const newErrors: Record<string, string> = {};

    // Validation checks
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (formData.mobile.length !== 10) {
      newErrors.mobile = "Mobile number must be exactly 10 digits";
    }
    if (!isEditMode && !formData.password) {
      newErrors.password = "Password is required";
    } else if (!isEditMode && formData.password) {
      const passwordError = validatePassword(formData.password);
      if (passwordError) {
        newErrors.password = passwordError;
      }
    }
    if (!formData.userType) {
      newErrors.userType = "User type is required";
    }

    // If there are validation errors, show them and don't submit
    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && selectedId) {
        await updateRMUser(selectedId, {
          user: {
            firstname: formData.firstName,
            lastname: formData.lastName,
            mobile: formData.mobile,
            user_type: formData.userType,
            role_id: defaultRoleId ?? undefined,
            role: formData.userType,
          },
        });
        setTimeout(() => {
          toast.success("User updated successfully!");
        }, 0);
        // Stay on current page after edit
        await fetchRMUsers(currentPage);
        setIsAddModalOpen(false);
        return;
      } else {
        const response = await createRMUser({
          user: {
            firstname: formData.firstName,
            lastname: formData.lastName,
            email: formData.email,
            mobile: formData.mobile,
            password: formData.password,
            password_confirmation: formData.password,
            user_type: formData.userType,
            role_id: defaultRoleId ?? undefined,
            role: formData.userType,
          },
        });
        setTimeout(() => {
          toast.success(response.message || "User added successfully!");
        }, 0);
        // Go to page 1 to see newly added user
        setCurrentPage(1);
        await fetchRMUsers(1);
      }
      setIsAddModalOpen(false);
    } catch (error: unknown) {
      console.error("Error saving user:", error);

      let errorMessage = "Failed to save user";
      const apiErrors: Record<string, string> = {};

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosErr = error as { response?: { data?: unknown } };
        const errorData = axiosErr.response?.data as Record<string, unknown> | undefined;

        if (errorData) {
          if (Array.isArray(errorData.errors)) {
            // e.g. {"errors": ["Role must exist", "Email has already been taken"]}
            errorMessage = (errorData.errors as string[]).join(", ");
          } else if (errorData.errors && typeof errorData.errors === 'object') {
            // e.g. {"errors": {"email": ["has already been taken"], "mobile": ["is invalid"]}}
            const errorsObj = errorData.errors as Record<string, string | string[]>;
            Object.keys(errorsObj).forEach((key) => {
              const val = errorsObj[key];
              const errorText = Array.isArray(val) ? val.join(", ") : String(val);
              if (key === "first_name" || key === "firstname") {
                apiErrors.firstName = errorText;
              } else if (key === "last_name" || key === "lastname") {
                apiErrors.lastName = errorText;
              } else if (key === "mobile") {
                apiErrors.mobile = errorText;
              } else if (key === "email") {
                apiErrors.email = errorText;
              } else if (key === "password" || key === "password_confirmation") {
                apiErrors.password = errorText;
              } else if (key === "user_type" || key === "role") {
                apiErrors.userType = errorText;
              } else {
                apiErrors[key] = errorText;
              }
            });
            setFormErrors(apiErrors);
            errorMessage = Object.values(apiErrors).join(", ");
          } else if (typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else if (typeof errorData.message === 'string') {
            errorMessage = errorData.message;
          }
        }
      }

      setTimeout(() => {
        toast.error(errorMessage);
      }, 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCell = (item: RMUser, columnKey: string, index: number) => {
    switch (columnKey) {
      case "srNo":
        return (currentPage - 1) * 10 + index + 1;
      case "actions":
        return (
          shouldShow("RM/CS Configuration","update")&&(
          <Button
            variant="ghost"
            size="sm"
            className="bg-[#C72030] text-white hover:bg-[#C72030]/90"
            disabled={!!editingRowId || isSubmitting}
            onClick={() => handleOpenEdit(item)}
          >
            {editingRowId === item.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Edit className="w-4 h-4" />
            )}
          </Button>
        )
        );
      case "status":
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={item.status}
              onCheckedChange={(checked) => handleStatusToggle(item, checked)}
              disabled={!!updatingStatus[item.id]}
              aria-label={`Set ${item.name || "user"} status`}
              className="data-[state=checked]:!bg-green-500 data-[state=unchecked]:!bg-gray-300"
            />
            {updatingStatus[item.id] && (
              <Loader2 className="w-4 h-4 animate-spin text-[#C72030]" />
            )}
          </div>
        );
      default:
        return item[columnKey as keyof RMUser];
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <EnhancedTable
        data={data}
        columns={columns}
        renderCell={renderCell}
        pagination={true}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search"
        leftActions={
          shouldShow("RM/CS Configuration","create") &&(
          <Button
            onClick={handleOpenAdd}
            className="bg-[#C72030] text-white hover:bg-[#C72030]/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
          )
        }
        loading={loading}
      />

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-[#F6F4EE]">
          <DialogHeader className="bg-white p-4 border-b flex flex-row items-center justify-between">
            <DialogTitle className="text-center w-full font-bold text-lg">
              {isEditMode ? `Edit - ${editingUserName}` : "Add New User"}
            </DialogTitle>
          </DialogHeader>

          <div className="p-8 grid grid-cols-2 gap-x-6 gap-y-12 bg-[#F6F4EE]">
            <div className="relative">
              <label
                htmlFor="firstName"
                className="absolute -top-2 left-2 bg-[#F6F4EE] px-1 text-xs font-semibold text-gray-600 z-10"
              >
                First Name <span className="text-[#C72030]">*</span>
              </label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="Enter First Name"
                value={formData.firstName}
                onChange={handleInputChange}
                className={`bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10 ${
                  formErrors.firstName ? "border-red-500" : ""
                }`}
              />
              {formErrors.firstName && (
                <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>
              )}
            </div>

            <div className="relative">
              <label
                htmlFor="lastName"
                className="absolute -top-2 left-2 bg-[#F6F4EE] px-1 text-xs font-semibold text-gray-600 z-10"
              >
                Last Name <span className="text-[#C72030]">*</span>
              </label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleInputChange}
                className={`bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10 ${
                  formErrors.lastName ? "border-red-500" : ""
                }`}
              />
              {formErrors.lastName && (
                <p className="text-red-500 text-xs mt-1">{formErrors.lastName}</p>
              )}
            </div>

            <div className="relative">
              <label
                htmlFor="email"
                className="absolute -top-2 left-2 bg-[#F6F4EE] px-1 text-xs font-semibold text-gray-600 z-10"
              >
                Email <span className="text-[#C72030]">*</span>
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isEditMode}
                className={`bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10 ${
                  isEditMode ? "opacity-60 cursor-not-allowed" : ""
                } ${formErrors.email ? "border-red-500" : ""}`}
              />
              {formErrors.email && (
                <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>

            <div className="relative">
              <label
                htmlFor="mobile"
                className="absolute -top-2 left-2 bg-[#F6F4EE] px-1 text-xs font-semibold text-gray-600 z-10"
              >
                Mobile <span className="text-[#C72030]">*</span>
              </label>
              <Input
                id="mobile"
                name="mobile"
                placeholder="Mobile Number"
                value={formData.mobile}
                onChange={handleInputChange}
                className={`bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10 ${
                  formErrors.mobile ? "border-red-500" : ""
                }`}
              />
              {formErrors.mobile && (
                <p className="text-red-500 text-xs mt-1">{formErrors.mobile}</p>
              )}
            </div>

            {!isEditMode && (
              <div className="relative">
                <label
                  htmlFor="password"
                  className="absolute -top-2 left-2 bg-[#F6F4EE] px-1 text-xs font-semibold text-gray-600 z-10"
                >
                  Password <span className="text-[#C72030]">*</span>
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10 ${
                    formErrors.password ? "border-red-500" : ""
                  }`}
                />
                {formErrors.password && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
                )}
              </div>
            )}

            <div className="relative">
              <label className="absolute -top-2 left-2 bg-[#F6F4EE] px-1 text-xs font-semibold text-gray-600 z-10">
                User Type <span className="text-[#C72030]">*</span>
              </label>
              <Select
                onValueChange={handleSelectChange}
                value={formData.userType}
              >
                <SelectTrigger className={`bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10 ${
                  formErrors.userType ? "border-red-500" : ""
                }`}>
                  <SelectValue placeholder="Select User Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cs_user">Customer Support</SelectItem>
                  <SelectItem value="rm_user">RM User</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.userType && (
                <p className="text-red-500 text-xs mt-1">{formErrors.userType}</p>
              )}
            </div>


          </div>

          <DialogFooter className="p-4 bg-white border-t flex justify-center">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 bg-[#C72030] text-white hover:bg-[#C72030]/90"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentzRMConfig;
