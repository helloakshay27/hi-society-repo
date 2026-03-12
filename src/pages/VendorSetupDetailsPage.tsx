import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const VendorSetupDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [form, setForm] = useState<VendorForm>({
    first_name: '',
    last_name: '',
    email: '',
    company_name: '',
    gstin_number: '',
    pan_number: '',
    mobile1: '',
    mobile2: '',
    address: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Fetch vendor ────────────────────────────────────────────────────────────
  const fetchVendor = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await fetch(
        getFullUrl(`/crm/admin/show_vendor_details.json?id=${id}`),
        {
          headers: {
            Authorization: getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        const v: Vendor = data;
        setVendor(v);
        setForm({
          first_name: v.first_name || '',
          last_name: v.last_name || '',
          email: v.email || '',
          company_name: v.company_name || '',
          gstin_number: v.gstin_number || '',
          pan_number: v.pan_number || '',
          mobile1: v.mobile1 || '',
          mobile2: v.mobile2 || '',
          address: v.address || '',
        });
      } else {
        toast.error('Failed to load vendor details');
      }
    } catch {
      toast.error('Failed to load vendor details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  // ── Submit edit ─────────────────────────────────────────────────────────────
  const handleEditSubmit = async () => {
    if (!form.email.trim()) { toast.error('Email is required'); return; }
    if (!form.company_name.trim()) { toast.error('Company name is required'); return; }
    if (!form.mobile1.trim()) { toast.error('Mobile number is required'); return; }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        getFullUrl(`/pms/suppliers/${id}.json`),
        {
          method: 'PUT',
          headers: {
            Authorization: getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
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
          }),
        }
      );
      if (response.ok) {
        toast.success('Vendor updated successfully!');
        setEditDialogOpen(false);
        fetchVendor();
      } else {
        const err = await response.json().catch(() => null);
        toast.error(err?.message || 'Failed to update vendor');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateForm = (key: keyof VendorForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const vendorName = vendor
    ? [vendor.first_name, vendor.last_name].filter(Boolean).join(' ') || vendor.company_name || 'Vendor'
    : '';

  // ── Detail row helper ───────────────────────────────────────────────────────
  const DetailRow: React.FC<{ label: string; value: string | null | undefined }> = ({ label, value }) => (
    <div className="flex items-start gap-2">
      <span className="text-sm text-gray-500 min-w-[140px]">{label}</span>
      <span className="text-sm text-gray-700 font-medium">: {value || ''}</span>
    </div>
  );

  return (
    <div className="p-4 sm:p-6">
      <Toaster position="top-right" richColors closeButton />

      {/* Back */}
      <button
        onClick={() => navigate('/settings/ticket-management/vendor-setup')}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Vendor Setup
      </button>

      {loading ? (
        <div className="flex justify-center py-16 text-gray-500 text-sm">Loading...</div>
      ) : !vendor ? (
        <div className="flex justify-center py-16 text-gray-500 text-sm">Vendor not found.</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 relative">
          {/* Edit button top-right */}
          <button
            onClick={() => setEditDialogOpen(true)}
            className="absolute top-4 right-4 p-2 border border-[#C72030] rounded-md hover:bg-red-50 transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4 text-[#C72030]" />
          </button>

          {/* Section header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-orange-600" />
            </div>
            <h2 className="text-sm font-bold text-orange-600 uppercase tracking-wide">
              VENDOR INFORMATION
            </h2>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
            <DetailRow label="Vendor Name" value={vendorName} />
            <DetailRow label="Email Address" value={vendor.email} />
            <DetailRow label="Company Name" value={vendor.company_name} />
            <DetailRow label="Mobile Number" value={vendor.mobile1} />
            <DetailRow label="Alternate Number" value={vendor.mobile2} />
            <DetailRow label="GSTIN Number" value={vendor.gstin_number} />
            <DetailRow label="PAN Number" value={vendor.pan_number} />
            <DetailRow label="Address" value={vendor.address} />
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Add Vendor</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
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

          <div className="flex justify-end pt-3 border-t">
            <Button onClick={handleEditSubmit} disabled={isSubmitting} className="bg-[#C72030] hover:bg-[#a01828] text-white px-8">
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorSetupDetailsPage;
