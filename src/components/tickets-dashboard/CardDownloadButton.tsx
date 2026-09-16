import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

interface CardDownloadButtonProps {
  /** Async download action — the button shows a spinner until it settles. */
  onDownload: () => Promise<void>;
  label?: string;
  className?: string;
}

/** Small header download button used by dashboard cards that expose an XLSX export. */
export const CardDownloadButton: React.FC<CardDownloadButtonProps> = ({
  onDownload,
  label = 'Download',
  className = '',
}) => {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onDownload();
    } catch {
      // errors surface via the axios interceptor; keep the card usable
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-md border border-brand-border text-brand-text hover:bg-brand-light disabled:opacity-50 ${className}`}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
    </button>
  );
};
