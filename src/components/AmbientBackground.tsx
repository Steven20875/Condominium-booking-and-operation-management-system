import React from 'react';

interface AmbientBackgroundProps {
  children: React.ReactNode;
}

export default function AmbientBackground({ children }: AmbientBackgroundProps) {
  return (
    <div id="ambient-root" className="min-h-screen bg-[#0f172a] text-slate-200 font-sans relative overflow-x-hidden flex flex-col">
      {/* Background radial gradients conforming to the glassmorphic luxury template */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/50 via-slate-950 to-purple-950/50 z-0 pointer-events-none" />
      <div className="fixed top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-500/15 rounded-full blur-[150px] z-0 pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-purple-500/15 rounded-full blur-[150px] z-0 pointer-events-none" />
      
      {/* Main Content Node */}
      <div className="relative z-10 flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
