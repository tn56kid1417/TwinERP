/**
 * TwinERP Team Chat — Express Router (Phase 1)
 * Mount: app.use('/api', chatRouter)
 *
 * Auth: reads x-user-id header (set by frontend axios interceptor from
 * localStorage user.id). All privileged actions also check role.
 *
 * Persistence: Supabase Postgres via service-role client.
 * Gracefully returns 503 if SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set.
 */

import { Router, Request, Response } from 'express';
import { supabaseAdmin, isSupabaseReady } from './supabase';

const router = Router();

// ─── Auth middleware ──────────────────────────────────────────────────────────
// The frontend sends userId + userRole as headers (set in src/api.ts interceptor)
function getCallerFromHeaders(req: Request): { userId: string; userRole: string } | null {
  const userId   = req.headers['x-user-id']   as string | undefined;
  const userRole = req.headers['x-user-role'] as string | undefined;
  if (!userId) return null;
  return { userId, userRole: userRole || 'Member' };
}

function requireSupabase(res: Response): boolean {
  if (!isSupabaseReady()) {
    res.status(503).json({ error: 'Chat service not configured (missing Supabase env vars)' });
    return false;
  }
  return true;
}

function isElevated(role: string): boolean {
  return ['Admin', 'HR', 'CEO', 'CTO', 'Manager'].includes(role);
}

