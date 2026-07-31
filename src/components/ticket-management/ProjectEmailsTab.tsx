import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
import { getAuthHeader, getFullUrl } from '@/config/apiConfig';
import { toast } from 'sonner';
import { Trash2, Edit, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { TextField } from '@mui/material';
import { fieldStyles } from './fieldStyles';

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

  // Add dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState<ProjectEmail | null>(null);
  const [editEmailInput, setEditEmailInput] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
        setAddDialogOpen(false);
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

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const filteredEmails = emails.filter((item) => {
    if (!searchTerm) return true;
    const query = searchTerm.toLowerCase();
    return Object.values(item).some((v) => String(v ?? '').toLowerCase().includes(query));
  });

  const totalCount = filteredEmails.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmails = filteredEmails.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPaginationItems = () => {
    if (!totalPages || totalPages <= 0) return null;
    const items = [];
    const showEllipsis = totalPages > 5;
    if (showEllipsis) {
      items.push(
        <PaginationItem key={1} className="cursor-pointer">
          <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>1</PaginationLink>
        </PaginationItem>
      );
      if (currentPage > 4) {
        items.push(<PaginationItem key="ellipsis1"><PaginationEllipsis /></PaginationItem>);
      } else {
        for (let i = 2; i <= Math.min(3, totalPages - 1); i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>{i}</PaginationLink>
            </PaginationItem>
          );
        }
      }
      if (currentPage > 3 && currentPage < totalPages - 2) {
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>{i}</PaginationLink>
            </PaginationItem>
          );
        }
      }
      if (currentPage < totalPages - 3) {
        items.push(<PaginationItem key="ellipsis2"><PaginationEllipsis /></PaginationItem>);
      } else {
        for (let i = Math.max(totalPages - 2, 2); i < totalPages; i++) {
          if (!items.find((item) => item.key === i.toString())) {
            items.push(
              <PaginationItem key={i} className="cursor-pointer">
                <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>{i}</PaginationLink>
              </PaginationItem>
            );
          }
        }
      }
      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages} className="cursor-pointer">
            <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>{totalPages}</PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>{i}</PaginationLink>
          </PaginationItem>
        );
      }
    }
    return items;
  };

  const renderCell = (item: ProjectEmail, columnKey: string) => {
    const index = filteredEmails.findIndex(e => e.id === item.id);

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
        <Trash2 className="h-4 w-4" style={{ color: '#000000' }} />
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Add Email Dialog */}
      <Dialog open={addDialogOpen} modal={false} onOpenChange={(open) => {
        setAddDialogOpen(open);
        if (!open) setEmailInput('');
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Project Email</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <TextField
              label="Email"
              type="email"
              placeholder="Enter Email Id"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setAddDialogOpen(false);
                setEmailInput('');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#C72030] hover:bg-[#a01828] text-white"
            >
              {isSubmitting ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Email Dialog */}
      <Dialog open={editDialogOpen} modal={false} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Email</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <TextField
              label="Email"
              type="email"
              placeholder="Enter Email Id"
              value={editEmailInput}
              onChange={(e) => setEditEmailInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEditSubmit();
              }}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: fieldStyles }}
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

      {/* Main Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <EnhancedTable
          data={paginatedEmails}
          columns={columns}
          renderCell={renderCell}
          renderActions={renderActions}
          storageKey="project-emails-table"
          pagination={false}
          enableGlobalSearch={true}
          onGlobalSearch={handleSearch}
          searchPlaceholder="Search emails..."
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
        {totalCount > 0 && (
          <div className="flex items-center justify-center mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                </PaginationItem>
                {renderPaginationItems()}
                <PaginationItem>
                  <PaginationNext onClick={() => handlePageChange(currentPage + 1)} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
};
