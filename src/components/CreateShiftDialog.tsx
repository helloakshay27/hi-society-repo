import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Loader2, Clock } from "lucide-react";
import { toast } from 'sonner';
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";
import { FormControl, InputLabel, Select as MuiSelect, MenuItem } from '@mui/material';
import { menuProps } from '@/components/ticket-management/fieldStyles';

const fieldStyles = {
  height: '45px',
  backgroundColor: '#fff',
  borderRadius: '4px',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ddd' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#C72030' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#C72030' },
};

interface CreateShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShiftCreated?: () => void;
}

export const CreateShiftDialog = ({ open, onOpenChange, onShiftCreated }: CreateShiftDialogProps) => {
  const [fromHour, setFromHour] = useState<string>("");
  const [fromMinute, setFromMinute] = useState<string>("");
  const [fromAmPm, setFromAmPm] = useState<string>("AM");
  const [toHour, setToHour] = useState<string>("");
  const [toMinute, setToMinute] = useState<string>("");
  const [toAmPm, setToAmPm] = useState<string>("PM");
  const [checkInMargin, setCheckInMargin] = useState<boolean>(false);
  const [hourMargin, setHourMargin] = useState<string>("0");
  const [minMargin, setMinMargin] = useState<string>("0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  // Convert 12-hour to 24-hour format
  const convertTo24Hour = (hour: string, ampm: string) => {
    let hourNum = parseInt(hour);
    if (ampm === 'AM' && hourNum === 12) {
      hourNum = 0;
    } else if (ampm === 'PM' && hourNum !== 12) {
      hourNum += 12;
    }
    return String(hourNum).padStart(2, '0');
  };

  const getErrorMessage = (data: unknown, fallback: string) => {
    if (typeof data === 'string') return data || fallback;
    if (!data || typeof data !== 'object') return fallback;

    const responseData = data as {
      message?: unknown;
      error?: unknown;
      errors?: unknown;
      full_messages?: unknown;
    };

    if (typeof responseData.message === 'string') return responseData.message;
    if (typeof responseData.error === 'string') return responseData.error;
    if (Array.isArray(responseData.full_messages)) return responseData.full_messages.join(', ');
    if (Array.isArray(responseData.errors)) return responseData.errors.join(', ');
    if (responseData.errors && typeof responseData.errors === 'object') {
      return Object.entries(responseData.errors as Record<string, unknown>)
        .map(([key, value]) => `${key} ${Array.isArray(value) ? value.join(', ') : value}`)
        .join(', ');
    }
    return fallback;
  };

  const parseResponseBody = async (response: Response) => {
    const text = await response.text();
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };

  const getSelectedSocietyId = () =>
    localStorage.getItem('selectedSocietyId') ||
    localStorage.getItem('society_id') ||
    '';

  const validateForm = () => {
    if (!fromHour || !fromMinute || !fromAmPm || !toHour || !toMinute || !toAmPm) {
      toast.error("Please fill in all time fields");
      return false;
    }

    if (!getSelectedSocietyId()) {
      toast.error("Please select a society");
      return false;
    }

    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    // Convert to 24-hour format for API
    const startHour24 = convertTo24Hour(fromHour, fromAmPm);
    const endHour24 = convertTo24Hour(toHour, toAmPm);
    const formattedFromMinute = fromMinute.padStart(2, '0');
    const formattedToMinute = toMinute.padStart(2, '0');
    const formattedHourMargin = checkInMargin ? hourMargin : '00';
    const formattedMinMargin = checkInMargin ? minMargin : '00';
    const societyId = getSelectedSocietyId();

    const payload = {
      society_id: societyId,
      user_shift: {
        start_hour: startHour24,
        start_min: formattedFromMinute,
        end_hour: endHour24,
        end_min: formattedToMinute,
        hour_margin: formattedHourMargin,
        min_margin: formattedMinMargin,
        society_id: societyId,
        check_in_margin: checkInMargin
      }
    };

    try {
      const response = await fetch(getFullUrl('/spree/manage/user_shifts.json'), {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify(payload)
      });

      const result = await parseResponseBody(response);

      if (!response.ok) {
        throw new Error(getErrorMessage(result, `HTTP error! status: ${response.status}`));
      }

      toast.success('Shift created successfully!');
      
      // Reset form
      resetForm();
      
      // Close dialog
      onOpenChange(false);
      
      // Trigger callback to refresh parent data
      if (onShiftCreated) {
        onShiftCreated();
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error creating shift:', error);
      toast.error(`Failed to create shift: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFromHour("");
    setFromMinute("");
    setFromAmPm("AM");
    setToHour("");
    setToMinute("");
    setToAmPm("PM");
    setCheckInMargin(false);
    setHourMargin("0");
    setMinMargin("0");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} modal={false} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl sm:rounded-2xl border border-[rgba(26,26,24,.09)] bg-white p-0 gap-0">
        <DialogHeader className="px-6 pt-[22px] pb-4">
          <DialogTitle className="flex items-center justify-between text-sm font-semibold leading-[1.4] text-[#1A1A18]">
            <span className="flex items-center">
              {/* <span
                className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: '#F5F4F0' }}
              >
                <Clock size={14} color="#1A1A18" />
              </span> */}
              Create Shift
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 p-0 rounded-md hover:bg-[#F7F6F2] shadow-none"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-gray-600" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 px-6 pb-6">
          {/* Shift Timings From */}
          <div className="grid grid-cols-[1fr_auto_1fr_minmax(140px,140px)] gap-2 items-end mt-2">
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>
                <span>From Hr <span style={{ color: 'var(--color-primary, #da7756)' }}>*</span></span>
              </InputLabel>
              <MuiSelect
                value={fromHour}
                onChange={(e) => setFromHour(e.target.value)}
                displayEmpty
                label={<span>From Hr <span style={{ color: 'var(--color-primary, #da7756)' }}>*</span></span>}
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><em>Select Hr</em></MenuItem>
                {['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'].map((hour) => (
                  <MenuItem key={hour} value={hour}>{hour}</MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
            <span className="flex items-center text-gray-500 px-1 h-[45px]">:</span>
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>
                <span>From Min <span style={{ color: 'var(--color-primary, #da7756)' }}>*</span></span>
              </InputLabel>
              <MuiSelect
                value={fromMinute}
                onChange={(e) => setFromMinute(e.target.value)}
                displayEmpty
                label={<span>From Min <span style={{ color: 'var(--color-primary, #da7756)' }}>*</span></span>}
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><em>Select Min</em></MenuItem>
                {minutes.map((minute) => (
                  <MenuItem key={minute} value={minute}>{minute}</MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>
                <span>AM/PM <span style={{ color: 'var(--color-primary, #da7756)' }}>*</span></span>
              </InputLabel>
              <MuiSelect
                value={fromAmPm}
                onChange={(e) => setFromAmPm(e.target.value)}
                displayEmpty
                label={<span>AM/PM <span style={{ color: 'var(--color-primary, #da7756)' }}>*</span></span>}
                sx={{
                  ...fieldStyles,
                  '& .MuiSelect-select': {
                    overflow: 'visible',
                    textOverflow: 'clip',
                  },
                }}
                MenuProps={menuProps}
              >
                <MenuItem value="AM">AM</MenuItem>
                <MenuItem value="PM">PM</MenuItem>
              </MuiSelect>
            </FormControl>
          </div>

          {/* Shift Timings To */}
          <div className="grid grid-cols-[1fr_auto_1fr_minmax(140px,140px)] gap-2 items-end mt-4">
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>
                <span>To Hr <span style={{ color: 'var(--color-primary, #da7756)' }}>*</span></span>
              </InputLabel>
              <MuiSelect
                value={toHour}
                onChange={(e) => setToHour(e.target.value)}
                displayEmpty
                label={<span>To Hr <span style={{ color: 'var(--color-primary, #da7756)' }}>*</span></span>}
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><em>Select Hr</em></MenuItem>
                {['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'].map((hour) => (
                  <MenuItem key={hour} value={hour}>{hour}</MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
            <span className="flex items-center text-gray-500 px-1 h-[45px]">:</span>
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>
                <span>To Min <span style={{ color: 'var(--color-primary, #da7756)' }}>*</span></span>
              </InputLabel>
              <MuiSelect
                value={toMinute}
                onChange={(e) => setToMinute(e.target.value)}
                displayEmpty
                label={<span>To Min <span style={{ color: 'var(--color-primary, #da7756)' }}>*</span></span>}
                sx={fieldStyles}
                MenuProps={menuProps}
              >
                <MenuItem value=""><em>Select Min</em></MenuItem>
                {minutes.map((minute) => (
                  <MenuItem key={minute} value={minute}>{minute}</MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
            <FormControl fullWidth variant="outlined">
              <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>
                <span>AM/PM <span style={{ color: 'var(--color-primary, #da7756)' }}>*</span></span>
              </InputLabel>
              <MuiSelect
                value={toAmPm}
                onChange={(e) => setToAmPm(e.target.value)}
                displayEmpty
                label={<span>AM/PM <span style={{ color: 'var(--color-primary, #da7756)' }}>*</span></span>}
                sx={{
                  ...fieldStyles,
                  '& .MuiSelect-select': {
                    overflow: 'visible',
                    textOverflow: 'clip',
                  },
                }}
                MenuProps={menuProps}
              >
                <MenuItem value="AM">AM</MenuItem>
                <MenuItem value="PM">PM</MenuItem>
              </MuiSelect>
            </FormControl>
          </div>

          {/* Check In Margin */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="check-in-margin" 
                checked={checkInMargin}
                onCheckedChange={(checked) => setCheckInMargin(checked as boolean)}
              />
              <label 
                htmlFor="check-in-margin" 
                className="text-sm font-medium text-[#1A1A18]"
              >
                Check In Margin
              </label>
            </div>
            
            {checkInMargin && (
              <div>
                <div className="flex gap-2 items-end">
                  <FormControl fullWidth variant="outlined">
                    <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}><span>Select Hr <span style={{ color: 'var(--color-primary, #da7756)' }}>*</span></span></InputLabel>
                    <MuiSelect
                      value={hourMargin}
                      onChange={(e) => setHourMargin(e.target.value)}
                      displayEmpty
                      label={<span>Select Hr <span style={{ color: 'var(--color-primary, #da7756)' }}>*</span></span>}
                      sx={fieldStyles}
                      MenuProps={menuProps}
                    >
                      {Array.from({ length: 13 }, (_, i) => String(i)).map((hour) => (
                        <MenuItem key={hour} value={hour}>{hour}</MenuItem>
                      ))}
                    </MuiSelect>
                  </FormControl>
                  <span className="flex items-center text-gray-500 px-1 h-[45px]">:</span>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}><span>Select Min <span style={{ color: 'var(--color-primary, #da7756)' }}>*</span></span></InputLabel>
                    <MuiSelect
                      value={minMargin}
                      onChange={(e) => setMinMargin(e.target.value)}
                      displayEmpty
                      label={<span>Select Min <span style={{ color: 'var(--color-primary, #da7756)' }}>*</span></span>}
                      sx={fieldStyles}
                      MenuProps={menuProps}
                    >
                      {Array.from({ length: 60 }, (_, i) => String(i)).map((minute) => (
                        <MenuItem key={minute} value={minute}>{minute}</MenuItem>
                      ))}
                    </MuiSelect>
                  </FormControl>
                </div>
              </div>
            )}
          </div>

          {/* Cancel / Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(26,26,24,.08)]">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[rgba(26,26,24,.08)] bg-white px-[22px] text-[13px] font-semibold text-[rgba(26,26,24,.68)] transition-all hover:border-[rgba(26,26,24,.28)] hover:text-[#1A1A18] disabled:opacity-60 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={isSubmitting}
              className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-[#1A1A18] bg-[#1A1A18] px-[22px] text-[13px] font-semibold text-white transition-colors hover:bg-[#12100E] disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
