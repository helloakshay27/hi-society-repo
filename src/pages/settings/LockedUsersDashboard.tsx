import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Search,
  RefreshCw,
  UnlockIcon,
  Lock,
  Calendar,
  User,
  Mail,
  Phone,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { getAuthHeader, getFullUrl } from "@/config/apiConfig";

interface LockedUser {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  mobile?: string;
  country_code?: string;
  locked_at: string;
  failed_attempts?: number;
  lock_reason?: string;
  department?: string;
  designation?: string;
}

interface LockedUsersResponse {
  locked_users: LockedUser[];
  total_count: number;
}

const columns: ColumnConfig[] = [
  { key: "user", label: "User", sortable: false, hideable: false, draggable: false },
  { key: "contact", label: "Contact", sortable: false, hideable: true, draggable: true },
  { key: "department", label: "Department", sortable: false, hideable: true, draggable: true },
  { key: "locked_at", label: "Locked At", sortable: false, hideable: true, draggable: true },
  { key: "failed_attempts", label: "Failed Attempts", sortable: false, hideable: true, draggable: true },
  { key: "reason", label: "Reason", sortable: false, hideable: true, draggable: true },
];

export const LockedUsersDashboard = () => {
  const [lockedUsers, setLockedUsers] = useState<LockedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<LockedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<LockedUser | null>(null);
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkUnlocking, setBulkUnlocking] = useState(false);
  const [bulkUnlockDialogOpen, setBulkUnlockDialogOpen] = useState(false);

  // Fetch locked users
  const fetchLockedUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        getFullUrl(`${location.pathname.startsWith("/master") ? "/pms/users/locked_users.json?selected_site_wise=true" : "/pms/users/locked_users.json"}`),
        {
          method: "GET",
          headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: LockedUsersResponse = await response.json();
      setLockedUsers(data.locked_users || []);
      setFilteredUsers(data.locked_users || []);

      if (data.locked_users?.length === 0) {
        toast.info("No locked users found");
      }
    } catch (error: any) {
      console.error("Error fetching locked users:", error);
      toast.error(
        error.message || "Failed to load locked users"
      );
      // Set empty arrays on error
      setLockedUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchLockedUsers();
  }, []);

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(lockedUsers);
      return;
    }

    const lowerSearch = searchTerm.toLowerCase();
    const filtered = lockedUsers.filter(
      (user) =>
        user.firstname?.toLowerCase().includes(lowerSearch) ||
        user.lastname?.toLowerCase().includes(lowerSearch) ||
        user.email?.toLowerCase().includes(lowerSearch) ||
        user.mobile?.includes(searchTerm) ||
        user.department?.toLowerCase().includes(lowerSearch) ||
        user.designation?.toLowerCase().includes(lowerSearch)
    );
    setFilteredUsers(filtered);
  }, [searchTerm, lockedUsers]);

  // Handle unlock user
  const handleUnlockUser = async () => {
    if (!selectedUser) return;

    setUnlocking(true);
    try {
      const response = await fetch(
        getFullUrl(`/pms/users/${selectedUser.id}/unlock_user.json`),
        {
          method: "GET",
          headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to unlock user account");
      }

      toast.success(
        `Account unlocked successfully for ${selectedUser.firstname} ${selectedUser.lastname}`
      );

      // Remove unlocked user from the list
      setLockedUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      setFilteredUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));

      setUnlockDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error("Error unlocking user:", error);
      toast.error(error.message || "Failed to unlock user account");
    } finally {
      setUnlocking(false);
    }
  };

  // Open unlock dialog
  const openUnlockDialog = (user: LockedUser) => {
    setSelectedUser(user);
    setUnlockDialogOpen(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle bulk unlock users
  const handleBulkUnlockUsers = async () => {
    if (selectedIds.size === 0) return;

    setBulkUnlocking(true);
    try {
      const response = await fetch(
        getFullUrl("/pms/users/bulk_unlock_users.json"),
        {
          method: "POST",
          headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ids: Array.from(selectedIds),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to unlock user accounts");
      }

      toast.success(
        `Successfully unlocked ${selectedIds.size} user account${selectedIds.size > 1 ? "s" : ""}`
      );

      // Remove unlocked users from the list
      const selectedIdsArray = Array.from(selectedIds);
      setLockedUsers((prev) =>
        prev.filter((u) => !selectedIdsArray.includes(u.id))
      );
      setFilteredUsers((prev) =>
        prev.filter((u) => !selectedIdsArray.includes(u.id))
      );

      // Clear selections
      setSelectedIds(new Set());
      setBulkUnlockDialogOpen(false);
    } catch (error: any) {
      console.error("Error unlocking users:", error);
      toast.error(error.message || "Failed to unlock user accounts");
    } finally {
      setBulkUnlocking(false);
    }
  };

  const renderCell = (user: LockedUser, columnKey: string) => {
    switch (columnKey) {
      case "user":
        return (
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(199, 32, 48, 0.12)" }}
            >
              <User className="w-5 h-5 text-[#C72030]" />
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {user.firstname} {user.lastname}
              </div>
              <div className="text-sm text-gray-500">ID: {user.id}</div>
            </div>
          </div>
        );
      case "contact":
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            {user.mobile && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 flex-shrink-0" />
                {user.country_code && `+${user.country_code} `}
                {user.mobile}
              </div>
            )}
          </div>
        );
      case "department":
        return (
          <div>
            <div className="text-sm font-medium text-gray-900">
              {user.department || "-"}
            </div>
            {/* <div className="text-sm text-gray-500">
              {user.designation || "-"}
            </div> */}
          </div>
        );
      case "locked_at":
        return (
          <div className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
            {/* <Calendar className="w-4 h-4 flex-shrink-0" /> */}
            {formatDate(user.locked_at)}
          </div>
        );
      case "failed_attempts":
        return (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#F2C8C4] px-2.5 py-1 text-xs font-semibold text-black">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {user.failed_attempts || 0} attempts
          </span>
        );
      case "reason":
        return (
          <span className="text-sm text-gray-600">
            {user.lock_reason || "Multiple failed login attempts"}
          </span>
        );
      default:
        return "-";
    }
  };

  const renderActions = (user: LockedUser) => (
    <Button
      size="sm"
      variant="ghost"
      className="p-1"
      onClick={() => openUnlockDialog(user)}
      title="Unlock Account"
    >
      <UnlockIcon className="w-4 h-4 text-green-600" />
    </Button>
  );

  const leftActions = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        onClick={fetchLockedUsers}
        disabled={loading}
        variant="outline"
        className="px-4 py-2"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
        Refresh
      </Button>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search by name, email, mobile, department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 w-72 h-9"
        />
      </div>
    </div>
  );

  const bulkActions = [
    {
      label: "Unlock Selected",
      icon: UnlockIcon,
      variant: "default" as const,
      onClick: () => setBulkUnlockDialogOpen(true),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-[#1a1a1a]">Locked Users</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage and unlock user accounts that have been locked
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Locked Users
            </CardTitle>
            <Lock className="w-4 h-4 text-[#C72030]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {lockedUsers.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Filtered Results
            </CardTitle>
            <Search className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {filteredUsers.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Status
            </CardTitle>
            <AlertCircle className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "Loading..." : "Active"}
            </div>
          </CardContent>
        </Card>
      </div>

      <EnhancedTable
        data={filteredUsers}
        columns={columns}
        renderCell={renderCell}
        renderActions={renderActions}
        leftActions={leftActions}
        loading={loading}
        loadingMessage="Loading locked users..."
        emptyMessage={
          searchTerm ? "No matching users found" : "All user accounts are currently unlocked"
        }
        selectable
        selectedItems={Array.from(selectedIds).map(String)}
        onSelectAll={(checked) => {
          setSelectedIds(checked ? new Set(filteredUsers.map((u) => u.id)) : new Set());
        }}
        onSelectItem={(itemId, checked) => {
          const id = Number(itemId);
          setSelectedIds((prev) => {
            const next = new Set(prev);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
          });
        }}
        getItemId={(user) => user.id.toString()}
        showBulkActions
        bulkActions={bulkActions}
        storageKey="locked-users-table"
      />

      {/* Unlock Confirmation Dialog */}
      <Dialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock User Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to unlock the account for{" "}
              <strong>
                {selectedUser?.firstname} {selectedUser?.lastname}
              </strong>
              ?
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-3 py-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Email</div>
                  <div className="text-sm text-gray-600">{selectedUser.email}</div>
                </div>
              </div>

              {selectedUser.mobile && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-700">Mobile</div>
                    <div className="text-sm text-gray-600">
                      {selectedUser.country_code && `+${selectedUser.country_code} `}
                      {selectedUser.mobile}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Locked At</div>
                  <div className="text-sm text-gray-600">
                    {formatDate(selectedUser.locked_at)}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-red-700">Lock Reason</div>
                  <div className="text-sm text-red-600">
                    {selectedUser.lock_reason || "Multiple failed login attempts"}
                  </div>
                  <div className="text-sm text-red-600 mt-1">
                    Failed Attempts: {selectedUser.failed_attempts || 0}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUnlockDialogOpen(false)}
              disabled={unlocking}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUnlockUser}
              disabled={unlocking}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {unlocking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Unlocking...
                </>
              ) : (
                <>
                  <UnlockIcon className="w-4 h-4 mr-2" />
                  Unlock Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Unlock Confirmation Dialog */}
      <Dialog open={bulkUnlockDialogOpen} onOpenChange={setBulkUnlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock Multiple User Accounts</DialogTitle>
            <DialogDescription>
              Are you sure you want to unlock <strong>{selectedIds.size} user account{selectedIds.size > 1 ? "s" : ""}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-blue-700">Selected Users</div>
                <div className="text-sm text-blue-600 mt-2">
                  {selectedIds.size} user account{selectedIds.size > 1 ? "s" : ""} will be unlocked
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkUnlockDialogOpen(false)}
              disabled={bulkUnlocking}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkUnlockUsers}
              disabled={bulkUnlocking}
              className="!bg-green-600 hover:!bg-green-700 text-white"
            >
              {bulkUnlocking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Unlocking...
                </>
              ) : (
                <>
                  <UnlockIcon className="w-4 h-4 mr-2" />
                  Unlock All
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
