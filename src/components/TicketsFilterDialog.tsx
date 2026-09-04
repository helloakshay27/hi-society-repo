import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem } from '@mui/material';
import { fieldStyles, menuProps } from '@/components/ticket-management/fieldStyles';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { getFullUrl, getAuthHeader } from '@/config/apiConfig';
import { 
  ticketManagementAPI, 
  TicketFilters, 
  CategoryOption, 
  SubcategoryOption, 
  DepartmentOption, 
  SiteOption, 
  UnitOption, 
  StatusOption, 
  UserOption 
} from '@/services/ticketManagementAPI';

interface TicketsFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: TicketFilters) => void;
}

const priorityOptions = [
  { value: 'p1', label: 'P1 - Critical' },
  { value: 'p2', label: 'P2 - Very High' },
  { value: 'p3', label: 'P3 - High' },
  { value: 'p4', label: 'P4 - Medium' },
  { value: 'p5', label: 'P5 - Low' }
];

const ticketTypeOptions = [
  { value: 'request', label: 'Request' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'suggestion', label: 'Suggestion' }
];

interface TowerOption {
  id: number;
  name: string;
}

interface FlatOption {
  id: number;
  flat_no: string;
}

interface IssueTypeOption {
  id: number;
  name: string;
}

interface ComplaintModeOption {
  id: number;
  name: string;
}

