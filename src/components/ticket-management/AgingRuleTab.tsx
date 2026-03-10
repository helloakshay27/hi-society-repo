import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { getAuthHeader, getFullUrl } from '@/config/apiConfig';
import { toast } from 'sonner';
import { Edit, Trash2 } from 'lucide-react';

interface AgingRule {
  id: number;
  society_id: number;
  rule_type: string;
  rule_unit: string;
  value: number | null;
  from: number | null;
  to: number | null;
  from_in_minute: number | null;
  to_in_minute: number | null;
  value_in_minute: number | null;
  color_code: string;
  active: boolean | null;
  of_phase: string | null;
  of_atype: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  site_id: number | null;
}

// Rule type options (maps to API rule_type field)
const ruleTypeOptions = [
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'months', label: 'Months' },
];

// Rule unit options (maps to API rule_unit field)
const ruleUnitOptions = [
  { value: 'less_than', label: 'Less Than' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'equal', label: 'Equal' },
  { value: 'between', label: 'Between' },
  { value: 'Greater Than Equal', label: 'Greater Than Equal' },
  { value: 'Less Than Equal', label: 'Less Than Equal' },
];

// Predefined colors
const colorOptions = [
  '#00C853',
  '#D50000',
  '#304FFE',
  '#00B8D4',
  '#FFC107',
  '#9C27B0',
  '#FF5722',
  '#795548',
];

// Helper: format rule display label
const formatRuleLabel = (rule: AgingRule): string => {
  const type = ruleTypeOptions.find(r => r.value === rule.rule_type)?.label ?? rule.rule_type;
  const unit = ruleUnitOptions.find(r => r.value === rule.rule_unit)?.label ?? rule.rule_unit;
  if (rule.rule_unit === 'between') {
    return `${type} - ${unit} ${rule.from ?? ''} to ${rule.to ?? ''}`;
  }
  return `${type} - ${unit} ${rule.value ?? ''}`;
};

// Helper: check if rule_unit needs from/to (between) or single value
const isBetween = (unit: string) => unit === 'between';

interface FormState {
  rule_type: string;
  rule_unit: string;
  value: string;
  from: string;
  to: string;
  color_code: string;
}

const defaultForm: FormState = {
  rule_type: '',
  rule_unit: '',
  value: '',
  from: '',
  to: '',
  color_code: '#00C853',
};

