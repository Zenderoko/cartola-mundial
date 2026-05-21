const apiFootball = require('./apiFootball');
const fixtureRepo = require('../repositories/fixtureRepo');
const teamRepo = require('../repositories/teamRepo');
const standingRepo = require('../repositories/standingRepo');
const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

class SyncService {
  async syncAllFixtures() {
    logger.info('Starting full fixture sync for WC 2022...');
    const { data } = await apiFootball.getFixtures();
    const fixtures = data.response || [];

    const { inserted, updated } = await fixtureRepo.upsertMany(fixtures);

    await this._logSync('fixtures', 'synced', fixtures.length);
    logger.info({ total: fixtures.length, inserted, updated }, 'Fixtures sync completed');
    return { total: fixtures.length, inserted, updated };
  }

  async syncFixturesByDate(date) {
    logger.info({ date }, 'Syncing fixtures by date');
    const { data } = await apiFootball.getFixturesByDate(date);
    const fixtures = data.response || [];

    const { inserted, updated } = await fixtureRepo.upsertMany(fixtures);

    await this._logSync(`fixtures:${date}`, 'synced', fixtures.length);
    logger.info({ date, total: fixtures.length, inserted, updated }, 'Date fixtures sync completed');
    return { date, total: fixtures.length, inserted, updated };
  }

  async syncFixtureById(id) {
    logger.info({ fixtureId: id }, 'Syncing single fixture');
    const { data } = await apiFootball.getFixtureById(id);
    const fixture = data.response?.[0];
    if (!fixture) throw new Error(`Fixture ${id} not found in API`);

    await fixtureRepo.upsert(fixture);
    await this._logSync(`fixture:${id}`, 'synced', 1);
    logger.info({ fixtureId: id }, 'Single fixture synced');
    return fixture;
  }

