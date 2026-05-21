import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

import Fixtures from './pages/Fixtures';
import FixtureDetail from './pages/FixtureDetail';
import Standings from './pages/Standings';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import Players from './pages/Players';
import PlayerDetail from './pages/PlayerDetail';
import Rankings from './pages/Rankings';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import FantasyCreate from './pages/FantasyCreate';
import MyTeam from './pages/MyTeam';
import Predictions from './pages/Predictions';
import MyPredictions from './pages/MyPredictions';
import PredictionLeaderboard from './pages/PredictionLeaderboard';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/fixtures" replace />} />

        {/* Rutas públicas */}
        <Route path="/fixtures" element={<Fixtures />} />
        <Route path="/fixtures/:id" element={<FixtureDetail />} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/teams/:id" element={<TeamDetail />} />
        <Route path="/players" element={<Players />} />
        <Route path="/players/:id" element={<PlayerDetail />} />
        <Route path="/rankings" element={<Rankings />} />

        {/* Auth pages */}
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />

        {/* Rutas de cartola */}
        <Route path="/fantasy/create" element={<FantasyCreate />} />
        <Route path="/my-team" element={<MyTeam />} />

        {/* Rutas de pronósticos */}
        <Route path="/predictions" element={<Predictions />} />
        <Route path="/my-predictions" element={<MyPredictions />} />
        <Route path="/predictions/ranking" element={<PredictionLeaderboard />} />
      </Routes>
    </Layout>
  );
}
