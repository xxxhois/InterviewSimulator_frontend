'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import Navigation from '@/components/Navigation';
import { showToast } from '@/components/Toast';
import { useEffect } from 'react';

export default function ProfilePage() {
    useEffect(() => {
        showToast('跳转到个人中心啦！');
    }, []);
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