// ─── Helper: post a system message ───────────────────────────────────────────
export async function postSystemMessage(teamId: string, text: string): Promise<void> {
  if (!supabaseAdmin) return;
  await supabaseAdmin.from('chat_messages').insert({
    id:        `sys-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    team_id:   teamId,
    sender_id: 'system',
    content:   text,
    type:      'system',
  });
}

// ─── GET /api/chat/teams — list teams the user is an active member of ─────────
router.get('/chat/teams', async (req: Request, res: Response) => {
  if (!requireSupabase(res)) return;
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });

  const sb = supabaseAdmin!;

  // Teams the user is an active member of
  const { data: memberships, error: mErr } = await sb
    .from('chat_team_memberships')
    .select('team_id, role_in_team, can_post, view_only, joined_at')
    .eq('user_id', caller.userId)
    .eq('status', 'active');

  if (mErr) return void res.status(500).json({ error: mErr.message });
  if (!memberships?.length) return void res.json([]);

  const teamIds = memberships.map(m => m.team_id);

  // Fetch team metadata
  const { data: teams, error: tErr } = await sb
    .from('chat_teams')
    .select('*')
    .in('id', teamIds);

  if (tErr) return void res.status(500).json({ error: tErr.message });

  // Fetch unread counts: messages after lastReadMessageId
  const { data: readStates } = await sb
    .from('chat_message_read_state')
    .select('team_id, last_read_message_id')
    .eq('user_id', caller.userId)
    .in('team_id', teamIds);

  // For each team, count messages after last read
  const result = await Promise.all((teams || []).map(async team => {
    const membership = memberships.find(m => m.team_id === team.id)!;
    const readState  = readStates?.find(r => r.team_id === team.id);

    let unreadCount = 0;
    if (readState?.last_read_message_id) {
      // Get created_at of last read message
      const { data: lastMsg } = await sb
        .from('chat_messages')
        .select('created_at')
        .eq('id', readState.last_read_message_id)
        .single();

      if (lastMsg) {
        const { count } = await sb
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('team_id', team.id)
          .is('deleted_at', null)
          .neq('sender_id', caller.userId)
          .gt('created_at', lastMsg.created_at);
        unreadCount = count || 0;
      }
    } else {
      // Never read — count all messages not sent by user
      const { count } = await sb
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', team.id)
        .is('deleted_at', null)
        .neq('sender_id', caller.userId);
      unreadCount = count || 0;
    }

    return {
      ...team,
      membership: {
        roleInTeam: membership.role_in_team,
        canPost:    membership.can_post,
        viewOnly:   membership.view_only,
        joinedAt:   membership.joined_at,
      },
      unreadCount,
    };
  }));

  res.json(result);
});

// ─── POST /api/chat/teams — create team (HR/Admin only) ──────────────────────
router.post('/chat/teams', async (req: Request, res: Response) => {
  if (!requireSupabase(res)) return;
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });
  if (!isElevated(caller.userRole)) return void res.status(403).json({ error: 'Only HR/Admin can create teams' });

  const { name, memberIds = [], restrictHistory = false } = req.body;
  if (!name?.trim()) return void res.status(400).json({ error: 'Team name is required' });

  const sb = supabaseAdmin!;
  const teamId = `team-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const { data: team, error: tErr } = await sb
    .from('chat_teams')
    .insert({ id: teamId, name: name.trim(), created_by: caller.userId, restrict_history_to_membership_window: restrictHistory })
    .select()
    .single();

  if (tErr) return void res.status(500).json({ error: tErr.message });

  // Add creator as first member (elevated privileges)
  const creatorMembership = {
    id: `mem-${Date.now()}-creator`,
    team_id: teamId,
    user_id: caller.userId,
    role_in_team: caller.userRole,
    can_post: true,
    can_delete_others_messages: true,
    can_remove_members: true,
    view_only: false,
    status: 'active',
  };

  // Add other initial members
  const additionalMembers = (memberIds as string[])
    .filter(id => id !== caller.userId)
    .map((uid, i) => ({
      id: `mem-${Date.now()}-${i}`,
      team_id: teamId,
      user_id: uid,
      role_in_team: 'Member',
      can_post: true,
      can_delete_others_messages: false,
      can_remove_members: false,
      view_only: false,
      status: 'active',
    }));

  await sb.from('chat_team_memberships').insert([creatorMembership, ...additionalMembers]);

  // System message
  await postSystemMessage(teamId, `Team "${name}" was created.`);

  res.status(201).json(team);
});

// ─── GET /api/chat/teams/:teamId — team metadata + member list ────────────────
router.get('/chat/teams/:teamId', async (req: Request, res: Response) => {
  if (!requireSupabase(res)) return;
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });

  const { teamId } = req.params;
  const sb = supabaseAdmin!;

  // Check membership
  const { data: myMembership } = await sb
    .from('chat_team_memberships')
    .select('*')
    .eq('team_id', teamId)
    .eq('user_id', caller.userId)
    .eq('status', 'active')
    .single();

  if (!myMembership && !isElevated(caller.userRole)) {
    return void res.status(403).json({ error: 'Not a member of this team' });
  }

  const [teamRes, membersRes] = await Promise.all([
    sb.from('chat_teams').select('*').eq('id', teamId).single(),
    sb.from('chat_team_memberships').select('*').eq('team_id', teamId),
  ]);

  if (teamRes.error) return void res.status(404).json({ error: 'Team not found' });

  res.json({ team: teamRes.data, members: membersRes.data || [] });
});