  async syncMatchDetails(fixtureId) {
    logger.info({ fixtureId }, 'Syncing match details');

    const [statsRes, playersRes, eventsRes] = await Promise.all([
      apiFootball.getFixtureStatistics(fixtureId),
      apiFootball.getFixturePlayerStats(fixtureId),
      apiFootball.getFixtureEvents(fixtureId),
    ]);

    const stats = statsRes.data.response || [];
    for (const teamStats of stats) {
      const s = this._parseStats(teamStats.statistics);
      await pool.query(
        `INSERT INTO fixture_stats (fixture_id, team_id,
          shots, shots_on_target, possession, total_passes, accurate_passes,
          fouls, corners, offsides, yellow_cards, red_cards, saves)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (fixture_id, team_id) DO UPDATE SET
          shots = EXCLUDED.shots, shots_on_target = EXCLUDED.shots_on_target,
          possession = EXCLUDED.possession, updated_at = NOW()`,
        [
          fixtureId, teamStats.team.id,
          this._int(s['Shots on Goal']), this._int(s['Shots off Goal']),
          this._float(s['Ball Possession']),
          this._int(s['Total passes']), this._int(s['Passes accurate']),
          this._int(s['Fouls']), this._int(s['Corner Kicks']),
          this._int(s['Offsides']), this._int(s['Yellow Cards']),
          this._int(s['Red Cards']), this._int(s['Goalkeeper Saves']),
        ]
      );
    }

    const players = playersRes.data.response || [];
    for (const teamPlayers of players) {
      for (const p of teamPlayers.players) {
        const ps = p.statistics[0];
        await pool.query(
          `INSERT INTO players (id, team_id, name, position, cache_until)
           VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 days')
           ON CONFLICT (id) DO UPDATE SET
             team_id = EXCLUDED.team_id,
             name = EXCLUDED.name,
             position = CASE WHEN players.position IS NULL THEN EXCLUDED.position ELSE players.position END,
             updated_at = NOW()`,
          [p.player.id, teamPlayers.team.id, p.player.name, ps.games?.position || 'Unknown']
        );
        await pool.query(
          `INSERT INTO player_stats (fixture_id, player_id, team_id,
            rating, minutes_played, position, goals, assists, shots,
            shots_on_target, key_passes, passes, accurate_passes,
            tackles, interceptions, clearances, blocked_shots,
            fouls, fouls_drawn, offsides, yellow_card, red_card,
            saves, goals_conceded, penalties_saved, penalties_missed, man_of_the_match)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
                   $21,$22,$23,$24,$25,$26,$27)
           ON CONFLICT (fixture_id, player_id) DO UPDATE SET
            rating = EXCLUDED.rating, updated_at = NOW()`,
          [
            fixtureId, p.player.id, teamPlayers.team.id,
            this._float(ps.games?.rating), this._int(ps.games?.minutes),
            ps.games?.position || 'Unknown',
            this._int(ps.goals?.total), this._int(ps.goals?.assists),
            this._int(ps.shots?.total), this._int(ps.shots?.on),
            this._int(ps.passes?.key), this._int(ps.passes?.total),
            this._int(ps.passes?.accuracy),
            this._int(ps.tackles?.total), this._int(ps.tackles?.interceptions),
            this._int(ps.duels?.total), this._int(ps.duels?.won),
            this._int(ps.fouls?.drawn), this._int(ps.fouls?.committed),
            this._int(ps.offsides),
            ps.cards?.yellow ? true : false, ps.cards?.red ? true : false,
            this._int(ps.goals?.saves), this._int(ps.goals?.conceded),
            this._int(ps.penalty?.saved), this._int(ps.penalty?.missed),
            (this._float(ps.games?.rating) || 0) >= 9.0,
          ]
        );
      }
    }

    const events = eventsRes.data.response || [];
    for (const event of events) {
      await pool.query(
        `INSERT INTO fixture_events (fixture_id, team_id, player_id, assist_id,
           event_type, detail, minute, extra_minute, comments)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (fixture_id, minute, extra_minute, event_type, player_id)
         DO UPDATE SET detail = EXCLUDED.detail`,
        [
          fixtureId, event.team.id, event.player?.id || null,
          event.assist?.id || null, event.type, event.detail,
          event.time?.elapsed || 0, event.time?.extra || 0,
          event.comments || null,
        ]
      );
    }

    await this._logSync(`match:${fixtureId}`, 'synced', 3);
    logger.info({ fixtureId, stats: stats.length, players: players.length, events: events.length }, 'Match details synced');
    return { stats: stats.length, players: players.length, events: events.length };
  }

  async syncFinishedMatches() {
    const scheduled = await fixtureRepo.findScheduledBefore(new Date());
    logger.info({ total: scheduled.length }, 'Checking for finished matches');

    let synced = 0;
    let updatedStatus = 0;
    for (const fixture of scheduled) {
      try {
        const { data } = await apiFootball.getFixtureById(fixture.id);
        const apiFixture = data.response?.[0];
        if (!apiFixture) continue;

        const apiStatus = apiFixture.fixture.status.short;

        if (['FT', 'AET', 'PEN'].includes(apiStatus)) {
          await fixtureRepo.upsert(apiFixture);
          await this.syncMatchDetails(fixture.id);
          synced++;
        } else if (['LIVE', '1H', '2H', 'HT', 'ET'].includes(apiStatus)) {
          await fixtureRepo.updateStatus(fixture.id, 'live');
          updatedStatus++;
        }
      } catch (err) {
        logger.error({ fixtureId: fixture.id, err: err.message }, 'Failed to sync finished match');
      }
    }

    logger.info({ checked: scheduled.length, synced, updatedStatus }, 'Finished matches sync completed');
    return { checked: scheduled.length, synced, updatedStatus };
  }

