import { Protect } from '@clerk/clerk-react';

export default function ProtectedRoute({ children }) {
  return (
    <Protect
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Acceso restringido</h2>
            <p className="text-gray-500">Inicia sesión para acceder a esta sección.</p>
          </div>
        </div>
      }
    >
      {children}
    </Protect>
  );
}
