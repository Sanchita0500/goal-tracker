import React from 'react';

export default function DashboardStats({ users, goals, activeUserId }) {
  // Calculate stats for the active user only
  const activeUser = users.find(u => u.id === activeUserId) || users[0];
  const otherUser = users.find(u => u.id !== activeUserId) || users[1];

  const getStats = (user) => {
    if (!user) return { goalCount: 0, completedToday: 0 };
    const userGoals = goals.filter(g => g.ownerId === user.id);
    
    // Get today's local date string (YYYY-MM-DD)
    const d = new Date();
    const todayStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    
    const completedToday = userGoals.filter(g => g.completions && g.completions[todayStr]).length;
    return { goalCount: userGoals.length, completedToday };
  };

  const activeStats = getStats(activeUser);
  const otherStats = getStats(otherUser);

  // Calculate streak for active user only
  const d = new Date();
  const todayStrForStreak = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const activeGoals = goals.filter(g => g.ownerId === activeUserId);

  // Simplified streak logic:
  let realStreak = 0;
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(d);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = new Date(checkDate.getTime() - checkDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const anyDone = activeGoals.some(g => g.completions && g.completions[dateStr]);
    if (anyDone) {
      realStreak++;
    } else if (i === 0) {
      // It's okay if today is not done yet
      continue;
    } else {
      // Missed a past day, break streak
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
        <div className="stat-card__value" style={{ fontSize: '1.4rem' }}>{activeStats.completedToday} / {activeStats.goalCount}</div>
        <div className="stat-card__label">Today's Check-ins</div>
      </div>
      <div className="stat-card stat-card--violet">
        <div className="stat-card__icon">🔥</div>
        <div className="stat-card__value">{realStreak}</div>
        <div className="stat-card__label">{activeUser?.name || 'My'} Streak</div>
      </div>
      {otherUser && (
        <div className="stat-card stat-card--cyan">
          <div className="stat-card__icon">{otherUser.avatar}</div>
          <div className="stat-card__value" style={{ fontSize: '1.4rem' }}>{otherStats.completedToday} / {otherStats.goalCount}</div>
          <div className="stat-card__label">{otherUser.name}'s Today</div>
        </div>
      )}
    </div>
  );
}
