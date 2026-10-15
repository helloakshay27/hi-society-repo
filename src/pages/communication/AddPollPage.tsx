import { useEffect, useState } from 'react';
import { Trash2, ArrowLeft, ChevronRight, Search, X, FileText, ListChecks, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Paper,
  InputAdornment,
  IconButton,
  Stack,
  Alert,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import { useAppDispatch } from '@/store/hooks';
import { fetchFMUsers } from '@/store/slices/fmUserSlice';
import { fetchUserGroups } from '@/store/slices/userGroupSlice';
import axios from 'axios';
import { toast } from 'sonner';
import CircularProgress from "@mui/material/CircularProgress";
import { MemberFilterPanel, MemberFilterState } from "@/components/MemberFilterPanel";

interface User {
  id: number;
  name: string;
  user: {
    firstname: string;
    lastname: string;
    email: string;
  };
}

const AddPollPage = () => {
  const dispatch = useAppDispatch();
  const token = localStorage.getItem('token');
  const baseUrl = localStorage.getItem('baseUrl');
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    subject: '',
    startDate: '',
    endDate: '',
    startTime: '04:00 AM',
    endTime: '04:00 AM',
    shareWith: 'all',
    options: ['', '']
  });
  const [selectedShareWith, setSelectedShareWith] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  // const [users, setUsers] = useState([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
const [memberFilter, setMemberFilter] = useState<MemberFilterState>({
  roles: [],
  towers: [],
});

