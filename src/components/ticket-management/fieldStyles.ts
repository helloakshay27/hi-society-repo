// Shared MUI field styles for ticket management dialogs
// Matches the ServiceFilterModal UI pattern exactly

export const fieldStyles = {
  height: { xs: 28, sm: 36, md: 45 },
  backgroundColor: 'white',
  '& .MuiInputBase-input, & .MuiSelect-select': {
    padding: { xs: '8px', sm: '10px', md: '12px' },
    backgroundColor: 'white',
  },
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'white',
  }
};

export const menuProps = {
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
  disableRestoreFocus: true,
  disableScrollLock: true,
};
