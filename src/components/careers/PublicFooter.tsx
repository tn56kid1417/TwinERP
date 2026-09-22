import React from 'react';

export function PublicFooter() {
  return (
    <footer className="bg-black border-t border-gray-800 text-white" style={{ fontFamily: 'Figtree, Inter, sans-serif' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">© 2026 Careers Portal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default PublicFooter;
