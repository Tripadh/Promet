import React from 'react';

const DropdownMenu = ({ items, onSelect, children }) => {
  return (
    <div className="prompt-menu" role="menu" aria-label="Prompt actions">
      {children}
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="prompt-menu-item"
          onClick={() => onSelect(item.id)}
          role="menuitem"
        >
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default DropdownMenu;