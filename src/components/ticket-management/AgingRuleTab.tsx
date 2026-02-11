import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { getAuthHeader, getFullUrl } from '@/config/apiConfig';
import { toast } from 'sonner';
import { Edit, Trash2 } from 'lucide-react';

interface AgingRule {
  id: number;
  society_id: number;
  color_code: string;
  active: boolean | null;
}

export const AgingRuleTab: React.FC = () => {
  const [agingRules, setAgingRules] = useState<AgingRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedRuleType, setSelectedRuleType] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedColor, setSelectedColor] = useState('#000000');

  // Rule type options
  const ruleTypes = [
    { value: '<24', label: '< 24 Hours' },
    { value: '24-48', label: '24-48 Hours' },
    { value: '48-72', label: '48-72 Hours' },
    { value: '>72', label: '> 72 Hours' },
  ];

  // Unit options
  const units = [
    { value: 'hours', label: 'Hours' },
    { value: 'days', label: 'Days' },
  ];

  // Predefined colors
  const colorOptions = [
    '#00C853', // Green
    '#D50000', // Red
    '#304FFE', // Blue
    '#00B8D4', // Cyan
    '#FFC107', // Amber
    '#9C27B0', // Purple
    '#FF5722', // Deep Orange
    '#795548', // Brown
  ];

  // Fetch aging rules from consolidated API
  const fetchAgingRules = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(getFullUrl('/crm/admin/helpdesk_categories.json'), {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAgingRules(data.aging_rules || []);
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

  // Handle submit
  const handleSubmit = async () => {
    if (!selectedRuleType) {
      toast.error('Please select rule type');
      return;
    }
    if (!selectedUnit) {
      toast.error('Please select unit');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('aging_rule[color_code]', selectedColor);
      // Note: The API might need additional fields like rule_type and unit
      // Adjust based on actual API requirements

      const response = await fetch(
        getFullUrl('/crm/admin/helpdesk_categories/create_aging_rule.json'),
        {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeader(),
          },
          body: formData,
        }
      );

      if (response.ok) {
        toast.success('Aging rule created successfully!');
        setSelectedRuleType('');
        setSelectedUnit('');
        setSelectedColor('#000000');
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

  // Handle delete
  const handleDelete = async (rule: AgingRule) => {
    if (!confirm('Are you sure you want to delete this aging rule?')) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('aging_rule[active]', '0');

      const response = await fetch(
        getFullUrl(`/crm/admin/helpdesk_categories/update_aging_rule.json?id=${rule.id}`),
        {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeader(),
          },
          body: formData,
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
    { key: 'rule', label: 'Rule', sortable: true },
    { key: 'color', label: 'Color', sortable: false },
  ];

  const renderCell = (item: AgingRule, columnKey: string) => {
    const index = agingRules.findIndex(r => r.id === item.id);

    switch (columnKey) {
      case 'srno':
        return index + 1;
      case 'rule':
        // Map rule based on index or other logic
        return ruleTypes[index % ruleTypes.length]?.label || 'Rule';
      case 'color':
        return (
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded border border-gray-300"
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
      <Button variant="ghost" size="sm">
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Aging Rule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            {/* Rule Type Dropdown */}
            <div className="flex-1">
              <Select value={selectedRuleType} onValueChange={setSelectedRuleType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Rule Type" />
                </SelectTrigger>
                <SelectContent>
                  {ruleTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Unit Dropdown */}
            <div className="flex-1">
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Rule Unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color Picker Section */}
            <div className="flex-1 flex items-center gap-2">
              {/* Color Input */}
              <div className="relative">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  title="Choose color"
                />
              </div>

              {/* Color Palette */}
              <div className="flex gap-1">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-6 h-6 rounded border-2 transition-all ${
                      selectedColor === color
                        ? 'border-gray-800 scale-110'
                        : 'border-gray-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Add Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white px-8"
            >
              {isSubmitting ? 'Adding...' : 'Add'}
            </Button>
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
