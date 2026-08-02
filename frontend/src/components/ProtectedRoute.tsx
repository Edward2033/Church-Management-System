import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface Props { children: React.ReactNode; roles?: string[]; }

const ProtectedRoute: React.FC<Props> = ({ children, roles }) => {
  const { member, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-purple-700" size={36} /></div>;
  if (!member) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(member.role as string)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
