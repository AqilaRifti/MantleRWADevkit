'use client';

import { ProtectedRoute } from '@/components/protected-route';

interface DashboardContentProps {
    children: React.ReactNode;
}

export function DashboardContent({ children }: DashboardContentProps) {
    return <ProtectedRoute>{children}</ProtectedRoute>;
}
