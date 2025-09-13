import pool from '../../../lib/db';
import { authMiddleware } from '../../../lib/auth';
import { handleCors } from '../../../lib/cors';

export default async function handler(req, res) {
  handleCors(req, res);
  
  if (req.method === 'OPTIONS') return;

  const decoded = await authMiddleware(req, res);
  if (!decoded) return;

  switch (req.method) {
    case 'GET':
      return await getNotes(req, res, decoded);
    case 'POST':
      return await createNote(req, res, decoded);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getNotes(req, res, user) {
  try {
    const notesQuery = `
      SELECT n.*, u.email as author_email 
      FROM notes n 
      JOIN users u ON n.user_id = u.id 
      WHERE n.tenant_id = $1 
      ORDER BY n.created_at DESC
    `;
    const result = await pool.query(notesQuery, [user.tenant_id]);

    res.status(200).json({ notes: result.rows });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function createNote(req, res, user) {
  const { title, content } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    // Check tenant's subscription plan and note count
    const tenantQuery = 'SELECT subscription_plan FROM tenants WHERE id = $1';
    const tenantResult = await pool.query(tenantQuery, [user.tenant_id]);
    
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const subscriptionPlan = tenantResult.rows[0].subscription_plan;

    if (subscriptionPlan === 'free') {
      const countQuery = 'SELECT COUNT(*) as count FROM notes WHERE tenant_id = $1';
      const countResult = await pool.query(countQuery, [user.tenant_id]);
      const noteCount = parseInt(countResult.rows[0].count);

      if (noteCount >= 3) {
        return res.status(403).json({ 
          error: 'Free plan limited to 3 notes. Upgrade to Pro for unlimited notes.' 
        });
      }
    }

    const insertQuery = `
      INSERT INTO notes (tenant_id, user_id, title, content, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [
      user.tenant_id,
      user.id,
      title.trim(),
      content || ''
    ]);

    res.status(201).json({ note: result.rows[0] });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}