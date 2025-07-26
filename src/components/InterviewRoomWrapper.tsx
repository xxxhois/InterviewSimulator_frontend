'use client';

import dynamic from 'next/dynamic';

const InterviewRoomClient = dynamic(() => import('./InterviewRoom'), { ssr: false });

export default function InterviewRoomWrapper() {
  return <InterviewRoomClient />;
} 