import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddHiSocGroupModal } from "@/components/AddHiSocGroupModal";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import { useAppDispatch } from "@/store/hooks";
import { fetchCrmUserGroups, updateCrmUserGroup } from "@/store/slices/userGroupSlice";

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
];

export const HiSocGroupsPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const baseUrl = localStorage.getItem("baseUrl");
  const token = localStorage.getItem("token");

  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isEditing, setIsEditing] = useState(false)
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingGroups, setDeletingGroups] = useState<{ [key: string]: boolean }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await dispatch(
        fetchCrmUserGroups({ baseUrl, token })
      ).unwrap();
      const mappedGroups = response.map(mapResponseToGroup);
      setGroups(mappedGroups);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dispatch, baseUrl, token]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredGroups = useMemo(() => {
    const reversed = [...groups].reverse();
    if (!searchTerm.trim()) return reversed;
    const query = searchTerm.toLowerCase();
    return reversed.filter((g) => g.groupName?.toLowerCase().includes(query));
  }, [groups, searchTerm]);

  const totalPages = Math.ceil(filteredGroups.length / pageSize) || 1;
  const paginatedGroups = filteredGroups.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPaginationItems = () => {
    if (!totalPages || totalPages <= 0) {
      return null;
    }
    const items = [];
    const showEllipsis = totalPages > 5;

    if (showEllipsis) {
      items.push(
        <PaginationItem key={1} className="cursor-pointer">
          <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 4) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      } else {
        for (let i = 2; i <= Math.min(3, totalPages - 1); i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      if (currentPage > 3 && currentPage < totalPages - 2) {
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      if (currentPage < totalPages - 3) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      } else {
        for (let i = Math.max(totalPages - 2, 2); i < totalPages; i++) {
          if (!items.find((item) => item.key === i.toString())) {
            items.push(
              <PaginationItem key={i} className="cursor-pointer">
                <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                  {i}
                </PaginationLink>
              </PaginationItem>
            );
          }
        }
      }

      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages} className="cursor-pointer">
            <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  const handleDeleteGroup = async (item: any) => {
    const itemId = item.id;

    if (deletingGroups[itemId]) return;

    try {
      setDeletingGroups((prev) => ({ ...prev, [itemId]: true }));

      await dispatch(
        updateCrmUserGroup({
          baseUrl,
          token,
          id: itemId.toString(),
          data: {
            usergroup: {
              active: 0,
            },
          },
        })
      ).unwrap();

      setGroups((prevData: any[]) =>
        prevData.filter((row) => row.id !== itemId)
      );

      toast.success(`Group deleted successfully`);
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Failed to delete group. Please try again.");
    } finally {
      setDeletingGroups((prev) => ({ ...prev, [itemId]: false }));
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
      <Button
        variant="ghost"
        size="sm"
        className="text-red-600 hover:text-red-700"
        onClick={() => handleDeleteGroup(group)}
        disabled={deletingGroups[group.id]}
      >
        <Trash2 className="w-4 h-4" />
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
        data={paginatedGroups}
        columns={columns}
        renderCell={renderCell}
        renderActions={renderActions}
        storageKey="crm-groups-table"
        className="bg-white rounded-lg border border-gray-200"
        loading={loading}
        emptyMessage="No groups available"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search groups..."
        pagination={false}
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

      <div className="mt-6 flex justify-center">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(currentPage - 1)}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {renderPaginationItems()}
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(currentPage + 1)}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

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
