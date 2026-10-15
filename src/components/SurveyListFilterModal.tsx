import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormControl as MuiFormControl, InputLabel, Select as MuiSelect, MenuItem, TextField } from '@mui/material';
import { menuProps } from '@/components/ticket-management/fieldStyles';

const fieldStyles = {
  height: '45px',
  backgroundColor: '#fff',
  borderRadius: '4px',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ddd' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#C72030' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#C72030' },
};
import { X, Loader2, Filter } from 'lucide-react';
import { apiClient } from '@/utils/apiClient';
import { toast } from 'sonner';

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterState) => void;
  onResetFilters: () => void;
  currentFilters?: FilterState;
}

interface FilterState {
  surveyName: string;
  categoryId: string;
  checkType: string;
}

interface Category {
  id: number;
  name: string;
}

export const SurveyListFilterModal: React.FC<FilterModalProps> = ({
  open,
  onClose,
  onApplyFilters,
  onResetFilters,
  currentFilters
}) => {
  const [filters, setFilters] = useState<FilterState>({
    surveyName: '',
    categoryId: 'all',
    checkType: 'all'
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Fetch categories when modal opens
  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  // Initialize filters with current applied filters when modal opens
  useEffect(() => {
    if (open) {
      if (currentFilters) {
        setFilters(currentFilters);
      } else {
        // Reset to default if no current filters
        setFilters({
          surveyName: '',
          categoryId: 'all',
          checkType: 'all'
        });
      }
    }
  }, [open, currentFilters]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await apiClient.get('/pms/admin/helpdesk_categories.json');
      console.log('Categories API response:', response.data);
      
      // Handle different response structures
      let categoriesData = [];
      if (Array.isArray(response.data)) {
        categoriesData = response.data;
      } else if (response.data && Array.isArray(response.data.helpdesk_categories)) {
        categoriesData = response.data.helpdesk_categories;
      } else if (response.data && Array.isArray(response.data.categories)) {
        categoriesData = response.data.categories;
      }
      
      setCategories(categoriesData || []);
    } catch (error: any) {
      console.error('Error fetching ticket categories:', error);
      toast.error('Failed to fetch ticket categories');
      setCategories([]); // Ensure it's always an array
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleReset = () => {
    setFilters({
      surveyName: '',
      categoryId: 'all',
      checkType: 'all'
    });
    onResetFilters();
    toast.success('Filters reset successfully');
  };

  const handleApply = () => {
    onApplyFilters(filters);
    toast.success('Filters applied successfully');
    onClose();
  };

  const handleInputChange = (field: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog modal={false} open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl min-h-[200px] rounded-2xl sm:rounded-2xl border border-[rgba(26,26,24,.09)] bg-white p-0 gap-0">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 px-6 pt-[22px] pb-4">
          <DialogTitle className="text-sm font-semibold leading-[1.4] text-[#1A1A18] flex items-center">
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
              style={{ backgroundColor: '#F5F4F0' }}
            >
              <Filter size={14} color="#1A1A18" />
            </span>
            Filter By
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-[#F7F6F2] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </DialogHeader>

        <div className="px-6 pb-6">
          {/* Survey Filter Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[#1A1A18] mb-4">Question Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {/* Survey Name Filter */}
              <TextField
                label="Title"
                placeholder="Enter Title"
                value={filters.surveyName}
                onChange={(e) => handleInputChange('surveyName', e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />

              {/* Category Filter */}
              <MuiFormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Ticket Category</InputLabel>
                <MuiSelect
                  value={filters.categoryId}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  displayEmpty
                  label="Ticket Category"
                  disabled={loadingCategories}
                  sx={fieldStyles}
                  MenuProps={menuProps}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {loadingCategories ? (
                    <MenuItem value="" disabled>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading categories...
                    </MenuItem>
                  ) : (
                    Array.isArray(categories) && categories.map((category) => (
                      <MenuItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </MenuItem>
                    ))
                  )}
                </MuiSelect>
              </MuiFormControl>

              {/* Check Type Filter */}
              <MuiFormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Check Type</InputLabel>
                <MuiSelect
                  value={filters.checkType}
                  onChange={(e) => handleInputChange('checkType', e.target.value)}
                  displayEmpty
                  label="Check Type"
                  sx={fieldStyles}
                  MenuProps={menuProps}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="patrolling">Patrolling</MenuItem>
                  <MenuItem value="survey">Survey</MenuItem>
                </MuiSelect>
              </MuiFormControl>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-end gap-3 px-6 py-4 border-t border-[rgba(26,26,24,.08)] sm:justify-end">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[rgba(26,26,24,.08)] bg-white px-[22px] text-[13px] font-semibold text-[rgba(26,26,24,.68)] transition-all hover:border-[rgba(26,26,24,.28)] hover:text-[#1A1A18]"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[#1A1A18] bg-[#1A1A18] px-[22px] text-[13px] font-semibold text-white transition-colors hover:bg-[#12100E]"
          >
            Apply
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
