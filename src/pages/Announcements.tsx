import { motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { Megaphone, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement } from '../api';
import { Announcement } from '../types';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';

const Announcements = () => {
  const { user, canViewAll, canEdit } = useAuth();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: `${user?.firstName} ${user?.lastName}`
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ title: '', content: '' });
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.content) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await addAnnouncement(formData);
      await loadData();
      setFormData({ ...formData, title: '', content: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add announcement');
    }
  };

  const confirmDelete = (id: string) => {
    setAnnouncementToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!announcementToDelete) return;
    try {
      await deleteAnnouncement(announcementToDelete);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteModalOpen(false);
      setAnnouncementToDelete(null);
    }
  };

  const startEditing = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setEditData({ title: announcement.title, content: announcement.content });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData({ title: '', content: '' });
  };

  const saveEdit = async (id: string) => {
    try {
      await updateAnnouncement(id, editData);
      setEditingId(null);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-medium text-slate-900 dark:text-white tracking-tight">Announcements</h1>
        <p className="text-slate-500 dark:text-slate-500 mt-1 text-sm">{canEdit ? 'Create and manage company-wide announcements.' : 'Latest news and updates from the company.'}</p>
      </div>

      <div className={`grid grid-cols-1 gap-8 flex-1 min-h-0 ${canEdit ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
        {canEdit && (
          <div className="lg:col-span-1">
            <div className="relative bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-lg shadow-slate-200/50 dark:shadow-black/40 overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent pointer-events-none" />
              <h2 className="text-base font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <Plus size={18} className="text-indigo-600 dark:text-indigo-400" />
                New Announcement
              </h2>
              
              {error && (
                <div className="bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 p-3 rounded-xl text-xs mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">Title</label>
                  <input type="text" required className="w-full bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm dark:shadow-inner"
                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Announcement Title" />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">Content</label>
                  <textarea 
                    required
                    className="w-full bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all h-32 resize-none shadow-sm dark:shadow-inner"
                    value={formData.content} 
                    onChange={e => setFormData({...formData, content: e.target.value})}
                    placeholder="Write your announcement here..."
                  ></textarea>
                </div>

                <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98] cursor-pointer mt-6">
                  Publish Announcement
                </button>
              </form>
            </div>
          </div>
        )}

        <div className={`${canEdit ? 'lg:col-span-2' : 'max-w-4xl'} flex flex-col min-h-0`}>
          <div className="bg-white/90 dark:bg-[#1A1D23]/70 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Published Announcements</h2>
            </div>
            
            <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
              {loading ? (
                <div className="text-center text-slate-500 dark:text-slate-500 py-8">Loading...</div>
              ) : announcements.length === 0 ? (
                <div className="flex flex-col items-center justify-center space-y-3 py-16">
                  <Megaphone size={32} className="text-slate-700" />
                  <div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">No Announcements found</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Check back later for updates.</p>
                  </div>
                </div>
              ) : (
                announcements.map((announcement, idx) => (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: idx * 0.05 }} key={announcement.id} className="bg-white/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 shadow-sm rounded-xl p-5">
                    {editingId === announcement.id && canEdit ? (
                      <div className="space-y-3">
                        <input type="text" className="w-full bg-white dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                          value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} />
                        <textarea className="w-full bg-white dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 h-24 resize-none"
                          value={editData.content} onChange={e => setEditData({...editData, content: e.target.value})} />
                        <div className="flex justify-end gap-2">
                          <button onClick={cancelEditing} className="px-3 py-1.5 text-xs text-slate-500 dark:text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">Cancel</button>
                          <button onClick={() => saveEdit(announcement.id)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white rounded text-xs transition-colors">Save</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">{announcement.title}</h3>
                          {canEdit && (
                            <div className="flex gap-2">
                              <button onClick={() => startEditing(announcement)} className="text-slate-500 dark:text-slate-500 hover:text-indigo-400 transition-colors">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => confirmDelete(announcement.id)} className="text-slate-500 dark:text-slate-500 hover:text-red-400 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-500 dark:text-slate-400 mb-4 whitespace-pre-wrap">{announcement.content}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest">
                          <span>{announcement.date}</span>
                          <span>&bull;</span>
                          <span>{announcement.author}</span>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete Announcement"
        message="Are you sure you want to delete this announcement? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setAnnouncementToDelete(null);
        }}
      />
    </motion.div>
  );
};

export default Announcements;
