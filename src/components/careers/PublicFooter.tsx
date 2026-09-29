import React from 'react';

export function PublicFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 font-['Figtree',_sans-serif]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/TwinSpace_Logo.png"
              alt="TwinSpace"
              className="h-6 w-auto object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
