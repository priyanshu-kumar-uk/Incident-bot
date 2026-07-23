import React from 'react';

const TopBar: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0a0f1a]/90 px-4 py-3.5 backdrop-blur-xl sm:px-6">
      <div className="mx-auto max-w-7xl pl-12 md:pl-0">
        <h1 className="text-base font-semibold tracking-tight text-white sm:text-lg">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs text-zinc-400 sm:text-sm">{subtitle}</p>}
      </div>
    </header>
  );
};

export default TopBar;