export const AgingRuleTab: React.FC = () => {
  const [agingRules, setAgingRules] = useState<AgingRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add form state
  const [form, setForm] = useState<FormState>(defaultForm);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AgingRule | null>(null);
  const [editColor, setEditColor] = useState('#00C853');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Fetch aging rules
  const fetchAgingRules = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(getFullUrl('/crm/admin/aging_rule_index.json'), {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAgingRules(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching aging rules:', error);
      toast.error('Failed to fetch aging rules');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgingRules();
  }, [fetchAgingRules]);

  const updateForm = (key: keyof FormState, val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  // Handle create submit
  const handleSubmit = async () => {
    if (!form.rule_type) { toast.error('Please select rule type'); return; }
    if (!form.rule_unit) { toast.error('Please select rule unit'); return; }

    if (isBetween(form.rule_unit)) {
      if (!form.from || !form.to) { toast.error('Please enter From and To values'); return; }
    } else {
      if (!form.value) { toast.error('Please enter a value'); return; }
    }

    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        rule_type: form.rule_type,
        rule_unit: form.rule_unit,
        color_code: form.color_code,
        active: true,
      };

      if (isBetween(form.rule_unit)) {
        body.from = form.from;
        body.to = form.to;
      } else {
        body.value = form.value;
      }

      const response = await fetch(
        getFullUrl('/crm/admin/create_aging_rule.json'),
        {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ aging_rule: body }),
        }
      );

      if (response.ok) {
        toast.success('Aging rule created successfully!');
        setForm(defaultForm);
        fetchAgingRules();
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || 'Failed to create aging rule');
      }
    } catch (error) {
      console.error('Error creating aging rule:', error);
      toast.error('Failed to create aging rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit dialog
  const handleEdit = (rule: AgingRule) => {
    setEditingRule(rule);
    setEditColor(rule.color_code || '#00C853');
    setEditDialogOpen(true);
  };

  // Handle edit submit (only color_code per API spec)
  const handleEditSubmit = async () => {
    if (!editingRule) return;
    setIsEditSubmitting(true);
    try {
      const response = await fetch(
        getFullUrl('/crm/admin/update_aging_rule.json'),
        {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editingRule.id,
            color_code: editColor,
            active: true,
          }),
        }
      );

      if (response.ok) {
        toast.success('Aging rule updated successfully!');
        setEditDialogOpen(false);
        setEditingRule(null);
        fetchAgingRules();
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || 'Failed to update aging rule');
      }
    } catch (error) {
      console.error('Error updating aging rule:', error);
      toast.error('Failed to update aging rule');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (rule: AgingRule) => {
    if (!confirm('Are you sure you want to delete this aging rule?')) return;

    try {
      const response = await fetch(
        getFullUrl('/crm/admin/update_aging_rule.json'),
        {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: rule.id,
            color_code: rule.color_code,
            active: 0,
          }),
        }
      );

      if (response.ok) {
        toast.success('Aging rule deleted successfully!');
        fetchAgingRules();
      } else {
        toast.error('Failed to delete aging rule');
      }
    } catch (error) {
      console.error('Error deleting aging rule:', error);
      toast.error('Failed to delete aging rule');
    }
  };

  // Table columns
  const columns = [
    { key: 'srno', label: 'Sr.No', sortable: false },
    { key: 'rule_type', label: 'Rule Type', sortable: true },
    { key: 'rule_unit', label: 'Rule Unit', sortable: true },
    { key: 'rule_value', label: 'Value', sortable: false },
    { key: 'color', label: 'Color', sortable: false },
  ];

  const renderCell = (item: AgingRule, columnKey: string) => {
    const index = agingRules.findIndex(r => r.id === item.id);

    switch (columnKey) {
      case 'srno':
        return index + 1;
      case 'rule_type':
        return ruleTypeOptions.find(r => r.value === item.rule_type)?.label ?? item.rule_type ?? '--';
      case 'rule_unit':
        return ruleUnitOptions.find(r => r.value === item.rule_unit)?.label ?? item.rule_unit ?? '--';
      case 'rule_value':
        if (item.rule_unit === 'between') {
          return `${item.from ?? '--'} to ${item.to ?? '--'}`;
        }
        return item.value !== null ? String(item.value) : '--';
      case 'color':
        return (
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded border border-gray-300"
              style={{ backgroundColor: item.color_code }}
            />
            <span className="font-mono text-sm">{item.color_code}</span>
          </div>
        );
      default:
        return '--';
    }
  };

  const renderActions = (item: AgingRule) => (
    <div className="flex gap-2">
      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );

  const showBetween = isBetween(form.rule_unit);

  return (
    <div className="space-y-6">
      {/* Edit Color Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Aging Rule</DialogTitle>
          </DialogHeader>
          {editingRule && (
            <div className="py-2 space-y-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Rule:</span> {formatRuleLabel(editingRule)}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color Code</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                    title="Choose color"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditColor(color)}
                        className={`w-6 h-6 rounded border-2 transition-all ${
                          editColor === color
                            ? 'border-gray-800 scale-110'
                            : 'border-gray-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-2 font-mono text-sm text-gray-500">{editColor}</div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setEditDialogOpen(false); setEditingRule(null); }}
              disabled={isEditSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={isEditSubmitting}
              className="bg-[#C72030] hover:bg-[#a01828] text-white"
            >
              {isEditSubmitting ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Add Aging Rule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 flex-wrap">
            {/* Rule Type */}
            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm font-medium mb-1">Rule Type</label>
              <Select value={form.rule_type} onValueChange={(v) => updateForm('rule_type', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Rule Type" />
                </SelectTrigger>
                <SelectContent>
                  {ruleTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rule Unit */}
            <div className="flex-1 min-w-[160px]">
              <label className="block text-sm font-medium mb-1">Rule Unit</label>
              <Select value={form.rule_unit} onValueChange={(v) => updateForm('rule_unit', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Rule Unit" />
                </SelectTrigger>
                <SelectContent>
                  {ruleUnitOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Value or From/To */}
            {showBetween ? (
              <>
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-sm font-medium mb-1">From</label>
                  <Input
                    type="number"
                    placeholder="From"
                    value={form.from}
                    onChange={(e) => updateForm('from', e.target.value)}
                  />
                </div>
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-sm font-medium mb-1">To</label>
                  <Input
                    type="number"
                    placeholder="To"
                    value={form.to}
                    onChange={(e) => updateForm('to', e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 min-w-[120px]">
                <label className="block text-sm font-medium mb-1">Value</label>
                <Input
                  type="number"
                  placeholder="Enter value"
                  value={form.value}
                  onChange={(e) => updateForm('value', e.target.value)}
                />
              </div>
            )}

            {/* Color Picker */}
            <div className="flex-1 min-w-[220px]">
              <label className="block text-sm font-medium mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color_code}
                  onChange={(e) => updateForm('color_code', e.target.value)}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                  title="Choose color"
                />
                <div className="flex gap-1 flex-wrap">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => updateForm('color_code', color)}
                      className={`w-6 h-6 rounded border-2 transition-all ${
                        form.color_code === color
                          ? 'border-gray-800 scale-110'
                          : 'border-gray-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Add Button */}
            <div className="flex items-end">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white px-8"
              >
                {isSubmitting ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aging Rules</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Loading aging rules...</div>
            </div>
          ) : (
            <EnhancedTable
              data={agingRules}
              columns={columns}
              renderCell={renderCell}
              renderActions={renderActions}
              storageKey="aging-rules-table"
              enableSearch={true}
              searchPlaceholder="Search aging rules..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
