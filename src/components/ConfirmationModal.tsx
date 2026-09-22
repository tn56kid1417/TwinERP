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
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
 <div 
 className="bg-white border border-slate-200 rounded-lg shadow-lg w-full max-w-md overflow-hidden"
 role="dialog"
 aria-modal="true"
 >
 <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center">
 <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 {isDestructive && <AlertTriangle size={16} className="text-red-500"/>}
 {title}
 </h3>
 <button 
 onClick={onCancel}
 className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
 >
 <X size={16} />
 </button>
 </div>
 
 <div className="px-5 py-4">
 <p className="text-sm text-slate-600 leading-relaxed">
 {message}
 </p>
 </div>
 
 <div className="px-5 py-3 border-t border-slate-200 flex justify-end items-center gap-2 bg-slate-50">
 <button
 onClick={onCancel}
 className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors border border-slate-300 cursor-pointer"
 >
 {cancelText}
 </button>
 <button
 onClick={onConfirm}
 className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
 isDestructive 
 ? 'bg-red-600 hover:bg-red-700 text-white' 
 : 'bg-blue-600 hover:bg-blue-700 text-white'
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


