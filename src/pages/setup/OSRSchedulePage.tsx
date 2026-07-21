import React, { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { ColumnConfig } from '@/hooks/useEnhancedTable';
import { apiClient } from '@/utils/apiClient';
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScheduleEntry {
  id: number;
  society_id: number;
  osr_category_id: number;
  osr_sub_category_id: number;
  start_hour: number;
  end_hour: number;
  start_minute: string;
  end_minute: string;
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
  sun: number;
  active: number;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
}

interface SubCategory {
  id: number;
  osr_categories_id: number;
  name: string;
}

interface SubCatFlat {
  id: number;
  osr_sub_category_id: number;
  flat_type_id: number;
  flat_type_name: string;
  price: number;
}

interface FormState {
  osr_category_id: string;
  osr_sub_category_id: string;
  flat_type_id: string;
  startTime: string;
  endTime: string;
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
  sun: number;
  active: string;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_KEYS: (keyof FormState)[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// ─── Helpers ─────────────────────────────────────────────────────────────

function formatTime(hour: number, minute: string) {
  const h = String(hour).padStart(2, '0');
  return `${h}:${minute}`;
}

function parseTime(time: string) {
  const [h, m] = time.split(':');
  return { hour: parseInt(h, 10), minute: m || '00' };
}

// ─── Table Columns ─────────────────────────────────────────────────────────

const SCHEDULE_COLUMNS: ColumnConfig[] = [
  { key: 'srNo',             label: 'S.No.',       sortable: false, hideable: false },
  { key: 'osr_category_id',  label: 'Category',     sortable: true },
  { key: 'subCategory',      label: 'Sub Category', sortable: true },
  { key: 'startTime',        label: 'Start Time',   sortable: true },
  { key: 'endTime',          label: 'End Time',     sortable: true },
  { key: 'days',             label: 'Days',         sortable: false },
  { key: 'active',           label: 'Status',       sortable: true },
];

// ─── Main Page ───────────────────────────────────────────────────────────────

export const OSRSchedulePage: React.FC = () => {
  const { shouldShow } = useDynamicPermissions();
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allSubCategories, setAllSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Cascading dropdowns
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [subCatFlats, setSubCatFlats] = useState<SubCatFlat[]>([]);
  const [subCatsLoading, setSubCatsLoading] = useState(false);
  const [flatsLoading, setFlatsLoading] = useState(false);

  // ── Initial form state ──────────────────────────────────────────────────

  const emptyForm = (): FormState => ({
    osr_category_id: '',
    osr_sub_category_id: '',
    flat_type_id: '',
    startTime: '09:00',
    endTime: '17:00',
    mon: 0,
    tue: 0,
    wed: 0,
    thu: 0,
    fri: 0,
    sat: 0,
    sun: 0,
    active: 'Active',
  });

  const [formData, setFormData] = useState<FormState>(emptyForm());
  const [editFormData, setEditFormData] = useState<FormState>(emptyForm());

  // ── Load data ──────────────────────────────────────────────────────────────

  const loadCategories = useCallback(async () => {
    try {
      const res = await apiClient.get('/crm/admin/osr_setup.json');
      const cats = res.data?.osr_categories ?? [];
      const subs = res.data?.osr_sub_categories ?? [];
      setCategories(Array.isArray(cats) ? cats : []);
      setAllSubCategories(Array.isArray(subs) ? subs : []);
    } catch { /* silent */ }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/crm/admin/osr_schedules.json');
      const raw = res.data?.osr_schedules ?? [];
      setSchedules(Array.isArray(raw) ? raw : []);
    } catch {
      toast.error('Failed to load schedules.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    load();
  }, [loadCategories, load]);

  // ── Cascading fetches ───────────────────────────────────────────────────

  const fetchSubCategories = useCallback(async (categoryId: number, formSetter: typeof setFormData) => {
    setSubCatsLoading(true);
    setSubCategories([]);
    setSubCatFlats([]);
    formSetter(prev => ({ ...prev, osr_sub_category_id: '', flat_type_id: '' }));
    try {
      const res = await apiClient.get(`/get_osr_sub_categories.json?id=${categoryId}`);
      const raw = res.data?.osr_sub_categories ?? [];
      setSubCategories(Array.isArray(raw) ? raw : []);
    } catch {
      toast.error('Failed to load sub-categories.');
    } finally {
      setSubCatsLoading(false);
    }
  }, []);

  const fetchFlatTypes = useCallback(async (subCategoryId: number, formSetter: typeof setFormData) => {
    setFlatsLoading(true);
    setSubCatFlats([]);
    formSetter(prev => ({ ...prev, flat_type_id: '' }));
    try {
      const res = await apiClient.get(`/osr_subcat_flats.json?q[osr_sub_category_id_eq]=${subCategoryId}`);
      const raw = res.data?.flat_types ?? [];
      setSubCatFlats(Array.isArray(raw) ? raw : []);
    } catch {
      toast.error('Failed to load flat types.');
    } finally {
      setFlatsLoading(false);
    }
  }, []);

  // ── Category change handler ─────────────────────────────────────────────

  const handleCategoryChange = (val: string, form: FormState, setter: typeof setFormData) => {
    setter(prev => ({ ...prev, osr_category_id: val }));
    if (val) {
      fetchSubCategories(Number(val), setter);
    } else {
      setSubCategories([]);
      setSubCatFlats([]);
      setter(prev => ({ ...prev, osr_sub_category_id: '', flat_type_id: '' }));
    }
  };

  // ── Sub Category change handler ─────────────────────────────────────────

  const handleSubCategoryChange = (val: string, form: FormState, setter: typeof setFormData) => {
    setter(prev => ({ ...prev, osr_sub_category_id: val }));
    if (val) {
      fetchFlatTypes(Number(val), setter);
    } else {
      setSubCatFlats([]);
      setter(prev => ({ ...prev, flat_type_id: '' }));
    }
  };

  // ── Day number change ───────────────────────────────────────────────────

  const handleDayChange = (dayKey: keyof FormState, value: string, setter: typeof setFormData) => {
    const num = Math.min(2, Math.max(0, Number(value) || 0));
    setter(prev => ({ ...prev, [dayKey]: num }));
  };

  // ── Build payload ───────────────────────────────────────────────────────

  const buildPayload = (data: FormState) => ({
    osr_schedule: {
      osr_category_id: Number(data.osr_category_id),
      osr_sub_category_id: Number(data.osr_sub_category_id),
      start_hour: parseTime(data.startTime).hour,
      start_minute: parseTime(data.startTime).minute,
      end_hour: parseTime(data.endTime).hour,
      end_minute: parseTime(data.endTime).minute,
      mon: data.mon,
      tue: data.tue,
      wed: data.wed,
      thu: data.thu,
      fri: data.fri,
      sat: data.sat,
      sun: data.sun,
      active: data.active === 'Active' ? 1 : 0,
    },
  });

  // ── Validate ────────────────────────────────────────────────────────────

  const validate = (data: FormState) => {
    if (!data.osr_category_id || !data.osr_sub_category_id || !data.startTime || !data.endTime) {
      toast.error('Please fill in all required fields.');
      return false;
    }
    return true;
  };

  // ── Add ────────────────────────────────────────────────────────────────────

  const handleAdd = async () => {
    if (!validate(formData)) return;
    setSubmitting(true);
    try {
      await apiClient.post('/crm/admin/create_osr_schedule.json', buildPayload(formData));
      toast.success('Schedule added successfully.');
      setShowAddModal(false);
      setFormData(emptyForm());
      setSubCategories([]);
      setSubCatFlats([]);
      load();
    } catch {
      toast.error('Failed to add schedule.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Open Edit ──────────────────────────────────────────────────────────────

  const openEdit = async (entry: ScheduleEntry) => {
    setEditingId(entry.id);
    setEditFormData({
      osr_category_id: String(entry.osr_category_id),
      osr_sub_category_id: String(entry.osr_sub_category_id),
      flat_type_id: '',
      startTime: formatTime(entry.start_hour, entry.start_minute),
      endTime: formatTime(entry.end_hour, entry.end_minute),
      mon: entry.mon,
      tue: entry.tue,
      wed: entry.wed,
      thu: entry.thu,
      fri: entry.fri,
      sat: entry.sat,
      sun: entry.sun,
      active: entry.active === 1 ? 'Active' : 'Inactive',
    });
    setShowEditModal(true);

    // Cascade load: category -> subcategories -> flat types
    if (entry.osr_category_id) {
      await fetchSubCategories(entry.osr_category_id, setEditFormData);
      setEditFormData(prev => ({ ...prev, osr_sub_category_id: String(entry.osr_sub_category_id) }));
      if (entry.osr_sub_category_id) {
        await fetchFlatTypes(entry.osr_sub_category_id, setEditFormData);
      }
    }
  };

  // ── Update ─────────────────────────────────────────────────────────────────

  const handleUpdate = async () => {
    if (!validate(editFormData)) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/crm/admin/modify_osr_schedule.json?id=${editingId}`, buildPayload(editFormData));
      toast.success('Schedule updated successfully.');
      setShowEditModal(false);
      setEditingId(null);
      setSubCategories([]);
      setSubCatFlats([]);
      load();
    } catch {
      toast.error('Failed to update schedule.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (id: number) => {
    try {
      await apiClient.post(`/crm/admin/modify_osr_schedule.json?id=${id}`, { active: 0 });
      toast.success('Schedule deleted successfully.');
      load();
    } catch {
      toast.error('Failed to delete schedule.');
    }
  };

  // ── Status badge ─────────────────────────────────────────────────────────

  const getStatusBadge = (active: number) =>
    active === 1
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-600';

  // ── Sub Category name lookup ────────────────────────────────────────────

  const getSubCatName = (id: number) =>
    allSubCategories.find(s => s.id === id)?.name ?? `Sub #${id}`;

  // ── Get active day labels (for table display) ───────────────────────────

  const getActiveDays = (entry: ScheduleEntry) => {
    const days: string[] = [];
    const map: Record<string, number> = {
      mon: entry.mon, tue: entry.tue, wed: entry.wed, thu: entry.thu,
      fri: entry.fri, sat: entry.sat, sun: entry.sun,
    };
    DAY_LABELS.forEach((label, i) => {
      const key = DAY_KEYS[i];
      if (map[key] > 0) days.push(label);
    });
    return days;
  };

  // ── Schedule Form (shared between Add and Edit) ──────────────────────────

  const ScheduleForm = ({
    data,
    setData,
  }: {
    data: FormState;
    setData: typeof setFormData;
  }) => (
    <div className="space-y-5">
      {/* Row 1: Category + Sub Category */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <Select
            value={data.osr_category_id}
            onValueChange={val => handleCategoryChange(val, data, setData)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sub Category <span className="text-red-500">*</span>
          </label>
          <Select
            value={data.osr_sub_category_id}
            onValueChange={val => handleSubCategoryChange(val, data, setData)}
            disabled={!data.osr_category_id || subCatsLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={
                !data.osr_category_id ? 'Select Category first'
                : subCatsLoading ? 'Loading...'
                : 'Select Sub Category'
              } />
            </SelectTrigger>
            <SelectContent>
              {subCategories.map(sc => (
                <SelectItem key={sc.id} value={String(sc.id)}>{sc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Flat Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Flat Type</label>
        <Select
          value={data.flat_type_id}
          onValueChange={val => setData(prev => ({ ...prev, flat_type_id: val }))}
          disabled={!data.osr_sub_category_id || flatsLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={
              !data.osr_sub_category_id ? 'Select Sub Category first'
              : flatsLoading ? 'Loading...'
              : 'Select Flat Type'
            } />
          </SelectTrigger>
          <SelectContent>
            {subCatFlats.map(f => (
              <SelectItem key={f.flat_type_id} value={String(f.flat_type_id)}>
                {f.flat_type_name} (₹{f.price})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Row 2: Start Time + End Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Time <span className="text-red-500">*</span>
          </label>
          <Input
            type="time"
            value={data.startTime}
            onChange={e => setData(prev => ({ ...prev, startTime: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Time <span className="text-red-500">*</span>
          </label>
          <Input
            type="time"
            value={data.endTime}
            onChange={e => setData(prev => ({ ...prev, endTime: e.target.value }))}
          />
        </div>
      </div>

      {/* Days — Number inputs */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Days (0/1/2)</label>
        <div className="grid grid-cols-7 gap-2">
          {DAY_LABELS.map((label, i) => {
            const key = DAY_KEYS[i];
            return (
              <div key={label} className="flex flex-col items-center gap-1">
                <label className="text-xs text-gray-500 font-medium">{label}</label>
                <Input
                  type="number"
                  min={0}
                  max={2}
                  value={data[key]}
                  onChange={e => handleDayChange(key, e.target.value, setData)}
                  className="w-full text-center"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <Select
          value={data.active}
          onValueChange={val => setData(prev => ({ ...prev, active: val }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-0 space-y-0">
      {/* Page Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Schedule</h1>
      </div>

      {/* Enhanced Table */}
      <div className="p-4">
        <EnhancedTable
          data={schedules}
          columns={SCHEDULE_COLUMNS}
          storageKey="osr-schedule-page"
          searchPlaceholder="Search schedules..."
          enableExport={true}
          onExport={() => toast.info('Export')}
          onFilterClick={() => toast.info('Filter')}
          pagination={true}
          pageSize={10}
          loading={loading}
          emptyMessage="No schedules found."
          leftActions={
            <>{shouldShow("OSRSchedule", "create") && (
              <Button
                size="sm"
                onClick={() => { setFormData(emptyForm()); setSubCategories([]); setSubCatFlats([]); setShowAddModal(true); }}
                className="flex items-center gap-2 border-0 h-auto px-3 py-2 bg-[#C72030] text-white hover:bg-[#C72030]/90"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            )}</>
          }
          renderActions={(item) => {
            const entry = item as ScheduleEntry;
            return (
              <>
                {shouldShow("OSRSchedule", "update") && (
                  <button
                    className="p-1.5 rounded hover:bg-amber-50 transition-colors text-amber-500"
                    onClick={() => openEdit(entry)}
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="p-1.5 rounded hover:bg-red-50 transition-colors text-red-600" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this schedule? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(entry.id)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            );
          }}
          renderCell={(item, columnKey, index) => {
            const entry = item as ScheduleEntry;
            switch (columnKey) {
              case 'srNo':
                return <span className="text-gray-500">{index + 1}</span>;
              case 'osr_category_id':
                return (
                  <span className="font-semibold text-gray-900">
                    {categories.find(c => c.id === entry.osr_category_id)?.name ?? `Category #${entry.osr_category_id}`}
                  </span>
                );
              case 'subCategory':
                return (
                  <span className="text-gray-700">
                    {getSubCatName(entry.osr_sub_category_id)}
                  </span>
                );
              case 'startTime':
                return formatTime(entry.start_hour, entry.start_minute);
              case 'endTime':
                return formatTime(entry.end_hour, entry.end_minute);
              case 'days': {
                const activeDays = getActiveDays(entry);
                return activeDays.length > 0
                  ? <span title={activeDays.join(', ')}>{activeDays.join(', ')}</span>
                  : <span className="text-gray-400">—</span>;
              }
              case 'active':
                return (
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(entry.active)}`}>
                    {entry.active === 1 ? 'Active' : 'Inactive'}
                  </span>
                );
              default:
                return (item as any)[columnKey] ?? '—';
            }
          }}
        />
      </div>

      {/* ── Add Modal ─────────────────────────────────────────────────────── */}
      <Dialog open={showAddModal} onOpenChange={open => { setShowAddModal(open); if (!open) { setSubCategories([]); setSubCatFlats([]); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">Add Schedule</DialogTitle>
          </DialogHeader>
          <ScheduleForm data={formData} setData={setFormData} />
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={submitting}
              className="px-10 font-medium bg-[#C72030] text-white hover:bg-[#C72030]/90"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Modal ────────────────────────────────────────────────────── */}
      <Dialog open={showEditModal} onOpenChange={open => { setShowEditModal(open); if (!open) { setSubCategories([]); setSubCatFlats([]); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">Edit Schedule</DialogTitle>
          </DialogHeader>
          <ScheduleForm data={editFormData} setData={setEditFormData} />
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={submitting}
              className="px-10 font-medium bg-[#C72030] text-white hover:bg-[#C72030]/90"
            >
              {submitting ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OSRSchedulePage;