// ─── GET /api/chat/teams/:teamId/messages — paginated messages ────────────────
router.get('/chat/teams/:teamId/messages', async (req: Request, res: Response) => {
  if (!requireSupabase(res)) return;
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });

  const { teamId } = req.params;
  const before  = req.query.before as string | undefined;
  const limit   = Math.min(parseInt(req.query.limit as string || '50', 10), 100);

  const sb = supabaseAdmin!;

  // Check active membership
  const { data: membership } = await sb
    .from('chat_team_memberships')
    .select('*')
    .eq('team_id', teamId)
    .eq('user_id', caller.userId)
    .eq('status', 'active')
    .single();

  if (!membership && !isElevated(caller.userRole)) {
    return void res.status(403).json({ error: 'Not a member of this team' });
  }

  // Fetch team for history flag
  const { data: team } = await sb
    .from('chat_teams')
    .select('restrict_history_to_membership_window')
    .eq('id', teamId)
    .single();

  let query = sb
    .from('chat_messages')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
    .limit(limit);

  // Apply history restriction: only show messages after the user's joinedAt
  if (team?.restrict_history_to_membership_window && membership?.joined_at) {
    query = query.gte('created_at', membership.joined_at);
  }

  // Cursor-based pagination: messages before a given message id
  if (before) {
    const { data: pivot } = await sb
      .from('chat_messages')
      .select('created_at')
      .eq('id', before)
      .single();
    if (pivot) {
      query = query.lt('created_at', pivot.created_at);
    }
  }

  const { data: messages, error } = await query;

  if (error) return void res.status(500).json({ error: error.message });

  const rawMessages = messages || [];

  // Phase 2: fetch attachments for these messages
  const msgIds = rawMessages.map(m => m.id);
  let attachmentsByMsg: Record<string, any[]> = {};
  if (msgIds.length > 0) {
    const { data: atts } = await sb
      .from('chat_message_attachments')
      .select('*')
      .in('message_id', msgIds);
    if (atts) {
      atts.forEach(a => {
        if (!attachmentsByMsg[a.message_id]) attachmentsByMsg[a.message_id] = [];
        attachmentsByMsg[a.message_id].push(a);
      });
    }
  }

  const enriched = rawMessages.map(m => ({
    ...m,
    attachments: attachmentsByMsg[m.id] || []
  }));

  // Return in ascending order for the UI
  res.json(enriched.reverse());
});

// ─── POST /api/chat/teams/:teamId/messages — send a message ──────────────────
router.post('/chat/teams/:teamId/messages', async (req: Request, res: Response) => {
  if (!requireSupabase(res)) return;
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });

  const { teamId } = req.params;
  const { content, type = 'text', attachments = [] } = req.body;
  if (!content?.trim() && (!attachments || attachments.length === 0)) {
    return void res.status(400).json({ error: 'Message content or attachment required' });
  }

  const sb = supabaseAdmin!;

  // Check active membership
  const { data: membership } = await sb
    .from('chat_team_memberships')
    .select('can_post, view_only, status')
    .eq('team_id', teamId)
    .eq('user_id', caller.userId)
    .eq('status', 'active')
    .single();

  if (!membership) return void res.status(403).json({ error: 'Not an active member of this team' });
  if (!membership.can_post || membership.view_only) {
    return void res.status(403).json({ error: 'You do not have permission to post in this team' });
  }

  const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const msgType = attachments && attachments.length > 0 && !content?.trim() ? 'file' : type;

  const { data: message, error } = await sb
    .from('chat_messages')
    .insert({ id: msgId, team_id: teamId, sender_id: caller.userId, content: (content || '').trim(), type: msgType })
    .select()
    .single();

  if (error) return void res.status(500).json({ error: error.message });

  // Phase 2: Save attachments if provided
  let savedAttachments: any[] = [];
  if (Array.isArray(attachments) && attachments.length > 0) {
    const toInsert = attachments.map((att: any) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      message_id: msgId,
      url: att.url,
      file_name: att.fileName || att.file_name || 'attachment',
      mime_type: att.mimeType || att.mime_type || 'application/octet-stream',
    }));
    const { data: attData } = await sb.from('chat_message_attachments').insert(toInsert).select();
    savedAttachments = attData || [];
  }

  // Phase 2: Parse @mentions and trigger ERP notification pipeline
  try {
    const mentionRegex = /@([a-zA-Z0-9_.-]+(?:\s+[a-zA-Z0-9_.-]+)?)/g;
    const mentions = (content || '').match(mentionRegex);
    if (mentions && mentions.length > 0) {
      const { data: teamData } = await sb.from('chat_teams').select('name').eq('id', teamId).single();
      const teamName = teamData?.name || 'team chat';
      
      const { data: members } = await sb
        .from('chat_team_memberships')
        .select('user_id')
        .eq('team_id', teamId)
        .eq('status', 'active');
      
      const memberUserIds = new Set((members || []).map(m => m.user_id));

      // Check against in-memory ERP employees
      const { employees, addNotification } = require('./index');
      if (Array.isArray(employees) && typeof addNotification === 'function') {
        const cleanedMentions = mentions.map((m: string) => m.slice(1).toLowerCase().trim());
        
        employees.forEach((emp: any) => {
          if (emp.id === caller.userId) return; // Don't notify self
          if (!memberUserIds.has(emp.id)) return; // Only notify team members

          const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase().trim();
          const firstName = (emp.firstName || '').toLowerCase().trim();
          const username = (emp.email ? emp.email.split('@')[0] : '').toLowerCase().trim();

          const isMentioned = cleanedMentions.some((m: string) => 
            m === fullName || m === firstName || m === username || m === emp.id.toLowerCase()
          );

          if (isMentioned) {
            addNotification({
              title: `Mentioned in ${teamName}`,
              message: `${caller.userId} mentioned you in ${teamName}: "${content.length > 60 ? content.slice(0, 57) + '...' : content}"`,
              type: 'mention',
              targetRole: 'All',
              targetUserId: emp.id
            });
          }
        });
      }
    }
  } catch (err) {
    console.error('[chat] Failed to process mentions:', err);
  }

  // Update read state for sender
  await sb.from('chat_message_read_state').upsert({
    user_id: caller.userId,
    team_id: teamId,
    last_read_message_id: msgId,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,team_id' });

  res.status(201).json({
    ...message,
    attachments: savedAttachments
  });
});

