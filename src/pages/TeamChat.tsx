import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare, Plus, Send, Pencil, Trash2, Check, X,
  Users, ChevronRight, AlertCircle, Loader2, UserPlus,
  UserMinus, Shield, Hash, MoreHorizontal, RefreshCw,
  ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTeamMessages } from '../hooks/useTeamMessages';
import {
  getChatTeams, createChatTeam, getChatTeamDetail,
  addChatMember, removeChatMember, getUsers
} from '../api';
import type { ChatTeamWithMeta, ChatMembership, ChatMessage } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const AVATAR_PALETTE = [
  'from-indigo-600 to-indigo-400',
  'from-violet-600 to-violet-400',
  'from-sky-600 to-sky-400',
  'from-emerald-600 to-emerald-400',
  'from-amber-600 to-amber-400',
  'from-rose-600 to-rose-400',
  'from-teal-600 to-teal-400',
];

function avatarGrad(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function initials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface MessageBubbleProps {
  msg: ChatMessage;
  isOwn: boolean;
  senderName: string;
  canDelete: boolean;
  canEdit: boolean;
  onEdit: (msg: ChatMessage) => void;
  onDelete: (id: string) => void;
}

function MessageBubble({ msg, isOwn, senderName, canDelete, canEdit, onEdit, onDelete }: MessageBubbleProps) {
  const [hovered, setHovered] = useState(false);

  if (msg.type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[11px] text-slate-500 dark:text-slate-500 italic bg-slate-100/60 dark:bg-slate-800/50 px-3 py-1 rounded-full">
          {msg.content}
        </span>
      </div>
    );
  }

  const isDeleted = !!msg.deleted_at;

  return (
    <div
      className={`flex items-end gap-2 group ${isOwn ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      {!isOwn && (
        <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${avatarGrad(msg.sender_id)} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>
          {initials(senderName)}
        </div>
      )}

      <div className={`max-w-[72%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
        {!isOwn && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">{senderName}</span>
        )}

        <div className={`relative rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
          isOwn
            ? 'bg-indigo-600 text-white rounded-br-sm'
            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700/60 rounded-bl-sm'
        } ${isDeleted ? 'opacity-50' : ''}`}>
          {isDeleted
            ? <span className="italic text-xs opacity-70">[message removed]</span>
            : msg.content}

          {msg.edited_at && !isDeleted && (
            <span className={`text-[9px] ml-1.5 ${isOwn ? 'text-indigo-200' : 'text-slate-400'}`}>(edited)</span>
          )}
        </div>

        <span className={`text-[10px] text-slate-400 mx-1 ${isOwn ? 'text-right' : ''}`}>
          {formatTime(msg.created_at)}
        </span>
      </div>

      {/* Action buttons on hover */}
      {!isDeleted && hovered && (msg.type !== 'system') && (
        <div className={`flex items-center gap-0.5 ${isOwn ? 'mr-1' : 'ml-1'}`}>
          {canEdit && isOwn && (
            <button
              onClick={() => onEdit(msg)}
              className="p-1 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
              title="Edit"
            >
              <Pencil size={13} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(msg.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TeamChat() {
  const { user, isAdmin, canViewAll } = useAuth();
  const isElevated = isAdmin || canViewAll;

  // Teams list
  const [teams, setTeams]               = useState<ChatTeamWithMeta[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Members panel
  const [members, setMembers]           = useState<ChatMembership[]>([]);
  const [myMembership, setMyMembership] = useState<ChatMembership | null>(null);
  const [showMembers, setShowMembers]   = useState(false);

  // Create team modal
  const [showCreateModal, setShowCreateModal]   = useState(false);
  const [allUsers, setAllUsers]                  = useState<any[]>([]);
  const [newTeamName, setNewTeamName]            = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [creating, setCreating]                  = useState(false);

  // Add member modal
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberUserId, setAddMemberUserId] = useState('');
  const [addMemberRole, setAddMemberRole]    = useState('Member');
  const [addMemberViewOnly, setAddMemberViewOnly] = useState(false);

  // Message composer
  const [draft, setDraft]       = useState('');
  const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);
  const [editDraft, setEditDraft]   = useState('');

  const bottomRef    = useRef<HTMLDivElement>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);

  // Chat hook
  const { messages, loading: msgsLoading, sending, hasMore, sendMessage, editMessage, deleteMessage, loadMore } = useTeamMessages(selectedTeamId);

  // ─── Load teams list ────────────────────────────────────────────────────────
  const loadTeams = useCallback(async () => {
    try {
      setTeamsLoading(true);
      const data = await getChatTeams();
      setTeams(data);
      if (!selectedTeamId && data.length > 0) {
        setSelectedTeamId(data[0].id);
      }
    } catch {
      toast.error('Failed to load teams');
    } finally {
      setTeamsLoading(false);
    }
  }, [selectedTeamId]);

  useEffect(() => { loadTeams(); }, []);

  // ─── Load team detail when selection changes ────────────────────────────────
  useEffect(() => {
    if (!selectedTeamId) return;
    getChatTeamDetail(selectedTeamId)
      .then(({ members: m }) => {
        setMembers(m);
        const me = m.find(x => x.user_id === user?.id && x.status === 'active') || null;
        setMyMembership(me);
      })
      .catch(() => {});
  }, [selectedTeamId, user?.id]);

  // ─── Auto-scroll on new messages ───────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Load users for create modal ───────────────────────────────────────────
  useEffect(() => {
    if (showCreateModal || showAddMember) {
      getUsers({}).then(res => setAllUsers(res.data || [])).catch(() => {});
    }
  }, [showCreateModal, showAddMember]);

  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const canPost = myMembership?.can_post && !myMembership?.view_only;
  const canDeleteOthers = isElevated || myMembership?.can_delete_others_messages;

  // ─── Send / Edit submit ────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!draft.trim() || !canPost) return;
    try {
      await sendMessage(draft.trim());
      setDraft('');
      textareaRef.current?.focus();
      // Update unread count in teams list
      setTeams(prev => prev.map(t => t.id === selectedTeamId ? { ...t, unreadCount: 0 } : t));
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to send message');
    }
  };

  const handleEditSubmit = async () => {
    if (!editingMsg || !editDraft.trim()) return;
    try {
      await editMessage(editingMsg.id, editDraft.trim());
      setEditingMsg(null);
      setEditDraft('');
    } catch {
      toast.error('Failed to edit message');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMessage(id);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to delete message');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Create team ───────────────────────────────────────────────────────────
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    setCreating(true);
    try {
      const team = await createChatTeam({ name: newTeamName.trim(), memberIds: selectedMemberIds });
      setShowCreateModal(false);
      setNewTeamName('');
      setSelectedMemberIds([]);
      await loadTeams();
      setSelectedTeamId(team.id);
      toast.success(`Team "${team.name}" created`);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  // ─── Add member ────────────────────────────────────────────────────────────
  const handleAddMember = async () => {
    if (!selectedTeamId || !addMemberUserId) return;
    try {
      await addChatMember(selectedTeamId, { userId: addMemberUserId, roleInTeam: addMemberRole, canPost: !addMemberViewOnly, viewOnly: addMemberViewOnly });
      toast.success('Member added');
      setShowAddMember(false);
      setAddMemberUserId('');
      getChatTeamDetail(selectedTeamId).then(({ members: m }) => setMembers(m));
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to add member');
    }
  };

  // ─── Remove member ─────────────────────────────────────────────────────────
  const handleRemoveMember = async (userId: string) => {
    if (!selectedTeamId) return;
    try {
      await removeChatMember(selectedTeamId, userId);
      toast.success('Member removed');
      getChatTeamDetail(selectedTeamId).then(({ members: m }) => setMembers(m));
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to remove member');
    }
  };

  // ─── Name lookup helper ────────────────────────────────────────────────────
  const getName = (senderId: string): string => {
    if (senderId === 'system') return 'System';
    const m = members.find(x => x.user_id === senderId);
    if (m) return senderId; // Fallback to ID — in real setup join with employees
    const u = allUsers.find(x => x.id === senderId);
    return u ? u.name : senderId;
  };

  // ─── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden bg-slate-50 dark:bg-[#0A0C10]">

      {/* ── Left: Teams List ─────────────────────────────────────────────── */}
      <div className="w-72 shrink-0 flex flex-col bg-white/90 dark:bg-[#0C1017]/95 border-r border-slate-200/60 dark:border-slate-800/60 backdrop-blur-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-indigo-500" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">Team Chat</span>
          </div>
          {isElevated && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-500/10 transition-colors"
              title="Create new team"
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {/* Teams list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {teamsLoading ? (
            <div className="flex justify-center pt-8">
              <Loader2 size={20} className="animate-spin text-indigo-500" />
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center text-slate-400 text-xs pt-8 px-4">
              {isElevated ? 'No teams yet. Create one with the + button.' : 'You are not a member of any team yet.'}
            </div>
          ) : (
            teams.map(team => (
              <button
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  selectedTeamId === team.id
                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold bg-gradient-to-tr ${avatarGrad(team.id)} text-white`}>
                  {initials(team.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{team.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{team.membership.roleInTeam}</p>
                </div>
                {team.unreadCount > 0 && (
                  <span className="shrink-0 min-w-[20px] h-5 px-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {team.unreadCount > 99 ? '99+' : team.unreadCount}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Right: Chat Area ──────────────────────────────────────────────── */}
      {!selectedTeamId ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 flex-col gap-3">
          <MessageSquare size={40} className="opacity-30" />
          <p className="text-sm">Select a team to start chatting</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Chat header */}
          <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-[#0C1017]/90 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold bg-gradient-to-tr ${selectedTeam ? avatarGrad(selectedTeam.id) : 'from-slate-500 to-slate-400'} text-white`}>
                {selectedTeam ? initials(selectedTeam.name) : '#'}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedTeam?.name}</p>
                <p className="text-[10px] text-slate-400">
                  {members.filter(m => m.status === 'active').length} members
                </p>
              </div>
              {selectedTeam?.restrict_history_to_membership_window && (
                <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
                  Restricted History
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowAddMember(true)}
                className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                title="Add member"
              >
                <UserPlus size={16} />
              </button>
              <button
                onClick={() => setShowMembers(v => !v)}
                className={`p-2 rounded-lg transition-colors ${showMembers ? 'text-indigo-500 bg-indigo-500/10' : 'text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10'}`}
                title="Toggle members panel"
              >
                <Users size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Message thread */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Load more */}
              {hasMore && (
                <div className="flex justify-center pt-3 shrink-0">
                  <button
                    onClick={loadMore}
                    className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-400 font-semibold bg-indigo-500/10 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <ChevronUp size={13} /> Load older messages
                  </button>
                </div>
              )}

              {/* Messages scroll area */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {msgsLoading ? (
                  <div className="flex justify-center pt-12">
                    <Loader2 size={24} className="animate-spin text-indigo-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                    <MessageSquare size={32} className="opacity-30" />
                    <p className="text-sm">No messages yet. Say hello! 👋</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      isOwn={msg.sender_id === user?.id}
                      senderName={getName(msg.sender_id)}
                      canEdit={msg.sender_id === user?.id}
                      canDelete={!!(canDeleteOthers || msg.sender_id === user?.id)}
                      onEdit={m => { setEditingMsg(m); setEditDraft(m.content); }}
                      onDelete={handleDelete}
                    />
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Composer */}
              <div className="shrink-0 p-4 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-[#0C1017]/90">
                {/* Edit mode banner */}
                {editingMsg && (
                  <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3 py-2 mb-2">
                    <span className="text-xs text-indigo-400 font-semibold">Editing message</span>
                    <button onClick={() => { setEditingMsg(null); setEditDraft(''); }} className="text-slate-400 hover:text-slate-200">
                      <X size={14} />
                    </button>
                  </div>
                )}

                {myMembership?.view_only ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800/60 rounded-xl px-4 py-3">
                    <AlertCircle size={14} className="text-amber-400" />
                    You are an observer in this team — read only.
                  </div>
                ) : !myMembership ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800/60 rounded-xl px-4 py-3">
                    <AlertCircle size={14} className="text-rose-400" />
                    You are not an active member of this team.
                  </div>
                ) : (
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={editingMsg ? editDraft : draft}
                      onChange={e => editingMsg ? setEditDraft(e.target.value) : setDraft(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                      className="flex-1 resize-none bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors max-h-32 overflow-y-auto scrollbar-thin"
                      style={{ minHeight: '42px' }}
                      onInput={e => {
                        const el = e.currentTarget;
                        el.style.height = 'auto';
                        el.style.height = Math.min(el.scrollHeight, 128) + 'px';
                      }}
                    />
                    <button
                      onClick={editingMsg ? handleEditSubmit : handleSend}
                      disabled={sending || (editingMsg ? !editDraft.trim() : !draft.trim())}
                      className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-colors flex items-center justify-center shadow-md shadow-indigo-600/30"
                    >
                      {sending
                        ? <Loader2 size={16} className="animate-spin" />
                        : editingMsg ? <Check size={16} /> : <Send size={16} />}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Members panel */}
            <AnimatePresence>
              {showMembers && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 240, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0 border-l border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-[#0C1017]/90 overflow-hidden"
                >
                  <div className="p-4 w-60">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                      Members · {members.filter(m => m.status === 'active').length}
                    </p>
                    <div className="space-y-2">
                      {members.filter(m => m.status === 'active').map(m => (
                        <div key={m.id} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${avatarGrad(m.user_id)} text-white flex items-center justify-center text-[9px] font-bold shrink-0`}>
                              {m.user_id.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{m.user_id}</p>
                              <p className="text-[10px] text-slate-400 truncate flex items-center gap-0.5">
                                {m.view_only && <Shield size={9} className="text-amber-400" />}
                                {m.role_in_team}
                              </p>
                            </div>
                          </div>
                          {isElevated && m.user_id !== user?.id && (
                            <button
                              onClick={() => handleRemoveMember(m.user_id)}
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
                              title="Remove member"
                            >
                              <UserMinus size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── Create Team Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-[#0C1017] border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-2xl p-6"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Hash size={16} className="text-indigo-500" /> Create Team Chat
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 pt-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Team Name *</label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={e => setNewTeamName(e.target.value)}
                    placeholder="e.g. Engineering Core"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Add Members (optional)
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-1 bg-slate-50 dark:bg-slate-900/60 rounded-xl p-2 border border-slate-200 dark:border-slate-800">
                    {allUsers.filter(u => u.id !== user?.id).map(u => (
                      <label key={u.id} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedMemberIds.includes(u.id)}
                          onChange={e => {
                            setSelectedMemberIds(prev =>
                              e.target.checked ? [...prev, u.id] : prev.filter(id => id !== u.id)
                            );
                          }}
                          className="accent-indigo-600"
                        />
                        <span className="text-xs text-slate-700 dark:text-slate-300">{u.name}</span>
                        <span className="text-[10px] text-slate-400">{u.role}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-1">
                  <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl">
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTeam}
                    disabled={creating || !newTeamName.trim()}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md shadow-indigo-600/30"
                  >
                    {creating ? 'Creating…' : 'Create Team'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Add Member Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-[#0C1017] border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-2xl p-6"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserPlus size={16} className="text-indigo-500" /> Add Member
                </h3>
                <button onClick={() => setShowAddMember(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 pt-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Select User</label>
                  <select
                    value={addMemberUserId}
                    onChange={e => setAddMemberUserId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value="">— Choose user —</option>
                    {allUsers.filter(u => !members.find(m => m.user_id === u.id && m.status === 'active')).map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Role in Team</label>
                  <input
                    type="text"
                    value={addMemberRole}
                    onChange={e => setAddMemberRole(e.target.value)}
                    placeholder="e.g. Observer, PM, Developer"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={addMemberViewOnly}
                    onChange={e => setAddMemberViewOnly(e.target.checked)}
                    className="accent-amber-500"
                  />
                  <Shield size={13} className="text-amber-400" />
                  View only (Observer — can read but not post)
                </label>

                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={() => setShowAddMember(false)} className="px-3 py-1.5 text-xs text-slate-500">Cancel</button>
                  <button
                    onClick={handleAddMember}
                    disabled={!addMemberUserId}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl"
                  >
                    Add Member
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
