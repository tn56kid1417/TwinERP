import React, { useState } from 'react';

/**
 * Official TwinSpace / Twincord public site navbar
 * Renders logo at /TwinSpace_nav.png (public) with fallback to /TwinSpace_Logo.png / /logo.png.
 */
export function PublicNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <header
          id="navbar-header"
          className="relative mx-auto h-[64px] bg-white dark:bg-zinc-950 pointer-events-auto transition-all top-0 w-full max-w-full rounded-none border-b border-gray-200 dark:border-zinc-800 shadow-sm"
          style={{ fontFamily: 'Manrope, sans-serif', transitionDuration: '400ms', transitionTimingFunction: 'cubic-bezier(0.25,1,0.5,1)' }}
        >
          <div className="absolute inset-0 bg-white dark:bg-zinc-950 -z-10 transition-colors duration-300" />
          <div className="w-full max-w-7xl mx-auto h-full flex items-center justify-between relative px-5 sm:px-6 lg:px-8">
            <a
              className="flex h-[56px] w-[210px] shrink-0 items-center justify-start overflow-hidden"
              href="/careers"
              aria-label="TwinSpace — Home"
            >
              <img
                src="/TwinSpace_nav.png"
                alt="TwinSpace Logo"
                loading="lazy"
                decoding="async"
                className="h-[180px] w-[180px] max-w-none object-contain"
                onError={(e) => {
                  const t = e.target as HTMLImageElement;
                  if (t.src.endsWith('TwinSpace_nav.png')) {
                    t.src = '/TwinSpace_Logo.png';
                  } else if (t.src.endsWith('TwinSpace_Logo.png')) {
                    t.src = '/logo.png';
                  }
                }}
              />
            </a>

            <div className="hidden items-center gap-4 lg:flex">
              <a
                className="text-[14px] font-sans transition-all duration-200 flex items-center gap-2 relative px-4 py-2 text-gray-700 dark:text-gray-200 font-semibold hover:text-indigo-600 dark:hover:text-indigo-400"
                href="tel:6383436383"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone size-4" aria-hidden="true">
                  <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path>
                </svg>
                Contact Us
              </a>
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center justify-center size-10 text-gray-700 dark:text-gray-200 hover:text-indigo-600 transition-colors duration-200"
                aria-label={open ? 'Close menu' : 'Open menu'}
              >
                {open ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x size-5"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu size-5"><path d="M4 12h16"></path><path d="M4 18h16"></path><path d="M4 6h16"></path></svg>
                )}
              </button>
            </div>
          </div>
        </header>
      </div>
      {/* Spacer to offset fixed header height */}
      <div className="h-[64px]" aria-hidden="true" />

      {/* Mobile sheet */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="absolute left-0 right-0 top-[64px] mx-auto w-full max-w-[1280px] overflow-hidden border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl" style={{ fontFamily: 'Manrope, sans-serif' }}>
            <nav className="flex flex-col p-4">
              <a href="tel:6383436383" onClick={() => setOpen(false)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-[14px] font-bold text-white shadow-sm hover:bg-indigo-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path></svg>
                Contact — 6383436383
              </a>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

export default PublicNavbar;
