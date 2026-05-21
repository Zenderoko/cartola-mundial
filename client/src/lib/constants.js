export const POSITIONS = {
  Goalkeeper: 'Arquero',
  Defender: 'Defensor',
  Midfielder: 'Mediocampista',
  Attacker: 'Delantero',
};

export const FORMATIONS = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1', '3-4-3', '5-3-2'];

export const POSITION_SLOTS = {
  '4-3-3': { Goalkeeper: 1, Defender: 4, Midfielder: 3, Attacker: 3 },
  '4-4-2': { Goalkeeper: 1, Defender: 4, Midfielder: 4, Attacker: 2 },
  '3-4-3': { Goalkeeper: 1, Defender: 3, Midfielder: 4, Attacker: 3 },
  '4-5-1': { Goalkeeper: 1, Defender: 4, Midfielder: 5, Attacker: 1 },
  '3-5-2': { Goalkeeper: 1, Defender: 3, Midfielder: 5, Attacker: 2 },
  '5-3-2': { Goalkeeper: 1, Defender: 5, Midfielder: 3, Attacker: 2 },
  '4-2-3-1': { Goalkeeper: 1, Defender: 4, Midfielder: 5, Attacker: 1 },
};

export const POINTS_RULES = [
  { action: 'Gol', points: '+8' },
  { action: 'Asistencia', points: '+5' },
  { action: 'Valla invicta (def/arq)', points: '+6' },
  { action: 'Cada 3 atajadas (arq)', points: '+3' },
  { action: '3+ pases clave', points: '+3' },
  { action: 'Tarjeta amarilla', points: '-2' },
  { action: 'Tarjeta roja', points: '-5' },
  { action: 'Gol en contra', points: '-2' },
  { action: 'Penal errado', points: '-3' },
  { action: 'Jugador del partido', points: '+5' },
  { action: 'Rating ≥ 8.0', points: '+4' },
  { action: 'Rating ≤ 5.0', points: '-3' },
];

export const WC_INFO = {
  LEAGUE_ID: 1,
  SEASON: 2022,
  NAME: 'Mundial FIFA 2022',
  TEAMS: 32,
  MATCHES: 64,
};
