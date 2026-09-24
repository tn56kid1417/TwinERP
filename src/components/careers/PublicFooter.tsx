import React from 'react';

export function PublicFooter() {
  return (
    <footer className="bg-white dark:bg-zinc-950 border-t border-gray-200 dark:border-zinc-800" style={{ fontFamily: 'Figtree, Inter, sans-serif' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/TwinSpace_Logo.png"
              alt="TwinSpace"
              className="h-7 w-auto object-contain"
              onError={(e) => {
                const t = e.target as HTMLImageElement;
                if (t.src.endsWith('TwinSpace_Logo.png')) {
                  t.src = '/logo.png';
                }
              }}
            />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">TwinSpace</span>
            <span className="hidden sm:inline text-gray-300 dark:text-gray-700">|</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">© 2026 TwinSpace Technologies Pvt. Ltd. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default PublicFooter;
