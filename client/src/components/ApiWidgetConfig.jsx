import { useEffect } from 'react';

const WIDGET_SCRIPT = 'https://widgets.api-sports.io/3.1.0/widgets.js';

function loadWidgetScript() {
  if (document.querySelector(`script[src="${WIDGET_SCRIPT}"]`)) return;
  const script = document.createElement('script');
  script.src = WIDGET_SCRIPT;
  script.type = 'module';
  document.head.appendChild(script);
}

function ensureConfigWidget(apiKey) {
  // Verifica si ya existe el widget de configuración
  const existing = document.querySelector('api-sports-widget[data-type="config"]');
  if (existing) return;

  // Crea el widget de configuración
  const configWidget = document.createElement('api-sports-widget');
  configWidget.setAttribute('data-type', 'config');
  configWidget.setAttribute('data-key', apiKey);
  configWidget.setAttribute('data-sport', 'football');
  configWidget.style.display = 'none';

  document.body.appendChild(configWidget);
}

export default function ApiWidgetConfig() {
  const apiKey = import.meta.env.VITE_API_FOOTBALL_KEY;

  useEffect(() => {
    if (!apiKey) return;
    loadWidgetScript();

    // Esperar un poco para que el script se cargue antes de crear el widget
    const timer = setTimeout(() => {
      ensureConfigWidget(apiKey);
    }, 100);

    return () => clearTimeout(timer);
  }, [apiKey]); // Ejecutar cuando apiKey esté disponible

  if (!apiKey) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-yellow-100 border-l-4 border-yellow-400 p-3 rounded shadow-md text-sm text-yellow-800">
        <div className="font-semibold">API Sports key missing</div>
        <div>Configura <strong>VITE_API_FOOTBALL_KEY</strong> en tu .env para habilitar los widgets externos.</div>
      </div>
    );
  }

  return null;
}
