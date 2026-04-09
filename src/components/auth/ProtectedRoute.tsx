import React from 'react';
import { useRoleGuard } from '../../hooks/useRoleGuard';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  expectedRole: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, expectedRole }) => {
  // Acts as a middleware wall. The hook checks the DB instantly on mount.
  useRoleGuard(expectedRole);

  return <>{children}</>;
};
