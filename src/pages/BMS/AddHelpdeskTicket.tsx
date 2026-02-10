import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, Paperclip, X, User, Ticket, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { ticketManagementAPI, CategoryResponse, SubCategoryResponse, UserAccountResponse, OccupantUserResponse } from '@/services/ticketManagementAPI';
import { FMUser } from '@/store/slices/fmUserSlice';
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem } from '@mui/material';
import { API_CONFIG, getFullUrl, getAuthenticatedFetchOptions } from '@/config/apiConfig';

interface ComplaintModeResponse {
  id: number;
  name: string;
}

// Update location interfaces to match API responses
interface AreaResponse {
  id: number;
  name: string;
  wing_id: string;
  building_id: string;
  wing?: {
    id: number;
    name: string;
  };
  building?: {
    id: number;
    name: string;
  };
}

interface BuildingResponse {
  id: number;
  name: string;
  site_id: string;
  wings?: Array<{
    id: number;
    name: string;
  }>;
  areas?: Array<{
    id: number;
    name: string;
    wing_id: string;
  }>;
}

interface SocietyBlockResponse {
  id: number;
  name: string;
  description: string;
  status: number | null;
  active: number;
  created_by: number;
}

interface SocietyFlatResponse {
  id: number;
  flat_no: string;
  society_id: number;
  block_no: string;
  is_enable: any;
  approve: boolean;
  approve_by: number | null;
  snag_sheet_file: string | null;
}

interface IssueTypeResponse {
  id: number;
  society_id: number;
  name: string;
  active: number | null;
}

interface WingResponse {
  id: number;
  name: string;
  building_id: string;
  building?: {
    id: number;
    name: string;
  };
}

interface FloorResponse {
  id: number;
  name: string;
  wing_id: number;
  area_id: number;
  building_id: string;
  wing?: {
    id: number;
    name: string;
  };
  area?: {
    id: number;
    name: string;
  };
}

interface RoomResponse {
  id: number;
  name: string;
  floor_id: number;
  wing_id: number;
  area_id: string;
  building_id: string;
}

const PRIORITY_OPTIONS = [
  { value: 'P1', label: 'P1 - Critical' },
  { value: 'P2', label: 'P2 - Very High' },
  { value: 'P3', label: 'P3 - High' },
  { value: 'P4', label: 'P4 - Medium' },
  { value: 'P5', label: 'P5 - Low' }
];

const PROACTIVE_REACTIVE_OPTIONS = [
  { value: 'Proactive', label: 'Proactive' },
  { value: 'Reactive', label: 'Reactive' }
];

const SEVERITY_OPTIONS = [
  { value: 'Major', label: 'Major' },
  { value: 'Minor', label: 'Minor' }
];

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

// Helper functions to get user data from localStorage
const getUserDataFromLocalStorage = () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      console.log('🔍 Raw user data from localStorage:', user); // Debug log
      
      // Try multiple possible department field names with extensive logging
      const possibleDepartmentFields = [
        'department_name',
        'designation', 
        'department',
        'role_name',
        'lock_user_permission?.designation',
        'user_permission?.designation',
        'profile?.designation',
        'profile?.department_name'
      ];
      
      console.log('🔍 Checking department fields:', possibleDepartmentFields);
      
      let department = '';
      // Check each possible field
      if (user.department_name) {
        department = user.department_name;
        console.log('✅ Found department_name:', department);
      } else if (user.designation) {
        department = user.designation;
        console.log('✅ Found designation:', department);
      } else if (user.department) {
        department = user.department;
        console.log('✅ Found department:', department);
      } else if (user.role_name) {
        department = user.role_name;
        console.log('✅ Found role_name:', department);
      } else if (user.lock_user_permission?.designation) {
        department = user.lock_user_permission.designation;
        console.log('✅ Found lock_user_permission.designation:', department);
      } else if (user.user_permission?.designation) {
        department = user.user_permission.designation;
        console.log('✅ Found user_permission.designation:', department);
      } else if (user.profile?.designation) {
        department = user.profile.designation;
        console.log('✅ Found profile.designation:', department);
      } else if (user.profile?.department_name) {
        department = user.profile.department_name;
        console.log('✅ Found profile.department_name:', department);
      } else {
        console.log('❌ No department field found in user data');
        console.log('Available fields:', Object.keys(user));
      }
      
      console.log('🎯 Final extracted department:', department);
      
      return {
        name: `${user.firstname || ''} ${user.lastname || ''}`.trim(),
        department: department,
        contactNumber: user.mobile || user.contactNumber || '',
        site_id: user.site_id,
        id: user.id,
        email: user.email || '',
        company_id: user.company_id || '',
        // Add more fallback fields for department
        designation: user.designation || '',
        role_name: user.role_name || ''
      };
    }
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
  }
  return null;
};

const getFMUsersFromLocalStorage = () => {
  try {
    const fmUsersData = localStorage.getItem('fmUsers');
    if (fmUsersData) {
      return JSON.parse(fmUsersData);
    }
  } catch (error) {
    console.error('Error parsing FM users from localStorage:', error);
  }
  return [];
};

const getOccupantUsersFromLocalStorage = () => {
  try {
    const occupantUsersData = localStorage.getItem('occupantUsers');
    if (occupantUsersData) {
      return JSON.parse(occupantUsersData);
    }
  } catch (error) {
    console.error('Error parsing occupant users from localStorage:', error);
  }
  return [];
};

// Debug function to clear localStorage and force fresh API calls
const clearUserDataCache = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('fmUsers');
  localStorage.removeItem('occupantUsers');
  console.log('User data cache cleared');
};

// Helper function to try getting user profile from additional endpoints
const getUserProfileFromAlternativeAPI = async () => {
  try {
    // Try to get user profile from occupant users API (since the current user might be listed there)
    console.log('🔄 Trying alternative API for user profile...');
    const occupantResponse = await ticketManagementAPI.getOccupantUsers();
    console.log('🔄 Occupant users response:', occupantResponse);
    
    // Try to get current user from localStorage to find their ID
    const currentUserData = localStorage.getItem('user');
    if (currentUserData) {
      const user = JSON.parse(currentUserData);
      console.log('🔄 Looking for current user ID:', user.id);
      
      // Find current user in occupant users list
      const currentUserProfile = occupantResponse.find(u => u.id === user.id);
      if (currentUserProfile && currentUserProfile.lock_user_permission?.designation) {
        console.log('✅ Found user profile in occupant users with department:', currentUserProfile.lock_user_permission.designation);
        return {
          ...user,
          department_name: currentUserProfile.lock_user_permission.designation,
          designation: currentUserProfile.lock_user_permission.designation
        };
      }
    }
    
    // Try FM users API as well
    const fmResponse = await ticketManagementAPI.getEngineers();
    const fmUsers = fmResponse.users || [];
    console.log('🔄 FM users response:', fmUsers);
    
    if (currentUserData) {
      const user = JSON.parse(currentUserData);
      const currentUserFMProfile = fmUsers.find(u => u.id === user.id);
      if (currentUserFMProfile && (currentUserFMProfile.designation || currentUserFMProfile.role_name)) {
        console.log('✅ Found user profile in FM users with department:', currentUserFMProfile.designation || currentUserFMProfile.role_name);
        return {
          ...user,
          department_name: currentUserFMProfile.designation || currentUserFMProfile.role_name,
          designation: currentUserFMProfile.designation,
          role_name: currentUserFMProfile.role_name
        };
      }
    }
    
    console.log('❌ No alternative profile found');
    return null;
  } catch (error) {
    console.error('Error getting user profile from alternative API:', error);
    return null;
  }
};

