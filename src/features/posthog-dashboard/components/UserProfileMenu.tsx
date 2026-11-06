import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getUser, clearAuth } from '@/utils/auth';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

/** Reads the logged-in account's role, mirroring the Runwal dashboard logic. */
function getUserRole(user: ReturnType<typeof getUser>): string {
  try {
    const acc = localStorage.getItem('hiSocietyAccount');
    if (acc) {
      const parsed = JSON.parse(acc);
      if (parsed?.user_type) {
        if (parsed.user_type === 'rm_user') return 'RM User';
        if (parsed.user_type === 'cs_user') return 'CS User';
        return String(parsed.user_type)
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
      }
    }
  } catch {
    // ignore
  }
  const u = user as any;
  return u?.lock_role?.display_name || u?.lock_role?.name || u?.user_type || 'Analytics Admin';
}

/** Reads the logged-in account's organization name, mirroring the Runwal dashboard logic. */
function getOrgName(): string {
  try {
    const acc = localStorage.getItem('hiSocietyAccount');
    if (acc) {
      const parsed = JSON.parse(acc);
      if (parsed?.organization?.name) return parsed.organization.name;
      if (parsed?.selected_user_society_name) return parsed.selected_user_society_name;
      if (parsed?.society?.building_name) return parsed.society.building_name;
    }
    const saved = localStorage.getItem('org_name') || localStorage.getItem('organization_name');
    if (saved) return saved;
  } catch {
    // ignore
  }
  return 'Hi Society';
}

interface ProfileMenuProps {
  initials: string;
  userName: string;
  userRole: string;
  userEmail: string;
  orgName: string;
}

function ProfileMenu({ initials, userName, userRole, userEmail, orgName }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    queryClient.clear();
    clearAuth();
    navigate('/login', { replace: true });
  };

  const avatarStyle = (size: number, font: number): CSSProperties => ({
    width: size,
    height: size,
    borderRadius: '50%',
    background: 'var(--blue, #2c7be5)',
    color: '#ffffff',
    display: 'grid',
    placeItems: 'center',
    fontSize: font,
    fontWeight: 600,
    flexShrink: 0,
  });

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        title={`${userName} (${userRole})`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--surface-2, #f5f4f1)',
          border: '1px solid var(--border, #e6e4de)',
          borderRadius: 20,
          padding: '3px 10px 3px 4px',
          cursor: 'pointer',
        }}
      >
        <div style={avatarStyle(26, 10)}>{initials}</div>
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--ink, #141413)',
              maxWidth: 130,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {userName}
          </span>
          <span style={{ fontSize: 10, color: 'var(--muted, #6f6e68)' }}>{userRole}</span>
        </div>
        <span style={{ fontSize: 10, color: 'var(--faint, #9b9990)' }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 230,
            background: 'var(--surface, #ffffff)',
            border: '1px solid var(--border, #e6e4de)',
            borderRadius: 12,
            boxShadow: '0 10px 34px rgba(0, 0, 0, 0.15)',
            padding: 14,
            zIndex: 100,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={avatarStyle(36, 13)}>{initials}</div>
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                  color: 'var(--ink, #141413)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {userName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted, #6f6e68)' }}>{userRole}</div>
            </div>
          </div>

          {userEmail && (
            <div
              style={{
                fontSize: 11,
                color: 'var(--muted, #6f6e68)',
                background: 'var(--surface-2, #f5f4f1)',
                padding: '6px 8px',
                borderRadius: 6,
                wordBreak: 'break-all',
                marginBottom: 8,
              }}
            >
              📧 {userEmail}
            </div>
          )}

          <div
            style={{
              paddingTop: 8,
              borderTop: '1px solid var(--border, #e6e4de)',
              fontSize: 11,
              color: 'var(--muted, #6f6e68)',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <span>Organization</span>
            <span style={{ fontWeight: 600, color: 'var(--ink, #141413)', textAlign: 'right' }}>{orgName}</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              marginTop: 12,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '7px 10px',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--neg, #c0392b)',
              background: 'transparent',
              border: '1px solid var(--border, #e6e4de)',
              borderRadius: 8,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2, #f5f4f1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Profile chip for dashboard top bars: shows the logged-in user's initials,
 * name and role; clicking opens a popup with email, organization and Logout.
 */
export function UserProfileMenu() {
  const { user: storeUser } = useAuthStore();
  const [currentUser, setCurrentUser] = useState(() => getUser());

  useEffect(() => {
    setCurrentUser(getUser());
  }, []);

  const getDisplayName = (): string => {
    if (currentUser) {
      const full = `${currentUser.firstname || ''} ${currentUser.lastname || ''}`.trim();
      if (full) return full;
      if ((currentUser as any).name) return (currentUser as any).name;
      if (currentUser.email) return currentUser.email.split('@')[0];
    }
    if (storeUser?.name) return storeUser.name;
    if (storeUser?.email) return storeUser.email.split('@')[0];

    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        const full = `${parsed.firstname || ''} ${parsed.lastname || ''}`.trim();
        if (full) return full;
        if (parsed.name) return parsed.name;
        if (parsed.email) return parsed.email.split('@')[0];
      }
    } catch {
      // ignore
    }
    return '';
  };

  const displayName = getDisplayName();

  const getInitials = (name?: string) => {
    if (!name || !name.trim()) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(displayName);

  return (
    <ProfileMenu
      initials={initials}
      userName={displayName || 'User'}
      userRole={getUserRole(currentUser)}
      userEmail={currentUser?.email || storeUser?.email || ''}
      orgName={getOrgName()}
    />
  );
}
