'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import Navigation from '@/components/Navigation';

export default function ProfilePage() {
    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-b from-purple-100 to-purple-200 relative overflow-hidden">
                <Navigation />
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-2xl font-bold text-purple-800">个人中心</h1>
                </div>
            </div>
        </ProtectedRoute>
    )
}

