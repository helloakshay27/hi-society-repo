import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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

  // Common field styles
  const commonFieldStyles = "h-10 rounded-md border border-[hsl(var(--analytics-border))] bg-white";

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
    <Dialog open={isOpen} onOpenChange={onClose}>
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
              <div className="space-y-2">
                <Label htmlFor="dateFrom" className="text-sm font-medium text-[hsl(var(--analytics-text))]">
                  Date From
                </Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={commonFieldStyles}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo" className="text-sm font-medium text-[hsl(var(--analytics-text))]">
                  Date To
                </Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={commonFieldStyles}
                />
              </div>
            </div>
          </div>

          {/* Filter Options Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[hsl(var(--analytics-text))]">Filter Options</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Ticket Number */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Ticket Number</Label>
                <Input
                  type="text"
                  placeholder="Select Ticket"
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  className={commonFieldStyles}
                />
              </div>

              {/* Issue Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Issue Type</Label>
                <Select value={issueType} onValueChange={setIssueType}>
                  <SelectTrigger className={commonFieldStyles}>
                    <SelectValue placeholder="Select Issue Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[hsl(var(--analytics-border))] max-h-60">
                    {issueTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Category</Label>
                <Select value={category} onValueChange={(value) => {
                  setCategory(value);
                  setSubCategory(''); // Reset subcategory when category changes
                }}>
                  <SelectTrigger className={commonFieldStyles}>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[hsl(var(--analytics-border))] max-h-60">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assign to */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Assign to</Label>
                <Select value={assignedUser} onValueChange={setAssignedUser}>
                  <SelectTrigger className={commonFieldStyles}>
                    <SelectValue placeholder="Select Assignee" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[hsl(var(--analytics-border))] max-h-60">
                    {users.length === 0 ? (
                      <SelectItem value="no-users" disabled>
                        No users available
                      </SelectItem>
                    ) : (
                      users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Tower */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Tower</Label>
                <Select value={tower} onValueChange={(value) => {
                  setTower(value);
                  setFlat(''); // Reset flat when tower changes
                }}>
                  <SelectTrigger className={commonFieldStyles}>
                    <SelectValue placeholder="Select Tower" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[hsl(var(--analytics-border))] max-h-60">
                    {towers.map((towerItem) => (
                      <SelectItem key={towerItem.id} value={towerItem.id.toString()}>
                        {towerItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Flat */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Flat</Label>
                <Select value={flat} onValueChange={setFlat} disabled={!tower}>
                  <SelectTrigger className={commonFieldStyles}>
                    <SelectValue placeholder="Select Flat" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[hsl(var(--analytics-border))] max-h-60">
                    {flats.map((flatItem) => (
                      <SelectItem key={flatItem.id} value={flatItem.id.toString()}>
                        {flatItem.flat_no}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Complaint Mode */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Complaint Mode</Label>
                <Select value={complaintMode} onValueChange={setComplaintMode}>
                  <SelectTrigger className={commonFieldStyles}>
                    <SelectValue placeholder="Select Complaint Mode" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[hsl(var(--analytics-border))] max-h-60">
                    {complaintModes.map((mode) => (
                      <SelectItem key={mode.id} value={mode.id.toString()}>
                        {mode.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ticket Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Ticket Type</Label>
                <Select value={ticketType} onValueChange={setTicketType}>
                  <SelectTrigger className={commonFieldStyles}>
                    <SelectValue placeholder="Select Ticket Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[hsl(var(--analytics-border))] max-h-60">
                    {ticketTypeOptions.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Issue Related To */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Issue Related To</Label>
                <Select value={issueRelatedTo} onValueChange={setIssueRelatedTo}>
                  <SelectTrigger className={commonFieldStyles}>
                    <SelectValue placeholder="Select Issue Related To" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[hsl(var(--analytics-border))] max-h-60">
                    <SelectItem value="fm">FM</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    {issueTypes.map((type) => (
                      <SelectItem key={`related-${type.id}`} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Date Range</Label>
                <Input
                  type="text"
                  placeholder="Select Date Range"
                  value={dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : ''}
                  readOnly
                  className={commonFieldStyles}
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className={commonFieldStyles}>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[hsl(var(--analytics-border))] max-h-60">
                    {statuses.map((statusItem) => (
                      <SelectItem key={statusItem.id} value={statusItem.id.toString()}>
                        {statusItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className={commonFieldStyles}>
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[hsl(var(--analytics-border))] max-h-60">
                    {priorityOptions.map((priorityItem) => (
                      <SelectItem key={priorityItem.value} value={priorityItem.value}>
                        {priorityItem.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Escalation */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Escalation</Label>
                <Input
                  type="text"
                  placeholder="Escalation"
                  value={escalation}
                  onChange={(e) => setEscalation(e.target.value)}
                  className={commonFieldStyles}
                />
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[hsl(var(--analytics-text))]">Rating</Label>
                <Input
                  type="text"
                  placeholder="Rating"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className={commonFieldStyles}
                />
              </div>
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
              className="bg-[hsl(var(--analytics-primary))] hover:bg-[hsl(var(--analytics-primary))]/90 text-white"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};