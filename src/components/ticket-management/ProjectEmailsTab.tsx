import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { getAuthHeader, getFullUrl } from '@/config/apiConfig';
import { toast } from 'sonner';
import { Trash2, Edit } from 'lucide-react';

interface ProjectEmail {
  id: number;
  society_id: number;
  email: string;
  active: boolean | null;
}

export const ProjectEmailsTab: React.FC = () => {
  const [emails, setEmails] = useState<ProjectEmail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  // Fetch project emails from consolidated API
  const fetchProjectEmails = useCallback(async () => {
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
        setEmails(data.helpdesk_project_email || []);
      }
    } catch (error) {
      console.error('Error fetching project emails:', error);
      toast.error('Failed to fetch project emails');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjectEmails();
  }, [fetchProjectEmails]);

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!emailInput.trim()) {
      toast.error('Please enter email address');
      return;
    }

    if (!isValidEmail(emailInput.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('helpdesk_project_email[email]', emailInput.trim());

      const response = await fetch(
        getFullUrl('/crm/admin/helpdesk_categories/create_project_email.json'),
        {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeader(),
          },
          body: formData,
        }
      );

      if (response.ok) {
        toast.success('Email added successfully!');
        setEmailInput('');
        fetchProjectEmails();
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || 'Failed to add email');
      }
    } catch (error) {
      console.error('Error adding email:', error);
      toast.error('Failed to add email');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (email: ProjectEmail) => {
    if (!confirm('Are you sure you want to delete this email?')) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('helpdesk_project_email[active]', '0');

      const response = await fetch(
        getFullUrl(`/crm/admin/helpdesk_categories/update_project_email.json?id=${email.id}`),
        {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeader(),
          },
          body: formData,
        }
      );

      if (response.ok) {
        toast.success('Email deleted successfully!');
        fetchProjectEmails();
      } else {
        toast.error('Failed to delete email');
      }
    } catch (error) {
      console.error('Error deleting email:', error);
      toast.error('Failed to delete email');
    }
  };

  // Handle edit (optional - opens email client)
  const handleEdit = (email: ProjectEmail) => {
    window.location.href = `mailto:${email.email}`;
  };

  // Table columns
  const columns = [
    { key: 'srno', label: 'Sr.No', sortable: false },
    { key: 'email', label: 'Email Id', sortable: true },
  ];

  const renderCell = (item: ProjectEmail, columnKey: string) => {
    const index = emails.findIndex(e => e.id === item.id);

    switch (columnKey) {
      case 'srno':
        return index + 1;
      case 'email':
        return item.email || '--';
      default:
        return '--';
    }
  };

  const renderActions = (item: ProjectEmail) => (
    <div className="flex gap-2">
      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
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
          <CardTitle>Add Project Email</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            {/* Email Input */}
            <div className="flex-1">
              <Input
                type="email"
                placeholder="Enter Email Id"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit();
                  }
                }}
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
          <CardTitle>Project Emails</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Loading project emails...</div>
            </div>
          ) : (
            <EnhancedTable
              data={emails}
              columns={columns}
              renderCell={renderCell}
              renderActions={renderActions}
              storageKey="project-emails-table"
              enableSearch={true}
              searchPlaceholder="Search emails..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
