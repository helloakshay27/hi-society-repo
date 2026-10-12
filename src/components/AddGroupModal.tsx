import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, TextField } from '@mui/material';
import axios from 'axios';
import { API_CONFIG, getAuthHeader } from '@/config/apiConfig';

interface AddGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  fetchGroups: () => void;
  isEditing?: boolean
  record?: any
}

const fieldStyles = {
  height: { xs: 28, sm: 36, md: 45 },
  "& .MuiInputBase-input, & .MuiSelect-select": {
    padding: { xs: "8px", sm: "10px", md: "12px" },
  },
};

export const AddGroupModal = ({ isOpen, onClose, fetchGroups, isEditing, record }: AddGroupModalProps) => {
  const baseURL = API_CONFIG.BASE_URL;

  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${baseURL}/usergroups/cp_members_list.json`, {
          headers: {
            Authorization: getAuthHeader(),
          },
        });
        setMembers(response.data);
      } catch (error) {
        console.log(error);
        toast.error("Failed to fetch users")
      }
    }

    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, baseURL])

  useEffect(() => {
    if (isEditing && record && record.membersList) {
      setGroupName(record.groupName || '')
      const activeMembers = record.membersList
        .filter((m: any) => m.active === 1 && m.user_society_id)
        .map((m: any) => m.user_society_id.toString());
      setSelectedMembers(activeMembers);
    }
  }, [isEditing, record])

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
    setSearchTerm(e.target.value)
  }

  const filteredMembers = members.filter(member => {
    const fullName = `${member.firstname} ${member.lastname}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           member.email.toLowerCase().includes(searchTerm.toLowerCase());
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
      setLoading(true)
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
        }

        await axios.put(`${baseURL}/crm/usergroups/${record.id}.json`, payload, {
           headers: {
                   Authorization: getAuthHeader(),
                   "Content-Type": "application/json",
                 },
        });

        toast.success("Group updated successfully")
        handleClose();
        fetchGroups();
      } catch (error) {
        console.log(error)
        toast.error("Failed to update group")
      } finally {
        setLoading(false)
      }
    } else {
      setLoading(true)
      try {
        const payload = {
          usergroup: {
            name: groupName,
            swusersoc: selectedMembers,
            active: 1
          }
        }

        await axios.post(`${baseURL}/crm/usergroups.json`, payload, {
            headers: {
                    Authorization: getAuthHeader(),
                    "Content-Type": "application/json",
                  },
        });

        toast.success("Group created successfully")
        handleClose();
        fetchGroups();
      } catch (error) {
        console.log(error)
        toast.error("Failed to create group")
      } finally {
        setLoading(false)
      }
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px', border: '1px solid rgba(26,26,24,.09)' } }}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden" sx={{ padding: 0 }}>
        <div className="px-6 py-4 border-b border-[rgba(26,26,24,.09)]">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-[#1A1A18]">{isEditing ? "Edit Group" : "Add Group"}</h1>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex items-center justify-center w-8 h-8 rounded-md text-[rgba(26,26,24,.68)] hover:bg-[#F5F4F0] hover:text-[#1A1A18] transition-colors focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
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

              <button
                type="button"
                onClick={handleSelectAll}
                className="inline-flex min-h-[36px] items-center justify-center rounded-lg border border-[rgba(26,26,24,.08)] bg-white px-4 text-[13px] font-semibold text-[rgba(26,26,24,.68)] transition-all hover:border-[rgba(26,26,24,.28)] hover:text-[#1A1A18] disabled:opacity-60"
              >
                {selectAll ? 'Deselect All' : 'Select All Members'}
              </button>
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
                      {member.firstname} {member.lastname}
                      <span className="text-gray-500 text-xs ml-2">({member.email})</span>
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

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[rgba(26,26,24,.09)]">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[rgba(26,26,24,.08)] bg-white px-[22px] text-[13px] font-semibold text-[rgba(26,26,24,.68)] transition-all hover:border-[rgba(26,26,24,.28)] hover:text-[#1A1A18] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[#1A1A18] bg-[#1A1A18] px-[22px] text-[13px] font-semibold text-white transition-colors hover:bg-[#12100E] disabled:opacity-60"
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
