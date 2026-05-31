import React from 'react';

export default function DashboardStats({ users, goals }) {
  // Calculate stats per user
  const userStats = users.map(user => {
    const userGoals = goals.filter(g => g.ownerId === user.id);
    const totalDays = userGoals.reduce((sum, g) => {
      return sum + Object.values(g.completions || {}).filter(Boolean).length;
    }, 0);
    return { user, goalCount: userGoals.length, completedDays: totalDays };
  });

  const totalGoals = goals.length;
  const totalCompletions = goals.reduce((sum, g) => {
    return sum + Object.values(g.completions || {}).filter(Boolean).length;
  }, 0);

  // Calculate current streak (consecutive days with at least one completion, ending today)
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const anyDone = goals.some(g => g.completions && g.completions[dateStr]);
    if (anyDone) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return (
    <div className="dashboard" id="dashboard-stats">
      <div className="stat-card stat-card--pink">
        <div className="stat-card__icon">🎯</div>
        <div className="stat-card__value">{totalGoals}</div>
        <div className="stat-card__label">Active Goals</div>
      </div>
      <div className="stat-card stat-card--emerald">
        <div className="stat-card__icon">✅</div>
        <div className="stat-card__value">{totalCompletions}</div>
        <div className="stat-card__label">Days Completed</div>
      </div>
      <div className="stat-card stat-card--violet">
        <div className="stat-card__icon">🔥</div>
        <div className="stat-card__value">{streak}</div>
        <div className="stat-card__label">Day Streak</div>
      </div>
      {userStats.map(({ user, completedDays }) => {
        const colorKey = user.id === 'user-1' ? 'cyan' : 'pink';
        return (
          <div key={user.id} className={`stat-card stat-card--${colorKey}`}>
            <div className="stat-card__icon">{user.avatar}</div>
            <div className="stat-card__value">{completedDays}</div>
            <div className="stat-card__label">{user.name}'s Check-ins</div>
          </div>
        );
      })}
    </div>
  );
}
