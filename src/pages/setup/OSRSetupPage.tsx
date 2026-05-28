import React, { useState, useEffect, useCallback } from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { apiClient } from '@/utils/apiClient';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  id: number;
  name: string;
}

interface SubCategory {
  id: number;
  name: string;
  helpdesk_category_id: number;
  category_name?: string;
}

interface StatusItem {
  id: number;
  name: string;
  color_code?: string;
  active?: number;
}

// ─── Tab 1: Category ─────────────────────────────────────────────────────────

const CategoryTab: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editVal, setEditVal] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/crm/admin/osr_setup.json');
      const raw = res.data?.osr_categories ?? [];
      setCategories(Array.isArray(raw) ? raw : []);
    } catch {
      toast.error('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!inputVal.trim()) { toast.error('Please enter a category name.'); return; }
    setSubmitting(true);
    try {
      await apiClient.post('/crm/admin/create_osr_category.json', {
        name: inputVal.trim(),
        active: 1,
      });
      toast.success('Category added successfully.');
      setInputVal('');
      setAddOpen(false);
      load();
    } catch {
      toast.error('Failed to add category.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (cat: Category) => {
    setEditId(cat.id);
    setEditVal(cat.name);
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editVal.trim()) { toast.error('Please enter a category name.'); return; }
    setEditSubmitting(true);
    try {
      await apiClient.post('/crm/admin/modify_osr_category.json', {
        id: editId,
        name: editVal.trim(),
        active: 1,
      });
      toast.success('Category updated successfully.');
      setEditOpen(false);
      load();
    } catch {
      toast.error('Failed to update category.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/crm/admin/helpdesk_categories/${id}.json`);
      toast.success('Category deleted successfully.');
      load();
    } catch {
      toast.error('Failed to delete category.');
    }
  };

  const catColumns = [
    { key: 'srno',  label: 'S.No.',    sortable: false },
    { key: 'name',  label: 'Category', sortable: true  },
  ];

  const renderCatCell = (item: Category, columnKey: string, index: number) => {
    if (columnKey === 'srno') return index + 1;
    if (columnKey === 'name') return item.name;
    return '--';
  };

  const renderCatActions = (item: Category) => (
    <div className="flex gap-1">
      <Button variant="ghost" size="sm" onClick={() => openEdit(item)} className="hover:bg-amber-50">
        <Edit className="h-4 w-4 text-amber-500" />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="hover:bg-red-50">
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{item.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDelete(item.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <EnhancedTable
          data={categories}
          columns={catColumns}
          renderCell={renderCatCell}
          renderActions={renderCatActions}
          storageKey="osr-category-table"
          searchPlaceholder="Search categories..."
          enableSearch
          loading={loading}
          emptyMessage="No categories found."
          leftActions={
            <Button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1 bg-[#C72030] hover:bg-[#A61C28] text-white"
            >
              <Plus className="w-4 h-4" /> Add
            </Button>
          }
        />
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={open => { setAddOpen(open); if (!open) setInputVal(''); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Category Name <span className="text-red-500">*</span></Label>
              <Input
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder="Enter category name"
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => { setAddOpen(false); setInputVal(''); }}>Cancel</Button>
              <Button onClick={handleAdd} disabled={submitting} className="bg-[#C72030] hover:bg-[#A61C28] text-white px-8">
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Category Name</Label>
              <Input
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button
                onClick={handleUpdate}
                disabled={editSubmitting}
                className="bg-[#16A34A] hover:bg-[#15803D] text-white px-8"
              >
                {editSubmitting ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Flat type price keys for sub-category form ─────────────────────────────
const FLAT_TYPES = [
  { key: 'bhk_1',    label: '1 BHK price' },
  { key: 'bhk_2',    label: '2 BHK price' },
  { key: 'bhk_3',    label: '3 BHK price' },
  { key: 'bhk_4',    label: '4 BHK price' },
  { key: 'bhk_5',    label: '5 BHK price' },
  { key: 'bhk_45',   label: '4.5 BHK price' },
  { key: 'rk_1',     label: '1 RK price' },
  { key: 'rk_2',     label: '2 RK price' },
  { key: 'bhk_1_rk', label: '1 BHK RK price' },
] as const;

const INIT_PRICES = () =>
  Object.fromEntries(FLAT_TYPES.map(f => [f.key, ''])) as Record<string, string>;

// ─── Tab 2: Sub Category ─────────────────────────────────────────────────────

const SubCategoryTab: React.FC = () => {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCatId, setActiveCatId] = useState<number | 'all'>('all');

  // Add modal state
  const [addOpen, setAddOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [description, setDescription] = useState('');
  const [prices, setPrices] = useState<Record<string, string>>(INIT_PRICES());
  const [selectedCatId, setSelectedCatId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ category?: boolean; name?: boolean }>({});

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editVal, setEditVal] = useState('');
  const [editCatId, setEditCatId] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const res = await apiClient.get('/crm/admin/osr_setup.json');
      const raw = res.data?.osr_categories ?? [];
      setCategories(Array.isArray(raw) ? raw : []);
    } catch { /* silent */ }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/pms/admin/get_all_helpdesk_sub_categories.json', {
        params: { page: 1, per_page: 100, 'q[of_phase_eq]': 'post_possession' }
      });
      const raw = res.data?.helpdesk_sub_categories ?? res.data ?? [];
      setSubCategories(Array.isArray(raw) ? raw : []);
    } catch {
      toast.error('Failed to load sub-categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    load();
  }, [loadCategories, load]);

  const openAdd = () => {
    setInputVal('');
    setDescription('');
    setPrices(INIT_PRICES());
    setSelectedCatId('');
    setFormErrors({});
    setAddOpen(true);
  };

  const handleAdd = async () => {
    const errors = { category: !selectedCatId, name: !inputVal.trim() };
    setFormErrors(errors);
    if (errors.category || errors.name) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('helpdesk_sub_category[name]', inputVal.trim());
      formData.append('helpdesk_sub_category[helpdesk_category_id]', selectedCatId);
      formData.append('helpdesk_sub_category[of_phase]', 'post_possession');
      if (description.trim()) formData.append('helpdesk_sub_category[description]', description.trim());
      FLAT_TYPES.forEach(f => {
        if (prices[f.key]) formData.append(`helpdesk_sub_category[${f.key}]`, prices[f.key]);
      });
      await apiClient.post('/pms/admin/create_helpdesk_sub_category.json', formData);
      toast.success('Sub-category added successfully.');
      setAddOpen(false);
      load();
    } catch {
      toast.error('Failed to add sub-category.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (sc: SubCategory) => {
    setEditId(sc.id);
    setEditVal(sc.name);
    setEditCatId(String(sc.helpdesk_category_id));
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editVal.trim()) { toast.error('Please enter a name.'); return; }
    setEditSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('helpdesk_sub_category[name]', editVal.trim());
      formData.append('helpdesk_sub_category[helpdesk_category_id]', editCatId);
      formData.append('id', String(editId));
      formData.append('active', '1');
      await apiClient.post('/pms/admin/modify_helpdesk_sub_category.json', formData);
      toast.success('Sub-category updated successfully.');
      setEditOpen(false);
      load();
    } catch {
      toast.error('Failed to update sub-category.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.post('/pms/admin/modify_helpdesk_sub_category.json', { id: String(id), active: '0' });
      toast.success('Sub-category deleted successfully.');
      load();
    } catch {
      toast.error('Failed to delete sub-category.');
    }
  };

  // Filter sub-categories based on selected category pill
  const filteredSubs = activeCatId === 'all'
    ? subCategories
    : subCategories.filter(s => s.helpdesk_category_id === activeCatId);

  // Columns — hide Category column when a specific category is selected
  const scColumns = activeCatId === 'all'
    ? [
        { key: 'srno',          label: 'S.No.',       sortable: false },
        { key: 'category_name', label: 'Category',     sortable: true  },
        { key: 'name',          label: 'Sub Category', sortable: true  },
      ]
    : [
        { key: 'srno', label: 'S.No.',       sortable: false },
        { key: 'name', label: 'Sub Category', sortable: true  },
      ];

  const renderScCell = (item: SubCategory, columnKey: string, index: number) => {
    if (columnKey === 'srno') return index + 1;
    if (columnKey === 'category_name')
      return item.category_name ?? categories.find(c => c.id === item.helpdesk_category_id)?.name ?? '—';
    if (columnKey === 'name') return item.name;
    return '--';
  };

  const renderScActions = (item: SubCategory) => (
    <div className="flex gap-1">
      <Button variant="ghost" size="sm" onClick={() => openEdit(item)} className="hover:bg-amber-50">
        <Edit className="h-4 w-4 text-amber-500" />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="hover:bg-red-50">
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sub Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{item.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDelete(item.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return (
    <div className="space-y-4">

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <EnhancedTable
          data={filteredSubs}
          columns={scColumns}
          renderCell={renderScCell}
          renderActions={renderScActions}
          storageKey={`osr-sub-category-${activeCatId}`}
          searchPlaceholder="Search sub-categories..."
          enableSearch
          loading={loading}
          emptyMessage={activeCatId === 'all' ? 'No sub-categories found.' : 'No sub-categories for this category.'}
          leftActions={
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={openAdd}
                className="flex items-center gap-1 bg-[#F2EEE9] text-[#BF213E] border-0 hover:bg-[#F2EEE9]/80 h-auto px-3 py-2 text-sm font-medium shrink-0"
              >
                <Plus className="w-4 h-4" /> Add
              </Button>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => setActiveCatId('all')}
                  className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                    activeCatId === 'all'
                      ? 'bg-[#C72030] text-white border-[#C72030]'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-[#C72030] hover:text-[#C72030]'
                  }`}
                >
                  All ({subCategories.length})
                </button>
                {categories.map(cat => {
                  const count = subCategories.filter(s => s.helpdesk_category_id === cat.id).length;
                  const isActive = activeCatId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCatId(cat.id)}
                      className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                        isActive
                          ? 'bg-[#C72030] text-white border-[#C72030]'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-[#C72030] hover:text-[#C72030]'
                      }`}
                    >
                      {cat.name} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          }
        />
      </div>

      {/* Add Modal */}
      <Dialog open={addOpen} onOpenChange={open => { setAddOpen(open); if (!open) { setFormErrors({}); } }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Sub Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Row 1: Category + Name */}
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label>Category <span className="text-red-500">*</span></Label>
                <Select value={selectedCatId} onValueChange={v => { setSelectedCatId(v); setFormErrors(p => ({ ...p, category: false })); }}>
                  <SelectTrigger className={formErrors.category ? 'border-red-500 ring-1 ring-red-500' : ''}>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.category && <p className="text-xs text-red-500">Please select a category.</p>}
              </div>
              <div className="flex-1 space-y-1.5">
                <Label>Sub Category Name <span className="text-red-500">*</span></Label>
                <Input
                  value={inputVal}
                  onChange={e => { setInputVal(e.target.value); setFormErrors(p => ({ ...p, name: false })); }}
                  placeholder="Enter Sub Category"
                  className={formErrors.name ? 'border-red-500 ring-1 ring-red-500' : ''}
                  autoFocus
                />
                {formErrors.name && <p className="text-xs text-red-500">Please enter a sub-category name.</p>}
              </div>
            </div>

            {/* Row 2: Price grid + Description */}
            <div className="flex gap-4 items-start">
              <div className="flex-1 space-y-1.5">
                <Label>Prices by Flat Type</Label>
                <div className="grid grid-cols-3 gap-3">
                  {FLAT_TYPES.map(ft => (
                    <Input
                      key={ft.key}
                      value={prices[ft.key]}
                      onChange={e => setPrices(prev => ({ ...prev, [ft.key]: e.target.value }))}
                      placeholder={ft.label}
                      type="number"
                      min="0"
                    />
                  ))}
                </div>
              </div>
              <div className="w-56 space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Enter Description"
                  className="h-[136px] resize-none text-sm"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={submitting} className="bg-[#C72030] hover:bg-[#A61C28] text-white px-8">
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Sub Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={editCatId} onValueChange={setEditCatId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sub Category Name</Label>
              <Input value={editVal} onChange={e => setEditVal(e.target.value)} placeholder="Enter name" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button
                onClick={handleUpdate}
                disabled={editSubmitting}
                className="bg-[#16A34A] hover:bg-[#15803D] text-white px-8"
              >
                {editSubmitting ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Tab 3: Status ───────────────────────────────────────────────────────────

const StatusTab: React.FC = () => {
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [colorVal, setColorVal] = useState('#C72030');
  const [submitting, setSubmitting] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editVal, setEditVal] = useState('');
  const [editColor, setEditColor] = useState('#C72030');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/crm/admin/complaint_statuses.json');
      const raw = res.data?.complaint_statuses ?? res.data ?? [];
      setStatuses(Array.isArray(raw) ? raw : []);
    } catch {
      toast.error('Failed to load statuses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!inputVal.trim()) { toast.error('Please enter a status name.'); return; }
    setSubmitting(true);
    try {
      await apiClient.post('/crm/admin/helpdesk_categories/create_complaint_statuses.json', {
        complaint_status: { name: inputVal.trim(), color_code: colorVal, active: 1 }
      });
      toast.success('Status added successfully.');
      setInputVal('');
      setColorVal('#C72030');
      setAddOpen(false);
      load();
    } catch {
      toast.error('Failed to add status.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (s: StatusItem) => {
    setEditId(s.id);
    setEditVal(s.name);
    setEditColor(s.color_code ?? '#C72030');
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editVal.trim()) { toast.error('Please enter a status name.'); return; }
    setEditSubmitting(true);
    try {
      await apiClient.put(`/crm/admin/complaint_statuses/${editId}.json`, {
        complaint_status: { name: editVal.trim(), color_code: editColor }
      });
      toast.success('Status updated successfully.');
      setEditOpen(false);
      load();
    } catch {
      toast.error('Failed to update status.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/crm/admin/complaint_statuses/${id}.json`);
      toast.success('Status deleted successfully.');
      load();
    } catch {
      toast.error('Failed to delete status.');
    }
  };

  const stColumns = [
    { key: 'srno',       label: 'S.No.',  sortable: false },
    { key: 'name',       label: 'Status', sortable: true  },
    { key: 'color_code', label: 'Color',  sortable: false },
  ];

  const renderStCell = (item: StatusItem, columnKey: string, index: number) => {
    if (columnKey === 'srno') return index + 1;
    if (columnKey === 'name') return item.name;
    if (columnKey === 'color_code') {
      return (
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-5 h-5 rounded-full border border-gray-200 shrink-0"
            style={{ backgroundColor: item.color_code ?? '#C72030' }}
          />
          <span className="text-xs text-gray-500">{item.color_code}</span>
        </div>
      );
    }
    return '--';
  };

  const renderStActions = (item: StatusItem) => (
    <div className="flex gap-1">
      <Button variant="ghost" size="sm" onClick={() => openEdit(item)} className="hover:bg-amber-50">
        <Edit className="h-4 w-4 text-amber-500" />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="hover:bg-red-50">
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{item.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDelete(item.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <EnhancedTable
          data={statuses}
          columns={stColumns}
          renderCell={renderStCell}
          renderActions={renderStActions}
          storageKey="osr-status-table"
          searchPlaceholder="Search statuses..."
          enableSearch
          loading={loading}
          emptyMessage="No statuses found."
          leftActions={
            <Button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1 bg-[#C72030] hover:bg-[#A61C28] text-white"
            >
              <Plus className="w-4 h-4" /> Add
            </Button>
          }
        />
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={open => { setAddOpen(open); if (!open) { setInputVal(''); setColorVal('#C72030'); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Status</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Status Name <span className="text-red-500">*</span></Label>
              <Input
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder="Enter status name"
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colorVal}
                  onChange={e => setColorVal(e.target.value)}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer p-0.5"
                />
                <span className="text-sm text-gray-600">{colorVal}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => { setAddOpen(false); setInputVal(''); setColorVal('#C72030'); }}>Cancel</Button>
              <Button onClick={handleAdd} disabled={submitting} className="bg-[#C72030] hover:bg-[#A61C28] text-white px-8">
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Status Name</Label>
              <Input value={editVal} onChange={e => setEditVal(e.target.value)} placeholder="Enter status name" />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={editColor}
                  onChange={e => setEditColor(e.target.value)}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer p-0.5"
                />
                <span className="text-sm text-gray-600">{editColor}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button
                onClick={handleUpdate}
                disabled={editSubmitting}
                className="bg-[#16A34A] hover:bg-[#15803D] text-white px-8"
              >
                {editSubmitting ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const TRIGGER_CLASS =
  'group flex items-center gap-2 data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none font-semibold';

export const OSRSetupPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="bg-white px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">OSR Setup</h1>
      </div>

      <div className="p-6 space-y-6">
        <Tabs defaultValue="category" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200">
            <TabsTrigger value="category" className={TRIGGER_CLASS}>
              Category
            </TabsTrigger>
            <TabsTrigger value="sub-category" className={TRIGGER_CLASS}>
              Sub Category
            </TabsTrigger>
            <TabsTrigger value="status" className={TRIGGER_CLASS}>
              Status
            </TabsTrigger>
          </TabsList>

          <TabsContent value="category" className="mt-6">
            <CategoryTab />
          </TabsContent>
          <TabsContent value="sub-category" className="mt-6">
            <SubCategoryTab />
          </TabsContent>
          <TabsContent value="status" className="mt-6">
            <StatusTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      {/* <div className="py-4 flex justify-center border-t border-gray-200 bg-white">
        <span className="text-sm text-gray-600">
          Powered by <span className="font-semibold">LOCKATED</span>
        </span>
      </div> */}
    </div>
  );
};

export default OSRSetupPage;
