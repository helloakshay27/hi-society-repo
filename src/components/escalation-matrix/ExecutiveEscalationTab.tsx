import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import ReactSelect from 'react-select';
import { apiClient } from '@/utils/apiClient';
import { ticketManagementAPI } from '@/services/ticketManagementAPI';
import { toast } from 'sonner';

type AxiosErrorLike = { response?: { data?: { message?: string } } };

interface EscalationLevel {
  level: string;
  escalationTo: number[];
  days: string;
  hours: string;
  minutes: string;
}

interface EscalationRule {
  level: string;
  escalationTo: string;
  timing: string;
}

interface ExecutiveEscalationPayload {
  escalation_matrix: {
    [key: string]: {
      name: string;
      esc_type: string;
      escalate_to_users: number[];
      p1: string;
      p2: string;
      p3: string;
      p4: string;
      p5: string;
    };
  };
}

interface ExecutiveWorker {
  id: number;
  name: string;
  esc_type: string | null;
  p1: number | null;
  p2: number | null;
  p3: number | null;
  p4: number | null;
  p5: number | null;
  escalate_to_users: { id: number; full_name: string }[];
  created_at: string;
  updated_at: string;
}

interface ExecutivePagination {
  current_page: number;
  per_page: number;
  total_entries: number;
  total_pages: number;
}

interface EscalationUser {
  id: number;
  full_name: string;
}

