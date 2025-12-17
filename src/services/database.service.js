// src/services/database.service.js
const databaseConfig = require('../config/database.config');

class DatabaseService {
  /**
   * Guardar evento en tabla match_events
   */
  async saveEvent(event) {
    try {
      const pool = databaseConfig.getPool();
      
      const query = `
        INSERT INTO match_events 
        (match_id, event_type, team_id, player_id, minute, half, event_data, timestamp) 
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const eventData = JSON.stringify(event.data);
      const teamId = event.data?.team_id || this.getTeamIdByName(event.data?.team);
      const playerId = event.data?.player_id || null;
      const minute = event.data?.minute || 0;
      const half = this.determineHalf(minute);

      const [result] = await pool.execute(query, [
        event.matchId || event.data?.matchId,
        event.eventType,
        teamId,
        playerId,
        minute,
        half,
        eventData
      ]);

      console.log('✅ Evento guardado en match_events - ID:', result.insertId);
      return result;
    } catch (error) {
      console.error('❌ Error guardando evento:', error.message);
    }
  }

  /**
   * Guardar gol en tabla goals
   */
  async saveGoal(event) {
    try {
      const pool = databaseConfig.getPool();
      
      const query = `
        INSERT INTO goals 
        (match_id, team_id, player_id, minute, extra_time_minute, goal_type) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const teamId = event.data?.team_id || this.getTeamIdByName(event.data?.team);
      const playerId = event.data?.player_id || null;

      const [result] = await pool.execute(query, [
        event.matchId || event.data?.matchId,
        teamId,
        playerId,
        event.data?.minute || 0,
        0,
        'open_play'
      ]);

      console.log('⚽ Gol guardado - ID:', result.insertId);

      if (event.data?.score) {
        await this.updateMatchScore(event);
      }

      return result;
    } catch (error) {
      console.error('❌ Error guardando gol:', error.message);
    }
  }

  /**
   * Guardar tarjeta en tabla cards
   */
  async saveCard(event) {
    try {
      const pool = databaseConfig.getPool();
      
      const query = `
        INSERT INTO cards 
        (match_id, team_id, player_id, card_type, minute, extra_time_minute, reason) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const teamId = event.data?.team_id || this.getTeamIdByName(event.data?.team);
      const playerId = event.data?.player_id || null;

      const [result] = await pool.execute(query, [
        event.matchId || event.data?.matchId,
        teamId,
        playerId,
        event.data?.cardType || 'yellow',
        event.data?.minute || 0,
        0,
        'Falta técnica'
      ]);

      console.log('🟨 Tarjeta guardada - ID:', result.insertId);
      return result;
    } catch (error) {
      console.error('❌ Error guardando tarjeta:', error.message);
    }
  }

  /**
   * Guardar sustitución en tabla substitutions
   */
  async saveSubstitution(event) {
    try {
      const pool = databaseConfig.getPool();
      
      const query = `
        INSERT INTO substitutions 
        (match_id, team_id, player_out_id, player_in_id, minute, extra_time_minute, reason) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const teamId = event.data?.team_id || this.getTeamIdByName(event.data?.team);

      const [result] = await pool.execute(query, [
        event.matchId || event.data?.matchId,
        teamId,
        event.data?.player_out_id || null,
        event.data?.player_in_id || null,
        event.data?.minute || 0,
        0,
        'tactical'
      ]);

      console.log('🔄 Sustitución guardada - ID:', result.insertId);
      return result;
    } catch (error) {
      console.error('❌ Error guardando sustitución:', error.message);
    }
  }
  /**
   * Actualizar marcador en tabla matches
   */
  async updateMatchScore(event) {
    try {
      const pool = databaseConfig.getPool();
      const score = event.data?.score;

      if (!score) return;

      const query = `
        UPDATE matches 
        SET home_score = ?, away_score = ?, status = 'live'
        WHERE id = ?
      `;
      
      await pool.execute(query, [
        score.home,
        score.away,
        event.matchId || event.data?.matchId
      ]);

      console.log(`⚽ Marcador actualizado: ${score.home} - ${score.away}`);
    } catch (error) {
      console.error('❌ Error actualizando marcador:', error.message);
    }
  }

  /**
   * Actualizar estadísticas
   */
  async updateStatistics(event) {
    try {
      const pool = databaseConfig.getPool();
      const matchId = event.matchId || event.data?.matchId;
      const teamId = event.data?.team_id || this.getTeamIdByName(event.data?.team);

      if (event.eventType === 'goal') {
        const query = `
          INSERT INTO match_statistics 
          (match_id, team_id, shots, shots_on_target) 
          VALUES (?, ?, 1, 1)
          ON DUPLICATE KEY UPDATE 
          shots = shots + 1, shots_on_target = shots_on_target + 1
        `;
        await pool.execute(query, [matchId, teamId]);
      } 
      else if (event.eventType === 'card') {
        const field = event.data?.cardType === 'red' ? 'red_cards' : 'yellow_cards';
        const query = `
          INSERT INTO match_statistics 
          (match_id, team_id, ${field}) 
          VALUES (?, ?, 1)
          ON DUPLICATE KEY UPDATE 
          ${field} = ${field} + 1
        `;
        await pool.execute(query, [matchId, teamId]);
      }

      console.log('📊 Estadísticas actualizadas');
    } catch (error) {
      console.error('❌ Error actualizando estadísticas:', error.message);
    }
  }

  /**
   * Determinar mitad del partido
   */
  determineHalf(minute) {
    if (!minute || minute <= 45) return 'first_half';
    if (minute <= 90) return 'second_half';
    return 'extra_time';
  }

  /**
   * Mapear nombre de equipo a team_id
   */
  getTeamIdByName(teamName) {
    const teamMap = {
      'Argentina': 1,
      'Brasil': 2,
      'Peru': 3,
      'Francia': 4,
      'Alemania': 5,
      'Espana': 6,
      'Inglaterra': 7,
      'Mexico': 8
    };
    return teamMap[teamName] || 1;
  }
}

module.exports = new DatabaseService();