export const TicketsFilterDialog = ({ isOpen, onClose, onApplyFilters }: TicketsFilterDialogProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Filter state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [issueType, setIssueType] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [assignedUser, setAssignedUser] = useState('');
  const [tower, setTower] = useState('');
  const [flat, setFlat] = useState('');
  const [complaintMode, setComplaintMode] = useState('');
  const [ticketType, setTicketType] = useState('');
  const [issueRelatedTo, setIssueRelatedTo] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [escalation, setEscalation] = useState('');
  const [rating, setRating] = useState('');
  const [department, setDepartment] = useState('');
  const [site, setSite] = useState('');
  const [unit, setUnit] = useState('');
  const [userSearch, setUserSearch] = useState('');
  
  // State to track if filters are already cleared (for double-click behavior)
  const [filtersCleared, setFiltersCleared] = useState(false);

  // Data state
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [statuses, setStatuses] = useState<StatusOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [towers, setTowers] = useState<TowerOption[]>([]);
  const [flats, setFlats] = useState<FlatOption[]>([]);
  const [issueTypes, setIssueTypes] = useState<IssueTypeOption[]>([]);
  const [complaintModes, setComplaintModes] = useState<ComplaintModeOption[]>([]);

  // Load data when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadFilterData();
      setFiltersCleared(false); // Reset the cleared state when dialog opens
    }
  }, [isOpen]);

  // Check if all filters are empty to determine cleared state
  useEffect(() => {
    const allFiltersEmpty = !dateFrom && !dateTo && !ticketNumber && !issueType && 
                           !category && !subCategory && !assignedUser && !tower && 
                           !flat && !complaintMode && !ticketType && !issueRelatedTo &&
                           !department && !site && !unit && !status && 
                           !priority && !escalation && !rating && !userSearch;
    
    if (allFiltersEmpty) {
      setFiltersCleared(true);
    } else {
      setFiltersCleared(false);
    }
  }, [dateFrom, dateTo, ticketNumber, issueType, category, subCategory, assignedUser, tower, flat, complaintMode, ticketType, issueRelatedTo, department, site, unit, status, priority, escalation, rating, userSearch]);

  // Add effect to load subcategories when category changes
  useEffect(() => {
    const loadSubCategories = async () => {
      if (category) {
        try {
          const subcategoriesData = await ticketManagementAPI.getSubCategoriesByCategory(Number(category));
          // Map SubCategoryResponse to SubcategoryOption
          const mappedSubcategories = subcategoriesData.map(sub => ({
            id: sub.id,
            name: sub.name,
            category_id: sub.helpdesk_category_id
          }));
          setSubcategories(mappedSubcategories);
        } catch (error) {
          console.error('Error loading subcategories:', error);
          toast({
            title: "Error",
            description: "Failed to load subcategories.",
            variant: "destructive",
          });
        }
      } else {
        setSubcategories([]);
      }
    };

    loadSubCategories();
  }, [category]);

  // Add effect to load flats when tower changes
  useEffect(() => {
    if (tower) {
      loadFlats(tower);
    } else {
      setFlats([]);
      setFlat('');
    }
  }, [tower]);

  const loadFilterData = async () => {
    try {
      console.log('🔄 Loading filter data...');
      const [
        categoriesData,
        departmentsData,
        sitesData,
        unitsData,
        statusesData,
        usersData
      ] = await Promise.all([
        ticketManagementAPI.getHelpdeskCategories(),
        ticketManagementAPI.getDepartments(),
        ticketManagementAPI.getAllSites(),
        ticketManagementAPI.getUnits(),
        ticketManagementAPI.getComplaintStatuses(),
        ticketManagementAPI.getFMUsers(),
      ]);

      console.log('✅ Filter data loaded successfully:', {
        categories: categoriesData.length,
        departments: departmentsData.length,
        sites: sitesData.length,
        units: unitsData.length,
        statuses: statusesData.length,
        users: usersData.length,
        usersData: usersData.slice(0, 3), // Show first 3 users for debugging
        sitesData: sitesData.slice(0, 3) // Show first 3 sites for debugging
      });

      console.log('🏢 SITES DEBUG:', {
        sitesArray: sitesData,
        sitesLength: sitesData.length,
        firstSite: sitesData[0]
      });

      console.log('👥 USERS DEBUG:', {
        usersArray: usersData,
        usersLength: usersData.length,
        firstUser: usersData[0]
      });

      setCategories(categoriesData);
      setDepartments(departmentsData);
      setSites(sitesData);
      setUnits(unitsData);
      setStatuses(statusesData);
      setUsers(usersData);

      // Load additional data for new filters
      loadTowers();
      loadIssueTypes();
      loadComplaintModes();
    } catch (error) {
      console.error('❌ Error loading filter data:', error);
      console.error('❌ Detailed error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      toast({
        title: "Error",
        description: "Failed to load filter options.",
        variant: "destructive",
      });
    }
  };

  const loadTowers = async () => {
    try {
      const response = await fetch(getFullUrl('/crm/admin/society_blocks.json'), {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setTowers(data.society_blocks || []);
      }
    } catch (error) {
      console.error('Error loading towers:', error);
    }
  };

  const loadFlats = async (towerId: string) => {
    try {
      const response = await fetch(getFullUrl(`/crm/admin/society_flats.json?q[society_block_id_eq]=${towerId}`), {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setFlats(data.society_flats || []);
      }
    } catch (error) {
      console.error('Error loading flats:', error);
    }
  };

  const loadIssueTypes = async () => {
    try {
      const userData = localStorage.getItem('user');
      let societyId = '';
      if (userData) {
        const parsedUser = JSON.parse(userData);
        societyId = parsedUser.society?.id || parsedUser.selected_user_society || parsedUser.site_id;
      }
      
      const url = societyId 
        ? getFullUrl(`/user/issue_type.json?society_id=${societyId}`)
        : getFullUrl('/user/issue_type.json');
      
      const response = await fetch(url, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setIssueTypes(data.data || data || []);
      }
    } catch (error) {
      console.error('Error loading issue types:', error);
    }
  };

  const loadComplaintModes = async () => {
    try {
      const response = await fetch(getFullUrl('/crm/admin/complaint_modes.json'), {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setComplaintModes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading complaint modes:', error);
    }
  };

  // Filter subcategories based on selected category
  const filteredSubcategories = subcategories.filter(sub => 
    !category || sub.category_id === Number(category)
  );

  const handleSubmit = () => {
    // Validate date range - both dates must be selected if one is selected
    if ((dateFrom && !dateTo) || (!dateFrom && dateTo)) {
      toast({
        title: "Validation Error",
        description: "Please select both 'Date From' and 'Date To' for the date range.",
        variant: "destructive",
      });
      return;
    }

    const filters: TicketFilters = {};

    // Build date range in MM/DD/YYYY - MM/DD/YYYY format
    if (dateFrom && dateTo) {
      // Convert from YYYY-MM-DD to MM/DD/YYYY format
      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      };
      
      const formattedDateFrom = formatDate(dateFrom);
      const formattedDateTo = formatDate(dateTo);
      filters.date_range = `${formattedDateFrom} - ${formattedDateTo}`;
    }

    // Add other filters
    if (category) filters.category_type_id_eq = Number(category);
    if (subCategory) filters.sub_category_id_eq = Number(subCategory);
    if (department) filters.dept_id_eq = Number(department);
    if (site) {
      filters.site_id_eq = Number(site);
      console.log('🏢 SITE FILTER APPLIED:', {
        siteValue: site,
        siteId: Number(site),
        filterParameter: 'site_id_eq'
      });
    }
    if (unit) filters.unit_id_eq = Number(unit);
    if (status) filters.issue_status_in = [Number(status)];
    if (priority) filters.priority_eq = priority;
    if (assignedUser) filters.assigned_to_in = [Number(assignedUser)];
    if (userSearch) filters.user_firstname_or_user_lastname_cont = userSearch;

    console.log('Applying filters:', filters);
    onApplyFilters(filters);
    toast({
      title: "Success",
      description: "Filters applied successfully!",
    });
    onClose();
  };

  const handleReset = () => {
    // Check if filters are already cleared
    if (filtersCleared) {
      // Second click - redirect to list page
      toast({
        title: "Redirecting",
        description: "Navigating to tickets list page...",
      });
      onClose(); // Close the dialog first
      navigate('/maintenance/ticket'); // Redirect to list page
      return;
    }

    // First click - clear all filters and show all records
    setDateFrom('');
    setDateTo('');
    setTicketNumber('');
    setIssueType('');
    setCategory('');
    setSubCategory('');
    setAssignedUser('');
    setTower('');
    setFlat('');
    setComplaintMode('');
    setTicketType('');
    setIssueRelatedTo('');
    setDepartment('');
    setSite('');
    setUnit('');
    setStatus('');
    setPriority('');
    setEscalation('');
    setRating('');
    setUserSearch('');
    
    // Apply empty filters to show all records
    onApplyFilters({});
    
    toast({
      title: "Filters Cleared",
      description: "All filters have been cleared.",
    });
  };

  return (
    <Dialog open={isOpen} modal={false} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <DialogTitle className="text-xl font-bold text-[hsl(var(--analytics-text))]">FILTER BY</DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date Range Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[hsl(var(--analytics-text))]">Date Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Date From"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
              <TextField
                label="Date To"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
            </div>
          </div>

          {/* Filter Options Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[hsl(var(--analytics-text))]">Filter Options</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Ticket Number */}
              <TextField
                label="Ticket Number"
                placeholder="Select Ticket"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />

              {/* Issue Type */}
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Issue Type</InputLabel>
                <MuiSelect
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  displayEmpty
                  label="Issue Type"
                  sx={fieldStyles}
                  MenuProps={menuProps}
                >
                  <MenuItem value=""><em>Select Issue Type</em></MenuItem>
                  {issueTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              {/* Category */}
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Category</InputLabel>
                <MuiSelect
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setSubCategory(''); // Reset subcategory when category changes
                  }}
                  displayEmpty
                  label="Category"
                  sx={fieldStyles}
                  MenuProps={menuProps}
                >
                  <MenuItem value=""><em>Select Category</em></MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              {/* Assign to */}
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Assign to</InputLabel>
                <MuiSelect
                  value={assignedUser}
                  onChange={(e) => setAssignedUser(e.target.value)}
                  displayEmpty
                  label="Assign to"
                  sx={fieldStyles}
                  MenuProps={menuProps}
                >
                  <MenuItem value=""><em>Select Assignee</em></MenuItem>
                  {users.length === 0 ? (
                    <MenuItem value="no-users" disabled>
                      No users available
                    </MenuItem>
                  ) : (
                    users.map((user) => (
                      <MenuItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </MenuItem>
                    ))
                  )}
                </MuiSelect>
              </FormControl>

              {/* Tower */}
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Tower</InputLabel>
                <MuiSelect
                  value={tower}
                  onChange={(e) => {
                    setTower(e.target.value);
                    setFlat(''); // Reset flat when tower changes
                  }}
                  displayEmpty
                  label="Tower"
                  sx={fieldStyles}
                  MenuProps={menuProps}
                >
                  <MenuItem value=""><em>Select Tower</em></MenuItem>
                  {towers.map((towerItem) => (
                    <MenuItem key={towerItem.id} value={towerItem.id.toString()}>
                      {towerItem.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              {/* Flat */}
              <FormControl fullWidth variant="outlined" disabled={!tower}>
                <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Flat</InputLabel>
                <MuiSelect
                  value={flat}
                  onChange={(e) => setFlat(e.target.value)}
                  displayEmpty
                  label="Flat"
                  sx={fieldStyles}
                  MenuProps={menuProps}
                >
                  <MenuItem value=""><em>Select Flat</em></MenuItem>
                  {flats.map((flatItem) => (
                    <MenuItem key={flatItem.id} value={flatItem.id.toString()}>
                      {flatItem.flat_no}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              {/* Complaint Mode */}
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Complaint Mode</InputLabel>
                <MuiSelect
                  value={complaintMode}
                  onChange={(e) => setComplaintMode(e.target.value)}
                  displayEmpty
                  label="Complaint Mode"
                  sx={fieldStyles}
                  MenuProps={menuProps}
                >
                  <MenuItem value=""><em>Select Complaint Mode</em></MenuItem>
                  {complaintModes.map((mode) => (
                    <MenuItem key={mode.id} value={mode.id.toString()}>
                      {mode.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              {/* Ticket Type */}
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Ticket Type</InputLabel>
                <MuiSelect
                  value={ticketType}
                  onChange={(e) => setTicketType(e.target.value)}
                  displayEmpty
                  label="Ticket Type"
                  sx={fieldStyles}
                  MenuProps={menuProps}
                >
                  <MenuItem value=""><em>Select Ticket Type</em></MenuItem>
                  {ticketTypeOptions.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              {/* Issue Related To */}
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Issue Related To</InputLabel>
                <MuiSelect
                  value={issueRelatedTo}
                  onChange={(e) => setIssueRelatedTo(e.target.value)}
                  displayEmpty
                  label="Issue Related To"
                  sx={fieldStyles}
                  MenuProps={menuProps}
                >
                  <MenuItem value=""><em>Select Issue Related To</em></MenuItem>
                  <MenuItem value="fm">FM</MenuItem>
                  <MenuItem value="project">Project</MenuItem>
                  {issueTypes.map((type) => (
                    <MenuItem key={`related-${type.id}`} value={type.id.toString()}>
                      {type.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              {/* Date Range */}
              <TextField
                label="Date Range"
                placeholder="Select Date Range"
                value={dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : ''}
                InputProps={{ readOnly: true, sx: fieldStyles }}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />

              {/* Status */}
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Status</InputLabel>
                <MuiSelect
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  displayEmpty
                  label="Status"
                  sx={fieldStyles}
                  MenuProps={menuProps}
                >
                  <MenuItem value=""><em>Select Status</em></MenuItem>
                  {statuses.map((statusItem) => (
                    <MenuItem key={statusItem.id} value={statusItem.id.toString()}>
                      {statusItem.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              {/* Priority */}
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Priority</InputLabel>
                <MuiSelect
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  displayEmpty
                  label="Priority"
                  sx={fieldStyles}
                  MenuProps={menuProps}
                >
                  <MenuItem value=""><em>Select Priority</em></MenuItem>
                  {priorityOptions.map((priorityItem) => (
                    <MenuItem key={priorityItem.value} value={priorityItem.value}>
                      {priorityItem.label}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              {/* Escalation */}
              <TextField
                label="Escalation"
                placeholder="Escalation"
                value={escalation}
                onChange={(e) => setEscalation(e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />

              {/* Rating */}
              <TextField
                label="Rating"
                placeholder="Rating"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="text-[hsl(var(--analytics-text))] border-[hsl(var(--analytics-border))]"
            >
              {filtersCleared ? 'Go to List' : 'Reset'}
            </Button>
            <Button 
              onClick={handleSubmit}
              className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};