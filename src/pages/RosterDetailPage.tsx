import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, MapPin, Building2, Clock, Users, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { API_CONFIG, getFullUrl, getAuthHeader } from '@/config/apiConfig';
import { RootState } from '@/store/store';

// Section card matching the Visitor Details page
const Section: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <Card className="w-full rounded-2xl border border-[rgba(26,26,24,.09)] bg-white px-6 py-5 shadow-none">
    <CardHeader className="px-0 pb-4 pt-0">
      <CardTitle className="flex items-center gap-3 text-[14px] font-semibold text-[#1A1A18]">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F4F0]">
          <Icon className="h-[14px] w-[14px] text-[#1A1A18]" />
        </div>
        <span>{title}</span>
      </CardTitle>
    </CardHeader>
    <CardContent className="px-0 pb-0 pt-0">{children}</CardContent>
  </Card>
);

const LABEL = 'text-[11px] font-medium text-[rgba(26,26,24,.48)] block mb-1';
const VALUE = 'text-[13.5px] font-medium text-[#1A1A18]';

// Types
interface FMUser {
  id: number;
  name: string;
  email?: string;
  department?: string;
}

interface Shift {
  id: number;
  start_hour: number;
  start_min: number;
  end_hour: number;
  end_min: number;
  timings: string;
  total_hour: number;
}

interface RosterTemplate {
  id: number;
  name: string;
  no_of_days: any[];
  allocation_type: string;
  roaster_type: 'Weekdays' | 'Weekends' | 'Recurring';
  start_date: string;
  end_date: string;
  created_by_id: number;
  resource_id: number;
  resource_type: string;
  department_id: number[] | number | null;
  user_shift_id: number;
  seat_type: string | null;
  active: boolean;
  seat_category_id: number;
  created_at: string;
  updated_at: string;
  // New fields from API response
  departments?: Array<{ id: number; name: string }>;
  employees?: Array<{ id: number; name: string; email: string }>;
  location?: string;
  shift?: string;
  created_by?: string;
}

