import { useAuth } from '../../context/AuthContext';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building, Plus, Mail, Phone, Trash2, X, Search } from 'lucide-react';
import { getClients, addClient, updateClient, deleteClient } from '../../api';
import { Client } from '../../types';

export default function ClientsList() {
  const { canEdit } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [newClient, setNewClient] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    industry: '',
    status: 'Active' as const
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const added = await addClient(newClient);
      setClients([...clients, added]);
      setIsAddModalOpen(false);
      setNewClient({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        industry: '',
        status: 'Active'
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteClient = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove client "${name}"?`)) return;
    try {
      await deleteClient(id);
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Failed to delete client:', error);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium text-slate-900 dark:text-white tracking-tight flex items-center gap-2 sm:gap-3">
            <Building className="text-indigo-500 h-7 w-7 sm:h-8 sm:w-8" />
            Clients Database
          </h1>
          <p className="text-slate-500 dark:text-slate-500 mt-1 text-sm">Manage client relationships and contact details.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-[#1A1D23] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors w-full sm:w-64"
            />
          </div>
        {canEdit && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            <Plus size={18} />
            Add Client
          </button>
        )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white dark:bg-[#1A1D23] border border-slate-200 dark:border-slate-800 rounded-xl p-6 relative group hover:border-slate-300 dark:border-slate-700 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{client.name}</h3>
                <span className="text-xs text-slate-500 dark:text-slate-500">{client.industry}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                  client.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 dark:text-slate-500 dark:text-slate-400 border border-slate-500/20'
                }`}>
                  {client.status}
                </span>
                {canEdit && (
                  <button
                    onClick={() => handleDeleteClient(client.id, client.name)}
                    className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete client"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="space-y-3 mt-6">
              <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-400">
                  {client.contactPerson.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{client.contactPerson}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Primary Contact</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-500 dark:text-slate-400">
                <Mail size={16} className="text-slate-500 dark:text-slate-500" />
                <a href={`mailto:${client.email}`} className="hover:text-indigo-400 transition-colors">{client.email}</a>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-500 dark:text-slate-400">
                <Phone size={16} className="text-slate-500 dark:text-slate-500" />
                {client.phone}
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white/95 dark:bg-[#0C1017]/95 border border-slate-200/90 dark:border-slate-700/50 rounded-2xl shadow-2xl shadow-slate-900/15 dark:shadow-black/80 ring-1 ring-black/5 dark:ring-white/10 w-full max-w-md overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent pointer-events-none" />
              <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-md">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Add New Client</h2>
                <button 
                  onClick={() => setIsAddModalOpen(false)} 
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">Company Name</label>
                  <input required type="text" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} className="w-full bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm dark:shadow-inner" placeholder="e.g. Acme Corp" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">Contact Person</label>
                    <input required type="text" value={newClient.contactPerson} onChange={e => setNewClient({...newClient, contactPerson: e.target.value})} className="w-full bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm dark:shadow-inner" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">Industry</label>
                    <input type="text" value={newClient.industry} onChange={e => setNewClient({...newClient, industry: e.target.value})} className="w-full bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm dark:shadow-inner" placeholder="Technology" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">Email</label>
                  <input required type="email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} className="w-full bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm dark:shadow-inner" placeholder="contact@acme.com" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">Phone</label>
                  <input type="text" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} className="w-full bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm dark:shadow-inner" placeholder="+1 (555) 012-3456" />
                </div>
                <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors border border-slate-200 dark:border-slate-700/50 cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98] cursor-pointer">
                    Save Client
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
