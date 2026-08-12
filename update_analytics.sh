cat << 'INNER_EOF' > src/pages/HRMUserAnalytics.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Clock, Coffee, CalendarCheck, Users, Calendar, TrendingDown, TrendingUp, ChevronDown } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../twin-crm/store/authStore';

const HRMUserAnalytics = () => {
  const [activeTab, setActiveTab] = useState('Individual');
  const { user } = useAuthStore();
  const [attendances, setAttendances] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/attendance')
      .then(res => res.json())
      .then(data => {
        setAttendances(data);
      })
      .catch(console.error);
  }, []);

  const tabs = [
    { id: 'Individual', icon: User, label: 'Individual' },
    { id: 'Punch-In', icon: Clock, label: 'Punch-In' },
    { id: 'Breaks', icon: Coffee, label: 'Breaks' },
    { id: 'Attendance', icon: CalendarCheck, label: 'Attendance' },
    { id: 'All Users', icon: Users, label: 'All Users' },
  ];

  const employeeId = user?.id || 'e1';
  const userName = user?.name || "Sanjay S";
  
  const totalWorkingDays = 26;
  const userAttendances = attendances.filter(a => a.employeeId === employeeId);
  
  let presentDays = 0;
  let lateDays = 0;

  userAttendances.forEach(a => {
    if (a.status === 'Present') {
      presentDays++;
      // Basic mock logic for late days
      if (a.clockInTime) {
        const hour = new Date(a.clockInTime).getHours();
        if (hour >= 10) lateDays++; // assuming 10 AM is late
      }
    }
  });

  const absentDays = Math.max(0, totalWorkingDays - presentDays);
  const attendanceRate = totalWorkingDays > 0 ? ((presentDays / totalWorkingDays) * 100).toFixed(1) : '0.0';
  const punctualityRate = presentDays > 0 ? (((presentDays - lateDays) / presentDays) * 100).toFixed(1) : '0.0';
  const lateDaysPercent = totalWorkingDays > 0 ? ((lateDays / totalWorkingDays) * 100).toFixed(1) : '0.0';
  const absentDaysPercent = totalWorkingDays > 0 ? ((absentDays / totalWorkingDays) * 100).toFixed(1) : '0.0';

  const pieData = [
    { name: 'Absent', value: absentDays, color: '#f87171' },
    { name: 'Present', value: presentDays, color: '#4ade80' },
  ];

  const barData = [
    { name: 'Current', Present: presentDays, Absent: absentDays }
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      
      {/* Header */}
      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          User Analytics
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Individual and comparative user performance insights</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-950 rounded-lg p-1 border border-slate-200 dark:border-slate-800 w-full overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-colors min-w-[120px] ${
                isActive 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-primary' : ''} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* User Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <User size={24} className="text-slate-400" />
            {userName}'s Analytics
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Individual performance insights and trends</p>
        </div>
        
        <div className="relative">
          <select className="bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 rounded-lg border border-slate-300 dark:border-slate-700 pl-4 pr-10 py-2 appearance-none outline-none focus:border-primary transition-colors cursor-pointer">
            <option>Month</option>
            <option>Week</option>
            <option>Year</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Attendance Rate */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between h-32 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Attendance Rate</span>
            <Calendar size={16} className="text-slate-400 dark:text-slate-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-500">{attendanceRate}%</div>
            <div className="text-xs text-slate-500 mt-1">{presentDays}/{totalWorkingDays} days</div>
          </div>
        </motion.div>

        {/* Punctuality Rate */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between h-32 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Punctuality Rate</span>
            <Clock size={16} className="text-slate-400 dark:text-slate-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">{punctualityRate}%</div>
            <div className="text-xs text-slate-500 mt-1">{presentDays - lateDays}/{totalWorkingDays} days</div>
          </div>
        </motion.div>

        {/* Late Days */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between h-32 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Late Days</span>
            <TrendingDown size={16} className="text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">{lateDays}</div>
            <div className="text-xs text-slate-500 mt-1">{lateDaysPercent}% of total days</div>
          </div>
        </motion.div>

        {/* Absent Days */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between h-32 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Absent Days</span>
            <TrendingUp size={16} className="text-red-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-500">{absentDays}</div>
            <div className="text-xs text-slate-500 mt-1">{absentDaysPercent}% of working days</div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[400px]">
        {/* Punch-In Breakdown */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Punch-In Breakdown</h3>
          <p className="text-xs text-slate-500 mb-6 mt-1">Daily punctuality performance</p>
          
          <div className="flex-1 flex items-center justify-center min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius="60%"
                  outerRadius="80%"
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '0.5rem', color: '#F8FAFC', fontSize: '12px' }}
                  itemStyle={{ color: '#F8FAFC' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Attendance Overview */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Attendance Overview</h3>
          <p className="text-xs text-slate-500 mb-6 mt-1">Present vs absent days comparison</p>
          
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" hide={true} />
                <YAxis 
                  ticks={[7, 14, 21, 28]} 
                  domain={[0, 28]}
                  tick={{ fill: '#64748B', fontSize: 12 }} 
                  axisLine={{ stroke: '#cbd5e1' }} 
                  className="dark:axisLine-slate-700"
                  tickLine={false} 
                />
                <RechartsTooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '0.5rem', color: '#F8FAFC', fontSize: '12px' }}
                />
                <Bar dataKey="Present" fill="#4ade80" radius={[4, 4, 0, 0]} maxBarSize={150} />
                <Bar dataKey="Absent" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={150} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HRMUserAnalytics;
INNER_EOF
