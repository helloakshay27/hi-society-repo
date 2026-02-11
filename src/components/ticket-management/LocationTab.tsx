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

interface LocationItem {
  id: number;
  society_id?: number;
  society_location_id?: number;
  name: string;
  active: boolean | null;
  level?: number;
}

interface LocationData {
  society_locations: LocationItem[];
  pms_wings: LocationItem[];
  pms_areas: LocationItem[];
}

export const LocationTab: React.FC = () => {
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(1);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [level1Items, setLevel1Items] = useState<LocationItem[]>([]);
  const [level2Items, setLevel2Items] = useState<LocationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedLevel1, setSelectedLevel1] = useState('');
  const [selectedLevel2, setSelectedLevel2] = useState('');
  const [inputValue, setInputValue] = useState('');

  const levels: LocationLevel[] = [
    { level: 1, label: 'Level 1', placeholder: 'Enter Level 1' },
    { level: 2, label: 'Level 2', placeholder: 'Enter Level 2' },
    { level: 3, label: 'Level 3', placeholder: 'Enter Level 3' },
  ];

  // Fetch locations from consolidated API
  const fetchLocations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(getFullUrl('/crm/admin/helpdesk_categories.json'), {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: LocationData = await response.json();
        
        // Level 1: society_locations
        const level1Data = (data.society_locations || []).map(item => ({
          ...item,
          level: 1,
        }));
        setLevel1Items(level1Data);

        // Level 2: pms_wings
        const level2Data = (data.pms_wings || []).map(item => ({
          ...item,
          level: 2,
        }));
        setLevel2Items(level2Data);

        // Level 3: pms_areas
        const level3Data = (data.pms_areas || []).map(item => ({
          ...item,
          level: 3,
        }));

        // Set locations based on active level
        if (activeLevel === 1) {
          setLocations(level1Data);
        } else if (activeLevel === 2) {
          setLocations(level2Data);
        } else {
          setLocations(level3Data);
        }
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Failed to fetch locations');
    } finally {
      setIsLoading(false);
    }
  }, [activeLevel]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Handle level change
  const handleLevelChange = (level: 1 | 2 | 3) => {
    setActiveLevel(level);
    setSelectedLevel1('');
    setSelectedLevel2('');
    setInputValue('');
  };

  // Handle submit
  const handleSubmit = async () => {
    if (activeLevel === 2 && !selectedLevel1) {
      toast.error('Please select Level 1');
      return;
    }
    if (activeLevel === 3 && (!selectedLevel1 || !selectedLevel2)) {
      toast.error('Please select Level 1 and Level 2');
      return;
    }
    if (!inputValue.trim()) {
      toast.error(`Please enter ${levels[activeLevel - 1].label}`);
      return;
    }

    setIsSubmitting(true);
    try {
      let endpoint = '';
      const formData = new FormData();

      if (activeLevel === 1) {
        endpoint = '/crm/admin/helpdesk_categories/create_society_location.json';
        formData.append('society_location[name]', inputValue.trim());
      } else if (activeLevel === 2) {
        endpoint = '/crm/admin/helpdesk_categories/create_pms_wing.json';
        formData.append('pms_wing[name]', inputValue.trim());
        formData.append('pms_wing[society_location_id]', selectedLevel1);
      } else {
        endpoint = '/crm/admin/helpdesk_categories/create_pms_area.json';
        formData.append('pms_area[name]', inputValue.trim());
      }

      const response = await fetch(getFullUrl(endpoint), {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
        },
        body: formData,
      });

      if (response.ok) {
        toast.success(`${levels[activeLevel - 1].label} created successfully!`);
        setInputValue('');
        setSelectedLevel1('');
        setSelectedLevel2('');
        fetchLocations();
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || `Failed to create ${levels[activeLevel - 1].label}`);
      }
    } catch (error) {
      console.error('Error creating location:', error);
      toast.error(`Failed to create ${levels[activeLevel - 1].label}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (item: LocationItem) => {
    if (!confirm('Are you sure you want to delete this location?')) {
      return;
    }

    try {
      let endpoint = '';
      const formData = new FormData();

      if (item.level === 1) {
        endpoint = `/crm/admin/helpdesk_categories/update_society_location.json?id=${item.id}`;
        formData.append('society_location[active]', '0');
      } else if (item.level === 2) {
        endpoint = `/crm/admin/helpdesk_categories/update_pms_wing.json?id=${item.id}`;
        formData.append('pms_wing[active]', '0');
      } else {
        endpoint = `/crm/admin/helpdesk_categories/update_pms_area.json?id=${item.id}`;
        formData.append('pms_area[active]', '0');
      }

      const response = await fetch(getFullUrl(endpoint), {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
        },
        body: formData,
      });

      if (response.ok) {
        toast.success('Location deleted successfully!');
        fetchLocations();
      } else {
        toast.error('Failed to delete location');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Failed to delete location');
    }
  };

  // Get Level 1 name by ID
  const getLevel1Name = (locationId: number) => {
    const location = level1Items.find(item => item.id === locationId);
    return location?.name || '--';
  };

  // Get Level 2 name by ID
  const getLevel2Name = (wingId: number) => {
    const wing = level2Items.find(item => item.id === wingId);
    return wing?.name || '--';
  };

  // Table columns
  const getColumns = () => {
    const baseColumns = [
      { key: 'srno', label: 'Sr.No', sortable: false },
    ];

    if (activeLevel === 1) {
      return [
        ...baseColumns,
        { key: 'name', label: 'Level 1', sortable: true },
      ];
    } else if (activeLevel === 2) {
      return [
        ...baseColumns,
        { key: 'level1', label: 'Level 1', sortable: true },
        { key: 'name', label: 'Level 2', sortable: true },
      ];
    } else {
      return [
        ...baseColumns,
        { key: 'level1', label: 'Level 1', sortable: true },
        { key: 'level2', label: 'Level 2', sortable: true },
        { key: 'name', label: 'Level 3', sortable: true },
      ];
    }
  };

  const renderCell = (item: LocationItem, columnKey: string) => {
    const index = locations.findIndex(loc => loc.id === item.id);

    switch (columnKey) {
      case 'srno':
        return index + 1;
      case 'level1':
        if (activeLevel === 2) {
          return getLevel1Name(item.society_location_id || 0);
        } else if (activeLevel === 3) {
          // For level 3, we need to find the parent chain
          return '--'; // This would require additional parent tracking
        }
        return '--';
      case 'level2':
        return '--'; // Would need parent wing tracking
      case 'name':
        return item.name || '--';
      default:
        return '--';
    }
  };

  const renderActions = (item: LocationItem) => (
    <div className="flex gap-2">
      <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
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
          <div className="flex items-end gap-3">
            {/* Level 1 Dropdown (for Level 2 and 3) */}
            {activeLevel >= 2 && (
              <div className="flex-1">
                <Select value={selectedLevel1} onValueChange={setSelectedLevel1}>
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

            {/* Level 2 Dropdown (for Level 3) */}
            {activeLevel === 3 && (
              <div className="flex-1">
                <Select value={selectedLevel2} onValueChange={setSelectedLevel2}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Level 2" />
                  </SelectTrigger>
                  <SelectContent>
                    {level2Items
                      .filter(item => !selectedLevel1 || item.society_location_id === parseInt(selectedLevel1))
                      .map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Input Field */}
            <div className="flex-1">
              <Input
                placeholder={levels[activeLevel - 1].placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
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
          <CardTitle>{levels[activeLevel - 1].label}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Loading locations...</div>
            </div>
          ) : (
            <EnhancedTable
              data={locations}
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
