import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { getAuthHeader, getFullUrl } from '@/config/apiConfig';
import { TextField } from '@mui/material';
import { fieldStyles } from '../fieldStyles';

const relatedToSchema = z.object({
  issueType: z.string().min(1, 'Issue type is required'),
});

type RelatedToFormData = z.infer<typeof relatedToSchema>;

interface RelatedToType {
  id: number;
  name: string;
  society_id: number;
}

interface EditRelatedToModalProps {
  isOpen: boolean;
  onClose: () => void;
  relatedTo: RelatedToType;
  onUpdate: (relatedTo: RelatedToType) => void;
  onRefresh: () => void;
}

export const EditRelatedToModal: React.FC<EditRelatedToModalProps> = ({
  isOpen,
  onClose,
  relatedTo,
  onUpdate,
  onRefresh,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RelatedToFormData>({
    resolver: zodResolver(relatedToSchema),
    defaultValues: {
      issueType: relatedTo.name,
    },
  });

  useEffect(() => {
    if (relatedTo && isOpen) {
      form.reset({
        issueType: relatedTo.name,
      });
    }
  }, [relatedTo, isOpen, form]);

  const handleSubmit = async (data: RelatedToFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        id: relatedTo.id,
        name: data.issueType,
        active: 1,
      };

      const response = await fetch(getFullUrl('/crm/admin/modify_issue_type.json'), {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (errorData?.name?.includes('has already been taken')) {
          toast.error('Issue type has already been taken');
        } else {
          toast.error(errorData?.message || 'Failed to update issue type');
        }
        return;
      }

      const updatedRelatedTo: RelatedToType = {
        ...relatedTo,
        name: data.issueType,
      };

      onUpdate(updatedRelatedTo);
      toast.success('Issue type updated successfully!');
      onClose();
      onRefresh();
    } catch (error) {
      console.error('Error updating related to item:', error);
      toast.error('Failed to update issue type');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} modal={false} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Related To</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="issueType"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <TextField
                      label="Issue Type"
                      placeholder="Enter issue type"
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

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#C72030] hover:bg-[#A01828] text-white"
              >
                {isSubmitting ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
