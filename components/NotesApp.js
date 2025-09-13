import React, { useState, useEffect } from 'react';
import { User, LogOut, Plus, Trash2, Edit3, Save, X, Crown } from 'lucide-react';

// API Base URL
const API_BASE = '/api';

// API utility functions
const api = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return await response.json();
  },

  getMe: async (token) => {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  },

  getNotes: async (token) => {
    const response = await fetch(`${API_BASE}/notes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  },

  createNote: async (token, title, content) => {
    const response = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, content })
    });
    return await response.json();
  },

  updateNote: async (token, id, title, content) => {
    const response = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, content })
    });
    return await response.json();
  },

  deleteNote: async (token, id) => {
    const response = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  },

  upgradeTenant: async (token, tenantSlug) => {
    const response = await fetch(`${API_BASE}/tenants/${tenantSlug}/upgrade`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }
};

// Login Form Component
const LoginForm = ({ onLogin, loading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const predefinedAccounts = [
    { email: 'admin@acme.test', role: 'Admin', tenant: 'Acme' },
    { email: 'user@acme.test', role: 'Member', tenant: 'Acme' },
    { email: 'admin@globex.test', role: 'Admin', tenant: 'Globex' },
    { email: 'user@globex.test', role: 'Member', tenant: 'Globex' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  const handleQuickLogin = (testEmail) => {
    setEmail(testEmail);
    setPassword('password');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notes SaaS</h1>
          <p className="text-gray-600">Multi-tenant Notes Application</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Login (Test Accounts)</h3>
          <div className="space-y-2">
            {predefinedAccounts.map((account, index) => (
              <button
                key={index}
                onClick={() => handleQuickLogin(account.email)}
                className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg border"
              >
                <div className="font-medium">{account.email}</div>
                <div className="text-gray-500">{account.role} at {account.tenant}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">All test accounts use password: "password"</p>
        </div>
      </div>
    </div>
  );
};

// Note Card Component
const NoteCard = ({ note, onEdit, onDelete, onSave, onCancel, editing, editData, setEditData }) => {
  const isEditing = editing === note.id;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      {isEditing ? (
        <div className="space-y-4">
          <input
            type="text"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Note title"
          />
          <textarea
            value={editData.content}
            onChange={(e) => setEditData({ ...editData, content: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Note content"
          />
          <div className="flex space-x-2">
            <button
              onClick={() => onSave(note.id)}
              className="flex items-center px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </button>
            <button
              onClick={onCancel}
              className="flex items-center px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-semibold text-gray-900">{note.title}</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(note)}
                className="text-blue-600 hover:text-blue-800"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(note.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-gray-700 mb-3">{note.content || 'No content'}</p>
          <div className="text-sm text-gray-500">
            Created: {new Date(note.created_at).toLocaleDateString()}
            {note.author_email && (
              <span className="ml-2">by {note.author_email}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Main Dashboard Component
const Dashboard = ({ user, token, onLogout }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({ title: '', content: '' });
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [error, setError] = useState('');
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const response = await api.getNotes(token);
      if (response.notes) {
        setNotes(response.notes);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNote.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      const response = await api.createNote(token, newNote.title, newNote.content);
      if (response.note) {
        setNotes([response.note, ...notes]);
        setNewNote({ title: '', content: '' });
        setCreating(false);
        setError('');
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to create note');
    }
  };

  const handleEditNote = (note) => {
    setEditing(note.id);
    setEditData({ title: note.title, content: note.content || '' });
  };

  const handleSaveEdit = async (noteId) => {
    if (!editData.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      const response = await api.updateNote(token, noteId, editData.title, editData.content);
      if (response.note) {
        setNotes(notes.map(note => note.id === noteId ? response.note : note));
        setEditing(null);
        setEditData({ title: '', content: '' });
        setError('');
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await api.deleteNote(token, noteId);
      if (response.message) {
        setNotes(notes.filter(note => note.id !== noteId));
        setError('');
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to delete note');
    }
  };

  const handleUpgrade = async () => {
    if (!confirm('Upgrade to Pro plan for unlimited notes?')) return;

    setUpgrading(true);
    try {
      const response = await api.upgradeTenant(token, user.tenant.slug);
      if (response.message) {
        window.location.reload();
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to upgrade subscription');
    } finally {
      setUpgrading(false);
    }
  };

  const canUpgrade = user.role === 'admin' && user.tenant.subscription_plan === 'free';
  const isFreePlan = user.tenant.subscription_plan === 'free';
  const reachedLimit = isFreePlan && notes.length >= 3;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Notes SaaS</h1>
              <div className="ml-6 flex items-center">
                <span className="text-sm text-gray-500">
                  {user.tenant.name} ({user.tenant.subscription_plan.toUpperCase()})
                </span>
                {user.tenant.subscription_plan === 'pro' && (
                  <Crown className="w-4 h-4 ml-2 text-yellow-500" />
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm text-gray-700">{user.email}</span>
                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {user.role}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">My Notes</h2>
            <p className="text-gray-600">
              {isFreePlan ? `${notes.length}/3 notes used` : `${notes.length} notes`}
            </p>
          </div>
          <div className="flex space-x-4">
            {canUpgrade && (
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                {upgrading ? 'Upgrading...' : 'Upgrade to Pro'}
              </button>
            )}
            <button
              onClick={() => setCreating(true)}
              disabled={reachedLimit}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Note
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {reachedLimit && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span>You've reached the 3-note limit for the Free plan.</span>
              {canUpgrade && (
                <button
                  onClick={handleUpgrade}
                  className="ml-4 px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Upgrade to Pro
                </button>
              )}
            </div>
          </div>
        )}

        {creating && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Note</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Note title"
              />
              <textarea
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Note content"
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleCreateNote}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Note
                </button>
                <button
                  onClick={() => {
                    setCreating(false);
                    setNewNote({ title: '', content: '' });
                    setError('');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading notes...</div>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No notes yet</div>
            <button
              onClick={() => setCreating(true)}
              disabled={reachedLimit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Create your first note
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
                onSave={handleSaveEdit}
                onCancel={() => {
                  setEditing(null);
                  setEditData({ title: '', content: '' });
                  setError('');
                }}
                editing={editing}
                editData={editData}
                setEditData={setEditData}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

// Main App Component
export default function NotesApp() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (savedToken) {
      validateToken(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async (token) => {
    try {
      const response = await api.getMe(token);
      if (response.user) {
        setUser(response.user);
        setToken(token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
        }
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
      }
    } catch (err) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.login(email, password);
      if (response.token && response.user) {
        setUser(response.user);
        setToken(response.token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', response.token);
        }
      } else if (response.error) {
        throw new Error(response.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return user ? (
    <Dashboard user={user} token={token} onLogout={handleLogout} />
  ) : (
    <LoginForm onLogin={handleLogin} loading={loading} />
  );
}