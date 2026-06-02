import React, { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { apiClient } from '@/utils/apiClient';
import ReactSelect from 'react-select';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LevelData {
  escalate_to: number[];
  p1: string;
  p2: string;
  p3: string;
  p4: string;
  p5: string;
}

interface FormData {
  osr_category_id: string;
  osr_sub_category_id: string;
  osr_staff_id: string;
  osr_status_id: string;
  e1: LevelData;
  e2: LevelData;
  e3: LevelData;
  e4: LevelData;
  e5: LevelData;
}

interface OsrEscalation {
  id?: number;
  name: string;
  escalate_to: string | number[];
  p1: number | null;
  p2: number | null;
  p3: number | null;
  p4: number | null;
  p5: number | null;
}

interface OcrAssignEntry {
  id: number;
  osr_category_id: number;
  osr_sub_category_id: number;
  osr_staff_id: number | null;
  osr_status_id: number | null;
  // list API may return either format
  osr_escalations?: OsrEscalation[];
  escalation_matrix?: Record<string, {
    name: string;
    p1: number | null;
    p2: number | null;
    p3: number | null;
    p4: number | null;
    p5: number | null;
    escalate_to: string | number[];
  }>;
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

interface OsrStatus {
  id: number;
  name: string;
  color_code?: string;
}

interface StaffOption {
  value: number;
  label: string;
}

const LEVELS = ['e1', 'e2', 'e3', 'e4', 'e5'] as const;
const LEVEL_LABELS: Record<string, string> = { e1: 'E1', e2: 'E2', e3: 'E3', e4: 'E4', e5: 'E5' };

const emptyLevel = (): LevelData => ({
  escalate_to: [],
  p1: '',
  p2: '',
  p3: '',
  p4: '',
  p5: '',
});

const emptyForm = (): FormData => ({
  osr_category_id: '',
  osr_sub_category_id: '',
  osr_staff_id: '',
  osr_status_id: '',
  e1: emptyLevel(),
  e2: emptyLevel(),
  e3: emptyLevel(),
  e4: emptyLevel(),
  e5: emptyLevel(),
});

// ─── Module-level form components (must live outside the main component so React ──────────────
// preserves their identity across renders — inline definitions cause full remount every render)

const PERIOD_LABELS = ['P1', 'P2', 'P3', 'P4', 'P5'];
const PERIOD_KEYS: ('p1' | 'p2' | 'p3' | 'p4' | 'p5')[] = ['p1', 'p2', 'p3', 'p4', 'p5'];

const LevelForm: React.FC<{
  data: FormData;
  setData: React.Dispatch<React.SetStateAction<FormData>>;
  staffOptions: StaffOption[];
}> = ({ data, setData, staffOptions }) => (
  <Table className="border">
    <TableHeader>
      <TableRow className="bg-gray-50">
        <TableHead className="font-semibold text-center border-r w-20">Level</TableHead>
        <TableHead className="font-semibold text-center border-r">Escalate To</TableHead>
        {PERIOD_LABELS.map(pl => (
          <TableHead key={pl} className="font-semibold text-center w-24">{pl} (mins)</TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {LEVELS.map(level => (
        <TableRow key={level} className="border-b">
          <TableCell className="font-medium text-center border-r">{LEVEL_LABELS[level]}</TableCell>
          <TableCell className="p-2 border-r">
            <ReactSelect
              isMulti
              options={staffOptions}
              value={staffOptions.filter(o => data[level].escalate_to.includes(o.value))}
              onChange={selected => setData(prev => ({
                ...prev,
                [level]: { ...prev[level], escalate_to: selected ? selected.map(s => s.value) : [] },
              }))}
              placeholder="Select staff..."
              className="min-w-[180px]"
              menuPlacement="auto"
              maxMenuHeight={150}
              styles={{
                control: base => ({ ...base, minHeight: '36px', fontSize: '13px', border: '1px solid #e5e7eb', boxShadow: 'none' }),
                multiValue: base => ({ ...base, fontSize: '11px' }),
              }}
            />
          </TableCell>
          {PERIOD_KEYS.map(pk => (
            <TableCell key={pk} className="p-2">
              <input
                type="number"
                min="0"
                value={data[level][pk]}
                onChange={e => setData(prev => ({
                  ...prev,
                  [level]: { ...prev[level], [pk]: e.target.value },
                }))}
                placeholder="0"
                className="w-full border border-gray-300 rounded px-2 py-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#C72030]"
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const SelectorRow: React.FC<{
  data: FormData;
  setData: React.Dispatch<React.SetStateAction<FormData>>;
  subCats: SubCategory[];
  subCatsLoading: boolean;
  onCategoryChange: (val: string) => void;
  categories: Category[];
  statuses: OsrStatus[];
}> = ({ data, setData, subCats, subCatsLoading, onCategoryChange, categories, statuses }) => (
  <div className="grid grid-cols-4 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Category <span className="text-red-500">*</span>
      </label>
      <Select value={data.osr_category_id} onValueChange={onCategoryChange}>
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
      <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label>
      <Select
        value={data.osr_sub_category_id}
        onValueChange={val => setData(prev => ({ ...prev, osr_sub_category_id: val }))}
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
          {subCats.map(sc => (
            <SelectItem key={sc.id} value={String(sc.id)}>{sc.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
      <Select
        value={data.osr_status_id}
        onValueChange={val => setData(prev => ({ ...prev, osr_status_id: val }))}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select Status" />
        </SelectTrigger>
        <SelectContent>
          {statuses.map(s => (
            <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export const OSRAssignEscalationPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [statuses, setStatuses] = useState<OsrStatus[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [rules, setRules] = useState<OcrAssignEntry[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Cascading subcategory state
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [subCatsLoading, setSubCatsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<FormData>(emptyForm());

  // Edit state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<FormData>(emptyForm());
  const [editSubCategories, setEditSubCategories] = useState<SubCategory[]>([]);
  const [editSubCatsLoading, setEditSubCatsLoading] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // ── Load data ──────────────────────────────────────────────────────────────

  const loadSetup = useCallback(async () => {
    try {
      const res = await apiClient.get('/crm/admin/osr_setup.json');
      const cats = res.data?.osr_categories ?? [];
      const sts = res.data?.osr_statuses ?? [];
      setCategories(Array.isArray(cats) ? cats : []);
      setStatuses(Array.isArray(sts) ? sts : []);
    } catch (err) {
      console.error('loadSetup failed:', err);
      toast.error('Failed to load categories/statuses.');
    }
  }, []);

  const loadStaff = useCallback(async () => {
    try {
      const res = await apiClient.get('/crm/admin/society_staffs.json');
      const raw = Array.isArray(res.data) ? res.data : res.data?.staffs ?? res.data?.staff ?? [];
      setStaffOptions(
        (Array.isArray(raw) ? raw : []).map((s: { id: number; name?: string; full_name?: string; first_name?: string; last_name?: string }) => ({
          value: s.id,
          label: s.full_name || s.name || `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || `Staff #${s.id}`,
        }))
      );
    } catch (err) {
      console.error('loadStaff failed:', err);
    }
  }, []);

  const loadRules = useCallback(async () => {
    setLoadingRules(true);
    try {
      const res = await apiClient.get('/crm/admin/create_osr_assign.json');
      const raw = res.data?.osr_assigns ?? (Array.isArray(res.data) ? res.data : []);
      setRules(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error('loadRules failed:', err);
      setRules([]);
    } finally {
      setLoadingRules(false);
    }
  }, []);

  useEffect(() => {
    loadSetup();
    loadStaff();
    loadRules();
  }, [loadSetup, loadStaff, loadRules]);

  // ── Cascading subcategories ────────────────────────────────────────────────

  const fetchSubCategories = useCallback(async (categoryId: number, setter: typeof setSubCategories, loadingSetter: typeof setSubCatsLoading, formSetter: typeof setFormData) => {
    loadingSetter(true);
    setter([]);
    formSetter(prev => ({ ...prev, osr_sub_category_id: '' }));
    try {
      const res = await apiClient.get(`/get_osr_sub_categories.json?id=${categoryId}`);
      const raw = res.data?.osr_sub_categories ?? [];
      setter(Array.isArray(raw) ? raw : []);
    } catch {
      toast.error('Failed to load sub-categories.');
    } finally {
      loadingSetter(false);
    }
  }, []);

  // ── Category change handler (add) ──────────────────────────────────────────

  const handleCategoryChange = (val: string) => {
    setFormData(prev => ({ ...prev, osr_category_id: val }));
    if (val) {
      fetchSubCategories(Number(val), setSubCategories, setSubCatsLoading, setFormData);
    } else {
      setSubCategories([]);
      setFormData(prev => ({ ...prev, osr_sub_category_id: '' }));
    }
  };

  // ── Category change handler (edit) ─────────────────────────────────────────

  const handleEditCategoryChange = (val: string) => {
    setEditFormData(prev => ({ ...prev, osr_category_id: val }));
    if (val) {
      fetchSubCategories(Number(val), setEditSubCategories, setEditSubCatsLoading, setEditFormData);
    } else {
      setEditSubCategories([]);
      setEditFormData(prev => ({ ...prev, osr_sub_category_id: '' }));
    }
  };

  // ── Build escalation matrix payload ─────────────────────────────────────────

  const buildEscalationMatrix = (data: FormData) => {
    const matrix: Record<string, Record<string, unknown>> = {};
    LEVELS.forEach(level => {
      matrix[level] = {
        name: LEVEL_LABELS[level],
        p1: data[level].p1 ? Number(data[level].p1) : null,
        p2: data[level].p2 ? Number(data[level].p2) : null,
        p3: data[level].p3 ? Number(data[level].p3) : null,
        p4: data[level].p4 ? Number(data[level].p4) : null,
        p5: data[level].p5 ? Number(data[level].p5) : null,
        escalate_to: data[level].escalate_to,
      };
    });
    return matrix;
  };

  // ── Build full payload ─────────────────────────────────────────────────────

  const buildPayload = (data: FormData) => ({
    osr_assign: {
      osr_category_id: Number(data.osr_category_id),
      osr_sub_category_id: Number(data.osr_sub_category_id),
      osr_staff_id: data.osr_staff_id ? Number(data.osr_staff_id) : null,
      osr_status_id: data.osr_status_id ? Number(data.osr_status_id) : null,
    },
    escalation_matrix: buildEscalationMatrix(data),
  });

  // ── Validate ───────────────────────────────────────────────────────────────

  const validate = (data: FormData) => {
    if (!data.osr_category_id) { toast.error('Please select a category.'); return false; }
    return true;
  };

  // ── Create ─────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!validate(formData)) return;
    setSubmitting(true);
    try {
      console.warn('OSR Create payload:', buildPayload(formData));
      const res = await apiClient.post('/crm/admin/create_osr_assign.json', buildPayload(formData));
      const newRule: OcrAssignEntry = res.data?.osr_assign ?? res.data;
      if (newRule?.id) {
        setRules(prev => [...prev, newRule]);
      }
      toast.success('Assign & Escalation created successfully.');
      setFormData(emptyForm());
      setSubCategories([]);
    } catch (err) {
      console.error('handleCreate failed:', err);
      toast.error('Failed to create assign & escalation.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Open Edit ──────────────────────────────────────────────────────────────

  const parseEscalateToIds = (raw: string | number[] | undefined): number[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as number[];
    try { return JSON.parse(raw as string); } catch { return []; }
  };

  const getEscalationEntry = (rule: OcrAssignEntry, levelKey: string) => {
    if (rule.osr_escalations?.length) {
      return rule.osr_escalations.find(e => e.name === LEVEL_LABELS[levelKey]) ?? null;
    }
    if (rule.escalation_matrix) {
      return rule.escalation_matrix[levelKey] ?? null;
    }
    return null;
  };

  const openEdit = async (entry: OcrAssignEntry) => {
    setEditingId(entry.id);

    const fd = emptyForm();
    fd.osr_category_id = String(entry.osr_category_id);
    fd.osr_sub_category_id = String(entry.osr_sub_category_id ?? '');
    fd.osr_staff_id = String(entry.osr_staff_id ?? '');
    fd.osr_status_id = String(entry.osr_status_id ?? '');

    LEVELS.forEach(level => {
      const m = getEscalationEntry(entry, level);
      if (m) {
        fd[level] = {
          escalate_to: parseEscalateToIds(m.escalate_to),
          p1: m.p1 != null ? String(m.p1) : '',
          p2: m.p2 != null ? String(m.p2) : '',
          p3: m.p3 != null ? String(m.p3) : '',
          p4: m.p4 != null ? String(m.p4) : '',
          p5: m.p5 != null ? String(m.p5) : '',
        };
      }
    });

    setEditFormData(fd);
    setIsEditOpen(true);

    // Cascade load subcategories
    if (entry.osr_category_id) {
      await fetchSubCategories(entry.osr_category_id, setEditSubCategories, setEditSubCatsLoading, setEditFormData);
      setEditFormData(prev => ({ ...prev, osr_sub_category_id: String(entry.osr_sub_category_id ?? '') }));
    }
  };

  // ── Update ─────────────────────────────────────────────────────────────────

  const handleUpdate = async () => {
    if (!validate(editFormData)) return;
    if (editingId === null) return;
    setEditSubmitting(true);
    try {
      console.warn('OSR Update payload:', buildPayload(editFormData));
      const res = await apiClient.post(`/crm/admin/update_osr_assign.json?id=${editingId}`, buildPayload(editFormData));
      const updated: OcrAssignEntry = res.data?.osr_assign ?? res.data;
      if (updated?.id) {
        setRules(prev => prev.map(r => r.id === updated.id ? updated : r));
      } else {
        // Fallback: update fields we know changed
        const payload = buildPayload(editFormData);
        setRules(prev => prev.map(r => r.id === editingId
          ? { ...r, ...payload.osr_assign, escalation_matrix: payload.escalation_matrix as OcrAssignEntry['escalation_matrix'] }
          : r
        ));
      }
      toast.success('Assign & Escalation updated successfully.');
      setIsEditOpen(false);
      setEditingId(null);
      setEditSubCategories([]);
    } catch (err) {
      console.error('handleUpdate failed:', err);
      toast.error('Failed to update assign & escalation.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (id: number) => {
    try {
      await apiClient.post(`/crm/admin/delete_osr_assign.json?id=${id}`);
      setRules(prev => prev.filter(r => r.id !== id));
      toast.success('Assign & Escalation deleted successfully.');
    } catch (err) {
      console.error('handleDelete failed:', err);
      toast.error('Failed to delete assign & escalation.');
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getCategoryName = (id: number) =>
    categories.find(c => c.id === id)?.name ?? `Category #${id}`;

  const getStatusName = (id: number) =>
    statuses.find(s => s.id === id)?.name ?? `Status #${id}`;

  const getStaffName = (id: number | null) => {
    if (!id) return '-';
    return staffOptions.find(s => s.value === id)?.label ?? `Staff #${id}`;
  };

  // ── Render rules list ──────────────────────────────────────────────────────

  const renderLevelBadge = (rule: OcrAssignEntry, levelLabel: string) => {
    const levelKey = Object.keys(LEVEL_LABELS).find(k => LEVEL_LABELS[k] === levelLabel) ?? '';
    const entry = getEscalationEntry(rule, levelKey);
    if (!entry) return { to: '-', time: '-' };
    const names = parseEscalateToIds(entry.escalate_to).map(id => getStaffName(id)).filter(Boolean).join(', ') || '-';
    const periods = [entry.p1, entry.p2, entry.p3, entry.p4, entry.p5].filter(p => p != null).join(' / ');
    return { to: names, time: periods || '-' };
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-0 space-y-0">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Assign &amp; Escalation Setup</h1>
      </div>

      <div className="p-6 space-y-6">
        {/* ── Create Form ─────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Create New Rule</h2>

          <SelectorRow
            data={formData}
            setData={setFormData}
            subCats={subCategories}
            subCatsLoading={subCatsLoading}
            onCategoryChange={handleCategoryChange}
            categories={categories}
            statuses={statuses}
          />

          <div className="mt-6">
            <LevelForm data={formData} setData={setFormData} staffOptions={staffOptions} />
          </div>

          <div className="mt-6 flex justify-center">
            <Button
              onClick={handleCreate}
              disabled={submitting}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white px-10 py-2 font-medium"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>

        {/* ── Rules List ──────────────────────────────────────── */}
        {loadingRules ? (
          <div className="text-center py-8 text-gray-500">Loading rules...</div>
        ) : rules.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No assign & escalation rules configured yet.</div>
        ) : (
          <div className="space-y-4">
            {rules.map((rule, idx) => (
              <div key={rule.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-200">
                  <span className="font-semibold text-[#C72030]">Rule #{idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <button
                      className="p-1.5 rounded hover:bg-amber-50 transition-colors text-amber-500"
                      onClick={() => openEdit(rule)}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="p-1.5 rounded hover:bg-red-50 transition-colors text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete Rule #{idx + 1}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(rule.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <Table className="border">
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold text-center border-r">Category</TableHead>
                        <TableHead className="font-semibold text-center border-r">Sub Category</TableHead>
                        <TableHead className="font-semibold text-center border-r">Assign Staff</TableHead>
                        <TableHead className="font-semibold text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-center border-r">{getCategoryName(rule.osr_category_id)}</TableCell>
                        <TableCell className="text-center border-r">{rule.osr_sub_category_id ? `Sub #${rule.osr_sub_category_id}` : '-'}</TableCell>
                        <TableCell className="text-center border-r">{getStaffName(rule.osr_staff_id)}</TableCell>
                        <TableCell className="text-center">{getStatusName(rule.osr_status_id ?? 0)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  <Table className="border">
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold text-center border-r w-20">Level</TableHead>
                        <TableHead className="font-semibold text-center border-r">Escalate To</TableHead>
                        <TableHead className="font-semibold text-center">Time Periods (mins)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.values(LEVEL_LABELS).map(label => {
                        const { to, time } = renderLevelBadge(rule, label);
                        return (
                          <TableRow key={label} className="border-b last:border-b-0">
                            <TableCell className="text-center font-medium border-r">{label}</TableCell>
                            <TableCell className="text-center border-r">{to}</TableCell>
                            <TableCell className="text-center">{time}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Edit Dialog ──────────────────────────────────────── */}
      <Dialog open={isEditOpen} onOpenChange={open => { setIsEditOpen(open); if (!open) { setEditSubCategories([]); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">Edit Assign &amp; Escalation Rule</DialogTitle>
          </DialogHeader>

          <SelectorRow
            data={editFormData}
            setData={setEditFormData}
            subCats={editSubCategories}
            subCatsLoading={editSubCatsLoading}
            onCategoryChange={handleEditCategoryChange}
            categories={categories}
            statuses={statuses}
          />

          <div className="mt-6">
            <LevelForm data={editFormData} setData={setEditFormData} staffOptions={staffOptions} />
          </div>

          <div className="flex justify-center gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={editSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={editSubmitting}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white px-10 font-medium"
            >
              {editSubmitting ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OSRAssignEscalationPage;
