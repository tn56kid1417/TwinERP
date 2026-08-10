import { motion } from 'motion/react';
import React, { useEffect, useState, useMemo } from 'react';
import { User, Calendar } from 'lucide-react';
import { getEmployees, getLeaves } from '../api';
import { Employee, LeaveRequest } from '../types';
import { useAuth } from '../context/AuthContext';

const initialLeaveTypes = [
  { id: 1, name: 'Casual', total: 12, used: 0, available: 12, color: 'bg-blue-500' },
  { id: 2, name: 'Sick', total: 12, used: 0, available: 12, color: 'bg-red-500' },
  { id: 3, name: 'Earned', total: 15, used: 0, available: 15, color: 'bg-emerald-500' },
  { id: 4, name: 'Compensatory Off', total: 365, used: 0, available: 365, color: 'bg-amber-500' },
  { id: 5, name: 'Maternity Leave', total: 182, used: 0, available: 182, color: 'bg-pink-500' },
  { id: 6, name: 'Paternity Leave', total: 15, used: 0, available: 15, color: 'bg-sky-500' },
  { id: 7, name: 'Loss of Pay (LOP)', total: 365, used: 0, available: 365, color: 'bg-slate-500' },
];

const LeaveBalance = () => {
  const { user, canViewAll } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(user?.id || '');

  useEffect(() => {
    Promise.all([getEmployees(), getLeaves()]).then(([emps, allLeaves]) => {
      setEmployees(emps);
      setLeaves(allLeaves);
      if (canViewAll && emps.length > 0 && !selectedEmployeeId) {
        setSelectedEmployeeId(emps[0].id);
      }
    }).catch(console.error);
  }, [canViewAll, selectedEmployeeId]);

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  const leaveTypes = useMemo(() => {
    const employeeLeaves = leaves.filter(l => l.employeeId === selectedEmployeeId && l.status === 'Approved');
    return initialLeaveTypes.map(lt => {
      let used = 0;
      employeeLeaves.filter(l => l.leaveType === lt.name).forEach(l => {
        const days = (new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) / (1000 * 3600 * 24) + 1;
        used += Math.max(0, days);
      });
      return {
        ...lt,
        used,
        available: lt.total - used
      };
    });
  }, [leaves, selectedEmployeeId]);

  // Calculate totals
  const totalLeaves = leaveTypes.reduce((acc, curr) => acc + curr.total, 0);
  const totalUsed = leaveTypes.reduce((acc, curr) => acc + curr.used, 0);
  const totalAvailable = leaveTypes.reduce((acc, curr) => acc + curr.available, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">Leave Balance</h1>
          <p className="text-slate-500 dark:text-slate-500 mt-1">View employee leave balances for the current year.</p>
        </div>
        
        {canViewAll && employees.length > 0 && (
          <div className="w-64">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Select Employee</label>
            <select 
              className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded px-4 py-2 text-sm focus:outline-none focus:border-indigo-500/50"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 flex">
        <div className="w-full max-w-3xl flex flex-col min-h-0">
          {/* Header Card */}
          <div className="bg-white dark:bg-[#1A1D23] border border-slate-200 dark:border-slate-800 rounded-t-xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-800/50 flex items-center justify-center text-indigo-400">
                <User size={24} />
              </div>
              <div>
                <h2 className="text-lg font-medium text-slate-900 dark:text-white">
                  {selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : 'No employee selected'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1 mt-1">
                  <Calendar size={12} />
                  Current year leave balance
                </p>
              </div>
            </div>

            <div className="flex gap-8">
              <div className="text-center border-r border-slate-200 dark:border-slate-800 pr-8">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Total</p>
                <p className="text-xl font-medium text-slate-900 dark:text-white">{totalLeaves}</p>
              </div>
              <div className="text-center border-r border-slate-200 dark:border-slate-800 pr-8">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Used</p>
                <p className="text-xl font-medium text-red-400">{totalUsed}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Available</p>
                <p className="text-xl font-medium text-emerald-400">{totalAvailable}</p>
              </div>
            </div>
          </div>

          {/* List/Table */}
          <div className="bg-white dark:bg-[#1A1D23] border-x border-b border-slate-200 dark:border-slate-800 rounded-b-xl flex-1 flex flex-col min-h-0">
            <div className="px-6 py-4 border-t border-b border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/20 flex text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-500 font-semibold">
              <div className="flex-1">Leave Type</div>
              <div className="w-24 text-center">Total</div>
              <div className="w-24 text-center">Used</div>
              <div className="w-24 text-right">Available</div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {leaveTypes.map((leave, idx) => (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: idx * 0.05 }} key={leave.id} className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/50 flex items-center hover:bg-slate-800/30 transition-colors">
                  <div className="flex-1 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${leave.color}`}></div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{leave.name}</span>
                  </div>
                  <div className="w-24 text-center text-sm text-slate-900 dark:text-white font-medium">{leave.total}</div>
                  <div className="w-24 text-center text-sm text-red-400">{leave.used}</div>
                  <div className="w-24 text-right text-sm text-emerald-400 font-medium">{leave.available}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LeaveBalance;