export const AddTicketDashboard = () => {
  const navigate = useNavigate();

  // Form state
  const [onBehalfOf, setOnBehalfOf] = useState('self');
  const [ticketType, setTicketType] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFieldsReadOnly, setIsFieldsReadOnly] = useState(false);
  const [isGoldenTicket, setIsGoldenTicket] = useState(false);
  const [isFlagged, setIsFlagged] = useState(false);

  // Dropdown data states
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategoryResponse[]>([]);
  const [fmUsers, setFmUsers] = useState<FMUser[]>([]);
  const [occupantUsers, setOccupantUsers] = useState<OccupantUserResponse[]>([]);
  const [userAccount, setUserAccount] = useState<UserAccountResponse | null>(null);
  const [complaintModes, setComplaintModes] = useState<ComplaintModeResponse[]>([]);
  const [areas, setAreas] = useState<AreaResponse[]>([]);
  const [buildings, setBuildings] = useState<BuildingResponse[]>([]);
  const [wings, setWings] = useState<WingResponse[]>([]);
  const [floors, setFloors] = useState<FloorResponse[]>([]);
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [filteredBuildings, setFilteredBuildings] = useState<BuildingResponse[]>([]);
  const [filteredWings, setFilteredWings] = useState<WingResponse[]>([]);
  const [filteredAreas, setFilteredAreas] = useState<AreaResponse[]>([]);
  const [filteredFloors, setFilteredFloors] = useState<FloorResponse[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<RoomResponse[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: number; name: string }[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  
  // New CRM API states
  const [societyBlocks, setSocietyBlocks] = useState<SocietyBlockResponse[]>([]);
  const [societyFlats, setSocietyFlats] = useState<SocietyFlatResponse[]>([]);
  const [issueTypes, setIssueTypes] = useState<IssueTypeResponse[]>([]);
  const [flatUsers, setFlatUsers] = useState<Array<[string, number]>>([]);
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedFlat, setSelectedFlat] = useState('');
  const [selectedIssueType, setSelectedIssueType] = useState('');
  const [selectedIssueRelatedTo, setSelectedIssueRelatedTo] = useState('');

  // Loading states
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [loadingComplaintModes, setLoadingComplaintModes] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingWings, setLoadingWings] = useState(false);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  
  // New CRM API loading states
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingFlats, setLoadingFlats] = useState(false);
  const [loadingIssueTypes, setLoadingIssueTypes] = useState(false);
  const [loadingFlatUsers, setLoadingFlatUsers] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contactNumber: '',
    site: 'Lockated',
    department: '',
    unit: '',
    categoryType: '',
    subCategoryType: '',
    description: '',
    assignedTo: '',
    proactiveReactive: '', // will be set by effect below
    adminPriority: '',
    severity: '',
    referenceNumber: '',
    mode: '',
    vendor: '',
    complaintMode: '',
    // Add location fields
    area: '',
    building: '',
    wing: '',
    floor: '',
    room: ''
  });
  // Set default proactiveReactive based on onBehalfOf selection
  useEffect(() => {
    let defaultValue = '';
    if (onBehalfOf === 'self' || onBehalfOf === 'fm-user') {
      defaultValue = 'Proactive';
    } else if (onBehalfOf === 'occupant-user') {
      defaultValue = 'Reactive';
    }
    setFormData(prev => ({
      ...prev,
      proactiveReactive: defaultValue
    }));
  }, [onBehalfOf]);

  // Fallback API method for user account
  const loadUserAccountFromAPI = useCallback(async () => {
    setLoadingAccount(true);
    try {
      const response = await ticketManagementAPI.getUserAccount();
      console.log('🚀 API response for user account:', response); // Debug log
      console.log('🚀 API response keys:', Object.keys(response)); // Debug log
      console.log('🚀 Department field in API response:', response.department_name); // Debug log
      setUserAccount(response);
      
      // Store in localStorage for future use
      localStorage.setItem('user', JSON.stringify(response));
      console.log('💾 Stored user data in localStorage:', JSON.stringify(response, null, 2));
      
      // Populate form data when account is loaded for self
      if (onBehalfOf === 'self' && response) {
        let department = response.department_name || '';
        console.log('🎯 Department from API response:', department); // Debug log
        
        // If no department found, try alternative APIs
        if (!department) {
          console.log('🔄 No department in main API, trying alternative sources...');
          const alternativeProfile = await getUserProfileFromAlternativeAPI();
          if (alternativeProfile) {
            department = alternativeProfile.department_name || alternativeProfile.designation || alternativeProfile.role_name || '';
            console.log('🎯 Department from alternative API:', department);
            
            // Update stored user data with enhanced profile
            localStorage.setItem('user', JSON.stringify(alternativeProfile));
          }
        }
        
        setFormData(prev => ({
          ...prev,
          name: `${response.firstname} ${response.lastname}`,
          department: department,
          contactNumber: response.mobile || '',
          unit: '',
          site: 'Lockated'
        }));
      }
    } catch (error) {
      console.error('Error loading user account:', error);
      toast.error("Failed to load user account", { description: "Error" });
    } finally {
      setLoadingAccount(false);
    }
  }, [onBehalfOf]);

  // Load user account from localStorage (faster than API call)
  const loadUserAccountFromStorage = useCallback(() => {
    setLoadingAccount(true);
    try {
      const userData = getUserDataFromLocalStorage();
      
      if (userData) {
        setUserAccount({
          firstname: userData.name.split(' ')[0] || '',
          lastname: userData.name.split(' ').slice(1).join(' ') || '',
          department_name: userData.department,
          mobile: userData.contactNumber,
          site_id: userData.site_id,
          id: userData.id,
          email: userData.email || '',
          company_id: userData.company_id || ''
        });
        
        // Populate form data when account is loaded for self
        if (onBehalfOf === 'self') {
          console.log('🎯 Setting form data with userData:', userData); // Debug log
          
          // If no department in localStorage, try to fetch it fresh
          if (!userData.department) {
            console.log('🔄 No department in localStorage, will fetch from API');
            loadUserAccountFromAPI();
            return;
          }
          
          setFormData(prev => ({
            ...prev,
            name: userData.name,
            department: userData.department,
            contactNumber: userData.contactNumber,
            unit: '',
            site: 'Lockated'
          }));
        }
      } else {
        // Fallback to API if localStorage doesn't have user data
        loadUserAccountFromAPI();
      }
    } catch (error) {
      console.error('Error loading user account from localStorage:', error);
      // Fallback to API on error
      loadUserAccountFromAPI();
    } finally {
      setLoadingAccount(false);
    }
  }, [onBehalfOf, loadUserAccountFromAPI]);

  // Load initial data
  useEffect(() => {
    loadSocietyBlocks();
    loadFMUsersFromStorage();
    loadOccupantUsersFromStorage();
    loadComplaintModes();
    loadLocationData();
    loadSubcategories();
    loadIssueTypes(); // Load issue types immediately without waiting for userAccount
    if (onBehalfOf === 'self') {
      loadUserAccountFromStorage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onBehalfOf, loadUserAccountFromStorage]);

  // Load society blocks (towers)
  const loadSocietyBlocks = async () => {
    setLoadingBlocks(true);
    try {
      const url = getFullUrl('/crm/admin/society_blocks.json');
      const options = getAuthenticatedFetchOptions('GET');
      const response = await fetch(url, options);
      if (!response.ok) throw new Error('Failed to fetch society blocks');
      const data = await response.json();
      setSocietyBlocks(data.society_blocks || []);
    } catch (error) {
      console.error('Error loading society blocks:', error);
      toast.error("Failed to load towers", { description: "Error" });
    } finally {
      setLoadingBlocks(false);
    }
  };

  // Load society flats based on selected block
  const loadSocietyFlats = async (blockId: string) => {
    setLoadingFlats(true);
    try {
      const url = getFullUrl(`/crm/admin/society_flats.json?q[society_block_id_eq]=${blockId}`);
      const options = getAuthenticatedFetchOptions('GET');
      const response = await fetch(url, options);
      if (!response.ok) throw new Error('Failed to fetch society flats');
      const data = await response.json();
      setSocietyFlats(data.society_flats || []);
    } catch (error) {
      console.error('Error loading society flats:', error);
      toast.error("Failed to load flats", { description: "Error" });
    } finally {
      setLoadingFlats(false);
    }
  };

  // Load issue types
  const loadIssueTypes = async (societyId?: number) => {
    setLoadingIssueTypes(true);
    try {
      // Get society_id from multiple sources
      let finalSocietyId = societyId;
      
      // Try userAccount.society.id
      if (!finalSocietyId && userAccount?.society?.id) {
        finalSocietyId = userAccount.society.id;
      }
      
      // Try localStorage
      if (!finalSocietyId) {
        const userData = getUserDataFromLocalStorage();
        // First try to get from stored user data's society object
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.society?.id) {
              finalSocietyId = parsedUser.society.id;
            } else if (parsedUser.selected_user_society) {
              finalSocietyId = parsedUser.selected_user_society;
            }
          } catch (e) {
            console.error('Error parsing user from localStorage:', e);
          }
        }
        
        // Fallback to site_id if society id not found
        if (!finalSocietyId && userData?.site_id) {
          finalSocietyId = userData.site_id;
        }
      }
      
      console.log('Loading issue types with society_id:', finalSocietyId);
      
      const url = finalSocietyId 
        ? getFullUrl(`/user/issue_type.json?society_id=${finalSocietyId}`)
        : getFullUrl('/user/issue_type.json');
      const options = getAuthenticatedFetchOptions('GET');
      const response = await fetch(url, options);
      if (!response.ok) throw new Error('Failed to fetch issue types');
      const responseData = await response.json();
      // API returns { status, data: [...] } structure
      const issueTypesData = responseData.data || responseData;
      setIssueTypes(Array.isArray(issueTypesData) ? issueTypesData : []);
    } catch (error) {
      console.error('Error loading issue types:', error);
      toast.error("Failed to load issue types", { description: "Error" });
    } finally {
      setLoadingIssueTypes(false);
    }
  };

  // Load categories based on issue type
  const loadCategories = async (issueTypeId?: string) => {
    setLoadingCategories(true);
    try {
      const url = issueTypeId 
        ? getFullUrl(`/crm/admin/helpdesk_categories.json?q[issue_type_id_eq]=${issueTypeId}`)
        : getFullUrl('/crm/admin/helpdesk_categories.json');
      const options = getAuthenticatedFetchOptions('GET');
      const response = await fetch(url, options);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data.helpdesk_categories || []);
      // Also store issue types if returned
      if (data.issue_types) {
        setIssueTypes(data.issue_types);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error("Failed to load categories", { description: "Error" });
    } finally {
      setLoadingCategories(false);
    }
  };

  // Load flat users based on selected flat
  const loadFlatUsers = async (flatId: string) => {
    setLoadingFlatUsers(true);
    try {
      const url = getFullUrl(`/crm/admin/flat_users.json?q[user_flat_society_flat_id_eq]=${flatId}&q[approve_eq]=true`);
      const options = getAuthenticatedFetchOptions('GET');
      const response = await fetch(url, options);
      if (!response.ok) throw new Error('Failed to fetch flat users');
      const data = await response.json();
      setFlatUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading flat users:', error);
      toast.error("Failed to load flat users", { description: "Error" });
    } finally {
      setLoadingFlatUsers(false);
    }
  };

  // This useEffect is no longer needed since we populate form data directly in loadUserAccountFromStorage
  // Keeping it as fallback for userAccount state changes
  useEffect(() => {
    if (onBehalfOf === 'self' && userAccount) {
      setFormData(prev => ({
        ...prev,
        name: `${userAccount.firstname} ${userAccount.lastname}`,
        department: userAccount.department_name || '',
        contactNumber: userAccount.mobile || '',
        unit: '',
        site: 'Lockated'
      }));
    }
  }, [userAccount, onBehalfOf]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoadingSuppliers(true);
      try {
        const url = getFullUrl('/pms/suppliers.json');
        const options = getAuthenticatedFetchOptions('GET');
        const response = await fetch(url, options);
        if (!response.ok) throw new Error('Failed to fetch suppliers');
        const data = await response.json();
        // Use pms_suppliers and company_name for dropdown
        setSuppliers(
          Array.isArray(data.pms_suppliers)
            ? data.pms_suppliers.map(s => ({
              id: s.id,
              name: s.company_name || `Supplier #${s.id}`
            }))
            : []
        );
      } catch (error) {
        console.error('Error loading suppliers:', error);
        toast.error("Failed to load suppliers", { description: "Error" });
      } finally {
        setLoadingSuppliers(false);
      }
    };
    fetchSuppliers();
  }, []);

  // Fallback API method for occupant users
  const loadOccupantUsersFromAPI = useCallback(async () => {
    try {
      const response = await ticketManagementAPI.getOccupantUsers();
      setOccupantUsers(response);
      // Store in localStorage for future use
      localStorage.setItem('occupantUsers', JSON.stringify(response));
    } catch (error) {
      console.error('Error loading occupant users:', error);
    }
  }, []);

  // Load occupant users from localStorage (faster than API)
  const loadOccupantUsersFromStorage = useCallback(() => {
    try {
      const occupantUsersData = getOccupantUsersFromLocalStorage();
      if (occupantUsersData && occupantUsersData.length > 0) {
        setOccupantUsers(occupantUsersData);
      } else {
        // Fallback to API if localStorage doesn't have data
        loadOccupantUsersFromAPI();
      }
    } catch (error) {
      console.error('Error loading occupant users from localStorage:', error);
      // Fallback to API on error
      loadOccupantUsersFromAPI();
    }
  }, [loadOccupantUsersFromAPI]);

  // Fallback API method for FM users
  const loadFMUsersFromAPI = useCallback(async () => {
    try {
      const response = await ticketManagementAPI.getEngineers();
      const users = response.users || [];
      setFmUsers(users);
      // Store in localStorage for future use
      localStorage.setItem('fmUsers', JSON.stringify(users));
    } catch (error) {
      console.error('Error loading FM users:', error);
    }
  }, []);

  // Load FM users from localStorage (faster than API)
  const loadFMUsersFromStorage = useCallback(() => {
    try {
      const fmUsersData = getFMUsersFromLocalStorage();
      if (fmUsersData && fmUsersData.length > 0) {
        setFmUsers(fmUsersData);
      } else {
        // Fallback to API if localStorage doesn't have data
        loadFMUsersFromAPI();
      }
    } catch (error) {
      console.error('Error loading FM users from localStorage:', error);
      // Fallback to API on error
      loadFMUsersFromAPI();
    }
  }, [loadFMUsersFromAPI]);

  // Reset form when behalf selection changes
  useEffect(() => {
    setSelectedUser('');
    setSelectedUserId(null);
    setIsFieldsReadOnly(false);
    setSelectedBlock('');
    setSelectedFlat('');
    setSelectedIssueType('');
    setSelectedIssueRelatedTo('');
    setTicketType('');
    setSocietyFlats([]);
    setFlatUsers([]);
    setCategories([]);
    setSubcategories([]);

    if (onBehalfOf === 'self') {
      // Load user account for self, form will be populated in loadUserAccountFromStorage
      loadUserAccountFromStorage();
    } else {
      // Clear form data when switching to behalf of others
      setFormData(prev => ({
        ...prev,
        name: '',
        contactNumber: '',
        department: '',
        unit: '',
        categoryType: '',
        subCategoryType: '',
        description: '',
        complaintMode: ''
      }));
    }
  }, [onBehalfOf, loadUserAccountFromStorage]);

  // Load subcategories when category changes
  const loadSubcategories = async (categoryId?: number) => {
    setLoadingSubcategories(true);
    try {
      const url = categoryId
        ? getFullUrl(`/crm/admin/complaints_sub_categories.json?category_type_id=${categoryId}`)
        : getFullUrl('/crm/admin/complaints_sub_categories.json');
      const options = getAuthenticatedFetchOptions('GET');
      const response = await fetch(url, options);
      if (!response.ok) throw new Error('Failed to fetch subcategories');
      const data = await response.json();
      setSubcategories(data.sub_categories || []);
    } catch (error) {
      console.error('Error loading subcategories:', error);
      toast.error("Failed to load subcategories", { description: "Error" });
    } finally {
      setLoadingSubcategories(false);
    }
  };

  // Legacy load FM users function (keeping for backward compatibility)
  const loadFMUsers = async () => {
    try {
      const response = await ticketManagementAPI.getEngineers();
      const users = response.users || [];
      setFmUsers(users);
      // Store in localStorage for future use
      localStorage.setItem('fmUsers', JSON.stringify(users));
    } catch (error) {
      console.error('Error loading FM users:', error);
    }
  };

  // Load complaint modes
  const loadComplaintModes = async () => {
    setLoadingComplaintModes(true);
    try {
      const url = getFullUrl(API_CONFIG.ENDPOINTS.COMPLAINT_MODE);
      const options = getAuthenticatedFetchOptions('GET');

      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Failed to fetch complaint modes: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Complaint modes response:', data);

      // The API returns an array directly, not wrapped in complaint_modes property
      setComplaintModes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading complaint modes:', error);
          toast.error("Failed to load complaint modes", { description: "Error" });
    } finally {
      setLoadingComplaintModes(false);
    }
  };

  // Load areas, buildings, wings, floors, and rooms
  const loadLocationData = useCallback(async () => {
    await Promise.all([
      loadAreas(),
      loadBuildings(),
      loadWings(),
      loadFloors(),
      loadRooms()
    ]);
  }, []);

  const loadAreas = async () => {
    setLoadingAreas(true);
    try {
      const url = getFullUrl('/pms/areas.json');
      const options = getAuthenticatedFetchOptions('GET');
      const response = await fetch(url, options);
      if (!response.ok) throw new Error('Failed to fetch areas');
      const data = await response.json();
      // API returns { areas: [...] }
      setAreas(data.areas || []);
    } catch (error) {
      console.error('Error loading areas:', error);
          toast.error("Failed to load areas", { description: "Error" });
    } finally {
      setLoadingAreas(false);
    }
  };

  const loadBuildings = async (siteId?: string) => {
    setLoadingBuildings(true);
    try {
      // Use site_id in API call if provided, otherwise load all buildings
      const url = siteId
        ? getFullUrl(`/pms/sites/${siteId}/buildings.json`)
        : getFullUrl('/pms/buildings.json');

      const options = getAuthenticatedFetchOptions('GET');
      const response = await fetch(url, options);
      if (!response.ok) throw new Error('Failed to fetch buildings');
      const data = await response.json();
      // API returns { pms_buildings: [...] }
      setBuildings(data.pms_buildings || data || []);
    } catch (error) {
      console.error('Error loading buildings:', error);
          toast.error("Failed to load buildings", { description: "Error" });
    } finally {
      setLoadingBuildings(false);
    }
  };

  const loadWings = async (buildingId?: string) => {
    setLoadingWings(true);
    try {
      // Add building_id as query parameter if provided
      const url = buildingId
        ? getFullUrl(`/pms/wings.json?building_id=${buildingId}`)
        : getFullUrl('/pms/wings.json');

      const options = getAuthenticatedFetchOptions('GET');
      const response = await fetch(url, options);
      if (!response.ok) throw new Error('Failed to fetch wings');
      const data = await response.json();
      // API returns { wings: [...] }
      setWings(data.wings || []);
    } catch (error) {
      console.error('Error loading wings:', error);
          toast.error("Failed to load wings", { description: "Error" });
    } finally {
      setLoadingWings(false);
    }
  };

  const loadFloors = async (wingId?: string) => {
    setLoadingFloors(true);
    try {
      // Add wing_id as query parameter if provided
      const url = wingId
        ? getFullUrl(`/pms/floors.json?wing_id=${wingId}`)
        : getFullUrl('/pms/floors.json');

      const options = getAuthenticatedFetchOptions('GET');
      const response = await fetch(url, options);
      if (!response.ok) throw new Error('Failed to fetch floors');
      const data = await response.json();
      // API returns { floors: [...] }
      setFloors(data.floors || []);
    } catch (error) {
      console.error('Error loading floors:', error);
          toast.error("Failed to load floors", { description: "Error" });
    } finally {
      setLoadingFloors(false);
    }
  };

  const loadRooms = async (floorId?: string) => {
    setLoadingRooms(true);
    try {
      // Add floor_id as query parameter if provided
      const url = floorId
        ? getFullUrl(`/pms/rooms.json?floor_id=${floorId}`)
        : getFullUrl('/pms/rooms.json');

      const options = getAuthenticatedFetchOptions('GET');
      const response = await fetch(url, options);
      if (!response.ok) throw new Error('Failed to fetch rooms');
      const data = await response.json();
      // API returns array directly
      setRooms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading rooms:', error);
          toast.error("Failed to load rooms", { description: "Error" });
    } finally {
      setLoadingRooms(false);
    }
  };

  // Handle user selection and populate details
  const handleUserSelection = (userId: string) => {
    setSelectedUser(userId);
    const userIdNum = parseInt(userId);
    setSelectedUserId(userIdNum);

    if (onBehalfOf === 'fm-user') {
      const selectedFmUser = fmUsers.find(user => user.id === userIdNum);
      if (selectedFmUser) {
        setFormData(prev => ({
          ...prev,
          name: selectedFmUser.full_name,
          contactNumber: selectedFmUser.mobile || '',
          department: selectedFmUser.designation || selectedFmUser.role_name || '',
          unit: `Unit ${selectedFmUser.unit_id || ''}`,
          site: selectedFmUser.company_name || 'Lockated'
        }));
        setIsFieldsReadOnly(true);
      }
    } else if (onBehalfOf === 'occupant-user') {
      const selectedOccupantUser = occupantUsers.find(user => user.id === userIdNum);
      if (selectedOccupantUser) {
        setFormData(prev => ({
          ...prev,
          name: `${selectedOccupantUser.firstname} ${selectedOccupantUser.lastname}`,
          contactNumber: selectedOccupantUser.mobile || '',
          department: selectedOccupantUser.lock_user_permission?.designation || '',
          unit: `Unit ${selectedOccupantUser.unit_id || ''}`,
          site: selectedOccupantUser.company || 'Lockated'
        }));
        setIsFieldsReadOnly(true);
      }
    }
  };

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    setFormData(prev => ({ ...prev, categoryType: categoryId, subCategoryType: '' }));
    setSubcategories([]);
    if (categoryId) {
      loadSubcategories(parseInt(categoryId));
    }
  };

  // Handle block (tower) change
  const handleBlockChange = (blockId: string) => {
    setSelectedBlock(blockId);
    setSelectedFlat('');
    setSelectedUser('');
    setSelectedUserId(null);
    setSocietyFlats([]);
    setFlatUsers([]);
    if (blockId) {
      loadSocietyFlats(blockId);
    }
  };

  // Handle flat change
  const handleFlatChange = (flatId: string) => {
    setSelectedFlat(flatId);
    setSelectedUser('');
    setSelectedUserId(null);
    setFlatUsers([]);
    if (flatId) {
      loadFlatUsers(flatId);
    }
  };

  // Handle issue type change (Related To field)
  const handleIssueTypeChange = (issueTypeId: string) => {
    setSelectedIssueType(issueTypeId);
    setFormData(prev => ({ ...prev, categoryType: '', subCategoryType: '' }));
    setCategories([]);
    setSubcategories([]);
    if (issueTypeId) {
      loadCategories(issueTypeId);
    }
  };

  // Handle issue related to change (independent dropdown)
  const handleIssueRelatedToChange = (value: string) => {
    setSelectedIssueRelatedTo(value);
    // This is independent and doesn't affect categories or other fields
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAttachedFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  // Remove file from attachments
  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle area change with API call to fetch floors (Third level)
  const handleAreaChange = async (areaId: string) => {
    setFormData(prev => ({
      ...prev,
      area: areaId,
      floor: '',
      room: ''
    }));

    // Clear dependent dropdowns
    setFilteredFloors([]);
    setFilteredRooms([]);

    if (areaId) {
      // Call floors API with area_id parameter
      try {
        setLoadingFloors(true);
        const url = getFullUrl(`/pms/floors.json?area_id=${areaId}`);
        const options = getAuthenticatedFetchOptions('GET');
        const response = await fetch(url, options);
        if (response.ok) {
          const data = await response.json();
          setFilteredFloors(data.floors || []);
        }
      } catch (error) {
        console.error('Error loading floors for area:', error);
      } finally {
        setLoadingFloors(false);
      }
    }
  };

  // Handle building change with API call to fetch wings (First level)
  const handleBuildingChange = async (buildingId: string) => {
    setFormData(prev => ({
      ...prev,
      building: buildingId,
      wing: '',
      area: '',
      floor: '',
      room: ''
    }));

    // Clear all dependent dropdowns
    setFilteredWings([]);
    setFilteredAreas([]);
    setFilteredFloors([]);
    setFilteredRooms([]);

    if (buildingId) {
      // Call wings API with building_id parameter
      try {
        setLoadingWings(true);
        const url = getFullUrl(`/pms/wings.json?building_id=${buildingId}`);
        const options = getAuthenticatedFetchOptions('GET');
        const response = await fetch(url, options);
        if (response.ok) {
          const data = await response.json();
          setFilteredWings(data.wings || []);
        }
      } catch (error) {
        console.error('Error loading wings for building:', error);
      } finally {
        setLoadingWings(false);
      }
    }
  };

  // Handle wing change with API call to fetch areas (Second level)
  const handleWingChange = async (wingId: string) => {
    setFormData(prev => ({
      ...prev,
      wing: wingId,
      area: '',
      floor: '',
      room: ''
    }));

    // Clear dependent dropdowns
    setFilteredAreas([]);
    setFilteredFloors([]);
    setFilteredRooms([]);

    if (wingId) {
      // Call areas API with wing_id parameter
      try {
        setLoadingAreas(true);
        const url = getFullUrl(`/pms/areas.json?wing_id=${wingId}`);
        const options = getAuthenticatedFetchOptions('GET');
        const response = await fetch(url, options);
        if (response.ok) {
          const data = await response.json();
          setFilteredAreas(data.areas || []);
        }
      } catch (error) {
        console.error('Error loading areas for wing:', error);
      } finally {
        setLoadingAreas(false);
      }
    }
  };

  // Handle floor change with API call to fetch rooms
  const handleFloorChange = async (floorId: string) => {
    setFormData(prev => ({
      ...prev,
      floor: floorId,
      room: ''
    }));

    // Clear dependent dropdown
    setFilteredRooms([]);

    if (floorId) {
      // Call rooms API with floor_id parameter
      try {
        setLoadingRooms(true);
        const url = getFullUrl(`/pms/rooms.json?floor_id=${floorId}`);
        const options = getAuthenticatedFetchOptions('GET');
        const response = await fetch(url, options);
        if (response.ok) {
          const data = await response.json();
          setFilteredRooms(Array.isArray(data) ? data : (data.rooms || []));
        }
      } catch (error) {
        console.error('Error loading rooms for floor:', error);
      } finally {
        setLoadingRooms(false);
      }
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Validation checks
      if (!ticketType) {
        toast.error("Please select a ticket type", { description: "Validation Error" });
        setIsSubmitting(false);
        return;
      }

      if (!selectedBlock) {
        toast.error("Please select a tower", { description: "Validation Error" });
        setIsSubmitting(false);
        return;
      }

      if (!selectedFlat) {
        toast.error("Please select a flat", { description: "Validation Error" });
        setIsSubmitting(false);
        return;
      }

      if (!selectedIssueType) {
        toast.error("Please select Related To", { description: "Validation Error" });
        setIsSubmitting(false);
        return;
      }

      if (!formData.categoryType) {
        toast.error("Please select a category", { description: "Validation Error" });
        setIsSubmitting(false);
        return;
      }

      if (!formData.description) {
        toast.error("Please enter a title", { description: "Validation Error" });
        setIsSubmitting(false);
        return;
      }

      if (!formData.proactiveReactive) {
        toast.error("Please select type (Proactive/Reactive)", { description: "Validation Error" });
        setIsSubmitting(false);
        return;
      }

      // For user behalf, ensure user is selected
      if (onBehalfOf === 'occupant-user' && !selectedUserId) {
        toast.error("Please select a user", { description: "Validation Error" });
        setIsSubmitting(false);
        return;
      }

      // Get user society ID
      let userSocietyId;
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          userSocietyId = parsedUser.society?.id || parsedUser.selected_user_society || parsedUser.site_id;
        }
      } catch (e) {
        console.error('Error getting user society ID:', e);
      }

      if (!userSocietyId) {
        toast.error("Unable to determine society ID. Please refresh and try again.", { description: "Error" });
        setIsSubmitting(false);
        return;
      }

      // Create FormData for multipart/form-data submission
      const formDataToSubmit = new FormData();

      // Required fields according to API spec
      formDataToSubmit.append('complaint[on_behalf_of]', onBehalfOf === 'self' ? 'admin' : 'user');
      formDataToSubmit.append('complaint[complaint_type]', ticketType);
      formDataToSubmit.append('complaint[society_flat_id]', selectedFlat);
      formDataToSubmit.append('user_soc', userSocietyId.toString());
      formDataToSubmit.append('tower', selectedBlock);
      formDataToSubmit.append('flat', selectedFlat);
      formDataToSubmit.append('complaint[issue_type_id]', selectedIssueType);
      formDataToSubmit.append('complaint[category_type_id]', formData.categoryType);
      formDataToSubmit.append('complaint[heading]', formData.description);
      formDataToSubmit.append('complaint[proactive_reactive]', formData.proactiveReactive);

      // Optional fields
      if (formData.subCategoryType) {
        formDataToSubmit.append('complaint[sub_category_id]', formData.subCategoryType);
      }

      if (selectedIssueRelatedTo) {
        formDataToSubmit.append('complaint[issue_related_to]', selectedIssueRelatedTo);
      }

      // Add user ID for behalf of user
      if (onBehalfOf === 'occupant-user' && selectedUserId) {
        formDataToSubmit.append('user_soc', selectedUserId.toString());
      }

      // Add current user ID for admin
      if (onBehalfOf === 'self' && userAccount?.id) {
        formDataToSubmit.append('complaint[created_by_user_id]', userAccount.id.toString());
      }

      // Add file attachments
      attachedFiles.forEach((file, index) => {
        formDataToSubmit.append(`complaint[attachments][]`, file);
      });

      console.log('Submitting ticket with FormData:');
      for (const pair of formDataToSubmit.entries()) {
        console.log(pair[0], pair[1]);
      }

      // Make API call
      const url = getFullUrl('/crm/admin/complaints.json');
      const options = getAuthenticatedFetchOptions('POST');
      
      // Remove Content-Type header to let browser set it with boundary for multipart/form-data
      delete options.headers['Content-Type'];
      
      const response = await fetch(url, {
        ...options,
        body: formDataToSubmit
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API Error Response:', errorData);
        throw new Error(errorData?.message || `API request failed with status ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Create ticket response:', responseData);

      // Extract ticket ID or number from response
      const ticketId = responseData?.complaint?.id || 
                       responseData?.complaint?.complaint_number || 
                       responseData?.id || 
                       responseData?.complaint_number;

      toast.success(ticketId
        ? `Ticket created successfully - #${ticketId}`
        : "Ticket created successfully!");

      // Navigate back to ticket list
      const currentPath = window.location.pathname;
      if (currentPath.includes("/club-management/helpdesk")) {
        navigate("/club-management/helpdesk");
      } else if (currentPath.includes("tickets")) {
        navigate("/tickets");
      } else {
        navigate("bms/helpdesk");
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create ticket. Please try again.";
      toast.error(errorMessage, { description: "Error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get users for dropdown based on behalf selection
  const getUsersForDropdown = () => {
    if (onBehalfOf === 'occupant-user') {
      return occupantUsers.map(user => ({
        id: user.id.toString(),
        name: `${user.firstname} ${user.lastname}`,
        type: 'occupant'
      }));
    } else if (onBehalfOf === 'fm-user') {
      return fmUsers.map(user => ({
        id: user.id.toString(),
        name: user.full_name,
        type: 'fm'
      }));
    }
    return [];
  };

  const handleGoBack = () => {
    const currentPath = window.location.pathname;

if (currentPath.includes("/club-management/helpdesk")) {
      navigate("/club-management/helpdesk");
    } else if (currentPath.includes("tickets")) {
      navigate("/tickets");
    } else {
      navigate("/bms/helpdesk");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
          <button
            onClick={handleGoBack}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors mr-2"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span>Ticket List</span>
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">Create New Ticket</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">NEW TICKET</h1>
      </div>

      {/* Debug section - remove in production */}
      {/* <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-medium text-yellow-800">Debug Tools</h3>
        <div className="mt-2 space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              clearUserDataCache();
              window.location.reload();
            }}
            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300"
          >
            Clear Cache & Reload
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('Current localStorage user data:', localStorage.getItem('user'));
              console.log('Current formData:', formData);
              console.log('Current userAccount:', userAccount);
            }}
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300"
          >
            Log Debug Info
          </Button>
        </div>
      </div> */}

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
        {/* Section 1: Requestor Details */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                <User size={16} color="#C72030" />
              </span>
              Requestor Details
            </h2>
          </div>
          <div className="p-6 space-y-6">
            {/* On Behalf Of Radio Buttons */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">On Behalf Of:</label>
                <div className="flex items-center gap-6">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="behalf-admin"
                      name="behalfOf"
                      value="self"
                      checked={onBehalfOf === 'self'}
                      onChange={(e) => setOnBehalfOf(e.target.value)}
                      className="w-4 h-4 text-[#C72030] border-gray-300 focus:ring-[#C72030]"
                      style={{ accentColor: '#C72030' }}
                    />
                    <label htmlFor="behalf-admin" className="text-sm font-medium">Admin</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="behalf-user"
                      name="behalfOf"
                      value="occupant-user"
                      checked={onBehalfOf === 'occupant-user'}
                      onChange={(e) => setOnBehalfOf(e.target.value)}
                      className="w-4 h-4 text-[#C72030] border-gray-300 focus:ring-[#C72030]"
                      style={{ accentColor: '#C72030' }}
                    />
                    <label htmlFor="behalf-user" className="text-sm font-medium">User</label>
                  </div>
                </div>
              </div>

              {/* Conditional Fields Based on Radio Button Selection */}
              
              {/* ADMIN FIELDS - Show when Admin is selected */}
              {onBehalfOf === 'self' && (
                <>
                  {/* Row 1: Ticket Type, Select Tower, Select Flat */}
                  <div className="grid grid-cols-3 gap-4">
                    <FormControl
                      fullWidth
                      variant="outlined"
                      required
                      sx={{ '& .MuiInputBase-root': fieldStyles }}
                    >
                      <InputLabel shrink>Ticket Type*</InputLabel>
                      <MuiSelect
                        value={ticketType}
                        onChange={(e) => setTicketType(e.target.value)}
                        label="Ticket Type*"
                        notched
                        displayEmpty
                      >
                        <MenuItem value="">Select Ticket Type*</MenuItem>
                        <MenuItem value="request">Request</MenuItem>
                        <MenuItem value="complaint">Complaint</MenuItem>
                        <MenuItem value="suggestion">Suggestion</MenuItem>
                      </MuiSelect>
                    </FormControl>

                    <FormControl
                      fullWidth
                      variant="outlined"
                      required
                      sx={{ '& .MuiInputBase-root': fieldStyles }}
                    >
                      <InputLabel shrink>Select Tower*</InputLabel>
                      <MuiSelect
                        value={selectedBlock}
                        onChange={(e) => handleBlockChange(e.target.value)}
                        label="Select Tower*"
                        notched
                        displayEmpty
                        disabled={loadingBlocks}
                      >
                        <MenuItem value="">
                          {loadingBlocks ? "Loading..." : "Select Tower*"}
                        </MenuItem>
                        {societyBlocks.map((block) => (
                          <MenuItem key={block.id} value={block.id.toString()}>
                            {block.name}
                          </MenuItem>
                        ))}
                      </MuiSelect>
                    </FormControl>

                    <FormControl
                      fullWidth
                      variant="outlined"
                      required
                      sx={{ '& .MuiInputBase-root': fieldStyles }}
                    >
                      <InputLabel shrink>Select Flat*</InputLabel>
                      <MuiSelect
                        value={selectedFlat}
                        onChange={(e) => handleFlatChange(e.target.value)}
                        label="Select Flat*"
                        notched
                        displayEmpty
                        disabled={loadingFlats || !selectedBlock}
                      >
                        <MenuItem value="">
                          {loadingFlats ? "Loading..." : 
                           !selectedBlock ? "Select Tower First" : "Select Flat*"}
                        </MenuItem>
                        {societyFlats.filter(flat => flat.approve).map((flat) => (
                          <MenuItem key={flat.id} value={flat.id.toString()}>
                            {flat.flat_no}
                          </MenuItem>
                        ))}
                      </MuiSelect>
                    </FormControl>
                  </div>

                  {/* Row 2: Related To, Category, Sub Category */}
                  <div className="grid grid-cols-3 gap-4">
                    <FormControl
                      fullWidth
                      variant="outlined"
                      required
                      sx={{ '& .MuiInputBase-root': fieldStyles }}
                    >
                      <InputLabel shrink>Related To*</InputLabel>
                      <MuiSelect
                        value={selectedIssueType}
                        onChange={(e) => handleIssueTypeChange(e.target.value)}
                        label="Related To*"
                        notched
                        displayEmpty
                        disabled={loadingIssueTypes}
                      >
                        <MenuItem value="">
                          {loadingIssueTypes ? "Loading..." : "Related To*"}
                        </MenuItem>
                        {issueTypes.filter(type => type.active === 1).map((issueType) => (
                          <MenuItem key={issueType.id} value={issueType.id.toString()}>
                            {issueType.name}
                          </MenuItem>
                        ))}
                      </MuiSelect>
                    </FormControl>

                    <FormControl
                      fullWidth
                      variant="outlined"
                      required
                      sx={{ '& .MuiInputBase-root': fieldStyles }}
                    >
                      <InputLabel shrink>Select Category*</InputLabel>
                      <MuiSelect
                        value={formData.categoryType}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        label="Select Category*"
                        notched
                        displayEmpty
                        disabled={loadingCategories || !selectedIssueType}
                      >
                        <MenuItem value="">
                          {loadingCategories ? "Loading..." : 
                           !selectedIssueType ? "Select Issue Type First" : "Select Category*"}
                        </MenuItem>
                        {categories.map((category) => (
                          <MenuItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </MuiSelect>
                    </FormControl>

                    <FormControl
                      fullWidth
                      variant="outlined"
                      required
                      sx={{ '& .MuiInputBase-root': fieldStyles }}
                    >
                      <InputLabel shrink>Select Sub Category*</InputLabel>
                      <MuiSelect
                        value={formData.subCategoryType}
                        onChange={(e) => setFormData({ ...formData, subCategoryType: e.target.value })}
                        label="Select Sub Category*"
                        notched
                        displayEmpty
                        disabled={loadingSubcategories}
                      >
                        <MenuItem value="">
                          {loadingSubcategories ? "Loading..." : "Select Sub Category*"}
                        </MenuItem>
                        {subcategories.map((subcategory) => (
                          <MenuItem key={subcategory.id} value={subcategory.id.toString()}>
                            {subcategory.name}
                          </MenuItem>
                        ))}
                      </MuiSelect>
                    </FormControl>
                  </div>

                  {/* Row 3: Issue Related To, Title, Select Type */}
                  <div className="grid grid-cols-3 gap-4">
                    <FormControl
                      fullWidth
                      variant="outlined"
                      sx={{ '& .MuiInputBase-root': fieldStyles }}
                    >
                      <InputLabel shrink>Select Issue Related To</InputLabel>
                      <MuiSelect
                        value={selectedIssueRelatedTo}
                        onChange={(e) => handleIssueRelatedToChange(e.target.value)}
                        label="Select Issue Related To"
                        notched
                        displayEmpty
                        disabled={loadingIssueTypes}
                      >
                        <MenuItem value="">
                          {loadingIssueTypes ? "Loading..." : "Select Issue Related To"}
                        </MenuItem>
                        <MenuItem value="fm">FM</MenuItem>
                        <MenuItem value="project">Project</MenuItem>
                        {issueTypes.filter(type => type.active === 1).map((issueType) => (
                          <MenuItem key={issueType.id} value={issueType.id.toString()}>
                            {issueType.name}
                          </MenuItem>
                        ))}
                      </MuiSelect>
                    </FormControl>

                    <TextField
                      label="Title*"
                      placeholder="Enter title"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      fullWidth
                      required
                      variant="outlined"
                      slotProps={{
                        inputLabel: {
                          shrink: true,
                        },
                      }}
                      InputProps={{
                        sx: fieldStyles,
                      }}
                    />

                    <FormControl
                      fullWidth
                      variant="outlined"
                      required
                      sx={{ '& .MuiInputBase-root': fieldStyles }}
                    >
                      <InputLabel shrink>Select Type*</InputLabel>
                      <MuiSelect
                        value={formData.proactiveReactive}
                        onChange={(e) => setFormData({ ...formData, proactiveReactive: e.target.value })}
                        label="Select Type*"
                        notched
                        displayEmpty
                      >
                        <MenuItem value="">Select Type*</MenuItem>
                        <MenuItem value="Proactive">Proactive</MenuItem>
                        <MenuItem value="Reactive">Reactive</MenuItem>
                      </MuiSelect>
                    </FormControl>
                  </div>
                </>
              )}

              {/* USER FIELDS - Show when User is selected */}
              {onBehalfOf === 'occupant-user' && (
                <>
                  {/* Row 1: Ticket Type, Select Tower, Select Flat */}
                  <div className="grid grid-cols-3 gap-4">
                    <FormControl
                      fullWidth
                      variant="outlined"
                      required
                      sx={{ '& .MuiInputBase-root': fieldStyles }}
                    >
                      <InputLabel shrink>Ticket Type*</InputLabel>
                      <MuiSelect
                        value={ticketType}
                        onChange={(e) => setTicketType(e.target.value)}
                        label="Ticket Type*"
                        notched
                        displayEmpty
                      >
                        <MenuItem value="">Select Ticket Type*</MenuItem>
                        <MenuItem value="request">Request</MenuItem>
                        <MenuItem value="complaint">Complaint</MenuItem>
                        <MenuItem value="suggestion">Suggestion</MenuItem>
                      </MuiSelect>
                    </FormControl>

                    <FormControl
                      fullWidth
                      variant="outlined"
                      required
                      sx={{ '& .MuiInputBase-root': fieldStyles }}
                    >
                      <InputLabel shrink>Select Tower*</InputLabel>
                      <MuiSelect
                        value={selectedBlock}
                        onChange={(e) => handleBlockChange(e.target.value)}
                        label="Select Tower*"
                        notched
                        displayEmpty
                        disabled={loadingBlocks}
                      >
                        <MenuItem value="">
                          {loadingBlocks ? "Loading..." : "Select Tower*"}
                        </MenuItem>
                        {societyBlocks.map((block) => (
                          <MenuItem key={block.id} value={block.id.toString()}>
                            {block.name}
                          </MenuItem>
                        ))}
                      </MuiSelect>
                    </FormControl>

                    <FormControl
                      fullWidth
                      variant="outlined"
                      required
                      sx={{ '& .MuiInputBase-root': fieldStyles }}
                    >
                      <InputLabel shrink>Select Flat*</InputLabel>
                      <MuiSelect
                        value={selectedFlat}
                        onChange={(e) => handleFlatChange(e.target.value)}
                        label="Select Flat*"
                        notched
                        displayEmpty
                        disabled={loadingFlats || !selectedBlock}
                      >
                        <MenuItem value="">
                          {loadingFlats ? "Loading..." : 
                           !selectedBlock ? "Select Tower First" : "Select Flat*"}
                        </MenuItem>
                        {societyFlats.filter(flat => flat.approve).map((flat) => (
                          <MenuItem key={flat.id} value={flat.id.toString()}>
                            {flat.flat_no}
                          </MenuItem>
                        ))}
                      </MuiSelect>
                    </FormControl>
                  </div>

                  {/* Row 2: Select Users, Related To, Category */}
                  <div className="grid grid-cols-3 gap-4">
                    <FormControl
                      fullWidth
                      variant="outlined"
                      required
                      sx={{ '& .MuiInputBase-root': fieldStyles }}
                    >
                      <InputLabel shrink>Select User*</InputLabel>
                      <MuiSelect
                        value={selectedUser}
                        onChange={(e) => {
                          setSelectedUser(e.target.value);
                          setSelectedUserId(parseInt(e.target.value));
                        }}
                        label="Select User*"
                        notched
                        displayEmpty
                        disabled={loadingFlatUsers || !selectedFlat}
                      >
                        <MenuItem value="">
                          {loadingFlatUsers ? "Loading..." : 
                           !selectedFlat ? "Select Flat First" : "Select User*"}
                        </MenuItem>
                        {flatUsers.map(([name, id]) => (
                          <MenuItem key={id} value={id.toString()}>
                            {name}
                          </MenuItem>
                        ))}
                      </MuiSelect>
                    </FormControl>

                    <FormControl
                      fullWidth
                      variant="outlined"
                      required
                      sx={{ '& .MuiInputBase-root': fieldStyles }}
                    >
                      <InputLabel shrink>Related To*</InputLabel>
                      <MuiSelect
                        value={selectedIssueType}
                        onChange={(e) => handleIssueTypeChange(e.target.value)}
                        label="Related To*"
                        notched
                        displayEmpty
                        disabled={loadingIssueTypes}
                      >
                        <MenuItem value="">
                          {loadingIssueTypes ? "Loading..." : "Related To*"}
                        </MenuItem>
                        {issueTypes.filter(type => type.active === 1).map((issueType) => (
                          <MenuItem key={issueType.id} value={issueType.id.toString()}>
                            {issueType.name}
                          </MenuItem>
                        ))}
                      </MuiSelect>
                    </FormControl>

                    <FormControl
                      fullWidth
                      variant="outlined"
                      required
                      sx={{ '& .MuiInputBase-root': fieldStyles }}
                    >
                      <InputLabel shrink>Select Category*</InputLabel>
                      <MuiSelect
                        value={formData.categoryType}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        label="Select Category*"
                        notched
                        displayEmpty
                        disabled={loadingCategories || !selectedIssueType}
                      >
                        <MenuItem value="">
                          {loadingCategories ? "Loading..." : 
                           !selectedIssueType ? "Select Issue Type First" : "Select Category*"}
                        </MenuItem>
                        {categories.map((category) => (
                          <MenuItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </MuiSelect>
                    </FormControl>
                  </div>
               
                  <div className="grid grid-cols-3 gap-4">
                    <FormControl
                      fullWidth
                      variant="outlined"
                      required
                      sx={{ '& .MuiInputBase-root': fieldStyles }}
                    >
                      <InputLabel shrink>Select Sub Category*</InputLabel>
                      <MuiSelect
                        value={formData.subCategoryType}
                        onChange={(e) => setFormData({ ...formData, subCategoryType: e.target.value })}
                        label="Select Sub Category*"
                        notched
                        displayEmpty
                        disabled={loadingSubcategories}
                      >
                        <MenuItem value="">
                          {loadingSubcategories ? "Loading..." : "Select Sub Category*"}
                        </MenuItem>
                        {subcategories.map((subcategory) => (
                          <MenuItem key={subcategory.id} value={subcategory.id.toString()}>
                            {subcategory.name}
                          </MenuItem>
                        ))}
                      </MuiSelect>
                    </FormControl>

                    <TextField
                      label="Title*"
                      placeholder="Enter title"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      fullWidth
                      required
                      variant="outlined"
                      slotProps={{
                        inputLabel: {
                          shrink: true,
                        },
                      }}
                      InputProps={{
                        sx: fieldStyles,
                      }}
                    />

                    <FormControl
                      fullWidth
                      variant="outlined"
                      required
                      sx={{ '& .MuiInputBase-root': fieldStyles }}
                    >
                      <InputLabel shrink>Select Type*</InputLabel>
                      <MuiSelect
                        value={formData.proactiveReactive}
                        onChange={(e) => setFormData({ ...formData, proactiveReactive: e.target.value })}
                        label="Select Type*"
                        notched
                        displayEmpty
                      >
                        <MenuItem value="">Select Type*</MenuItem>
                        <MenuItem value="Proactive">Proactive</MenuItem>
                        <MenuItem value="Reactive">Reactive</MenuItem>
                      </MuiSelect>
                    </FormControl>
                  </div>
                </>
              )}

              {/* File Upload Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#C72030] transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />
                <label htmlFor="file-upload" className="cursor-pointer text-center">
                
                  <p className="text-sm text-gray-600">Click to upload files</p>
                </label>
                {attachedFiles.length > 0 && (
                  <div className="mt-4 w-full">
                    <p className="text-sm font-medium mb-2">Attached Files:</p>
                    <ul className="space-y-2">
                      {attachedFiles.map((file, index) => (
                        <li key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                          <span>{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pb-8">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white px-12 py-3 text-base font-medium"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>

        {/* Commented out sections for future use */}
        {/* Section 2: Tickets Type - Keeping for reference */}
        {/* <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                <Ticket size={16} color="#C72030" />
              </span>
              Tickets Type
            </h2>
          </div>
          <div className="p-6 space-y-6">
            {/* Radio buttons for ticket type and flags */}
            {/* <div className="flex gap-8">
              <RadioGroup value={ticketType} onValueChange={setTicketType} className="flex gap-8">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="request" id="request" className="text-[#C72030] border-[#C72030]" />
                  <label htmlFor="request" className="text-sm font-medium">Request</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="complaint" id="complaint" className="text-[#C72030] border-[#C72030]" />
                  <label htmlFor="complaint" className="text-sm font-medium">Complaint</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="suggestion" id="suggestion" className="text-[#C72030] border-[#C72030]" />
                  <label htmlFor="suggestion" className="text-sm font-medium">Suggestion</label>
                </div>
              </RadioGroup>
            </div> */}

            {/* <div className="flex gap-8">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="golden"
                  checked={isGoldenTicket}
                  onChange={(e) => setIsGoldenTicket(e.target.checked)}
                  className="w-3 h-3 rounded border-2 border-[#C72030] text-[#C72030] focus:ring-[#C72030]"
                  style={{
                    accentColor: '#C72030'
                  }}
                />
                <label htmlFor="golden" className="text-sm font-medium">Golden Ticket</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="flagged"
                  checked={isFlagged}
                  onChange={(e) => setIsFlagged(e.target.checked)}
                  className="w-3 h-3 rounded border-2 border-[#C72030] text-[#C72030]"
                  style={{
                    accentColor: '#C72030'
                  }}
                />
                <label htmlFor="flagged" className="text-sm font-medium">Is Flagged</label>
              </div>
            </div> */}

            {/* Form fields in exact layout as per image */}
            {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4"> */}
              {/* Row 1: Category Type, Sub Category Type, Assigned To, Mode */}
              {/* <FormControl
                fullWidth
                variant="outlined"
                required
                sx={{ '& .MuiInputBase-root': fieldStyles }}
              >
                <InputLabel shrink>Category Type</InputLabel>
                <MuiSelect
                  value={formData.categoryType}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  label="Category Type"
                  notched
                  displayEmpty
                  disabled={loadingCategories}
                >
                  <MenuItem value="">Select Category Type</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl> */}
            {/* </div> */}

            {/* Description - Full width */}
            {/* <div className="relative w-full">
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder=" "
                className="peer block w-full appearance-none rounded border border-gray-300 bg-white px-3 pt-6 pb-2 text-base text-gray-900 placeholder-transparent 
      focus:outline-none 
      focus:border-[2px] 
      focus:border-[rgb(25,118,210)] 
      resize-vertical"
              />

              <label
                htmlFor="description"
                className="absolute left-3 -top-[10px] bg-white px-1 text-sm text-gray-500 z-[1] transition-all duration-200
      peer-placeholder-shown:top-4
      peer-placeholder-shown:text-base
      peer-placeholder-shown:text-gray-400
      peer-focus:-top-[10px]
      peer-focus:text-sm
      peer-focus:text-[rgb(25,118,210)]"
              >
                Descriptions
              </label>
            </div> */}
          {/* </div>
        </div> */}

        {/* Section 3: Location Details - Keeping for reference */}
        {/* <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                <MapPin size={16} color="#C72030" />
              </span>
              Location Details
            </h2>
          </div>
          <div className="p-6 space-y-6">
            ... location fields ...
          </div>
        </div> */}

        {/* File Attachments Section - Keeping for reference */}
        {/* <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          ... file upload section ...
        </div> */}

        {/* Action Buttons - Keeping for reference */}
        {/* <div className="flex justify-end gap-4">
          ... action buttons ...
        </div> */}
      </form>
    </div>
  );
};