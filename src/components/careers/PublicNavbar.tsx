import React, { useState } from 'react';
import { Menu, X, Phone } from 'lucide-react';

export function PublicNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <header
          id="navbar-header"
          className="relative mx-auto h-[64px] w-full max-w-full bg-white dark:bg-zinc-950 pointer-events-auto border-b border-[#08265424] shadow-sm transition-all duration-[400ms]"
          style={{ fontFamily: 'Manrope, sans-serif', transitionTimingFunction: 'cubic-bezier(0.25,1,0.5,1)' }}
        >
          <div className="absolute inset-0 bg-white dark:bg-zinc-950 -z-10 transition-colors duration-300" />
          <div className="w-full max-w-7xl mx-auto h-full flex items-center justify-center lg:justify-start relative px-5 sm:px-6 lg:px-8">
            <a
              href="https://twinspace.in/"
              aria-label="TwinSpace — home"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:static lg:translate-x-0 lg:translate-y-0 order-2 lg:order-1 flex h-[56px] w-[210px] shrink-0 items-center justify-center overflow-hidden"
            >
              <img
                src="/TwinSpace_nav.png"
                alt="TwinSpace Logo"
                loading="lazy"
                decoding="async"
                className="h-[220px] w-[220px] max-w-none object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/TwinSpace_Logo.png';
                }}
              />
            </a>
            <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:flex h-full items-center justify-center gap-4 xl:gap-5" aria-hidden="true" />
            <div className="order-3 ml-auto hidden lg:flex items-center gap-3">
              <a
                href="tel:6383436383"
                className="text-[15px] font-semibold text-[#082654] hover:text-[#0099d6] flex items-center gap-2 px-3 py-2"
              >
                <Phone className="size-4" />
                Contact
              </a>
            </div>
            <div className="absolute left-5 top-1/2 -translate-y-1/2 flex lg:hidden">
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="size-10 text-[#082654] hover:text-[#0099d6]"
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-haspopup="dialog"
                aria-expanded={open}
              >
                {open ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
            <a
              href="tel:6383436383"
              className="absolute right-5 top-1/2 -translate-y-1/2 lg:hidden inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#082654] hover:text-[#0099d6]"
            >
              <Phone className="size-5" />
              <span className="hidden sm:inline">Contact</span>
            </a>
          </div>
        </header>
      </div>
      <div className="h-[64px]" aria-hidden="true" />

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-[#082654]/40 backdrop-blur-sm"
          />
          <div
            className="absolute left-0 right-0 top-[64px] mx-auto w-full max-w-[1280px] border-t border-[#08265424] bg-white dark:bg-zinc-950 shadow-[0_24px_64px_rgba(8,38,84,0.18)]"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            <nav className="flex flex-col p-3">
              <a
                href="tel:6383436383"
                className="inline-flex items-center gap-2 rounded-full bg-[#0099d6] px-5 py-3 text-[14px] font-bold text-white shadow-sm"
              >
                <Phone className="size-4" />
                Contact — 6383436383
              </a>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
