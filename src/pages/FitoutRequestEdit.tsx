import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem, SelectChangeEvent } from '@mui/material';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
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
  fitoutType: string;
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
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [towers, setTowers] = useState([]);
  const [flats, setFlats] = useState([]);
  const [users, setUsers] = useState([]);
  const [annexures, setAnnexures] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<any[]>([]);
  const [requestCategories, setRequestCategories] = useState<FitoutRequestCategory[]>([]);
  const [fitoutFlatRates, setFitoutFlatRates] = useState<any[]>([]);
  const [deposit, setDeposit] = useState('0.00');
  const fitoutTypes = ['Move In', 'Fitout'];

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
    fitoutType: '',
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

  useEffect(() => {
    // Fetch flat rates when fitout_type is selected
    if (formData.fitoutType) {
      fetchFitoutFlatRates(formData.fitoutType);
    } else {
      // Clear rates when fitout type is deselected
      setSelectedCategories([]);
      setFormData(prev => ({ ...prev, convenienceCharge: '0.00' }));
      setDeposit('0.00');
    }
  }, [formData.fitoutType]);

  const fetchFitoutFlatRates = async (fitoutType: string) => {
    try {
      // Fetch fitout flat rates based on fitout_type
      const response = await apiClient.get(`/crm/admin/fitout_flat_rates.json?q[fitout_type_eq]=${fitoutType}`);
      const rates = response.data?.fitout_flat_rates || [];
      console.log('=== Fitout Flat Rates Debug (Edit) ===');
      console.log('Selected Type:', fitoutType);
      console.log('Total Rates Found:', rates.length);
      console.log('All Rates:', rates);
      setFitoutFlatRates(rates);

      // Filter rates that match the fitout_type (rates with non-null fitout_type)
      const matchingRates = rates.filter((rate: any) => rate.fitout_type === fitoutType);
      
      console.log('Matching rates for fitout type:', matchingRates);
      console.log('Matching rates count:', matchingRates.length);
      
      // Auto-populate categories with amounts
      if (matchingRates.length > 0) {
        const autoCategories = matchingRates.map((rate: any) => ({
          fitout_category_id: rate.fitout_category_id?.toString() || '',
          complaint_status_id: '',
          amount: rate.amount?.toString() || '0.00',
          documents: [],
        }));
        
        console.log('Auto Categories:', autoCategories);
        setSelectedCategories(autoCategories);
        
        // Set convenience charge and deposit from first matching rate
        const firstRate = matchingRates[0];
        setFormData(prev => ({
          ...prev,
          convenienceCharge: firstRate.convenience_charge?.toString() || '0.00',
        }));
        setDeposit(firstRate.deposit?.toString() || '0.00');
        
        toast.success(`Loaded ${matchingRates.length} annexure(s) with amounts for ${fitoutType}`, {
          position: 'top-right',
          duration: 3000,
          style: {
            background: '#fff',
            color: 'black',
            border: 'none',
          },
        });
      } else if (matchingRates.length === 0) {
        console.warn('No matching rates found for fitout type:', fitoutType);
        toast.error(`No fitout rates configured for ${fitoutType} type`, {
          position: 'top-right',
          duration: 3000,
          style: {
            background: '#fff',
            color: 'black',
            border: 'none',
          },
        });
      }
    } catch (error) {
      console.error('Error fetching fitout flat rates:', error);
      toast.error('Failed to fetch fitout rates', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
    }
  };

  // Note: Categories will be auto-populated by fetchFitoutFlatRates when fitout_type is set
  // This matches the Add page behavior where categories come from API rates

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
      setAllCategories(annexuresArray);
      
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
        const response = await apiClient.get(`/crm/admin/flat_users.json?q[user_flat_society_flat_id_eq]=${flatId}&q[approve_eq]=true`);
        console.log('Users API Response:', response.data);
        // Response is an array of [name, id] tuples like [["ubaid hashmat", 110466]]
        const usersArray = Array.isArray(response.data) ? response.data.map(([name, id]: [string, number]) => ({
          id,
          name
        })) : [];
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
        fitoutType: data.fitout_type || '',
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
          const usersResponse = await apiClient.get(`/crm/admin/flat_users.json?q[user_flat_society_flat_id_eq]=${flatId}&q[approve_eq]=true`);
          // Response is an array of [name, id] tuples like [["ubaid hashmat", 110466]]
          const usersArray = Array.isArray(usersResponse.data) ? usersResponse.data.map(([name, id]: [string, number]) => ({
            id,
            name
          })) : [];
          setUsers(usersArray);
          console.log('Loaded users for flat:', usersArray);
          
          // Set the user ID directly from the API response (data.user_id)
          setFormData(prev => ({
            ...prev,
            user: data.user_society_id?.toString() || ''
          }));
        } catch (error) {
          console.error('Error loading users:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching fitout request:', error);
      toast.error('Failed to load fitout request data', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
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
    setSelectedCategories(prev => [...prev, {
      fitout_category_id: '',
      amount: '0.00',
      documents: [],
    }]);
  };

  const handleCategorySelect = (index: number, categoryId: string) => {
    const selectedCategory = allCategories.find((cat: any) => cat.id.toString() === categoryId);
    setSelectedCategories(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        fitout_category_id: categoryId,
        amount: selectedCategory?.amount?.toString() || '0.00',
      };
      return updated;
    });
  };

  const handleCategoryChange = (index: number, field: string, value: any) => {
    setSelectedCategories(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveCategory = (index: number) => {
    setSelectedCategories(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tower || !formData.flat || !formData.user) {
      toast.error('Please fill in all required fields', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
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
      submitData.append('fitout_request[user_society_id]', formData.user);
      submitData.append('fitout_request[start_date]', formData.requestedDate);
      submitData.append('fitout_request[description]', formData.description);
      submitData.append('fitout_request[contactor_name]', formData.contractorName);
      submitData.append('fitout_request[contactor_no]', formData.contractorMobileNo);
      submitData.append('fitout_request[expiry_date]', formData.expiryDate);
      submitData.append('fitout_request[refund_date]', formData.refundDate);
      
      if (formData.fitoutType) {
        submitData.append('fitout_request[fitout_type]', formData.fitoutType);
      }
      
      if (formData.statusId) {
        submitData.append('fitout_request[status_id]', formData.statusId);
      }
      
      // Add fitout request categories from selectedCategories
      selectedCategories.forEach((category, index) => {
        // Find matching requestCategory to get id if exists
        const existingCategory = requestCategories.find(
          rc => rc.fitout_category_id === category.fitout_category_id
        );
        
        if (existingCategory?.id) {
          submitData.append(`fitout_request[fitout_request_categories_attributes][${index}][id]`, existingCategory.id);
        }
        submitData.append(`fitout_request[fitout_request_categories_attributes][${index}][fitout_category_id]`, category.fitout_category_id);
        submitData.append(`fitout_request[fitout_request_categories_attributes][${index}][amount]`, category.amount);
        
        if (existingCategory?.complaint_status_id) {
          submitData.append(`fitout_request[fitout_request_categories_attributes][${index}][complaint_status_id]`, existingCategory.complaint_status_id);
        }
        
        // Add new documents if any files are selected
        if (category.documents && category.documents.length > 0) {
          category.documents.forEach((file: File, docIndex: number) => {
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

      toast.success('Fitout request updated successfully!', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });

      navigate('/fitout/requests');
    } catch (error) {
      console.error('Error updating fitout request:', error);
      toast.error('Failed to update fitout request', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
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
                <InputLabel shrink>Tower <span className='text-red-600'>*</span></InputLabel>
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
                <InputLabel shrink>Flat <span className='text-red-600'>*</span></InputLabel>
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
                <InputLabel shrink>User <span className='text-red-600'>*</span></InputLabel>
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
                    users.map((user: any) => (
                      <MenuItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>{formData.flat ? 'No users available' : 'Select flat first'}</MenuItem>
                  )}
                </MuiSelect>
              </FormControl>

              <TextField
                label={<>Requested Date<span className='text-red-600'> *</span> </>}
                name="requestedDate"
                type="date"
                value={formData.requestedDate}
                onChange={handleInputChange}
                fullWidth
                // required
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
                inputProps={{
                  min: new Date().toISOString().split('T')[0]
                }}
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

              <TextField
                label="Cheque Expiry Date"
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
                label="Cheque Refund Date"
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
              

              <FormControl fullWidth variant="outlined">
                <InputLabel shrink>Fitout Type</InputLabel>
                <MuiSelect
                  value={formData.fitoutType}
                  onChange={handleSelectChange('fitoutType')}
                  label="Type"
                  displayEmpty
                  sx={fieldStyles}
                >
                  <MenuItem value="">Select Type</MenuItem>
                  <MenuItem value="Move In">Move In</MenuItem>
                  <MenuItem value="Fitout">Fitout</MenuItem>
                </MuiSelect>
              </FormControl>

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
            </div>

            {selectedCategories.length === 0 && (
              <p className="text-sm text-gray-500">Please select Fitout Type to auto-populate annexures with amounts.</p>
            )}

            {selectedCategories.map((category, index) => {
              const categoryDetails = allCategories.find(c => c.id.toString() === category.fitout_category_id);
              
              return (
                <div key={index} className="" style={{ backgroundColor: '#FAFAFA' }}>
                  {/* <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium" style={{ color: '#C72030' }}>Annexure {index + 1}</h4>
                    {!isExistingCategory && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(index)}
                        className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                      >
                        ✕
                      </button>
                    )}
                  </div> */}

                  {/* <FormControl fullWidth variant="outlined">
                    <InputLabel shrink>Annexure *</InputLabel>
                    <MuiSelect
                      value={category.fitout_category_id}
                      onChange={(e) => handleCategorySelect(index, e.target.value)}
                      label="Annexure *"
                      displayEmpty
                      sx={fieldStyles}
                    >
                      <MenuItem value="">Select Annexure</MenuItem>
                      {allCategories.map((cat: any) => (
                        <MenuItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </MenuItem>
                      ))}
                    </MuiSelect>
                  </FormControl> */}

                  {category.fitout_category_id && categoryDetails && (
                    <div className="space-y-2">
                      {/* {categoryDetails.category_type && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          categoryDetails.category_type === 'Move In' 
                            ? 'bg-blue-100 text-blue-800' 
                            : categoryDetails.category_type === 'Fitout'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {categoryDetails.category_type}
                        </span>
                      )} */}
                      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        {/* <div className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Security Deposit:</span>
                            <span className="text-base font-semibold">₹{(parseFloat(categoryDetails.amount) || 0).toFixed(2)}</span>
                          </div>
                        </div> */}
                        {/* <div className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Convenience Charge:</span>
                            <span className="text-base font-semibold">₹{(parseFloat(selectedCat.convenience_charge) || 0).toFixed(2)}</span>
                          </div>
                        </div> */}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="border-t pt-4 space-y-3 mt-6">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm">Amount :</span>
                <span className="text-base font-medium">₹{selectedCategories.reduce((sum, cat) => {
                  return sum + (parseFloat(cat.amount) || 0);
                }, 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm">Convenience Charge :</span>
                <span className="text-base font-medium">₹{parseFloat(formData.convenienceCharge).toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm">Deposit :</span>
                <span className="text-base font-medium">₹{parseFloat(deposit).toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-t pt-3">
                <span className="text-base font-semibold">Total :</span>
                <span className="text-lg font-bold">₹{(selectedCategories.reduce((sum, cat) => {
                  return sum + (parseFloat(cat.amount) || 0);
                }, 0) + parseFloat(formData.convenienceCharge) + parseFloat(deposit)).toFixed(2)}</span>
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
