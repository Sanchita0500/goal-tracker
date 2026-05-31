import React, { useState } from 'react';
import { X, Plus, Sparkles, Save } from 'lucide-react';

const CATEGORIES = ['Fitness', 'Health', 'Learning', 'Productivity', 'Wellness', 'Creative', 'Social', 'Other'];

export default function AddGoalModal({ users, onClose, onAdd, editGoal, onUpdate }) {
  const isEditMode = !!editGoal;

  const [ownerId, setOwnerId] = useState(isEditMode ? editGoal.ownerId : (users[0]?.id || ''));
  const [title, setTitle] = useState(isEditMode ? editGoal.title : '');
  const [startDate, setStartDate] = useState(isEditMode ? editGoal.startDate : '');
  const [endDate, setEndDate] = useState(isEditMode ? editGoal.endDate : '');
  const [frequencyPerWeek, setFrequencyPerWeek] = useState(isEditMode ? editGoal.frequencyPerWeek : 3);
  const [category, setCategory] = useState(isEditMode ? editGoal.category : 'Fitness');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) return;

    const data = {
      ownerId,
      title: title.trim(),
      startDate,
      endDate,
      frequencyPerWeek: Number(frequencyPerWeek),
      category,
    };

    if (isEditMode) {
      onUpdate(editGoal.id, data);
    } else {
      onAdd(data);
    }
  };

  // Generate quick date presets relative to current date
  const generatePresets = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed

    // Find the Monday of the current week
    const currentDay = now.getDay(); // 0=Sun
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() + mondayOffset);

    const presets = [];

    // Generate "This Week", "Next Week", "Next 2 Weeks", "Next 3 Weeks", "This Month"
    const addWeeks = (label, startMonday, numWeeks) => {
      const start = new Date(startMonday);
      const end = new Date(startMonday);
      end.setDate(end.getDate() + numWeeks * 7 - 1);
      presets.push({
        label,
        start: fmt(start),
        end: fmt(end),
      });
    };

    const fmt = (d) => d.toISOString().split('T')[0];

    addWeeks('This Week', currentMonday, 1);
    const nextMonday = new Date(currentMonday);
    nextMonday.setDate(nextMonday.getDate() + 7);
    addWeeks('Next Week', nextMonday, 1);
    addWeeks('Next 2 Weeks', currentMonday, 2);
    addWeeks('Next 3 Weeks', currentMonday, 3);
    addWeeks('Next 4 Weeks', currentMonday, 4);

    // This month
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    presets.push({ label: 'This Month', start: fmt(monthStart), end: fmt(monthEnd) });

    // Next month
    const nextMonthStart = new Date(year, month + 1, 1);
    const nextMonthEnd = new Date(year, month + 2, 0);
    presets.push({ label: 'Next Month', start: fmt(nextMonthStart), end: fmt(nextMonthEnd) });

    return presets;
  };

  const presets = generatePresets();

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" id="add-goal-modal">
        <div className="modal__header">
          <h2 className="modal__title">
            {isEditMode ? (
              <><Sparkles size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Edit Goal</>
            ) : (
              <><Sparkles size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />New Goal</>
            )}
          </h2>
          <button className="modal__close" onClick={onClose} id="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Owner */}
          <div className="form-group">
            <label className="form-group__label">Who is this goal for?</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {users.map(user => (
                <button
                  key={user.id}
                  type="button"
                  className={`user-toggle__btn ${ownerId === user.id ? 'user-toggle__btn--active' : ''}`}
                  data-color={user.id === 'user-1' ? 'pink' : 'cyan'}
                  onClick={() => setOwnerId(user.id)}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <span className="user-toggle__avatar">{user.avatar}</span>
                  {user.name}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="form-group">
            <label className="form-group__label" htmlFor="goal-title">Goal Title</label>
            <input
              id="goal-title"
              className="form-group__input"
              type="text"
              placeholder="e.g. Exercise 5 times a week"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Quick Date Presets */}
          <div className="form-group">
            <label className="form-group__label">Quick Duration</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {presets.map(p => (
                <button
                  key={p.label}
                  type="button"
                  className="goal-card__badge goal-card__badge--dates"
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    opacity: startDate === p.start && endDate === p.end ? 1 : 0.6,
                    transform: startDate === p.start && endDate === p.end ? 'scale(1.05)' : 'scale(1)',
                  }}
                  onClick={() => { setStartDate(p.start); setEndDate(p.end); }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-group__label" htmlFor="start-date">Start Date</label>
              <input
                id="start-date"
                className="form-group__input"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-group__label" htmlFor="end-date">End Date</label>
              <input
                id="end-date"
                className="form-group__input"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Frequency & Category */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-group__label" htmlFor="frequency">Times per Week</label>
              <select
                id="frequency"
                className="form-group__select"
                value={frequencyPerWeek}
                onChange={e => setFrequencyPerWeek(e.target.value)}
              >
                {[1, 2, 3, 4, 5, 6, 7].map(n => (
                  <option key={n} value={n}>{n}x per week</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-group__label" htmlFor="category">Category</label>
              <select
                id="category"
                className="form-group__select"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn-submit"
            id="submit-goal-btn"
            disabled={!title.trim() || !startDate || !endDate}
          >
            {isEditMode ? <><Save size={18} /> Save Changes</> : <><Plus size={18} /> Add Goal</>}
          </button>
        </form>
      </div>
    </div>
  );
}
