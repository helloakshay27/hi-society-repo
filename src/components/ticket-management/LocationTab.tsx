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
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { getAuthHeader, getFullUrl } from '@/config/apiConfig';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

interface LocationLevel {
  level: 1 | 2 | 3;
  label: string;
  placeholder: string;
}

interface SocietyLocation {
  id: number;
  name: string;
  society_id?: number;
  active: boolean | number | null;
  level?: number;
}

interface PmsWing {
  id: number;
  name: string;
  society_location_id?: number | null;
  building_id?: string | null;
  active: boolean | number | null;
  level?: number;
}

interface PmsArea {
  id: number;
  name: string;
  society_location_id?: number | null;
  wing_id?: string | null;
  active: boolean | number | null;
  level?: number;
}

type LocationItem = SocietyLocation | PmsWing | PmsArea;

export const LocationTab: React.FC = () => {
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(1);

  // Separate state for each level's data
  const [level1Items, setLevel1Items] = useState<SocietyLocation[]>([]);
  const [level2Items, setLevel2Items] = useState<PmsWing[]>([]);
  const [level3Items, setLevel3Items] = useState<PmsArea[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedLevel1, setSelectedLevel1] = useState('');
  const [selectedLevel2, setSelectedLevel2] = useState('');
  const [inputValue, setInputValue] = useState('');

  const levels: LocationLevel[] = [
    { level: 1, label: 'Level 1', placeholder: 'Enter Level 1 name' },
    { level: 2, label: 'Level 2', placeholder: 'Enter Level 2 name' },
    { level: 3, label: 'Level 3', placeholder: 'Enter Level 3 name' },
  ];

  // ─── Fetch Level 1 (society_locations) ───────────────────────────────────────
  const fetchLevel1 = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        getFullUrl('/crm/admin/fetch_pms_records.json?type=society_location'),
        { headers: { Authorization: getAuthHeader(), 'Content-Type': 'application/json' } }
      );
      if (response.ok) {
        const data = await response.json();
        setLevel1Items((data.society_locations || []).map((i: SocietyLocation) => ({ ...i, level: 1 })));
      } else {
        toast.error('Failed to fetch Level 1 data');
      }
    } catch {
      toast.error('Failed to fetch Level 1 data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Fetch Level 2 (pms_wings) ────────────────────────────────────────────────
  const fetchLevel2 = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        getFullUrl('/crm/admin/fetch_pms_records.json?type=pms_wing'),
        { headers: { Authorization: getAuthHeader(), 'Content-Type': 'application/json' } }
      );
      if (response.ok) {
        const data = await response.json();
        setLevel2Items((data.pms_wings || []).map((i: PmsWing) => ({ ...i, level: 2 })));
      } else {
        toast.error('Failed to fetch Level 2 data');
      }
    } catch {
      toast.error('Failed to fetch Level 2 data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Fetch Level 3 (pms_areas) ────────────────────────────────────────────────
  const fetchLevel3 = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        getFullUrl('/crm/admin/fetch_pms_records.json?type=pms_area'),
        { headers: { Authorization: getAuthHeader(), 'Content-Type': 'application/json' } }
      );
      if (response.ok) {
        const data = await response.json();
        setLevel3Items((data.pms_areas || []).map((i: PmsArea) => ({ ...i, level: 3 })));
      } else {
        toast.error('Failed to fetch Level 3 data');
      }
    } catch {
      toast.error('Failed to fetch Level 3 data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch all levels once on mount so dropdowns are always populated
  useEffect(() => {
    fetchLevel1();
    fetchLevel2();
    fetchLevel3();
  }, [fetchLevel1, fetchLevel2, fetchLevel3]);

  // Re-fetch current level's data when activeLevel changes
  const refetchCurrentLevel = useCallback(() => {
    if (activeLevel === 1) fetchLevel1();
    else if (activeLevel === 2) fetchLevel2();
    else fetchLevel3();
  }, [activeLevel, fetchLevel1, fetchLevel2, fetchLevel3]);

  // Handle level tab change
  const handleLevelChange = (level: 1 | 2 | 3) => {
    setActiveLevel(level);
    setSelectedLevel1('');
    setSelectedLevel2('');
    setInputValue('');
  };

  // Reset level2 selection when level1 changes
  const handleLevel1Change = (val: string) => {
    setSelectedLevel1(val);
    setSelectedLevel2('');
  };

  // Filtered level2 items for level3 dropdown (by selected level1)
  const filteredLevel2ForDropdown = selectedLevel1
    ? level2Items.filter(w => w.society_location_id === parseInt(selectedLevel1))
    : level2Items;

  // ─── Handle Add ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (activeLevel === 2 && !selectedLevel1) {
      toast.error('Please select Level 1');
      return;
    }
    if (activeLevel === 3 && !selectedLevel1) {
      toast.error('Please select Level 1');
      return;
    }
    if (activeLevel === 3 && !selectedLevel2) {
      toast.error('Please select Level 2');
      return;
    }
    if (!inputValue.trim()) {
      toast.error(`Please enter a name for ${levels[activeLevel - 1].label}`);
      return;
    }

    setIsSubmitting(true);
    try {
      let endpoint = '';
      let body: object = {};

      if (activeLevel === 1) {
        endpoint = '/crm/admin/create_society_location.json';
        body = { society_location: { name: inputValue.trim(), active: true } };
      } else if (activeLevel === 2) {
        endpoint = '/crm/admin/create_pms_wing.json';
        body = {
          pms_wing: {
            name: inputValue.trim(),
            society_location_id: parseInt(selectedLevel1),
            active: true,
          },
        };
      } else {
        endpoint = '/crm/admin/create_pms_area.json';
        body = {
          pms_area: {
            name: inputValue.trim(),
            society_location_id: parseInt(selectedLevel1),
            wing_id: parseInt(selectedLevel2),
          },
        };
      }

      const response = await fetch(getFullUrl(endpoint), {
        method: 'POST',
        headers: {
          Authorization: getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(`${levels[activeLevel - 1].label} created successfully!`);
        setInputValue('');
        setSelectedLevel1('');
        setSelectedLevel2('');
        refetchCurrentLevel();
        // Also re-fetch all so dropdowns stay fresh
        if (activeLevel === 1) fetchLevel1();
        if (activeLevel === 2) { fetchLevel2(); fetchLevel1(); }
        if (activeLevel === 3) { fetchLevel3(); fetchLevel2(); }
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || `Failed to create ${levels[activeLevel - 1].label}`);
      }
    } catch {
      toast.error(`Failed to create ${levels[activeLevel - 1].label}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Handle Delete (set active=false) ────────────────────────────────────────
  const handleDelete = async (item: LocationItem & { level?: number }) => {
    if (!confirm('Are you sure you want to delete this location?')) return;

    try {
      let endpoint = '';

      if (item.level === 1) {
        endpoint = `/crm/admin/delete_society_location/${item.id}.json`;
      } else {
        // Level 2 (pms_wing) and Level 3 (pms_area) both use the same delete endpoint
        endpoint = `/crm/admin/delete_pms_area/${item.id}.json`;
      }

      const response = await fetch(getFullUrl(endpoint), {
        method: 'POST',
        headers: {
          Authorization: getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Location deleted successfully!');
        refetchCurrentLevel();
      } else {
        toast.error('Failed to delete location');
      }
    } catch {
      toast.error('Failed to delete location');
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const getLevel1Name = (id?: number | null): string => {
    if (!id) return '--';
    return level1Items.find(i => i.id === id)?.name || '--';
  };

  const getLevel2Name = (wingId?: string | null): string => {
    if (!wingId) return '--';
    const numId = parseInt(wingId);
    return level2Items.find(i => i.id === numId)?.name || '--';
  };

  // ─── Table columns ───────────────────────────────────────────────────────────
  const getColumns = () => {
    const base = [{ key: 'srno', label: 'Sr.No', sortable: false }];
    if (activeLevel === 1) {
      return [...base, { key: 'name', label: 'Level 1 Name', sortable: true }];
    } else if (activeLevel === 2) {
      return [
        ...base,
        { key: 'level1', label: 'Level 1', sortable: true },
        { key: 'name', label: 'Level 2 Name', sortable: true },
      ];
    } else {
      return [
        ...base,
        { key: 'level1', label: 'Level 1', sortable: true },
        { key: 'level2', label: 'Level 2', sortable: true },
        { key: 'name', label: 'Level 3 Name', sortable: true },
      ];
    }
  };

  // Current list displayed in the table
  const currentLocations: LocationItem[] =
    activeLevel === 1 ? level1Items : activeLevel === 2 ? level2Items : level3Items;

  const renderCell = (item: LocationItem & { level?: number; society_location_id?: number | null; wing_id?: string | null }, columnKey: string) => {
    const index = currentLocations.findIndex(loc => loc.id === item.id);
    switch (columnKey) {
      case 'srno':
        return index + 1;
      case 'level1':
        return getLevel1Name(item.society_location_id);
      case 'level2':
        return getLevel2Name((item as PmsArea).wing_id);
      case 'name':
        return item.name || '--';
      default:
        return '--';
    }
  };

  const renderActions = (item: LocationItem & { level?: number }) => (
    <div className="flex gap-2">
      <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Add Form Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            {levels.map((level) => (
              <Button
                key={level.level}
                onClick={() => handleLevelChange(level.level)}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeLevel === level.level
                    ? 'bg-[#4A90E2] text-white hover:bg-[#357ABD]'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {level.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 flex-wrap">
            {/* Level 1 Dropdown — shown for Level 2 and Level 3 */}
            {activeLevel >= 2 && (
              <div className="flex-1 min-w-[180px]">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Level 1</label>
                <Select value={selectedLevel1} onValueChange={handleLevel1Change}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Level 1" />
                  </SelectTrigger>
                  <SelectContent>
                    {level1Items.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Level 2 Dropdown — shown only for Level 3 */}
            {activeLevel === 3 && (
              <div className="flex-1 min-w-[180px]">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Level 2</label>
                <Select value={selectedLevel2} onValueChange={setSelectedLevel2} disabled={!selectedLevel1}>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedLevel1 ? 'Select Level 2' : 'Select Level 1 first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredLevel2ForDropdown.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Name Input */}
            <div className="flex-1 min-w-[180px]">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                {levels[activeLevel - 1].label} Name
              </label>
              <Input
                placeholder={levels[activeLevel - 1].placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              />
            </div>

            {/* Add Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white px-8 self-end"
            >
              {isSubmitting ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>{levels[activeLevel - 1].label} List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : (
            <EnhancedTable
              data={currentLocations}
              columns={getColumns()}
              renderCell={renderCell}
              renderActions={renderActions}
              storageKey={`location-level-${activeLevel}-table`}
              enableSearch={true}
              searchPlaceholder={`Search ${levels[activeLevel - 1].label}...`}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
