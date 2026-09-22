import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare, Plus, Send, Pencil, Trash2, Check, X,
  Users, ChevronRight, AlertCircle, Loader2, UserPlus,
  UserMinus, Shield, Hash, MoreHorizontal, RefreshCw,
  ChevronUp, Paperclip, Search, Download, File, Image as ImageIcon,
  AtSign, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTeamMessages } from '../hooks/useTeamMessages';
import {
  getChatTeams, createChatTeam, getChatTeamDetail,
  addChatMember, removeChatMember, getUsers,
  searchChatMessages, exportChatHistory
} from '../api';
import type { ChatTeamWithMeta, ChatMembership, ChatMessage, ChatAttachment } from '../types';

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

/** Render content with highlighted @mentions */
function renderMessageContent(content: string, isOwn: boolean) {
  const parts = content.split(/(@[a-zA-Z0-9_.-]+(?:\s+[a-zA-Z0-9_.-]+)?)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('@')) {
      return (
        <span
          key={idx}
          className={`inline-block font-semibold px-1.5 py-0.2 rounded-md mx-0.5 text-xs ${
            isOwn
              ? 'bg-indigo-800 text-indigo-100'
              : 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
          }`}
        >
          {part}
        </span>
      );
    }
    return <span key={idx}>{part}</span>;
  });
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
  onImageClick?: (url: string) => void;
}

function MessageBubble({
  msg,
  isOwn,
  senderName,
  canDelete,
  canEdit,
  onEdit,
  onDelete,
  onImageClick
}: MessageBubbleProps) {
  const [hovered, setHovered] = useState(false);

  if (msg.type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-100/70 dark:bg-slate-800/60 px-3 py-1 rounded-full border border-slate-200/40 dark:border-slate-700/40">
          {msg.content}
        </span>
      </div>
    );
  }

  const isDeleted = !!msg.deleted_at;
  const attachments = msg.attachments || [];

  return (
    <div
      id={`msg-${msg.id}`}
      className={`flex items-end gap-2 group transition-colors rounded-xl p-1 ${
        isOwn ? 'flex-row-reverse' : ''
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      {!isOwn && (
        <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${avatarGrad(msg.sender_id)} text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm`}>
          {initials(senderName)}
        </div>
      )}

      <div className={`max-w-[72%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
        {!isOwn && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1 font-medium">{senderName}</span>
        )}

        <div className={`relative rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
          isOwn
            ? 'bg-indigo-600 text-white rounded-br-sm'
            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700/60 rounded-bl-sm'
        } ${isDeleted ? 'opacity-50' : ''}`}>
          {isDeleted ? (
            <span className="italic text-xs opacity-70">[message removed]</span>
          ) : (
            <>
              {msg.content && <div>{renderMessageContent(msg.content, isOwn)}</div>}

              {/* Attachments rendering */}
              {attachments.length > 0 && (
                <div className={`mt-2 space-y-2 ${msg.content ? 'pt-1.5 border-t border-white/20 dark:border-slate-700/60' : ''}`}>
                  {attachments.map((att) => {
                    const isImg = att.mime_type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(att.file_name);
                    return isImg ? (
                      <div key={att.id} className="rounded-lg overflow-hidden max-w-xs border border-black/10">
                        <img
                          src={att.url}
                          alt={att.file_name}
                          onClick={() => onImageClick?.(att.url)}
                          className="max-h-60 w-auto rounded-lg object-cover cursor-pointer hover:opacity-95 transition-opacity"
                        />
                        <div className="flex items-center justify-between p-1 text-[10px] bg-black/20 text-white truncate">
                          <span className="truncate">{att.file_name}</span>
                          <a
                            href={att.url}
                            download={att.file_name}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:text-indigo-200"
                            title="Download"
                          >
                            <Download size={12} />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <a
                        key={att.id}
                        href={att.url}
                        download={att.file_name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2.5 p-2 rounded-xl text-xs transition-colors ${
                          isOwn
                            ? 'bg-indigo-700/60 hover:bg-indigo-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="p-2 rounded-lg bg-black/10 text-indigo-400">
                          <FileText size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{att.file_name}</p>
                          <p className="text-[10px] opacity-70 uppercase tracking-wider">{att.mime_type.split('/')[1] || 'FILE'}</p>
                        </div>
                        <Download size={14} className="shrink-0 opacity-70 hover:opacity-100" />
                      </a>
                    );
                  })}
                </div>
              )}
            </>
          )}

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

  // Search in chat (Phase 2)
  const [searchOpen, setSearchOpen]       = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
  const [searching, setSearching]         = useState(false);

  // Create team modal
  const [showCreateModal, setShowCreateModal]     = useState(false);
  const [allUsers, setAllUsers]                    = useState<any[]>([]);
  const [newTeamName, setNewTeamName]              = useState('');
  const [selectedMemberIds, setSelectedMemberIds]   = useState<string[]>([]);
  const [creating, setCreating]                    = useState(false);

  // Add member modal
  const [showAddMember, setShowAddMember]   = useState(false);
  const [addMemberUserId, setAddMemberUserId] = useState('');
  const [addMemberRole, setAddMemberRole]      = useState('Member');
  const [addMemberViewOnly, setAddMemberViewOnly] = useState(false);

  // Message composer
  const [draft, setDraft]               = useState('');
  const [editingMsg, setEditingMsg]         = useState<ChatMessage | null>(null);
  const [editDraft, setEditDraft]           = useState('');
  const [selectedFiles, setSelectedFiles]   = useState<{ url: string; fileName: string; mimeType: string }[]>([]);

  // @Mentions popup state (Phase 2)
  const [mentionQuery, setMentionQuery]     = useState<string | null>(null);
  const [mentionIndex, setMentionIndex]     = useState<number>(0);

  // Lightbox preview for images
  const [previewImage, setPreviewImage]     = useState<string | null>(null);

  const bottomRef     = useRef<HTMLDivElement>(null);
  const textareaRef   = useRef<HTMLTextAreaElement>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);

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
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);

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

  // ─── Load users for create modal & mention autocomplete ─────────────────────
  useEffect(() => {
    getUsers({ limit: 100 })
      .then(res => setAllUsers(res.data || res.users || []))
      .catch(() => {});
  }, []);

  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const canPost = myMembership?.can_post && !myMembership?.view_only;
  const canDeleteOthers = isElevated || myMembership?.can_delete_others_messages;

  // ─── Send / Edit submit ────────────────────────────────────────────────────
  const handleSend = async () => {
    if ((!draft.trim() && selectedFiles.length === 0) || !canPost) return;
    try {
      await sendMessage(draft.trim(), selectedFiles);
      setDraft('');
      setSelectedFiles([]);
      setMentionQuery(null);
      textareaRef.current?.focus();
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

  // ─── Handle File Upload (Phase 2) ───────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds 10MB limit`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64Url = reader.result as string;
        setSelectedFiles(prev => [
          ...prev,
          { url: base64Url, fileName: file.name, mimeType: file.type || 'application/octet-stream' }
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeSelectedFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // ─── Mentions Autocomplete (Phase 2) ─────────────────────────────────────────
  const handleDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setDraft(text);

    // Look back for @ pattern before cursor
    const cursorPos = e.target.selectionStart || 0;
    const textBeforeCursor = text.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9_.-]*)$/);

    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (userToMention: { name: string; id: string }) => {
    const mentionTag = `@${userToMention.name.replace(/\s+/g, '')} `;
    const cursorPos = textareaRef.current?.selectionStart || draft.length;
    const textBeforeCursor = draft.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9_.-]*)$/);

    if (atMatch) {
      const startIndex = textBeforeCursor.lastIndexOf('@');
      const newDraft = draft.slice(0, startIndex) + mentionTag + draft.slice(cursorPos);
      setDraft(newDraft);
    } else {
      setDraft(draft + mentionTag);
    }

    setMentionQuery(null);
    textareaRef.current?.focus();
  };

  const activeTeamMembers = allUsers.filter(u =>
    members.some(m => m.user_id === u.id && m.status === 'active')
  );

  const mentionCandidates = (activeTeamMembers.length > 0 ? activeTeamMembers : allUsers).filter(u =>
    !mentionQuery || u.name.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 5);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && mentionCandidates.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % mentionCandidates.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + mentionCandidates.length) % mentionCandidates.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(mentionCandidates[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setMentionQuery(null);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Search in Chat (Phase 2) ────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!selectedTeamId || !searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchChatMessages(selectedTeamId, searchQuery.trim());
      setSearchResults(results);
    } catch {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const jumpToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-indigo-500/20');
      setTimeout(() => el.classList.remove('bg-indigo-500/20'), 2500);
    } else {
      toast('Message is further up in history — click "Load older messages"');
    }
  };

  // ─── Export Chat (Phase 2) ───────────────────────────────────────────────────
  const handleExport = async () => {
    if (!selectedTeamId) return;
    try {
      toast.loading('Preparing CSV export...', { id: 'export-toast' });
      const blob = await exportChatHistory(selectedTeamId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${(selectedTeam?.name || 'team').replace(/\s+/g, '_')}_chat_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Chat export downloaded', { id: 'export-toast' });
    } catch {
      toast.error('Failed to export chat logs', { id: 'export-toast' });
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
      await addChatMember(selectedTeamId, {
        userId: addMemberUserId,
        roleInTeam: addMemberRole,
        canPost: !addMemberViewOnly,
        viewOnly: addMemberViewOnly
      });
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
                  <p className="text-[10px] text-slate-400 truncate">{team.membership?.roleInTeam || 'Member'}</p>
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

            <div className="flex items-center gap-1.5">
              {/* Search button */}
              <button
                onClick={() => setSearchOpen(v => !v)}
                className={`p-2 rounded-lg transition-colors ${searchOpen ? 'text-indigo-500 bg-indigo-500/10' : 'text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10'}`}
                title="Search messages in this team"
              >
                <Search size={16} />
              </button>

              {/* Admin CSV Export */}
              {isElevated && (
                <button
                  onClick={handleExport}
                  className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  title="Export team chat to CSV"
                >
                  <Download size={16} />
                </button>
              )}

              {/* Add member */}
              <button
                onClick={() => setShowAddMember(true)}
                className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                title="Add member"
              >
                <UserPlus size={16} />
              </button>

              {/* Members panel toggle */}
              <button
                onClick={() => setShowMembers(v => !v)}
                className={`p-2 rounded-lg transition-colors ${showMembers ? 'text-indigo-500 bg-indigo-500/10' : 'text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10'}`}
                title="Toggle members panel"
              >
                <Users size={16} />
              </button>
            </div>
          </div>

          {/* Search Bar Panel (Phase 2) */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200/60 dark:border-slate-800/60 px-5 py-2.5 flex flex-col gap-2 overflow-hidden"
              >
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      placeholder="Search this chat... (press Enter)"
                      className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={searching || !searchQuery.trim()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                  >
                    {searching ? <Loader2 size={12} className="animate-spin" /> : 'Search'}
                  </button>
                  <button
                    onClick={() => { setSearchOpen(false); setSearchResults([]); }}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Search results */}
                {searchResults.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1 pt-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400">{searchResults.length} match(es) found:</p>
                    {searchResults.map(res => (
                      <div
                        key={res.id}
                        onClick={() => jumpToMessage(res.id)}
                        className="p-2 bg-white dark:bg-slate-800/80 rounded-lg text-xs cursor-pointer hover:bg-indigo-500/10 transition-colors flex items-center justify-between gap-2"
                      >
                        <span className="truncate text-slate-700 dark:text-slate-300">
                          <b>{getName(res.sender_id)}:</b> {res.content}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">{formatTime(res.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

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
                      onImageClick={url => setPreviewImage(url)}
                    />
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Composer */}
              <div className="shrink-0 p-4 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-[#0C1017]/90 relative">
                {/* Mentions popup autocomplete (Phase 2) */}
                {mentionQuery !== null && mentionCandidates.length > 0 && (
                  <div className="absolute bottom-full left-4 mb-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-1 z-30 overflow-hidden">
                    <p className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 flex items-center gap-1">
                      <AtSign size={10} /> Mention team member
                    </p>
                    {mentionCandidates.map((cand, idx) => (
                      <button
                        key={cand.id}
                        onClick={() => insertMention(cand)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${
                          idx === mentionIndex
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                        }`}
                      >
                        <span className="font-semibold truncate">{cand.name}</span>
                        <span className={`text-[10px] ${idx === mentionIndex ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {cand.role}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Edit mode banner */}
                {editingMsg && (
                  <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3 py-2 mb-2">
                    <span className="text-xs text-indigo-400 font-semibold">Editing message</span>
                    <button onClick={() => { setEditingMsg(null); setEditDraft(''); }} className="text-slate-400 hover:text-slate-200">
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Selected file attachments tray (Phase 2) */}
                {selectedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    {selectedFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-white dark:bg-slate-700 px-2.5 py-1 rounded-lg text-xs text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-600">
                        {f.mimeType.startsWith('image/') ? <ImageIcon size={12} className="text-indigo-500" /> : <File size={12} className="text-amber-500" />}
                        <span className="max-w-[120px] truncate">{f.fileName}</span>
                        <button onClick={() => removeSelectedFile(i)} className="text-slate-400 hover:text-rose-400 p-0.5">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
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
                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      multiple
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />

                    {/* Attachment button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Attach files or images"
                    >
                      <Paperclip size={18} />
                    </button>

                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={editingMsg ? editDraft : draft}
                      onChange={editingMsg ? (e => setEditDraft(e.target.value)) : handleDraftChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message or @ to mention… (Enter to send)"
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
                      disabled={sending || (editingMsg ? !editDraft.trim() : (!draft.trim() && selectedFiles.length === 0))}
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
                      {members.filter(m => m.status === 'active').map(m => {
                        const memberUser = allUsers.find(u => u.id === m.user_id);
                        const displayName = memberUser ? memberUser.name : m.user_id;
                        return (
                          <div key={m.id} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${avatarGrad(m.user_id)} text-white flex items-center justify-center text-[9px] font-bold shrink-0`}>
                                {initials(displayName)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{displayName}</p>
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
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── Image Lightbox Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {previewImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl">
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X size={18} />
              </button>
              <img src={previewImage} alt="Attachment preview" className="max-h-[85vh] w-auto object-contain rounded-xl" />
            </div>
          </div>
        )}
      </AnimatePresence>

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
                    placeholder="e.g. Frontend Engineering, Sales Pod A"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Initial Members</label>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    {allUsers.filter(u => u.id !== user?.id).map(u => (
                      <label key={u.id} className="flex items-center gap-2.5 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg cursor-pointer">
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
