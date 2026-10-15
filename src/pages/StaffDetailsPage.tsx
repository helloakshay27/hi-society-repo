
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Printer, ArrowLeft, Loader2, ChevronDown, ChevronUp, User, MapPin, Calendar, FileText, Image, QrCode, Plus, X } from 'lucide-react';
import { staffService, SocietyStaffDetails } from '@/services/staffService';
import { StaffFilterOption } from '@/services/staffService';
import { toast } from 'sonner';
import { getFullUrl, getAuthHeader } from '@/config/apiConfig';

export const StaffDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<SocietyStaffDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Verify number modal state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Associate Flat state
  const [showFlatModal, setShowFlatModal] = useState(false);
  const [towers, setTowers] = useState<StaffFilterOption[]>([]);
  const [flats, setFlats] = useState<StaffFilterOption[]>([]);
  const [loadingTowers, setLoadingTowers] = useState(false);
  const [loadingFlats, setLoadingFlats] = useState(false);
  const [selectedTower, setSelectedTower] = useState('');
  const [selectedFlat, setSelectedFlat] = useState('');
  const [savingFlat, setSavingFlat] = useState(false);
  const [associatedFlats, setAssociatedFlats] = useState<Array<{ id?: number | null; block_no: string | null; flat_no: string; display: string; flat_id?: number | null }>>([]);

  // State for expandable sections
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    workInfo: true,
    scheduleInfo: true,
    qrInfo: true,
    associateFlat: true
  });

  // Helper function to check if value has data
  const hasData = (value: unknown) => {
    return value && value !== null && value !== undefined && value !== '';
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Fetch staff details
  useEffect(() => {
    const fetchStaffDetails = async () => {
      if (!id) {
        setError('Staff ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const staffData = await staffService.getStaffDetails(id);
        setStaff(staffData);
        setAssociatedFlats(staffData.associated_flats || []);
      } catch (err) {
        console.error('Error fetching staff details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load staff details');
      } finally {
        setLoading(false);
      }
    };

    fetchStaffDetails();
  }, [id]);

  // Loading state
  if (loading) {
    return (
      <div className="p-4 sm:p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C72030] mx-auto mb-4"></div>
          <p>Loading staff details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !staff) {
    return (
      <div className="p-4 sm:p-6 min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="text-red-800 font-medium">Error loading staff details</div>
          <div className="text-red-600 text-sm mt-1">{error || 'Staff not found'}</div>
          <div className="flex gap-2 mt-3">
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-[#C72030] hover:bg-[#A01828] !text-white"
              size="sm"
            >
              Retry
            </Button>
            <Button 
              onClick={() => navigate('/smartsecure/staff')}
              variant="outline"
              size="sm"
            >
              Back to Staff List
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    navigate(`/smartsecure/staff/edit/${staff.id}`);
  };

  const handlePrint = async () => {
    if (!staff) return;
    setIsPrinting(true);
    try {
      await staffService.printQRCodes([staff.id]);
    } catch {
      // error toast handled inside printQRCodes
    } finally {
      setIsPrinting(false);
    }
  };

  const handleVerifyNumber = async () => {
    if (staff?.number_verified) {
      toast.info('Number is already verified');
      return;
    }

    setSendingOTP(true);
    try {
      // First send OTP
      await staffService.sendStaffOTP(staff.id);
      
      // Then show the OTP input modal
      setShowVerifyModal(true);
    } catch (error) {
      console.error('Error sending OTP:', error);
      // Error is already handled in the service with toast
    } finally {
      setSendingOTP(false);
    }
  };

  const handleVerifySubmit = async () => {
    if (!staff || !otp.trim()) {
      toast.error('Please enter a valid OTP');
      return;
    }

    setVerifying(true);
    try {
      await staffService.verifyStaffNumber(staff.id, otp.trim());
      
      // Refresh staff data to get updated verification status
      const updatedStaff = await staffService.getStaffDetails(staff.id.toString());
      setStaff(updatedStaff);
      
      setShowVerifyModal(false);
      setOtp('');
      toast.success('Number verified successfully!');
    } catch (error) {
      console.error('Error verifying number:', error);
      // Error is already handled in the service with toast
    } finally {
      setVerifying(false);
    }
  };

  const handleCloseVerifyModal = () => {
    setShowVerifyModal(false);
    setOtp('');
  };

  // Associate Flat handlers
  const loadTowers = async () => {
    setLoadingTowers(true);
    try {
      const response = await fetch(getFullUrl('/crm/admin/staff_filters.json'), {
        headers: { Authorization: getAuthHeader() },
      });
      if (response.ok) {
        const data = await response.json();
        setTowers(data.towers || []);
      }
    } catch {
      toast.error('Failed to load tower options');
    } finally {
      setLoadingTowers(false);
    }
  };

  const loadFlats = async (towerId: string) => {
    setLoadingFlats(true);
    setFlats([]);
    setSelectedFlat('');
    try {
      const response = await fetch(
        getFullUrl(`/crm/admin/staff_filters.json?q[society_staff_staff_workings_society_flat_society_block_id_eq]=${towerId}`),
        { headers: { Authorization: getAuthHeader() } }
      );
      if (response.ok) {
        const data = await response.json();
        setFlats(data.flats || []);
      }
    } catch {
      toast.error('Failed to load flat options');
    } finally {
      setLoadingFlats(false);
    }
  };

  const handleOpenFlatModal = async () => {
    setShowFlatModal(true);
    setSelectedTower('');
    setSelectedFlat('');
    setFlats([]);
    await loadTowers();
  };

  const handleAddFlat = async () => {
    if (!selectedFlat) {
      toast.error('Please select a flat');
      return;
    }
    if (!staff) return;
    setSavingFlat(true);
    try {
      const flatOption = flats.find(f => String(f.value) === selectedFlat);
      const towerOption = towers.find(t => String(t.value) === selectedTower);
      const display = flatOption
        ? towerOption
          ? `${towerOption.label} - ${flatOption.label}`
          : String(flatOption.label)
        : selectedFlat;
      const response = await fetch(getFullUrl('/staff_workings.json'), {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staff_id: staff.id,
          flat_id: Number(selectedFlat),
          society_block_id_in: selectedTower ? [Number(selectedTower)] : [],
        }),
      });
      if (response.ok) {
        const result = await response.json();
        const newFlat = {
          id: result?.id ?? result?.staff_working?.id ?? null,
          block_no: towerOption?.label ? String(towerOption.label) : null,
          flat_no: String(flatOption?.label || selectedFlat),
          display,
          flat_id: Number(selectedFlat),
        };
        setAssociatedFlats(prev => [...prev, newFlat]);
        setShowFlatModal(false);
        toast.success('Flat associated successfully!');
      } else {
        throw new Error('Failed to associate flat');
      }
    } catch {
      toast.error('Failed to associate flat. Please try again.');
    } finally {
      setSavingFlat(false);
    }
  };

  const handleRemoveFlat = async (index: number) => {
    if (!staff) return;
    const flat = associatedFlats[index];
    if (!flat?.id) {
      toast.error('Cannot remove flat: missing working ID');
      return;
    }
    try {
      const response = await fetch(
        getFullUrl(`/staff_workings_destroy?id=${flat.id}`),
        {
          method: 'GET',
          headers: { Authorization: getAuthHeader() },
        }
      );
      if (response.ok) {
        setAssociatedFlats(prev => prev.filter((_, i) => i !== index));
        toast.success('Flat removed successfully!');
      } else {
        throw new Error('Failed to remove flat');
      }
    } catch {
      toast.error('Failed to remove flat. Please try again.');
    }
  };

  // Filter flats by selected tower
  const handleTowerChange = (towerId: string) => {
    setSelectedTower(towerId);
    if (towerId) {
      loadFlats(towerId);
    } else {
      setFlats([]);
      setSelectedFlat('');
    }
  };

  const handleResendOTP = async () => {
    if (!staff) return;

    setSendingOTP(true);
    try {
      await staffService.sendStaffOTP(staff.id);
      toast.success('OTP resent successfully!');
    } catch (error) {
      console.error('Error resending OTP:', error);
      // Error is already handled in the service with toast
    } finally {
      setSendingOTP(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (hour: string | number | null, minute: string | number | null) => {
    if (hour === null || hour === undefined || minute === null || minute === undefined) return '00:00';
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  // Expandable Section Component (Card layout, same as Visitor Details)
  const ExpandableSection = ({
    title,
    icon: Icon,
    isExpanded,
    onToggle,
    children,
    hasData = true
  }: {
    title: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    hasData?: boolean;
  }) => (
    <Card className="mb-4 w-full rounded-2xl border border-[rgba(26,26,24,.09)] bg-white px-6 py-5 shadow-none">
      <CardHeader
        onClick={onToggle}
        className="cursor-pointer p-0 pb-4"
      >
        <CardTitle className="flex items-center justify-between gap-3 text-[14px] font-semibold text-[#1A1A18]">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F4F0]">
              <Icon className="h-[14px] w-[14px] text-[#1A1A18]" />
            </div>
            <span>{title}</span>
          </div>
          <div className="flex items-center gap-2">
            {!hasData && (
              <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">No data</span>
            )}
            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
          </div>
        </CardTitle>
      </CardHeader>
      {isExpanded && <CardContent className="p-0">{children}</CardContent>}
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFB] p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/smartsecure/staff')}
          className="mb-4 flex items-center gap-1.5 text-[12.5px] font-semibold text-[rgba(26,26,24,.48)] transition-colors hover:text-[#1A1A18]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Staff List
        </button>

        <div className="my-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="mb-2 text-[22px] font-semibold text-[#1A1A18]" style={{ letterSpacing: '-0.015em', lineHeight: 1.2 }}>Staff Details</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[rgba(26,26,24,.48)]">Staff Name:</span>
                <span className="font-semibold text-[#1A1A18]">{staff.full_name || '--'}</span>
              </div>
              {hasData(staff.soc_staff_id) && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[rgba(26,26,24,.48)]">Staff ID:</span>
                  <span className="font-semibold text-[#1A1A18]">{staff.soc_staff_id}</span>
                </div>
              )}
              {hasData(staff.status_text) && (
                <Badge
                  className={
                    staff.status_text === 'Approved'
                      ? 'bg-green-100 text-green-800'
                      : staff.status_text === 'Pending'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-red-100 text-red-800'
                  }
                >
                  {String(staff.status_text).toUpperCase()}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleEdit}
              variant="outline"
              size="icon"
              aria-label="Edit staff details"
              title="Edit staff details"
              className="h-12 w-12 rounded-[8px] !border-[#1a1a1814] bg-white p-0 text-[rgba(26,26,24,.68)] shadow-none hover:bg-[#F5F4F0] hover:text-[#1A1A18]"
            >
              <Edit className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Section 1: Basic Information */}
      <ExpandableSection
        title="Basic Information"
        icon={User}
        isExpanded={expandedSections.basicInfo}
        onToggle={() => toggleSection('basicInfo')}
        hasData={hasData(staff.full_name) || hasData(staff.email) || hasData(staff.mobile)}
      >
        {/* Centered Image and Name */}
        <div className="mb-6 flex items-center justify-start gap-4">
          <img
            src={staff.staff_image_url || '/placeholder.svg'}
            alt="Staff profile"
            className="h-16 w-16 rounded-xl border border-[rgba(26,26,24,.12)] object-cover"
          />
          <div>
            <h3 className="mb-1 text-[15px] font-semibold text-[#1A1A18]">{staff.full_name}</h3>
            <p className="text-[12px] text-[rgba(26,26,24,.48)]">{staff.work_type_name}</p>
          </div>
        </div>

        {/* Two Column Grid for Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-4">
            {hasData(staff.full_name) && (
              <div className="flex min-w-0 flex-col items-start gap-1">
                <span className="text-[11px] font-medium text-[rgba(26,26,24,.48)]">Name</span>
                <span className="text-[13.5px] font-medium text-[#1A1A18]">{staff.full_name}</span>
              </div>
            )}
            
            {hasData(staff.email) && (
              <div className="flex min-w-0 flex-col items-start gap-1">
                <span className="text-[11px] font-medium text-[rgba(26,26,24,.48)]">Email</span>
                <span className="break-all text-[13.5px] font-medium text-[#1A1A18]">{staff.email}</span>
              </div>
            )}
            
            {hasData(staff.mobile) && (
              <div className="flex min-w-0 flex-col items-start gap-1">
                <span className="text-[11px] font-medium text-[rgba(26,26,24,.48)]">Mobile</span>
                <span className="text-[13.5px] font-medium text-[#1A1A18]">{staff.mobile}</span>
              </div>
            )}
            
            {hasData(staff.vendor_name) && (
              <div className="flex min-w-0 flex-col items-start gap-1">
                <span className="text-[11px] font-medium text-[rgba(26,26,24,.48)]">Company Name</span>
                <span className="text-[13.5px] font-medium text-[#1A1A18]">{staff.vendor_name}</span>
              </div>
            )}
            
            {hasData(staff.soc_staff_id) && (
              <div className="flex min-w-0 flex-col items-start gap-1">
                <span className="text-[11px] font-medium text-[rgba(26,26,24,.48)]">Staff ID</span>
                <span className="text-[13.5px] font-medium text-[#1A1A18]">{staff.soc_staff_id}</span>
              </div>
            )}
            
            {hasData(staff.valid_from) && (
              <div className="flex min-w-0 flex-col items-start gap-1">
                <span className="text-[11px] font-medium text-[rgba(26,26,24,.48)]">Valid From</span>
                <span className="text-[13.5px] font-medium text-[#1A1A18]">{formatDate(staff.valid_from)}</span>
              </div>
            )}

            {hasData(staff.expiry) && (
              <div className="flex min-w-0 flex-col items-start gap-1">
                <span className="text-[11px] font-medium text-[rgba(26,26,24,.48)]">Valid Till</span>
                <span className="text-[13.5px] font-medium text-[#1A1A18]">{formatDate(staff.expiry!)}</span>
              </div>
            )}

             {hasData(staff.status_text) && (
              <div className="flex min-w-0 flex-col items-start gap-1">
                <span className="text-[11px] font-medium text-[rgba(26,26,24,.48)]">Status</span>
                <div className="flex-1">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    staff.status_text === 'Approved' ? 'bg-green-100 text-green-800' :
                    staff.status_text === 'Pending' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {staff.status_text}
                  </span>
                </div>
              </div>
            )}

            {hasData(staff.blocked_by_user_name) && (
              <div className="flex min-w-0 flex-col items-start gap-1">
                <span className="text-[11px] font-medium text-[rgba(26,26,24,.48)]">Blocked By</span>
                <span className="text-[13.5px] font-medium text-[#1A1A18]">{staff.blocked_by_user_name}</span>
              </div>
            )}

            {hasData(staff.block_reason) && (
              <div className="flex min-w-0 flex-col items-start gap-1">
                <span className="text-[11px] font-medium text-[rgba(26,26,24,.48)]">Block Reason</span>
                <span className="text-[13.5px] font-medium text-[#1A1A18]">{staff.block_reason}</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
           
            
            {hasData(staff.department_name) && (
              <div className="flex min-w-0 flex-col items-start gap-1">
                <span className="text-[11px] font-medium text-[rgba(26,26,24,.48)]">Department</span>
                <span className="text-[13.5px] font-medium text-[#1A1A18]">{staff.department_name}</span>
              </div>
            )}
            
            {hasData(staff.unit_name) && (
              <div className="flex min-w-0 flex-col items-start gap-1">
                <span className="text-[11px] font-medium text-[rgba(26,26,24,.48)]">Unit</span>
                <span className="text-[13.5px] font-medium text-[#1A1A18]">{staff.unit_name}</span>
              </div>
            )}
            
            {hasData(staff.work_type_name) && (
              <div className="flex min-w-0 flex-col items-start gap-1">
                <span className="text-[11px] font-medium text-[rgba(26,26,24,.48)]">Work Type</span>
                <span className="text-[13.5px] font-medium text-[#1A1A18]">{staff.work_type_name}</span>
              </div>
            )}

            {hasData(staff.staff_type) && (
              <div className="flex min-w-0 flex-col items-start gap-1">
                <span className="text-[11px] font-medium text-[rgba(26,26,24,.48)]">Staff Type</span>
                <span className="text-[13.5px] font-medium text-[#1A1A18]">{staff.staff_type}</span>
              </div>
            )}

            {hasData(staff.associate_function_name) && (
              <div className="flex min-w-0 flex-col items-start gap-1">
                <span className="text-[11px] font-medium text-[rgba(26,26,24,.48)]">Association Type</span>
                <span className="text-[13.5px] font-medium text-[#1A1A18] capitalize">{staff.associate_function_name}</span>
              </div>
            )}
            
            {hasData(staff.created_at) && (
              <div className="flex min-w-0 flex-col items-start gap-1">
                <span className="text-[11px] font-medium text-[rgba(26,26,24,.48)]">Created On</span>
                <span className="text-[13.5px] font-medium text-[#1A1A18]">{formatDate(staff.created_at)}</span>
              </div>
            )}
            
            {/* <div className="flex min-w-0 flex-col items-start gap-1">
              <span className="text-[11px] font-medium text-[rgba(26,26,24,.48)]">Number Verified</span>
              <div className="flex-1">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  staff.number_verified ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {staff.number_verified ? 'Verified' : 'Not Verified'}
                </span>
              </div>
            </div> */}
          </div>
        </div>
      </ExpandableSection>

      {/* Section 2: Work Information */}
      <ExpandableSection
        title="Work Information"
        icon={FileText}
        isExpanded={expandedSections.workInfo}
        onToggle={() => toggleSection('workInfo')}
        hasData={hasData(staff.expiry_type) || hasData(staff.expiry_value)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-4">
              <div className="flex min-w-0 flex-col items-start gap-1">
                <span className="text-[11px] font-medium text-[rgba(26,26,24,.48)]">Expiry Type</span>
                <span className="text-[13.5px] font-medium text-[#1A1A18]">
                {hasData(staff.expiry_type) ? (
                  <>
                    {staff.expiry_type}
                    {hasData(staff.expiry_value) ? ` (${staff.expiry_value})` : ''}
                  </>
                ) : (
                  '-'
                )}
              </span>
            </div>
          </div>
        </div>
      </ExpandableSection>

      {/* Section 3: Schedule Information */}
      <ExpandableSection
        title="Schedule Information"
        icon={Calendar}
        isExpanded={expandedSections.scheduleInfo}
        onToggle={() => toggleSection('scheduleInfo')}
        hasData={staff.helpdesk_operations && staff.helpdesk_operations.length > 0}
      >
        {staff.helpdesk_operations && staff.helpdesk_operations.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 gap-4 p-4 text-sm">
          <div className="rounded-tl-lg bg-[#F5F4F0] py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-[rgba(26,26,24,.55)]">Day</div>
              <div className="rounded-tr-lg bg-[#F5F4F0] py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-[rgba(26,26,24,.55)]">Time</div>
              {staff.helpdesk_operations.map((operation, index) => (
                <React.Fragment key={index}>
                  <div className="border-b border-[rgba(26,26,24,.08)] py-3 text-center text-[13px] text-[#1A1A18]">
                    {operation.day}
                  </div>
                  <div className="border-b border-[rgba(26,26,24,.08)] py-3 text-center text-[13px] font-medium text-[#1A1A18]">
                    {operation.start_hour && operation.end_hour 
                      ? `${formatTime(operation.start_hour, operation.start_min)} to ${formatTime(operation.end_hour, operation.end_min)}`
                      : '--:-- to --:--'
                    }
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No schedule information found</p>
        )}
      </ExpandableSection>

      {/* Section 5: Associate Flat */}
      <Card className="mb-4 w-full rounded-2xl border border-[rgba(26,26,24,.09)] bg-white px-6 py-5 shadow-none">
        <CardHeader
          onClick={() => toggleSection('associateFlat')}
          className="cursor-pointer p-0 pb-4"
        >
          <CardTitle className="flex items-center justify-between gap-3 text-[14px] font-semibold text-[#1A1A18]">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F4F0]">
                <MapPin className="h-[14px] w-[14px] text-[#1A1A18]" />
              </div>
              <span>Associate Flat</span>
              {associatedFlats.length > 0 && (
                <span className="w-6 h-6 rounded-full bg-[#C72030] text-white text-xs font-bold flex items-center justify-center">
                  {associatedFlats.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleOpenFlatModal(); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A1A18] text-white hover:bg-[#12100E]"
                aria-label="Associate flat"
              >
                <Plus className="w-4 h-4" />
              </button>
              {expandedSections.associateFlat
                ? <ChevronUp className="w-5 h-5 text-gray-600" />
                : <ChevronDown className="w-5 h-5 text-gray-600" />}
            </div>
          </CardTitle>
        </CardHeader>
        {expandedSections.associateFlat && (
          <CardContent className="p-0 pt-0">
            {associatedFlats.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No flats associated. Click + to add.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {associatedFlats.map((flat, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#F5F4F0] text-[#1A1A18] border border-[rgba(26,26,24,.09)]"
                  >
                    <span>{flat.display}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFlat(index)}
                      className="text-gray-400 hover:text-[#C72030] ml-1"
                      aria-label={`Remove ${flat.display}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Section 4: QR Code Information */}
      <ExpandableSection
        title="QR Code"
        icon={QrCode}
        isExpanded={expandedSections.qrInfo}
        onToggle={() => toggleSection('qrInfo')}
        hasData={staff.qr_code_present}
      >
        <div className="text-center">
          <div className="mb-4 inline-block rounded-xl border border-[rgba(26,26,24,.09)] bg-white p-5">
            {staff.qr_code_present && staff.qr_code_url ? (
              <img 
                src={staff.qr_code_url} 
                alt="QR Code"
                className="w-48 h-48 mx-auto"
              />
            ) : (
              <div className="w-48 h-48 mx-auto bg-[#F5F4F0] rounded-lg flex items-center justify-center">
                <span className="text-sm text-gray-500">No QR Code Available</span>
              </div>
            )}
          </div>
          <div>
            <Button
              onClick={handlePrint}
              className="mx-auto flex min-h-[42px] items-center justify-center gap-2 rounded-lg !bg-[#1A1A18] px-[22px] text-[13px] font-semibold !text-white [&_svg]:!text-white hover:!bg-[#12100E]"
              disabled={!staff.qr_code_present || isPrinting}
              style={{ backgroundColor: '#1A1A18', color: '#FFFFFF' }}
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span style={{ color: '#FFFFFF' }}>Printing...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span style={{ color: '#FFFFFF' }}>Print QR Code</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </ExpandableSection>

      {/* Associate Flat Modal */}
      <Dialog open={showFlatModal} onOpenChange={setShowFlatModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Associate Flats</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {loadingTowers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <select
                    value={selectedTower}
                    onChange={(e) => handleTowerChange(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[rgba(26,26,24,.12)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C72030] focus:border-[#C72030] bg-white text-gray-700"
                    title="Select Tower"
                  >
                    <option value="">Select Tower</option>
                    {towers.map((tower) => (
                      <option key={tower.value} value={String(tower.value)}>{tower.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <select
                    value={selectedFlat}
                    onChange={(e) => setSelectedFlat(e.target.value)}
                    disabled={!selectedTower || loadingFlats}
                    className="w-full px-3 py-2.5 border border-[rgba(26,26,24,.12)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C72030] focus:border-[#C72030] bg-white text-gray-700 disabled:bg-gray-100 disabled:text-gray-400"
                    title="Select Flat"
                  >
                    <option value="">
                      {loadingFlats ? 'Loading flats...' : !selectedTower ? 'Select Tower first' : 'Select Flat'}
                    </option>
                    {flats.map((flat) => (
                      <option key={flat.value} value={String(flat.value)}>{flat.label}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowFlatModal(false)} disabled={savingFlat}>
              Cancel
            </Button>
            <Button
              onClick={handleAddFlat}
              disabled={savingFlat || !selectedFlat}
              className="bg-[#C72030] hover:bg-[#A01828] !text-white"
            >
              {savingFlat ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Number Modal */}
      <Dialog open={showVerifyModal} onOpenChange={setShowVerifyModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Staff Number</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 5-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={5}
                className="text-center text-lg tracking-widest"
              />
            </div>
            <div className="text-sm text-gray-600">
              OTP has been sent to the staff member's mobile number. Please enter the received OTP to verify.
            </div>
            <div className="flex justify-center">
              <Button
                variant="link"
                onClick={handleResendOTP}
                disabled={sendingOTP}
                className="text-[#C72030] hover:text-[#A01828] p-0 h-auto text-sm"
              >
                {sendingOTP ? 'Resending...' : 'Resend OTP'}
              </Button>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCloseVerifyModal}
              disabled={verifying}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerifySubmit}
              disabled={verifying || !otp.trim()}
              className="bg-[#C72030] hover:bg-[#A01828] !text-white"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
