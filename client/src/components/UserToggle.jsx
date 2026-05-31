import React from 'react';

export default function UserToggle({ users, activeUserId, onSwitch }) {
  return (
    <div className="user-toggle" id="user-toggle">
      <span className="user-toggle__label">Editing as:</span>
      {users.map(user => {
        const isActive = user.id === activeUserId;
        const colorKey = user.id === 'user-1' ? 'pink' : 'cyan';
        return (
          <button
            key={user.id}
            id={`toggle-${user.id}`}
            className={`user-toggle__btn ${isActive ? 'user-toggle__btn--active' : ''}`}
            data-color={colorKey}
            onClick={() => onSwitch(user.id)}
          >
            <span className="user-toggle__avatar">{user.avatar}</span>
            {user.name}
          </button>
        );
      })}
    </div>
  );
}
