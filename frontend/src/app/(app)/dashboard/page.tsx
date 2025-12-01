'use client';

import { useAuth } from '@/lib/auth-context';
import AdminDashboard from './admin-dashboard';
import ValidatorDashboard from './validator-dashboard';
import InstallerDashboard from './installer-dashboard';

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === 'validator') {
    return <ValidatorDashboard />;
  }

  if (user?.role === 'installer') {
    return <InstallerDashboard />;
  }

  return <AdminDashboard />;
}