// ─── PATCH /api/chat/teams/:teamId/messages/:messageId — edit own message ─────
router.patch('/chat/teams/:teamId/messages/:messageId', async (req: Request, res: Response) => {
  if (!requireSupabase(res)) return;
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });

  const { teamId, messageId } = req.params;
  const { content } = req.body;
  if (!content?.trim()) return void res.status(400).json({ error: 'Content required' });

  const sb = supabaseAdmin!;

  const { data: message } = await sb
    .from('chat_messages')
    .select('sender_id, deleted_at, type')
    .eq('id', messageId)
    .eq('team_id', teamId)
    .single();

  if (!message) return void res.status(404).json({ error: 'Message not found' });
  if (message.deleted_at) return void res.status(400).json({ error: 'Cannot edit a deleted message' });
  if (message.type === 'system') return void res.status(403).json({ error: 'System messages cannot be edited' });
  if (message.sender_id !== caller.userId) return void res.status(403).json({ error: 'Can only edit your own messages' });

  const { data: updated, error } = await sb
    .from('chat_messages')
    .update({ content: content.trim(), edited_at: new Date().toISOString() })
    .eq('id', messageId)
    .select()
    .single();

  if (error) return void res.status(500).json({ error: error.message });
  res.json(updated);
});

// ─── DELETE /api/chat/teams/:teamId/messages/:messageId — soft delete ─────────
router.delete('/chat/teams/:teamId/messages/:messageId', async (req: Request, res: Response) => {
  if (!requireSupabase(res)) return;
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });

  const { teamId, messageId } = req.params;
  const sb = supabaseAdmin!;

  const { data: message } = await sb
    .from('chat_messages')
    .select('sender_id, deleted_at, type')
    .eq('id', messageId)
    .eq('team_id', teamId)
    .single();

  if (!message) return void res.status(404).json({ error: 'Message not found' });
  if (message.deleted_at) return void res.status(400).json({ error: 'Already deleted' });
  if (message.type === 'system') return void res.status(403).json({ error: 'System messages cannot be deleted' });

  // Allow: own message OR elevated role OR can_delete_others_messages
  const isOwn = message.sender_id === caller.userId;
  if (!isOwn) {
    const { data: m } = await sb
      .from('chat_team_memberships')
      .select('can_delete_others_messages')
      .eq('team_id', teamId)
      .eq('user_id', caller.userId)
      .eq('status', 'active')
      .single();

    const canDelete = isElevated(caller.userRole) || m?.can_delete_others_messages;
    if (!canDelete) return void res.status(403).json({ error: 'Not authorized to delete this message' });
  }

  const { data: updated, error } = await sb
    .from('chat_messages')
    .update({ deleted_at: new Date().toISOString(), content: '[message removed]' })
    .eq('id', messageId)
    .select()
    .single();

  if (error) return void res.status(500).json({ error: error.message });
  res.json(updated);
});

// ─── POST /api/chat/teams/:teamId/members — add member ───────────────────────
router.post('/chat/teams/:teamId/members', async (req: Request, res: Response) => {
  if (!requireSupabase(res)) return;
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });

  const { teamId } = req.params;
  const { userId, roleInTeam = 'Member', canPost = true, viewOnly = false, canDeleteOthersMessages = false, canRemoveMembers = false } = req.body;
  if (!userId) return void res.status(400).json({ error: 'userId required' });

  // Must be HR/Admin OR have can_remove_members privilege in this team
  const sb = supabaseAdmin!;

  if (!isElevated(caller.userRole)) {
    const { data: callerMem } = await sb
      .from('chat_team_memberships')
      .select('can_remove_members')
      .eq('team_id', teamId)
      .eq('user_id', caller.userId)
      .eq('status', 'active')
      .single();
    if (!callerMem?.can_remove_members) {
      return void res.status(403).json({ error: 'Only HR/Admin can add members' });
    }
  }

  // Fetch team name for system message
  const { data: team } = await sb.from('chat_teams').select('name').eq('id', teamId).single();

  // Deactivate any existing 'removed' row for this user (re-add case)
  await sb
    .from('chat_team_memberships')
    .update({ status: 'removed', removed_at: new Date().toISOString() })
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .eq('status', 'active');

  const { data: membership, error } = await sb
    .from('chat_team_memberships')
    .insert({
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      team_id: teamId,
      user_id: userId,
      role_in_team: roleInTeam,
      can_post: canPost,
      can_delete_others_messages: canDeleteOthersMessages,
      can_remove_members: canRemoveMembers,
      view_only: viewOnly,
      status: 'active',
    })
    .select()
    .single();

  if (error) return void res.status(500).json({ error: error.message });

  await postSystemMessage(teamId, `User ${userId} was added to "${team?.name || teamId}" as ${roleInTeam}.`);

  res.status(201).json(membership);
});

// ─── DELETE /api/chat/teams/:teamId/members/:userId — remove member ───────────
router.delete('/chat/teams/:teamId/members/:userId', async (req: Request, res: Response) => {
  if (!requireSupabase(res)) return;
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });

  const { teamId, userId } = req.params;
  const sb = supabaseAdmin!;

  if (!isElevated(caller.userRole)) {
    const { data: callerMem } = await sb
      .from('chat_team_memberships')
      .select('can_remove_members')
      .eq('team_id', teamId)
      .eq('user_id', caller.userId)
      .eq('status', 'active')
      .single();
    if (!callerMem?.can_remove_members) {
      return void res.status(403).json({ error: 'Not authorized to remove members' });
    }
  }

  const { data: team } = await sb.from('chat_teams').select('name').eq('id', teamId).single();

  const { error } = await sb
    .from('chat_team_memberships')
    .update({ status: 'removed', removed_at: new Date().toISOString(), removed_by: caller.userId })
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error) return void res.status(500).json({ error: error.message });

  await postSystemMessage(teamId, `User ${userId} was removed from "${team?.name || teamId}".`);

  res.status(204).end();
});

// ─── GET /api/chat/teams/:teamId/read-state ───────────────────────────────────
router.get('/chat/teams/:teamId/read-state', async (req: Request, res: Response) => {
  if (!requireSupabase(res)) return;
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });

  const { teamId } = req.params;
  const sb = supabaseAdmin!;

  const { data } = await sb
    .from('chat_message_read_state')
    .select('last_read_message_id, updated_at')
    .eq('user_id', caller.userId)
    .eq('team_id', teamId)
    .single();

  res.json(data || { last_read_message_id: null });
});

