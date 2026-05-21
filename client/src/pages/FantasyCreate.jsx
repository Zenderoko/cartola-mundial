import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useApi, publicFetch } from '../lib/api';
import { FORMATIONS, POSITION_SLOTS, POSITIONS } from '../lib/constants';

const BUDGET = 100;
const POS_ORDER = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'];

const FORMATION_SLOTS = {
  '4-3-3':  ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'AT', 'AT', 'AT'],
  '4-4-2':  ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'AT', 'AT'],
  '3-4-3':  ['GK', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'AT', 'AT', 'AT'],
  '4-5-1':  ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'AT'],
  '3-5-2':  ['GK', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'AT', 'AT'],
  '5-3-2':  ['GK', 'DF', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'AT', 'AT'],
  '4-2-3-1': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'AT', 'AT', 'AT'],
};

const POS_FROM_CODE = { GK: 'Goalkeeper', DF: 'Defender', MF: 'Midfielder', AT: 'Attacker' };

export default function FantasyCreate() {
  const navigate = useNavigate();
  const { fetchApi } = useApi();
  const [teamName, setTeamName] = useState('');
  const [formation, setFormation] = useState('4-3-3');
  const [picks, setPicks] = useState([]);
  const [activePos, setActivePos] = useState('Goalkeeper');
  const [errorMsg, setErrorMsg] = useState(null);

  const { data: playersData } = useQuery({
    queryKey: ['players-all'],
    queryFn: () => publicFetch('/api/players?per_page=200&sort=name_asc'),
  });

  const { data: pricesData } = useQuery({
    queryKey: ['player-prices'],
    queryFn: () => publicFetch('/api/fantasy/prices'),
  });

  const playerPrices = useMemo(() => {
    if (!pricesData?.data) return {};
    const map = {};
    pricesData.data.forEach(p => { map[p.player_id] = p.price; });
    return map;
  }, [pricesData]);

  const slots = FORMATION_SLOTS[formation] || FORMATION_SLOTS['4-3-3'];

  const requiredCounts = useMemo(() => {
    const c = { Goalkeeper: 0, Defender: 0, Midfielder: 0, Attacker: 0 };
    slots.forEach(s => { c[POS_FROM_CODE[s]]++; });
    return c;
  }, [slots]);

  const selectedIds = useMemo(() => new Set(picks.map(p => p.player.id)), [picks]);

  const budgetSpent = useMemo(() =>
    picks.reduce((sum, pick) => sum + (playerPrices[pick.player.id] || 5.0), 0),
  [picks, playerPrices]);

  const budgetRemaining = Math.round((BUDGET - budgetSpent) * 10) / 10;

  const selectedByPos = useMemo(() => {
    const byPos = { Goalkeeper: [], Defender: [], Midfielder: [], Attacker: [] };
    picks.forEach(pick => { if (byPos[pick.player.position]) byPos[pick.player.position].push(pick); });
    return byPos;
  }, [picks]);

  const availableByPos = useMemo(() => {
    if (!playersData?.data) return { Goalkeeper: [], Defender: [], Midfielder: [], Attacker: [] };
    const byPos = { Goalkeeper: [], Defender: [], Midfielder: [], Attacker: [] };
    playersData.data.forEach(p => {
      if (!selectedIds.has(p.id) && byPos[p.position]) byPos[p.position].push(p);
    });
    return byPos;
  }, [playersData, selectedIds]);

  const togglePick = useCallback((player) => {
    setPicks(prev => {
      const existing = prev.find(p => p.player.id === player.id);
      if (existing) return prev.filter(p => p.player.id !== player.id);

      const pos = player.position;
      const currentCount = prev.filter(p => p.player.position === pos).length;
      if (currentCount >= (requiredCounts[pos] || 0)) return prev;
      if (prev.length >= 11) return prev;

      return [...prev, { player, is_captain: false, is_vice_captain: false }];
    });
    setErrorMsg(null);
  }, [requiredCounts]);

  const setCaptain = useCallback((playerId) => {
    setPicks(prev => prev.map(p => ({
      ...p,
      is_captain: p.player.id === playerId,
      is_vice_captain: p.is_vice_captain && p.player.id === playerId ? false : p.is_vice_captain,
    })));
  }, []);

  const setViceCaptain = useCallback((playerId) => {
    setPicks(prev => {
      const target = prev.find(p => p.player.id === playerId);
      if (!target) return prev;
      const isNowVice = !target.is_vice_captain;
      return prev.map(p => ({
        ...p,
        is_vice_captain: p.player.id === playerId ? isNowVice : isNowVice ? false : p.is_vice_captain,
        is_captain: p.is_captain && p.player.id === playerId ? false : p.is_captain,
      }));
    });
  }, []);

  const buildPicksPayload = useCallback(() => {
    const slotIndices = {};
    slots.forEach((code, i) => {
      if (!slotIndices[code]) slotIndices[code] = [];
      slotIndices[code].push(i + 1);
    });

    const codeMap = { Goalkeeper: 'GK', Defender: 'DF', Midfielder: 'MF', Attacker: 'AT' };
    const counters = { GK: 0, DF: 0, MF: 0, AT: 0 };

    return picks.map(pick => {
      const code = codeMap[pick.player.position];
      const idx = counters[code];
      counters[code]++;
      return {
        player_id: pick.player.id,
        position_slot: slotIndices[code][idx],
        is_captain: pick.is_captain,
        is_vice_captain: pick.is_vice_captain,
      };
    });
  }, [picks, slots]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg(null);
      const payload = { name: teamName.trim(), formation, picks: buildPicksPayload() };
      return fetchApi('/api/fantasy/team', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => navigate('/my-team'),
    onError: (err) => {
      if (err.status === 409) {
        navigate('/my-team');
      } else {
        setErrorMsg(err.message || 'Error al guardar la cartola');
      }
    },
  });

  const isComplete = picks.length === 11 && teamName.trim().length >= 3 && budgetRemaining >= 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Crear Cartola</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre de tu cartola</label>
          <input type="text" className="border rounded-lg px-4 py-2 w-full" value={teamName}
            onChange={e => setTeamName(e.target.value)} placeholder="Mi Cartola Mundialera" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Formación</label>
          <select className="border rounded-lg px-4 py-2" value={formation}
            onChange={e => { setFormation(e.target.value); setPicks([]); setErrorMsg(null); }}>
            {FORMATIONS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Presupuesto</span>
            <span className={budgetRemaining < 0 ? 'text-red-600 font-bold' : ''}>
              M${budgetSpent.toFixed(1)} / M${BUDGET} (M${budgetRemaining.toFixed(1)} disp.)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className={`h-2.5 rounded-full transition-all ${budgetRemaining < 0 ? 'bg-red-500' : budgetRemaining < 15 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(100, (budgetSpent / BUDGET) * 100)}%` }} />
          </div>
        </div>

        <div className="flex justify-between text-sm text-gray-500">
          <span>Jugadores: {picks.length} / 11</span>
          {picks.filter(p => p.is_captain).length === 1 && <span className="text-yellow-600">Capitán elegido</span>}
        </div>
      </div>

      <div className="flex gap-1 mb-4 overflow-x-auto">
        {POS_ORDER.map(pos => {
          const sel = selectedByPos[pos]?.length || 0;
          const req = requiredCounts[pos] || 0;
          const full = sel >= req && req > 0;
          return (
            <button key={pos} onClick={() => setActivePos(pos)}
              className={`flex-1 min-w-0 px-3 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap transition
                ${activePos === pos ? 'bg-white text-blue-600 border-t border-x shadow' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}
                ${full && activePos !== pos ? 'border-b-2 border-green-400' : ''}`}>
              {POSITIONS[pos]} ({sel}/{req})
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Seleccionados — {POSITIONS[activePos]}
        </h3>
        {selectedByPos[activePos]?.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Ninguno seleccionado. Elige jugadores de la lista de abajo.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedByPos[activePos].map(pick => (
              <div key={pick.player.id} onClick={() => togglePick(pick.player)}
                className={`relative border rounded-lg px-3 py-2 text-sm flex items-center gap-2 cursor-pointer transition hover:bg-red-50 group
                  ${pick.is_captain ? 'border-yellow-400 bg-yellow-50' : pick.is_vice_captain ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                <img src={pick.player.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                <div className="min-w-0">
                  <div className="font-medium truncate max-w-24">{pick.player.name}</div>
                  <div className="text-xs text-gray-400">M${playerPrices[pick.player.id]?.toFixed(1) || '5.0'}</div>
                </div>
                {pick.is_captain && <span className="text-yellow-500 text-sm" title="Capitán">⭐</span>}
                {pick.is_vice_captain && <span className="text-blue-600 text-xs font-bold bg-blue-100 px-1 rounded" title="Vicecapitán">V</span>}
                <span className="text-red-300 group-hover:text-red-600 text-xs ml-1">✕</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Jugadores — {POSITIONS[activePos]}
        </h3>
        {(!playersData?.data) ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-2 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-1" />
                <div className="h-3 bg-gray-200 rounded mx-2 mb-1" />
                <div className="h-3 bg-gray-200 rounded mx-4" />
              </div>
            ))}
          </div>
        ) : availableByPos[activePos]?.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No hay más jugadores disponibles en esta posición.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {availableByPos[activePos]?.map(player => {
              const needed = requiredCounts[activePos] || 0;
              const current = selectedByPos[activePos]?.length || 0;
              const disabled = current >= needed;
              return (
                <button key={player.id} disabled={disabled} onClick={() => togglePick(player)}
                  className={`border rounded-lg p-2 text-left transition flex flex-col items-center
                    ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-blue-50 hover:border-blue-300 cursor-pointer'}`}>
                  <img src={player.photo} alt="" className="w-12 h-12 rounded-full object-cover mb-1" loading="lazy" />
                  <div className="text-xs font-medium text-center leading-tight truncate w-full">{player.name}</div>
                  <div className="text-xs text-gray-400">{player.team?.code}</div>
                  <div className="text-xs font-semibold mt-0.5 text-gray-700">M${playerPrices[player.id]?.toFixed(1) || '5.0'}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {picks.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Capitán y Vicecapitán
          </h3>
          <p className="text-xs text-gray-400 mb-3">El capitán suma el doble de puntos. El vicecapitán suma 1.5x si el capitán no juega.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {picks.map(pick => (
              <div key={pick.player.id}
                className={`border rounded-lg p-2 text-sm flex flex-col items-center gap-1
                  ${pick.is_captain ? 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-300' : pick.is_vice_captain ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                <img src={pick.player.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                <div className="text-xs font-medium truncate w-full text-center">{pick.player.name}</div>
                <div className="flex gap-1 mt-1">
                  <button onClick={() => setCaptain(pick.player.id)}
                    className={`text-xs px-2 py-0.5 rounded transition ${pick.is_captain ? 'bg-yellow-200 text-yellow-800 font-bold' : 'bg-gray-100 text-gray-500 hover:bg-yellow-100'}`}>
                    ⭐ Cap
                  </button>
                  <button onClick={() => setViceCaptain(pick.player.id)}
                    className={`text-xs px-2 py-0.5 rounded transition ${pick.is_vice_captain ? 'bg-blue-200 text-blue-800 font-bold' : 'bg-gray-100 text-gray-500 hover:bg-blue-100'}`}>
                    Vice
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{errorMsg}</div>
      )}

      <button onClick={() => saveMutation.mutate()} disabled={!isComplete || saveMutation.isPending}
        className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition">
        {saveMutation.isPending ? 'Guardando...' : 'Crear Cartola'}
      </button>

      {!isComplete && (
        <p className="text-sm text-gray-400 text-center mt-2">
          {teamName.trim().length < 3 && 'El nombre debe tener al menos 3 caracteres. '}
          {picks.length < 11 && `Faltan ${11 - picks.length} jugadores. `}
          {budgetRemaining < 0 && 'Presupuesto excedido. '}
        </p>
      )}
    </div>
  );
}