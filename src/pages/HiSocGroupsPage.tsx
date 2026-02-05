import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddHiSocGroupModal } from "@/components/AddHiSocGroupModal";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { toast } from "sonner";
import { useAppDispatch } from "@/store/hooks";
import { fetchCrmUserGroups, updateCrmUserGroup } from "@/store/slices/userGroupSlice";
import { Switch } from "@/components/ui/switch";

interface Group {
  id: number;
  groupName: string;
  members: number;
  image: string;
  status: boolean;
  membersList: [];
}

const mapResponseToGroup = (response: any): Group => ({
  id: response.id,
  groupName: response.name || 'Unnamed Group',
  members: response.members_count || 0,
  image: "",
  status: response.active === 1 || response.active === true,
  membersList: [],
});

const columns: ColumnConfig[] = [
  {
    key: "id",
    label: "Id",
    sortable: true,
    draggable: true,
    defaultVisible: true,
  },
  {
    key: "groupName",
    label: "Group Name",
    sortable: true,
    draggable: true,
    defaultVisible: true,
  },
  {
    key: "members",
    label: "Members",
    sortable: true,
    draggable: true,
    defaultVisible: true,
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    draggable: true,
    defaultVisible: true,
  },
];

const HiSocGroupsPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const baseUrl = localStorage.getItem("baseUrl");
  const token = localStorage.getItem("token");

  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isEditing, setIsEditing] = useState(false)
  const [groups, setGroups] = useState<Group[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState<{ [key: string]: boolean }>({});

  const fetchData = async () => {
    try {
      const response = await dispatch(
        fetchCrmUserGroups({ baseUrl, token })
      ).unwrap();
      const mappedGroups = response.map(mapResponseToGroup);
      setGroups(mappedGroups);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch groups");
    }
  };

  useEffect(() => {
    fetchData();
  }, [dispatch, baseUrl, token]);

  const handleCheckboxChange = async (item: any) => {
    const newStatus = !item.status;
    const itemId = item.id;

    if (updatingStatus[itemId]) return;

    try {
      setUpdatingStatus((prev) => ({ ...prev, [itemId]: true }));

      await dispatch(
        updateCrmUserGroup({
          baseUrl,
          token,
          id: itemId.toString(),
          data: {
            usergroup: {
              active: newStatus ? 1 : 0,
            },
          },
        })
      ).unwrap();

      setGroups((prevData: any[]) =>
        prevData.map((row) =>
          row.id === itemId ? { ...row, status: newStatus } : row
        )
      );

      toast.success(`Group ${newStatus ? "activated" : "deactivated"} successfully`);
    } catch (error) {
      console.error("Error updating active status:", error);
      toast.error("Failed to update active status. Please try again.");
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const renderActions = (group: Group) => (
    <div className="flex items-center">
      <Button
        variant="ghost"
        size="sm"
        className="text-blue-600 hover:text-blue-700"
        onClick={() => handleViewGroup(group.id)}
      >
        <Eye className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-blue-600 hover:text-blue-700"
        onClick={() => handleEditGroup(group)}
      >
        <Edit className="w-4 h-4" />
      </Button>
    </div>
  );

  const renderCell = (item: Group, columnKey: string) => {
    if (columnKey === "image") {
      return (
        <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-orange-400"></div>
        </div>
      );
    }
    if (columnKey === "status") {
      return (
        <Switch
          checked={item.status}
          onCheckedChange={() =>
            handleCheckboxChange(item)
          }
          className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
          disabled={updatingStatus[item.id]}
        />
      );
    }
    return item[columnKey as keyof Group];
  };

  const handleViewGroup = (groupId: number) => {
    navigate(`/bms/groups/details/${groupId}`);
  };

  const handleEditGroup = (group: Group) => {
    console.log(group)
    setIsEditing(true)
    setSelectedGroup(group);
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6 p-6">
      <EnhancedTable
        data={[...groups].reverse() || []}
        columns={columns}
        renderCell={renderCell}
        renderActions={renderActions}
        storageKey="crm-groups-table"
        className="bg-white rounded-lg border border-gray-200"
        emptyMessage="No groups available"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search groups..."
        pagination={true}
        pageSize={10}
        leftActions={
          <Button
            className="bg-[#C72030] hover:bg-[#B01E2A] text-white"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        }
      />

      <AddHiSocGroupModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setIsEditing(false)
          setSelectedGroup(null)
        }}
        fetchGroups={fetchData}
        isEditing={isEditing}
        record={selectedGroup}
      />
    </div>
  );
};

export default HiSocGroupsPage;
