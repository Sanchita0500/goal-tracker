import React, { useState } from 'react';
import { Trash2, Check, Calendar, Repeat, Tag, ChevronDown, ChevronUp, Pencil, Lock } from 'lucide-react';

// Helper: get all dates in a range
function getDatesInRange(start, end) {
  const dates = [];
  const current = new Date(start + 'T00:00:00');
  const last = new Date(end + 'T00:00:00');
  while (current <= last) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// Helper: group dates by ISO week (Mon-Sun)
function groupByWeek(dates) {
  const weeks = [];
  let currentWeek = [];

  dates.forEach((dateStr, idx) => {
    const d = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon...

    // If it's Monday and currentWeek is not empty, push and start new
    if (dayOfWeek === 1 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    currentWeek.push(dateStr);

    // If it's the last date, push whatever we have
    if (idx === dates.length - 1) {
      weeks.push(currentWeek);
    }
  });

  return weeks;
}

// Helper: format date for display
function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.getDate();
}

function getDayName(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
}

function formatDateRange(start, end) {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (s.getMonth() === e.getMonth()) {
    return `${months[s.getMonth()]} ${s.getDate()} – ${e.getDate()}`;
  }
  return `${months[s.getMonth()]} ${s.getDate()} – ${months[e.getMonth()]} ${e.getDate()}`;
}

function getWeekLabel(weekDates, weekIdx) {
  const start = new Date(weekDates[0] + 'T00:00:00');
  const end = new Date(weekDates[weekDates.length - 1] + 'T00:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `Week ${weekIdx + 1} · ${months[start.getMonth()]} ${start.getDate()} – ${end.getDate()}`;
}

// Check if a date is within ±1 day of today
function isWithinEditWindow(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  const diffMs = target.getTime() - today.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= -1 && diffDays <= 1;
}

export default function GoalCard({ goal, onToggle, onDelete, onEdit, readOnly }) {
  const [expanded, setExpanded] = useState(false);
  const allDates = getDatesInRange(goal.startDate, goal.endDate);
  const weeks = groupByWeek(allDates);
  const today = new Date().toISOString().split('T')[0];

  // Calculate overall completion stats for collapsed summary
  const totalCompleted = Object.values(goal.completions || {}).filter(Boolean).length;
  const totalDays = allDates.length;

  // Pad weeks so the first and last week are displayed with proper day alignment
  const padWeek = (weekDates) => {
    if (weekDates.length === 0) return weekDates;
    const firstDay = new Date(weekDates[0] + 'T00:00:00').getDay();
    // We want Mon=0, so map: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
    const mondayIdx = firstDay === 0 ? 6 : firstDay - 1;
    const padded = [];
    for (let i = 0; i < mondayIdx; i++) padded.push(null);
    padded.push(...weekDates);
    while (padded.length < 7) padded.push(null);
    return padded;
  };

  return (
    <div className={`goal-card ${readOnly ? 'goal-card--readonly' : ''}`} id={`goal-${goal.id}`}>
      <div className="goal-card__header">
        <div className="goal-card__info">
          <h3 className="goal-card__title">{goal.title}</h3>
          <div className="goal-card__meta">
            <span className="goal-card__badge goal-card__badge--freq">
              <Repeat size={11} />
              {goal.frequencyPerWeek}x / week
            </span>
            <span className="goal-card__badge goal-card__badge--dates">
              <Calendar size={11} />
              {formatDateRange(goal.startDate, goal.endDate)}
            </span>
            {goal.category && (
              <span className="goal-card__badge goal-card__badge--cat">
                <Tag size={11} />
                {goal.category}
              </span>
            )}
            {!expanded && (
              <span className="goal-card__badge goal-card__badge--freq">
                <Check size={11} />
                {totalCompleted}/{totalDays} days
              </span>
            )}
          </div>
        </div>
        <div className="goal-card__actions">
          {!readOnly && (
            <>
              <button
                className="goal-card__action-btn"
                onClick={() => onEdit(goal)}
                title="Edit goal"
                id={`edit-${goal.id}`}
              >
                <Pencil size={15} />
              </button>
              <button
                className="goal-card__action-btn goal-card__action-btn--danger"
                onClick={() => onDelete(goal.id)}
                title="Delete goal"
                id={`delete-${goal.id}`}
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
          <button
            className="goal-card__collapse-btn"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? 'Collapse' : 'Expand'}
            id={`toggle-${goal.id}`}
          >
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      <div className={`goal-card__body ${expanded ? 'goal-card__body--expanded' : 'goal-card__body--collapsed'}`}>
        {weeks.map((weekDates, wIdx) => {
          const paddedWeek = padWeek(weekDates);
          const completedThisWeek = weekDates.filter(
            d => goal.completions && goal.completions[d]
          ).length;
          const targetMet = completedThisWeek >= goal.frequencyPerWeek;
          const progressPct = Math.min(
            100,
            Math.round((completedThisWeek / goal.frequencyPerWeek) * 100)
          );

          return (
            <div className="week-section" key={wIdx}>
              <div className="week-section__header">
                <span className="week-section__label">
                  {getWeekLabel(weekDates, wIdx)}
                </span>
                <span className={`week-section__progress ${targetMet ? 'week-section__progress--complete' : ''}`}>
                  {completedThisWeek}/{goal.frequencyPerWeek}
                  {targetMet && ' ✓'}
                </span>
              </div>

              <div className="week-progress-bar">
                <div
                  className={`week-progress-bar__fill ${targetMet ? 'week-progress-bar__fill--complete' : ''}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="days-grid">
                {paddedWeek.map((dateStr, dIdx) => {
                  if (!dateStr) {
                    return <div key={`empty-${dIdx}`} className="day-cell day-cell--disabled" />;
                  }

                  const isChecked = goal.completions && goal.completions[dateStr];
                  const isToday = dateStr === today;
                  const canEditDate = isWithinEditWindow(dateStr);
                  // A cell is interactive only if the user owns this goal AND the date is within ±1 day
                  const canInteract = !readOnly && canEditDate;

                  return (
                    <div
                      key={dateStr}
                      className={`day-cell ${isToday ? 'day-cell--today' : ''} ${!canInteract ? 'day-cell--locked' : ''}`}
                      onClick={() => canInteract && onToggle(goal.id, dateStr, !isChecked)}
                      title={
                        readOnly
                          ? 'Switch to this user to edit'
                          : canEditDate
                            ? (isChecked ? 'Uncheck' : 'Check')
                            : 'Can only check-in within ±1 day'
                      }
                      id={`day-${goal.id}-${dateStr}`}
                    >
                      <span className="day-cell__name">{getDayName(dateStr)}</span>
                      <div className={`day-checkbox ${isChecked ? 'day-checkbox--checked' : ''} ${!canInteract && !isChecked ? 'day-checkbox--locked' : ''}`}>
                        {isChecked && <Check size={16} strokeWidth={3} />}
                        {!canInteract && !isChecked && <Lock size={10} />}
                      </div>
                      <span className="day-cell__date">{formatShortDate(dateStr)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
