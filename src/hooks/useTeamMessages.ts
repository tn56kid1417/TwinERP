/**
 * useTeamMessages — transport-isolated polling hook (Phase 1)
 *
 * Fetches messages every POLL_INTERVAL_MS when the browser tab is visible.
 * Pauses automatically when tab is hidden (visibilitychange API).
 *
 * Phase 3 upgrade: replace the internals of this hook with Supabase Realtime
 * subscription. The exposed interface (messages, loading, sendMessage, etc.)
 * stays identical — zero component code changes needed.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getChatMessages,
  sendChatMessage,
  editChatMessage,
  deleteChatMessage,
  updateChatReadState,
  getChatReadState,
} from '../api';
import type { ChatMessage } from '../types';

const POLL_INTERVAL_MS = 5000;

interface UseTeamMessagesResult {
  messages:      ChatMessage[];
  loading:       boolean;
  sending:       boolean;
  hasMore:       boolean;
  sendMessage:   (content: string, attachments?: { url: string; fileName: string; mimeType: string }[]) => Promise<void>;
  editMessage:   (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  loadMore:      () => Promise<void>;
  refresh:       () => void;
}

export function useTeamMessages(teamId: string | null): UseTeamMessagesResult {
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [loading, setLoading]     = useState(false);
  const [sending, setSending]     = useState(false);
  const [hasMore, setHasMore]     = useState(false);

  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const teamIdRef  = useRef<string | null>(null);
  const mountedRef = useRef(true);

  // ─── Initial load ──────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async (silent = false) => {
    if (!teamId) return;
    if (!silent) setLoading(true);
    try {
      const data = await getChatMessages(teamId, { limit: 50 });
      if (!mountedRef.current) return;
      const validMessages = Array.isArray(data) ? data : [];

      setMessages(prev => {
        // On silent poll: merge new messages (append any not already in list)
        if (silent && prev.length > 0) {
          const existingIds = new Set(prev.map(m => m.id));
          const incoming = validMessages.filter(m => m && m.id && !existingIds.has(m.id));
          if (incoming.length === 0) return prev;
          return [...prev, ...incoming];
        }
        return validMessages;
      });

      setHasMore(validMessages.length === 50);

      // Mark last message as read
      if (validMessages.length > 0) {
        const lastId = validMessages[validMessages.length - 1].id;
        updateChatReadState(teamId, lastId).catch(() => {/* non-critical */});
      }
    } catch (err) {
      console.error('[useTeamMessages] fetch error', err);
    } finally {
      if (!silent && mountedRef.current) setLoading(false);
    }
  }, [teamId]);

  // ─── Reset & re-fetch when teamId changes ──────────────────────────────────
  useEffect(() => {
    if (teamId === teamIdRef.current) return;
    teamIdRef.current = teamId;
    setMessages([]);
    setHasMore(false);

    if (!teamId) return;
    // Fetch initial chat read state baseline (Tier 3 Item 2)
    getChatReadState(teamId).catch(() => {/* fallback */});
    fetchMessages(false);
  }, [teamId, fetchMessages]);

  // ─── Polling (tab-visibility aware) ───────────────────────────────────────
  useEffect(() => {
    if (!teamId) return;

    const startPoll = () => {
      if (pollRef.current) return;
      pollRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchMessages(true);
        }
      }, POLL_INTERVAL_MS);
    };

    const stopPoll = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchMessages(true);
        startPoll();
      } else {
        stopPoll();
      }
    };

    startPoll();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPoll();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [teamId, fetchMessages]);

  // ─── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // ─── Send ──────────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (content: string, attachments?: { url: string; fileName: string; mimeType: string }[]) => {
    if (!teamId || (!content.trim() && (!attachments || attachments.length === 0))) return;
    setSending(true);
    try {
      const msg = await sendChatMessage(teamId, content.trim(), attachments && attachments.length > 0 && !content.trim() ? 'file' : 'text', attachments);
      setMessages(prev => [...prev, msg]);
    } finally {
      setSending(false);
    }
  }, [teamId]);

  // ─── Edit ──────────────────────────────────────────────────────────────────
  const editMessage = useCallback(async (messageId: string, content: string) => {
    if (!teamId) return;
    const updated = await editChatMessage(teamId, messageId, content);
    setMessages(prev => prev.map(m => m.id === messageId ? updated : m));
  }, [teamId]);

  // ─── Delete (soft) ────────────────────────────────────────────────────────
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!teamId) return;
    const updated = await deleteChatMessage(teamId, messageId);
    setMessages(prev => prev.map(m => m.id === messageId ? updated : m));
  }, [teamId]);

  // ─── Load more (older) ────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!teamId || messages.length === 0) return;
    const oldestId = messages[0].id;
    const older = await getChatMessages(teamId, { before: oldestId, limit: 50 });
    const validOlder = Array.isArray(older) ? older : [];
    setMessages(prev => [...validOlder, ...prev]);
    setHasMore(validOlder.length === 50);
  }, [teamId, messages]);

  return { messages, loading, sending, hasMore, sendMessage, editMessage, deleteMessage, loadMore, refresh: () => fetchMessages(false) };
}
