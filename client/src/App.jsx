import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Target, Pencil } from 'lucide-react';
import UserToggle from './components/UserToggle.jsx';
import DashboardStats from './components/DashboardStats.jsx';
import GoalCard from './components/GoalCard.jsx';
import AddGoalModal from './components/AddGoalModal.jsx';

const API_BASE = '/api';

export default function App() {
  const [users, setUsers] = useState([]);
  const [goals, setGoals] = useState([]);
  const [activeUserId, setActiveUserId] = useState('user-1');
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingName, setEditingName] = useState('');

  // --- Fetch all data ---
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/data`);
      if (!res.ok) throw new Error('Failed to load data');
      const data = await res.json();
      setUsers(data.users || []);
      setGoals(data.goals || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Poll every 10 seconds for real-time updates when both users are editing
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // --- Add a goal ---
  const handleAddGoal = async (goalData) => {
    try {
      const res = await fetch(`${API_BASE}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData),
      });
      if (!res.ok) throw new Error('Failed to add goal');
      const newGoal = await res.json();
      setGoals(prev => [...prev, newGoal]);
      setShowModal(false);
      setEditingGoal(null);
    } catch (err) {
      alert('Error adding goal: ' + err.message);
    }
  };

  // --- Delete a goal ---
  const handleDeleteGoal = async (goalId) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
      const res = await fetch(`${API_BASE}/goals/${goalId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete goal');
      setGoals(prev => prev.filter(g => g.id !== goalId));
    } catch (err) {
      alert('Error deleting goal: ' + err.message);
    }
  };

  // --- Toggle a day ---
  const handleToggle = async (goalId, date, completed) => {
    // Optimistic update
    setGoals(prev =>
      prev.map(g => {
        if (g.id !== goalId) return g;
        const newCompletions = { ...g.completions };
        if (completed) {
          newCompletions[date] = true;
        } else {
          delete newCompletions[date];
        }
        return { ...g, completions: newCompletions };
      })
    );

    try {
      const res = await fetch(`${API_BASE}/goals/${goalId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, completed }),
      });
      if (!res.ok) throw new Error('Failed to toggle');
    } catch (err) {
      // Revert on failure
      fetchData();
    }
  };

  // --- Edit a goal (open modal with pre-filled data) ---
  const handleOpenEdit = (goal) => {
    setEditingGoal(goal);
    setShowModal(true);
  };

  // --- Update an existing goal ---
  const handleUpdateGoal = async (goalId, goalData) => {
    // Optimistic update
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, ...goalData } : g));
    setShowModal(false);
    setEditingGoal(null);
    try {
      const res = await fetch(`${API_BASE}/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData),
      });
      if (!res.ok) throw new Error('Failed to update goal');
    } catch (err) {
      fetchData();
      alert('Error updating goal: ' + err.message);
    }
  };

  // --- Rename a user ---
  const startEditing = (user) => {
    setEditingUserId(user.id);
    setEditingName(user.name);
  };

  const handleRenameUser = async (userId) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setEditingUserId(null);
      return;
    }
    // Optimistic update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, name: trimmed } : u));
    setEditingUserId(null);
    try {
      const res = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error('Failed to rename');
    } catch (err) {
      fetchData();
    }
  };

  // --- Render ---
  if (loading) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16, animation: 'pulse 1.5s infinite' }}>🎯</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Loading your goals...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
          <div style={{ color: '#ef4444', fontSize: '1.1rem', marginBottom: 8 }}>Connection Error</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>{error}</div>
          <button className="btn-add-goal" onClick={fetchData}>Retry</button>
        </div>
      </div>
    );
  }

  // Group goals by user
  const user1 = users.find(u => u.id === 'user-1') || { id: 'user-1', name: 'User 1', avatar: '🌸', color: '#ec4899' };
  const user2 = users.find(u => u.id === 'user-2') || { id: 'user-2', name: 'User 2', avatar: '⚡', color: '#06b6d4' };
  const user1Goals = goals.filter(g => g.ownerId === 'user-1');
  const user2Goals = goals.filter(g => g.ownerId === 'user-2');

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-header__logo">
          <span className="app-header__icon">🎯</span>
          <h1 className="app-header__title">Goal Tracker</h1>
        </div>
        <p className="app-header__subtitle">Stay on track, together.</p>

        <UserToggle
          users={users}
          activeUserId={activeUserId}
          onSwitch={setActiveUserId}
        />
      </header>

      {/* Dashboard Stats */}
      <DashboardStats users={users} goals={goals} />

      {/* Goals Section */}
      <section className="goals-section">
        <div className="goals-section__header">
          <h2 className="goals-section__title">
            <Target size={22} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
            Goals
            <span className="goals-section__count">({goals.length})</span>
          </h2>
          <button
            className="btn-add-goal"
            onClick={() => { setEditingGoal(null); setShowModal(true); }}
            id="add-goal-btn"
          >
            <Plus size={18} />
            Add Goal
          </button>
        </div>

        <div className="users-grid">
            {/* User 1 Panel */}
            <div className="user-panel user-panel--pink">
              <div className="user-panel__header">
                <div className="user-panel__avatar user-panel__avatar--pink">
                  {user1.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  {editingUserId === user1.id ? (
                    <input
                      className="name-edit-input"
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onBlur={() => handleRenameUser(user1.id)}
                      onKeyDown={e => e.key === 'Enter' && handleRenameUser(user1.id)}
                      autoFocus
                    />
                  ) : (
                    <div className="user-panel__name user-panel__name--editable" onClick={() => startEditing(user1)} title="Click to rename">
                      {user1.name}
                      <span className="name-edit-icon"><Pencil size={13} /></span>
                    </div>
                  )}
                  <div className="user-panel__goal-count">{user1Goals.length} goal{user1Goals.length !== 1 ? 's' : ''}</div>
                </div>
              </div>
              {user1Goals.length === 0 ? (
                <div className="user-panel__empty">
                  <div className="user-panel__empty-icon">🌸</div>
                  <p>No goals yet. Add one!</p>
                </div>
              ) : (
                user1Goals.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onToggle={handleToggle}
                    onDelete={handleDeleteGoal}
                    onEdit={handleOpenEdit}
                  />
                ))
              )}
            </div>

            {/* User 2 Panel */}
            <div className="user-panel user-panel--cyan">
              <div className="user-panel__header">
                <div className="user-panel__avatar user-panel__avatar--cyan">
                  {user2.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  {editingUserId === user2.id ? (
                    <input
                      className="name-edit-input"
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onBlur={() => handleRenameUser(user2.id)}
                      onKeyDown={e => e.key === 'Enter' && handleRenameUser(user2.id)}
                      autoFocus
                    />
                  ) : (
                    <div className="user-panel__name user-panel__name--editable" onClick={() => startEditing(user2)} title="Click to rename">
                      {user2.name}
                      <span className="name-edit-icon"><Pencil size={13} /></span>
                    </div>
                  )}
                  <div className="user-panel__goal-count">{user2Goals.length} goal{user2Goals.length !== 1 ? 's' : ''}</div>
                </div>
              </div>
              {user2Goals.length === 0 ? (
                <div className="user-panel__empty">
                  <div className="user-panel__empty-icon">⚡</div>
                  <p>No goals yet. Add one!</p>
                </div>
              ) : (
                user2Goals.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onToggle={handleToggle}
                    onDelete={handleDeleteGoal}
                    onEdit={handleOpenEdit}
                  />
                ))
              )}
            </div>
          </div>
      </section>

      {/* Add Goal Modal */}
      {showModal && (
        <AddGoalModal
          users={users}
          onClose={() => { setShowModal(false); setEditingGoal(null); }}
          onAdd={handleAddGoal}
          editGoal={editingGoal}
          onUpdate={handleUpdateGoal}
        />
      )}
    </div>
  );
}
