export type UserRole = 'administrator' | 'validator' | 'installer';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  lastLogin?: Date;
  createdAt: Date;
};

export type AuthSession = {
  user: User;
  token: string;
  expiresAt: Date;
};