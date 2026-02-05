import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, TextField } from '@mui/material';
import axios from 'axios';
import { API_CONFIG, getAuthHeader } from '@/config/apiConfig';

interface AddHiSocGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  fetchGroups: () => void;
  isEditing?: boolean;
  record?: any;
}

const fieldStyles = {
  height: { xs: 28, sm: 36, md: 45 },
  "& .MuiInputBase-input, & .MuiSelect-select": {
    padding: { xs: "8px", sm: "10px", md: "12px" },
  },
};

export const AddHiSocGroupModal = ({ isOpen, onClose, fetchGroups, isEditing, record }: AddHiSocGroupModalProps) => {
  const baseURL = API_CONFIG.BASE_URL;

  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${baseURL}/usergroups/get_members_list.json`, {
          headers: {
            Authorization: getAuthHeader(),
          },
        });
        
        // Transform the API response to match the component's expected format
        const transformedMembers = response.data.map((item: any) => ({
          id: item.id,
          id_user: item.id_user,
          firstname: item.user?.firstname || '',
          lastname: item.user?.lastname || '',
          email: item.user?.email || '',
          mobile: item.user?.mobile || '',
          flat: item.user_flat?.flat || 'N/A',
          block: item.user_flat?.block || 'N/A',
          building_name: item.society?.building_name || ''
        }));
        
        setMembers(transformedMembers);
      } catch (error) {
        console.error("Error fetching members:", error);
        toast.error("Failed to fetch members");
      }
    };

    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, baseURL]);

  useEffect(() => {
    const fetchGroupDetails = async () => {
      if (isEditing && record && record.id) {
        try {
          const response = await axios.get(`${baseURL}/crm/usergroups/${record.id}.json`, {
            headers: {
              Authorization: getAuthHeader(),
            },
          });
          
          setGroupName(response.data.name || '');
          
          // Extract member IDs from groupmembers (note: API returns 'groupmembers', not 'group_members')
          if (response.data.groupmembers && Array.isArray(response.data.groupmembers)) {
            const memberIds = response.data.groupmembers
              .filter((m: any) => m.active === 1 && m.user_society_id)
              .map((m: any) => m.user_society_id.toString());
            setSelectedMembers(memberIds);
          }
        } catch (error) {
          console.error("Error fetching group details:", error);
          toast.error("Failed to fetch group details");
        }
      }
    };

    if (isOpen && isEditing) {
      fetchGroupDetails();
    } else if (isOpen && !isEditing) {
      setGroupName('');
      setSelectedMembers([]);
    }
  }, [isOpen, isEditing, record, baseURL]);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(members.map(member => member.id.toString()));
    }
    setSelectAll(!selectAll);
  };

  const handleMemberToggle = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(m => m !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredMembers = members.filter(member => {
    const fullName = `${member.firstname} ${member.lastname}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    return fullName.includes(searchLower) || 
           member.email.toLowerCase().includes(searchLower) ||
           member.mobile?.includes(searchTerm) ||
           member.flat?.toLowerCase().includes(searchLower) ||
           member.block?.toLowerCase().includes(searchLower);
  });

  const handleClose = () => {
    setGroupName('');
    setSelectedMembers([]);
    setSelectAll(false);
    setSearchTerm('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error("Please select at least one member");
      return;
    }

    if (isEditing) {
      setLoading(true);
      try {
        const activeValue =
          record && (record.active === 1 || record.active === true || record.active === '1')
            ? 1
            : record && (record.active === 0 || record.active === false || record.active === '0')
            ? 0
            : 1;
        const payload = {
          usergroup: {
            name: groupName,
            swusersoc: selectedMembers,
            active: activeValue
          }
        };

        await axios.put(`${baseURL}/crm/usergroups/${record.id}.json`, payload, {
           headers: {
                   Authorization: getAuthHeader(),
                   "Content-Type": "application/json",
                 },
        });

        toast.success("Group updated successfully");
        handleClose();
        fetchGroups();
      } catch (error) {
        console.error("Error updating group:", error);
        toast.error("Failed to update group");
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const payload = {
          usergroup: {
            name: groupName,
            swusersoc: selectedMembers,
            active: 1
          }
        };

        await axios.post(`${baseURL}/crm/usergroups.json`, payload, {
            headers: {
                    Authorization: getAuthHeader(),
                    "Content-Type": "application/json",
                  },
        });

        toast.success("Group created successfully");
        handleClose();
        fetchGroups();
      } catch (error) {
        console.error("Error creating group:", error);
        toast.error("Failed to create group");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden" sx={{ padding: 0 }}>
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-medium text-gray-900">{isEditing ? "Edit Group" : "Add Group"}</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
          <TextField
            label="Group Name"
            name="groupName"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group Name"
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            InputProps={{ sx: fieldStyles }}
            sx={{ mt: 1 }}
          />

          <div className="space-y-3">
            <div className='flex items-center justify-between'>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">Add Members</Label>
              </div>

              <Button
                onClick={handleSelectAll}
                className="bg-[#C72030] hover:bg-[#B8252F] text-white text-sm px-4 py-2"
              >
                {selectAll ? 'Deselect All' : 'Select All Members'}
              </Button>
            </div>
            <TextField
              label="Search..."
              name="searchTerm"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search..."
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
              sx={{ mt: 1 }}
            />
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <div key={member.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      id={member.id.toString()}
                      checked={selectedMembers.includes(member.id.toString())}
                      onCheckedChange={() => handleMemberToggle(member.id.toString())}
                    />
                    <Label
                      htmlFor={member.id.toString()}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {member.firstname} {member.lastname}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {member.email} {member.mobile && `• ${member.mobile}`}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {member.flat} {member.block && `• ${member.block}`}
                        </span>
                      </div>
                    </Label>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No members found
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3 px-6 py-4 border-t border-gray-200">
          <Button
            onClick={handleSubmit}
            className="bg-[#C72030] hover:bg-[#B8252F] text-white px-8"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </Button>
          <Button
            onClick={handleClose}
            className="bg-[#C72030] hover:bg-[#B8252F] text-white px-8"
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
