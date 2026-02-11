import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
} from '@/components/ui/dialog';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { ticketManagementAPI } from '@/services/ticketManagementAPI';
import { API_CONFIG, getAuthHeader, getFullUrl } from '@/config/apiConfig';
import { toast } from 'sonner';
import ReactSelect from 'react-select';
import { Label } from "@/components/ui/label";
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
    position: number | null;
    created_at: string;
    updated_at: string;
    icon_url: string;
    doc_type: string;
    selected_icon_url: string;
    tat: string;
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
  statuses: Array<{
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
  
  const priorityOptions = ['P1', 'P2', 'P3', 'P4'];
  const [accountData, setAccountData] = useState<{
    id?: string;
    company_id?: number;
    site_id?: number;
  } | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
      const response = await fetch(getFullUrl('/api/users/account.json'), {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAccountData(data);
        
        // Auto-populate form with company_id as society_id
        form.setValue('siteId', data.company_id?.toString() || '');
        
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
      }
    } catch (error) {
      console.error('Error fetching account data:', error);
      toast.error('Failed to fetch account data');
    }
  }, [form]);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await ticketManagementAPI.getCategories();
      setCategories(response.helpdesk_categories || []);
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
    // Get form values directly from the form inputs
    const categoryNameInput = document.querySelector('input[name="categoryName"]') as HTMLInputElement;
    
    // Check for required fields with specific messages
    if (!categoryNameInput?.value?.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    
    if (!iconFile) {
      toast.error('Please select an icon');
      return;
    }
    
    // Get the form data
    const data: CategoryFormData = {
      categoryName: categoryNameInput.value.trim(),
      responseTime: fmResponseTime, // Use the state variable
      customerEnabled: false,
      siteId: accountData?.company_id?.toString() || '',
      engineerIds: [],
    };

    // Continue with the rest of the validation and submission logic
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
        setIconFile(null);
        
        fetchCategories();
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
    
    // Populate issue type, priority, and response times from category data
    if (category.complaint_worker?.issue_type_id) {
      setEditIssueType(category.complaint_worker.issue_type_id.toString());
    } else {
      setEditIssueType('');
    }
    
    // Set response times
    setEditFmResponseTime(category.tat || '');
    // If you have project_tat in API response, use it:
    // setEditProjectResponseTime(category.project_tat || '');
    setEditProjectResponseTime('');
    
    // Set priority - you may need to adjust based on where priority is stored
    setEditPriority('');
    
    // Populate FAQ items if available, otherwise default empty FAQ
    if (category.complaint_faqs && category.complaint_faqs.length > 0) {
      setEditFaqItems(category.complaint_faqs.map(faq => ({
        id: faq.id,
        question: faq.question || '',
        answer: faq.answer || ''
      })));
    } else {
      setEditFaqItems([{ question: '', answer: '' }]);
    }
    
    // Populate assigned engineers if available
    if (category.complaint_worker?.assign_to) {
      let engineerIds: number[] = [];
      
      // Handle both array and YAML string cases
      if (Array.isArray(category.complaint_worker.assign_to)) {
        engineerIds = category.complaint_worker.assign_to.map(id => parseInt(id));
      } else if (typeof category.complaint_worker.assign_to === 'string') {
        // Parse YAML string like "---\n- '33051'\n"
        const matches = category.complaint_worker.assign_to.match(/'(\d+)'/g);
        if (matches) {
          engineerIds = matches.map(match => parseInt(match.replace(/'/g, '')));
        }
      }
      
      setSelectedEngineers(engineerIds);
      form.setValue('engineerIds', engineerIds);
    } else {
      setSelectedEngineers([]);
      form.setValue('engineerIds', []);
    }
    
    setEditIconFile(null);
    setEditVendorEmailEnabled(category.category_email?.length > 0);
    setEditVendorEmails(category.category_email?.length > 0 ? category.category_email.map(e => e.email) : ['']);
    
    // Set the selected site IDs
    setEditSelectedSiteId(selectedSite?.id.toString() || sites[0]?.id.toString() || '');
    
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (formData: object) => {
    if (!editingCategory) return;
    
    // Get category name from input
    const categoryNameInput = document.querySelector('#edit-category-name') as HTMLInputElement;
    
    if (!categoryNameInput?.value?.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    
    // Validate required fields
    if (!editIssueType) {
      toast.error('Please select issue type');
      return;
    }
    if (!editPriority) {
      toast.error('Please select priority');
      return;
    }
    if (!editFmResponseTime) {
      toast.error('Please enter FM response time');
      return;
    }
    if (!editProjectResponseTime) {
      toast.error('Please enter project response time');
      return;
    }
    
    if (!editSelectedSiteId) {
      toast.error('Please select a site');
      return;
    }
    
    // Validate vendor emails if enabled
    if (editVendorEmailEnabled) {
      const invalidEmails = editVendorEmails.filter(email => email.trim() && !isValidEmail(email));
      if (invalidEmails.length > 0) {
        toast.error('Please enter valid email addresses for all vendor emails.');
        return;
      }
      
      const validEmails = editVendorEmails.filter(email => email.trim());
      if (validEmails.length === 0) {
        toast.error('Please provide at least one vendor email when vendor email is enabled.');
        return;
      }
    }

    // Validate FAQ items
    const incompleteFaqItems = editFaqItems.filter(item => 
      !item._destroy && ((item.question.trim() && !item.answer.trim()) || (!item.question.trim() && item.answer.trim()))
    );
    
    if (incompleteFaqItems.length > 0) {
      toast.error('Please complete all FAQ items. If you enter a question, you must also provide an answer.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const submitFormData = new FormData();
      
      // Helpdesk category data - only the 6 required parameters
      submitFormData.append('helpdesk_category[issue_type_id]', editIssueType);
      submitFormData.append('helpdesk_category[name]', categoryNameInput.value.trim());
      submitFormData.append('helpdesk_category[tat]', editFmResponseTime);
      submitFormData.append('helpdesk_category[project_tat]', editProjectResponseTime);
      submitFormData.append('helpdesk_category[priority]', editPriority);
      
      // Add icon if a new one is selected
      if (editIconFile) {
        submitFormData.append('helpdesk_category[icon]', editIconFile);
      }

      const response = await fetch(getFullUrl(`/pms/admin/modify_helpdesk_category/${editingCategory.id}.json`), {
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
        fetchCategories();
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
    { key: 'assign_to_names', label: 'Assignee', sortable: false },
    { key: 'tat', label: 'Response Time', sortable: false },
    { key: 'category_email', label: 'Vendor Email', sortable: false },
    { key: 'icon_url', label: 'Icon', sortable: false },
    // { key: 'selected_icon_url', label: 'Selected Icon', sortable: false },
  ];

  const renderCell = (item: CategoryApiResponse['helpdesk_categories'][0], columnKey: string) => {
    const index = categories.findIndex(cat => cat.id === item.id);
    
    switch (columnKey) {
      case 'srno':
        return index + 1;
      case 'name':
        return item.name;
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
      <Card>
        <CardHeader>
          <CardTitle>Add Category</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Issue Type Dropdown */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Select Issue Type <span className="text-red-500">*</span>
                  </label>
                  <Select value={selectedIssueType} onValueChange={setSelectedIssueType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Issue Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {issueTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Name */}
                <FormField
                  control={form.control}
                  name="categoryName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enter category <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Enter category" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* FM Response Time */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Enter FM response time <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      placeholder="Enter FM response time" 
                      value={fmResponseTime}
                      onChange={(e) => setFmResponseTime(e.target.value)}
                      min="0"
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                      className="flex-1"
                    />
                    <div className="w-16 flex items-center justify-center bg-gray-100 border border-gray-300 rounded px-3">
                      Min
                    </div>
                  </div>
                </div>

                {/* Project Response Time */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Enter Project response time <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      placeholder="Enter Project response time" 
                      value={projectResponseTime}
                      onChange={(e) => setProjectResponseTime(e.target.value)}
                      min="0"
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                      className="flex-1"
                    />
                    <div className="w-16 flex items-center justify-center bg-gray-100 border border-gray-300 rounded px-3">
                      Min
                    </div>
                  </div>
                </div>

                {/* Priority Dropdown */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Select Priority <span className="text-red-500">*</span>
                  </label>
                  <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Upload Icon */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Upload Icon <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <label htmlFor="icon-upload" className="cursor-pointer flex-1">
                      <Button type="button" variant="outline" size="sm" className="w-full justify-start" asChild>
                        <span>
                          Choose file
                        </span>
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

              {/* Comment out unused sections */}
              {/*
              <div className="space-y-2">
                <label className="block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Upload Icon <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <label htmlFor="icon-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Icon
                      </span>
                    </Button>
                  </label>
                  <input
                    id="icon-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleIconChange}
                  />
                  {iconFile && (
                    <span className="text-sm text-gray-600">{iconFile.name}</span>
                  )}
                </div>
              </div>

              <FormField
                control={form.control}
                name="siteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enable Sites <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <ReactSelect
                          isMulti
                          options={sites.map(site => ({
                            value: site.id.toString(),
                            label: site.name
                          }))}
                          onChange={(selected) => {
                            if (!selected || selected.length === 0) {
                              field.onChange('');
                              return;
                            }
                            const siteIds = selected.map(s => s.value).join(',');
                            field.onChange(siteIds);
                          }}
                          value={field.value ? 
                            sites
                              .filter(site => field.value.split(',').includes(site.id.toString()))
                              .map(site => ({
                                value: site.id.toString(),
                                label: site.name
                              }))
                            : []
                          }
                          className="mt-1"
                          placeholder="Select sites..."
                          noOptionsMessage={() => "No sites available"}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="engineerIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Engineers</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <ReactSelect
                          isMulti
                          options={engineers.map(engineer => ({
                            value: engineer.id,
                            label: engineer.full_name
                          }))}
                          onChange={(selected) => {
                            if (!selected) {
                              field.onChange([]);
                              return;
                            }
                            const newEngineers = selected.map(s => s.value);
                            field.onChange(newEngineers);
                          }}
                          value={engineers
                            .filter(engineer => field.value?.includes(engineer.id))
                            .map(engineer => ({
                              value: engineer.id,
                              label: engineer.full_name
                            }))}
                          className="mt-1"
                          placeholder="Select engineers..."
                          noOptionsMessage={() => "No engineers available"}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <input type="hidden" value="pms" />

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={vendorEmailEnabled}
                    onCheckedChange={(checked) => setVendorEmailEnabled(!!checked)}
                  />
                  <label className="text-sm font-medium">Enable Vendor Email</label>
                </div>

                {vendorEmailEnabled && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Vendor Emails</h3>
                      <Button type="button" onClick={addVendorEmail} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Email
                      </Button>
                    </div>

                    {vendorEmails.map((email, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            type="email"
                            placeholder="Enter vendor email"
                            value={email}
                            onChange={(e) => handleVendorEmailChange(index, e.target.value)}
                            className={`${
                              email && !isValidEmail(email) 
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                : ''
                            }`}
                          />
                          {email && !isValidEmail(email) && (
                            <p className="text-red-500 text-xs mt-1">Please enter a valid email address</p>
                          )}
                        </div>
                        {vendorEmails.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeVendorEmail(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">FAQ Section</h3>
                  <Button type="button" onClick={addFaqItem} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add FAQ
                  </Button>
                </div>

                {faqItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Question
                      </label>
                      <Input
                        placeholder="Enter question"
                        value={item.question}
                        onChange={(e) => updateFaqItem(index, 'question', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Answer
                      </label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter answer"
                          value={item.answer}
                          onChange={(e) => updateFaqItem(index, 'answer', e.target.value)}
                        />
                        {faqItems.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeFaqItem(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              */}

              <div className="flex justify-end gap-3">
                <Button 
                  type="button"
                  onClick={() => {
                    form.reset();
                    setSelectedIssueType('');
                    setSelectedPriority('');
                    setFmResponseTime('');
                    setProjectResponseTime('');
                    setIconFile(null);
                  }}
                  variant="outline"
                  className="px-8"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateSubmit}
                  disabled={isSubmitting}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category Types</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Loading categories...</div>
            </div>
          ) : (
            <EnhancedTable
              data={transformedCategories}
              columns={columns}
              renderCell={renderCell}
              renderActions={renderActions}
              storageKey="category-types-table"
              enableSearch={true}
              searchPlaceholder="Search categories..."
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Category Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Edit Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Issue Type Dropdown */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Select Issue Type <span className="text-red-500">*</span>
                  </label>
                  <Select value={editIssueType} onValueChange={setEditIssueType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Issue Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {issueTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="edit-category-name"
                    defaultValue={editingCategory.name}
                    placeholder="Enter category"
                    className="w-full"
                  />
                </div>

                {/* FM Response Time */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Enter FM response time <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      placeholder="Enter FM response time" 
                      value={editFmResponseTime}
                      onChange={(e) => setEditFmResponseTime(e.target.value)}
                      min="0"
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                      className="flex-1"
                    />
                    <div className="w-16 flex items-center justify-center bg-gray-100 border border-gray-300 rounded px-3">
                      Min
                    </div>
                  </div>
                </div>

                {/* Project Response Time */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Enter Project response time <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      placeholder="Enter Project response time" 
                      value={editProjectResponseTime}
                      onChange={(e) => setEditProjectResponseTime(e.target.value)}
                      min="0"
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                      className="flex-1"
                    />
                    <div className="w-16 flex items-center justify-center bg-gray-100 border border-gray-300 rounded px-3">
                      Min
                    </div>
                  </div>
                </div>

                {/* Priority Dropdown */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Select Priority <span className="text-red-500">*</span>
                  </label>
                  <Select value={editPriority} onValueChange={setEditPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
                          <Input
                            type="email"
                            placeholder="Enter vendor email"
                            value={email}
                            onChange={(e) => handleEditVendorEmailChange(index, e.target.value)}
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
                  onClick={() => handleEditSubmit({})}
                  disabled={isSubmitting}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8"
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
