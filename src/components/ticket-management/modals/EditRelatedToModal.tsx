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
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { ticketManagementAPI } from '@/services/ticketManagementAPI';

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
      const updatedData = {
        name: data.issueType,
        society_id: relatedTo.society_id.toString(),
      };

      await ticketManagementAPI.updateIssueType(relatedTo.id, updatedData);
      
      const updatedRelatedTo: RelatedToType = {
        ...relatedTo,
        name: data.issueType,
      };

      onUpdate(updatedRelatedTo);
      toast.success('Related to item updated successfully!');
      onClose();
      onRefresh();
    } catch (error: any) {
      console.error('Error updating related to item:', error);
      
      if (error.response?.status === 422 && 
          error.response?.data?.name && 
          error.response.data.name.includes('has already been taken')) {
        toast.error('Issue type has already been taken');
      } else {
        toast.error('Failed to update related to item');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
                  <FormLabel>Issue Type</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter issue type" 
                      {...field}
                      className="h-10"
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
