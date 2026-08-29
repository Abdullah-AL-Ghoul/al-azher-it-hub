import { getSupabase } from './supabase'
import { nowISO } from '../utils/helpers'
import { RateLimitService } from './rateLimitService'
import { sanitizeString } from '../utils/sanitize'

export async function getCommentsForAddition(additionId) {
  // SECURITY DEFINER RPC: returns the author display name + an isMine flag
  // but never the raw userId (which previously leaked the studentId <-> name
  // mapping to every authenticated user).
  const { data, error } = await getSupabase().rpc('get_comments_public', {
    p_addition_id: additionId,
  })
  if (error) throw error
  return data || []
}

export async function addComment(additionId, user, text) {
  const rateCheck = RateLimitService.checkCommentRateLimit(user.studentId)
  if (!rateCheck.allowed) {
    throw new Error(`TOO_MANY_COMMENTS: ${rateCheck.retryAfter}s remaining`)
  }

  const comment = {
    additionId,
    userId: user.studentId,
    userName: user.name,
    text: sanitizeString(text, 500),
    createdAt: nowISO(),
  }
  const { data, error } = await getSupabase()
    .from('comments')
    .insert(comment)
    .select()
    .single()
  if (error) throw error
  return data || { id: undefined, ...comment }
}

export async function deleteComment(additionId, commentId, userId, isAdmin) {
  // SECURITY CAVEAT: the `isAdmin` check below is client-side only. Deleting a
  // comment must also be enforced server-side via RLS on the comments table.
  const query = getSupabase()
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('additionId', additionId)
  if (!isAdmin) query.eq('userId', userId)
  const { error } = await query
  if (error) throw error
}
