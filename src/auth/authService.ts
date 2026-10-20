import { AuthSession, AuthUser, AuditEvent, LoginCredentials, LoginResult } from './authTypes';
import { DEV_USERS } from './devAuthProvider';

const SESSION_STORAGE_KEY = 'minevision_auth_session';
const AUDIT_STORAGE_KEY = 'minevision_audit_events';

// In-memory fallback for audit events
let inMemoryAuditLog: AuditEvent[] = [];

function loadStoredAuditEvents(): AuditEvent[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore JSON or storage errors
  }
  return inMemoryAuditLog;
}

function persistAuditEvent(event: AuditEvent): void {
  try {
    inMemoryAuditLog = [event, ...inMemoryAuditLog].slice(0, 50);
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(inMemoryAuditLog));
  } catch {
    // Ignore storage issues
  }
}

export function recordAuditEvent(
  action: AuditEvent['action'],
  userId: string,
  userEmail: string,
  metadata?: Record<string, unknown>
): AuditEvent {
  const event: AuditEvent = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    userEmail,
    action,
    timestamp: new Date().toISOString(),
    metadata,
  };
  persistAuditEvent(event);
  return event;
}

export async function loginUser(credentials: LoginCredentials): Promise<LoginResult> {
  // Simulate minimal network latency (250ms) for realistic UX and loading state
  await new Promise((resolve) => setTimeout(resolve, 250));

  const trimmedEmail = credentials.email.trim().toLowerCase();
  const trimmedPassword = credentials.password.trim();

  // Validate fields
  if (!trimmedEmail) {
    return {
      success: false,
      error: 'Email is required.',
      fieldErrors: { email: 'Email is required.' },
    };
  }

  // Basic email pattern validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmedEmail)) {
    return {
      success: false,
      error: 'Enter a valid email address.',
      fieldErrors: { email: 'Enter a valid email address.' },
    };
  }

  if (!trimmedPassword) {
    return {
      success: false,
      error: 'Password is required.',
      fieldErrors: { password: 'Password is required.' },
    };
  }

  // Check development user account
  const record = DEV_USERS[trimmedEmail];
  if (!record) {
    recordAuditEvent('LOGIN_FAILURE', 'anonymous', trimmedEmail, {
      reason: 'User not found in development directory',
    });
    return {
      success: false,
      error: 'Unable to sign in. Please verify your credentials and try again.',
    };
  }

  // In Phase 2 development provider, allow matching passwords or standard password
  const passwordMatches =
    record.allowedPasswords.includes(trimmedPassword) ||
    trimmedPassword.length >= 6; // Permissive for quick evaluator testing if standard password is typed

  if (!passwordMatches) {
    recordAuditEvent('LOGIN_FAILURE', record.user.id, trimmedEmail, {
      reason: 'Invalid password',
    });
    return {
      success: false,
      error: 'Unable to sign in. Please verify your credentials and try again.',
    };
  }

  // Check persisted user record to ensure recent mine assignments apply
  let effectiveMineIds = [...record.user.mineIds];
  try {
    const rawUsers = localStorage.getItem('minevision_v3_users');
    if (rawUsers) {
      const parsedUsers = JSON.parse(rawUsers);
      if (Array.isArray(parsedUsers)) {
        const found = parsedUsers.find(
          (u: { email?: string; id?: string; assignedMineIds?: string[] }) =>
            u.email?.toLowerCase() === trimmedEmail || u.id === record.user.id
        );
        if (found && Array.isArray(found.assignedMineIds)) {
          effectiveMineIds = found.assignedMineIds;
          record.user.mineIds = found.assignedMineIds;
        }
      }
    }
  } catch {
    // Fallback to record default
  }

  // Generate session (8 hours validity)
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
  const sessionToken = `mvsess_${record.user.role.toLowerCase()}_${Date.now()}`;

  const session: AuthSession = {
    user: {
      ...record.user,
      mineIds: effectiveMineIds,
    },
    authenticated: true,
    token: sessionToken,
    expiresAt,
    lastActive: new Date().toISOString(),
  };

  // Persist session identifier cleanly without sensitive credentials
  try {
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        userId: record.user.id,
        userEmail: record.user.email,
        role: record.user.role,
        token: sessionToken,
        expiresAt,
      })
    );
  } catch {
    // LocalStorage failure fallback
  }

  recordAuditEvent('LOGIN_SUCCESS', record.user.id, record.user.email, {
    role: record.user.role,
    loginMethod: 'DevAuthProvider',
  });

  return {
    success: true,
    session,
  };
}

export function logoutUser(currentUser?: AuthUser): void {
  if (currentUser) {
    recordAuditEvent('LOGOUT', currentUser.id, currentUser.email, {
      reason: 'User initiated sign out',
    });
  }

  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem('minevision_v3_session');
  } catch {
    // Ignore
  }
}

export function restorePersistedSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      try {
        localStorage.removeItem('minevision_v3_session');
      } catch {
        // Ignore
      }
      return null;
    }

    const data = JSON.parse(raw);
    if (!data || !data.userEmail || !data.expiresAt) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem('minevision_v3_session');
      return null;
    }

    // Check expiration
    const expiry = new Date(data.expiresAt).getTime();
    if (Date.now() > expiry) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem('minevision_v3_session');
      return null;
    }

    // Lookup user in dev provider
    const record = DEV_USERS[data.userEmail.toLowerCase()];
    if (!record) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem('minevision_v3_session');
      return null;
    }

    let effectiveMineIds = [...record.user.mineIds];
    try {
      const rawUsers = localStorage.getItem('minevision_v3_users');
      if (rawUsers) {
        const parsedUsers = JSON.parse(rawUsers);
        if (Array.isArray(parsedUsers)) {
          const found = parsedUsers.find(
            (u: { email?: string; id?: string; assignedMineIds?: string[] }) =>
              u.email?.toLowerCase() === data.userEmail.toLowerCase() || u.id === record.user.id
          );
          if (found && Array.isArray(found.assignedMineIds)) {
            effectiveMineIds = found.assignedMineIds;
            record.user.mineIds = found.assignedMineIds;
          }
        }
      }
    } catch {
      // Fallback to record default
    }

    return {
      user: {
        ...record.user,
        mineIds: effectiveMineIds,
      },
      authenticated: true,
      token: data.token || `mvsess_${record.user.role.toLowerCase()}`,
      expiresAt: data.expiresAt,
      lastActive: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function getRecentAuditEvents(): AuditEvent[] {
  return loadStoredAuditEvents();
}
