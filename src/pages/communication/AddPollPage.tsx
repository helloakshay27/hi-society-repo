import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TextField, InputAdornment } from "@mui/material";
import axios from 'axios';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Calendar, Clock, Plus, X, Search } from 'lucide-react';
import { toast } from 'sonner';

interface PollOption {
  id: string;
  value: string;
}

const AddPollPage = () => {
  const navigate = useNavigate();
   const baseUrl = localStorage.getItem('baseUrl')
  const token = localStorage.getItem('token')
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  const [formData, setFormData] = useState({
    subject: '',
    startDate: '',
    startTime: '03:00 PM',
    endDate: '',
    endTime: '03:00 PM',
    flat: '',
    shareWith: 'all',
  });

  const [options, setOptions] = useState<PollOption[]>([
    { id: '1', value: '' },
  ]);

  const handleAddOption = () => {
    const newOption: PollOption = {
      id: Date.now().toString(),
      value: '',
    };
    setOptions([...options, newOption]);
  };

  const handleRemoveOption = (id: string) => {
    if (options.length > 1) {
      setOptions(options.filter((option) => option.id !== id));
    } else {
      toast.error('Poll must have at least 1 option');
    }
  };

  const handleOptionChange = (id: string, value: string) => {
    setOptions(
      options.map((option) =>
        option.id === id ? { ...option, value } : option
      )
    );
  };

  const combineDateTime = (date: string, time: string) => {
  if (!date || !time) return "";
  return `${date} ${time}:00`;
};
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    const filledOptions = options.filter((opt) => opt.value.trim());
    if (filledOptions.length < 1) {
      toast.error('Please provide at least 1 option');
      return;
    }

    // Submit poll
    console.log('Poll Data:', { ...formData, options: filledOptions });
    // toast.success('Poll created successfully!');
    


    const payload = {
    subject: formData.subject,
    user_id: 12437, // 🔹 replace with logged-in user id
    start: combineDateTime(formData.startDate, formData.startTime),
    end: combineDateTime(formData.endDate, formData.endTime),
    active: true,
    multiple: 0,
    publish: 1,
    vote_limit: "One",
    shared:
      formData.shareWith === "all"
        ? "All"
        : formData.shareWith === "individual"
        ? "Individual"
        : "Group",

    // 🔹 send only when Individual selected
    // user_ids:
    //   formData.shareWith === "individual"
    //     ? [3792, 3810, 3825] // dummy user ids
    //     : [],

    options: filledOptions.map(opt => ({
      name: opt.value
    }))
  };

  console.log("POST PAYLOAD:", payload);

  /* ================= API CALL ================= */

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
  }
    // Navigate back to polls page
    // setTimeout(() => {
    //   navigate('/communication/polls');
    // }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] px-0 py-6">
      {/* Header */}
      <div className="bg-[#f6f4ee] rounded-lg shadow-sm mb-6" >
        <div className="px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/communication/polls')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900" >Create New Poll</h1>
        </div>
      </div>

      <form id="pollForm" onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          {/* Subject */}
          <div className="md:col-span-1">
            <TextField
              label="Subject"
              placeholder="Enter poll subject*"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              variant="outlined"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: { backgroundColor: '#fff', borderRadius: '6px' } }}
            />
          </div>

          {/* Start Date (column 3) */}
          <div className="md:col-span-1">
            <TextField
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              variant="outlined"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Calendar size={18} className="text-gray-400" />
                  </InputAdornment>
                ),
                sx: { backgroundColor: '#fff', borderRadius: '6px' }
              }}
            />
          </div>

          {/* End Date (column 3) */}
          <div className="md:col-span-1">
            <TextField
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              variant="outlined"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <span style={{ marginRight: 8 }}>
                    <Calendar className="text-gray-400" />
                  </span>
                ),
                sx: { backgroundColor: '#fff', borderRadius: '6px' }
              }}
            />
          </div>

          {/* Start Time (column 4) */}
          <div className="md:col-span-1">
            <TextField
              label="Start Time"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              variant="outlined"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Clock size={18} className="text-gray-400" />
                  </InputAdornment>
                ),
                sx: { backgroundColor: '#fff', borderRadius: '6px' }
              }}
            />
          </div>

          {/* End Time */}
          <div className="md:col-span-1">
            <TextField
              label="End Time"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              variant="outlined"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: { backgroundColor: '#fff', borderRadius: '6px' } }}
            />
          </div>

          {/* Flat select and description */}
          {/* <div className="md:col-span-1">
            <Select value={formData.flat} onValueChange={(value) => setFormData({ ...formData, flat: value })}
              onOpenChange={(open) => setShowSearch(open)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Flat*" />
              </SelectTrigger>
              <SelectContent className="p-0">
                {showSearch && (
                  <div className="p-2 border-b">
                    <div className="relative">
                      <span className="absolute left-2.5 top-2.5 text-muted-foreground">🔍</span>
                      <Input
                        type="search"
                        placeholder="SEARCH FLATS"
                        className="w-full pl-8 uppercase"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                )}
                <div className="max-h-[200px] overflow-y-auto">
                  {["Flat 1", "Flat 2", "Flat 3", "Flat 4", "Flat 5"]
                    .filter(flat => flat.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(flat => (
                      <SelectItem key={flat} value={flat.toLowerCase().replace(' ', '')}>
                        {flat}
                      </SelectItem>
                    ))}
                </div>
              </SelectContent>
            </Select>
          </div> */}

          <div className="md:col-span-3 flex items-center">
            {/* <span className="text-sm text-gray-600">User can participate in the poll from a Flat.</span> */}
          </div>

          {/* Poll Options */}
          <div className="md:col-span-1">
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-3">
                  <TextField
                    label={`Option ${index + 1}`}
                    placeholder={`Option ${index + 1}*`}
                    value={option.value}
                    onChange={(e) => handleOptionChange(option.id, e.target.value)}
                    variant="outlined"
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ sx: { backgroundColor: '#fff', borderRadius: '6px' } }}
                  />
                  {options.length > 1 && (
                    <button type="button" onClick={() => handleRemoveOption(option.id)} className="text-red-600 hover:text-red-800">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-1 flex items-center">
            <Button type="button" onClick={handleAddOption}  className="border-[#C4B89D59] bg-[#C4B89D59] text-white hover:opacity-90 px-4 py-2">
              <Plus className="w-4 h-4 mr-2" />
              Add option
            </Button>
          </div>

          {/* Share With Section */}
          <div className="space-y-4 pt-4 md:col-span-3">
            <div className="bg-[#f6f4ee] px-4 py-2.5 rounded-md inline-block">
              <span className="text-sm font-semibold text-gray-900 tracking-wide">SHARE WITH</span>
            </div>

            <RadioGroup value={formData.shareWith} onValueChange={(value) => setFormData({ ...formData, shareWith: value })} className="flex gap-8">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" className="border-gray-400" />
                <Label htmlFor="all" className="text-sm font-medium text-gray-900 cursor-pointer">All</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" className="border-gray-400" />
                <Label htmlFor="individual" className="text-sm font-medium text-gray-900 cursor-pointer">Individual</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="group" id="group" className="border-gray-400" />
                <Label htmlFor="group" className="text-sm font-medium text-gray-900 cursor-pointer">Group</Label>
              </div>
            </RadioGroup>
          </div>

        </div>
      </form>

      <div className="flex justify-center mt-6">
        <Button form="pollForm" type="submit" className="bg-green-600 hover:bg-green-700 text-white px-12 py-2.5 text-base font-medium">Submit</Button>
      </div>
    </div>
  );
};

export default AddPollPage;