const [groupFilter, setGroupFilter] = useState<MemberFilterState>({
  roles: [],
  towers: [],
});

  // useEffect(() => {
  //   const fetchUsers = async () => {
  //     try {
  //       const res = await axios.get(
  //         `https://${baseUrl}/usergroups/get_members_list.json`,
  //         {
  //           params: { token }
  //         }
  //       );

  //       console.log("Users API response+++++++:", res.data);

  //       // ⚠️ adjust if API response structure differs
  //       setUsers(res.data || []);

  //     } catch (error) {
  //       console.error("Failed to fetch users", error);
  //     }
  //   };


    const fetchUsers = async (
  activeFilters: MemberFilterState = { roles: [], towers: [] }
) => {
  const params = new URLSearchParams();

  activeFilters.roles.forEach((r) =>
    params.append("values[]", r)
  );

  activeFilters.towers.forEach((tid) =>
    params.append("block_ids[]", tid)
  );

  params.append("token", token || "");

  try {
    const res = await axios.get(
      `https://${baseUrl}/usergroups/get_members_list.json?${params.toString()}`
    );

    setUsers(res.data || []);
  } catch (error) {
    console.error("Failed to fetch users", error);
  }
};

    // const fetchGroups = async () => {
    //   try {
    //     const response = await dispatch(fetchUserGroups({ token, baseUrl })).unwrap();
    //     setGroups(response);
    //   } catch (error) {
    //     console.log(error);
    //   }
    // };


    // const fetchGroups = async () => {
    //   try {
    //     const res = await axios.get(
    //       `https://${baseUrl}/crm/usergroups.json`,
    //       {
    //         params: { token }
    //       }
    //     );

    //     console.log("groups API response+++++++:", res.data);

    //     // ⚠️ adjust if API response structure differs
    //     setGroups(res.data.usergroups || []);

    //   } catch (error) {
    //     console.error("Failed to fetch users", error);
    //   }
    // };

    const fetchGroups = async (
  activeFilters: MemberFilterState = { roles: [], towers: [] }
) => {
  const params = new URLSearchParams();

  activeFilters.roles.forEach((r) =>
    params.append("values[]", r)
  );

  activeFilters.towers.forEach((tid) =>
    params.append("block_ids[]", tid)
  );

  params.append("token", token || "");

  try {
    const res = await axios.get(
      `https://${baseUrl}/crm/usergroups.json?${params.toString()}`
    );

    setGroups(res.data.usergroups || []);
  } catch (error) {
    console.error("Failed to fetch groups", error);
  }
};

  //   fetchUsers();
  //   fetchGroups();
  // }, [dispatch, token, baseUrl]);

  useEffect(() => {
  fetchUsers();
  fetchGroups();
}, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        options: newOptions
      }));
    }
  };

  const handleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleGroupSelection = (groupId) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleShareWithChange = (value) => {
    setSelectedShareWith(value);
    if (value !== 'individual') {
      setSelectedUsers([]);
      setUserSearch('');
    }
    if (value !== 'group') {
      setSelectedGroups([]);
      setGroupSearch('');
    }
  };

  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const formatAmPm = (time: string) => {
    // Already has AM/PM (e.g. "04:00 AM")
    if (time.includes('AM') || time.includes('PM')) return time;
    // 24-hour format from <input type="time"> (e.g. "16:30")
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  };

  const isNextDay = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    return (endDate.getTime() - startDate.getTime()) === 24 * 60 * 60 * 1000;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const startMinutes = toMinutes(formData.startTime);
    const endMinutes = toMinutes(formData.endTime);

    const startDateObj = new Date(formData.startDate);
    const endDateObj = new Date(formData.endDate);

    // Normalize dates
    startDateObj.setHours(0, 0, 0, 0);
    endDateObj.setHours(0, 0, 0, 0);

    // ❌ End date before start date
    if (endDateObj < startDateObj) {
      toast.error("End date cannot be before start date");
      return;
    }

    // ❌ More than 1 day difference
    const diffDays =
      (endDateObj.getTime() - startDateObj.getTime()) /
      (1000 * 60 * 60 * 24);

    // if (diffDays > 1) {
    //   toast.error("Poll duration cannot exceed 1 day");
    //   return;
    // }

    // ❌ Same day → end time must be greater
    if (diffDays === 0 && endMinutes <= startMinutes) {
      toast.error("End time must be greater than start time");
      return;
    }

    // ❌ Next day but invalid time logic
    if (diffDays === 1 && endMinutes >= startMinutes) {
      toast.error(
        "For next day polls, end time must be earlier than start time"
      );
      return;
    }

    setLoading(true);
    // Format dates and times for API
    // time is always in 24-hour "HH:MM" from <input type="time">
    const formatDateTime = (date, time) => {
      const [hours, minutes] = time.split(':').map(Number);
      const dateTime = new Date(date);
      dateTime.setHours(hours, minutes);
      const year = dateTime.getFullYear();
      const month = String(dateTime.getMonth() + 1).padStart(2, '0');
      const day = String(dateTime.getDate()).padStart(2, '0');
      const formattedHours = String(dateTime.getHours()).padStart(2, '0');
      const formattedMinutes = String(dateTime.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${formattedHours}:${formattedMinutes}`;
    };

    // Prepare payload
    const payload = {
      subject: formData.subject,
      startdate: formData.startDate ? formData.startDate.replace(/-/g, '/') : '',
      enddate: formData.endDate ? formData.endDate.replace(/-/g, '/') : '',
      start: formData.startDate && formData.startTime ? formatDateTime(formData.startDate, formData.startTime) : '',
      end: formData.endDate && formData.endTime ? formatDateTime(formData.endDate, formData.endTime) : '',
      starttime: formData.startTime ? formatAmPm(formData.startTime) : '',
      endtime: formData.endTime ? formatAmPm(formData.endTime) : '',
      vote_limit: 'All',
      options: formData.options.filter(opt => opt.trim() !== '').map(name => ({ name })),
      shared: selectedShareWith.charAt(0).toUpperCase() + selectedShareWith.slice(1),
      ...(selectedShareWith === 'individual' && { user_ids: selectedUsers }),
      ...(selectedShareWith === 'group' && { group_ids: selectedGroups })
    };

    // try {
    //   const response = await fetch(`https://${baseUrl}/pms/polls.json`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${token}`
    //     },
    //     body: JSON.stringify(payload)
    //   });

    //   if (!response.ok) {
    //     throw new Error('Failed to create poll');
    //   }

    //   navigate('/crm/polls');
    // } catch (error) {
    //   console.error('Error submitting poll:', error);
    //   // You might want to add error handling UI here
    // }

    try {
      const res = await axios.post(
        `https://${baseUrl}/crm/admin/polls.json?token=${token}`,
        payload,

      );

      console.log("API RESPONSE:", res.data);
      toast.success("Poll created successfully!");

      setTimeout(() => {
        navigate("/communication/polls");
      }, 1000);

    } catch (error: any) {
      console.error("Poll create error:", error);
      toast.error("Failed to create poll");
    } finally {
      setLoading(false);   // ✅ stop loader
    }

  };
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="p-6 min-h-screen add-poll-page">
      <style>{`
        /* Global "form svg" rule turns every icon black; keep icons on filled buttons white */
        html body #root .add-poll-page form button.btn-primary svg {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }

        /* ---- Reference design: canvas, cards, fields ---- */
        html body #root .add-poll-page {
          background-color: #FDFDFB !important;
        }
        html body #root .add-poll-page .ref-card {
          background-color: #FFFFFF !important;
          border: 1px solid rgba(26, 26, 24, 0.09) !important;
          border-radius: 16px !important;
          box-shadow: none !important;
          overflow: hidden;
        }
        html body #root .add-poll-page .ref-card > div:first-child {
          padding: 22px 24px 0 !important;
        }
        html body #root .add-poll-page .ref-card > div:first-child h2 {
          font-size: 14px !important;
          font-weight: 600 !important;
          line-height: 1.4 !important;
          color: #1A1A18 !important;
        }
        /* section icon chip — same as Settings module (32px, #F5F4F0, ink icon) */
        html body #root .add-poll-page .ref-card > div:first-child h2 > span:first-child {
          width: 32px !important;
          height: 32px !important;
          margin-right: 12px !important;
          flex: none;
          background-color: #F5F4F0 !important;
        }
        html body #root .add-poll-page .ref-card > div:first-child h2 > span:first-child svg {
          width: 14px !important;
          height: 14px !important;
          color: #1A1A18 !important;
          stroke: #1A1A18 !important;
        }
        html body #root .add-poll-page .ref-card > div:nth-child(2) {
          padding: 16px 24px 22px !important;
        }
        html body #root .add-poll-page .MuiOutlinedInput-root {
          min-height: 44px;
          border-radius: 12px !important;
          background-color: #FFFFFF !important;
          font-size: 13.5px !important;
          font-weight: 500;
          color: #1A1A18;
          transition: box-shadow 0.16s ease;
        }
        html body #root .add-poll-page .MuiOutlinedInput-notchedOutline {
          border-color: rgba(26, 26, 24, 0.08) !important;
          border-radius: 12px !important;
        }
        html body #root .add-poll-page .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
          border-color: rgba(26, 26, 24, 0.28) !important;
        }
        html body #root .add-poll-page .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
          border-color: #1A1A18 !important;
          border-width: 1px !important;
        }
        html body #root .add-poll-page .MuiOutlinedInput-root.Mui-focused {
          box-shadow: 0 0 0 4px rgba(26, 26, 24, 0.1) !important;
        }
        html body #root .add-poll-page .MuiOutlinedInput-input::placeholder {
          color: rgba(26, 26, 24, 0.3) !important;
          opacity: 1 !important;
        }
        html body #root .add-poll-page .MuiInputLabel-root {
          color: rgba(26, 26, 24, 0.68) !important;
          font-weight: 600 !important;
        }
        html body #root .add-poll-page .ref-list {
          border: 1px solid rgba(26, 26, 24, 0.08) !important;
          border-radius: 12px !important;
          box-shadow: none !important;
        }
        html body #root .add-poll-page .ref-list .MuiListItemButton-root:hover {
          background-color: #FAF9F7 !important;
        }
        html body #root .add-poll-page .MuiCheckbox-root.Mui-checked {
          color: #1A1A18 !important;
        }
        html body #root .add-poll-page .ref-chip {
          background-color: #F5F4F0 !important;
          color: #1A1A18 !important;
          font-weight: 500;
        }
        html body #root .add-poll-page .ref-chip .MuiChip-deleteIcon {
          color: rgba(26, 26, 24, 0.48) !important;
        }
        html body #root .add-poll-page .ref-chip .MuiChip-deleteIcon:hover {
          color: #1A1A18 !important;
        }
        html body #root .add-poll-page .ref-note {
          background-color: #F5F4F0 !important;
          color: #1A1A18 !important;
          border-radius: 12px !important;
          font-size: 13px !important;
        }
        html body #root .add-poll-page .ref-note .MuiAlert-icon {
          color: rgba(26, 26, 24, 0.68) !important;
        }
      `}</style>
      <div className="mb-[22px]">
        <div className="flex items-center gap-2 text-[13px] font-medium mb-3" style={{ color: "rgba(26, 26, 24, 0.48)" }}>
          <button
            type="button"
            onClick={() => navigate("/communication/polls")}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F5F4F0] transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span>Poll List</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold" style={{ color: "#1A1A18" }}>Create New Poll</span>
        </div>
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em]" style={{ color: "#1A1A18" }}>New Poll</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="ref-card">
          <div>
            <h2 className="flex items-center">
              <span className="rounded-full flex items-center justify-center">
                <FileText />
              </span>
              Poll Details
            </h2>
          </div>
          <div>
            <Stack spacing={3}>
              <TextField
                label="Subject"
                type="text"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Enter poll subject"
                required
                fullWidth
                variant="outlined"
                sx={{
                  "& .MuiFormLabel-asterisk": {
                    color: "red"
                  }
                }}
              />
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
                  gap: 3
                }}
              >
                <TextField
                  label="Start Date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  // InputProps={{
                  //   startAdornment: (
                  //     <InputAdornment position="start">
                  //       <Calendar size={20} />
                  //     </InputAdornment>
                  //   ),
                  // }}
                  inputProps={{
                    min: today   // 🚫 blocks past dates
                  }}
                  sx={{
                    "& .MuiFormLabel-asterisk": {
                      color: "red"
                    }
                  }}
                />
                <TextField
                  label="End Date"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  // InputProps={{
                  //   startAdornment: (
                  //     <InputAdornment position="start">
                  //       <Calendar size={20} />
                  //     </InputAdornment>
                  //   ),
                  // }}
                  inputProps={{
                    min: formData.startDate || today
                  }}
                  sx={{
                    "& .MuiFormLabel-asterisk": {
                      color: "red"
                    }
                  }}
                />
                <TextField
                  label="Start Time"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  // InputProps={{
                  //   startAdornment: (
                  //     <InputAdornment position="start">
                  //       <Clock size={20} />
                  //     </InputAdornment>
                  //   ),
                  // }}
                  sx={{
                    "& .MuiFormLabel-asterisk": {
                      color: "red"
                    }
                  }}
                />
                <TextField
                  label="End Time"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  // InputProps={{
                  //   startAdornment: (
                  //     <InputAdornment position="start">
                  //       <Clock size={20} />
                  //     </InputAdornment>
                  //   ),
                  // }}
                  sx={{
                    "& .MuiFormLabel-asterisk": {
                      color: "red"
                    }
                  }}
                />
              </Box>
            </Stack>
          </div>
        </div>

        <div className="ref-card">
          <div>
            <h2 className="flex items-center">
              <span className="rounded-full flex items-center justify-center">
                <ListChecks />
              </span>
              Poll Options
            </h2>
          </div>
          <div>
                <Stack spacing={2}>
                  {formData.options.map((option, index) => (
                    <Stack key={index} direction="row" alignItems="center" spacing={2}>
                      <TextField
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        required
                        fullWidth
                        size="small"
                        sx={{
                          //  width: "50%",
                          "& .MuiFormLabel-asterisk": {
                            color: "red"
                          }
                        }}
                      />
                      {formData.options.length > 2 && (
                        <IconButton
                          onClick={() => removeOption(index)}
                          sx={{ color: '#1A1A18' }}
                          size="small"
                          aria-label={`Remove option ${index + 1}`}
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      )}
                    </Stack>
                  ))}
                </Stack>
                <button
                  type="button"
                  className="btn-cancel h-9 px-4 text-sm font-medium bg-white border border-[#da7756] text-[#da7756] hover:bg-gray-100 mt-4"
                  onClick={addOption}
                >
                  Add Option
                </button>
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
          <div>
                <div className="flex gap-6">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="shareWith"
                        checked={selectedShareWith === 'all'}
                        onChange={() => handleShareWithChange('all')}
                        className="w-4 h-4"
                      />
                      <span className="ml-2 text-sm text-gray-700">All</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="shareWith"
                        checked={selectedShareWith === 'individual'}
                        onChange={() => handleShareWithChange('individual')}
                        className="w-4 h-4"
                      />
                      <span className="ml-2 text-sm text-gray-700">Individual</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="shareWith"
                        checked={selectedShareWith === 'group'}
                        onChange={() => handleShareWithChange('group')}
                        className="w-4 h-4"
                      />
                      <span className="ml-2 text-sm text-gray-700">Group</span>
                    </label>
                  </div>
                {selectedShareWith === 'individual' && (
                  <Box sx={{ mt: 2 }}>
                    <Box
  sx={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    mb: 2,
  }}
>
  <Typography variant="body2" color="text.secondary">
    Filter members by role or tower
  </Typography>

  <MemberFilterPanel
    value={memberFilter}
    onChange={(newFilters) => {
      setMemberFilter(newFilters);
      fetchUsers(newFilters);
    }}
  />
</Box>
                    <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                      Select Users ({selectedUsers.length} selected)
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      sx={{ mb: 1 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search size={16} color="#9e9e9e" />
                          </InputAdornment>
                        ),
                        endAdornment: userSearch ? (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setUserSearch('')} edge="end">
                              <X size={14} />
                            </IconButton>
                          </InputAdornment>
                        ) : null,
                      }}
                    />
                    {users.length > 0 && (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      p: 1.5,
      border: "1px solid rgba(26, 26, 24, 0.08)",
      borderRadius: "12px",
      mb: 1,
      bgcolor: "#FAF9F7",
    }}
  >
    <Checkbox
      checked={
        selectedUsers.length === users.length &&
        users.length > 0
      }
      onChange={(e) => {
        if (e.target.checked) {
          setSelectedUsers(users.map((u) => u.id));
        } else {
          setSelectedUsers([]);
        }
      }}
    />

    <Typography variant="body2" fontWeight={500}>
      Select All Members ({selectedUsers.length}/{users.length})
    </Typography>
  </Box>
)}
                    <Paper
                      variant="outlined"
                      className="ref-list"
                      sx={{
                        maxHeight: 200,
                        overflow: 'auto',
                        bgcolor: 'background.paper',
                        zIndex: 10
                      }}
                    >
                      <List dense>
                        {users.filter((user) => {
                          const fullName = `${user?.user?.firstname ?? ''} ${user?.user?.lastname ?? ''}`.toLowerCase();
                          const email = user?.user?.email?.toLowerCase() ?? '';
                          const q = userSearch.toLowerCase();
                          return fullName.includes(q) || email.includes(q);
                        }).map((user) => (
                          <ListItem key={user.id} disablePadding>
                            <ListItemButton
                              onClick={() => handleUserSelection(user.id)}
                            >
                              <ListItemIcon>
                                <Checkbox
                                  edge="start"
                                  checked={selectedUsers.includes(user.id)}
                                />
                              </ListItemIcon>

                              <ListItemText
                                primary={`${user?.user?.firstname ?? ""} ${user?.user?.lastname ?? ""}`.trim()}
                                secondary={user?.user?.email}
                              />
                            </ListItemButton>
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                    {selectedUsers.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 1, display: "block" }}
                        >
                          Selected Users:
                        </Typography>

                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {selectedUsers.map((userId) => {
                            const selectedUser = users.find(
                              (u) => u.id === userId
                            );

                            if (!selectedUser) return null;

                            const fullName = `${selectedUser.user.firstname} ${selectedUser.user.lastname}`.trim();

                            return (
                              <Chip
                                key={userId}
                                label={fullName || selectedUser.user.email}
                                size="small"
                                onDelete={() => handleUserSelection(userId)}
                                className="ref-chip"
                              />
                            );
                          })}
                        </Stack>
                      </Box>
                    )}

                  </Box>
                )}
                {selectedShareWith === 'group' && (
                  <Box sx={{ mt: 2 }}>
                    <Box
  sx={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    mb: 2,
  }}
>
  <Typography variant="body2" color="text.secondary">
    Filter groups by role or tower
  </Typography>

  <MemberFilterPanel
    value={groupFilter}
    onChange={(newFilters) => {
      setGroupFilter(newFilters);
      fetchGroups(newFilters);
    }}
  />
</Box>
                    <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                      Select Groups ({selectedGroups.length} selected)
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Search groups..."
                      value={groupSearch}
                      onChange={(e) => setGroupSearch(e.target.value)}
                      sx={{ mb: 1 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search size={16} color="#9e9e9e" />
                          </InputAdornment>
                        ),
                        endAdornment: groupSearch ? (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setGroupSearch('')} edge="end">
                              <X size={14} />
                            </IconButton>
                          </InputAdornment>
                        ) : null,
                      }}
                    />
                    <Paper
                      variant="outlined"
                      className="ref-list"
                      sx={{
                        maxHeight: 200,
                        overflow: 'auto',
                        bgcolor: 'background.paper',
                        zIndex: 10
                      }}
                    >
                      <List dense>
                        {groups.filter((group) =>
                          group.name?.toLowerCase().includes(groupSearch.toLowerCase())
                        ).map((group) => (
                          <ListItem key={group.id} disablePadding>
                            <ListItemButton
                              onClick={() => handleGroupSelection(group.id)}
                            >
                              <ListItemIcon>
                                <Checkbox
                                  edge="start"
                                  checked={selectedGroups.includes(group.id)}
                                />
                              </ListItemIcon>
                              <ListItemText
                                primary={group.name || "-"}
                                secondary={`${group.members_count} members`}
                              />
                            </ListItemButton>
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                    {selectedGroups.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Selected Groups:
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {selectedGroups.map((groupId) => {
                            const group = groups.find(g => g.id === groupId);
                            return group ? (
                              <Chip
                                key={groupId}
                                label={`${group.name} (${group.members_count} members)`}
                                size="small"
                                onDelete={() => handleGroupSelection(groupId)}
                                className="ref-chip"
                              />
                            ) : null;
                          })}
                        </Stack>
                      </Box>
                    )}
                  </Box>
                )}
                {selectedShareWith === 'all' && (
                  <Alert
                    severity="info"
                    className="ref-note"
                    sx={{ mt: 2 }}
                  >
                    This poll will be shared with all users in the system.
                  </Alert>
                )}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/communication/polls")}
            className="btn-cancel h-9 px-4 text-sm font-medium bg-white border border-[#da7756] text-[#da7756] hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary h-9 px-4 text-sm font-medium min-w-[120px] justify-center disabled:opacity-60"
          >
            {loading ? (
              <CircularProgress size={16} sx={{ color: "#fff" }} />
            ) : (
              "Submit Poll"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPollPage;