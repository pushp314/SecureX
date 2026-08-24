import crypto from 'crypto';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: 'SOC_LEAD' | 'ANALYST_TIER_2' | 'AUDITOR';
  tenantId: string;
  passwordHash: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'SOC_LEAD' | 'ANALYST_TIER_2' | 'AUDITOR';
    tenantId: string;
  };
  token: string;
  expiresAt: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'secx_jwt_secret_9948123019842a7bc';

// Helper to hash passwords
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_securex_salt').digest('hex');
}

// Pre-seeded Analyst Accounts
const USERS: UserAccount[] = [
  {
    id: 'usr-01',
    email: 'sarah.connor@securex.internal',
    name: 'Sarah Connor',
    role: 'SOC_LEAD',
    tenantId: 'tenant-enterprise-01',
    passwordHash: hashPassword('SecureX@2026!'),
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-02',
    email: 'alex.mercer@securex.internal',
    name: 'Alex Mercer',
    role: 'ANALYST_TIER_2',
    tenantId: 'tenant-enterprise-01',
    passwordHash: hashPassword('Analyst@2026!'),
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-03',
    email: 'bob.auditor@securex.internal',
    name: 'Robert Vance',
    role: 'AUDITOR',
    tenantId: 'tenant-enterprise-01',
    passwordHash: hashPassword('Auditor@2026!'),
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
];

// Lightweight, secure HMAC-SHA256 Token generator
export function generateAuthToken(user: UserAccount): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

export function verifyAuthToken(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature !== expectedSig) return null;

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return decoded;
  } catch {
    return null;
  }
}

export function authenticateUser(email: string, passwordAttempt: string): AuthSession | null {
  const user = USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return null;

  const attemptHash = hashPassword(passwordAttempt);
  if (user.passwordHash !== attemptHash) return null;

  const token = generateAuthToken(user);
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
    },
    token,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
  };
}

export function getUserById(id: string): UserAccount | undefined {
  return USERS.find((u) => u.id === id);
}
