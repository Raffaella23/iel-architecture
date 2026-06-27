import React from 'react';

export default function MaterialSelector({ materials, active, onChange }) {
  return (
    <div className="material-bar">
      <span className="material-label">Finitura pavimento</span>
      <div className="material-options">
        {materials.map((mat) => (
          <button
            key={mat.id}
            className={`material-btn ${active.id === mat.id ? 'active' : ''}`}
            onClick={() => onChange(mat)}
            style={{ '--swatch': mat.color }}
          >
            <span className="swatch" />
            <span className="mat-name">{mat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
