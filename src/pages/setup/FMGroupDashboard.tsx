import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
import { Eye, Edit, Plus, ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AddGroupModal } from '@/components/AddGroupModal';
import axios from 'axios';
import { API_CONFIG, getAuthHeader } from '@/config/apiConfig';
import { toast } from 'sonner';
import { useDynamicPermissions } from '@/hooks/useDynamicPermissions';

export const FMGroupDashboard = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const { shouldShow } = useDynamicPermissions();
  const baseURL = API_CONFIG.BASE_URL;
  const token = localStorage.getItem("access_token");
  const itemsPerPage = 10;
  const totalPages = Math.ceil(groups.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGroups = groups.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPaginationItems = () => {
    if (!totalPages || totalPages <= 0) return null;
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

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/crm/usergroups.json?q[group_type_eq]=cp`, {
        headers: {
                         Authorization: getAuthHeader(),
                         "Content-Type": "application/json",
                       },
      });
      setGroups(response.data.usergroups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error("Failed to fetch groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    try {
      await axios.put(
        `${baseURL}/crm/usergroups/${groupId}.json`,
        {
          usergroup: {
            active: 0
          }
        },
        {
          headers: {
            Authorization: getAuthHeader(),
          },
        }
      );
      toast.success("Group deleted successfully");
      fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error("Failed to delete group");
    }
  };

  const handleViewGroup = (groupId: number) => {
    navigate(`/crm/groups/details/${groupId}`);
  };

  const handleEditGroup = async (groupId: number) => {
    try {
      const response = await axios.get(`${baseURL}/crm/usergroups/${groupId}.json`, {
        headers: {
          Authorization: getAuthHeader(),
        },
      });
      
      const data = response.data;
      const groupData = {
        id: data.id,
        groupName: data.name,
        membersList: data.groupmembers || [],
        active: data.active
      };
      
      setSelectedGroup(groupData);
      setIsEditing(true);
      setIsAddModalOpen(true);
    } catch (error) {
      console.error('Error fetching group details:', error);
      toast.error("Failed to fetch group details");
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setIsEditing(false);
    setSelectedGroup(null);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="space-y-6">
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors mr-2"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span>Setup Member</span>
            <span>{">"}</span>
            <span className="text-gray-900 font-medium">Groups</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">GROUP LIST</h1>
        </div>

        <div className="flex items-center gap-3 mb-6">
          {shouldShow("Groups", "create") && (
            <Button 
variant="ghost"
           className="btn-primary h-9 px-4 text-sm font-medium"               onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C72030]"></div>
            </div>
          ) : groups.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">No groups found</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50" style={{ backgroundColor: "#F6F4EE" }}>
                  <TableHead>Actions</TableHead>
                  <TableHead>ID</TableHead>
                  {/* <TableHead>Profile</TableHead> */}
                  <TableHead>Group Name</TableHead>
                  <TableHead>Members</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedGroups.map((group: any) => (
                  <TableRow key={group.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {shouldShow("Groups", "show") && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewGroup(group.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        {shouldShow("Groups", "update") && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditGroup(group.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteGroup(group.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{group.id}</TableCell>
                    {/* <TableCell>
                      <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-orange-400"></div>
                      </div>
                    </TableCell> */}
                    <TableCell>{group.name}</TableCell>
                    <TableCell>{group.members_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {groups.length > 0 && (
          <div className="flex items-center justify-center mt-6">
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
        )}

        <AddGroupModal
          isOpen={isAddModalOpen} 
          onClose={handleCloseModal}
          fetchGroups={fetchGroups}
          isEditing={isEditing}
          record={selectedGroup}
        />
      </div>
    </div>
  );
};

export default FMGroupDashboard;