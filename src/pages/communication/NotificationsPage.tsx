import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
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

  // Field styles for Material-UI components
  const fieldStyles = {
    height: '45px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    '& .MuiOutlinedInput-root': {
      height: '45px',
      '& fieldset': {
        borderColor: '#ddd',
      },
      '&:hover fieldset': {
        borderColor: '#C72030',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#C72030',
      },
    },
    '& .MuiInputLabel-root': {
      '&.Mui-focused': {
        color: '#C72030',
      },
    },
  };

  // Fetch Users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(
          getFullUrl('/usergroups/cp_members_list.json'),
          {
            headers: {
              Authorization: getAuthHeader(),
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setUsers(response?.data || []);
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
        const response = await axios.get(getFullUrl('/crm/usergroups.json?q[group_type_eq]=cp'), {
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
      
      // Reset form
      setFormData({
        title: '',
        text: '',
        file: null,
        shareWith: 'all',
        user_id: [],
        group_id: [],
      });
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error(error.response?.data?.message || 'Failed to send notification. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] p-6" >
      {/* Header */}
        <div className="bg-[#F6F4EE] rounded-lg shadow-sm mb-6">
        <div className="px-6 py-4">
           
          <h1 className="text-2xl font-semibold text-gray-900">Send Notifications</h1>
        </div>
      </div>
    {/* Form Card */}
      <div className="bg-white rounded-lg shadow-sm">
        <form onSubmit={handleSubmit} className="p-8">
          <div className="max-w-3xl space-y-6">
           
            {/* Title Field */}
           <div className="p-2">
             <div className="grid grid-cols-3 md:grid-cols-2 gap-6 items-center">
                <TextField
                 label="Title"
                 name="title"
                 placeholder="Enter notification title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ 
                  sx: { 
                    backgroundColor: '#fff',
                    borderRadius: '6px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#D1D5DB',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#9CA3AF',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#C72030',
                      borderWidth: '1px',
                    },
                  } 
                }}
              />
             </div>
           </div>

           {/* Text Field */}
           <div className="p-2 -mt-4">
             <div className="grid grid-cols-1 gap-6 items-center">
<div className="relative w-full">
  {/* Floating Label */}
  <Label
    className="
      absolute 
      -top-2 
      left-3 
      bg-white 
      px-1 
      text-xs 
      text-gray-600
    "
  >
    Text
  </Label>

  <Textarea
    name="text"
    placeholder="Enter notification message"
    value={formData.text}
    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
    className="
      w-full
      min-h-[150px]
      rounded-lg
      border
      border-gray-300
      px-3
      pt-4
      resize-none
      focus:outline-none
      focus:ring-1
      focus:ring-[#C72030]
      focus:border-[#C72030]
    "
  />
</div>
             </div>
           </div>

           {/* File Upload */}
<div className="space-y-2">
  <Label className="text-sm font-medium text-gray-700">
    Attachment (Optional)
  </Label>

  <div className="flex items-center gap-4">
    <input
      type="file"
      id="file-upload"
      onChange={handleFileChange}
      className="hidden"
    />

    <label
      htmlFor="file-upload"
      className="
        inline-flex
        items-center
        gap-3
        px-5
        py-2
        bg-[#e0d9c859]
        border
        border-gray-300
        rounded-md
        cursor-pointer
        hover:bg-[#ECECEC]
        transition-colors
      "
    >
      <span className="text-sm font-medium text-gray-800">
        Upload Files
      </span>

      <Upload className="w-4 h-4 text-[#C72030]" />
    </label>

    <span className="text-sm text-gray-600">
      {formData.file ? formData.file.name : 'No file chosen'}
    </span>
  </div>
</div>


            {/* Share With Section */}
            <div className="space-y-4 pt-4">
              <div className="bg-[#f6f4ee] px-4 py-2.5 rounded-md inline-block">
                <span className="text-sm font-semibold text-gray-900 tracking-wide">SHARE WITH</span>
              </div>
              
              <RadioGroup
                value={formData.shareWith}
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  shareWith: value,
                  user_id: value !== 'individuals' ? [] : formData.user_id,
                  group_id: value !== 'groups' ? [] : formData.group_id,
                })}
                className="flex gap-8"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" className="border-gray-400" />
                  <Label htmlFor="all" className="text-sm font-medium text-gray-900 cursor-pointer">
                    All
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="individuals" id="individuals" className="border-gray-400" />
                  <Label htmlFor="individuals" className="text-sm font-medium text-gray-900 cursor-pointer">
                    Individuals
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="groups" id="groups" className="border-gray-400" />
                  <Label htmlFor="groups" className="text-sm font-medium text-gray-900 cursor-pointer">
                    Groups
                  </Label>
                </div>
              </RadioGroup>

              {/* Individual Users Dropdown */}
              {formData.shareWith === "individuals" && (
                <FormControl
                  fullWidth
                  variant="outlined"
                  sx={{ '& .MuiInputBase-root': fieldStyles, mt: 2 }}
                >
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
                        return <span style={{ color: '#999' }}>Select Users</span>;
                      }
                      return selected
                        .map((id) => {
                          const user = users.find((u: any) => u.id === id || u.id.toString() === id.toString());
                          return user ? `${user.firstname} ${user.lastname}` : id;
                        })
                        .join(", ");
                    }}
                  >
                    <MenuItem value="" disabled>
                      Select Users
                    </MenuItem>
                    {users.map((user: any) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.firstname} {user.lastname}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>
              )}

              {/* Groups Dropdown */}
              {formData.shareWith === "groups" && (
                <FormControl
                  fullWidth
                  variant="outlined"
                  sx={{ '& .MuiInputBase-root': fieldStyles, mt: 2 }}
                >
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
                        return <span style={{ color: '#999' }}>Select Groups</span>;
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

            {/* Submit Button */}
            <div className="flex justify-center pt-6 border-t">
              <Button
                type="submit"
                className="bg-[#C72030] hover:bg-[#A01828] text-white px-12 py-2.5 text-base font-medium"
              >
                Submit
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotificationsPage;