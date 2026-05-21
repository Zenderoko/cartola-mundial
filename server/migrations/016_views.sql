CREATE OR REPLACE VIEW v_team_stats AS
SELECT
  t.id AS team_id,
  t.name AS team_name,
  t.logo,
  COUNT(DISTINCT f.id) AS played,
  COUNT(DISTINCT f.id) FILTER (
    WHERE (f.home_team_id = t.id AND f.home_score > f.away_score)
       OR (f.away_team_id = t.id AND f.away_score > f.home_score)
  ) AS wins,
  COUNT(DISTINCT f.id) FILTER (
    WHERE f.home_score = f.away_score
      AND (f.home_team_id = t.id OR f.away_team_id = t.id)
  ) AS draws,
  COUNT(DISTINCT f.id) FILTER (
    WHERE (f.home_team_id = t.id AND f.home_score < f.away_score)
       OR (f.away_team_id = t.id AND f.away_score < f.home_score)
  ) AS losses,
  COALESCE(SUM(CASE WHEN f.home_team_id = t.id THEN f.home_score ELSE f.away_score END), 0) AS goals_for,
  COALESCE(SUM(CASE WHEN f.home_team_id = t.id THEN f.away_score ELSE f.home_score END), 0) AS goals_against,
  COALESCE(AVG(fs.possession), 0) AS avg_possession
FROM teams t
LEFT JOIN fixtures f ON (f.home_team_id = t.id OR f.away_team_id = t.id) AND f.status = 'match finished'
LEFT JOIN fixture_stats fs ON fs.fixture_id = f.id AND fs.team_id = t.id
GROUP BY t.id, t.name, t.logo;

CREATE OR REPLACE VIEW v_player_totals AS
SELECT
  p.id AS player_id,
  p.name AS player_name,
  p.position,
  p.photo,
  t.id AS team_id,
  t.name AS team_name,
  t.logo AS team_logo,
  COUNT(DISTINCT ps.fixture_id) AS appearances,
  COALESCE(SUM(ps.goals), 0) AS goals,
  COALESCE(SUM(ps.assists), 0) AS assists,
  COALESCE(SUM(ps.shots), 0) AS shots,
  COALESCE(SUM(ps.key_passes), 0) AS key_passes,
  COALESCE(SUM(ps.tackles), 0) AS tackles,
  COALESCE(SUM(ps.saves), 0) AS saves,
  COALESCE(COUNT(*) FILTER (WHERE ps.man_of_the_match), 0) AS man_of_the_match,
  AVG(ps.rating) FILTER (WHERE ps.rating IS NOT NULL) AS avg_rating
FROM players p
JOIN teams t ON t.id = p.team_id
LEFT JOIN player_stats ps ON ps.player_id = p.id
LEFT JOIN fixtures f ON f.id = ps.fixture_id AND f.status = 'match finished'
GROUP BY p.id, p.name, p.position, p.photo, t.id, t.name, t.logo;
