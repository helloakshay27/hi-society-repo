
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import {
  TextField,
  FormControl,
  Select as MuiSelect,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { toast } from 'sonner';
import { 
  fetchAllBuildings, 
  fetchWings, 
  fetchAreas, 
  fetchFloors, 
  fetchRooms 
} from '@/store/slices/serviceLocationSlice';
import type { RootState, AppDispatch } from '@/store/store';

interface PatrollingFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: PatrollingFilters) => void;
}

export interface PatrollingFilters {
  searchTerm?: string;
  buildingId?: number | null;
  wingId?: number | null;
  areaId?: number | null;
  floorId?: number | null;
  roomId?: number | null;
  status?: string;
}

export const PatrollingFilterModal = ({ isOpen, onClose, onApply }: PatrollingFilterModalProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    buildings,
    wings,
    areas,
    floors,
    rooms,
    loading
  } = useSelector((state: RootState) => state.serviceLocation);

  const [filters, setFilters] = useState<PatrollingFilters>({
    searchTerm: '',
    buildingId: null,
    wingId: null,
    areaId: null,
    floorId: null,
    roomId: null,
    status: ''
  });

  useEffect(() => {
    if (isOpen) {
      const siteId = localStorage.getItem('selectedSiteId');
      if (siteId && buildings.length === 0) {
        dispatch(fetchAllBuildings(parseInt(siteId)));
      }
    }
  }, [isOpen, dispatch, buildings.length]);

  const handleInputChange = (field: keyof PatrollingFilters, value: string | number | null) => {
    setFilters(prev => {
      const updated = { ...prev, [field]: value };

      // Clear dependent fields when parent changes
      if (field === 'buildingId') {
        updated.wingId = null;
        updated.areaId = null;
        updated.floorId = null;
        updated.roomId = null;
        
        if (value) {
          dispatch(fetchWings(value as number));
        }
      }

      if (field === 'wingId') {
        updated.areaId = null;
        updated.floorId = null;
        updated.roomId = null;
        
        if (value) {
          dispatch(fetchAreas(value as number));
        }
      }

      if (field === 'areaId') {
        updated.floorId = null;
        updated.roomId = null;
        
        if (value) {
          dispatch(fetchFloors(value as number));
        }
      }

      if (field === 'floorId') {
        updated.roomId = null;
        
        if (value) {
          dispatch(fetchRooms(value as number));
        }
      }

      return updated;
    });
  };

  const handleApply = () => {
    // Remove empty/null values
    const cleanFilters: Partial<PatrollingFilters> = {};
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== '' && value !== undefined) {
        (cleanFilters as any)[key] = value;
      }
    });

    onApply(cleanFilters as PatrollingFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: PatrollingFilters = {
      searchTerm: '',
      buildingId: null,
      wingId: null,
      areaId: null,
      floorId: null,
      roomId: null,
      status: ''
    };
    
    setFilters(resetFilters);
    onApply({});
  };

  const handleClose = () => {
    onClose();
  };

  const fieldStyles = {
    height: 50,
    backgroundColor: 'white',
    borderRadius: '12px',
    color: 'rgba(26,26,24,.38)',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(26,26,24,.10)' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(26,26,24,.24)' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1A1A18', borderWidth: 1 },
    '& .MuiSelect-select': { padding: '14px 16px', fontSize: '13.5px' },
  };

  const menuProps = {
    PaperProps: {
      style: {
        maxHeight: 200,
        backgroundColor: 'white',
        zIndex: 9999,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
    disablePortal: false,
    disableAutoFocus: true,
    disableEnforceFocus: true,
  };

  type LocationFilterKey = 'buildingId' | 'wingId' | 'areaId' | 'floorId' | 'roomId';
  const renderLocationField = (
    label: string,
    key: LocationFilterKey,
    placeholder: string,
    options: Array<{ id: number; name: string }>,
    disabled: boolean,
    isLoading: boolean,
  ) => (
    <div className="space-y-2">
      <label className="block text-[12.5px] font-semibold text-[rgba(26,26,24,.68)]">{label}</label>
      <FormControl fullWidth variant="outlined" disabled={disabled}>
        <MuiSelect
          value={filters[key] ?? ''}
          onChange={(event) => handleInputChange(key, event.target.value ? Number(event.target.value) : null)}
          displayEmpty
          sx={{ ...fieldStyles, color: filters[key] ? '#1A1A18' : 'rgba(26,26,24,.38)' }}
          MenuProps={menuProps}
        >
          <MenuItem value="">{isLoading ? 'Loading...' : placeholder}</MenuItem>
          {options.map((option) => (
            <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>
          ))}
        </MuiSelect>
        {isLoading && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <CircularProgress size={16} />
          </div>
        )}
      </FormControl>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }} modal={false}>
      <DialogContent className="max-h-[86vh] w-[min(720px,calc(100vw-32px))] max-w-none overflow-y-auto !rounded-3xl border border-[rgba(26,26,24,.09)] bg-white p-7 shadow-[0_8px_40px_rgba(26,26,24,.16)] [&>button]:hidden" aria-describedby="filter-dialog-description">
        <DialogHeader className="mb-1 flex flex-row items-center justify-between pb-5">
          <DialogTitle className="text-[18px] font-semibold text-[#1A1A18]">Filter By</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            aria-label="Close filters"
            className="h-8 w-8 rounded-lg p-0 text-[rgba(26,26,24,.48)] hover:bg-[#F7F6F2] hover:text-[#1A1A18]"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
            {renderLocationField('Building', 'buildingId', 'Select Building', buildings, loading.buildings, loading.buildings)}
            {renderLocationField('Wing', 'wingId', 'Select Wing', wings, !filters.buildingId || loading.wings, loading.wings)}
            {renderLocationField('Area', 'areaId', 'Select Area', areas, !filters.wingId || loading.areas, loading.areas)}
            {renderLocationField('Floor', 'floorId', 'Select Floor', floors, !filters.areaId || loading.floors, loading.floors)}
            {renderLocationField('Room', 'roomId', 'Select Room', rooms, !filters.floorId || loading.rooms, loading.rooms)}
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="min-h-[42px] rounded-lg !border-[rgba(26,26,24,.18)] bg-white px-[22px] text-[13px] font-semibold !text-[#1A1A18] hover:bg-[#F7F6F2]"
            style={{ color: '#1A1A18', border: '1px solid rgba(26,26,24,.18)' }}
          >
            Reset
          </Button>
          <Button
            onClick={handleApply}
            className="min-h-[42px] rounded-lg !bg-[#1A1A18] px-[22px] text-[13px] font-semibold !text-white hover:!bg-[#12100E]"
            style={{ backgroundColor: '#1A1A18', color: '#FFFFFF' }}
          >
            <span style={{ color: '#FFFFFF' }}>Apply Filters</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
