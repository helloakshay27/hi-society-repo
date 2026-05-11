import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { getAuthHeader, getFullUrl } from '@/config/apiConfig';
import { toast } from 'sonner';
import { Edit, Trash2, Upload, Plus, X, Search } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { fetchHelpdeskCategories } from '@/store/slices/helpdeskCategoriesSlice';
import { fetchBuildings } from '@/store/slices/buildingsSlice';
import { fetchWings } from '@/store/slices/wingsSlice';
import { fetchFloors } from '@/store/slices/floorsSlice';
import { fetchZones } from '@/store/slices/zonesSlice';
import { fetchRooms } from '@/store/slices/roomsSlice';
import { API_CONFIG, getAuthHeader, getFullUrl } from '@/config/apiConfig';

interface SubCategoryItem {
  id: number;
  issue_type_id: number;
  issue_type: string;
  category_id: number;
  category_type: string;
  sub_category: string;
  helpdesk_text: string;
}

interface IssueType {
  id: number;
  name: string;
}

interface CategoryOption {
  id: number;
  name: string;
}

interface Engineer {
  id: number;
  full_name: string;
}

interface LocationOption {
  id: number;
  name: string;
}

interface EngineerResponse {
  users: Array<{
    id: number;
    full_name: string;
  }>;
}

interface SubCategoriesResponse {
  sub_categories: SubCategoryType[];
  total_count: number;
  page: number;
  per_page: number;
  filters: {
    site_id: number | null;
    category_id: number | null;
    search: string | null;
  };
}

interface BuildingsResponse {
  id: number;
  name: string;
  site_id: string;
  // ... other fields as needed
}

interface WingsResponse {
  wings: Array<{
    id: number;
    name: string;
    // ... other fields
  }>;
}

interface FloorsResponse {
  floors: Array<{
    id: number;
    name: string;
    // ... other fields
  }>;
}

