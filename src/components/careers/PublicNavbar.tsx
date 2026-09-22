import React, { useState } from 'react';

/**
 * Verbatim clone of the official TwinSpace site navbar from
 * template/TwinSpace - Software Development Company in India.html
 * Structure + classes are kept 1:1.
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
              className="flex items-center gap-3 overflow-hidden text-decoration-none"
              href="/careers"
              aria-label="TwinSpace — Careers"
            >
              <img
                src="/logo.png"
                alt="TwinSpace Logo"
                loading="lazy"
                decoding="async"
                className="h-9 w-auto max-w-none object-contain"
                onError={(e) => {
                  const t = e.target as HTMLImageElement;
                  if (!t.src.endsWith('/logo.png')) t.src = '/logo.png';
                }}
              />
              <span className="font-bold text-lg tracking-tight text-[#082654] dark:text-white">TwinSpace <span className="text-[#0099d6] font-normal text-sm ml-1 px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800">Careers</span></span>
            </a>

            <div className="hidden sm:flex items-center gap-4">
              <a
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                href="/"
              >
                Employee ERP Login
              </a>
              <a className="text-[14px] font-sans transition-all duration-200 flex items-center gap-2 relative px-3 py-2 text-[#082654] dark:text-zinc-200 font-semibold hover:text-[#0099d6]" href="tel:6383436383">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone size-4" aria-hidden="true"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path></svg>
                Contact
              </a>
            </div>

            <div className="flex sm:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center justify-center size-10 text-gray-800 dark:text-gray-200 hover:text-[#0099d6] transition-colors duration-200"
                aria-label={open ? 'Close menu' : 'Open menu'}
              >
                {open ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5"><path d="M4 12h16"></path><path d="M4 18h16"></path><path d="M4 6h16"></path></svg>
                )}
              </button>
            </div>
          </div>
        </header>
      </div>
      {/* Spacer to offset fixed header height */}
      <div className="h-[64px]" aria-hidden="true" />
      {/* Mobile menu */}
      {open && (
        <div className="fixed inset-0 z-40 sm:hidden" role="dialog" aria-modal="true">
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-[#082654]/40 backdrop-blur-sm" />
          <div className="absolute left-0 right-0 top-[64px] mx-auto w-full overflow-hidden border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl p-4 space-y-3">
            <a href="/" onClick={() => setOpen(false)} className="block w-full text-center py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700">
              Employee ERP Login
            </a>
            <a href="tel:6383436383" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 rounded-lg bg-[#0099d6] px-5 py-2.5 text-sm font-bold text-white shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path></svg>
              Contact — 6383436383
            </a>
          </div>
        </div>
      )}
    </>
  );
}
