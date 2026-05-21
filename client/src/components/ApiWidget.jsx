import { useEffect, useRef } from 'react';

let eventDispatched = false;

export default function ApiWidget({ type, id, attrs = {} }) {
  const containerRef = useRef(null);
  const lastIdRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Si el ID cambió (ej: navegando entre equipos), limpiar el contenedor
    if (lastIdRef.current !== id) {
      container.innerHTML = '';
      lastIdRef.current = id;
    }

    // No agregar si ya existe un widget aquí
    if (container.querySelector('api-sports-widget')) {
      return;
    }

    const el = document.createElement('api-sports-widget');
    el.setAttribute('data-type', type);

    const idAttr = type === 'team' ? 'data-team-id' : type === 'player' ? 'data-player-id' : 'data-id';
    el.setAttribute(idAttr, String(id));

    for (const [key, val] of Object.entries(attrs)) {
      if (val !== undefined && val !== null && val !== false) {
        el.setAttribute(`data-${key}`, String(val));
      }
    }

    container.appendChild(el);

    // Disparar el evento UNA SOLA VEZ globalmente
    if (!eventDispatched) {
      eventDispatched = true;
      setTimeout(() => {
        window.document.dispatchEvent(new Event('DOMContentLoaded', {
          bubbles: true,
          cancelable: true,
        }));
      }, 50);
    }
  }, [type, id, attrs]);

  return <div ref={containerRef} />;
}
