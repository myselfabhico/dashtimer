'use client';

import dynamic from 'next/dynamic';

const DashtimerApp = dynamic(() => import('@/components/DashtimerApp'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#101216] flex items-center justify-center text-white">
      <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
    </div>
  ),
});

export default function Home() {
  return <DashtimerApp />;
}

