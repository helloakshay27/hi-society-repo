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
  amount: string;
  convenienceCharge: string;
  total: string;
  paymentMode: string;
  statusId: string;
}

interface FitoutRequestCategory {
  id?: string;
  fitout_category_id: string;
  complaint_status_id: string;
  amount: string;
  documents: File[];
  existing_documents: Array<{
    id: number;
    document_url: string;
    active: number | null;
  }>;
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
  const [statuses, setStatuses] = useState([]);
  const [requestCategories, setRequestCategories] = useState<FitoutRequestCategory[]>([]);

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
    amount: '0.00',
    convenienceCharge: '0.00',
    total: '0.00',
    paymentMode: 'PAY AT SITE',
    statusId: '',
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
      
      const [blocksResponse, categoriesResponse, statusesResponse] = await Promise.all([
        apiClient.get(`/get_society_blocks.json?society_id=${idSociety}`),
        apiClient.get('/crm/admin/fitout_categories.json'),
        apiClient.get('/crm/admin/fitout_requests/fitout_statuses.json'),
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
      
      // Extract fitout_categories array from the response
      const annexuresArray = categoriesResponse.data?.fitout_categories || [];
      
      console.log('Annexures Array:', annexuresArray);
      
      setAnnexures(annexuresArray);
      
      // Extract statuses from API response
      const statusesArray = statusesResponse.data?.data || [];
      console.log('Statuses Array:', statusesArray);
      setStatuses(statusesArray);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const handleTowerChange = async (towerId: string) => {
    setFormData(prev => ({ ...prev, tower: towerId, flat: '', user: '' }));
    setFlats([]);
    setUsers([]);
    
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

  const handleFlatChange = async (flatId: string) => {
    setFormData(prev => ({ ...prev, flat: flatId, user: '' }));
    setUsers([]);
    
    if (flatId && formData.tower) {
      try {
        const response = await apiClient.get(`/get_user_society.json?society_block_id=${formData.tower}&society_flat_id=${flatId}`);
        console.log('Users API Response:', response.data);
        const usersArray = response.data?.user_societies || [];
        console.log('Users Array:', usersArray);
        setUsers(usersArray);
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      }
    } else {
      setUsers([]);
    }
  };

  const fetchFitoutRequest = async () => {
    try {
      setDataLoading(true);
      
      // Fetch from API
      const response = await apiClient.get(`/crm/admin/fitout_requests/${id}.json`);
      const data = response.data;
      
      console.log('Fitout Request Data:', data);
      console.log('Tower ID (site_id):', data.site_id);
      console.log('Flat ID (unit_id):', data.unit_id);
      console.log('User ID (user_id):', data.user_id);
      console.log('Fitout Request Categories:', data.fitout_request_categories);
      
      // Convert date format from DD/MM/YYYY or ISO format to YYYY-MM-DD for input fields
      const formatDateForInput = (dateStr: string) => {
        if (!dateStr || dateStr.trim() === '') return '';
        try {
          // Check if it's ISO 8601 format (e.g., "2026-01-16T00:00:00.000+05:30")
          if (dateStr.includes('T')) {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            }
          }
          
          // Check if it's DD/MM/YYYY format
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

      // Set tower first, then trigger flat loading
      const towerId = data.site_id?.toString() || '';
      const flatId = data.unit_id?.toString() || '';
      const userId = data.user_id?.toString() || '';
      
      // Load request categories from API
      const loadedCategories = data.fitout_request_categories?.map((cat: any) => ({
        id: cat.id?.toString(),
        fitout_category_id: cat.fitout_category_id?.toString() || '',
        complaint_status_id: cat.complaint_status_id?.toString() || '',
        amount: cat.amount?.toString() || '0.00',
        documents: [],
        existing_documents: cat.documents?.map((doc: any) => ({
          id: doc.id,
          document_url: doc.document_url,
          active: doc.active,
        })) || [],
      })) || [];
      
      setRequestCategories(loadedCategories);
      console.log('Loaded Categories:', loadedCategories);
      
      // Calculate total amount from fitout_request_categories
      const totalAmount = data.fitout_request_categories?.reduce(
        (sum: number, cat: any) => sum + (parseFloat(cat.amount) || 0),
        0
      ) || 0;
      
      // Set initial form data
      setFormData({
        tower: towerId,
        flat: flatId,
        user: userId,
        requestedDate: formatDateForInput(data.start_date) || '',
        description: data.description || '',
        contractorName: data.contactor_name || '',
        contractorMobileNo: data.contactor_no || '',
        expiryDate: formatDateForInput(data.expiry_date) || '',
        refundDate: formatDateForInput(data.refund_date) || '',
        amount: totalAmount.toFixed(2),
        convenienceCharge: data.lock_payment?.convenience_charge?.toString() || '0.00',
        total: (totalAmount + (parseFloat(data.lock_payment?.convenience_charge) || 0)).toFixed(2),
        paymentMode: 'PAY AT SITE',
        statusId: data.status_id?.toString() || '',
      });

      // Load flats for the selected tower
      if (towerId) {
        try {
          const selectedUserSocietyId = localStorage.getItem('selectedUserSociety') || '';
          let idSociety = '';
          
          if (selectedUserSocietyId) {
            const selectedSocietyResponse = await apiClient.get(`/crm/admin/user_societies.json`);
            const userSocieties = selectedSocietyResponse.data || [];
            const selectedSociety = userSocieties.find((us: any) => us.id.toString() === selectedUserSocietyId);
            idSociety = selectedSociety?.id_society || '';
          }
          
          const flatsResponse = await apiClient.get(`/get_society_flats.json?society_block_id=${towerId}&society_id=${idSociety}`);
          const flatsArray = flatsResponse.data?.society_flats || [];
          setFlats(flatsArray);
          console.log('Loaded flats for tower:', flatsArray);
        } catch (error) {
          console.error('Error loading flats:', error);
        }
      }

      // Load users for the selected flat
      if (flatId && towerId) {
        try {
          const usersResponse = await apiClient.get(`/get_user_society.json?society_block_id=${towerId}&society_flat_id=${flatId}`);
          const usersArray = usersResponse.data?.user_societies || [];
          setUsers(usersArray);
          console.log('Loaded users for flat:', usersArray);
          
          // Find the correct user_society.id that matches the user_id
          const matchingUserSociety = usersArray.find((us: any) => us.user?.id === data.user_id);
          if (matchingUserSociety) {
            console.log('Found matching user_society:', matchingUserSociety);
            // Update form data with the correct user_society.id
            setFormData(prev => ({
              ...prev,
              user: matchingUserSociety.id.toString()
            }));
          }
        } catch (error) {
          console.error('Error loading users:', error);
        }
      }
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
    } else if (name === 'flat') {
      handleFlatChange(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddCategory = () => {
    setRequestCategories(prev => [...prev, {
      fitout_category_id: '',
      complaint_status_id: '',
      amount: '0.00',
      documents: [],
      existing_documents: [],
    }]);
  };

  const handleCategorySelect = (index: number, categoryId: string) => {
    const selectedCategory = annexures.find((cat: any) => cat.id.toString() === categoryId);
    setRequestCategories(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        fitout_category_id: categoryId,
        amount: selectedCategory?.amount?.toString() || '0.00',
      };
      return updated;
    });
  };

  const handleCategoryChange = (index: number, field: keyof FitoutRequestCategory, value: any) => {
    setRequestCategories(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveCategory = (index: number) => {
    setRequestCategories(prev => prev.filter((_, i) => i !== index));
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
      
      // Prepare form data for submission
      const submitData = new FormData();
      
      // Add basic fields
      submitData.append('fitout_request[site_id]', formData.tower);
      submitData.append('fitout_request[unit_id]', formData.flat);
      submitData.append('fitout_request[user_id]', formData.user);
      submitData.append('fitout_request[start_date]', formData.requestedDate);
      submitData.append('fitout_request[description]', formData.description);
      submitData.append('fitout_request[contactor_name]', formData.contractorName);
      submitData.append('fitout_request[contactor_no]', formData.contractorMobileNo);
      submitData.append('fitout_request[expiry_date]', formData.expiryDate);
      submitData.append('fitout_request[refund_date]', formData.refundDate);
      
      if (formData.statusId) {
        submitData.append('fitout_request[status_id]', formData.statusId);
      }
      
      // Add fitout request categories
      requestCategories.forEach((category, index) => {
        if (category.id) {
          submitData.append(`fitout_request[fitout_request_categories_attributes][${index}][id]`, category.id);
        }
        submitData.append(`fitout_request[fitout_request_categories_attributes][${index}][fitout_category_id]`, category.fitout_category_id);
        submitData.append(`fitout_request[fitout_request_categories_attributes][${index}][amount]`, category.amount);
        
        if (category.complaint_status_id) {
          submitData.append(`fitout_request[fitout_request_categories_attributes][${index}][complaint_status_id]`, category.complaint_status_id);
        }
        
        // Add new documents if any files are selected
        if (category.documents && category.documents.length > 0) {
          category.documents.forEach((file, docIndex) => {
            submitData.append(`fitout_request[fitout_request_categories_attributes][${index}][documents_attributes][${docIndex}][document]`, file);
          });
        }
      });
      
      // Use PUT request to update
      const response = await apiClient.put(`/crm/admin/fitout_requests/${id}.json`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

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
  }

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
                  disabled={!formData.flat}
                >
                  <MenuItem value="">Select User</MenuItem>
                  {Array.isArray(users) && users.length > 0 ? (
                    users.map((userSociety: any) => (
                      <MenuItem key={userSociety.id} value={userSociety.id.toString()}>
                        {userSociety.user?.firstname || ''} {userSociety.user?.lastname || ''}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>{formData.flat ? 'No users available' : 'Select flat first'}</MenuItem>
                  )}
                </MuiSelect>
              </FormControl>

              <TextField
                label="Requested Date"
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
                inputProps={{ maxLength: 10 }}  
              />
               <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Description"
              fullWidth
              // multiline
              // rows={3}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />

             <FormControl fullWidth variant="outlined">
                <InputLabel shrink>Status</InputLabel>
                <MuiSelect
                  value={formData.statusId}
                  onChange={handleSelectChange('statusId')}
                  label="Status"
                  displayEmpty
                  sx={fieldStyles}
                >
                  <MenuItem value="">Select Status</MenuItem>
                  {statuses.map((status: any) => (
                    <MenuItem key={status.id} value={status.id.toString()}>
                      {status.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
            </div>


           
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-medium">Annexure</h3>
              <Button
                type="button"
                onClick={handleAddCategory}
                className="bg-[#C72030] text-white hover:bg-[#A01B28]"
              >
                + Add Annexure
              </Button>
            </div>

            {requestCategories.length === 0 && (
              <p className="text-sm text-gray-500">No annexures added yet. Click "+ Add Annexure" to add one.</p>
            )}

            {requestCategories.map((category, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4" style={{ backgroundColor: '#FAFAFA' }}>
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium" style={{ color: '#C72030' }}>Annexure {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(index)}
                    className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormControl fullWidth variant="outlined">
                    <InputLabel shrink>Annexure *</InputLabel>
                    <MuiSelect
                      value={category.fitout_category_id}
                      onChange={(e) => handleCategorySelect(index, e.target.value)}
                      label="Annexure *"
                      displayEmpty
                      sx={fieldStyles}
                    >
                      <MenuItem value="">Select Annexure</MenuItem>
                      {annexures.map((cat: any) => (
                        <MenuItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </MenuItem>
                      ))}
                    </MuiSelect>
                  </FormControl>

                  {category.id && (
                    <FormControl fullWidth variant="outlined">
                      <InputLabel shrink>Status</InputLabel>
                      <MuiSelect
                        value={category.complaint_status_id}
                        onChange={(e) => handleCategoryChange(index, 'complaint_status_id', e.target.value)}
                        label="Status"
                        displayEmpty
                        sx={fieldStyles}
                      >
                        <MenuItem value="">Select Status</MenuItem>
                        {statuses.map((status: any) => (
                          <MenuItem key={status.id} value={status.id.toString()}>
                            {status.name}
                          </MenuItem>
                        ))}
                      </MuiSelect>
                    </FormControl>
                  )}
                </div>

                {category.fitout_category_id && (
                  <div className="bg-white p-3 rounded border">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Amount:</span>
                      <span className="text-base font-semibold">₹{parseFloat(category.amount || '0').toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Images
                  </label>
                  
                  {/* Existing Images Gallery */}
                  {category.existing_documents && category.existing_documents.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-600 mb-2 font-medium">Current Images ({category.existing_documents.length}):</p>
                      <div className="flex flex-wrap gap-2">
                        {category.existing_documents.map((doc, docIndex) => (
                          <div key={doc.id} className="relative inline-block">
                            <img 
                              src={decodeURIComponent(doc.document_url)} 
                              alt={`Existing document ${docIndex + 1}`} 
                              className="w-24 h-24 object-cover rounded border border-gray-300"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded-b text-center">
                              Image {docIndex + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* New Images Preview */}
                  {category.documents && category.documents.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-green-600 mb-2 font-medium">New files selected ({category.documents.length}):</p>
                      <div className="flex flex-wrap gap-2">
                        {category.documents.map((file, fileIndex) => {
                          const imageUrl = URL.createObjectURL(file);
                          return (
                            <div key={fileIndex} className="relative inline-block group">
                              <img 
                                src={imageUrl} 
                                alt={`Preview ${fileIndex + 1}`} 
                                className="w-24 h-24 object-cover rounded border-2 border-green-500"
                                onLoad={() => URL.revokeObjectURL(imageUrl)}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedFiles = category.documents.filter((_, i) => i !== fileIndex);
                                  handleCategoryChange(index, 'documents', updatedFiles);
                                }}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 shadow-md"
                              >
                                ✕
                              </button>
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded-b text-center">
                                New {fileIndex + 1}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* File Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          const updatedFiles = [...category.documents, ...files];
                          handleCategoryChange(index, 'documents', updatedFiles);
                        }
                        // Reset input to allow selecting the same file again
                        e.target.value = '';
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#bf213e] file:text-white hover:file:bg-[#bf213e]"
                      id={`file-upload-${index}`}
                    />
                  </div>
                  {/* <p className="text-xs text-gray-500 mt-1">You can select multiple images at once</p> */}
                </div>
              </div>
            ))}

            <div className="border-t pt-4 space-y-3 mt-6">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm">Amount :</span>
                <span className="text-base font-medium">{requestCategories.reduce((sum, cat) => sum + (parseFloat(cat.amount) || 0), 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm">Convenience Charge :</span>
                <span className="text-base font-medium">{parseFloat(formData.convenienceCharge).toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-t pt-3">
                <span className="text-base font-semibold">Total :</span>
                <span className="text-lg font-bold">₹{(requestCategories.reduce((sum, cat) => sum + (parseFloat(cat.amount) || 0), 0) + parseFloat(formData.convenienceCharge)).toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm">Payment Mode :</span>
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
