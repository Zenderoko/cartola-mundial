CREATE MATERIALIZED VIEW IF NOT EXISTS mv_ranking_global AS
SELECT
  ROW_NUMBER() OVER (ORDER BY ft.total_points DESC) AS position,
  ft.id AS fantasy_team_id,
  ft.name AS fantasy_team_name,
  u.name AS user_name,
  u.avatar_url,
  u.clerk_user_id,
  ft.total_points,
  ft.round_points,
  ft.formation,
  COUNT(DISTINCT fp.round) AS rounds_played,
  COUNT(DISTINCT fp.player_id) AS unique_players_used
FROM fantasy_teams ft
JOIN users u ON u.clerk_user_id = ft.clerk_user_id
LEFT JOIN fantasy_picks fp ON fp.fantasy_team_id = ft.id
WHERE ft.is_active = TRUE
GROUP BY ft.id, ft.name, u.name, u.avatar_url, u.clerk_user_id,
         ft.total_points, ft.round_points, ft.formation
ORDER BY ft.total_points DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ranking_position ON mv_ranking_global(position);

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_ranking_by_round AS
SELECT
  fp.round,
  ROW_NUMBER() OVER (PARTITION BY fp.round ORDER BY SUM(fpt.total_points) DESC) AS position,
  ft.id AS fantasy_team_id,
  ft.name AS fantasy_team_name,
  u.name AS user_name,
  u.clerk_user_id,
  SUM(fpt.total_points) AS round_points
FROM fantasy_picks fp
JOIN fantasy_teams ft ON ft.id = fp.fantasy_team_id
JOIN users u ON u.clerk_user_id = ft.clerk_user_id
JOIN fantasy_points fpt ON fpt.player_id = fp.player_id
  AND fpt.round = fp.round
WHERE ft.is_active = TRUE
GROUP BY fp.round, ft.id, ft.name, u.name, u.clerk_user_id
ORDER BY fp.round, round_points DESC;

CREATE INDEX IF NOT EXISTS idx_ranking_round ON mv_ranking_by_round(round);
