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
          const event = JSON.parse(msg.content.toString());
          console.log('📥 Evento recibido:', event);

          // 1. Guardar en base de datos
          await databaseService.saveEvent(event);

          // 2. Emitir a clientes web via Socket.IO
          socketService.emitToMatch(event.matchId, 'match_event', event);

          // Acknowledge del mensaje
          channel.ack(msg);
        }
      });
    } catch (error) {
      console.error('Error en consumer:', error);
    }
  }
}

module.exports = new MatchEventsConsumer();
