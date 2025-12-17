const rabbitmqConfig = require('../config/rabbitmq.config');
const databaseService = require('../services/database.service');

class StatsConsumer {
  async startConsuming() {
    try {
      const channel = rabbitmqConfig.getChannel();

      const queueStats = 'statistics_queue';
      await channel.assertQueue(queueStats, { durable: true });
      
      // Bind solo a eventos relevantes para estadísticas
      await channel.bindQueue(queueStats, 'mundial_events', 'match.*.goal');
      await channel.bindQueue(queueStats, 'mundial_events', 'match.*.card');

      console.log('📊 Servicio de estadísticas activo...');

      channel.consume(queueStats, async (msg) => {
        if (msg !== null) {
          const event = JSON.parse(msg.content.toString());

          // Actualizar estadísticas agregadas
          await databaseService.updateStatistics(event);

          channel.ack(msg);
        }
      });
    } catch (error) {
      console.error('Error en stats consumer:', error);
    }
  }
}

module.exports = new StatsConsumer();
