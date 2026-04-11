import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { X, Plus, Loader2, Edit, Trash2, Filter, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react'
import { AppDispatch, RootState } from '@/store/store'
import { fetchHelpdeskCategories } from '@/store/slices/helpdeskCategoriesSlice'
import { createResponseEscalation, clearState, fetchResponseEscalations, updateResponseEscalation, deleteResponseEscalation } from '@/store/slices/responseEscalationSlice'
import { ResponseEscalationApiFormData, FMUserDropdown, EscalationMatrixPayload, ResponseEscalationGetResponse, UpdateResponseEscalationPayload } from '@/types/escalationMatrix'
import { ticketManagementAPI, UserAccountResponse } from '@/services/ticketManagementAPI'
import { API_CONFIG } from '@/config/apiConfig'
import { toast } from 'sonner'
import ReactSelect from 'react-select'

// Schema for form validation
const responseEscalationSchema = z.object({
  escalationLevels: z.object({
    e1: z.array(z.number()).max(15, 'Maximum 15 users allowed per level'),
    e2: z.array(z.number()).max(15, 'Maximum 15 users allowed per level'),
    e3: z.array(z.number()).max(15, 'Maximum 15 users allowed per level'),
    e4: z.array(z.number()).max(15, 'Maximum 15 users allowed per level'),
    e5: z.array(z.number()).max(15, 'Maximum 15 users allowed per level'),
  }),
})

type ResponseEscalationFormData = z.infer<typeof responseEscalationSchema>

export const ResponseEscalationTab: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()

  // Local state
  const [selectedUsers, setSelectedUsers] = useState<{
    e1: number[]
    e2: number[]
    e3: number[]
    e4: number[]
    e5: number[]
  }>({
    e1: [],
    e2: [],
    e3: [],
    e4: [],
    e5: [],
  })
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all')
  const [selectedIssueTypeFilter, setSelectedIssueTypeFilter] = useState<string>('all')
  const [editingRule, setEditingRule] = useState<any | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [userAccount, setUserAccount] = useState<UserAccountResponse | null>(null)
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Dropdown options from API
  const [issueTypeOptions, setIssueTypeOptions] = useState<{ id: number; name: string }[]>([])
  const [categoryDropdownOptions, setCategoryDropdownOptions] = useState<{ id: number; name: string }[]>([])
  const [serviceEngineerOptions, setServiceEngineerOptions] = useState<{ id: number; full_name: string }[]>([])

  // Form dropdown selections
  const [selectedIssueTypeId, setSelectedIssueTypeId] = useState<string>('')
  const [selectedCategoryTypeId, setSelectedCategoryTypeId] = useState<string>('')
  const [selectedAssignTo, setSelectedAssignTo] = useState<number[]>([])

  // Edit dialog dropdown selections
  const [editIssueTypeId, setEditIssueTypeId] = useState<string>('')
  const [editCategoryTypeId, setEditCategoryTypeId] = useState<string>('')
  const [editAssignTo, setEditAssignTo] = useState<number[]>([])

  // FM/Project tab state
  const [activeFmProjectTab, setActiveFmProjectTab] = useState<'fm' | 'project'>('fm')

  // Escalation rules list from API
  const [escalationRulesList, setEscalationRulesList] = useState<any[]>([])
  const [escalationRulesLoading, setEscalationRulesLoading] = useState(false)
  const [escalationRulesPagination, setEscalationRulesPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEntries: 0,
    perPage: 10,
  })
  const ESCALATION_RULES_PER_PAGE = 10

  // Filter states
  const [filterIssueTypeId, setFilterIssueTypeId] = useState<string>('')
  const [filterCategoryId, setFilterCategoryId] = useState<string>('')

  // Redux selectors
  const { data: categoriesData, loading: categoriesLoading } = useSelector((state: RootState) => state.helpdeskCategories)
  const { loading: submissionLoading, success, error, fetchLoading, updateLoading, deleteLoading } = useSelector((state: RootState) => state.responseEscalation)

  // Form setup
  const form = useForm<ResponseEscalationFormData>({
    resolver: zodResolver(responseEscalationSchema),
    defaultValues: {
      escalationLevels: {
        e1: [],
        e2: [],
        e3: [],
        e4: [],
        e5: [],
      },
    },
  })

  // Options for react-select
  const userOptions = serviceEngineerOptions?.map(user => ({ value: user.id, label: user.full_name })) || []

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchHelpdeskCategories())
    loadUserAccount()
    loadDropdowns()
    loadEscalationRules(1, '', '')
  }, [dispatch])

  // Reload escalation rules when FM/Project tab changes
  useEffect(() => {
    loadEscalationRules(1, filterIssueTypeId, filterCategoryId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFmProjectTab])

  // Load user account to get site_id
  const loadUserAccount = async () => {
    try {
      const account = await ticketManagementAPI.getUserAccount()
      setUserAccount(account)
      console.log('User account loaded:', account)
    } catch (error) {
      console.error('Error loading user account:', error)
      toast.error('Failed to load user account!')
    }
  }

  // Load dropdown options
  const loadDropdowns = async () => {
    setLoadingUsers(true)
    try {
      const [issueTypesData, categoriesData, engineersData] = await Promise.all([
        ticketManagementAPI.getIssueTypesDropdown(),
        ticketManagementAPI.getCategoriesDropdown(),
        ticketManagementAPI.getServiceEngineers(),
      ])
      setIssueTypeOptions(issueTypesData.issue_types || [])
      setCategoryDropdownOptions(categoriesData.categories || [])
      setServiceEngineerOptions(engineersData.service_engineers || [])
      console.log('Dropdowns loaded:', { issueTypesData, categoriesData, engineersData })
    } catch (error) {
      console.error('Error loading dropdowns:', error)
      toast.error('Failed to load dropdown options!')
    } finally {
      setLoadingUsers(false)
    }
  }

  // Load escalation rules from /crm/admin/assign_escalation.json
  const loadEscalationRules = async (
    page = 1,
    issueTypeId = filterIssueTypeId,
    categoryId = filterCategoryId,
  ) => {
    setEscalationRulesLoading(true)
    try {
      const params: Record<string, string | number> = {
        page,
        per_page: ESCALATION_RULES_PER_PAGE,
        'q[esc_type_eq]': 'response',
        'q[issue_related_to_eq]': activeFmProjectTab === 'fm' ? 'FM' : 'Project',
      }
      if (issueTypeId) params['q[issue_type_id_eq]'] = issueTypeId
      if (categoryId) params['q[category_id_eq]'] = categoryId
      const data = await ticketManagementAPI.getAssignEscalations(params)
      setEscalationRulesList(data.complaint_workers || [])
      if (data.pagination) {
        setEscalationRulesPagination({
          currentPage: data.pagination.current_page,
          totalPages: data.pagination.total_pages,
          totalEntries: data.pagination.total_entries,
          perPage: data.pagination.per_page,
        })
      }
    } catch (error) {
      console.error('Error loading escalation rules:', error)
      toast.error('Failed to load escalation rules!')
    } finally {
      setEscalationRulesLoading(false)
    }
  }

  // Handle success/error states
  useEffect(() => {
    if (success) {
      // Only show toast for create operations, not update (update has its own toast in handleUpdateRule)
      if (!editingRule) {
        toast.success('Response escalation rule created successfully!')
      }
      // Reset form
      form.reset()
      setSelectedUsers({ e1: [], e2: [], e3: [], e4: [], e5: [] })
      setSelectedIssueTypeId('')
      setSelectedCategoryTypeId('')
      setSelectedAssignTo([])
      dispatch(clearState())
      loadEscalationRules(1, '', '')
    }
    if (error) {
      // Ensure error is a string for toast display
      const errorMessage = typeof error === 'string' ? error : 'An error occurred while processing your request';
      toast.error(errorMessage + '!');
      dispatch(clearState());
    }
  }, [success, error, form, dispatch, editingRule])

  // Helper functions
  const getIssueTypeName = (id: number) => {
    return issueTypeOptions.find(it => it.id === id)?.name || 'Unknown Issue Type'
  }

  const getCategoryName = (id: number) => {
    return categoryDropdownOptions.find(cat => cat.id === id)?.name || 
           categoriesData?.helpdesk_categories?.find(cat => cat.id === id)?.name || 
           'Unknown Category'
  }

  const getUserName = (id: number) => {
    return serviceEngineerOptions.find(user => user.id === id)?.full_name || 'Unknown User'
  }

  const getUserNames = (userIds: string | number[] | null): string => {
    if (!userIds) return '-'

    let ids: number[] = []
    if (typeof userIds === 'string') {
      try {
        ids = JSON.parse(userIds)
      } catch {
        // It might be a comma-separated name string, return as-is
        return userIds || '-'
      }
    } else {
      ids = userIds
    }

    if (!Array.isArray(ids) || ids.length === 0) return '-'

    return ids.map(id => {
      const user = serviceEngineerOptions.find(u => u.id === id)
      return user ? user.full_name : `User ${id}`
    }).join(', ')
  }

  // Resolve comma-separated name string to user IDs
  const resolveNamesToIds = (nameStr: string): number[] => {
    if (!nameStr || typeof nameStr !== 'string') return []
    const names = nameStr.split(',').map(n => n.trim()).filter(Boolean)
    const ids: number[] = []
    names.forEach(name => {
      const user = serviceEngineerOptions.find(u => u.full_name.toLowerCase() === name.toLowerCase())
      if (user) ids.push(user.id)
    })
    return ids
  }

  // Handle filter apply
  const handleApplyFilter = () => {
    loadEscalationRules(1, filterIssueTypeId, filterCategoryId)
  }

  // Handle filter reset
  const handleResetFilter = () => {
    setFilterIssueTypeId('')
    setFilterCategoryId('')
    loadEscalationRules(1, '', '')
  }

  // Handle edit rule
  const handleEditRule = (rule: any) => {
    setEditingRule(rule)

    // Helper to safely parse escalate_to_users
    const safeParseUsers = (escalateToUsers: any): number[] => {
      if (!escalateToUsers) return []
      try {
        if (Array.isArray(escalateToUsers)) {
          return escalateToUsers.map(Number).filter(n => !isNaN(n))
        }
        if (typeof escalateToUsers === 'string') {
          const parsed = JSON.parse(escalateToUsers)
          return Array.isArray(parsed) ? parsed.map(Number).filter(n => !isNaN(n)) : []
        }
      } catch {
        // Might be a comma-separated name string
        return resolveNamesToIds(escalateToUsers)
      }
      return []
    }

    // Support both old format (escalations) and new API format (escalation_matrix)
    const escalations = rule.escalations || []
    const escalationMatrix = rule.escalation_matrix || []

    const findLevel = (levelName: string) => {
      const oldFormat = escalations.find((e: any) => e.name === levelName)
      if (oldFormat) return oldFormat
      const newFormat = escalationMatrix.find((e: any) => e.level === levelName)
      return newFormat || null
    }

    const getLevelUsers = (levelName: string): number[] => {
      const level = findLevel(levelName)
      if (!level) return []
      if (level.escalate_to_users) return safeParseUsers(level.escalate_to_users)
      if (level.escalation_to && typeof level.escalation_to === 'string') {
        return resolveNamesToIds(level.escalation_to)
      }
      return []
    }

    // Pre-populate form with existing data
    const formUsers = {
      e1: getLevelUsers('E1'),
      e2: getLevelUsers('E2'),
      e3: getLevelUsers('E3'),
      e4: getLevelUsers('E4'),
      e5: getLevelUsers('E5'),
    }

    form.reset({ escalationLevels: formUsers })
    setSelectedUsers(formUsers)
    setEditIssueTypeId(String(rule.issue_type_id || ''))
    setEditCategoryTypeId(String(rule.category_id || ''))
    
    // Parse assign_to
    let assignToIds: number[] = []
    if (rule.assign_to) {
      if (Array.isArray(rule.assign_to)) {
        assignToIds = rule.assign_to.map(Number).filter((n: number) => !isNaN(n))
      } else if (typeof rule.assign_to === 'string') {
        try {
          const parsed = JSON.parse(rule.assign_to)
          assignToIds = Array.isArray(parsed) ? parsed.map(Number).filter((n: number) => !isNaN(n)) : []
        } catch {
          assignToIds = resolveNamesToIds(rule.assign_to)
        }
      }
    }
    setEditAssignTo(assignToIds)
    
    setIsEditDialogOpen(true)
  }

  // Handle update rule
  const handleUpdateRule = async () => {
    if (!editingRule) return

    if (!editIssueTypeId) {
      toast.error('Please select an Issue Type!')
      return
    }
    if (!editCategoryTypeId) {
      toast.error('Please select a Category Type!')
      return
    }

    try {
      const payload = {
        id: editingRule.id,
        complaint_worker: {
          esc_type: 'response',
          issue_related_to: activeFmProjectTab === 'fm' ? 'FM' : 'Project',
          of_phase: 'post_possession',
          issue_type_id: editIssueTypeId,
          category_id: editCategoryTypeId,
          assign_to: editAssignTo.map(String),
        },
        escalation_matrix: {
          e1: { name: 'E1', escalate_to_users: selectedUsers.e1.map(Number) },
          e2: { name: 'E2', escalate_to_users: selectedUsers.e2.map(Number) },
          e3: { name: 'E3', escalate_to_users: selectedUsers.e3.map(Number) },
          e4: { name: 'E4', escalate_to_users: selectedUsers.e4.map(Number) },
          e5: { name: 'E5', escalate_to_users: selectedUsers.e5.map(Number) },
        },
      }

      await ticketManagementAPI.createResolutionEscalationRule(payload as any)
      toast.success('Response escalation rule updated successfully!')
      setIsEditDialogOpen(false)
      setEditingRule(null)
      loadEscalationRules(escalationRulesPagination.currentPage, filterIssueTypeId, filterCategoryId)
    } catch (err) {
      console.error('Error updating response escalation:', err)
      toast.error('Failed to update response escalation. Please try again!')
    }
  }

  // Handle delete rule
  const handleDeleteRule = async (ruleId: number) => {
    try {
      await ticketManagementAPI.deleteComplaintWorker(ruleId.toString())
      toast.success('Response escalation rule deleted successfully!')
      loadEscalationRules(escalationRulesPagination.currentPage, filterIssueTypeId, filterCategoryId)
    } catch (err) {
      console.error('Error deleting response escalation:', err)
      toast.error('Failed to delete response escalation. Please try again!')
    }
  }

  // Form submission
  const onSubmit = async (data: ResponseEscalationFormData) => {
    try {
      // Validate required fields
      if (!selectedIssueTypeId) {
        toast.error('Please select an Issue Type!')
        return
      }
      if (!selectedCategoryTypeId) {
        toast.error('Please select a Category Type!')
        return
      }

      // Build payload for /crm/admin/create_complaint_worker
      const payload = {
        complaint_worker: {
          esc_type: 'response',
          issue_related_to: activeFmProjectTab === 'fm' ? 'FM' : 'Project',
          of_phase: 'post_possession',
          issue_type_id: selectedIssueTypeId,
          category_id: selectedCategoryTypeId,
          assign_to: selectedAssignTo.map(Number),
        },
        escalation_matrix: {
          e1: { name: 'E1', escalate_to_users: data.escalationLevels.e1.map(Number) },
          e2: { name: 'E2', escalate_to_users: data.escalationLevels.e2.map(Number) },
          e3: { name: 'E3', escalate_to_users: data.escalationLevels.e3.map(Number) },
          e4: { name: 'E4', escalate_to_users: data.escalationLevels.e4.map(Number) },
          e5: { name: 'E5', escalate_to_users: data.escalationLevels.e5.map(Number) },
        },
      }

      await ticketManagementAPI.createResolutionEscalationRule(payload as any)
      toast.success('Response escalation rule created successfully!')
      
      // Reset form
      form.reset()
      setSelectedUsers({ e1: [], e2: [], e3: [], e4: [], e5: [] })
      setSelectedIssueTypeId('')
      setSelectedCategoryTypeId('')
      setSelectedAssignTo([])
      loadEscalationRules(1, '', '')
    } catch (error: unknown) {
      let errorMessage = 'Failed to create response escalation rule. Please try again.'
      let shouldShowCategoryTakenMessage = false

      if (typeof error === 'string') {
        errorMessage = error
        shouldShowCategoryTakenMessage = error.includes('422') ||
          error.toLowerCase().includes('already') ||
          error.toLowerCase().includes('exists') ||
          error.toLowerCase().includes('taken')
      } else if (error && typeof error === 'object') {
        const errorObj = error as any
        const statusIs422 = errorObj.status === 422 ||
          errorObj?.response?.status === 422

        const hasCategoryIdError = errorObj?.category_id ||
          errorObj?.response?.data?.category_id ||
          errorObj?.data?.category_id

        if (hasCategoryIdError && Array.isArray(hasCategoryIdError) && hasCategoryIdError.length > 0) {
          const categoryError = hasCategoryIdError[0]
          if (typeof categoryError === 'string' && categoryError.toLowerCase().includes('already been taken')) {
            shouldShowCategoryTakenMessage = true
          }
        }

        shouldShowCategoryTakenMessage = shouldShowCategoryTakenMessage || statusIs422

        errorMessage = errorObj?.message ||
          errorObj?.response?.data?.message ||
          errorObj?.data?.message ||
          errorObj?.error ||
          'Failed to create response escalation rule. Please try again.'
      }

      if (shouldShowCategoryTakenMessage) {
        toast.error('Category already exists for this issue type. Please choose a different combination!')
      } else {
        const finalErrorMessage = typeof errorMessage === 'string' ? errorMessage : 'Failed to create response escalation rule. Please try again.'
        toast.error(finalErrorMessage + '!')
      }
    }
  }

  return (
    <div className="space-y-0">
      {/* FM / Project sub-tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setActiveFmProjectTab('fm')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeFmProjectTab === 'fm'
              ? 'border-[#C72030] text-[#C72030]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          FM
        </button>
        <button
          onClick={() => setActiveFmProjectTab('project')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeFmProjectTab === 'project'
              ? 'border-[#C72030] text-[#C72030]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Project
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Form Section */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Response Escalation Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Issue Type & Category Type Dropdowns */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Issue Type <span className="text-red-500">*</span></Label>
                  <Select value={selectedIssueTypeId} onValueChange={setSelectedIssueTypeId}>
                    <SelectTrigger className="w-full border-gray-300">
                      <SelectValue placeholder="Select Issue Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {issueTypeOptions.map((issueType) => (
                        <SelectItem key={issueType.id} value={String(issueType.id)}>
                          {issueType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Category Type <span className="text-red-500">*</span></Label>
                  <Select value={selectedCategoryTypeId} onValueChange={setSelectedCategoryTypeId}>
                    <SelectTrigger className="w-full border-gray-300">
                      <SelectValue placeholder="Select Category Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryDropdownOptions.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Assign To Dropdown */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Assign To</Label>
                <ReactSelect
                  isMulti
                  options={userOptions}
                  onChange={(selected) => {
                    const newAssignTo = selected ? selected.map(s => s.value) : []
                    setSelectedAssignTo(newAssignTo)
                  }}
                  value={userOptions.filter(option => selectedAssignTo.includes(option.value))}
                  placeholder="Select users to assign..."
                  isLoading={loadingUsers}
                  isDisabled={loadingUsers}
                  className="w-full"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '40px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      boxShadow: 'none',
                      '&:hover': {
                        borderColor: '#9ca3af'
                      }
                    }),
                    multiValue: (base) => ({
                      ...base,
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

              {/* Escalation Matrix Table */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Escalation Matrix</Label>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold w-24">Levels</TableHead>
                        <TableHead className="font-semibold">Escalation To</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(['e1', 'e2', 'e3', 'e4', 'e5'] as const).map((level) => (
                        <TableRow key={level}>
                          <TableCell className="font-medium">
                            {level.toUpperCase()}
                          </TableCell>
                          <TableCell>
                            <ReactSelect
                              isMulti
                              options={userOptions}
                              onChange={(selected) => {
                                const newUsers = selected ? selected.map(s => s.value) : []
                                const updatedUsers = { ...selectedUsers, [level]: newUsers }
                                setSelectedUsers(updatedUsers)
                                form.setValue('escalationLevels', updatedUsers)
                              }}
                              value={userOptions.filter(option => selectedUsers[level].includes(option.value))}
                              placeholder="Select users..."
                              isLoading={loadingUsers}
                              isDisabled={loadingUsers}
                              className="min-w-[250px]"
                              menuPortalTarget={document.body}
                              menuPosition="fixed"
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
                                menuPortal: (base) => ({
                                  ...base,
                                  zIndex: 9999
                                }),
                                menu: (base) => ({
                                  ...base,
                                  zIndex: 9999
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
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              className="bg-[#C72030] hover:bg-[#A61B29] text-white border-none font-semibold px-8 py-2"
              disabled={submissionLoading || loadingUsers}
            >
              {submissionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Rule...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </div>
        </form>

        {/* Rules List Section */}
        <Card className="border border-gray-200">
          <CardHeader className="border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Filter</CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-gray-700">Issue Type</Label>
                  <Select value={filterIssueTypeId || 'all'} onValueChange={(val) => setFilterIssueTypeId(val === 'all' ? '' : val)}>
                    <SelectTrigger className="w-40 border-gray-200">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {issueTypeOptions.map((issueType) => (
                        <SelectItem key={issueType.id} value={String(issueType.id)}>
                          {issueType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-gray-700">Category Type</Label>
                  <Select value={filterCategoryId || 'all'} onValueChange={(val) => setFilterCategoryId(val === 'all' ? '' : val)}>
                    <SelectTrigger className="w-40 border-gray-200">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {categoryDropdownOptions.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  className="bg-[#C72030] hover:bg-[#A61B29] text-white border-none font-semibold px-4"
                  onClick={handleApplyFilter}
                >
                  Apply
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-4"
                  onClick={handleResetFilter}
                >
                  Reset
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {escalationRulesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#C72030]" />
                <span className="ml-2 text-gray-600">Loading escalation rules...</span>
              </div>
            ) : escalationRulesList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No escalation rules found.</p>
                <p className="text-sm mt-1">Create your first rule using the form above.</p>
              </div>
            ) : (
              <div className="space-y-6 p-6">
                {escalationRulesList.map((rule, index) => (
                  <div key={rule.id} className="border border-gray-200 rounded-lg bg-white shadow-sm">
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-semibold text-gray-900">Rule {index + 1}</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRule(rule)}
                            className="h-8 w-8 p-0 text-gray-600 hover:text-[#C72030] hover:bg-[#EDEAE3]"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Rule</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this response escalation rule? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteRule(rule.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50 border-b border-gray-200 hover:bg-gray-50">
                            <TableHead className="font-semibold text-gray-900 text-left py-3 px-4">Issue Type</TableHead>
                            <TableHead className="font-semibold text-gray-900 text-left py-3 px-4">Category Type</TableHead>
                            <TableHead className="font-semibold text-gray-900 text-left py-3 px-4 w-20">Levels</TableHead>
                            <TableHead className="font-semibold text-gray-900 text-left py-3 px-4">Escalation To</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="border-b border-gray-100 hover:bg-gray-50/50">
                            <TableCell className="py-4 px-4 align-top font-medium text-gray-900">
                              {getIssueTypeName(rule.issue_type_id)}
                            </TableCell>
                            <TableCell className="py-4 px-4 align-top font-medium text-gray-900">
                              {getCategoryName(rule.category_id)}
                            </TableCell>
                            <TableCell className="py-4 px-4 align-top">
                              <div className="space-y-2">
                                {['E1', 'E2', 'E3', 'E4', 'E5'].map((level) => (
                                  <div key={level} className="text-sm text-gray-700 font-medium">
                                    {level}
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="py-4 px-4 align-top">
                              <div className="space-y-2">
                                {['E1', 'E2', 'E3', 'E4', 'E5'].map((level) => {
                                  const escalations = rule.escalations || rule.escalation_matrix || []
                                  const levelData = escalations.find((e: any) => e.name === level || e.level === level)
                                  const users = levelData?.escalate_to_users || levelData?.escalation_to || null
                                  return (
                                    <div key={level} className="text-sm text-gray-700">
                                      {getUserNames(users)}
                                    </div>
                                  )
                                })}
                              </div>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {!escalationRulesLoading && escalationRulesPagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadEscalationRules(escalationRulesPagination.currentPage - 1, filterIssueTypeId, filterCategoryId)}
              disabled={escalationRulesPagination.currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {escalationRulesPagination.currentPage} of {escalationRulesPagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadEscalationRules(escalationRulesPagination.currentPage + 1, filterIssueTypeId, filterCategoryId)}
              disabled={escalationRulesPagination.currentPage === escalationRulesPagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Response Escalation Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Issue Type & Category Type Dropdowns */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Issue Type <span className="text-red-500">*</span></Label>
                  <Select value={editIssueTypeId} onValueChange={setEditIssueTypeId}>
                    <SelectTrigger className="w-full border-gray-300">
                      <SelectValue placeholder="Select Issue Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {issueTypeOptions.map((issueType) => (
                        <SelectItem key={issueType.id} value={String(issueType.id)}>
                          {issueType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Category Type <span className="text-red-500">*</span></Label>
                  <Select value={editCategoryTypeId} onValueChange={setEditCategoryTypeId}>
                    <SelectTrigger className="w-full border-gray-300">
                      <SelectValue placeholder="Select Category Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryDropdownOptions.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Assign To Dropdown */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Assign To</Label>
                <ReactSelect
                  isMulti
                  options={userOptions}
                  onChange={(selected) => {
                    const newAssignTo = selected ? selected.map(s => s.value) : []
                    setEditAssignTo(newAssignTo)
                  }}
                  value={userOptions.filter(option => editAssignTo.includes(option.value))}
                  placeholder="Select users to assign..."
                  isLoading={loadingUsers}
                  isDisabled={loadingUsers}
                  className="w-full"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '40px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      boxShadow: 'none',
                      '&:hover': {
                        borderColor: '#9ca3af'
                      }
                    }),
                    multiValue: (base) => ({
                      ...base,
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

              {/* Escalation Levels */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Escalation Matrix</Label>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold w-24">Levels</TableHead>
                        <TableHead className="font-semibold">Escalation To</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(['e1', 'e2', 'e3', 'e4', 'e5'] as const).map((level) => (
                        <TableRow key={level}>
                          <TableCell className="font-medium">
                            {level.toUpperCase()}
                          </TableCell>
                          <TableCell>
                            <ReactSelect
                              isMulti
                              options={userOptions}
                              value={userOptions.filter(option => selectedUsers[level].includes(option.value))}
                              onChange={(selected) => {
                                const newUsers = selected ? selected.map(s => s.value) : []
                                const updatedUsers = { ...selectedUsers, [level]: newUsers }
                                setSelectedUsers(updatedUsers)
                                form.setValue('escalationLevels', updatedUsers)
                              }}
                              placeholder="Select users..."
                              isLoading={loadingUsers}
                              isDisabled={loadingUsers}
                              className="min-w-[250px]"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateRule}
                  className="bg-[#C72030] hover:bg-[#A61B29] text-white"
                >
                  Update Rule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}