export const ExecutiveEscalationTab: React.FC = () => {
  const [escalationData, setEscalationData] = useState<EscalationLevel[]>([
    { level: 'E0', escalationTo: [], days: '', hours: '', minutes: '' },
    { level: 'E1', escalationTo: [], days: '', hours: '', minutes: '' },
    { level: 'E2', escalationTo: [], days: '', hours: '', minutes: '' },
    { level: 'E3', escalationTo: [], days: '', hours: '', minutes: '' }
  ]);

  const [savedRules, setSavedRules] = useState<EscalationRule[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executiveRules, setExecutiveRules] = useState<ExecutiveWorker[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [pagination, setPagination] = useState<ExecutivePagination>({
    current_page: 1,
    per_page: 20,
    total_entries: 0,
    total_pages: 1,
  });
  // Editing state (modal)
  const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<EscalationLevel[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Local state for escalation users
  const [escalationUsers, setEscalationUsers] = useState<EscalationUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Options for react-select
  const userOptions = escalationUsers?.map(user => ({ value: user.id, label: user.full_name })) || [];

  // Load escalation users
  const loadEscalationUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await ticketManagementAPI.getServiceEngineers({ 'q[staff_type_eq]': 'Escalation' });
      setEscalationUsers(response.service_engineers || []);
    } catch (error) {
      console.error('Error loading escalation users:', error);
      toast.error('Failed to load escalation users');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch escalation users and executive rules on component mount
  useEffect(() => {
    loadEscalationUsers();
    fetchExecutiveRules();
  }, []);

  const fetchExecutiveRules = async (page = 1) => {
    try {
      setFetchLoading(true);
      const response = await apiClient.get('/crm/admin/executive_workers_index.json', {
        params: { page, per_page: 20 },
      });
      setExecutiveRules(response.data?.executive_workers || []);
      if (response.data?.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (error: unknown) {
      console.error('Error fetching executive rules:', error);
      const msg = (error as AxiosErrorLike)?.response?.data?.message || 'Failed to fetch executive escalation rules';
      toast.error(msg);
    } finally {
      setFetchLoading(false);
    }
  };

  const getUserNamesFromUsers = (users: { id: number; full_name: string }[]): string => {
    if (!users || users.length === 0) return 'No users assigned';
    return users.map(u => u.full_name).join(', ');
  };

  const formatTiming = (minutes: number | null): string => {
    if (!minutes || minutes === 0) return '';
    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const mins = minutes % 60;
    return `${days} Day, ${hours} Hour, ${mins} Minute`;
  };

  const splitMinutes = (minutes: number | null) => {
    const total = minutes || 0;
    const days = Math.floor(total / (24 * 60));
    const hours = Math.floor((total % (24 * 60)) / 60);
    const mins = total % 60;
    return { days: String(days), hours: String(hours), minutes: String(mins) };
  };

  const handleDeleteRule = async (ruleId: number) => {
    try {
      setDeleteLoading(true);
      await apiClient.delete(`/executive_escalations/${ruleId}.json`);
      toast.success('Executive escalation rule deleted successfully!');
      await fetchExecutiveRules();
    } catch (error: unknown) {
      console.error('Error deleting executive rule:', error);
      const msg = (error as AxiosErrorLike)?.response?.data?.message || 'Failed to delete executive escalation rule';
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const convertMinutesToP1 = (days: string, hours: string, minutes: string): string => {
    const totalMinutes = 
      (parseInt(days) || 0) * 24 * 60 + 
      (parseInt(hours) || 0) * 60 + 
      (parseInt(minutes) || 0);
    return totalMinutes.toString();
  };

  const startEdit = (groupIndex: number, group: ExecutiveWorker[]) => {
    const levels = ['E0','E1','E2','E3'].map((lvl) => {
      const esc = group.find(g => g.name === lvl);
      const time = splitMinutes(esc?.p1 ?? 0);
      const userIds: number[] = Array.isArray(esc?.escalate_to_users)
        ? esc!.escalate_to_users.map((u) => Number(u.id))
        : [];
      return {
        level: lvl,
        escalationTo: userIds,
        days: time.days,
        hours: time.hours,
        minutes: time.minutes,
      } as EscalationLevel;
    });
    setEditData(levels);
    setEditingGroupIndex(groupIndex);
    setIsEditDialogOpen(true);
  };

  const cancelEdit = () => {
    setEditingGroupIndex(null);
    setEditData([]);
    setIsEditDialogOpen(false);
  };

  const handleEditFieldChange = (index: number, field: keyof EscalationLevel, value: string | number[]) => {
    setEditData(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };
      if (field === 'escalationTo') {
        item.escalationTo = value as number[];
      } else if (field === 'days' || field === 'hours' || field === 'minutes') {
        item[field] = value as string;
      }
      updated[index] = item;
      return updated;
    });
  };

  const updateExecutiveEscalation = async (group: ExecutiveWorker[]) => {
    try {
      setUpdateLoading(true);
      const matrix: Record<string, { id: number | undefined; esc_type: string; name: string; escalate_to_users: number[]; p1: string; p2: string; p3: string; p4: string; p5: string }> = {};
      ['E0','E1','E2','E3'].forEach((lvl, i) => {
        const existing = group.find(g => g.name === lvl);
        const key = lvl.toLowerCase();
        const item = editData[i];
        if (!item) return;
        const base = {
          id: existing?.id,
          esc_type: 'Executive Escalation',
          name: lvl,
          escalate_to_users: (item.escalationTo || []).map(id => Number(id)),
          p1: lvl !== 'E0' ? convertMinutesToP1(item.days, item.hours, item.minutes) : '0',
          p2: '0',
          p3: '0',
          p4: '0',
          p5: '0',
        };
        matrix[key] = base;
      });

      const payload = {
        escalation_matrix: matrix,
      };

      const res = await apiClient.put('/crm/admin/update_executive_worker.json', payload);
      toast.success('Executive escalation updated successfully!');
      await fetchExecutiveRules(pagination.current_page);
      cancelEdit();
      return res.data;
    } catch (error: unknown) {
      console.error('Error updating executive escalation:', error);
      const msg = (error as AxiosErrorLike)?.response?.data?.message || 'Failed to update executive escalation';
      toast.error(msg);
      throw error;
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate that at least one level has users assigned
      const hasUsersAssigned = escalationData.some(item => item.escalationTo && item.escalationTo.length > 0);
      if (!hasUsersAssigned) {
        toast.error('Please assign users to at least one escalation level');
        return;
      }

      // Prepare the payload according to the API structure
      const escalationMatrix: ExecutiveEscalationPayload['escalation_matrix'] = {};

      escalationData.forEach((item) => {
        const levelKey = item.level.toLowerCase(); // e0, e1, e2, e3

        escalationMatrix[levelKey] = {
          name: item.level,
          esc_type: 'Executive Escalation',
          escalate_to_users: item.escalationTo && item.escalationTo.length > 0
            ? item.escalationTo.map(id => Number(id))
            : [],
          p1: item.level !== 'E0' ? convertMinutesToP1(item.days, item.hours, item.minutes) : '0',
          p2: '0',
          p3: '0',
          p4: '0',
          p5: '0',
        };
      });

      const payload: ExecutiveEscalationPayload = {
        escalation_matrix: escalationMatrix,
      };

      // Call the API
      await createExecutiveEscalation(payload);

      // Update the rules table with submitted data
      const rules = escalationData
        .filter(item => item.escalationTo && item.escalationTo.length > 0)
        .map(item => ({
          level: item.level,
          escalationTo: getUserNames(item.escalationTo),
          timing: `${item.days || 0} Day, ${item.hours || 0} Hour, ${item.minutes || 0} Minute`
        }));
      
      setSavedRules(rules);
      
      // Clear the form inputs after successful submission
      setEscalationData([
        { level: 'E0', escalationTo: [], days: '', hours: '', minutes: '' },
        { level: 'E1', escalationTo: [], days: '', hours: '', minutes: '' },
        { level: 'E2', escalationTo: [], days: '', hours: '', minutes: '' },
        { level: 'E3', escalationTo: [], days: '', hours: '', minutes: '' }
      ]);
      
      // Refresh the executive rules list
      await fetchExecutiveRules(1);
      
    } catch (error) {
      console.error('Error submitting executive escalation:', error);
    }
  };

  const getUserNames = (userIds: number[]): string => {
    if (!userIds || userIds.length === 0) return '';
    return userIds.map(id => {
      const user = escalationUsers.find(u => u.id === id);
      return user ? user.full_name : 'Unknown User';
    }).join(', ');
  };

  const createExecutiveEscalation = async (payload: ExecutiveEscalationPayload) => {
    try {
      setIsSubmitting(true);
      const response = await apiClient.post('/crm/admin/create_executive_worker.json', payload);
      toast.success('Executive escalation created successfully!');
      return response.data;
    } catch (error: unknown) {
      console.error('Error creating executive escalation:', error);
      const msg = (error as AxiosErrorLike)?.response?.data?.message || 'Failed to create executive escalation';
      toast.error(msg);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (index: number, field: keyof EscalationLevel, value: string | number[]) => {
    setEscalationData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Group and filter rules for display — group by created_at (same batch = same timestamp)
  const groupedRules = executiveRules.reduce((acc: Record<string, ExecutiveWorker[]>, worker) => {
    const key = worker.created_at;
    if (!acc[key]) acc[key] = [];
    acc[key].push(worker);
    return acc;
  }, {});
  const ruleGroups = Object.values(groupedRules);
  const filteredRules = selectedCategoryFilter === 'all'
    ? ruleGroups
    : ruleGroups.filter(group => group.some(w => w.esc_type === selectedCategoryFilter));

  const hasExecutive = executiveRules.some(e => e.esc_type === 'Executive Escalation');

  return (
    <div className="space-y-8">
      {/* {hasExecutive && (
        <div className="bg-white rounded-lg border border-amber-200 p-4 flex items-center gap-3">
          <div className="text-amber-700 text-sm">
            Executive escalation already exists. The add form is disabled. Use the edit action to modify the existing configuration.
          </div>
        </div>
      )} */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="space-y-6">
          {/* Header Row 1 */}
          <div className="grid grid-cols-6 gap-6 font-medium text-gray-700 text-sm border-b border-gray-200 pb-3">
            <div>Levels</div>
            <div className="col-span-2">Escalation To</div>
            <div className="col-span-3 text-center">P1</div>
          </div>

          {/* Header Row 2 */}
          <div className="grid grid-cols-6 gap-6 font-medium text-gray-700 text-sm">
            <div></div>
            <div className="col-span-2"></div>
            <div className="text-center">Days</div>
            <div className="text-center">Hrs</div>
            <div className="text-center">Min</div>
          </div>

          {/* Escalation Levels */}
          {escalationData.map((item, index) => (
            <div key={item.level} className="grid grid-cols-6 gap-6 items-center py-2">
              <div className="bg-gray-100 px-3 py-2 rounded border text-sm font-medium">
                {item.level}
              </div>
              
              <div className="col-span-2">
                <ReactSelect
                  isMulti
                  options={userOptions}
                  onChange={(selected) => {
                    const newUsers = selected ? selected.map(s => s.value) : [];
                    handleFieldChange(index, 'escalationTo', newUsers);
                  }}
                  value={userOptions.filter(option => item.escalationTo.includes(option.value))}
                  placeholder="Select up to 15 users..."
                  isLoading={loadingUsers}
                  isDisabled={loadingUsers}
                  className="min-w-[250px]"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '40px',
                      fontSize: '14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      boxShadow: 'none',
                      '&:hover': {
                        borderColor: '#9ca3af'
                      }
                    }),
                    multiValue: (base) => ({
                      ...base,
                      fontSize: '12px',
                      backgroundColor: '#f3f4f6'
                    }),
                    multiValueLabel: (base) => ({
                      ...base,
                      color: '#374151'
                    }),
                    multiValueRemove: (base) => ({
                      ...base,
                      color: '#6b7280',
                      '&:hover': {
                        backgroundColor: '#ef4444',
                        color: 'white'
                      }
                    })
                  }}
                />
              </div>

              {/* P1 timing is NOT needed for E0 */}
              {item.level !== 'E0' && (
                <>
                  <Input
                    type="number"
                    value={item.days}
                    onChange={(e) => handleFieldChange(index, 'days', e.target.value)}
                    placeholder="Days"
                    className="text-center bg-white border-gray-300"
                  />

                  <Input
                    type="number"
                    value={item.hours}
                    onChange={(e) => handleFieldChange(index, 'hours', e.target.value)}
                    placeholder="Hrs"
                    className="text-center bg-white border-gray-300"
                  />

                  <Input
                    type="number"
                    value={item.minutes}
                    onChange={(e) => handleFieldChange(index, 'minutes', e.target.value)}
                    placeholder="Min"
                    className="text-center bg-white border-gray-300"
                  />
                </>
              )}
            </div>
          ))}

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || loadingUsers}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </div>

      {/* Executive Escalation Rules Card */}
      <Card className="border border-gray-200">
        <CardHeader className="border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Executive Escalation Rules</CardTitle>
            <div className="flex items-center gap-3">
              <Label htmlFor="escalation-filter" className="text-sm font-medium text-gray-700">
                Filter by Type
              </Label>
              <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                <SelectTrigger className="w-48 border-gray-200 focus:border-[#C72030] focus:ring-[#C72030]">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Executive Escalation">Executive Escalation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {fetchLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#C72030]" />
              <span className="ml-2 text-gray-600">Loading executive escalation rules...</span>
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No executive escalation rules found.</p>
              <p className="text-sm mt-1">Create your first rule using the form above.</p>
            </div>
          ) : (
            <div className="space-y-6 p-6">
              {filteredRules.map((ruleGroup, index) => (
                <div key={`rule-group-${index}`} className="border border-gray-200 rounded-lg bg-white shadow-sm">
                  <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-gray-900">Rule {index + 1}</h3>
                      <div className="flex gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            {/* <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50"
                              disabled={deleteLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button> */}
                          </AlertDialogTrigger>

                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Rule</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this executive escalation rule? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteRule(ruleGroup[0].id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        {/* <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-600 hover:text-[#C72030]"
                          onClick={() => startEdit(index, ruleGroup)}
                          title="Edit Rule"
                        >
                          <Edit className="h-4 w-4" />
                        </Button> */}
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-hidden">
                    <Table>

                      <TableHeader>
                        <TableRow className="bg-gray-50 border-b border-gray-200 hover:bg-gray-50">
                          <TableHead className="font-semibold text-gray-900 text-left py-3 px-4 w-1/6">Levels</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-left py-3 px-4">Escalation To</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-left py-3 px-4 w-1/4">P1 Timing</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[ 'E0', 'E1', 'E2', 'E3'].map((levelName) => {
                          const escalation = ruleGroup.find(esc => esc.name === levelName);
                          return (
                            <TableRow key={levelName} className="border-b border-gray-100 hover:bg-gray-50/50">
                              <TableCell className="py-4 px-4 align-top font-medium text-gray-900">
                                {levelName}
                              </TableCell>
                              <TableCell className="py-4 px-4 align-top text-sm text-gray-700">
                                {escalation ? getUserNamesFromUsers(escalation.escalate_to_users) : ''}
                              </TableCell>
                              <TableCell className="py-4 px-4 align-top text-sm text-gray-700">
                                {escalation ? formatTiming(escalation.p1) : ''}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Edit Dialog (modal) */}
                  <Dialog open={isEditDialogOpen && editingGroupIndex === index} onOpenChange={(open) => !open && cancelEdit()}>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Edit Executive Escalation</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        {editData.map((item, idx) => (
                          <div key={item.level} className="grid grid-cols-6 gap-6 items-center py-1">
                            <div className="bg-gray-100 px-3 py-2 rounded border text-sm font-medium">{item.level}</div>
                            <div className="col-span-2">
                              <ReactSelect
                                isMulti
                                options={userOptions}
                                onChange={(selected) => {
                                  const newUsers = selected ? selected.map((s: {value: number; label: string}) => s.value) : [];
                                  handleEditFieldChange(idx, 'escalationTo', newUsers);
                                }}
                                value={userOptions.filter(option => item.escalationTo.includes(option.value))}
                                placeholder="Select users..."
                                isLoading={loadingUsers}
                                isDisabled={loadingUsers}
                                className="min-w-[250px]"
                              />
                            </div>
                            {item.level !== 'E0' && (
                              <>
                                <Input
                                  type="number"
                                  value={item.days}
                                  onChange={(e) => handleEditFieldChange(idx, 'days', e.target.value)}
                                  placeholder="Days"
                                  className="text-center bg-white border-gray-300"
                                />
                                <Input
                                  type="number"
                                  value={item.hours}
                                  onChange={(e) => handleEditFieldChange(idx, 'hours', e.target.value)}
                                  placeholder="Hrs"
                                  className="text-center bg-white border-gray-300"
                                />
                                <Input
                                  type="number"
                                  value={item.minutes}
                                  onChange={(e) => handleEditFieldChange(idx, 'minutes', e.target.value)}
                                  placeholder="Min"
                                  className="text-center bg-white border-gray-300"
                                />
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end gap-3 mt-4">
                        <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
                        <Button
                          onClick={() => updateExecutiveEscalation(ruleGroup)}
                          disabled={updateLoading}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {updateLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          )}
          {/* Pagination */}
          {!fetchLoading && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">
                Showing page {pagination.current_page} of {pagination.total_pages} ({pagination.total_entries} total)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.current_page <= 1 || fetchLoading}
                  onClick={() => fetchExecutiveRules(pagination.current_page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.current_page >= pagination.total_pages || fetchLoading}
                  onClick={() => fetchExecutiveRules(pagination.current_page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};