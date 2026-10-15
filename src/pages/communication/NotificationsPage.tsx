import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Bell, Upload, Users } from 'lucide-react';
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem } from '@mui/material';
import axios from 'axios';
import { getFullUrl, getAuthHeader } from '@/config/apiConfig';

const NotificationsPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    text: '',
    file: null as File | null,
    shareWith: 'all',
    user_id: [] as number[],
    group_id: [] as number[],
  });

  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);

  // Fetch Users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(
          getFullUrl('/usergroups/get_members_list.json'),
          {
            headers: {
              Authorization: getAuthHeader(),
              "Content-Type": "multipart/form-data",
            },
          }
        );
        // Transform the response to extract user data with necessary fields
        const transformedUsers = (response?.data || []).map((item: any) => ({
          id: item.id,
          user_id: item.id_user,
          firstname: item.user?.firstname || '',
          lastname: item.user?.lastname || '',
          email: item.user?.email || '',
          mobile: item.user?.mobile || '',
          flat: item.user_flat?.flat || '',
          block: item.user_flat?.block || '',
          building_name: item.society?.building_name || ''
        }));
        setUsers(transformedUsers);
      } catch (error) {
        console.error("Error fetching Users:", error);
      }
    };
    fetchUsers();
  }, []);

  // Fetch Groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await axios.get(getFullUrl('/crm/usergroups.json'), {
          headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "multipart/form-data",
          },
        });
        const groupsData = response.data.usergroups || [];
        setGroups(groupsData);
      } catch (error) {
        console.error("Error fetching Groups:", error);
      }
    };

    if (formData.shareWith === "groups" && groups.length === 0) {
      fetchGroups();
    }
  }, [formData.shareWith]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    if (!formData.text.trim()) {
      toast.error('Please enter notification text');
      return;
    }

    // Validate shared with individual - require at least one user
    if (formData.shareWith === "individuals" && (!formData.user_id || formData.user_id.length === 0)) {
      toast.error('Please select at least one user when sharing with individuals.');
      return;
    }
    
    // Validate shared with group - require at least one group
    if (formData.shareWith === "groups" && (!formData.group_id || formData.group_id.length === 0)) {
      toast.error('Please select at least one group when sharing with groups.');
      return;
    }

    try {
      // Prepare FormData for multipart/form-data submission
      const formDataToSend = new FormData();
      
      // Add title and text
      formDataToSend.append('btitle', formData.title);
      formDataToSend.append('btext', formData.text);
      
      // Add shared parameter (0 for all, 1 for individuals/groups)
      if (formData.shareWith === 'all') {
        formDataToSend.append('noticeboard[shared]', '0');
      } else {
        formDataToSend.append('noticeboard[shared]', '1');
        
        // Add individual users if selected
        if (formData.shareWith === 'individuals' && formData.user_id.length > 0) {
          formData.user_id.forEach((userId) => {
            formDataToSend.append('noticeboard[swusers][]', userId.toString());
          });
        }
        
        // Add group users if selected
        if (formData.shareWith === 'groups' && formData.group_id.length > 0) {
          formData.group_id.forEach((groupId) => {
            formDataToSend.append('noticeboard[swusers][]', groupId.toString());
          });
        }
      }
      
      // Add file if present
      if (formData.file) {
        formDataToSend.append('bimage', formData.file);
      }

      // Send the notification
      const response = await axios.post(
        getFullUrl('/admin_push.json'),
        formDataToSend,
        {
          headers: {
            Authorization: getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      toast.success('Notification sent successfully!');
      
      resetForm();
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error(error.response?.data?.message || 'Failed to send notification. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      text: '',
      file: null,
      shareWith: 'all',
      user_id: [],
      group_id: [],
    });
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="p-6 min-h-screen send-notifications-page">
      <style>{`
        /* ---- Reference design: canvas, cards, fields ---- */
        html body #root .send-notifications-page {
          background-color: #FDFDFB !important;
        }
        html body #root .send-notifications-page .ref-card {
          background-color: #FFFFFF !important;
          border: 1px solid rgba(26, 26, 24, 0.09) !important;
          border-radius: 16px !important;
          box-shadow: none !important;
          overflow: hidden;
        }
        html body #root .send-notifications-page .ref-card > div:first-child {
          padding: 22px 24px 0 !important;
        }
        html body #root .send-notifications-page .ref-card > div:first-child h2 {
          font-size: 14px !important;
          font-weight: 600 !important;
          line-height: 1.4 !important;
          color: #1A1A18 !important;
        }
        /* section icon chip — same as Settings module (32px, #F5F4F0, ink icon) */
        html body #root .send-notifications-page .ref-card > div:first-child h2 > span:first-child {
          width: 32px !important;
          height: 32px !important;
          margin-right: 12px !important;
          flex: none;
          background-color: #F5F4F0 !important;
        }
        html body #root .send-notifications-page .ref-card > div:first-child h2 > span:first-child svg {
          width: 14px !important;
          height: 14px !important;
          color: #1A1A18 !important;
          stroke: #1A1A18 !important;
        }
        html body #root .send-notifications-page .ref-card > div:nth-child(2) {
          padding: 16px 24px 22px !important;
        }
        html body #root .send-notifications-page .MuiOutlinedInput-root {
          min-height: 44px;
          border-radius: 12px !important;
          background-color: #FFFFFF !important;
          font-size: 13.5px !important;
          font-weight: 500;
          color: #1A1A18;
          transition: box-shadow 0.16s ease;
        }
        html body #root .send-notifications-page .MuiOutlinedInput-notchedOutline {
          border-color: rgba(26, 26, 24, 0.08) !important;
          border-radius: 12px !important;
        }
        html body #root .send-notifications-page .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
          border-color: rgba(26, 26, 24, 0.28) !important;
        }
        html body #root .send-notifications-page .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
          border-color: #1A1A18 !important;
          border-width: 1px !important;
        }
        html body #root .send-notifications-page .MuiOutlinedInput-root.Mui-focused {
          box-shadow: 0 0 0 4px rgba(26, 26, 24, 0.1) !important;
        }
        html body #root .send-notifications-page .MuiOutlinedInput-input::placeholder {
          color: rgba(26, 26, 24, 0.3) !important;
          opacity: 1 !important;
        }
        html body #root .send-notifications-page .MuiInputLabel-root {
          color: rgba(26, 26, 24, 0.68) !important;
          font-weight: 600 !important;
        }
        html body #root .send-notifications-page .ref-upload svg {
          color: currentColor !important;
          stroke: currentColor !important;
        }
      `}</style>

      <div className="mb-[22px]">
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em]" style={{ color: "#1A1A18" }}>Send Notifications</h1>
        <p className="mt-1 text-[13px] font-medium" style={{ color: "rgba(26, 26, 24, 0.48)" }}>
          Push a notification to all residents, selected individuals or groups.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="ref-card">
          <div>
            <h2 className="flex items-center">
              <span className="rounded-full flex items-center justify-center">
                <Bell />
              </span>
              Notification Details
            </h2>
          </div>
          <div className="space-y-6">
            <TextField
              label="Title"
              name="title"
              placeholder="Enter notification title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Text"
              name="text"
              placeholder="Enter notification message"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              fullWidth
              multiline
              minRows={5}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />

            <div className="space-y-2">
              <span className="block text-[13px] font-semibold" style={{ color: "rgba(26, 26, 24, 0.68)" }}>
                Attachment (Optional)
              </span>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="ref-upload btn-cancel h-9 px-4 text-sm font-medium inline-flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </label>
                <span className="text-[13px]" style={{ color: "rgba(26, 26, 24, 0.55)" }}>
                  {formData.file ? formData.file.name : 'No file chosen'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="ref-card">
          <div>
            <h2 className="flex items-center">
              <span className="rounded-full flex items-center justify-center">
                <Users />
              </span>
              Share With
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex gap-8">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="shareWith"
                  checked={formData.shareWith === 'all'}
                  onChange={() => setFormData({ ...formData, shareWith: 'all', user_id: [], group_id: [] })}
                  className="w-4 h-4"
                />
                <span className="ml-2 text-sm text-gray-700">All</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="shareWith"
                  checked={formData.shareWith === 'individuals'}
                  onChange={() => setFormData({ ...formData, shareWith: 'individuals', group_id: [] })}
                  className="w-4 h-4"
                />
                <span className="ml-2 text-sm text-gray-700">Individuals</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="shareWith"
                  checked={formData.shareWith === 'groups'}
                  onChange={() => setFormData({ ...formData, shareWith: 'groups', user_id: [] })}
                  className="w-4 h-4"
                />
                <span className="ml-2 text-sm text-gray-700">Groups</span>
              </label>
            </div>

            {/* Individual Users Dropdown */}
            {formData.shareWith === "individuals" && (
              <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                <InputLabel shrink>Select Users</InputLabel>
                <MuiSelect
                  multiple
                  value={Array.isArray(formData.user_id) ? formData.user_id : []}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      user_id: e.target.value as number[],
                    }));
                  }}
                  label="Select Users"
                  notched
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected || selected.length === 0) {
                      return <span style={{ color: 'rgba(26, 26, 24, 0.3)' }}>Select Users</span>;
                    }
                    return selected
                      .map((id) => {
                        const user = users.find((u: any) => u.id === id || u.id.toString() === id.toString());
                        return user ? `${user.firstname} ${user.lastname}`.trim() : id;
                      })
                      .join(", ");
                  }}
                >
                  <MenuItem value="" disabled>
                    Select Users
                  </MenuItem>
                  {users.map((user: any) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.firstname} {user.lastname} {user.flat ? `(${user.flat})` : ''}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
            )}

            {/* Groups Dropdown */}
            {formData.shareWith === "groups" && (
              <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                <InputLabel shrink>Select Groups</InputLabel>
                <MuiSelect
                  multiple
                  value={Array.isArray(formData.group_id) ? formData.group_id : []}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      group_id: e.target.value as number[],
                    }));
                  }}
                  label="Select Groups"
                  notched
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected || selected.length === 0) {
                      return <span style={{ color: 'rgba(26, 26, 24, 0.3)' }}>Select Groups</span>;
                    }
                    return selected
                      .map((id) => {
                        const group = groups.find((g: any) => g.id === id || g.id.toString() === id.toString());
                        return group ? group.name : id;
                      })
                      .join(", ");
                  }}
                >
                  <MenuItem value="" disabled>
                    Select Groups
                  </MenuItem>
                  {groups.map((group: any) => (
                    <MenuItem key={group.id} value={group.id}>
                      {group.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={resetForm}
            className="btn-cancel h-9 px-4 text-sm font-medium bg-white border border-[#da7756] text-[#da7756] hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary h-9 px-4 text-sm font-medium"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default NotificationsPage;