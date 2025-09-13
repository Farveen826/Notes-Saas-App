import pool from '../../../lib/db';
import { authMiddleware } from '../../../lib/auth';
import { handleCors } from '../../../lib/cors';

export default async function handler(req, res) {
  handleCors(req, res);
  
  if (req.method === 'OPTIONS') return;

  const decoded = await authMiddleware(req, res);
  if (!decoded) return;

  const { id } = req.query;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: 'Valid note ID required' });
  }

  switch (req.method) {
    case 'GET':
      return await getNote(req, res, decoded, parseInt(id));
    case 'PUT':
      return await updateNote(req, res, decoded, parseInt(id));
    case 'DELETE':
      return await deleteNote(req, res, decoded, parseInt(id));
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getNote(req, res, user, noteId) {
  try {
    const noteQuery = `
      SELECT n.*, u.email as author_email 
      FROM notes n 
      JOIN users u ON n.user_id = u.id 
      WHERE n.id = $1 AND n.tenant_id = $2
    `;
    const result = await pool.query(noteQuery, [noteId, user.tenant_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.status(200).json({ note: result.rows[0] });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateNote(req, res, user, noteId) {
  const { title, content } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const updateQuery = `
      UPDATE notes 
      SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3 AND tenant_id = $4 AND user_id = $5
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [
      title.trim(),
      content || '',
      noteId,
      user.tenant_id,
      user.id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found or unauthorized' });
    }

    res.status(200).json({ note: result.rows[0] });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteNote(req, res, user, noteId) {
  try {
    const deleteQuery = `
      DELETE FROM notes 
      WHERE id = $1 AND tenant_id = $2 AND user_id = $3
      RETURNING *
    `;
    const result = await pool.query(deleteQuery, [noteId, user.tenant_id, user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found or unauthorized' });
    }

    res.status(200).json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}