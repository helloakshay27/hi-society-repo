import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { EditRelatedToModal } from './modals/EditRelatedToModal';
import { getAuthHeader, getFullUrl } from '@/config/apiConfig';
import { toast } from 'sonner';
import { Edit, Trash2 } from 'lucide-react';

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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRelatedTo, setEditingRelatedTo] = useState<RelatedToType | null>(null);
  const [issueTypeInput, setIssueTypeInput] = useState('');

  // Fetch issue types from consolidated API
  const fetchRelatedToItems = useCallback(async () => {
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
        setRelatedToItems(data.issue_types || []);
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
      const formData = new FormData();
      formData.append('issue_type[name]', issueTypeInput.trim());

      const response = await fetch(
        getFullUrl('/crm/admin/helpdesk_categories/create_issue_type.json'),
        {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeader(),
          },
          body: formData,
        }
      );

      if (response.ok) {
        toast.success('Issue type created successfully!');
        setIssueTypeInput('');
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
      const formData = new FormData();
      formData.append('issue_type[active]', '0');

      const response = await fetch(
        getFullUrl(`/crm/admin/helpdesk_categories/update_issue_type.json?id=${relatedTo.id}`),
        {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeader(),
          },
          body: formData,
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
          <CardTitle>Add Related To</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            {/* Issue Type Input */}
            <div className="flex-1">
              <Input
                placeholder="Enter issue type"
                value={issueTypeInput}
                onChange={(e) => setIssueTypeInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateSubmit();
                  }
                }}
              />
            </div>

            {/* Create Button */}
            <Button
              onClick={handleCreateSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white px-8"
            >
              {isSubmitting ? 'Creating...' : 'Add'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Related To List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Loading issue types...</div>
            </div>
          ) : (
            <EnhancedTable
              data={relatedToItems}
              columns={columns}
              renderCell={renderCell}
              renderActions={renderActions}
              storageKey="related-to-table"
              enableSearch={true}
              searchPlaceholder="Search issue types..."
            />
          )}
        </CardContent>
      </Card>

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
