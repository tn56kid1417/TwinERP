import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Clock, Coffee, CalendarCheck, Users, Calendar, TrendingDown, TrendingUp, ChevronDown } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const pieData = [
  { name: 'Absent', value: 26, color: '#f87171' },
  { name: 'Present', value: 0, color: '#4ade80' },
];

const barData = [
  { name: 'Current', Present: 0, Absent: 26 }
];

const HRMUserAnalytics = () => {
  const [activeTab, setActiveTab] = useState('Individual');

  const tabs = [
    { id: 'Individual', icon: User, label: 'Individual' },
    { id: 'Punch-In', icon: Clock, label: 'Punch-In' },
    { id: 'Breaks', icon: Coffee, label: 'Breaks' },
    { id: 'Attendance', icon: CalendarCheck, label: 'Attendance' },
    { id: 'All Users', icon: Users, label: 'All Users' },
  ];

  return (
    <div className="p-8 max-w-[1600px] mx-auto h-full flex flex-col space-y-6 overflow-y-auto">
      
      {/* Header */}
      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-semibold text-white tracking-tight">User Analytics</h1>
        <p className="text-slate-400 text-sm">Individual and comparative user performance insights</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#12141A] rounded-lg p-1 border border-slate-800 w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-[#1C1F26] text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-indigo-400' : ''} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* User Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <User size={24} className="text-slate-400" />
            Sanjay S's Analytics
          </h2>
          <p className="text-slate-400 text-sm mt-1">Individual performance insights and trends</p>
        </div>
        
        <div className="relative">
          <select className="bg-[#12141A] text-sm text-slate-300 rounded-lg border border-slate-800 pl-4 pr-10 py-2 appearance-none outline-none focus:border-slate-600 transition-colors">
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
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0A0B0E] rounded-xl border border-slate-800 p-5 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-slate-200">Attendance Rate</span>
            <Calendar size={16} className="text-slate-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-green-500">0.0%</div>
            <div className="text-xs text-slate-500 mt-1">0/26 days</div>
          </div>
        </motion.div>

        {/* Punctuality Rate */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#0A0B0E] rounded-xl border border-slate-800 p-5 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-slate-200">Punctuality Rate</span>
            <Clock size={16} className="text-slate-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-500">0.0%</div>
            <div className="text-xs text-slate-500 mt-1">0/26 days</div>
          </div>
        </motion.div>

        {/* Late Days */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#0A0B0E] rounded-xl border border-slate-800 p-5 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-slate-200">Late Days</span>
            <TrendingDown size={16} className="text-green-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-500">0</div>
            <div className="text-xs text-slate-500 mt-1">0.0% of total days</div>
          </div>
        </motion.div>

        {/* Absent Days */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#0A0B0E] rounded-xl border border-slate-800 p-5 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-slate-200">Absent Days</span>
            <TrendingUp size={16} className="text-red-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-red-500">26</div>
            <div className="text-xs text-slate-500 mt-1">100.0% of working days</div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[400px]">
        {/* Punch-In Breakdown */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-[#0A0B0E] rounded-xl border border-slate-800 p-6 flex flex-col">
          <h3 className="text-sm font-semibold text-slate-200">Punch-In Breakdown</h3>
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
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-[#0A0B0E] rounded-xl border border-slate-800 p-6 flex flex-col">
          <h3 className="text-sm font-semibold text-slate-200">Attendance Overview</h3>
          <p className="text-xs text-slate-500 mb-6 mt-1">Present vs absent days comparison</p>
          
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                <XAxis dataKey="name" hide={true} />
                <YAxis 
                  ticks={[7, 14, 21, 28]} 
                  domain={[0, 28]}
                  tick={{ fill: '#64748B', fontSize: 12 }} 
                  axisLine={{ stroke: '#1E293B' }} 
                  tickLine={false} 
                />
                <RechartsTooltip
                  cursor={{ fill: '#1e293b' }}
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
