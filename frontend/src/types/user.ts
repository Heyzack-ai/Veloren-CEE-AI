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

export type CreateUserRequest = {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  active: boolean;
};

export type ApiUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
};

export type CreateUserResponse = ApiUser;