export const RosterDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const rosterBasePath = location.pathname.startsWith("/smartsecure/roster")
    ? "/smartsecure/roster"
    : "/settings/account/roster";
  const isSmartSecureRoster = rosterBasePath === "/smartsecure/roster";

  // Redux state for site information
  const { selectedSite } = useSelector((state: RootState) => state.site);

  // Set document title
  useEffect(() => { 
    document.title = 'Roster Template Details'; 
  }, []);

  // Data states
  const [rosterTemplate, setRosterTemplate] = useState<RosterTemplate | null>(null);
  const [fmUsers, setFMUsers] = useState<FMUser[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Fetch data on component mount
  useEffect(() => {
    if (id) {
      fetchRosterTemplate();
      fetchFMUsers();
      fetchShifts();
      fetchCurrentLocation();
    }
  }, [id]);

  // Fetch Roster Template
  const fetchRosterTemplate = async () => {
    setLoading(true);
    try {
      const apiUrl = getFullUrl(
        isSmartSecureRoster
          ? `/spree/manage/user_roasters/${id}.json`
          : `/pms/admin/user_roasters/${id}.json`
      );
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': getAuthHeader()
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📝 Roster Template API Response:', data);
      setRosterTemplate({
        ...data,
        active: data.active !== undefined ? data.active : true,
      });
    } catch (error) {
      console.error('Error fetching roster template:', error);
      toast.error('Failed to load roster template details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch FM Users
  const fetchFMUsers = async () => {
    try {
      const apiUrl = getFullUrl(API_CONFIG.ENDPOINTS.FM_USERS);
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': getAuthHeader()
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Adapt the response to our expected format
      const users = data.fm_users || data.users || data.employees || data || [];
      setFMUsers(users.map((user: any) => ({
        id: user.id,
        name: user.name || user.full_name || `${user.firstname || ''} ${user.lastname || ''}`.trim(),
        email: user.email,
        department: user.department ? (user.department.department_name || user.department.name) : undefined
      })));
    } catch (error) {
      console.error('Error fetching FM Users:', error);
      setFMUsers([]);
    }
  };

  // Fetch Shifts from the API
  const fetchShifts = async () => {
    try {
      const apiUrl = getFullUrl('/pms/admin/user_shifts.json');
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': getAuthHeader()
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Shifts API Response:', data);

      // Adapt the response to our expected format
      const shiftsData = data.user_shifts || data.shifts || data || [];
      setShifts(shiftsData.map((shift: any) => ({
        id: shift.id,
        start_hour: shift.start_hour,
        start_min: shift.start_min,
        end_hour: shift.end_hour,
        end_min: shift.end_min,
        timings: shift.timings,
        total_hour: shift.total_hour
      })));
    } catch (error) {
      console.error('Error fetching shifts:', error);
      toast.error('Failed to load shifts');
      setShifts([]);
    }
  };

  // Fetch Current Location (from site context)
  const fetchCurrentLocation = async () => {
    try {
      // First try to get from Redux state
      if (selectedSite?.name) {
        setCurrentLocation(selectedSite.name);
        return;
      }

      // Fallback to localStorage
      const siteId = localStorage.getItem('selectedSiteId');
      const siteName = localStorage.getItem('selectedSiteName');
      const companyName = localStorage.getItem('selectedCompanyName');

      let locationName = 'Current Site';

      if (siteName && siteName !== 'null' && siteName !== '') {
        locationName = siteName;
      } else if (companyName && companyName !== 'null' && companyName !== '') {
        locationName = companyName;
      }

      // Try to get from DOM if localStorage doesn't have it
      if (locationName === 'Current Site') {
        const headerSiteElement = document.querySelector('[data-site-name]');
        if (headerSiteElement) {
          locationName = headerSiteElement.textContent?.trim() || 'Current Site';
        }
      }

      setCurrentLocation(locationName);
    } catch (error) {
      console.error('Error fetching current location:', error);
      setCurrentLocation('Current Site');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this roster template?')) {
      return;
    }

    try {
      const apiUrl = getFullUrl(
        isSmartSecureRoster
          ? `/spree/manage/user_roasters/${id}.json`
          : `/pms/admin/user_roasters/${id}.json`
      );
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete roster template');
      }

      toast.success('Roster template deleted successfully!');
      navigate(rosterBasePath);
    } catch (error) {
      console.error('Error deleting roster template:', error);
      toast.error('Failed to delete roster template');
    }
  };

  // Handle edit
  const handleEdit = () => {
    navigate(`${rosterBasePath}/edit/${id}`);
  };

  // Handle export
  const handleExport = () => {
    toast.success('Export functionality coming soon!');
  };

  // Helper functions
  const getSelectedEmployees = () => {
    if (!rosterTemplate) return [];
    
    // First try to get from new API response structure
    if (rosterTemplate.employees && Array.isArray(rosterTemplate.employees)) {
      return rosterTemplate.employees.map(emp => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        department: undefined // Department info not included in employee object
      }));
    }
    
    // Fallback to old structure
    if (!rosterTemplate.resource_id) return [];
    const employee = fmUsers.find(user => user.id === rosterTemplate.resource_id);
    return employee ? [employee] : [];
  };

  const getSelectedEmployee = () => {
    const employees = getSelectedEmployees();
    return employees.length > 0 ? employees[0] : null;
  };

  const getSelectedShift = () => {
    if (!rosterTemplate || !rosterTemplate.user_shift_id) return null;
    return shifts.find(shift => shift.id === rosterTemplate.user_shift_id);
  };

  const formatWorkingDays = () => {
    if (!rosterTemplate) return '';
    
    if (rosterTemplate.roaster_type === 'Weekdays') {
      return 'Monday - Friday';
    } else if (rosterTemplate.roaster_type === 'Weekends') {
      return 'Saturday - Sunday';
    } else if (rosterTemplate.roaster_type === 'Recurring') {
      // Parse recurring data from no_of_days
      if (rosterTemplate.no_of_days && Array.isArray(rosterTemplate.no_of_days) && rosterTemplate.no_of_days.length > 0) {
        const recurringData = rosterTemplate.no_of_days[0];
        const totalDays = Object.keys(recurringData).reduce((acc, weekNum) => {
          return acc + recurringData[weekNum].length;
        }, 0);
        return `${totalDays} custom days across ${Object.keys(recurringData).length} weeks`;
      }
      return 'Custom recurring pattern';
    }
    return 'Not specified';
  };

  const getWeekSelectionDisplay = () => {
    if (!rosterTemplate || !rosterTemplate.no_of_days) return [];
    
    if (rosterTemplate.roaster_type === 'Recurring') {
      if (Array.isArray(rosterTemplate.no_of_days) && rosterTemplate.no_of_days.length > 0) {
        const recurringData = rosterTemplate.no_of_days[0];
        return Object.keys(recurringData).map(weekNum => `Week ${weekNum}`);
      }
    } else if (rosterTemplate.roaster_type === 'Weekdays') {
      if (Array.isArray(rosterTemplate.no_of_days)) {
        return rosterTemplate.no_of_days.map((weekNum: string) => 
          `${weekNum}${weekNum === '1' ? 'st' : weekNum === '2' ? 'nd' : weekNum === '3' ? 'rd' : 'th'} Week`
        );
      }
    } else if (rosterTemplate.roaster_type === 'Weekends') {
      if (Array.isArray(rosterTemplate.no_of_days)) {
        return rosterTemplate.no_of_days.map((weekendNum: string) => 
          `${weekendNum}${weekendNum === '1' ? 'st' : weekendNum === '2' ? 'nd' : weekendNum === '3' ? 'rd' : 'th'} Weekend`
        );
      }
    }
    return [];
  };

  const getCustomWorkingDays = () => {
    if (!rosterTemplate || rosterTemplate.roaster_type !== 'Recurring' || !rosterTemplate.no_of_days) return [];
    
    if (Array.isArray(rosterTemplate.no_of_days) && rosterTemplate.no_of_days.length > 0) {
      const recurringData = rosterTemplate.no_of_days[0];
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const customDays: string[] = [];
      
      Object.keys(recurringData).forEach(weekNum => {
        const dayNumbers = recurringData[weekNum];
        dayNumbers.forEach((dayNum: string) => {
          const dayName = dayNames[parseInt(dayNum) - 1];
          if (dayName) {
            customDays.push(`Week ${weekNum} - ${dayName}`);
          }
        });
      });
      
      return customDays;
    }
    return [];
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C72030] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading roster template details...</p>
        </div>
      </div>
    );
  }

  if (!rosterTemplate) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Roster template not found</p>
          <Button onClick={() => navigate(rosterBasePath)} variant="outline">
            Back to Roster Management
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-[#FDFDFB] space-y-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(rosterBasePath)}
          className="mb-4 flex items-center gap-1.5 text-[12.5px] font-semibold text-[rgba(26,26,24,.48)] transition-colors hover:text-[#1A1A18]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Roster List
        </button>

        <div className="my-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="mb-2 text-[22px] font-semibold text-[#1A1A18]" style={{ letterSpacing: '-0.015em', lineHeight: 1.2 }}>Roster Template Details</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[rgba(26,26,24,.48)]">Template Name:</span>
                <span className="font-semibold text-[#1A1A18]">{rosterTemplate.name || '--'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-[rgba(26,26,24,.48)]">Location:</span>
                <span className="font-semibold text-[#1A1A18]">{rosterTemplate.location || currentLocation}</span>
              </div>
              <Badge className={rosterTemplate.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {rosterTemplate.active ? 'ACTIVE' : 'INACTIVE'}
              </Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleEdit}
              className="min-h-[42px] rounded-lg !bg-[#1A1A18] px-[22px] text-[13px] font-semibold !text-white hover:!bg-[#12100E]"
              style={{ backgroundColor: '#1A1A18', color: '#FFFFFF' }}
            >
              <Edit className="w-4 h-4 mr-2" style={{ color: '#FFFFFF' }} />
              <span style={{ color: '#FFFFFF' }}>Edit</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Basic Information */}
        <Section title="Basic Information" icon={Calendar}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className={LABEL}>Template Name</label>
              <p className={VALUE}>{rosterTemplate.name}</p>
            </div>
            <div>
              <label className={LABEL}>Roster Type</label>
              <p className={VALUE}>{rosterTemplate.allocation_type}</p>
            </div>
            <div>
              <label className={LABEL}>Status</label>
              <Badge className={rosterTemplate.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {rosterTemplate.active ? 'ACTIVE' : 'INACTIVE'}
              </Badge>
            </div>
          </div>
        </Section>

        {/* Working Days */}
        <Section title="Working Days Configuration" icon={Calendar}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={LABEL}>Day Type</label>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-[#da7756]"></span>
                  <span className={VALUE}>{rosterTemplate.roaster_type}</span>
                  <span className="text-sm text-gray-500">({formatWorkingDays()})</span>
                </div>
              </div>
              <div>
                <label className={LABEL}>Frequency</label>
                <div className="flex flex-wrap gap-2">
                  {getWeekSelectionDisplay().map((week, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 bg-[#1A1A18] text-white text-xs rounded-md"
                    >
                      {week}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {rosterTemplate.roaster_type === 'Recurring' && getCustomWorkingDays().length > 0 && (
              <div>
                <label className={LABEL}>Custom Days Selected</label>
                <div className="flex flex-wrap gap-2">
                  {getCustomWorkingDays().map((day, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 bg-[#F5F4F0] text-[#1A1A18] text-xs rounded-md border border-[rgba(26,26,24,.09)]"
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Location */}
        <Section title="Location" icon={MapPin}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={LABEL}>Location</label>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className={VALUE}>{rosterTemplate.location || currentLocation}</span>
              </div>
            </div>
          </div>
        </Section>

        {/* Shift & Employees */}
        <Section title="Shift & Employees" icon={Clock}>
          <div className="space-y-6">
            <div>
              <label className={LABEL}>Assigned Shift</label>
              {(rosterTemplate.shift || getSelectedShift()) && (
                <div className="flex items-center gap-2 p-3 bg-[#F5F4F0] border border-[rgba(26,26,24,.09)] rounded-lg">
                  <Clock className="w-4 h-4 text-[#da7756]" />
                  <span className={VALUE}>
                    {rosterTemplate.shift || getSelectedShift()?.timings}
                  </span>
                  {getSelectedShift()?.total_hour && (
                    <span className="text-sm text-gray-600">
                      ({getSelectedShift()?.total_hour}h)
                    </span>
                  )}
                </div>
              )}
              {!rosterTemplate.shift && !getSelectedShift() && (
                <p className="text-gray-500 italic">No shift assigned</p>
              )}
            </div>

            <div>
              <label className={LABEL}>
                Assigned Employees ({getSelectedEmployees().length})
              </label>
              {getSelectedEmployees().length > 0 ? (
                <div className="space-y-2">
                  {getSelectedEmployees().map((employee, index) => (
                    <div key={employee.id || index} className="flex items-center gap-3 p-3 bg-white border border-[rgba(26,26,24,.09)] rounded-lg">
                      <Users className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <div className="text-[13.5px] font-medium text-[#1A1A18]">{employee.name || 'No name available'}</div>
                        <div className="text-sm text-gray-600">{employee.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No employees assigned</p>
              )}
            </div>
          </div>
        </Section>

        {/* Date Range */}
        <Section title="Date Range" icon={Calendar}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={LABEL}>Start Date</label>
              <p className={VALUE}>{new Date(rosterTemplate.start_date).toLocaleDateString()}</p>
            </div>
            <div>
              <label className={LABEL}>End Date</label>
              <p className={VALUE}>{new Date(rosterTemplate.end_date).toLocaleDateString()}</p>
            </div>
          </div>
        </Section>

    
      </div>
    </div>
  );
};
