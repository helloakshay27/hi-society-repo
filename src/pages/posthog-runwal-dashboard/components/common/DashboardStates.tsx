import React from 'react';

// ==========================================
// 1. Loading State
// ==========================================
interface LoadingStateProps {
  label?: string;
  height?: number | string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Loading live analytics...',
  height = 160,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '24px',
        minHeight: height,
        background: 'var(--surface-2)',
        borderRadius: 'var(--r-sm)',
        border: '1px dashed var(--border)',
        color: 'var(--muted)',
        fontSize: '13px',
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          border: '2px solid var(--border)',
          borderTopColor: 'var(--blue)',
          animation: 'posthog-spin 0.8s linear infinite',
        }}
      />
      <span>{label}</span>
      <style>{`
        @keyframes posthog-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// ==========================================
// 2. Error State
// ==========================================
interface ErrorStateProps {
  error?: Error | string | null;
  onRetry?: () => void;
  title?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  title = 'Failed to load data',
}) => {
  const errorMessage =
    typeof error === 'string'
      ? error
      : error?.message || 'An unexpected error occurred while fetching API data.';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '20px',
        background: 'var(--red-tint)',
        borderRadius: 'var(--r-sm)',
        border: '1px solid var(--red)',
        color: 'var(--red)',
        fontSize: '13px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: '12px', opacity: 0.85, maxWidth: '480px' }}>{errorMessage}</div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            marginTop: '8px',
            padding: '6px 14px',
            background: 'var(--red)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--r-xs)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
};

// ==========================================
// 3. Empty State
// ==========================================
interface EmptyStateProps {
  message?: string;
  sub?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'No data for the selected filters',
  sub = 'Try changing the date range, site, or device filters to view metrics.',
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: '28px 16px',
        background: 'var(--surface-2)',
        borderRadius: 'var(--r-sm)',
        border: '1px dashed var(--border)',
        color: 'var(--muted)',
        fontSize: '13px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{message}</div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--faint)' }}>{sub}</div>}
    </div>
  );
};

// ==========================================
// 4. Live API Badge
// ==========================================
interface LiveApiBadgeProps {
  isFetching?: boolean;
  isError?: boolean;
  generatedAt?: string;
  source?: string;
}

export const LiveApiBadge: React.FC<LiveApiBadgeProps> = ({
  isFetching,
  isError,
  generatedAt,
  source = 'PostHog API',
}) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11.5px',
        padding: '3px 8px',
        borderRadius: '12px',
        background: isError
          ? 'var(--red-tint)'
          : isFetching
          ? 'var(--amber-tint)'
          : 'var(--green-tint)',
        color: isError ? 'var(--red)' : isFetching ? 'var(--amber-ink)' : 'var(--pos)',
        border: `1px solid ${
          isError ? 'var(--red)' : isFetching ? 'var(--amber)' : 'var(--mint)'
        }`,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: isError
            ? 'var(--red)'
            : isFetching
            ? 'var(--amber)'
            : 'var(--mint)',
        }}
      />
      <span>
        {isError
          ? 'API Error'
          : isFetching
          ? 'Syncing API...'
          : `${source} Live`}
      </span>
      {generatedAt && !isFetching && !isError && (
        <span style={{ opacity: 0.6, fontSize: '10.5px' }}>
          · {new Date(generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
};
