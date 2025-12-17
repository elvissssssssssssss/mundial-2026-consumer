// src/consumers/match-events.consumer.js
const rabbitmqConfig = require('../config/rabbitmq.config');
const databaseService = require('../services/database.service');
const socketService = require('../services/socket.service');

class MatchEventsConsumer {
  async startConsuming() {
    try {
      const channel = rabbitmqConfig.getChannel();

      // Cola para visualización en tiempo real
      const queueVisualization = 'visualization_queue';
      await channel.assertQueue(queueVisualization, { durable: true });
      
      // Bind a todos los eventos de todos los partidos
      await channel.bindQueue(queueVisualization, 'mundial_events', 'match.#');

      console.log('👂 Escuchando eventos para visualización...');

      channel.consume(queueVisualization, async (msg) => {
        if (msg !== null) {
          try {
            const event = JSON.parse(msg.content.toString());
            console.log('📥 Evento recibido:', event);

            // 1. Guardar evento en tabla match_events
            await databaseService.saveEvent(event);

            // 2. Guardar en tablas específicas según tipo
            if (event.eventType === 'goal') {
              await databaseService.saveGoal(event);
            } else if (event.eventType === 'card') {
              await databaseService.saveCard(event);
            } else if (event.eventType === 'substitution') {
              await databaseService.saveSubstitution(event);
            }

            // 3. Actualizar estadísticas del partido
            await databaseService.updateStatistics(event);

            // 4. Emitir evento a clientes web via Socket.IO
            socketService.emitToMatch(event.matchId, 'match_event', event);

            // 5. Confirmar procesamiento exitoso
            channel.ack(msg);
          } catch (error) {
            console.error('❌ Error procesando mensaje:', error);
            console.error('   Evento:', JSON.stringify(event, null, 2));
            // Rechazar mensaje sin reencolar (evita loops infinitos)
            channel.nack(msg, false, false);
          }
        }
      });
    } catch (error) {
      console.error('❌ Error iniciando MatchEventsConsumer:', error);
      throw error;
    }
  }
}

module.exports = new MatchEventsConsumer();
