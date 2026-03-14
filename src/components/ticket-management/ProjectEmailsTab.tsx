import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { getAuthHeader, getFullUrl } from '@/config/apiConfig';
import { toast } from 'sonner';
import { Trash2, Edit, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface ProjectEmail {
  id: number;
  society_id: number;
  email: string;
  active: boolean | null;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export const ProjectEmailsTab: React.FC = () => {
  const [emails, setEmails] = useState<ProjectEmail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState<ProjectEmail | null>(null);
  const [editEmailInput, setEditEmailInput] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Fetch project emails
  const fetchProjectEmails = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(getFullUrl('/crm/admin/helpdesk_email_index.json'), {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // API returns array directly
        setEmails(Array.isArray(data) ? data : []);
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

  // Handle add
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
      const response = await fetch(
        getFullUrl('/crm/admin/create_helpdesk_email.json'),
        {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            helpdesk_project_email: {
              email: emailInput.trim(),
            },
          }),
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

  // Open edit dialog
  const handleEdit = (email: ProjectEmail) => {
    setEditingEmail(email);
    setEditEmailInput(email.email);
    setEditDialogOpen(true);
  };

  // Handle edit submit
  const handleEditSubmit = async () => {
    if (!editEmailInput.trim()) {
      toast.error('Please enter email address');
      return;
    }

    if (!isValidEmail(editEmailInput.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!editingEmail) return;

    setIsEditSubmitting(true);
    try {
      const response = await fetch(
        getFullUrl('/crm/admin/update_helpdesk_email.json'),
        {
          method: 'PUT',
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editingEmail.id,
            helpdesk_project_email: {
              email: editEmailInput.trim(),
            },
          }),
        }
      );

      if (response.ok) {
        toast.success('Email updated successfully!');
        setEditDialogOpen(false);
        setEditingEmail(null);
        setEditEmailInput('');
        fetchProjectEmails();
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || 'Failed to update email');
      }
    } catch (error) {
      console.error('Error updating email:', error);
      toast.error('Failed to update email');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (email: ProjectEmail) => {
    if (!confirm('Are you sure you want to delete this email?')) {
      return;
    }

    try {
      const response = await fetch(
        getFullUrl(`/crm/admin/delete_helpdesk_email/${email.id}.json`),
        {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
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
      {/* Edit Email Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Email</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              type="email"
              placeholder="Enter Email Id"
              value={editEmailInput}
              onChange={(e) => setEditEmailInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEditSubmit();
              }}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditingEmail(null);
                setEditEmailInput('');
              }}
              disabled={isEditSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={isEditSubmitting}
              className="bg-[#C72030] hover:bg-[#a01828] text-white"
            >
              {isEditSubmitting ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                onKeyDown={(e) => {
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
