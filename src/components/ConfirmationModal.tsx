import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = true
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="relative bg-white/95 dark:bg-[#0C1017]/95 border border-slate-200/90 dark:border-slate-700/50 rounded-2xl shadow-2xl shadow-slate-900/15 dark:shadow-black/80 ring-1 ring-black/5 dark:ring-white/10 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent ${isDestructive ? 'via-rose-500/80' : 'via-indigo-500/80'} to-transparent pointer-events-none`} />

        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-md">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {isDestructive && <AlertTriangle size={16} className="text-rose-500" />}
            {title}
          </h3>
          <button 
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {message}
          </p>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-end items-center gap-3 bg-slate-50/50 dark:bg-slate-900/40">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors border border-slate-200 dark:border-slate-700/50 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all active:scale-[0.98] cursor-pointer ${
              isDestructive 
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/25' 
                : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 text-white shadow-lg shadow-indigo-500/25'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
