import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import './EditaMode.css';

/**
 * EditaMode Component
 * Allows the client to draw and annotate on the scene image
 * Requires explicit activation by the user
 */
export default function EditaMode({ sceneId, imageElement }) {
  const { addAnnotation, getAnnotationsByScene } = useProject();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [isActive, setIsActive] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState('pen'); // 'pen' | 'rect' | 'circle'
  const [color, setColor] = useState('#b8874f'); // bronze
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [annotations, setAnnotations] = useState([]);

  const COLORS = [
    { label: 'Bronze', value: '#b8874f' },
    { label: 'Sage', value: '#8faa7a' },
    { label: 'Terracotta', value: '#b5573f' },
    { label: 'Gold', value: '#c9a15a' },
  ];

  // Load existing annotations for this scene
  useEffect(() => {
    const sceneAnnotations = getAnnotationsByScene(sceneId);
    setAnnotations(sceneAnnotations);
  }, [sceneId, getAnnotationsByScene]);

  // Setup canvas when component mounts or image loads
  useEffect(() => {
    if (!isActive || !containerRef.current || !imageElement) return;

    const canvas = canvasRef.current;
    const rect = imageElement.getBoundingClientRect();

    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    redrawAnnotations();
  }, [isActive, imageElement]);

  const redrawAnnotations = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    annotations.forEach(ann => {
      if (!ann.geometry) return;

      drawGeometry(ctx, ann.geometry, ann.emoji);
    });
  };

  const drawGeometry = (ctx, geometry, emoji = '') => {
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.fillStyle = `rgba(184, 135, 79, 0.1)`;

    if (geometry.type === 'freehand' && geometry.points) {
      if (geometry.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(geometry.points[0].x, geometry.points[0].y);
      geometry.points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    } else if (geometry.type === 'rect' && geometry.data) {
      const { x, y, w, h } = geometry.data;
      ctx.strokeRect(x, y, w, h);
      ctx.fillRect(x, y, w, h);
    } else if (geometry.type === 'circle' && geometry.data) {
      const { x, y, r } = geometry.data;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
    }

    // Draw emoji label
    if (emoji) {
      ctx.font = '16px Arial';
      ctx.fillStyle = '#0d0c0a';
      const x = geometry.data?.x || geometry.points?.[0]?.x || 10;
      const y = geometry.data?.y || geometry.points?.[0]?.y || 30;
      ctx.fillText(emoji, x + 5, y - 5);
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);

    if (drawMode === 'pen') {
      // Start freehand drawing
      const points = [{ x, y }];
      // Store temporarily
      e.target.dataset.points = JSON.stringify(points);
    } else if (drawMode === 'rect') {
      e.target.dataset.startX = x;
      e.target.dataset.startY = y;
    } else if (drawMode === 'circle') {
      e.target.dataset.centerX = x;
      e.target.dataset.centerY = y;
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!isActive || !isDrawing || drawMode !== 'pen') return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    redrawAnnotations();

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    const lastPoint = JSON.parse(e.target.dataset.points || '[]').pop();
    if (lastPoint) {
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // Update points
    let points = JSON.parse(e.target.dataset.points || '[]');
    points.push({ x, y });
    e.target.dataset.points = JSON.stringify(points);
  };

  const handleCanvasMouseUp = (e) => {
    if (!isActive || !isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    let geometry = null;

    if (drawMode === 'pen') {
      const points = JSON.parse(e.target.dataset.points || '[]');
      if (points.length > 2) {
        geometry = { type: 'freehand', points };
      }
      e.target.dataset.points = '';
    } else if (drawMode === 'rect') {
      const startX = parseFloat(e.target.dataset.startX);
      const startY = parseFloat(e.target.dataset.startY);
      const w = Math.abs(endX - startX);
      const h = Math.abs(endY - startY);
      if (w > 5 && h > 5) {
        geometry = {
          type: 'rect',
          data: {
            x: Math.min(startX, endX),
            y: Math.min(startY, endY),
            w,
            h,
          },
        };
      }
    } else if (drawMode === 'circle') {
      const centerX = parseFloat(e.target.dataset.centerX);
      const centerY = parseFloat(e.target.dataset.centerY);
      const r = Math.sqrt(Math.pow(endX - centerX, 2) + Math.pow(endY - centerY, 2));
      if (r > 5) {
        geometry = {
          type: 'circle',
          data: { x: centerX, y: centerY, r },
        };
      }
    }

    if (geometry) {
      const viewportPosition = {
        x: (endX / canvas.width) || 0.5,
        y: (endY / canvas.height) || 0.5,
      };
      addAnnotation(sceneId, {
        geometry,
        viewportPosition,
        room: '',
        emoji: '??',
      });
      redrawAnnotations();
    }

    setIsDrawing(false);
  };

  // Touch event handlers (mobile support)
  const handleTouchStart = (e) => {
    if (!isActive) return;
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    canvasRef.current?.dispatchEvent(mouseEvent);
  };

  const handleTouchMove = (e) => {
    if (!isActive || !isDrawing) return;
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    canvasRef.current?.dispatchEvent(mouseEvent);
  };

  const handleTouchEnd = (e) => {
    if (!isActive) return;
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    canvasRef.current?.dispatchEvent(mouseEvent);
  };

  const clearDrawings = () => {
    if (window.confirm('Cancellare tutti i segni?')) {
      setAnnotations([]);
      redrawAnnotations();
    }
  };

  if (!isActive) {
    return (
      <button
        className="edita-activate-btn"
        onClick={() => setIsActive(true)}
        title="Attiva modalità di disegno e annotazione"
      >
        ?? Edita
      </button>
    );
  }

  return (
    <div className="edita-mode" ref={containerRef}>
      <div className="edita-toolbar">
        <div className="edita-tools">
          <button
            className={`tool-btn ${drawMode === 'pen' ? 'active' : ''}`}
            onClick={() => setDrawMode('pen')}
            title="Disegna a mano libera"
          >
            ??
          </button>
          <button
            className={`tool-btn ${drawMode === 'rect' ? 'active' : ''}`}
            onClick={() => setDrawMode('rect')}
            title="Rettangolo"
          >
            ?
          </button>
          <button
            className={`tool-btn ${drawMode === 'circle' ? 'active' : ''}`}
            onClick={() => setDrawMode('circle')}
            title="Cerchio"
          >
            ?
          </button>
        </div>

        <div className="edita-colors">
          {COLORS.map(c => (
            <button
              key={c.value}
              className={`color-btn ${color === c.value ? 'active' : ''}`}
              style={{ backgroundColor: c.value }}
              onClick={() => setColor(c.value)}
              title={c.label}
            />
          ))}
        </div>

        <div className="edita-stroke">
          <input
            type="range"
            min="1"
            max="8"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            className="stroke-slider"
          />
          <span className="stroke-label">{strokeWidth}px</span>
        </div>

        <div className="edita-actions">
          <button className="action-btn clear-btn" onClick={clearDrawings}>
            ??? Cancella
          </button>
          <button
            className="action-btn close-btn"
            onClick={() => setIsActive(false)}
          >
            ?
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="edita-canvas"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          cursor: 'crosshair',
          touchAction: 'none',
        }}
      />
    </div>
  );
}
