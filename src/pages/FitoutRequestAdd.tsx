import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem, SelectChangeEvent } from '@mui/material';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/utils/apiClient';

interface FitoutRequestFormData {
  user_society_id: string;
  site_id: string;
  unit_id: string;
  user_id: string;
  fitout_category_id: string;
  requested_date: string;
  expiry_date: string;
  refund_date: string;
  description: string;
  contactor_name: string;
  contactor_no: string;
  pay_mode: string;
  amount: string;
  status_id: string;
  pms_supplier_id: string;
  fitout_type: string;
}

interface FitoutRequestCategory {
  fitout_category_id: string;
  complaint_status_id: string;
  amount: string;
  documents: File[];
}

const FitoutRequestAdd: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [towers, setTowers] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [fitoutFlatRates, setFitoutFlatRates] = useState<any[]>([]);
  const [convenienceCharge, setConvenienceCharge] = useState('0.00');
  const [deposit, setDeposit] = useState('0.00');
  const [requestCategories, setRequestCategories] = useState<FitoutRequestCategory[]>([]);

  const [formData, setFormData] = useState<FitoutRequestFormData>({
    user_society_id: '',
    site_id: '',
    unit_id: '',
    user_id: '',
    fitout_category_id: '',
    requested_date: '',
    expiry_date: '',
    refund_date: '',
    description: '',
    contactor_name: '',
    contactor_no: '',
    pay_mode: 'PAY AT SITE',
    amount: '0.00',
    status_id: '',
    pms_supplier_id: '',
    fitout_type: '',
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

  useEffect(() => {
    // Fetch flat rates when fitout_type is selected
    if (formData.fitout_type) {
      fetchFitoutFlatRates(formData.fitout_type);
    } else {
      // Clear rates when fitout type is deselected
      setRequestCategories([]);
      setConvenienceCharge('0.00');
      setDeposit('0.00');
    }
  }, [formData.fitout_type]);

  const fetchFitoutFlatRates = async (fitoutType: string) => {
    try {
      // Fetch fitout flat rates based on fitout_type
      const response = await apiClient.get(`/crm/admin/fitout_flat_rates.json?q[fitout_type_eq]=${fitoutType}`);
      const rates = response.data?.fitout_flat_rates || [];
      console.log('=== Fitout Flat Rates Debug ===');
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
        setRequestCategories(autoCategories);
        
        // Set convenience charge and deposit from first matching rate
        const firstRate = matchingRates[0];
        setConvenienceCharge(firstRate.convenience_charge?.toString() || '0.00');
        setDeposit(firstRate.deposit?.toString() || '0.00');
        
        toast({
          title: 'Success',
          description: `Loaded ${matchingRates.length} annexure(s) with amounts for ${fitoutType}`,
        });
      } else {
        // No matching rates found for this fitout type
        console.warn('No matching rates found for fitout type:', fitoutType);
        setRequestCategories([]);
        setConvenienceCharge('0.00');
        setDeposit('0.00');
        
        toast({
          title: 'No Rates Found',
          description: `No fitout rates configured for ${fitoutType} type`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching fitout flat rates:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch fitout rates',
        variant: 'destructive',
      });
    }
  };

  const fetchDropdownData = async () => {
    try {
      // Get user_society.id from localStorage
      const selectedUserSocietyId = localStorage.getItem('selectedUserSociety') || '';
      
      // First, get the selected user society to extract id_society for API calls
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
        toast({
          title: 'Error',
          description: 'Society information not found. Please select a society.',
          variant: 'destructive',
        });
        return;
      }
      
      // Fetch categories, towers/blocks, users
      console.log('Fetching dropdown data with id_society:', idSociety);
      
      const [categoriesResponse, blocksResponse] = await Promise.all([
        apiClient.get('/crm/admin/fitout_categories.json'),
        apiClient.get(`/get_society_blocks.json?society_id=${idSociety}`),
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
      
      console.log('Categories Response:', categoriesResponse.data);
      
      // Extract fitout_categories array from the response
      const categoriesArray = categoriesResponse.data?.fitout_categories || [];
      
      console.log('Categories Array Length:', categoriesArray.length);
      
      setCategories(categoriesArray);
      
      // Set user_society.id in formData for user_society_id parameter
      setFormData(prev => ({ ...prev, user_society_id: selectedUserSocietyId }));
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load form data',
        variant: 'destructive',
      });
    }
  };

  const handleTowerChange = async (siteId: string) => {
    setFormData(prev => ({ ...prev, site_id: siteId, unit_id: '', user_id: '' }));
    setFlats([]);
    setUsers([]);
    
    if (siteId) {
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
        
        const response = await apiClient.get(`/get_society_flats.json?society_block_id=${siteId}&society_id=${idSociety}`);
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
    setFormData(prev => ({ ...prev, unit_id: flatId, user_id: '' }));
    setUsers([]);
    
    if (flatId && formData.site_id) {
      try {
        const response = await apiClient.get(`/get_user_society.json?society_block_id=${formData.site_id}&society_flat_id=${flatId}`);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string) => (e: SelectChangeEvent<string>) => {
    const value = e.target.value;
    
    if (name === 'site_id') {
      handleTowerChange(value);
    } else if (name === 'unit_id') {
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
    }]);
  };

  const handleCategorySelect = (index: number, categoryId: string) => {
    const selectedCategory = categories.find((cat: any) => cat.id.toString() === categoryId);
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

  const calculateTotal = () => {
    const baseAmount = parseFloat(formData.amount) || 0;
    const convenience = parseFloat(convenienceCharge) || 0;
    return (baseAmount + convenience).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.site_id || !formData.unit_id || !formData.user_id) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const formDataToSend = new FormData();
      
      // Add main fitout request fields
      formDataToSend.append('fitout_request[user_society_id]', formData.user_society_id);
      formDataToSend.append('fitout_request[site_id]', formData.site_id);
      formDataToSend.append('fitout_request[unit_id]', formData.unit_id);
      
      if (formData.user_id) formDataToSend.append('fitout_request[user_id]', formData.user_id);
      if (formData.fitout_category_id) formDataToSend.append('fitout_request[fitout_category_id]', formData.fitout_category_id);
      if (formData.requested_date) formDataToSend.append('fitout_request[start_date]', formData.requested_date);
      if (formData.expiry_date) formDataToSend.append('fitout_request[expiry_date]', formData.expiry_date);
      if (formData.refund_date) formDataToSend.append('fitout_request[refund_date]', formData.refund_date);
      if (formData.description) formDataToSend.append('fitout_request[description]', formData.description);
      if (formData.contactor_name) formDataToSend.append('fitout_request[contactor_name]', formData.contactor_name);
      if (formData.contactor_no) formDataToSend.append('fitout_request[contactor_no]', formData.contactor_no);
      if (formData.pay_mode) formDataToSend.append('fitout_request[pay_mode]', formData.pay_mode);
      // if (formData.amount) formDataToSend.append('fitout_request[amount]', formData.amount);
      if (formData.status_id) formDataToSend.append('fitout_request[status_id]', formData.status_id);
      if (formData.pms_supplier_id) formDataToSend.append('fitout_request[pms_supplier_id]', formData.pms_supplier_id);
      if (formData.fitout_type) formDataToSend.append('fitout_request[fitout_type]', formData.fitout_type);
      
      // Add convenience charge
      if (convenienceCharge) formDataToSend.append('fitout_request[convenience_charge]', convenienceCharge);
      
      // Add deposit
      if (deposit) formDataToSend.append('fitout_request[deposit]', deposit);
      
      // Add request categories
      requestCategories.forEach((category, index) => {
        if (category.fitout_category_id) {
          formDataToSend.append(`fitout_request[fitout_request_categories_attributes][${index}][fitout_category_id]`, category.fitout_category_id);
        }
        if (category.complaint_status_id) {
          formDataToSend.append(`fitout_request[fitout_request_categories_attributes][${index}][complaint_status_id]`, category.complaint_status_id);
        }
        if (category.amount) {
          formDataToSend.append(`fitout_request[amount]`, category.amount);
        }
        
        // Add documents
        if (category.documents && category.documents.length > 0) {
          category.documents.forEach((file, docIndex) => {
            formDataToSend.append(`fitout_request[fitout_request_categories_attributes][${index}][documents_attributes][${docIndex}][document]`, file);
            formDataToSend.append(`fitout_request[fitout_request_categories_attributes][${index}][documents_attributes][${docIndex}][active]`, 'true');
          });
        }
      });

      const response = await apiClient.post('/crm/admin/fitout_requests.json', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: 'Success',
        description: 'Fitout request created successfully!',
      });

      navigate('/fitout/requests');
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
    navigate('/fitout/requests');
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
                <InputLabel shrink>Tower/Site *</InputLabel>
                <MuiSelect
                  value={formData.site_id}
                  onChange={handleSelectChange('site_id')}
                  label="Tower/Site *"
                  displayEmpty
                  sx={fieldStyles}
                >
                  <MenuItem value="">Select Tower/Site</MenuItem>
                  {Array.isArray(towers) && towers.length > 0 ? (
                    towers.map((tower: any) => (
                      <MenuItem key={tower.id} value={tower.id}>
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
                  value={formData.unit_id}
                  onChange={handleSelectChange('unit_id')}
                  label="Flat *"
                  displayEmpty
                  sx={fieldStyles}
                  disabled={!formData.site_id}
                >
                  <MenuItem value="">Select Flat</MenuItem>
                  {Array.isArray(flats) && flats.length > 0 ? (
                    flats.map((flat: any) => (
                      <MenuItem key={flat.id} value={flat.id}>
                        {flat.flat_no}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>{formData.site_id ? 'No flats available' : 'Select tower first'}</MenuItem>
                  )}
                </MuiSelect>
              </FormControl>

              <FormControl fullWidth variant="outlined">
                <InputLabel shrink>User *</InputLabel>
                <MuiSelect
                  value={formData.user_id}
                  onChange={handleSelectChange('user_id')}
                  label="User *"
                  displayEmpty
                  sx={fieldStyles}
                  disabled={!formData.unit_id}
                >
                  <MenuItem value="">Select User</MenuItem>
                  {Array.isArray(users) && users.length > 0 ? (
                    users.map((userSociety: any) => (
                      <MenuItem key={userSociety.id} value={userSociety.user?.id || userSociety.id_user}>
                        {userSociety.user?.firstname || ''} {userSociety.user?.lastname || ''}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>{formData.unit_id ? 'No users available' : 'Select flat first'}</MenuItem>
                  )}
                </MuiSelect>
              </FormControl>

              <TextField
                label="Requested Date"
                name="requested_date"
                type="date"
                value={formData.requested_date}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
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
                label="Expiry Date"
                name="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />

              <TextField
                label="Refund Date"
                name="refund_date"
                type="date"
                value={formData.refund_date}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
                <TextField
                label="Contractor Name"
                name="contactor_name"
                value={formData.contactor_name}
                onChange={handleInputChange}
                placeholder="Contractor Name"
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />

              <TextField
                label="Contractor Mobile No."
                name="contactor_no"
                value={formData.contactor_no}
                onChange={handleInputChange}
                placeholder="Contractor Mobile No."
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
                inputProps={{ maxLength: 10 }}             
              />
            </div>


            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink>Fitout Type</InputLabel>
                <MuiSelect
                  value={formData.fitout_type}
                  onChange={handleSelectChange('fitout_type')}
                  label="Type"
                  displayEmpty
                  sx={fieldStyles}
                >
                  <MenuItem value="">Select Type</MenuItem>
                  <MenuItem value="Move In">Move In</MenuItem>
                  <MenuItem value="Fitout">Fitout</MenuItem>
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

            {requestCategories.length === 0 && (
              <p className="text-sm text-gray-500">Please select Fitout Type and Flat to auto-populate annexures with amounts.</p>
            )}

            {requestCategories.map((category, index) => {
              const categoryDetails = categories.find(c => c.id.toString() === category.fitout_category_id);
              
              return (
              <div key={index} className="" style={{ backgroundColor: '#FAFAFA' }}>
                {/* <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium" style={{ color: '#C72030' }}>
                    {categoryDetails?.name || `Annexure ${index + 1}`}
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(index)}
                    className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                  >
                    ✕
                  </button>
                </div> */}

                {/* <div className="bg-white p-3 rounded border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="text-base font-semibold">₹{parseFloat(category.amount || '0').toFixed(2)}</span>
                  </div>
                </div> */}

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Images
                  </label>
                  
                
                  {category.documents && category.documents.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-600 mb-2 font-medium">Selected files ({category.documents.length}):</p>
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
                                {fileIndex + 1}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                 
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
                        e.target.value = '';
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#bf213e] file:text-white hover:file:bg-[#bf213e]"
                      id={`file-upload-${index}`}
                    />
                  </div>
                </div> */}
              </div>
            );
            })}

            <div className="border-t pt-4 space-y-3 mt-6">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm">Amount :</span>
                <span className="text-base font-medium">₹{requestCategories.reduce((sum, cat) => sum + (parseFloat(cat.amount) || 0), 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm">Convenience Charge :</span>
                <span className="text-base font-medium">₹{parseFloat(convenienceCharge).toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm">Deposit :</span>
                <span className="text-base font-medium">₹{parseFloat(deposit).toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-t pt-3">
                <span className="text-base font-semibold">Total :</span>
                <span className="text-lg font-bold">₹{(requestCategories.reduce((sum, cat) => sum + (parseFloat(cat.amount) || 0), 0) + parseFloat(convenienceCharge) + parseFloat(deposit)).toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm">Payment Mode :</span>
                <FormControl variant="outlined" size="small" sx={{ width: '200px' }}>
                  <MuiSelect
                    value={formData.pay_mode}
                    onChange={handleSelectChange('pay_mode')}
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