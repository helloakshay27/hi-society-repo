import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, TextField } from '@mui/material';
import axios from 'axios';
import { API_CONFIG, getAuthHeader } from '@/config/apiConfig';
import { MemberFilterPanel, MemberFilterState } from './MemberFilterPanel';

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

type Member = {
  id: number;
  id_user: number;
  firstname: string;
  lastname: string;
  email: string;
  mobile: string;
  flat: string;
  block: string;
  building_name: string;
  roles: string[];
  block_id: string;
  key: string;        // id as string — the form used in selectedMembers
  searchText: string; // pre-lowercased haystack for search
};

const MEMBER_ROW_HEIGHT = 68;

// Memoized so toggling one checkbox re-renders only that row, not all visible rows.
const MemberRow = memo(({ member, checked, onToggle }: { member: Member; checked: boolean; onToggle: (id: string) => void }) => (
  <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
    <Checkbox
      id={`group-member-${member.key}`}
      checked={checked}
      onCheckedChange={() => onToggle(member.key)}
    />
    <Label
      htmlFor={`group-member-${member.key}`}
      className="text-sm font-normal cursor-pointer flex-1 min-w-0"
    >
      <div className="flex flex-col">
        <span className="font-medium truncate">
          {member.firstname} {member.lastname}
        </span>
        <span className="text-gray-500 text-xs truncate">
          {member.email}{" "}
          {member.mobile && `• ${member.mobile}`}
        </span>
        <span className="text-gray-400 text-xs truncate">
          {member.flat}{" "}
          {member.block && `• ${member.block}`}
        </span>
      </div>
    </Label>
  </div>
));
MemberRow.displayName = 'MemberRow';

