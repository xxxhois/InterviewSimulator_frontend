'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import Dashboard from '@/components/DashBoard';

const DashboardPage = () => {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
};

export default DashboardPage;