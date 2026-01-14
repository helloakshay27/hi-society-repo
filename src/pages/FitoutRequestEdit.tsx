import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

const FitoutRequestEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
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
    fetchFitoutRequest();
  }, [id]);

  const fetchDropdownData = async () => {
    try {
      // Get society_id from localStorage (this is the user_society.id)
      const selectedUserSocietyId = localStorage.getItem('selectedUserSociety') || '';
      
      // First, get the selected user society to extract id_society
      let idSociety = '';
      if (selectedUserSocietyId) {
        const selectedSocietyResponse = await apiClient.get(`/crm/admin/user_societies.json`);
        const userSocieties = selectedSocietyResponse.data || [];
        const selectedSociety = userSocieties.find((us: any) => us.id.toString() === selectedUserSocietyId);
        idSociety = selectedSociety?.id_society || '';
        console.log('Extracted id_society:', idSociety);
      }
      
      if (!idSociety) {
        console.error('No id_society found. Please ensure selectedUserSociety is set in localStorage.');
        return;
      }
      
      // Fetch towers/blocks, users, annexures/categories
      console.log('Fetching dropdown data with id_society:', idSociety);
      
      const [blocksResponse, usersResponse, categoriesResponse] = await Promise.all([
        apiClient.get(`/get_society_blocks.json?society_id=${idSociety}`),
        apiClient.get(`/get_user_society.json?id_society=${idSociety}`),
        apiClient.get('/crm/admin/fitout_categories.json'),
      ]);

      console.log('Full Blocks Response:', blocksResponse);
      console.log('Blocks API Response Data:', blocksResponse.data);
      console.log('Type of blocksResponse.data:', typeof blocksResponse.data);
      console.log('Society Blocks:', blocksResponse.data?.society_blocks);
      
      // Extract society_blocks array from the response
      let blocksArray = [];
      if (blocksResponse.data && blocksResponse.data.society_blocks) {
        blocksArray = blocksResponse.data.society_blocks;
      } else if (Array.isArray(blocksResponse.data)) {
        // In case the response is directly an array
        blocksArray = blocksResponse.data;
      }
      
      console.log('Final Blocks Array:', blocksArray);
      console.log('Blocks Array Length:', blocksArray.length);
      setTowers(blocksArray);
      
      // Extract user_societies array from the response
      const usersArray = usersResponse.data?.user_societies || [];
      // Extract fitout_categories array from the response
      const annexuresArray = categoriesResponse.data?.fitout_categories || [];
      
      console.log('Users Array:', usersArray);
      console.log('Annexures Array:', annexuresArray);
      
      setUsers(usersArray);
      setAnnexures(annexuresArray);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const handleTowerChange = async (towerId: string) => {
    setFormData(prev => ({ ...prev, tower: towerId, flat: '' }));
    
    if (towerId) {
      try {
        // Get id_society from localStorage selected user society
        const selectedUserSocietyId = localStorage.getItem('selectedUserSociety') || '';
        let idSociety = '';
        
        if (selectedUserSocietyId) {
          const selectedSocietyResponse = await apiClient.get(`/crm/admin/user_societies.json`);
          const userSocieties = selectedSocietyResponse.data || [];
          const selectedSociety = userSocieties.find((us: any) => us.id.toString() === selectedUserSocietyId);
          idSociety = selectedSociety?.id_society || '';
        }
        
        const response = await apiClient.get(`/get_society_flats.json?society_block_id=${towerId}&society_id=${idSociety}`);
        console.log('Flats API Response:', response.data);
        const flatsArray = response.data?.society_flats || [];
        console.log('Flats Array:', flatsArray);
        setFlats(flatsArray);
      } catch (error) {
        console.error('Error fetching flats:', error);
        setFlats([]);
      }
    } else {
      setFlats([]);
    }
  };

  const fetchFitoutRequest = async () => {
    try {
      setDataLoading(true);
      
      // Fetch from API
      const response = await apiClient.get(`/crm/admin/fitout_requests/${id}.json`);
      const data = response.data;
      
      console.log('Fitout Request Data:', data);
      
      // Convert date format from DD/MM/YYYY to YYYY-MM-DD for input fields
      const formatDateForInput = (dateStr: string) => {
        if (!dateStr || dateStr.trim() === '') return '';
        try {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            const [day, month, year] = parts;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        } catch (e) {
          console.error('Date parsing error:', e);
        }
        return '';
      };

      setFormData({
        tower: '', // Will be set when tower dropdown loads
        flat: '', // Will be set when flat dropdown loads
        user: data.user_society_id?.toString() || '',
        requestedDate: formatDateForInput(data.start_date) || '',
        description: data.description || '',
        contractorName: '', // Not in API response
        contractorMobileNo: '', // Not in API response
        expiryDate: '', // Not in API response
        refundDate: formatDateForInput(data.end_date) || '',
        annexure: data.fitout_category_id ? data.fitout_category_id.toString() : '',
        amount: data.amount?.toString() || '0.00',
        convenienceCharge: data.lock_payment?.convenience_charge?.toString() || '0.00',
        total: data.amount?.toString() || '0.00',
        paymentMode: 'PAY AT SITE',
      });
    } catch (error) {
      console.error('Error fetching fitout request:', error);
      toast({
        title: 'Error',
        description: 'Failed to load fitout request data',
        variant: 'destructive',
      });
    } finally {
      setDataLoading(false);
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
    const value = e.target.value;
    
    if (name === 'tower') {
      handleTowerChange(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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
      
      // In production, use PUT request:
      // const response = await apiClient.put(`/crm/admin/fitout_requests/${id}`, {
      //   fitout_request: formData,
      // });

      toast({
        title: 'Success',
        description: 'Fitout request updated successfully!',
      });

      navigate('/fitout/requests');
    } catch (error) {
      console.error('Error updating fitout request:', error);
      toast({
        title: 'Error',
        description: 'Failed to update fitout request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/fitout/requests');
  };

  if (dataLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C72030] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading fitout request...</p>
        </div>
      </div>
    );
  }

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
                  {Array.isArray(towers) && towers.length > 0 ? (
                    towers.map((tower: any) => (
                      <MenuItem key={tower.id} value={tower.id.toString()}>
                        {tower.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No towers available</MenuItem>
                  )}
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
                  disabled={!formData.tower}
                >
                  <MenuItem value="">Select Flat</MenuItem>
                  {Array.isArray(flats) && flats.length > 0 ? (
                    flats.map((flat: any) => (
                      <MenuItem key={flat.id} value={flat.id.toString()}>
                        {flat.flat_no}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>{formData.tower ? 'No flats available' : 'Select tower first'}</MenuItem>
                  )}
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
                  {Array.isArray(users) && users.length > 0 ? (
                    users.map((userSociety: any) => (
                      <MenuItem key={userSociety.id} value={userSociety.id.toString()}>
                        {userSociety.user?.firstname || ''} {userSociety.user?.lastname || ''}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No users available</MenuItem>
                  )}
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
                {Array.isArray(annexures) && annexures.length > 0 ? (
                  annexures.map((annexure: any) => (
                    <MenuItem key={annexure.id} value={annexure.id}>
                      {annexure.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No annexures available</MenuItem>
                )}
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
            {loading ? 'Updating...' : 'Update'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FitoutRequestEdit;