export const AddHiSocGroupModal = ({ isOpen, onClose, fetchGroups, isEditing, record }: AddHiSocGroupModalProps) => {
  const baseURL = API_CONFIG.BASE_URL;

  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const membersRequestId = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<MemberFilterState>({ roles: [], towers: [] });

  type MemberItem = {
    id: number;
    id_user: number;
    user_type?: string;
    society_block_id?: number;
    user?: { firstname?: string; lastname?: string; email?: string; mobile?: string };
    user_flat?: { flat?: string; block?: string };
    society?: { building_name?: string };
  };

  const transformMember = (item: MemberItem): Member => {
    const firstname = String(item.user?.firstname ?? '');
    const lastname = String(item.user?.lastname ?? '');
    const email = String(item.user?.email ?? '');
    const mobile = String(item.user?.mobile ?? '');
    const flat = String(item.user_flat?.flat || 'N/A');
    const block = String(item.user_flat?.block || 'N/A');
    return {
      id: item.id,
      id_user: item.id_user,
      firstname,
      lastname,
      email,
      mobile,
      flat,
      block,
      building_name: item.society?.building_name || '',
      roles: item.user_type ? [item.user_type] : [],
      block_id: item.society_block_id ? item.society_block_id.toString() : '',
      key: String(item.id),
      searchText: `${firstname} ${lastname}\n${email}\n${mobile}\n${flat}\n${block}`.toLowerCase(),
    };
  };

  // Fetch members — no params initially (returns all); params only sent when filters are active
  const fetchUsers = async (activeFilters: MemberFilterState = { roles: [], towers: [] }) => {
    const params = new URLSearchParams();

    // Only append role params when user has selected roles
    activeFilters.roles.forEach((r) => params.append("values[]", r));

    // Only append tower params when user has selected towers
    activeFilters.towers.forEach((tid) => params.append("block_ids[]", tid));

    const queryString = params.toString();
    const url = `${baseURL}/usergroups/get_members_list.json${queryString ? `?${queryString}` : ""}`;

    // Ignore responses from older requests if the filter changed while they were in flight
    const requestId = ++membersRequestId.current;
    setMembersLoading(true);
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: getAuthHeader(),
        },
      });

      // API may return an array directly or wrapped in a key
      const raw: unknown = response.data;
      const list: MemberItem[] = Array.isArray(raw)
        ? (raw as MemberItem[])
        : Array.isArray((raw as { members?: MemberItem[] })?.members)
          ? ((raw as { members: MemberItem[] }).members as MemberItem[])
          : [];

      if (requestId !== membersRequestId.current) return;
      setMembers(list.filter((item) => item?.id != null).map(transformMember));
    } catch (error) {
      if (requestId !== membersRequestId.current) return;
      console.error("Error fetching members:", error);
      toast.error("Failed to fetch members");
    } finally {
      if (requestId === membersRequestId.current) setMembersLoading(false);
    }
  };

  // When filter changes: re-fetch with new params from server
  const handleFilterChange = (newFilters: MemberFilterState) => {
    setFilters(newFilters);
    fetchUsers(newFilters);
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers({ roles: [], towers: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              .filter((m: { active: number; user_society_id?: number }) => m.active === 1 && m.user_society_id)
              .map((m: { user_society_id: number }) => m.user_society_id.toString());
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

  // Stable callback (functional update) so memoized rows don't re-render on every toggle
  const handleMemberToggle = useCallback((memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((m) => m !== memberId) : [...prev, memberId]
    );
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Filtering 5000 rows on every keystroke blocks typing; defer it so the input stays responsive
  const deferredSearch = useDeferredValue(searchTerm);

  const filteredMembers = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return members;
    return members.filter((member) => member.searchText.includes(q));
  }, [members, deferredSearch]);

  // O(1) lookup instead of Array.includes per row
  const selectedSet = useMemo(() => new Set(selectedMembers), [selectedMembers]);

  const allFilteredSelected = useMemo(
    () => filteredMembers.length > 0 && filteredMembers.every((m) => selectedSet.has(m.key)),
    [filteredMembers, selectedSet]
  );

  const handleSelectAllFiltered = (checked: boolean) => {
    const filteredKeys = filteredMembers.map((m) => m.key);
    if (checked) {
      // Add the visible (filtered) members without dropping ones selected under another search/filter
      setSelectedMembers((prev) => Array.from(new Set([...prev, ...filteredKeys])));
    } else {
      const toRemove = new Set(filteredKeys);
      setSelectedMembers((prev) => prev.filter((id) => !toRemove.has(id)));
    }
  };

  // Only the rows in view (plus a small overscan) are mounted
  const rowVirtualizer = useVirtualizer({
    count: filteredMembers.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => MEMBER_ROW_HEIGHT,
    overscan: 8,
  });

  // Jump back to the top when the result set changes
  useEffect(() => {
    rowVirtualizer.scrollToOffset(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredSearch, members]);

  const handleClose = () => {
    setGroupName('');
    setSelectedMembers([]);
    setSelectAll(false);
    setSearchTerm('');
    setFilters({ roles: [], towers: [] });
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

          {/* <div className="space-y-3">
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
            <div className="flex items-start gap-2 mt-1">
              <div className="flex-1">
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
                />
              </div>
              <div className="pt-1">
                <MemberFilterPanel
                  value={filters}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
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
          </div> */}


          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <Label className="text-sm font-medium text-gray-700 pt-2.5">
                Add Members
              </Label>
              <MemberFilterPanel
                value={filters}
                onChange={handleFilterChange}
                className="text-right"
              />
            </div>

            <TextField
              name="searchTerm"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search members..."
              fullWidth
              variant="outlined"
              InputProps={{ sx: fieldStyles }}
            />

            {filteredMembers.length > 0 && (
              <div
                className="flex items-center p-3 border border-gray-200 rounded-md bg-gray-50"
              >
                <Checkbox
                  id="group-select-all-members"
                  checked={allFilteredSelected}
                  onCheckedChange={(checked) => handleSelectAllFiltered(checked === true)}
                />

                <Label htmlFor="group-select-all-members" className="text-sm font-medium cursor-pointer ms-2">
                  Select All Members ({selectedMembers.length}/{members.length})
                </Label>
              </div>
            )}

            {/* Virtualized list: the container always exists so the virtualizer can measure it */}
            <div
              ref={listRef}
              className="overflow-y-auto border rounded-md p-1"
              style={{
                height: filteredMembers.length > 0
                  ? Math.min(240, filteredMembers.length * MEMBER_ROW_HEIGHT + 8)
                  : undefined,
              }}
            >
              {filteredMembers.length > 0 ? (
                <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const member = filteredMembers[virtualRow.index];
                    return (
                      <div
                        key={member.key}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <MemberRow
                          member={member}
                          checked={selectedSet.has(member.key)}
                          onToggle={handleMemberToggle}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  {membersLoading ? 'Loading members...' : 'No members found'}
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
