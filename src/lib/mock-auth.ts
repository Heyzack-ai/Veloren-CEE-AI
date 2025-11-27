import { User, AuthSession } from '@/types/user';

// Mock users for testing
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@valoren.org',
    role: 'administrator',
    active: true,
    lastLogin: new Date(),
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Marie Validator',
    email: 'validator@valoren.org',
    role: 'validator',
    active: true,
    lastLogin: new Date(),
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: 'Jean Installer',
    email: 'installer@example.com',
    role: 'installer',
    active: true,
    lastLogin: new Date(),
    createdAt: new Date('2024-01-01'),
  },
];

const SESSION_KEY = 'cee_auth_session';

export async function mockLogin(email: string, password: string): Promise<AuthSession> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const user = mockUsers.find(u => u.email === email);
  
  if (!user || password !== 'password') {
    throw new Error('Invalid credentials');
  }

  const session: AuthSession = {
    user,
    token: `mock_token_${user.id}`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  };

  // Store session
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  return session;
}

export function mockLogout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function getStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;

  try {
    const session = JSON.parse(stored);
    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}