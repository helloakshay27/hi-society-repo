import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { ticketManagementAPI } from '@/services/ticketManagementAPI';
import { userService } from '@/services/userService';
import { API_CONFIG, getAuthHeader, getFullUrl } from '@/config/apiConfig';
import { toast } from 'sonner';
import ReactSelect from 'react-select';
import { Label } from "@/components/ui/label";
import { TextField, FormControl as MuiFormControl, InputLabel, Select as MuiSelect, MenuItem } from '@mui/material';
import { fieldStyles, menuProps } from './fieldStyles';
import { Edit, Plus, Trash2, Upload, X } from 'lucide-react';

const categorySchema = z.object({
  categoryName: z.string().min(1, 'Category name is required'),
  responseTime: z.string().min(1, 'Response time is required'),
  customerEnabled: z.boolean(),
  siteId: z.string().min(1, 'Site selection is required'),
  engineerIds: z.array(z.number()).optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryApiResponse {
  helpdesk_categories: Array<{
    id: number;
    society_id: number;
    name: string;
    issue_type_id: number | null;
    of_phase: string | null;
    position: number | null;
    created_at: string;
    updated_at: string;
    icon_url: string;
    doc_type: string | null;
    selected_icon_url: string;
    priority?: string | null;
    response_tat: Record<string, unknown>;
    tat: number | string | null;
    project_tat?: number | string | null;
    active?: boolean | number | null;
    assigned_to_names?: string;
    category_email: Array<{
      id: number;
      cat_id: number;
      site_id: number;
      email: string;
      active: number | null;
      created_at: string;
      updated_at: string;
    }>;
    complaint_faqs?: Array<{
      id: number;
      helpdesk_category_id: number;
      question: string;
      answer: string;
      created_at: string;
      updated_at: string;
    }>;
    complaint_worker?: {
      id: number;
      society_id: number;
      category_id: number;
      assign_to: string[];
      created_at: string;
      updated_at: string;
      assign: string | null;
      esc_type: string | null;
      of_phase: string;
      of_atype: string;
      site_id: number;
      issue_type_id: number | null;
      issue_related_to: string | null;
      helpdesk_sub_category_id: number | null;
      cloned_by_id: number | null;
      cloned_at: string | null;
    };
  }>;
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
    per_page: number;
  };
  statuses?: Array<{
    id: number;
    society_id: number;
    name: string;
    active: number;
    color_code: string;
  }>;
}

interface Site {
  id: number;
  name: string;
}

interface FAQ {
  id?: number;
  helpdesk_category_id?: number;
  question: string;
  answer: string;
  created_at?: string;
  updated_at?: string;
  _destroy?: boolean;
}

interface SitesApiResponse {
  message: string;
  code: number;
  sites: Site[];
  selected_site: Site;
}

export const CategoryTypeTab: React.FC = () => {
  const [categories, setCategories] = useState<CategoryApiResponse['helpdesk_categories']>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const perPage = 20;
  const [faqItems, setFaqItems] = useState<FAQ[]>([{ question: '', answer: '' }]);
  const [vendorEmails, setVendorEmails] = useState<string[]>(['']);
  const [engineers, setEngineers] = useState<{ id: number; full_name: string }[]>([]);
  const [selectedEngineers, setSelectedEngineers] = useState<number[]>([]);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [vendorEmailEnabled, setVendorEmailEnabled] = useState(false);
  const [issueTypes, setIssueTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedIssueType, setSelectedIssueType] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [fmResponseTime, setFmResponseTime] = useState('');
  const [projectResponseTime, setProjectResponseTime] = useState('');
  
  const priorityOptions = ['P1', 'P2', 'P3', 'P4', 'P5'];
  const [accountData, setAccountData] = useState<{
    id?: string;
    company_id?: number;
    site_id?: number;
  } | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryApiResponse['helpdesk_categories'][0] | null>(null);
  const [editFaqItems, setEditFaqItems] = useState<FAQ[]>([{ question: '', answer: '' }]);
  const [editIconFile, setEditIconFile] = useState<File | null>(null);
  const [editVendorEmailEnabled, setEditVendorEmailEnabled] = useState(false);
  const [editVendorEmails, setEditVendorEmails] = useState<string[]>(['']);
  const [editSelectedSiteId, setEditSelectedSiteId] = useState<string>('');
  const [editIssueType, setEditIssueType] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editFmResponseTime, setEditFmResponseTime] = useState('');
  const [editProjectResponseTime, setEditProjectResponseTime] = useState('');
  const [selectedOfPhase, setSelectedOfPhase] = useState('');
  const [editOfPhase, setEditOfPhase] = useState('');
  const [editCategoryName, setEditCategoryName] = useState('');

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      categoryName: '',
      responseTime: '',
      customerEnabled: false,
      siteId: '',
      engineerIds: [],
    },
  });

  const fetchAccountData = useCallback(async () => {
    try {
      const data = await userService.getAccountDetails();
      setAccountData(data);
      
      // Auto-populate form with company_id as society_id
      form.setValue('siteId', (data as any).company_id?.toString() || '');
      
      // Fetch allowed sites for the user
      const sitesResponse = await fetch(getFullUrl(`/pms/sites/allowed_sites.json?user_id=${data.id}`), {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

        if (sitesResponse.ok) {
          const sitesData = await sitesResponse.json();
          if (sitesData.sites && Array.isArray(sitesData.sites)) {
            setSites(sitesData.sites);
          }
          if (sitesData.selected_site) {
            setSelectedSite(sitesData.selected_site);
          }
        }
    } catch (error) {
      console.error('Error fetching account data:', error);
      toast.error('Failed to fetch account data');
    }
  }, [form]);

  const fetchCategories = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        getFullUrl(`/crm/admin/helpdesk_categories.json?page=${page}`),
        {
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data: CategoryApiResponse = await response.json();
      setCategories(data.helpdesk_categories || []);
      if (data.pagination) {
        setCurrentPage(data.pagination.current_page);
        setTotalPages(data.pagination.total_pages);
        setTotalCount(data.pagination.total_count);
      }
    } catch (error) {
      toast.error('Failed to fetch categories');
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch engineers
  useEffect(() => {
    const fetchEngineers = async () => {
      try {
        const response = await ticketManagementAPI.getEngineers();
        const formatted = response?.users?.map((user: { id: number; full_name: string }) => ({ id: user.id, full_name: user.full_name })) || [];
        setEngineers(formatted);
      } catch (error) {
        console.error('Error fetching engineers:', error);
        toast.error('Failed to fetch engineers');
      }
    };
    fetchEngineers();
  }, []);

  const fetchIssueTypes = async () => {
    try {
      const response = await fetch(getFullUrl('/user/issue_type.json'), {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setIssueTypes(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching issue types:', error);
      toast.error('Failed to fetch issue types');
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchAccountData();
    fetchIssueTypes();
  }, [fetchCategories, fetchAccountData]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    fetchCategories(page);
  };

  const fetchSites = async () => {
    try {
      const userData = localStorage.getItem('user');
      let userId = '12437'; // default fallback
      
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          userId = parsedUser.id || parsedUser.user_id || '12437';
        } catch (e) {
          console.warn('Could not parse user data from localStorage');
        }
      }

      const response = await ticketManagementAPI.getSites(userId);
      if (response.sites && Array.isArray(response.sites)) {
        setSites(response.sites);
      } else {
        setSites([]);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
      toast.error('Failed to fetch sites');
    }
  };

  const handleCreateSubmit = async () => {
    const categoryNameValue = form.getValues('categoryName');
    
    if (!categoryNameValue?.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    
    const data: CategoryFormData = {
      categoryName: categoryNameValue.trim(),
      responseTime: fmResponseTime,
      customerEnabled: false,
      siteId: accountData?.company_id?.toString() || '',
      engineerIds: [],
    };

    await handleSubmit(data);
  };

  const handleSubmit = async (data: CategoryFormData) => {
    // Validate required fields
    if (!selectedIssueType) {
      toast.error('Please select issue type');
      return;
    }
    if (!selectedPriority) {
      toast.error('Please select priority');
      return;
    }
    if (!fmResponseTime) {
      toast.error('Please enter FM response time');
      return;
    }
    if (!projectResponseTime) {
      toast.error('Please enter project response time');
      return;
    }

    // Check for duplicate category name
    const existingCategory = categories.find(
      category => category.name.toLowerCase() === data.categoryName.toLowerCase()
    );
    
    if (existingCategory) {
      toast.error('Category name already exists. Please choose a different name.');
      return;
    }

    // Validate vendor emails if enabled
    if (vendorEmailEnabled) {
      const invalidEmails = vendorEmails.filter(email => email.trim() && !isValidEmail(email));
      if (invalidEmails.length > 0) {
        toast.error('Please enter valid email addresses for all vendor emails.');
        return;
      }
      
      // Check if at least one email is provided when vendor email is enabled
      const validEmails = vendorEmails.filter(email => email.trim());
      if (validEmails.length === 0) {
        toast.error('Please provide at least one vendor email when vendor email is enabled.');
        return;
      }
    }

    // Validate FAQ items - if any FAQ is partially filled, both question and answer are required
    const incompleteFaqItems = faqItems.filter(item => 
      (item.question.trim() && !item.answer.trim()) || (!item.question.trim() && item.answer.trim())
    );
    
    if (incompleteFaqItems.length > 0) {
      toast.error('Please complete all FAQ items. If you enter a question, you must also provide an answer.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      // Helpdesk category data
      formData.append('helpdesk_category[issue_type_id]', selectedIssueType);
      formData.append('helpdesk_category[name]', data.categoryName);
      formData.append('helpdesk_category[tat]', fmResponseTime);
      formData.append('helpdesk_category[project_tat]', projectResponseTime);
      formData.append('helpdesk_category[priority]', selectedPriority);
      formData.append('helpdesk_category[active]', '1');
      
      if (iconFile) {
        formData.append('helpdesk_category[icon]', iconFile);
      }
      const response = await fetch(getFullUrl('/crm/admin/helpdesk_categories.json'), {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          // Don't set Content-Type header when using FormData with files
        },
        body: formData,
      });

      if (response.ok) {
        toast.success('Category created successfully!');
        
        // Reset form
        form.reset();
        setSelectedIssueType('');
        setSelectedPriority('');
        setFmResponseTime('');
        setProjectResponseTime('');
        setSelectedOfPhase('');
        setIconFile(null);
        setAddDialogOpen(false);
        
        fetchCategories(1);
      } else {
        // Try to get the error message from the response
        const errorData = await response.json().catch(() => null);
        console.error('API Response Error:', errorData);
        
        // Check if it's a duplicate name error
        if (errorData?.errors?.name?.includes('has already been taken') || 
            errorData?.message?.toLowerCase().includes('already exists') ||
            errorData?.error?.toLowerCase().includes('already exists')) {
          toast.error('Category name already exists. Please choose a different name.');
        } else {
          toast.error(errorData?.message || 'Failed to create category');
        }
      }
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addFaqItem = () => {
    setFaqItems([...faqItems, { question: '', answer: '' }]);
  };

  const updateFaqItem = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = faqItems.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setFaqItems(updated);
  };

  const removeFaqItem = (index: number) => {
    if (faqItems.length > 1) {
      setFaqItems(faqItems.filter((_, i) => i !== index));
    }
  };

  const addVendorEmail = () => {
    setVendorEmails([...vendorEmails, '']);
  };

  const updateVendorEmail = (index: number, value: string) => {
    const updated = vendorEmails.map((email, i) => 
      i === index ? value : email
    );
    setVendorEmails(updated);
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleVendorEmailChange = (index: number, value: string) => {
    // Allow typing but show validation state
    updateVendorEmail(index, value);
  };

  const removeVendorEmail = (index: number) => {
    if (vendorEmails.length > 1) {
      setVendorEmails(vendorEmails.filter((_, i) => i !== index));
    }
  };

  const handleEdit = (category: CategoryApiResponse['helpdesk_categories'][0]) => {
    setEditingCategory(category);
    setEditCategoryName(category.name || '');
    setIsEditModalOpen(true);

    const fetchCategoryDetails = async () => {
      try {
        const response = await fetch(getFullUrl(`/crm/admin/helpdesk_categories/${category.id}.json`), {
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const json = await response.json();
          const data = json.helpdesk_category || json;
          setEditingCategory(data);
          setEditCategoryName(data.name || '');
          setEditIssueType(data.issue_type_id ? data.issue_type_id.toString() : '');
          setEditFmResponseTime(data.tat != null ? String(data.tat) : '');
          setEditProjectResponseTime(data.project_tat != null ? String(data.project_tat) : '');
          setEditPriority(data.priority || '');
          setEditIconFile(null);
          setEditVendorEmailEnabled(data.category_email?.length > 0);
          setEditVendorEmails(data.category_email?.length > 0 ? data.category_email.map((e: { email: string }) => e.email) : ['']);
        }
      } catch (error) {
        console.error('Error fetching category details:', error);
        toast.error('Failed to fetch category details');
      }
    };
    fetchCategoryDetails();
  };

  const handleEditSubmit = async () => {
    if (!editingCategory) return;

    if (!editCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    if (!editIssueType) {
      toast.error('Please select issue type');
      return;
    }
    if (!editFmResponseTime) {
      toast.error('Please enter FM response time');
      return;
    }

    setIsSubmitting(true);
    try {
      const submitFormData = new FormData();

      submitFormData.append('helpdesk_category[issue_type_id]', editIssueType);
      submitFormData.append('helpdesk_category[name]', editCategoryName.trim());
      submitFormData.append('helpdesk_category[tat]', editFmResponseTime);
      if (editProjectResponseTime) {
        submitFormData.append('helpdesk_category[project_tat]', editProjectResponseTime);
      }
      if (editPriority) {
        submitFormData.append('helpdesk_category[priority]', editPriority);
      }
      if (editOfPhase) {
        submitFormData.append('helpdesk_category[of_phase]', editOfPhase);
      }
      if (editIconFile) {
        submitFormData.append('helpdesk_category[icon]', editIconFile);
      }

      const response = await fetch(getFullUrl(`/crm/admin/helpdesk_categories/${editingCategory.id}.json`), {
        method: 'PATCH',
        headers: {
          'Authorization': getAuthHeader(),
        },
        body: submitFormData,
      });

      if (response.ok) {
        toast.success('Category updated successfully!');
        setIsEditModalOpen(false);
        setEditingCategory(null);
        fetchCategories(currentPage);
      } else {
        const errorData = await response.json().catch(() => null);
        console.error('API Response Error:', errorData);
        toast.error(errorData?.message || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addEditFaqItem = () => {
    setEditFaqItems([...editFaqItems, { question: '', answer: '' }]);
  };

  const updateEditFaqItem = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = editFaqItems.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setEditFaqItems(updated);
  };

  const removeEditFaqItem = (index: number) => {
    const faqToRemove = editFaqItems[index];
    
    // If the FAQ has an ID (existing FAQ), mark it for destruction
    if (faqToRemove.id) {
      const updated = editFaqItems.map((item, i) => 
        i === index ? { ...item, _destroy: true } : item
      );
      setEditFaqItems(updated);
    } else {
      // If it's a new FAQ (no ID), just remove it from the array
      if (editFaqItems.length > 1) {
        setEditFaqItems(editFaqItems.filter((_, i) => i !== index));
      }
    }
  };

  const handleEditIconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setEditIconFile(file);
    }
  };

  const addEditVendorEmail = () => {
    setEditVendorEmails([...editVendorEmails, '']);
  };

  const updateEditVendorEmail = (index: number, value: string) => {
    const updated = editVendorEmails.map((email, i) => 
      i === index ? value : email
    );
    setEditVendorEmails(updated);
  };

  const handleEditVendorEmailChange = (index: number, value: string) => {
    // Allow typing but show validation state
    updateEditVendorEmail(index, value);
  };

  const removeEditVendorEmail = (index: number) => {
    if (editVendorEmails.length > 1) {
      setEditVendorEmails(editVendorEmails.filter((_, i) => i !== index));
    }
  };

  const handleDelete = async (category: CategoryApiResponse['helpdesk_categories'][0]) => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }
    
    try {
      const response = await fetch(getFullUrl(`/pms/admin/helpdesk_categories/${category.id}.json`), {
        method: 'PATCH',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          helpdesk_category: {
            active: "0"
          },
          id: category.id.toString()
        }),
      });

      if (response.ok) {
        setCategories(categories.filter(cat => cat.id !== category.id));
        toast.success('Category deleted successfully!');
        fetchCategories(currentPage);
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  // Transform categories data to include searchable email string
  const transformedCategories = useMemo(() => {
    return categories.map(category => ({
      ...category,
      searchable_emails: category.category_email?.length 
        ? category.category_email.map(emailObj => emailObj.email).join(', ')
        : ''
    }));
  }, [categories]);

  const handleIconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIconFile(file);
    }
  };

  const columns = [
    { key: 'srno', label: 'S.No.', sortable: false },
    { key: 'name', label: 'Category Type', sortable: true },
    { key: 'issue_type_id', label: 'Issue Type', sortable: false },
    { key: 'priority', label: 'Priority', sortable: false },
    { key: 'tat', label: 'Response Time (FM)', sortable: false },
    { key: 'project_tat', label: 'Project Response Time', sortable: false },
    
    { key: 'icon_url', label: 'Icon', sortable: false },
  ];

  const renderCell = (item: CategoryApiResponse['helpdesk_categories'][0], columnKey: string) => {
    const index = categories.findIndex(cat => cat.id === item.id);
    
    switch (columnKey) {
      case 'srno':
        return index + 1;
      case 'name':
        return item.name;
      case 'issue_type_id': {
        const issueType = issueTypes.find((t) => t.id === item.issue_type_id);
        return issueType ? issueType.name : (item.issue_type_id != null ? String(item.issue_type_id) : '--');
      }
      case 'priority':
        return item.priority || '--';
      case 'project_tat':
        return item.project_tat || '--';
      case 'assign_to_names':
        // Use the assigned_to_names field directly from the API response
        if (item.assigned_to_names) {
          return item.assigned_to_names;
        }
        
        // Fallback: try to match from complaint_worker if assigned_to_names is not available
        if (item.complaint_worker?.assign_to && engineers.length > 0) {
          // Handle both array and non-array cases
          const assignToArray = Array.isArray(item.complaint_worker.assign_to) 
            ? item.complaint_worker.assign_to 
            : [];
          
          if (assignToArray.length === 0) return '--';
          
          const names = assignToArray
            .map((id: string) => {
              const engineer = engineers.find(e => e.id === Number(id));
              return engineer ? engineer.full_name : null;
            })
            .filter(Boolean)
            .join(', ');
          return names || '--';
        }
        return '--';
      case 'tat':
        return item.tat || '--';
      case 'category_email':
        return item.category_email?.length ? 
          item.category_email.map(emailObj => emailObj.email).join(', ') : '--';
      case 'icon_url':
        return item.icon_url ? (
          <img 
            src={item.icon_url} 
            alt="Icon" 
            className="w-8 h-8 object-cover rounded mx-auto" 
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <span className="text-gray-400">No icon</span>
        );
      case 'selected_icon_url':
        return item.selected_icon_url ? (
          <img 
            src={item.selected_icon_url} 
            alt="Selected Icon" 
            className="w-8 h-8 object-cover rounded mx-auto"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <span className="text-gray-400">No icon</span>
        );
      default:
        return '--';
    }
  };

  const renderActions = (item: CategoryApiResponse['helpdesk_categories'][0]) => (
    <div className="flex gap-2">
      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Add Category Dialog */}
      <Dialog open={addDialogOpen} modal={false} onOpenChange={(open) => {
        if (!open) {
          form.reset();
          setSelectedIssueType('');
          setSelectedPriority('');
          setFmResponseTime('');
          setProjectResponseTime('');
          setIconFile(null);
        }
        setAddDialogOpen(open);
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Issue Type Dropdown */}
                <MuiFormControl fullWidth variant="outlined">
                  <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Issue Type <span style={{ color: 'red' }}>*</span></InputLabel>
                  <MuiSelect
                    value={selectedIssueType}
                    onChange={(e) => setSelectedIssueType(e.target.value)}
                    displayEmpty
                    label="Select Issue Type *"
                    sx={fieldStyles}
                    MenuProps={menuProps}
                  >
                    <MenuItem value="" disabled><em>Select Issue Type</em></MenuItem>
                    {issueTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                </MuiFormControl>

                {/* Category Name */}
                <FormField
                  control={form.control}
                  name="categoryName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <TextField
                          label={<>Enter category <span style={{ color: 'red' }}>*</span></>}
                          placeholder="Enter category"
                          value={field.value}
                          onChange={field.onChange}
                          fullWidth
                          variant="outlined"
                          InputLabelProps={{ shrink: true }}
                          InputProps={{ sx: fieldStyles }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* FM Response Time */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <TextField
                      label={<>Enter FM response time <span style={{ color: 'red' }}>*</span></>}
                      type="number"
                      placeholder="Enter FM response time"
                      value={fmResponseTime}
                      onChange={(e) => setFmResponseTime(e.target.value)}
                      inputProps={{ min: 0 }}
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault();
                      }}
                      fullWidth
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ sx: fieldStyles }}
                    />
                    <div className="w-16 flex items-center justify-center bg-gray-100 border border-gray-300 rounded px-3">
                      Min
                    </div>
                  </div>
                </div>

                {/* Project Response Time */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <TextField
                      label={<>Enter Project response time <span style={{ color: 'red' }}>*</span></>}
                      type="number"
                      placeholder="Enter Project response time"
                      value={projectResponseTime}
                      onChange={(e) => setProjectResponseTime(e.target.value)}
                      inputProps={{ min: 0 }}
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault();
                      }}
                      fullWidth
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ sx: fieldStyles }}
                    />
                    <div className="w-16 flex items-center justify-center bg-gray-100 border border-gray-300 rounded px-3">
                      Min
                    </div>
                  </div>
                </div>

                {/* Priority Dropdown */}
                <MuiFormControl fullWidth variant="outlined">
                  <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Priority <span style={{ color: 'red' }}>*</span></InputLabel>
                  <MuiSelect
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    displayEmpty
                    label="Select Priority *"
                    sx={fieldStyles}
                    MenuProps={menuProps}
                  >
                    <MenuItem value="" disabled><em>Select Priority</em></MenuItem>
                    {priorityOptions.map((priority) => (
                      <MenuItem key={priority} value={priority}>
                        {priority}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                </MuiFormControl>

                {/* Upload Icon */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Upload Icon
                  </label>
                  <div className="flex items-center gap-2">
                    <label htmlFor="icon-upload" className="cursor-pointer flex-1">
                      <Button type="button" variant="outline" size="sm" className="w-full justify-start" asChild>
                        <span>Choose file</span>
                      </Button>
                    </label>
                    <span className="text-sm text-gray-600">
                      {iconFile ? iconFile.name : 'No file chosen'}
                    </span>
                    <input
                      id="icon-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleIconChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Form>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={isSubmitting}
              className="bg-[#C72030] hover:bg-[#a01828] text-white"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Types Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <EnhancedTable
          data={transformedCategories}
          columns={columns}
          renderCell={renderCell}
          renderActions={renderActions}
          storageKey="category-types-table"
          enableSearch={true}
          searchPlaceholder="Search categories..."
          leftActions={
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="bg-[#C72030] hover:bg-[#a01828] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          }
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, totalCount)} of {totalCount} categories
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => handlePageChange(1)} disabled={currentPage === 1}>«</Button>
              <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>‹</Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === 'ellipsis' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">…</span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(p as number)}
                      className="w-8"
                    >
                      {p}
                    </Button>
                  )
                )}
              <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>›</Button>
              <Button variant="outline" size="sm" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}>»</Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Category Modal */}
      <Dialog open={isEditModalOpen} modal={false} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Edit Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Issue Type Dropdown */}
                <MuiFormControl fullWidth variant="outlined">
                  <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Issue Type <span style={{ color: 'red' }}>*</span></InputLabel>
                  <MuiSelect
                    value={editIssueType}
                    onChange={(e) => setEditIssueType(e.target.value)}
                    displayEmpty
                    label="Select Issue Type *"
                    sx={fieldStyles}
                    MenuProps={menuProps}
                  >
                    <MenuItem value="" disabled><em>Select Issue Type</em></MenuItem>
                    {issueTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                </MuiFormControl>

                {/* Category Name */}
                <div className="space-y-2">
                  <TextField
                    label={<>Category <span style={{ color: 'red' }}>*</span></>}
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    placeholder="Enter category"
                    fullWidth
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ sx: fieldStyles }}
                  />
                </div>

                {/* FM Response Time */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <TextField
                      label={<>Enter FM response time <span style={{ color: 'red' }}>*</span></>}
                      type="number"
                      placeholder="Enter FM response time"
                      value={editFmResponseTime}
                      onChange={(e) => setEditFmResponseTime(e.target.value)}
                      inputProps={{ min: 0 }}
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                      fullWidth
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ sx: fieldStyles }}
                    />
                    <div className="w-16 flex items-center justify-center bg-gray-100 border border-gray-300 rounded px-3">
                      Min
                    </div>
                  </div>
                </div>

                {/* Project Response Time */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <TextField
                      label={<>Enter Project response time <span style={{ color: 'red' }}>*</span></>}
                      type="number"
                      placeholder="Enter Project response time"
                      value={editProjectResponseTime}
                      onChange={(e) => setEditProjectResponseTime(e.target.value)}
                      inputProps={{ min: 0 }}
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                      fullWidth
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ sx: fieldStyles }}
                    />
                    <div className="w-16 flex items-center justify-center bg-gray-100 border border-gray-300 rounded px-3">
                      Min
                    </div>
                  </div>
                </div>

                {/* Priority Dropdown */}
                <MuiFormControl fullWidth variant="outlined">
                  <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select Priority <span style={{ color: 'red' }}>*</span></InputLabel>
                  <MuiSelect
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    displayEmpty
                    label="Select Priority *"
                    sx={fieldStyles}
                    MenuProps={menuProps}
                  >
                    <MenuItem value="" disabled><em>Select Priority</em></MenuItem>
                    {priorityOptions.map((priority) => (
                      <MenuItem key={priority} value={priority}>
                        {priority}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                </MuiFormControl>

                {/* Upload Icon */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Upload Icon</label>
                  <div className="flex items-center gap-2">
                    <label htmlFor="edit-icon-upload" className="cursor-pointer flex-1">
                      <Button type="button" variant="outline" size="sm" className="w-full justify-start" asChild>
                        <span>
                          Choose file
                        </span>
                      </Button>
                    </label>
                    <span className="text-sm text-gray-600">
                      {editIconFile ? editIconFile.name : 'No file chosen'}
                    </span>
                    <input
                      id="edit-icon-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleEditIconChange}
                    />
                  </div>
                  {/* Display current icon if available */}
                  {editingCategory.icon_url && !editIconFile && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">Current Icon:</p>
                      <img 
                        src={editingCategory.icon_url} 
                        alt="Current Icon" 
                        className="w-12 h-12 object-cover rounded border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  {/* Preview new icon if selected */}
                  {editIconFile && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">New Icon Preview:</p>
                      <img 
                        src={URL.createObjectURL(editIconFile)} 
                        alt="New Icon Preview" 
                        className="w-12 h-12 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Comment out old fields */}
              {/*
              <div>
                <label className="block text-sm font-medium mb-2">
                  Selected Sites <span className="text-red-500">*</span>
                </label>
                <ReactSelect
                  isMulti
                  options={sites.map(site => ({
                    value: site.id.toString(),
                    label: site.name
                  }))}
                  onChange={(selected) => {
                    if (!selected || selected.length === 0) {
                      setEditSelectedSiteId('');
                      return;
                    }
                    const siteIds = selected.map(s => s.value).join(',');
                    setEditSelectedSiteId(siteIds);
                  }}
                  value={editSelectedSiteId ? editSelectedSiteId.split(',').map(id => {
                    const site = sites.find(s => s.id.toString() === id.trim());
                    return site ? { value: id.trim(), label: site.name } : null;
                  }).filter(Boolean) : []}
                  className="mt-1"
                  placeholder="Select sites..."
                  noOptionsMessage={() => "No sites available"}
                />
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox id="edit-customer-enabled" />
                <label htmlFor="edit-customer-enabled" className="text-sm font-medium">Customer Enabled</label>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="vendor-email-enabled"
                    checked={editVendorEmailEnabled}
                    onCheckedChange={(checked) => setEditVendorEmailEnabled(!!checked)}
                  />
                  <label htmlFor="vendor-email-enabled" className="text-sm font-medium">Enable Vendor Email</label>
                </div>

                {editVendorEmailEnabled && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Vendor Emails</h3>
                      <Button type="button" onClick={addEditVendorEmail} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Email
                      </Button>
                    </div>

                    {editVendorEmails.map((email, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex-1">
                          <TextField
                            type="email"
                            placeholder="Enter vendor email"
                            value={email}
                            onChange={(e) => handleEditVendorEmailChange(index, e.target.value)}
                            fullWidth
                            variant="outlined"
                            InputLabelProps={{ shrink: true }}
                            InputProps={{ sx: fieldStyles }}
                          />
                        </div>
                        {editVendorEmails.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeEditVendorEmail(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <Label className="text-base font-semibold">Assign Engineers</Label>
                <div className="mt-2">
                  <ReactSelect
                    key={selectedEngineers.join(',')}
                    isMulti
                    options={engineers.map(engineer => ({
                      value: engineer.id,
                      label: engineer.full_name
                    }))}
                    onChange={(selected) => {
                      if (!selected) {
                        setSelectedEngineers([]);
                        return;
                      }
                      const newEngineers = selected.map(s => s.value);
                      setSelectedEngineers(newEngineers);
                    }}
                    value={engineers
                      .filter(engineer => selectedEngineers.includes(engineer.id))
                      .map(engineer => ({
                        value: engineer.id,
                        label: engineer.full_name
                      }))}
                    className="mt-1"
                    placeholder="Select engineers..."
                    noOptionsMessage={() => "No engineers available"}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">FAQs</h3>
                  <Button type="button" onClick={addEditFaqItem} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                  </Button>
                </div>

                {editFaqItems.map((item, index) => (
                  !item._destroy && (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Question
                        </label>
                        <textarea
                          placeholder="Question"
                          value={item.question}
                          onChange={(e) => updateEditFaqItem(index, 'question', e.target.value)}
                          className="w-full p-2 border rounded-md resize-none h-20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Answer
                        </label>
                        <div className="flex gap-2">
                          <textarea
                            placeholder="Answer"
                            value={item.answer}
                            onChange={(e) => updateEditFaqItem(index, 'answer', e.target.value)}
                            className="w-full p-2 border rounded-md resize-none h-20"
                          />
                          {(editFaqItems.filter(faq => !faq._destroy).length > 1 || !item.id) && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeEditFaqItem(index)}
                              className="h-fit mt-1"
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
              */}

              
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingCategory(null);
                  }}
                  variant="outline"
                  className="px-8"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleEditSubmit()}
                  disabled={isSubmitting}
                  className="bg-[#C72030] hover:bg-[#a01828] text-white px-8"
                >
                  {isSubmitting ? 'Updating...' : 'Submit'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
