import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
import { EditRelatedToModal } from './modals/EditRelatedToModal';
import { getAuthHeader, getFullUrl } from '@/config/apiConfig';
import { toast } from 'sonner';
import { Edit, Trash2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { TextField } from '@mui/material';
import { fieldStyles } from './fieldStyles';

interface RelatedToType {
  id: number;
  name: string;
  society_id: number;
  active: number | null;
  created_at?: string;
  updated_at?: string;
}

export const RelatedToTab: React.FC = () => {
  const [relatedToItems, setRelatedToItems] = useState<RelatedToType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Add dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [issueTypeInput, setIssueTypeInput] = useState('');

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRelatedTo, setEditingRelatedTo] = useState<RelatedToType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch issue types from new API
  const fetchRelatedToItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(getFullUrl('/dropdown/issue_types.json'), {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // API returns { issue_types: [...] }
        const list = data.issue_types ?? [];
        setRelatedToItems(Array.isArray(list) ? list : []);
      } else {
        toast.error('Failed to fetch issue types');
      }
    } catch (error) {
      console.error('Error fetching issue types:', error);
      toast.error('Failed to fetch issue types');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRelatedToItems();
  }, [fetchRelatedToItems]);

  const handleCreateSubmit = async () => {
    if (!issueTypeInput.trim()) {
      toast.error('Please enter issue type');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: issueTypeInput.trim(),
        active: 1,
      };

      const response = await fetch(
        getFullUrl('/crm/admin/create_issue_type.json'),
        {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        toast.success('Issue type created successfully!');
        setIssueTypeInput('');
        setAddDialogOpen(false);
        fetchRelatedToItems();
      } else {
        const errorData = await response.json().catch(() => null);
        if (errorData?.name && errorData.name.includes('has already been taken')) {
          toast.error('Issue type has already been taken');
        } else {
          toast.error(errorData?.message || 'Failed to create issue type');
        }
      }
    } catch (error) {
      console.error('Error creating issue type:', error);
      toast.error('Failed to create issue type');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (relatedTo: RelatedToType) => {
    if (!confirm('Are you sure you want to delete this issue type?')) {
      return;
    }
    try {
      const payload = {
        id: relatedTo.id,
        name: relatedTo.name,
        active: 0,
      };
      const response = await fetch(
        getFullUrl('/crm/admin/modify_issue_type.json'),
        {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );
      if (response.ok) {
        toast.success('Issue type deleted successfully!');
        fetchRelatedToItems();
      } else {
        toast.error('Failed to delete issue type');
      }
    } catch (error) {
      console.error('Error deleting issue type:', error);
      toast.error('Failed to delete issue type');
    }
  };

  const columns = [
    { key: 'id', label: 'S.No.', sortable: true },
    { key: 'name', label: 'Issue Type', sortable: true },
  ];

  const renderCell = (item: RelatedToType, columnKey: string) => {
    return item[columnKey as keyof RelatedToType];
  };

  const handleEdit = (relatedTo: RelatedToType) => {
    setEditingRelatedTo(relatedTo);
    setEditModalOpen(true);
  };

  const handleUpdate = (updatedRelatedTo: RelatedToType) => {
    setRelatedToItems(relatedToItems.map(item => 
      item.id === updatedRelatedTo.id ? updatedRelatedTo : item
    ));
  };

  const renderActions = (item: RelatedToType) => (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
        <Edit className="h-4 w-4" style={{ color: '#000000' }} />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}>
        <Trash2 className="h-4 w-4" style={{ color: '#000000' }} />
      </Button>
    </div>
  );

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const filteredRelatedToItems = relatedToItems.filter((item) => {
    if (!searchTerm) return true;
    const query = searchTerm.toLowerCase();
    return Object.values(item).some((v) => String(v ?? '').toLowerCase().includes(query));
  });

  const totalCount = filteredRelatedToItems.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRelatedToItems = filteredRelatedToItems.slice(startIndex, startIndex + itemsPerPage);

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

  return (
    <div className="space-y-4">
      {/* Add Issue Type Dialog */}
      <Dialog open={addDialogOpen} modal={false} onOpenChange={(open) => {
        setAddDialogOpen(open);
        if (!open) setIssueTypeInput('');
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Related To</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <TextField
              label="Issue Type"
              placeholder="Enter issue type"
              value={issueTypeInput}
              onChange={(e) => setIssueTypeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateSubmit();
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
                setIssueTypeInput('');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={isSubmitting}
              className="bg-[#C72030] hover:bg-[#a01828] text-white"
            >
              {isSubmitting ? 'Creating...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <EnhancedTable
          data={paginatedRelatedToItems}
          columns={columns}
          renderCell={renderCell}
          renderActions={renderActions}
          storageKey="related-to-table"
          pagination={false}
          enableGlobalSearch={true}
          onGlobalSearch={handleSearch}
          searchPlaceholder="Search issue types..."
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

      {editModalOpen && editingRelatedTo && (
        <EditRelatedToModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingRelatedTo(null);
          }}
          relatedTo={editingRelatedTo}
          onUpdate={handleUpdate}
          onRefresh={fetchRelatedToItems}
        />
      )}
    </div>
  );
};
