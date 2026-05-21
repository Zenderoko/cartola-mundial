import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { Link, useLocation } from 'react-router-dom';
import ApiWidgetConfig from './ApiWidgetConfig';

const NAV_ITEMS = [
  { path: '/fixtures', label: 'Partidos' },
  { path: '/predictions', label: 'Pronósticos' },
  { path: '/standings', label: 'Posiciones' },
  { path: '/teams', label: 'Equipos' },
  { path: '/players', label: 'Jugadores' },
  { path: '/rankings', label: 'Ranking' },
];

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <ApiWidgetConfig />
      <nav className="bg-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="font-bold text-lg tracking-tight">
              ⚽ Cartola Mundialera
            </Link>
            <div className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    location.pathname.startsWith(item.path)
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="ml-4 pl-4 border-l border-gray-600">
                <SignedIn>
                  <div className="flex items-center gap-3">
                    <Link to="/my-predictions" className="text-sm text-gray-300 hover:text-white">Mis Pronósticos</Link>
                    <Link to="/predictions/ranking" className="text-sm text-gray-300 hover:text-white">Ranking</Link>
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition">
                      Iniciar sesión
                    </button>
                  </SignInButton>
                </SignedOut>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
      <footer className="bg-gray-100 border-t py-4 text-center text-sm text-gray-500">
        Cartola Mundialera — Mundial FIFA 2022
      </footer>
    </div>
  );
}
