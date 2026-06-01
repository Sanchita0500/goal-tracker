import React from 'react';

export default function DashboardStats({ users, goals, activeUserId }) {
  // Calculate stats for the active user only
  const activeUser = users.find(u => u.id === activeUserId) || users[0];
  const otherUser = users.find(u => u.id !== activeUserId) || users[1];

  const getStats = (user) => {
    if (!user) return { goalCount: 0, completedDays: 0 };
    const userGoals = goals.filter(g => g.ownerId === user.id);
    const totalDays = userGoals.reduce((sum, g) => {
      return sum + Object.values(g.completions || {}).filter(Boolean).length;
    }, 0);
    return { goalCount: userGoals.length, completedDays: totalDays };
  };

  const activeStats = getStats(activeUser);
  const otherStats = getStats(otherUser);

  // Calculate streak for active user only
  const today = new Date();
  let streak = 0;
  const activeGoals = goals.filter(g => g.ownerId === activeUserId);
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const anyDone = activeGoals.some(g => g.completions && g.completions[dateStr]);
    if (anyDone) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return (
    <div className="dashboard" id="dashboard-stats">
      <div className="stat-card stat-card--pink">
        <div className="stat-card__icon">{activeUser?.avatar || '🎯'}</div>
        <div className="stat-card__value">{activeStats.goalCount}</div>
        <div className="stat-card__label">{activeUser?.name || 'My'} Goals</div>
      </div>
      <div className="stat-card stat-card--emerald">
        <div className="stat-card__icon">✅</div>
        <div className="stat-card__value">{activeStats.completedDays}</div>
        <div className="stat-card__label">{activeUser?.name || 'My'} Check-ins</div>
      </div>
      <div className="stat-card stat-card--violet">
        <div className="stat-card__icon">🔥</div>
        <div className="stat-card__value">{streak}</div>
        <div className="stat-card__label">{activeUser?.name || 'My'} Streak</div>
      </div>
      {otherUser && (
        <div className="stat-card stat-card--cyan">
          <div className="stat-card__icon">{otherUser.avatar}</div>
          <div className="stat-card__value">{otherStats.completedDays}</div>
          <div className="stat-card__label">{otherUser.name}'s Check-ins</div>
        </div>
      )}
    </div>
  );
}
