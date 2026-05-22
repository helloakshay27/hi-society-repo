import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { ColumnConfig } from '@/hooks/useEnhancedTable';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScheduleEntry {
  id: number;
  categoryType: string;
  subCategory: string;
  frequency: string;
  days: string[];
  startTime: string;
  endTime: string;
  maxCapacity: number;
  price: number;
  status: string;
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CATEGORY_TYPES = ['Pets Spa', 'Pest Control', 'Deep Cleaning', 'Invisible Grill', 'Civil & Mason Works'];
const SUB_CATEGORIES: Record<string, string[]> = {
  'Pets Spa': ['Full Body Bath', 'Clam Massage', 'Nail Trimming', 'Hair Cut'],
  'Pest Control': ['Standard Cockroach Control', '4D Cockroach Control', 'Termite Treatment'],
  'Deep Cleaning': ['Bathroom Cleaning', 'Sofa Cleaning', 'Kitchen Cleaning'],
  'Invisible Grill': ['Residential Apartment', 'Commercial'],
  'Civil & Mason Works': ['Grouting Of Tiles', 'Wall Plastering'],
};
const FREQUENCIES = ['Daily', 'Weekly', 'Monthly'];
const STATUSES = ['Active', 'Inactive'];

const emptyForm = () => ({
  categoryType: '',
  subCategory: '',
  frequency: '',
  days: [] as string[],
  startTime: '',
  endTime: '',
  maxCapacity: '',
  price: '',
  status: 'Active',
});

// ─── Sample Data ─────────────────────────────────────────────────────────────

const sampleSchedules: ScheduleEntry[] = [
  { id: 1, categoryType: 'Pets Spa', subCategory: 'Full Body Bath', frequency: 'Weekly', days: ['Mon', 'Wed', 'Fri'], startTime: '09:00', endTime: '11:00', maxCapacity: 5, price: 1500, status: 'Active' },
  { id: 2, categoryType: 'Pest Control', subCategory: 'Standard Cockroach Control', frequency: 'Monthly', days: ['Sat'], startTime: '10:00', endTime: '13:00', maxCapacity: 8, price: 2000, status: 'Active' },
  { id: 3, categoryType: 'Deep Cleaning', subCategory: 'Bathroom Cleaning', frequency: 'Weekly', days: ['Tue', 'Thu', 'Sat'], startTime: '08:00', endTime: '12:00', maxCapacity: 4, price: 1200, status: 'Inactive' },
  { id: 4, categoryType: 'Invisible Grill', subCategory: 'Residential Apartment', frequency: 'Daily', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], startTime: '09:00', endTime: '17:00', maxCapacity: 3, price: 5000, status: 'Active' },
  { id: 5, categoryType: 'Pets Spa', subCategory: 'Clam Massage', frequency: 'Weekly', days: ['Mon', 'Wed'], startTime: '11:00', endTime: '13:00', maxCapacity: 6, price: 800, status: 'Active' },
];

// ─── Table Columns ─────────────────────────────────────────────────────────

const SCHEDULE_COLUMNS: ColumnConfig[] = [
  { key: 'srNo',        label: 'Sr No',        sortable: false, hideable: false },
  { key: 'categoryType', label: 'Category Type', sortable: true },
  { key: 'subCategory',  label: 'Sub Category',  sortable: true },
  { key: 'frequency',    label: 'Frequency',     sortable: true },
  { key: 'days',         label: 'Days',          sortable: false },
  { key: 'startTime',    label: 'Start Time',    sortable: true },
  { key: 'endTime',      label: 'End Time',      sortable: true },
  { key: 'maxCapacity',  label: 'Max Capacity',  sortable: true },
  { key: 'price',        label: 'Price (₹)',     sortable: true },
  { key: 'status',       label: 'Status',        sortable: true },
];

// ─── Main Page ───────────────────────────────────────────────────────────────

