import React from 'react';
import { useRoleGuard } from '../../src/hooks/useRoleGuard';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  expectedRole: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, expectedRole }) => {
  useRoleGuard(expectedRole);
  return <>{children}</>;
};
