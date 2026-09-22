import React from 'react';

export function PublicFooter() {
  return (
    <footer className="bg-white border-t border-gray-200" style={{ fontFamily: 'Figtree, Inter, sans-serif' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/TwinSpace_Logo.png"
              alt="TwinSpace"
              className="h-6 w-auto object-contain"
              onError={(e) => {
                const t = e.target as HTMLImageElement;
                if (!t.src.endsWith('logo.png')) t.src = '/logo.png';
                else t.style.display = 'none';
              }}
            />
            <span className="text-sm font-semibold text-gray-900">TwinSpace</span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="text-xs text-gray-500">© 2026 TwinSpace Technologies Pvt. Ltd.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default PublicFooter;
