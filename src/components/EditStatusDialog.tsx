
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import ReactSelect from 'react-select';
import { apiClient } from '@/utils/apiClient';
import { toast } from 'sonner';
import { API_CONFIG, getAuthHeader } from '@/config/apiConfig';

interface EditStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complaintId?: number;
  currentStatusId?: number;
  currentStatus?: string;
  onSuccess?: () => void;
}

interface Status {
  id: number;
  name: string;
  color_code: string;
  fixed_state: string;
  active: number;
}

interface ResponsiblePerson {
  id: number;
  full_name: string;
}

interface Complaint {
  id: number;
  complaint_status_id: number;
  issue_status: string;
  asset_service?: string;
  asset_or_service_id?: number;
  reopen_status?: boolean;
  preventive_action?: string;
  corrective_action?: string;
  review_tracking?: string;
  responsible_person?: string;
}

export const EditStatusDialog = ({
  open,
  onOpenChange,
  complaintId,
  currentStatusId,
  onSuccess
}: EditStatusDialogProps) => {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(false);
  const [ticketData, setTicketData] = useState<Complaint | null>(null);
  const [preventiveActionText, setPreventiveActionText] = useState('');
  const [correctiveActionText, setCorrectiveActionText] = useState('');
  const [reviewTracking, setReviewTracking] = useState('');
  const [responsiblePersonId, setResponsiblePersonId] = useState('');
  const [responsiblePersons, setResponsiblePersons] = useState<ResponsiblePerson[]>([]);

  useEffect(() => {
    if (!open) return;

    // Reset all fields when dialog opens
    setPreventiveActionText('');
    setCorrectiveActionText('');
    setReviewTracking('');
    setResponsiblePersonId('');
    setSelectedStatus(currentStatusId ? currentStatusId.toString() : '');
    setTicketData(null);

    const fetchStatuses = async () => {
      try {
        const response = await apiClient.get('/crm/admin/complaint_statuses.json');
        setStatuses(response.data || []);
      } catch (error) {
        console.error('Failed to fetch statuses:', error);
        toast.error("Failed to fetch status options");
      }
    };

    const fetchResponsiblePersons = async () => {
      try {
        const baseUrl = API_CONFIG.BASE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const url = `https://${baseUrl}/dropdown/service_engineers`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) return;
        const data = await response.json();
        const engineers = Array.isArray(data.helpdesk_users) ? data.helpdesk_users : [];
        setResponsiblePersons(
          engineers.map((e: { id: number; full_name: string }) => ({ id: e.id, full_name: e.full_name }))
        );
      } catch (error) {
        console.error('Failed to fetch responsible persons:', error);
      }
    };

    const fetchTicketData = async () => {
      if (!complaintId) return;
      try {
        const response = await apiClient.get(`/crm/admin/complaints/${complaintId}.json`);
        const data: Complaint = response.data;
        setTicketData(data);

        if (data.preventive_action) setPreventiveActionText(data.preventive_action);
        if (data.corrective_action) setCorrectiveActionText(data.corrective_action);

        if (data.review_tracking) {
          let dateVal = data.review_tracking;
          // Convert DD/MM/YYYY → YYYY-MM-DD for the date input
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateVal)) {
            const [day, month, year] = dateVal.split('/');
            dateVal = `${year}-${month}-${day}`;
          }
          setReviewTracking(dateVal);
        }
      } catch (error) {
        console.error('Failed to fetch ticket data:', error);
      }
    };

    fetchStatuses();
    fetchResponsiblePersons();
    fetchTicketData();
  }, [open, currentStatusId, complaintId]);

  // Match responsible_person name to an ID once both persons list and ticket data are available
  useEffect(() => {
    if (!ticketData?.responsible_person || responsiblePersons.length === 0) return;
    const matched = responsiblePersons.find(p => p.full_name === ticketData.responsible_person);
    if (matched) setResponsiblePersonId(matched.id.toString());
  }, [responsiblePersons, ticketData]);

  const handleApply = async () => {
    if (!complaintId || !selectedStatus) {
      toast.error("Please select a status");
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('complaint_log[complaint_id]', complaintId.toString());
      formDataToSend.append('complaint_log[complaint_status_id]', selectedStatus);

      if (preventiveActionText) {
        formDataToSend.append('complaint[preventive_action]', preventiveActionText);
      }
      if (correctiveActionText) {
        formDataToSend.append('complaint[corrective_action]', correctiveActionText);
      }
      if (responsiblePersonId) {
        formDataToSend.append('complaint[person_id]', responsiblePersonId);
      }
      if (reviewTracking) {
        formDataToSend.append('complaint[review_tracking_date]', reviewTracking);
      }

      // Preserve asset/service association from the ticket
      if (ticketData?.asset_service === 'Asset' && ticketData?.asset_or_service_id) {
        formDataToSend.append('asset_id', ticketData.asset_or_service_id.toString());
        formDataToSend.append('service_id', '');
      } else if (ticketData?.asset_service === 'Service' && ticketData?.asset_or_service_id) {
        formDataToSend.append('asset_id', '');
        formDataToSend.append('service_id', ticketData.asset_or_service_id.toString());
      } else {
        formDataToSend.append('asset_id', '');
        formDataToSend.append('service_id', '');
      }

      const loadingToastId = toast.loading("Updating status...");
      await apiClient.post('/complaint_logs.json', formDataToSend);
      toast.dismiss(loadingToastId);
      toast.success("Status updated successfully!");

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error("Failed to update status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedStatus(currentStatusId?.toString() || '');
    setPreventiveActionText('');
    setCorrectiveActionText('');
    setReviewTracking('');
    setResponsiblePersonId('');
  };

  const responsiblePersonOption = responsiblePersons.find(p => p.id.toString() === responsiblePersonId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <DialogTitle>Edit Status</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-6 w-6 p-0 hover:bg-gray-100"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-5">
          {/* Status */}
          <div>
            <Label htmlFor="status" className="text-sm font-medium">
              Status
            </Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                {statuses
                  .filter((status) => {
                    if (ticketData?.reopen_status === false && status.fixed_state === 'reopen') {
                      return false;
                    }
                    return true;
                  })
                  .map((status) => (
                    <SelectItem key={status.id} value={status.id.toString()}>
                      {status.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preventive Action & Corrective Action */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Preventive Action</Label>
              <Textarea
                className="mt-1 min-h-[90px] text-sm resize-none"
                placeholder="Enter preventive action"
                value={preventiveActionText}
                onChange={(e) => setPreventiveActionText(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Corrective Action</Label>
              <Textarea
                className="mt-1 min-h-[90px] text-sm resize-none"
                placeholder="Enter corrective action"
                value={correctiveActionText}
                onChange={(e) => setCorrectiveActionText(e.target.value)}
              />
            </div>
          </div>

          {/* Review Date & Responsible Person */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-status-review-date" className="text-sm font-medium">Review Date</Label>
              <input
                id="edit-status-review-date"
                type="date"
                aria-label="Review Date"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={reviewTracking}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setReviewTracking(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Responsible Person</Label>
              <ReactSelect
                value={responsiblePersonOption
                  ? { value: responsiblePersonOption.id.toString(), label: responsiblePersonOption.full_name }
                  : null
                }
                onChange={(selected) =>
                  setResponsiblePersonId(selected ? (selected as { value: string }).value : '')
                }
                options={responsiblePersons.map(p => ({ value: p.id.toString(), label: p.full_name }))}
                placeholder="Select Responsible Person"
                isClearable
                className="mt-1"
                styles={{
                  control: (provided, state) => ({
                    ...provided,
                    minHeight: '40px',
                    borderColor: state.isFocused ? '#C72030' : '#e2e8f0',
                    boxShadow: 'none',
                    fontSize: '14px',
                    '&:hover': { borderColor: '#C72030' },
                  }),
                  menu: (provided) => ({
                    ...provided,
                    zIndex: 9999,
                  }),
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleApply}
              disabled={loading}
              className="bg-[#C72030] hover:bg-[#C72030]/90 text-white flex-1"
            >
              {loading ? 'Applying...' : 'Apply'}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              Reset
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
