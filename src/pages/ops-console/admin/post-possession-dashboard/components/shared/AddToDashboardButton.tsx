import React, { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useMyDashboardStore } from '../../store/myDashboardStore';
import type { PostPossessionTab } from '../../api';

interface AddToDashboardButtonProps {
  chartId: string;
  label: string;
  tab: PostPossessionTab;
  /** Current grid size/position of the card, used as its starting layout in My Dashboard */
  getLayout: () => { height: string; width: string; position: string };
}

const toast = (message: string, type: 'ok' | 'd' = 'ok') =>
  window.dispatchEvent(new CustomEvent('pp-toast', { detail: { message, type } }));

/** "+" adds a card to My Dashboard; "✓" (already added) asks to confirm before removing it. */
export const AddToDashboardButton: React.FC<AddToDashboardButtonProps> = ({ chartId, label, tab, getLayout }) => {
  const added = useMyDashboardStore((state) => state.cards.some((card) => card.chartId === chartId));
  const addCard = useMyDashboardStore((state) => state.addCard);
  const removeCard = useMyDashboardStore((state) => state.removeCard);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleClick = () => {
    if (added) {
      setConfirmOpen(true);
      return;
    }
    addCard({ chartId, tab, label, ...getLayout() });
    toast(`Added “${label}” to My Dashboard`);
  };

  return (
    <>
      <button
        type="button"
        className={`pp-add-btn no-drag${added ? ' added' : ''}`}
        onClick={handleClick}
        aria-label={added ? `Remove ${label} from My Dashboard` : `Add ${label} to My Dashboard`}
        title={added ? 'In My Dashboard — click to remove' : 'Add to My Dashboard'}
      >
        {added ? <Check size={15} strokeWidth={2.4} aria-hidden /> : <Plus size={16} strokeWidth={2} aria-hidden />}
      </button>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from My Dashboard?</AlertDialogTitle>
            <AlertDialogDescription>
              “{label}” will be removed from My Dashboard. It stays in its original tab.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                removeCard(chartId);
                toast(`Removed “${label}” from My Dashboard`, 'd');
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
