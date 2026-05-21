import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { publicFetch } from '../lib/api';

const STAGE_LABELS = {
  'Group Stage': 'Fase de Grupos',
  'Round of 16': 'Octavos de Final',
  'Quarter-finals': 'Cuartos de Final',
  'Semi-finals': 'Semifinal',
  'Final': 'Final',
  'Third Place': 'Tercer Puesto',
};

function stageLabel(stage) {
  return STAGE_LABELS[stage] || stage || null;
}

export default function Fixtures() {
  const { data, isLoading } = useQuery({
    queryKey: ['fixtures'],
    queryFn: () => publicFetch('/api/fixtures?per_page=64&sort=date_asc'),
  });

  const fixtures = data?.data || [];

  let currentStage = null;
  let currentRound = null;


  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Partidos del Mundial 2022</h1>
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {fixtures.map((f) => {
            const label = stageLabel(f.stage);
            const changed = label !== currentStage || f.round !== currentRound;
            currentStage = label;
            currentRound = f.round;

            const date = new Date(f.date);

            return (
              <div key={f.id}>
                {changed && (label || f.round) && (
                  <div className="text-sm font-bold text-gray-600 pt-4 pb-1 px-1">
                    {label || f.round}
                  </div>
                )}
                <Link to={`/fixtures/${f.id}`} className="bg-white rounded-lg shadow p-4 flex items-center justify-between hover:shadow-md transition group">
                  <div className="flex items-center gap-4 w-2/5 justify-end">
                    <span className="font-semibold text-right text-sm">{f.home_team?.name}</span>
                    <img src={f.home_team?.logo} alt="" className="w-8 h-8" />
                  </div>
                  <div className="text-center w-1/5">
                    {f.status === 'match finished' ? (
                      <span className="text-xl font-bold">{f.home_score} - {f.away_score}</span>
                    ) : f.status === 'live' ? (
                      <span className="text-lg font-bold text-green-600">{f.home_score} - {f.away_score} <span className="text-xs font-normal animate-pulse">EN VIVO</span></span>
                    ) : (
                      <div className="text-sm text-gray-500">
                        <div>{date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-xs text-gray-400">{date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 w-2/5">
                    <img src={f.away_team?.logo} alt="" className="w-8 h-8" />
                    <span className="font-semibold text-sm">{f.away_team?.name}</span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


