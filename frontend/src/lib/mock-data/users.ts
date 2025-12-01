export type UserRole = 'administrator' | 'validator' | 'installer';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
};

export const mockUsers: User[] = [
  {
    id: 'user1',
    name: 'Marie Dubois',
    email: 'marie.dubois@valoren.org',
    role: 'administrator',
    isActive: true,
    lastLogin: new Date('2024-11-25T09:15:00Z'),
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'user2',
    name: 'Pierre Martin',
    email: 'pierre.martin@valoren.org',
    role: 'administrator',
    isActive: true,
    lastLogin: new Date('2024-11-24T16:30:00Z'),
    createdAt: new Date('2024-02-01'),
  },
  {
    id: 'user3',
    name: 'Sophie Bernard',
    email: 'sophie.bernard@valoren.org',
    role: 'validator',
    isActive: true,
    lastLogin: new Date('2024-11-25T10:45:00Z'),
    createdAt: new Date('2024-03-10'),
  },
  {
    id: 'user4',
    name: 'Thomas Petit',
    email: 'thomas.petit@valoren.org',
    role: 'validator',
    isActive: true,
    lastLogin: new Date('2024-11-25T08:20:00Z'),
    createdAt: new Date('2024-03-15'),
  },
  {
    id: 'user5',
    name: 'Julie Moreau',
    email: 'julie.moreau@valoren.org',
    role: 'validator',
    isActive: true,
    lastLogin: new Date('2024-11-24T14:10:00Z'),
    createdAt: new Date('2024-04-01'),
  },
  {
    id: 'user6',
    name: 'Laurent Durand',
    email: 'laurent.durand@valoren.org',
    role: 'validator',
    isActive: true,
    lastLogin: new Date('2024-11-23T11:30:00Z'),
    createdAt: new Date('2024-05-20'),
  },
  {
    id: 'user7',
    name: 'Isabelle Leroy',
    email: 'isabelle.leroy@valoren.org',
    role: 'validator',
    isActive: false,
    lastLogin: new Date('2024-09-15T10:00:00Z'),
    createdAt: new Date('2024-02-10'),
  },
  {
    id: 'user8',
    name: 'Nicolas Roux',
    email: 'nicolas.roux@valoren.org',
    role: 'administrator',
    isActive: true,
    lastLogin: new Date('2024-11-25T07:45:00Z'),
    createdAt: new Date('2024-01-20'),
  },
];

export function getUserById(id: string): User | undefined {
  return mockUsers.find(u => u.id === id);
}

export function getUsersByRole(role: UserRole): User[] {
  return mockUsers.filter(u => u.role === role);
}

export function getActiveUsers(): User[] {
  return mockUsers.filter(u => u.isActive);
}