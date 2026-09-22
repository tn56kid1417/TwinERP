import React, { useState } from 'react';

/**
 * Verbatim clone of the official TwinSpace site navbar from
 * template/TwinSpace - Software Development Company in India.html
 * Structure + classes are kept 1:1. `border-line`, `text-brand`, `text-ink`
 * map to template tokens via src/index.css so rendering is pixel-identical
 * in both light and dark modes. Logo resolves to /TwinSpace_nav.png (public)
 * falling back to /TwinSpace_Logo.png. Wrapped in the fixed pointer-events-none
 * shell exactly as the template does (div.fixed > header#navbar-header).
 */
export function PublicNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <header
          id="navbar-header"
          className="relative mx-auto h-[64px] bg-black dark:bg-white pointer-events-auto transition-all top-0 w-full max-w-full rounded-none border-b border-line shadow-sm"
          style={{ fontFamily: 'Manrope, sans-serif', transitionDuration: '400ms', transitionTimingFunction: 'cubic-bezier(0.25,1,0.5,1)' }}
        >
          <div className="absolute inset-0 bg-black dark:bg-white -z-10 transition-colors duration-300" />
          <div className="w-full max-w-7xl mx-auto h-full flex items-center justify-center lg:justify-start relative px-5 sm:px-6 lg:px-8">
            <a
              className="absolute left-1/2 top-1/2 order-2 flex h-[56px] w-[210px] shrink-0 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden lg:static lg:order-1 lg:translate-x-0 lg:translate-y-0"
              href="#"
              aria-label="Home"
            >
            </a>
            <nav className="absolute left-1/2 top-1/2 order-2 hidden h-full -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-4 lg:flex xl:gap-5" aria-hidden="true" />
            <div className="order-3 ml-auto hidden items-center gap-3 lg:flex">
              <a className="text-[15px] font-sans transition-all duration-200 flex items-center gap-2 relative px-3 py-2 text-ink font-semibold hover:text-brand" href="tel:6383436383">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone size-4" aria-hidden="true"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path></svg>
                Contact
              </a>
            </div>
            <div className="absolute left-5 top-1/2 flex -translate-y-1/2 items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center justify-center size-10 text-ink hover:text-brand transition-colors duration-200"
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-haspopup="dialog"
                aria-expanded={open}
                data-state={open ? 'open' : 'closed'}
              >
                {open ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x size-5" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu size-5" aria-hidden="true"><path d="M4 12h16"></path><path d="M4 18h16"></path><path d="M4 6h16"></path></svg>
                )}
              </button>
            </div>
            <a className="absolute right-5 top-1/2 inline-flex -translate-y-1/2 items-center gap-1.5 text-[14px] font-semibold text-ink transition-colors hover:text-brand lg:hidden" aria-label="Call TwinSpace at 6383436383" href="tel:6383436383">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone size-5" aria-hidden="true"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path></svg>
              <span className="hidden sm:inline">Contact</span>
            </a>
          </div>
        </header>
      </div>
      {/* Spacer to offset fixed header height */}
      <div className="h-[64px]" aria-hidden="true" />
      {/* Mobile sheet — mirrors template Sheet behavior */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-[#082654]/40 backdrop-blur-sm" />
          <div className="absolute left-0 right-0 top-[64px] mx-auto w-full max-w-[1280px] overflow-hidden border-t border-line bg-white dark:bg-zinc-950 shadow-[0_24px_64px_rgba(8,38,84,0.18)]" style={{ fontFamily: 'Manrope, sans-serif' }}>
            <nav className="flex flex-col p-3">
              <a href="tel:6383436383" onClick={() => setOpen(false)} className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-[14px] font-bold text-white shadow-sm">
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
