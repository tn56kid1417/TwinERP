import { motion } from 'motion/react';
import React from 'react';

const Placeholder = ({ title }: { title: string }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-8 max-w-7xl mx-auto h-full flex flex-col items-center justify-center text-center">
      <div className="bg-white dark:bg-[#1A1D23] border border-slate-200 dark:border-slate-800 rounded-2xl p-12 max-w-lg w-full">
        <h1 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight mb-4">{title}</h1>
        <p className="text-slate-500 dark:text-slate-500">This module is currently under construction. Please check back later.</p>
      </div>
    </motion.div>
  );
};

export default Placeholder;
