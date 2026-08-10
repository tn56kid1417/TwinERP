import { motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { getEmployees, getAllAttendance } from '../api';
import { Employee, Attendance as AttendanceType } from '../types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

const Attendance = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendances, setAttendances] = useState<AttendanceType[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedEmp, setSelectedEmp] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [emps, atts] = await Promise.all([
          getEmployees(),
          getAllAttendance()
        ]);
        setEmployees(emps);
        setAttendances(atts);
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getDayOfWeek = (day: number) => {
    const date = new Date(selectedYear, selectedMonth - 1, day);
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  };

  const getStatus = (empId: string, day: number) => {
    const monthStr = selectedMonth.toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const dateStr = `${selectedYear}-${monthStr}-${dayStr}`;
    
    const record = attendances.find(a => a.employeeId === empId && a.date === dateStr);
    return record ? record.status : null;
  };

  const renderStatus = (status: string | null) => {
    if (status === 'Present') return <span className="text-emerald-400 font-bold">✓</span>;
    if (status === 'Absent') return <span className="text-red-400 font-bold">✕</span>;
    if (status === 'Half-Day') return <span className="text-amber-400 font-bold">½</span>;
    return <span className="text-slate-600 font-bold">-</span>;
  };

  const getTotalPresent = (empId: string) => {
    const monthStr = selectedMonth.toString().padStart(2, '0');
    return attendances.filter(a => 
      a.employeeId === empId && 
      a.date.startsWith(`${selectedYear}-${monthStr}`) && 
      (a.status === 'Present' || a.status === 'Half-Day')
    ).length;
  };

  const filteredEmployees = selectedEmp === 'all' 
    ? employees 
    : employees.filter(e => e.id === selectedEmp);

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">Manage Attendances</h1>
        <p className="text-slate-500 dark:text-slate-500 mt-1">View and manage employee attendance records.</p>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#1A1D23] rounded-xl border border-slate-200 dark:border-slate-800">
        
        {/* Filters Top Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
             <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Employee</label>
             <select 
               className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500/50"
               value={selectedEmp}
               onChange={e => setSelectedEmp(e.target.value)}
             >
               <option value="all">All Employees</option>
               {employees.map(e => (
                 <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
               ))}
             </select>
          </div>
          
          <div className="w-48">
             <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Month</label>
             <select 
               className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500/50"
               value={selectedMonth}
               onChange={e => setSelectedMonth(Number(e.target.value))}
             >
               {MONTHS.map((m, i) => (
                 <option key={i+1} value={i+1}>{m}</option>
               ))}
             </select>
          </div>

          <div className="w-32">
             <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Year</label>
             <select 
               className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500/50"
               value={selectedYear}
               onChange={e => setSelectedYear(Number(e.target.value))}
             >
               {[2024, 2025, 2026, 2027].map(y => (
                 <option key={y} value={y}>{y}</option>
               ))}
             </select>
          </div>

          <button className="bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white px-6 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors h-[38px] flex items-center justify-center gap-2">
            <Search size={14} /> Apply
          </button>
        </div>

        {/* Legend */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs bg-white/30 dark:bg-slate-900/20">
          <div className="font-bold text-indigo-400 uppercase tracking-widest text-[10px]">
            Attendance Report: {MONTHS[selectedMonth-1]} {selectedYear}
          </div>
          <div className="flex gap-6 font-medium text-[10px] uppercase tracking-widest">
            <span className="flex items-center gap-1"><span className="text-emerald-400 font-bold text-sm leading-none">✓</span> <span className="text-slate-500 dark:text-slate-500 dark:text-slate-400">Present</span></span>
            <span className="flex items-center gap-1"><span className="text-red-400 font-bold text-sm leading-none">✕</span> <span className="text-slate-500 dark:text-slate-500 dark:text-slate-400">Absent</span></span>
            <span className="flex items-center gap-1"><span className="text-amber-400 font-bold text-sm leading-none">½</span> <span className="text-slate-500 dark:text-slate-500 dark:text-slate-400">Half Day</span></span>
            <span className="flex items-center gap-1"><span className="text-slate-600 font-bold text-sm leading-none">-</span> <span className="text-slate-500 dark:text-slate-500 dark:text-slate-400">Future/No Data</span></span>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-500 text-sm">Loading attendance data...</div>
          ) : (
            <div className="min-w-max">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/50 dark:bg-slate-900/50 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-500 border-b border-slate-200/80 dark:border-slate-800/50">
                    <th className="px-4 py-3 font-semibold sticky left-0 z-10 bg-slate-100 dark:bg-[#15181e] shadow-[1px_0_0_0_#1e293b]">Employee</th>
                    {daysArray.map(d => (
                      <th key={d} className="px-1 py-2 font-semibold text-center min-w-[32px] border-l border-slate-800/30">
                        <div className="text-slate-700 dark:text-slate-300 text-xs">{d}</div>
                        <div className="text-[8px] mt-0.5">{getDayOfWeek(d)}</div>
                      </th>
                    ))}
                    <th className="px-4 py-3 font-semibold text-center sticky right-0 z-10 bg-slate-100 dark:bg-[#15181e] shadow-[-1px_0_0_0_#1e293b]">Total</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-700 dark:text-slate-300">
                  {filteredEmployees.map((emp, idx) => (
                    <motion.tr initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: idx * 0.05 }} key={emp.id} className="border-b border-slate-200/80 dark:border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 sticky left-0 z-10 bg-white dark:bg-[#1A1D23] shadow-[1px_0_0_0_#1e293b] group-hover:bg-slate-200 dark:bg-[#1f232b]">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{emp.firstName} {emp.lastName}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5">{emp.role}</div>
                      </td>
                      {daysArray.map(d => {
                        const status = getStatus(emp.id, d);
                        return (
                          <td key={d} className="px-1 py-3 text-center border-l border-slate-800/30 align-middle">
                            {renderStatus(status)}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center font-bold text-indigo-400 sticky right-0 z-10 bg-white dark:bg-[#1A1D23] shadow-[-1px_0_0_0_#1e293b] group-hover:bg-slate-200 dark:bg-[#1f232b]">
                        <div className="text-sm">{getTotalPresent(emp.id)}</div>
                        <div className="text-[8px] text-slate-500 dark:text-slate-500 font-normal">/{daysInMonth}</div>
                      </td>
                    </motion.tr>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={daysInMonth + 2} className="px-4 py-8 text-center text-slate-500 dark:text-slate-500">
                        No employees found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
};

export default Attendance;
