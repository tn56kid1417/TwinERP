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
 <h1 className="text-2xl sm:text-3xl font-medium text-slate-900 tracking-tight flex items-center gap-2 sm:gap-3">
 <Building className="text-blue-600 h-7 w-7 sm:h-8 sm:w-8"/>
 Clients Database
 </h1>
 <p className="text-slate-500 mt-1 text-sm">Manage client relationships and contact details.</p>
 </div>
 <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
 <div className="relative flex-1 sm:flex-initial">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"size={18} />
 <input 
 type="text"
 placeholder="Search clients..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="pl-10 pr-4 py-2 bg-white border border-slate-200 text-slate-800 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors w-full sm:w-64"
 />
 </div>
 {canEdit && (
 <button 
 onClick={() => setIsAddModalOpen(true)}
 className="bg-blue-600 hover:bg-blue-700 text-slate-900 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm cursor-pointer"
 >
 <Plus size={18} />
 Add Client
 </button>
 )}
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filteredClients.map(client => (
 <div key={client.id} className="bg-white border border-slate-200 rounded-xl p-6 relative group hover:border-slate-300 transition-colors">
 <div className="flex justify-between items-start mb-4">
 <div>
 <h3 className="text-xl font-semibold text-slate-900">{client.name}</h3>
 <span className="text-xs text-slate-500">{client.industry}</span>
 </div>
 <div className="flex items-center gap-2">
 <span className={`px-2 py-1 rounded text-xs font-bold ${
 client.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
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
 <div className="flex items-center gap-3 text-sm text-slate-700">
 <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-blue-600">
 {client.contactPerson.charAt(0)}
 </div>
 <div>
 <p className="font-medium text-slate-900">{client.contactPerson}</p>
 <p className="text-xs text-slate-500">Primary Contact</p>
 </div>
 </div>
 <div className="flex items-center gap-3 text-sm text-slate-500">
 <Mail size={16} className="text-slate-500"/>
 <a href={`mailto:${client.email}`} className="hover:text-blue-600 transition-colors">{client.email}</a>
 </div>
 <div className="flex items-center gap-3 text-sm text-slate-500">
 <Phone size={16} className="text-slate-500"/>
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
 className="relative bg-white border border-slate-200 rounded-lg shadow-lg w-full max-w-md overflow-hidden"
 >
 <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50 ">
 <h2 className="text-base font-bold text-slate-900 tracking-tight">Add New Client</h2>
 <button 
 onClick={() => setIsAddModalOpen(false)} 
 className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
 >
 <X size={18} />
 </button>
 </div>
 <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
 <div>
 <label className="block text-xs font-medium text-slate-600 mb-1.5">Company Name</label>
 <input required type="text"value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} className="w-full bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"placeholder="e.g. Acme Corp"/>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-medium text-slate-600 mb-1.5">Contact Person</label>
 <input required type="text"value={newClient.contactPerson} onChange={e => setNewClient({...newClient, contactPerson: e.target.value})} className="w-full bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"placeholder="John Doe"/>
 </div>
 <div>
 <label className="block text-xs font-medium text-slate-600 mb-1.5">Industry</label>
 <input type="text"value={newClient.industry} onChange={e => setNewClient({...newClient, industry: e.target.value})} className="w-full bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"placeholder="Technology"/>
 </div>
 </div>
 <div>
 <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
 <input required type="email"value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} className="w-full bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"placeholder="contact@acme.com"/>
 </div>
 <div>
 <label className="block text-xs font-medium text-slate-600 mb-1.5">Phone</label>
 <input type="text"value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} className="w-full bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"placeholder="+1 (555) 012-3456"/>
 </div>
 <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100">
 <button type="button"onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors border border-slate-200 cursor-pointer">
 Cancel
 </button>
 <button type="submit"className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-all shadow-sm cursor-pointer">
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