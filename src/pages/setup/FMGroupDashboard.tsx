import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Edit, Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AddGroupModal } from '@/components/AddGroupModal';
import axios from 'axios';
import { API_CONFIG, getAuthHeader } from '@/config/apiConfig';
import { toast } from 'sonner';

export const FMGroupDashboard = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const navigate = useNavigate();
  const baseURL = API_CONFIG.BASE_URL;
  const token = localStorage.getItem("access_token");

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

  const handleToggleStatus = async (groupId: number, currentStatus: boolean) => {
    try {
      await axios.put(
        `${baseURL}/crm/usergroups/${groupId}.json`,
        {
          usergroup: {
            active: !currentStatus
          }
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Status updated successfully");
      fetchGroups();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error("Failed to update status");
    }
  };

  const handleEditGroup = async (groupId: number) => {
    try {
      const response = await axios.get(`${baseURL}/crm/usergroups/${groupId}.json`, {
        headers: {
          Authorization: getAuthHeader(),
        },
      });
      
      const groupData = {
        id: response.data.id,
        groupName: response.data.name,
        membersList: response.data.groupmembers || []
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
          <Button 
            className="bg-[#C72030] hover:bg-[#B8252F] text-white"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading groups...</div>
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
                  <TableHead>Profile</TableHead>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group: any) => (
                  <TableRow key={group.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditGroup(group.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{group.id}</TableCell>
                    <TableCell>
                      <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-orange-400"></div>
                      </div>
                    </TableCell>
                    <TableCell>{group.name}</TableCell>
                    <TableCell>{group.members_count}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleStatus(group.id, group.active)}
                        className={`w-8 h-5 rounded-full flex items-center ${group.active ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${group.active ? 'translate-x-3' : 'translate-x-0.5'}`} />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

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