  async syncAllTeams() {
    logger.info('Syncing all teams for WC 2022...');
    const { data } = await apiFootball.getTeams();
    const teams = data.response || [];

    const { inserted, updated } = await teamRepo.upsertMany(teams);

    await this._logSync('teams', 'synced', teams.length);
    logger.info({ total: teams.length, inserted, updated }, 'Teams synced');
    return { total: teams.length, inserted, updated };
  }

  async syncSquad(teamId) {
    logger.info({ teamId }, 'Syncing squad');
    const { data } = await apiFootball.getSquadByTeam(teamId);
    const players = data.response?.[0]?.players || [];

    const result = await teamRepo.saveSquad(teamId, players);

    await this._logSync(`squad:${teamId}`, 'synced', players.length);
    logger.info({ teamId, ...result }, 'Squad synced');
    return { teamId, ...result };
  }

  async syncAllSquads() {
    logger.info('Syncing all 48 squads...');
    const teams = await pool.query('SELECT id FROM teams');
    let total = 0, totalInserted = 0, totalUpdated = 0;

    for (const team of teams.rows) {
      try {
        const result = await this.syncSquad(team.id);
        total += result.total;
        totalInserted += result.inserted;
        totalUpdated += result.updated;
      } catch (err) {
        logger.error({ teamId: team.id, err: err.message }, 'Failed to sync squad');
      }
    }

    await this._logSync('squads:all', 'synced', total);
    logger.info({ teams: teams.rows.length, total, totalInserted, totalUpdated }, 'All squads synced');
    return { teams: teams.rows.length, total, totalInserted, totalUpdated };
  }

  async syncTopScorers() {
    logger.info('Syncing top scorers...');
    const { data } = await apiFootball.getTopScorers();
    const scorers = data.response || [];
    await this._logSync('topscorers', 'synced', scorers.length);
    logger.info({ total: scorers.length }, 'Top scorers synced');
    return { total: scorers.length };
  }

  async syncTopAssists() {
    logger.info('Syncing top assists...');
    const { data } = await apiFootball.getTopAssists();
    const assisters = data.response || [];
    await this._logSync('topassists', 'synced', assisters.length);
    logger.info({ total: assisters.length }, 'Top assists synced');
    return { total: assisters.length };
  }

  async syncStandings() {
    logger.info('Syncing standings...');
    const { data } = await apiFootball.getStandings();
    const leagueStandings = data.response?.[0]?.league?.standings || [];

    const { inserted, updated } = await standingRepo.upsertMany(leagueStandings);

    for (const group of leagueStandings) {
      const groupName = group[0]?.group?.name || group[0]?.group || 'Unknown';
      for (const row of group) {
        await teamRepo.updateGroupName(row.team.id, groupName);
      }
    }

    await this._logSync('standings', 'synced', leagueStandings.flat().length);
    logger.info({ groups: leagueStandings.length, inserted, updated }, 'Standings synced');
    return { groups: leagueStandings.length, inserted, updated };
  }

  async syncPreSeed() {
    logger.info('=== PRE-SEED START ===');
    const teams = await this.syncAllTeams();
    const standings = await this.syncStandings();
    const fixtures = await this.syncAllFixtures();
    const squads = await this.syncAllSquads();
    logger.info('=== PRE-SEED COMPLETE ===');
    return { teams, standings, fixtures, squads };
  }

  _parseStats(statistics) {
    const map = {};
    for (const s of statistics || []) map[s.type] = s.value;
    return map;
  }

  _int(val) {
    const n = parseInt(val);
    return isNaN(n) ? 0 : n;
  }

  _float(val) {
    if (val === null || val === undefined || val === '') return null;
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
  }

  async _logSync(entity, status, count) {
    try {
      await pool.query(
        `INSERT INTO sync_log (entity, status, rows_inserted, meta)
         VALUES ($1, $2, $3, $4)`,
        [entity, status, count, JSON.stringify({ timestamp: new Date().toISOString() })]
      );
    } catch (err) {
      logger.error({ err }, 'Failed to log sync');
    }
  }
}

module.exports = new SyncService();
