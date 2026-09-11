import React, { useEffect, useState } from 'react';
import { getEvents, addEvent, deleteEvent } from '../api';
import { AppEvent } from '../types';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, MapPin, Plus, Trash2, CalendarDays } from 'lucide-react';
import { motion } from 'motion/react';

const Events = () => {
  const { user, canViewAll, canEdit } = useAuth();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await getEvents();
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !date || !time || !location) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      await addEvent({ title, description, date, time, location });
      setTitle('');
      setDescription('');
      setDate('');
      setTime('');
      setLocation('');
      fetchEvents();
    } catch (err) {
      setError('Failed to add event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteEvent(id);
      fetchEvents();
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Company Events</h1>
          <p className="text-slate-500 dark:text-slate-500 dark:text-slate-400">View upcoming company events and gatherings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Events List */}
        <div className={`space-y-4 ${canEdit ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {loading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-500">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <CalendarDays size={32} className="mx-auto text-slate-700 mb-4" />
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">No Upcoming Events</h3>
              <p className="text-slate-500 dark:text-slate-500 mt-1">There are currently no events scheduled.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((event, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={event.id}
                  className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700 rounded-xl p-5 group transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white group-hover:text-indigo-300 transition-colors">{event.title}</h3>
                    {canEdit && (
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-slate-500 dark:text-slate-500 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100"
                        title="Delete Event"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <p className="text-sm text-slate-500 dark:text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{event.description}</p>
                  
                  <div className="space-y-2 text-xs font-medium">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Calendar size={14} />
                      <span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-400">
                      <Clock size={14} />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-400">
                      <MapPin size={14} />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* HR Add Event Form */}
        {canEdit && (
          <div className="lg:col-span-1">
            <div className="relative bg-[#0C1017]/90 backdrop-blur-xl border border-slate-700/60 dark:border-slate-700/50 rounded-2xl p-6 sticky top-6 shadow-2xl shadow-black/40 overflow-hidden ring-1 ring-white/5">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent pointer-events-none" />
              <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                <Plus size={18} className="text-indigo-400" />
                Add New Event
              </h2>
              
              {error && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">{error}</div>}

              <form onSubmit={handleAddEvent} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Event Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#07090E]/90 border border-slate-700/60 text-slate-100 placeholder:text-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all shadow-inner"
                    placeholder="e.g. Annual Townhall"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-[#07090E]/90 border border-slate-700/60 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all shadow-inner [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Time</label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-[#07090E]/90 border border-slate-700/60 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all shadow-inner [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Location / Link</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#07090E]/90 border border-slate-700/60 text-slate-100 placeholder:text-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all shadow-inner"
                    placeholder="e.g. Main Conference Room or Zoom Link"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#07090E]/90 border border-slate-700/60 text-slate-100 placeholder:text-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all min-h-[100px] resize-none shadow-inner"
                    placeholder="Brief details about the event..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98] cursor-pointer mt-4 disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Event'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
