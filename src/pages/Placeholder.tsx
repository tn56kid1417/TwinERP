import { motion } from 'motion/react';
import React from 'react';

const Placeholder = ({ title }: { title: string }) => {
 return (
 <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-8 max-w-7xl mx-auto h-full flex flex-col items-center justify-center text-center">
 <div className="bg-white border border-slate-200 rounded-lg p-12 max-w-lg w-full">
 <h1 className="text-3xl font-medium text-slate-900 tracking-tight mb-4">{title}</h1>
 <p className="text-slate-500">This module is currently under construction. Please check back later.</p>
 </div>
 </motion.div>
 );
};

export default Placeholder;