// ─── POST /api/chat/teams/:teamId/read-state ──────────────────────────────────
router.post('/chat/teams/:teamId/read-state', async (req: Request, res: Response) => {
  if (!requireSupabase(res)) return;
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });

  const { teamId } = req.params;
  const { lastReadMessageId } = req.body;
  if (!lastReadMessageId) return void res.status(400).json({ error: 'lastReadMessageId required' });

  const sb = supabaseAdmin!;

  await sb.from('chat_message_read_state').upsert({
    user_id: caller.userId,
    team_id: teamId,
    last_read_message_id: lastReadMessageId,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,team_id' });

  res.json({ success: true });
});

// ─── GET /api/chat/teams/:teamId/search — search messages in a team ───────────
router.get('/chat/teams/:teamId/search', async (req: Request, res: Response) => {
  if (!requireSupabase(res)) return;
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });

  const { teamId } = req.params;
  const q = req.query.q as string;
  if (!q || !q.trim()) return void res.json([]);

  const sb = supabaseAdmin!;

  // Check active membership
  const { data: membership } = await sb
    .from('chat_team_memberships')
    .select('status')
    .eq('team_id', teamId)
    .eq('user_id', caller.userId)
    .eq('status', 'active')
    .single();

  if (!membership && !isElevated(caller.userRole)) {
    return void res.status(403).json({ error: 'Not a member of this team' });
  }

  const { data: messages, error } = await sb
    .from('chat_messages')
    .select('*')
    .eq('team_id', teamId)
    .is('deleted_at', null)
    .ilike('content', `%${q.trim()}%`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return void res.status(500).json({ error: error.message });
  res.json(messages || []);
});

// ─── POST /api/chat/workflow-system-message — post cross-module system message ─
router.post('/chat/workflow-system-message', async (req: Request, res: Response) => {
  if (!requireSupabase(res)) return;
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });
  if (!isElevated(caller.userRole)) return void res.status(403).json({ error: 'Only managers/executives can trigger workflow messages' });

  const { teamId, text } = req.body;
  if (!teamId || !text?.trim()) return void res.status(400).json({ error: 'teamId and text required' });

  await postSystemMessage(teamId, text.trim());
  res.json({ success: true });
});

// ─── GET /api/chat/teams/:teamId/export — export team chat history to CSV ──────
router.get('/chat/teams/:teamId/export', async (req: Request, res: Response) => {
  if (!requireSupabase(res)) return;
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });
  if (!isElevated(caller.userRole)) return void res.status(403).json({ error: 'Only elevated roles (Admin/HR/Managers) can export chat logs' });

  const { teamId } = req.params;
  const sb = supabaseAdmin!;

  const { data: team } = await sb.from('chat_teams').select('name').eq('id', teamId).single();
  const { data: messages, error } = await sb
    .from('chat_messages')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: true });

  if (error) return void res.status(500).json({ error: error.message });

  // Convert to CSV: timestamp, senderId, type, content, isDeleted, editedAt
  const rows = [
    ['Message ID', 'Timestamp', 'Sender ID', 'Type', 'Content', 'Status', 'Edited At'].join(',')
  ];

  (messages || []).forEach(m => {
    const isDel = !!m.deleted_at;
    const cleanContent = isDel 
      ? '[message removed]' 
      : `"${(m.content || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
    
    rows.push([
      `"${m.id}"`,
      `"${m.created_at}"`,
      `"${m.sender_id}"`,
      `"${m.type}"`,
      cleanContent,
      isDel ? '"Deleted"' : '"Active"',
      m.edited_at ? `"${m.edited_at}"` : '""'
    ].join(','));
  });

  const csvData = rows.join('\r\n');
  const safeName = (team?.name || teamId).replace(/[^a-zA-Z0-9_-]/g, '_');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}_chat_export_${Date.now()}.csv"`);
  res.send(csvData);
});

export default router;
