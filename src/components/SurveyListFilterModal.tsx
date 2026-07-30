import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormControl as MuiFormControl, InputLabel, Select as MuiSelect, MenuItem, TextField } from '@mui/material';
import { fieldStyles, menuProps } from '@/components/ticket-management/fieldStyles';
import { X, Loader2 } from 'lucide-react';
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
      <DialogContent className="max-w-2xl min-h-[200px]">
        <DialogHeader className="relative">
          <DialogTitle className="text-xl text-slate-950 font-normal">FILTER BY</DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-0 top-0 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>
        
        <div className="py-4">
          {/* Survey Filter Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#C72030] mb-4">Question Details</h3>
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

        <DialogFooter className="flex justify-end gap-3">
          <Button 
            onClick={handleReset} 
            className="bg-[#C72030] hover:bg-[#B01C29] text-white px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </Button>
          <Button 
            onClick={handleApply} 
className="px-6 sm:px-8 w-full sm:w-auto !bg-white border !border-[#da7756] !text-[#da7756] hover:!bg-gray-100  h-10"          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