export const OSRSchedulePage: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>(sampleSchedules);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm());
  const [editFormData, setEditFormData] = useState(emptyForm());
  const [submitting, setSubmitting] = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const toggleDay = (day: string, form: typeof formData, setter: React.Dispatch<React.SetStateAction<typeof formData>>) => {
    setter(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day],
    }));
  };

  // ── Add ──────────────────────────────────────────────────────────────────

  const handleAdd = () => {
    if (!formData.categoryType || !formData.subCategory || !formData.frequency || !formData.startTime || !formData.endTime) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (formData.frequency === 'Weekly' && formData.days.length === 0) {
      toast.error('Please select at least one day for weekly frequency.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const newEntry: ScheduleEntry = {
        id: Date.now(),
        categoryType: formData.categoryType,
        subCategory: formData.subCategory,
        frequency: formData.frequency,
        days: formData.days,
        startTime: formData.startTime,
        endTime: formData.endTime,
        maxCapacity: Number(formData.maxCapacity) || 0,
        price: Number(formData.price) || 0,
        status: formData.status,
      };
      setSchedules(prev => [newEntry, ...prev]);
      setFormData(emptyForm());
      setShowAddModal(false);
      setSubmitting(false);
      toast.success('Schedule added successfully!');
    }, 500);
  };

  // ── Edit ─────────────────────────────────────────────────────────────────

  const handleEditOpen = (entry: ScheduleEntry) => {
    setEditingId(entry.id);
    setEditFormData({
      categoryType: entry.categoryType,
      subCategory: entry.subCategory,
      frequency: entry.frequency,
      days: [...entry.days],
      startTime: entry.startTime,
      endTime: entry.endTime,
      maxCapacity: String(entry.maxCapacity),
      price: String(entry.price),
      status: entry.status,
    });
    setShowEditModal(true);
  };

  const handleUpdate = () => {
    if (!editFormData.categoryType || !editFormData.subCategory || !editFormData.startTime || !editFormData.endTime) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSchedules(prev =>
        prev.map(s =>
          s.id === editingId
            ? { ...s, ...editFormData, maxCapacity: Number(editFormData.maxCapacity), price: Number(editFormData.price) }
            : s
        )
      );
      setShowEditModal(false);
      setEditingId(null);
      setSubmitting(false);
      toast.success('Schedule updated successfully!');
    }, 500);
  };

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = (id: number) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    toast.success('Schedule deleted successfully!');
  };

  // ── Status badge ─────────────────────────────────────────────────────────

  const getStatusBadge = (status: string) =>
    status === 'Active'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-600';

  // ── Schedule Form (shared between Add and Edit) ───────────────────────────

  const ScheduleForm = ({
    data,
    setData,
  }: {
    data: typeof formData;
    setData: React.Dispatch<React.SetStateAction<typeof formData>>;
  }) => (
    <div className="space-y-5">
      {/* Row 1: Category Type + Sub Category */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category Type <span className="text-red-500">*</span>
          </label>
          <Select
            value={data.categoryType}
            onValueChange={val => setData(prev => ({ ...prev, categoryType: val, subCategory: '' }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Category Type" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_TYPES.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sub Category Type <span className="text-red-500">*</span>
          </label>
          <Select
            value={data.subCategory}
            onValueChange={val => setData(prev => ({ ...prev, subCategory: val }))}
            disabled={!data.categoryType}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={data.categoryType ? 'Select Sub Category' : 'Select Category first'} />
            </SelectTrigger>
            <SelectContent>
              {(SUB_CATEGORIES[data.categoryType] || []).map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 2: Frequency + Status */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Frequency <span className="text-red-500">*</span>
          </label>
          <Select
            value={data.frequency}
            onValueChange={val => setData(prev => ({ ...prev, frequency: val, days: [] }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Frequency" />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map(f => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <Select
            value={data.status}
            onValueChange={val => setData(prev => ({ ...prev, status: val }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Days (shown for Weekly frequency) */}
      {data.frequency === 'Weekly' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Days <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day, data, setData)}
                className={`px-3 py-1.5 text-sm font-medium rounded border transition-colors ${
                  data.days.includes(day)
                    ? 'bg-[#C72030] text-white border-[#C72030]'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-[#C72030] hover:text-[#C72030]'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Row 3: Start Time + End Time */}
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

      {/* Row 4: Max Capacity + Price */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity</label>
          <Input
            type="number"
            min="1"
            placeholder="e.g. 5"
            value={data.maxCapacity}
            onChange={e => setData(prev => ({ ...prev, maxCapacity: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
          <Input
            type="number"
            min="0"
            placeholder="e.g. 1500"
            value={data.price}
            onChange={e => setData(prev => ({ ...prev, price: e.target.value }))}
          />
        </div>
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
          emptyMessage="No schedules found."
          leftActions={
            <Button
              size="sm"
              onClick={() => { setFormData(emptyForm()); setShowAddModal(true); }}
              className="flex items-center gap-2 bg-[#F2EEE9] text-[#BF213E] border-0 hover:bg-[#F2EEE9]/80 h-auto px-3 py-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          }
          renderActions={(item) => (
            <>
              <button
                className="p-1.5 rounded hover:bg-amber-50 transition-colors text-amber-500"
                onClick={() => handleEditOpen(item as ScheduleEntry)}
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
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
                      onClick={() => handleDelete((item as ScheduleEntry).id)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          renderCell={(item, columnKey, index) => {
            const entry = item as ScheduleEntry;
            switch (columnKey) {
              case 'srNo':
                return <span className="text-gray-500">{index + 1}</span>;
              case 'categoryType':
                return <span className="font-semibold text-gray-900">{entry.categoryType}</span>;
              case 'days':
                return entry.days.length > 0
                  ? <span title={entry.days.join(', ')}>{entry.days.join(', ')}</span>
                  : <span className="text-gray-400">—</span>;
              case 'price':
                return `₹${entry.price.toLocaleString()}`;
              case 'status':
                return (
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(entry.status)}`}>
                    {entry.status}
                  </span>
                );
              default:
                return (item as any)[columnKey] ?? '—';
            }
          }}
        />
      </div>

      {/* Footer */}
      <div className="py-4 flex justify-center border-t border-gray-200 bg-white">
        <span className="text-sm text-gray-600">
          Powered by <span className="font-semibold">LOCKATED</span>
        </span>
      </div>

      {/* ── Add Modal ─────────────────────────────────────────────────────── */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              className="bg-[#16A34A] hover:bg-[#15803D] text-white px-10 font-medium"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Modal ────────────────────────────────────────────────────── */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              className="bg-[#16A34A] hover:bg-[#15803D] text-white px-10 font-medium"
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

