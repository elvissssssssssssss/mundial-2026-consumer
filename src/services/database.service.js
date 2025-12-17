const databaseConfig = require('../config/database.config');

class DatabaseService {
  async saveEvent(event) {
    try {
      const pool = databaseConfig.getPool();
      
      const query = `
        INSERT INTO match_events 
        (match_id, event_type, event_data, timestamp) 
        VALUES (?, ?, ?, ?)
      `;

      const [result] = await pool.execute(query, [
        event.matchId,
        event.eventType,
        JSON.stringify(event.data),
        event.timestamp
      ]);

      console.log('💾 Evento guardado en DB:', result.insertId);
      return result;
    } catch (error) {
      console.error('Error guardando evento en DB:', error);
      // No lanzar error para que el consumer continúe
    }
  }

  async updateStatistics(event) {
    try {
      const pool = databaseConfig.getPool();
      
      if (event.eventType === 'goal') {
        // Actualizar estadísticas de goles
        const query = `
          INSERT INTO match_statistics 
          (match_id, team, goals, last_updated) 
          VALUES (?, ?, 1, NOW())
          ON DUPLICATE KEY UPDATE 
          goals = goals + 1, last_updated = NOW()
        `;
        
        await pool.execute(query, [event.matchId, event.data.team]);
      }

      if (event.eventType === 'card') {
        // Actualizar estadísticas de tarjetas
        const field = event.data.cardType === 'yellow' ? 'yellow_cards' : 'red_cards';
        const query = `
          INSERT INTO match_statistics 
          (match_id, team, ${field}, last_updated) 
          VALUES (?, ?, 1, NOW())
          ON DUPLICATE KEY UPDATE 
          ${field} = ${field} + 1, last_updated = NOW()
        `;
        
        await pool.execute(query, [event.matchId, event.data.team]);
      }

      console.log('📊 Estadísticas actualizadas');
    } catch (error) {
      console.error('Error actualizando estadísticas:', error);
    }
  }
}

module.exports = new DatabaseService();
