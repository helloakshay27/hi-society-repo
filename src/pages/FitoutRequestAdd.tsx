import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem, SelectChangeEvent } from '@mui/material';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/utils/apiClient';

interface FitoutRequestFormData {
  tower: string;
  flat: string;
  user: string;
  requestedDate: string;
  description: string;
  contractorName: string;
  contractorMobileNo: string;
  expiryDate: string;
  refundDate: string;
  annexure: string;
  amount: string;
  convenienceCharge: string;
  total: string;
  paymentMode: string;
}

const FitoutRequestAdd: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [towers, setTowers] = useState([]);
  const [flats, setFlats] = useState([]);
  const [users, setUsers] = useState([]);
  const [annexures, setAnnexures] = useState([]);

  const [formData, setFormData] = useState<FitoutRequestFormData>({
    tower: '',
    flat: '',
    user: '',
    requestedDate: '',
    description: '',
    contractorName: '',
    contractorMobileNo: '',
    expiryDate: '',
    refundDate: '',
    annexure: '',
    amount: '0.00',
    convenienceCharge: '0.00',
    total: '0.00',
    paymentMode: 'PAY AT SITE',
  });

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

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      // Fetch towers, flats, users, annexures
      // Replace with actual API endpoints
      const [towersResponse, usersResponse, annexuresResponse] = await Promise.all([
        apiClient.get('/towers'),
        apiClient.get('/users'),
        apiClient.get('/annexures'),
      ]);

      setTowers(towersResponse.data || []);
      setUsers(usersResponse.data || []);
      setAnnexures(annexuresResponse.data || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Calculate total when amount or convenience charge changes
      if (name === 'amount' || name === 'convenienceCharge') {
        const amount = parseFloat(name === 'amount' ? value : updated.amount) || 0;
        const convenience = parseFloat(name === 'convenienceCharge' ? value : updated.convenienceCharge) || 0;
        updated.total = (amount + convenience).toFixed(2);
      }
      
      return updated;
    });
  };

  const handleSelectChange = (name: string) => (e: SelectChangeEvent<string>) => {
    setFormData(prev => ({ ...prev, [name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tower || !formData.flat || !formData.user) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await apiClient.post('/crm/admin/fitout_requests', {
        fitout_request: formData,
      });

      toast({
        title: 'Success',
        description: 'Fitout request created successfully!',
      });

      navigate('/master/fitout-requests');
    } catch (error) {
      console.error('Error creating fitout request:', error);
      toast({
        title: 'Error',
        description: 'Failed to create fitout request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/master/fitout-requests');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen" style={{ backgroundColor: '#FAF9F7' }}>
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="flex items-center gap-1 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Fitout Requests
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Request Info Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: '#F6F4EE' }}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#E5E0D3] mr-3">
                <span className="text-[#C72030] text-sm">1</span>
              </div>
              Request Info
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink>Tower *</InputLabel>
                <MuiSelect
                  value={formData.tower}
                  onChange={handleSelectChange('tower')}
                  label="Tower *"
                  displayEmpty
                  sx={fieldStyles}
                >
                  <MenuItem value="">Select Tower</MenuItem>
                  {towers.map((tower: any) => (
                    <MenuItem key={tower.id} value={tower.id}>
                      {tower.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              <FormControl fullWidth variant="outlined">
                <InputLabel shrink>Flat *</InputLabel>
                <MuiSelect
                  value={formData.flat}
                  onChange={handleSelectChange('flat')}
                  label="Flat *"
                  displayEmpty
                  sx={fieldStyles}
                >
                  <MenuItem value="">Select</MenuItem>
                  {flats.map((flat: any) => (
                    <MenuItem key={flat.id} value={flat.id}>
                      {flat.number}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              <FormControl fullWidth variant="outlined">
                <InputLabel shrink>User *</InputLabel>
                <MuiSelect
                  value={formData.user}
                  onChange={handleSelectChange('user')}
                  label="User *"
                  displayEmpty
                  sx={fieldStyles}
                >
                  <MenuItem value="">Select User</MenuItem>
                  {users.map((user: any) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              <TextField
                label="Requested Date *"
                name="requestedDate"
                type="date"
                value={formData.requestedDate}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />

              <TextField
                label="Expiry Date"
                name="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />

              <TextField
                label="Refund Date"
                name="refundDate"
                type="date"
                value={formData.refundDate}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextField
                label="Contractor Name"
                name="contractorName"
                value={formData.contractorName}
                onChange={handleInputChange}
                placeholder="Contractor Name"
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />

              <TextField
                label="Contractor Mobile No."
                name="contractorMobileNo"
                value={formData.contractorMobileNo}
                onChange={handleInputChange}
                placeholder="Contractor Mobile No."
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
            </div>

            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Description"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
          </div>
        </div>

        {/* Annexure Info Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: '#F6F4EE' }}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#E5E0D3] mr-3">
                <span className="text-[#C72030] text-sm">2</span>
              </div>
              Annexure Info
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink>Annexure *</InputLabel>
              <MuiSelect
                value={formData.annexure}
                onChange={handleSelectChange('annexure')}
                label="Annexure *"
                displayEmpty
                sx={fieldStyles}
              >
                <MenuItem value="">Select Annexure</MenuItem>
                {annexures.map((annexure: any) => (
                  <MenuItem key={annexure.id} value={annexure.id}>
                    {annexure.name}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>

            <div className="flex justify-between">
              <Button
                type="button"
                className="bg-[#C72030] text-white hover:bg-[#A01B28]"
              >
                + Add Annexure
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Amount:</span>
                <TextField
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  type="number"
                  step="0.01"
                  variant="outlined"
                  size="small"
                  sx={{ width: '120px' }}
                />
              </div>

              <div className="flex justify-between">
                <span>Convenience Charge:</span>
                <TextField
                  name="convenienceCharge"
                  value={formData.convenienceCharge}
                  onChange={handleInputChange}
                  type="number"
                  step="0.01"
                  variant="outlined"
                  size="small"
                  sx={{ width: '120px' }}
                />
              </div>

              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>₹{formData.total}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>Payment Mode:</span>
                <FormControl variant="outlined" size="small" sx={{ width: '200px' }}>
                  <MuiSelect
                    value={formData.paymentMode}
                    onChange={handleSelectChange('paymentMode')}
                  >
                    <MenuItem value="PAY AT SITE">PAY AT SITE</MenuItem>
                    <MenuItem value="ONLINE">ONLINE</MenuItem>
                    <MenuItem value="CASH">CASH</MenuItem>
                  </MuiSelect>
                </FormControl>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-6">
          <Button
            type="button"
            onClick={handleCancel}
            variant="outline"
            className="min-w-[120px]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-[#C72030] text-white hover:bg-[#A01B28] min-w-[120px]"
          >
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FitoutRequestAdd;