export const SubCategoryTab: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Redux selectors
  const { data: helpdeskCategoriesData, loading: categoriesLoading } = useAppSelector(
    (state) => state.helpdeskCategories
  );
  const { data: buildingsData, loading: buildingsLoading } = useAppSelector(
    (state) => state.buildings
  );
  const { data: wingsData, loading: wingsLoading } = useAppSelector(
    (state) => state.wings
  );
  const { data: floorsData, loading: floorsLoading } = useAppSelector(
    (state) => state.floors
  );
  const { data: zonesData, loading: zonesLoading } = useAppSelector(
    (state) => state.zones
  );
  const { data: roomsData, loading: roomsLoading } = useAppSelector(
    (state) => state.rooms
  );

  const [subCategories, setSubCategories] = useState<SubCategoryType[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    total_count: 0,
    per_page: 20,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategoryType | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>(['']);
  const [selectedEngineers, setSelectedEngineers] = useState<number[]>([]);
  const [selectedBuildings, setSelectedBuildings] = useState<number[]>([]);
  const [selectedWings, setSelectedWings] = useState<number[]>([]);
  const [selectedZones, setSelectedZones] = useState<number[]>([]);
  const [selectedFloors, setSelectedFloors] = useState<number[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<number[]>([]);
  
  // Dropdown open/close states
  const [engineersDropdownOpen, setEngineersDropdownOpen] = useState(false);
  const [buildingsDropdownOpen, setBuildingsDropdownOpen] = useState(false);
  const [wingsDropdownOpen, setWingsDropdownOpen] = useState(false);
  const [floorsDropdownOpen, setFloorsDropdownOpen] = useState(false);
  const [zonesDropdownOpen, setZonesDropdownOpen] = useState(false);
  const [roomsDropdownOpen, setRoomsDropdownOpen] = useState(false);

  // Create form state
  const [selectedIssueType, setSelectedIssueType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subCategoryTags, setSubCategoryTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [helpdeskText, setHelpdeskText] = useState('');

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editIssueType, setEditIssueType] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSubCategoryName, setEditSubCategoryName] = useState('');
  const [editHelpdeskText, setEditHelpdeskText] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Fetch categories filtered by issue type
  const fetchCategoriesByIssueType = useCallback(async (issueTypeId: string) => {
    if (!issueTypeId) {
      setCategories([]);
      return;
    }
    setLoadingCategories(true);
    try {
      const res = await fetch(
        getFullUrl(`/dropdown/categories.json?q[issue_type_id_eq]=${issueTypeId}`),
        { headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' } },
      );
      if (res.ok) {
        const data = await res.json();
        const cats = Array.isArray(data) ? data : (data.categories || []);
        setCategories(cats.map((cat: { id: number; name: string }) => ({ id: cat.id, name: cat.name })));
      } else {
        toast.error('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    console.log('SubCategoryTab mounted, fetching data...');
    dispatch(fetchHelpdeskCategories());
    dispatch(fetchBuildings());
    dispatch(fetchWings());
    dispatch(fetchFloors());
    dispatch(fetchZones());
    dispatch(fetchRooms());
    fetchData(1, debouncedSearchTerm);
  }, [dispatch, debouncedSearchTerm]);

  const fetchData = async (page: number = 1, search: string = '') => {
    console.log('Starting fetchData...', { page, search });
    setIsLoading(true);
    try {
      const [
        engineersResponse,
        subCategoriesResponse
      ] = await Promise.all([
        ticketManagementAPI.getEngineers(),
        ticketManagementAPI.getSubCategories(page, 20, search)
      ]);

      // Process engineers - extract from users array
      const formattedEngineers = engineersResponse?.users?.map(user => ({
        id: user.id,
        full_name: user.full_name
      })) || [];
      setEngineers(formattedEngineers);

      // Process sub-categories
      if (subCategoriesResponse) {
        console.log('SubCategories API Response:', subCategoriesResponse);
        setSubCategories(subCategoriesResponse.sub_categories || []);
        const paginationData = {
          page: subCategoriesResponse.page || 1,
          total_count: subCategoriesResponse.total_count || 0,
          per_page: subCategoriesResponse.per_page || 20,
        };
        console.log('Setting pagination data:', paginationData);
        setPagination(paginationData);
      }

    } catch (error) {
      console.error('Error fetching sub-categories:', error);
      toast.error('Failed to fetch sub-categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      const issueTypesRes = await fetch(getFullUrl('/user/issue_type.json'), {
        headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' },
      });

      if (issueTypesRes.ok) {
        const data = await issueTypesRes.json();
        setIssueTypes(
          (data.data || []).map((it: { id: number; name: string }) => ({
            id: it.id,
            name: it.name,
          }))
        );
      } else {
        toast.error('Failed to fetch issue types');
      }
    } catch (error) {
      console.error('Error fetching issue types:', error);
      toast.error('Failed to fetch issue types');
    }
  }, []);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    fetchSubCategories(page);
  };

  useEffect(() => {
    fetchAllData();
    fetchSubCategories(1);
  }, [fetchAllData, fetchSubCategories]);

  // Tag input helpers
  const addTag = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed && !subCategoryTags.includes(trimmed)) {
      setSubCategoryTags((prev) => [...prev, trimmed]);
    }
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && tagInput === '' && subCategoryTags.length > 0) {
      setSubCategoryTags((prev) => prev.slice(0, -1));
    }
  };

  // Handle create submit
  const handleCreateSubmit = async () => {
    if (!selectedIssueType) {
      toast.error('Please select issue type');
      return;
    }
    if (!selectedCategory) {
      toast.error('Please select category');
      return;
    }
    // flush any unconfirmed tag still in the input
    const finalTags = tagInput.trim()
      ? [...subCategoryTags, tagInput.trim()]
      : subCategoryTags;
    if (finalTags.length === 0) {
      toast.error('Please enter at least one sub-category name');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        helpdesk_sub_category: {
          helpdesk_category_id: Number(selectedCategory),
          issue_type_id: Number(selectedIssueType),
          ...(helpdeskText.trim() ? { helpdesk_text: helpdeskText.trim() } : {}),
        },
        sub_category_tags: [finalTags.join(',')],
      };

      await ticketManagementAPI.createSubCategory(subCategoryData);
      toast.success('Sub-category created successfully!');
      form.reset();
      setTags(['']);
      setSelectedEngineers([]);
      setSelectedBuildings([]);
      setSelectedWings([]);
      setSelectedZones([]);
      setSelectedFloors([]);
      setSelectedRooms([]);
      setIconFile(null);
      fetchData(currentPage, searchTerm);
    } catch (error) {
      console.error('Error creating sub-category:', error);
      toast.error('Failed to create sub-category');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (subCategory: SubCategoryItem) => {
    const issueTypeId = subCategory.issue_type_id?.toString() || '';
    setEditingSubCategory(subCategory);
    setEditIssueType(issueTypeId);
    setEditCategory(subCategory.category_id?.toString() || '');
    setEditSubCategoryName(subCategory.sub_category || '');
    setEditHelpdeskText(subCategory.helpdesk_text || '');
    if (issueTypeId) fetchCategoriesByIssueType(issueTypeId);
    setIsEditModalOpen(true);
  };

  // Handle edit submit
  const handleEditSubmit = async () => {
    if (!editingSubCategory) return;

    if (!editIssueType) {
      toast.error('Please select issue type');
      return;
    }
    if (!editCategory) {
      toast.error('Please select category');
      return;
    }
    if (!editSubCategoryName.trim()) {
      toast.error('Please enter sub-category name');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('id', editingSubCategory.id.toString());
      formData.append('name', editSubCategoryName.trim());
      formData.append('issue_type_id', editIssueType);
      formData.append('helpdesk_category_id', editCategory);
      formData.append('active', '1');

      if (editHelpdeskText.trim()) {
        formData.append('helpdesk_text', editHelpdeskText.trim());
      }

      const response = await fetch(
        getFullUrl('/crm/admin/modify_helpdesk_sub_category.json'),
        {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeader(),
          },
          body: formData,
        }
      );

      if (response.ok) {
        toast.success('Sub-category updated successfully!');
        setIsEditModalOpen(false);
        setEditingSubCategory(null);
        fetchSubCategories(currentPage);
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || 'Failed to update sub-category');
      }
    } catch (error) {
      console.error('Error updating sub-category:', error);
      toast.error('Failed to update sub-category');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (subCategory: SubCategoryItem) => {
    if (!confirm('Are you sure you want to delete this sub-category?')) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('id', subCategory.id.toString());
      formData.append('name', subCategory.sub_category || '');
      formData.append('issue_type_id', subCategory.issue_type_id?.toString() || '');
      formData.append('helpdesk_category_id', subCategory.category_id?.toString() || '');
      formData.append('active', '0');

      const response = await fetch(
        getFullUrl('/crm/admin/modify_helpdesk_sub_category.json'),
        {
          method: 'POST',
          headers: { 'Authorization': getAuthHeader() },
          body: formData,
        }
      );

      if (response.ok) {
        setSubCategories(subCategories.filter(sc => sc.id !== subCategory.id));
        toast.success('Sub-category deleted successfully!');
        fetchSubCategories(currentPage);
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || 'Failed to delete sub-category');
      }
    } catch (error) {
      console.error('Error deleting sub-category:', error);
      toast.error('Failed to delete sub-category');
    }
  };

  // Table columns
  const columns = [
    { key: 'srno', label: 'S.No.', sortable: false },
    { key: 'issue_type', label: 'Issue Type', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'name', label: 'Sub Category', sortable: true },
    { key: 'helpdesk_text', label: 'Text', sortable: false },
  ];

  const renderCell = (item: SubCategoryItem, columnKey: string) => {
    const index = subCategories.findIndex(sc => sc.id === item.id);

    switch (columnKey) {
      case 'srno':
        return index + 1;
      case 'issue_type':
        return item.issue_type || '--';
      case 'category':
        return item.category_type || '--';
      case 'name':
        return item.sub_category || '--';
      case 'helpdesk_text':
        return item.helpdesk_text || '--';
      default:
        return '--';
    }
  };

  const renderActions = (item: SubCategoryItem) => (
    <div className="flex gap-2">
      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  const handleDelete = async (subCategory: SubCategoryType) => {
    if (!confirm('Are you sure you want to delete this sub-category?')) {
      return;
    }
    
    try {
      await ticketManagementAPI.deleteSubCategory(subCategory.id);
      setSubCategories(subCategories.filter(sub => sub.id !== subCategory.id));
      toast.success('Sub-category deleted successfully!');
      fetchData(currentPage, searchTerm);
    } catch (error) {
      console.error('Error deleting sub-category:', error);
      toast.error('Failed to delete sub-category');
    }
  };

  const handlePageChange = (page: number) => {
    const totalPages = Math.ceil(pagination.total_count / pagination.per_page);
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    fetchData(page, debouncedSearchTerm);
  };

  // Smart pagination rendering function (similar to ScheduledTaskDashboard)
  const renderPaginationItems = () => {
    const items = [];
    const totalPages = Math.ceil(pagination.total_count / pagination.per_page);
    const showEllipsis = totalPages > 7;

    if (showEllipsis) {
      // Always show first page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            className="cursor-pointer"
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Show pages 2, 3, 4 if currentPage is 1, 2, or 3
      if (currentPage <= 3) {
        for (let i = 2; i <= 4 && i < totalPages; i++) {
          items.push(
            <PaginationItem key={i}>
              <PaginationLink
                className="cursor-pointer"
                onClick={() => handlePageChange(i)}
                isActive={currentPage === i}
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
        if (totalPages > 5) {
          items.push(
            <PaginationItem key="ellipsis1">
              <PaginationEllipsis />
            </PaginationItem>
          );
        }
      } else if (currentPage >= totalPages - 2) {
        // Show ellipsis before last 4 pages
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
        for (let i = totalPages - 3; i < totalPages; i++) {
          if (i > 1) {
            items.push(
              <PaginationItem key={i}>
                <PaginationLink
                  className="cursor-pointer"
                  onClick={() => handlePageChange(i)}
                  isActive={currentPage === i}
                >
                  {i}
                </PaginationLink>
              </PaginationItem>
            );
          }
        }
      } else {
        // Show ellipsis, currentPage-1, currentPage, currentPage+1, ellipsis
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          items.push(
            <PaginationItem key={i}>
              <PaginationLink
                className="cursor-pointer"
                onClick={() => handlePageChange(i)}
                isActive={currentPage === i}
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Always show last page if more than 1 page
      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              className="cursor-pointer"
              onClick={() => handlePageChange(totalPages)}
              isActive={currentPage === totalPages}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Show all pages if less than or equal to 7
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              className="cursor-pointer"
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Add Sub-Category Dialog */}
      <Dialog open={addDialogOpen} modal={false} onOpenChange={(open) => {
        setAddDialogOpen(open);
        if (!open) {
          setSelectedIssueType('');
          setSelectedCategory('');
          setSubCategoryTags([]);
          setTagInput('');
          setHelpdeskText('');
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Sub-Category</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1, '&.Mui-focused': { color: '#C72030' } }}>
                Select Issue Type <span style={{ color: '#ef4444' }}>*</span>
              </InputLabel>
              <MuiSelect
                label="Select Issue Type *"
                displayEmpty
                value={selectedIssueType}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedIssueType(val);
                  setSelectedCategory('');
                  fetchCategoriesByIssueType(val);
                }}
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value="" disabled><em>Select Issue Type</em></MenuItem>
                {issueTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id.toString()}>{type.name}</MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1, '&.Mui-focused': { color: '#C72030' } }}>
                Select Category <span style={{ color: '#ef4444' }}>*</span>
              </InputLabel>
              <MuiSelect
                label="Select Category *"
                displayEmpty
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={!selectedIssueType || loadingCategories}
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value="" disabled>
                  <em>{loadingCategories ? 'Loading...' : !selectedIssueType ? 'Select issue type first' : 'Select Category'}</em>
                </MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id.toString()}>{cat.name}</MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
            {/* Tag input for multiple sub-category names */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sub-category Names <span className="text-red-500">*</span>
                <span className="text-xs text-gray-400 ml-2">Press Enter or comma to add</span>
              </label>
              <div
                className="flex flex-wrap gap-1.5 min-h-[42px] border border-gray-300 rounded px-2 py-1.5 focus-within:ring-1 focus-within:ring-[#C72030] focus-within:border-[#C72030] cursor-text"
                onClick={() => document.getElementById('tag-input-create')?.focus()}
              >
                {subCategoryTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-red-50 text-[#C72030] border border-red-200 rounded px-2 py-0.5 text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSubCategoryTags((prev) => prev.filter((t) => t !== tag)); }}
                      className="hover:text-red-800 font-bold leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  id="tag-input-create"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
                  placeholder={subCategoryTags.length === 0 ? 'e.g. Leakage, Blockage, Pipe Burst' : ''}
                  className="flex-1 min-w-[120px] outline-none text-sm bg-transparent py-0.5"
                />
              </div>
            </div>
            <TextField
              label="Text"
              placeholder="Enter text"
              value={helpdeskText}
              onChange={(e) => setHelpdeskText(e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={isSubmitting}
              className="bg-[#C72030] hover:bg-[#a01828] text-white"
            >
              {isSubmitting ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <EnhancedTable
          data={subCategories}
          columns={columns}
          renderCell={renderCell}
          renderActions={renderActions}
          storageKey="sub-categories-table"
          enableSearch={true}
          searchPlaceholder="Search sub-categories..."
          leftActions={
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="bg-[#C72030] hover:bg-[#a01828] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          }
        />
        {/* Pagination */}
        {subCategories.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Showing {totalCount > 0 ? (currentPage - 1) * perPage + 1 : 0}–{Math.min(currentPage * perPage, totalCount || subCategories.length)} of {totalCount || subCategories.length} sub-categories
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                      >
                        «
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Engineer Assignment */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Engineer Assignment <span className="text-red-500">*</span></h3>
                <Select
                  open={engineersDropdownOpen}
                  onOpenChange={setEngineersDropdownOpen}
                  onValueChange={(value) => {
                    const engineerId = parseInt(value);
                    if (selectedEngineers.includes(engineerId)) {
                      setSelectedEngineers(selectedEngineers.filter(id => id !== engineerId));
                    } else {
                      setSelectedEngineers([...selectedEngineers, engineerId]);
                    }
                    // Close dropdown after selection
                    setTimeout(() => setEngineersDropdownOpen(false), 200);
                  }}
                >
                  <SelectTrigger className="w-full relative">
                    <SelectValue placeholder={
                      selectedEngineers.length === 0 
                        ? "Select engineers" 
                        : `${selectedEngineers.length} engineer(s) selected`
                    } />
                  </SelectTrigger>
                  <SelectContent 
                    position="popper" 
                    side="bottom" 
                    align="start" 
                    sideOffset={8}
                    avoidCollisions={false}
                    className="z-[9999] min-w-[var(--radix-select-trigger-width)] max-h-[200px] overflow-y-auto"
                  >
                    {engineers.length === 0 ? (
                      <SelectItem value="no-engineers" disabled>
                        Loading engineers...
                      </SelectItem>
                    ) : (
                      engineers.map((engineer) => (
                        <SelectItem key={engineer.id} value={engineer.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{engineer.full_name}</span>
                            {selectedEngineers.includes(engineer.id) && (
                              <span className="ml-2 text-primary">✓</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                
                {/* Show selected engineers */}
                {selectedEngineers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedEngineers.map((engineerId) => {
                      const engineer = engineers.find(e => e.id === engineerId);
                      return engineer ? (
                        <div key={engineerId} className="flex items-center gap-1 bg-indigo-100 text-indigo-900 px-3 py-1 rounded-full text-sm font-medium">
                          {engineer.full_name}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-indigo-600"
                            onClick={() => setSelectedEngineers(selectedEngineers.filter(id => id !== engineerId))}
                          />
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Location Configuration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Location Configuration</h3>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        form.setValue('building', true);
                        form.setValue('wing', true);
                        form.setValue('floor', true);
                        form.setValue('zone', true);
                        form.setValue('room', true);
                      }}
                    >
                      Select All
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        form.setValue('building', false);
                        form.setValue('wing', false);
                        form.setValue('floor', false);
                        form.setValue('zone', false);
                        form.setValue('room', false);
                        setSelectedBuildings([]);
                        setSelectedWings([]);
                        setSelectedFloors([]);
                        setSelectedZones([]);
                        setSelectedRooms([]);
                      }}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
                
                {/* Location Enable/Disable Checkboxes */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="building"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Building</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="wing"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Wing</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="floor"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Floor</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zone"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Zone</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="room"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Room</FormLabel>
                      </FormItem>
                    )}
                  />

                  {/* <FormField
                    control={form.control}
                    name="customerEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Customer Enabled</FormLabel>
                      </FormItem>
                    )}
                  /> */}
                </div>
                
                {/* Buildings Dropdown - Only show when building checkbox is checked */}
                {form.watch('building') && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Buildings</label>
                    <div className="border rounded-md bg-white">
                      <div className="p-2 border-b space-y-1">
                        <button
                          type="button"
                          onClick={() => setSelectedBuildings(availableBuildings.map(b => b.id))}
                          className="w-full flex items-center gap-2 px-2 py-2 hover:bg-blue-50 rounded text-sm font-medium text-blue-600"
                        >
                          <Checkbox checked={selectedBuildings.length === availableBuildings.length} />
                          <span>Select All</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedBuildings([])}
                          className="w-full flex items-center gap-2 px-2 py-2 hover:bg-red-50 rounded text-sm font-medium text-red-600"
                        >
                          <Checkbox checked={false} />
                          <span>Clear All</span>
                        </button>
                      </div>
                      <div className="max-h-[250px] overflow-y-auto p-1">
                        {availableBuildings.length === 0 ? (
                          <div className="px-2 py-2 text-sm text-gray-500">No buildings available</div>
                        ) : (
                          availableBuildings.map((building) => (
                            <button
                              key={building.id}
                              type="button"
                              onClick={() => {
                                if (selectedBuildings.includes(building.id)) {
                                  setSelectedBuildings(selectedBuildings.filter(id => id !== building.id));
                                } else {
                                  setSelectedBuildings([...selectedBuildings, building.id]);
                                }
                              }}
                              className="w-full flex items-center gap-2 px-2 py-2 hover:bg-gray-100 rounded text-sm"
                            >
                              <Checkbox checked={selectedBuildings.includes(building.id)} />
                              <span>{building.name}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                    
                    {/* Show selected buildings */}
                    {selectedBuildings.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedBuildings.map((buildingId) => {
                          const building = availableBuildings.find(b => b.id === buildingId);
                          return building ? (
                            <div key={buildingId} className="flex items-center gap-1 bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-sm font-medium">
                              {building.name}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-blue-600"
                                onClick={() => setSelectedBuildings(selectedBuildings.filter(id => id !== buildingId))}
                              />
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Wings Dropdown - Only show when wing checkbox is checked */}
                {form.watch('wing') && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Wings</label>
                    <div className="border rounded-md bg-white">
                      <div className="p-2 border-b space-y-1">
                        <button
                          type="button"
                          onClick={() => setSelectedWings(availableWings.map(w => w.id))}
                          className="w-full flex items-center gap-2 px-2 py-2 hover:bg-blue-50 rounded text-sm font-medium text-blue-600"
                        >
                          <Checkbox checked={selectedWings.length === availableWings.length} />
                          <span>Select All</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedWings([])}
                          className="w-full flex items-center gap-2 px-2 py-2 hover:bg-red-50 rounded text-sm font-medium text-red-600"
                        >
                          <Checkbox checked={false} />
                          <span>Clear All</span>
                        </button>
                      </div>
                      <div className="max-h-[250px] overflow-y-auto p-1">
                        {availableWings.length === 0 ? (
                          <div className="px-2 py-2 text-sm text-gray-500">No wings available</div>
                        ) : (
                          availableWings.map((wing) => (
                            <button
                              key={wing.id}
                              type="button"
                              onClick={() => {
                                if (selectedWings.includes(wing.id)) {
                                  setSelectedWings(selectedWings.filter(id => id !== wing.id));
                                } else {
                                  setSelectedWings([...selectedWings, wing.id]);
                                }
                              }}
                              className="w-full flex items-center gap-2 px-2 py-2 hover:bg-gray-100 rounded text-sm"
                            >
                              <Checkbox checked={selectedWings.includes(wing.id)} />
                              <span>{wing.name}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                    
                    {/* Show selected wings */}
                    {selectedWings.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedWings.map((wingId) => {
                          const wing = availableWings.find(w => w.id === wingId);
                          return wing ? (
                            <div key={wingId} className="flex items-center gap-1 bg-green-100 text-green-900 px-3 py-1 rounded-full text-sm font-medium">
                              {wing.name}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-green-600"
                                onClick={() => setSelectedWings(selectedWings.filter(id => id !== wingId))}
                              />
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Floors Dropdown - Only show when floor checkbox is checked */}
                {form.watch('floor') && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Floors</label>
                    <div className="border rounded-md bg-white">
                      <div className="p-2 border-b space-y-1">
                        <button
                          type="button"
                          onClick={() => setSelectedFloors(availableFloors.map(f => f.id))}
                          className="w-full flex items-center gap-2 px-2 py-2 hover:bg-blue-50 rounded text-sm font-medium text-blue-600"
                        >
                          <Checkbox checked={selectedFloors.length === availableFloors.length} />
                          <span>Select All</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedFloors([])}
                          className="w-full flex items-center gap-2 px-2 py-2 hover:bg-red-50 rounded text-sm font-medium text-red-600"
                        >
                          <Checkbox checked={false} />
                          <span>Clear All</span>
                        </button>
                      </div>
                      <div className="max-h-[250px] overflow-y-auto p-1">
                        {availableFloors.length === 0 ? (
                          <div className="px-2 py-2 text-sm text-gray-500">No floors available</div>
                        ) : (
                          availableFloors.map((floor) => (
                            <button
                              key={floor.id}
                              type="button"
                              onClick={() => {
                                if (selectedFloors.includes(floor.id)) {
                                  setSelectedFloors(selectedFloors.filter(id => id !== floor.id));
                                } else {
                                  setSelectedFloors([...selectedFloors, floor.id]);
                                }
                              }}
                              className="w-full flex items-center gap-2 px-2 py-2 hover:bg-gray-100 rounded text-sm"
                            >
                              <Checkbox checked={selectedFloors.includes(floor.id)} />
                              <span>{floor.name}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                    
                    {/* Show selected floors */}
                    {selectedFloors.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedFloors.map((floorId) => {
                          const floor = availableFloors.find(f => f.id === floorId);
                          return floor ? (
                            <div key={floorId} className="flex items-center gap-1 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-sm font-medium">
                              {floor.name}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-amber-600"
                                onClick={() => setSelectedFloors(selectedFloors.filter(id => id !== floorId))}
                              />
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Zones Dropdown - Only show when zone checkbox is checked */}
                {form.watch('zone') && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Zones</label>
                    <div className="border rounded-md bg-white">
                      <div className="p-2 border-b space-y-1">
                        <button
                          type="button"
                          onClick={() => setSelectedZones(availableZones.map(z => z.id))}
                          className="w-full flex items-center gap-2 px-2 py-2 hover:bg-blue-50 rounded text-sm font-medium text-blue-600"
                        >
                          <Checkbox checked={selectedZones.length === availableZones.length} />
                          <span>Select All</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedZones([])}
                          className="w-full flex items-center gap-2 px-2 py-2 hover:bg-red-50 rounded text-sm font-medium text-red-600"
                        >
                          <Checkbox checked={false} />
                          <span>Clear All</span>
                        </button>
                      </div>
                      <div className="max-h-[250px] overflow-y-auto p-1">
                        {availableZones.length === 0 ? (
                          <div className="px-2 py-2 text-sm text-gray-500">No zones available</div>
                        ) : (
                          availableZones.map((zone) => (
                            <button
                              key={zone.id}
                              type="button"
                              onClick={() => {
                                if (selectedZones.includes(zone.id)) {
                                  setSelectedZones(selectedZones.filter(id => id !== zone.id));
                                } else {
                                  setSelectedZones([...selectedZones, zone.id]);
                                }
                              }}
                              className="w-full flex items-center gap-2 px-2 py-2 hover:bg-gray-100 rounded text-sm"
                            >
                              <Checkbox checked={selectedZones.includes(zone.id)} />
                              <span>{zone.name}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                    
                    {/* Show selected zones */}
                    {selectedZones.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedZones.map((zoneId) => {
                          const zone = availableZones.find(z => z.id === zoneId);
                          return zone ? (
                            <div key={zoneId} className="flex items-center gap-1 bg-purple-100 text-purple-900 px-3 py-1 rounded-full text-sm font-medium">
                              {zone.name}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-purple-600"
                                onClick={() => setSelectedZones(selectedZones.filter(id => id !== zoneId))}
                              />
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Rooms Dropdown - Only show when room checkbox is checked */}
                {form.watch('room') && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Rooms</label>
                    <div className="border rounded-md bg-white">
                      <div className="p-2 border-b space-y-1">
                        <button
                          type="button"
                          onClick={() => setSelectedRooms(availableRooms.map(r => r.id))}
                          className="w-full flex items-center gap-2 px-2 py-2 hover:bg-blue-50 rounded text-sm font-medium text-blue-600"
                        >
                          <Checkbox checked={selectedRooms.length === availableRooms.length} />
                          <span>Select All</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRooms([])}
                          className="w-full flex items-center gap-2 px-2 py-2 hover:bg-red-50 rounded text-sm font-medium text-red-600"
                        >
                          <Checkbox checked={false} />
                          <span>Clear All</span>
                        </button>
                      </div>
                      <div className="max-h-[250px] overflow-y-auto p-1">
                        {availableRooms.length === 0 ? (
                          <div className="px-2 py-2 text-sm text-gray-500">No rooms available</div>
                        ) : (
                          availableRooms.map((room) => (
                            <button
                              key={room.id}
                              type="button"
                              onClick={() => {
                                if (selectedRooms.includes(room.id)) {
                                  setSelectedRooms(selectedRooms.filter(id => id !== room.id));
                                } else {
                                  setSelectedRooms([...selectedRooms, room.id]);
                                }
                              }}
                              className="w-full flex items-center gap-2 px-2 py-2 hover:bg-gray-100 rounded text-sm"
                            >
                              <Checkbox checked={selectedRooms.includes(room.id)} />
                              <span>{room.name}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                    
                    {/* Show selected rooms */}
                    {selectedRooms.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedRooms.map((roomId) => {
                          const room = availableRooms.find(r => r.id === roomId);
                          return room ? (
                            <div key={roomId} className="flex items-center gap-1 bg-pink-100 text-pink-900 px-3 py-1 rounded-full text-sm font-medium">
                              {room.name}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-pink-600"
                                onClick={() => setSelectedRooms(selectedRooms.filter(id => id !== roomId))}
                              />
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingSubCategory(null);
                  }}
                  variant="outline"
                  className="px-8"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditSubmit}
                  disabled={isSubmitting}
                  className="bg-[#C72030] hover:bg-[#a01828] text-white px-8"
                >
                  {isSubmitting ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sub Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Loading sub-categories...</div>
            </div>
          ) : (
            <>
              <EnhancedTable
                data={subCategories}
                columns={columns}
                renderCell={renderCell}
                renderActions={renderActions}
                storageKey="sub-categories-table"
                pagination={false}
                enableSearch={true}
                onSearchChange={handleSearch}
                searchValue={searchTerm}
              />

              {/* Pagination - Same pattern as ScheduledTaskDashboard */}
              {(() => {
                const totalPages = Math.ceil(pagination.total_count / pagination.per_page);
                return totalPages > 1 ? (
                  <div className="flex justify-center mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {renderPaginationItems()}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                ) : null;
              })()}

              {/* Pagination Info */}
              {(() => {
                const totalPages = Math.ceil(pagination.total_count / pagination.per_page);
                return totalPages > 1 ? (
                  <div className="text-center mt-2 text-sm text-gray-600">
                    Showing page {currentPage} of {totalPages} ({pagination.total_count} total records)
                  </div>
                ) : null;
              })()}
            </>
          )}
        </CardContent>
      </Card>

      <EditSubCategoryModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        subCategory={editingSubCategory}
        onUpdate={() => fetchData(currentPage, searchTerm)}
      />
    </div>
  );
};
