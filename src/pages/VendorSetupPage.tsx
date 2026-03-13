import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { getAuthHeader, getFullUrl } from '@/config/apiConfig';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TextField } from '@mui/material';

const fieldStyles = {
  '& .MuiOutlinedInput-root': {
    '& fieldset': { borderColor: '#ddd' },
    '&:hover fieldset': { borderColor: '#C72030' },
    '&.Mui-focused fieldset': { borderColor: '#C72030' },
  },
  '& .MuiInputLabel-root': {
    '&.Mui-focused': { color: '#C72030' },
  },
};

interface Vendor {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company_name: string | null;
  gstin_number: string | null;
  pan_number: string | null;
  mobile1: string | null;
  mobile2: string | null;
  address: string | null;
  society_id: number | null;
  active: boolean | null;
  created_at?: string;
  updated_at?: string;
}

interface VendorForm {
  first_name: string;
  last_name: string;
  email: string;
  company_name: string;
  gstin_number: string;
  pan_number: string;
  mobile1: string;
  mobile2: string;
  address: string;
}

const emptyForm: VendorForm = {
  first_name: '',
  last_name: '',
  email: '',
  company_name: '',
  gstin_number: '',
  pan_number: '',
  mobile1: '',
  mobile2: '',
  address: '',
};

const VendorSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [form, setForm] = useState<VendorForm>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Fetch list ──────────────────────────────────────────────────────────────
  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        getFullUrl('/crm/admin/vendor_setup.json'),
        {
          headers: {
            Authorization: getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setVendors(Array.isArray(data) ? data : data.vendors || []);
      } else {
        toast.error('Failed to load vendors');
      }
    } catch {
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // ── Open Add dialog ─────────────────────────────────────────────────────────
  const handleAdd = () => {
    setEditingVendor(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  // ── Open Edit dialog ────────────────────────────────────────────────────────
  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setForm({
      first_name: vendor.first_name || '',
      last_name: vendor.last_name || '',
      email: vendor.email || '',
      company_name: vendor.company_name || '',
      gstin_number: vendor.gstin_number || '',
      pan_number: vendor.pan_number || '',
      mobile1: vendor.mobile1 || '',
      mobile2: vendor.mobile2 || '',
      address: vendor.address || '',
    });
    setDialogOpen(true);
  };

  // ── Submit create ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.email.trim()) {
      toast.error('Email address is required');
      return;
    }
    if (!form.company_name.trim()) {
      toast.error('Company name is required');
      return;
    }
    if (!form.mobile1.trim()) {
      toast.error('Mobile number is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const isEdit = !!editingVendor;

      if (isEdit) {
        // Edit: PUT to helpdesk_vendors endpoint
        const editBody = {
          pms_supplier: {
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email,
            company_name: form.company_name,
            gstin_number: form.gstin_number,
            pan_number: form.pan_number,
            mobile1: form.mobile1,
            mobile2: form.mobile2,
            address: form.address,
            active: true,
          },
        };
        const response = await fetch(
          getFullUrl(`/crm/admin/helpdesk_vendors/${editingVendor!.id}.json`),
          {
            method: 'PUT',
            headers: {
              Authorization: getAuthHeader(),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(editBody),
          }
        );
        if (response.ok) {
          toast.success('Vendor updated successfully!');
          setDialogOpen(false);
          fetchVendors();
        } else {
          const err = await response.json().catch(() => null);
          toast.error(err?.message || 'Failed to update vendor');
        }
      } else {
        // Add: POST to create_pms_supplier
        const addBody = {
          pms_supplier: {
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email,
            company_name: form.company_name,
            gstin_number: form.gstin_number,
            pan_number: form.pan_number,
            mobile1: form.mobile1,
            mobile2: form.mobile2,
            address: form.address,
            active: true,
          },
        };
        const response = await fetch(
          getFullUrl('/crm/admin/create_pms_supplier.json'),
          {
            method: 'POST',
            headers: {
              Authorization: getAuthHeader(),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(addBody),
          }
        );
        if (response.ok) {
          toast.success('Vendor created successfully!');
          setDialogOpen(false);
          fetchVendors();
        } else {
          const err = await response.json().catch(() => null);
          toast.error(err?.message || 'Failed to create vendor');
        }
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (vendor: Vendor) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;
    try {
      const response = await fetch(
        getFullUrl(`/crm/admin/supplier_destroy.json?id=${vendor.id}`),
        {
          method: 'GET',
          headers: {
            Authorization: getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.ok) {
        toast.success('Vendor deleted successfully!');
        fetchVendors();
      } else {
        toast.error('Failed to delete vendor');
      }
    } catch {
      toast.error('Failed to delete vendor');
    }
  };

  // ── Table columns ───────────────────────────────────────────────────────────
  const columns = [
    { key: 'srno', label: 'Sr.No.', sortable: false },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'mobile', label: 'Mobile', sortable: true },
    { key: 'company_name', label: 'Company Name', sortable: true },
    { key: 'gstin_number', label: 'GSTIN Number', sortable: false },
    { key: 'pan_number', label: 'PAN Number', sortable: false },
  ];

  const renderCell = (item: Vendor, columnKey: string) => {
    const index = vendors.findIndex((v) => v.id === item.id);
    switch (columnKey) {
      case 'srno':
        return index + 1;
      case 'name': {
        const name = [item.first_name, item.last_name].filter(Boolean).join(' ');
        return name || '--';
      }
      case 'email':
        return item.email || '--';
      case 'mobile':
        return item.mobile1 || '--';
      case 'company_name':
        return item.company_name || '--';
      case 'gstin_number':
        return item.gstin_number || '--';
      case 'pan_number':
        return item.pan_number || '--';
      default:
        return '--';
    }
  };

  const renderActions = (item: Vendor) => (
    <div className="flex gap-1 items-center">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(`/settings/ticket-management/vendor-setup/view/${item.id}`)}
        className="h-8 w-8 p-0 hover:bg-gray-100"
        title="View"
      >
        <Eye className="h-4 w-4 text-gray-500" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleEdit(item)}
        className="h-8 w-8 p-0 hover:bg-gray-100"
        title="Edit"
      >
        <Edit className="h-4 w-4 text-[#C72030]" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleDelete(item)}
        className="h-8 w-8 p-0 hover:bg-gray-100"
        title="Delete"
      >
        <Trash2 className="h-4 w-4 text-[#C72030]" />
      </Button>
    </div>
  );

  const updateForm = (key: keyof VendorForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="p-4 sm:p-6">
      <Toaster position="top-right" richColors closeButton />

      {/* Breadcrumb + Title */}
      <div className="mb-6">
        <p className="text-sm text-gray-500">Community &gt; Setup</p>
        <h1 className="text-xl font-bold text-gray-900 mt-1">Vendor Setup</h1>
      </div>

      {/* Table */}
      <EnhancedTable
        data={vendors}
        columns={columns}
        renderCell={renderCell}
        renderActions={renderActions}
        storageKey="vendor-setup-table"
        enableSearch={true}
        searchPlaceholder="Search vendors..."
        loading={loading}
        loadingMessage="Loading vendors..."
        leftActions={
          <Button
            onClick={handleAdd}
            className="bg-[#C72030] hover:bg-[#a01828] text-white h-9 px-4 text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add 
          </Button>
        }
      />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editingVendor ? 'Edit Vendor' : 'Add Vendor'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Row 1: First / Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="First Name"
                placeholder="First Name"
                value={form.first_name}
                onChange={(e) => updateForm('first_name', e.target.value)}
                fullWidth
                variant="outlined"
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={fieldStyles}
              />
              <TextField
                label="Last Name"
                placeholder="Last Name"
                value={form.last_name}
                onChange={(e) => updateForm('last_name', e.target.value)}
                fullWidth
                variant="outlined"
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={fieldStyles}
              />
            </div>

            {/* Row 2: Email / Company Name */}
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Email Address"
                placeholder="Email Address"
                type="email"
                value={form.email}
                onChange={(e) => updateForm('email', e.target.value)}
                fullWidth
                variant="outlined"
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={fieldStyles}
              />
              <TextField
                label="Company Name"
                placeholder="Company Name"
                value={form.company_name}
                onChange={(e) => updateForm('company_name', e.target.value)}
                fullWidth
                variant="outlined"
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={fieldStyles}
              />
            </div>

            {/* Row 3: GSTIN / PAN */}
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="GSTIN Number"
                placeholder="GSTIN Number"
                value={form.gstin_number}
                onChange={(e) => updateForm('gstin_number', e.target.value)}
                fullWidth
                variant="outlined"
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={fieldStyles}
              />
              <TextField
                label="PAN Number"
                placeholder="PAN Number"
                value={form.pan_number}
                onChange={(e) => updateForm('pan_number', e.target.value)}
                fullWidth
                variant="outlined"
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={fieldStyles}
              />
            </div>

            {/* Row 4: Mobile / Alternate */}
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Mobile Number"
                placeholder="Mobile Number"
                type="tel"
                value={form.mobile1}
                onChange={(e) => updateForm('mobile1', e.target.value)}
                fullWidth
                variant="outlined"
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={fieldStyles}
              />
              <TextField
                label="Alternate Number"
                placeholder="Alternate Number"
                type="tel"
                value={form.mobile2}
                onChange={(e) => updateForm('mobile2', e.target.value)}
                fullWidth
                variant="outlined"
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={fieldStyles}
              />
            </div>

            {/* Row 5: Address */}
            <TextField
              label="Address"
              placeholder="Address"
              value={form.address}
              onChange={(e) => updateForm('address', e.target.value)}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={fieldStyles}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-3 border-t">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#C72030] hover:bg-[#a01828] text-white px-8"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorSetupPage;
