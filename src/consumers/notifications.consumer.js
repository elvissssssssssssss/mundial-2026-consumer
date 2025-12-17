const rabbitmqConfig = require('../config/rabbitmq.config');

class NotificationsConsumer {
  async startConsuming() {
    try {
      const channel = rabbitmqConfig.getChannel();

      const queueNotifications = 'notifications_queue';
      await channel.assertQueue(queueNotifications, { durable: true });
      
      // Bind a eventos importantes para notificaciones
      await channel.bindQueue(queueNotifications, 'mundial_events', 'match.*.goal');
      await channel.bindQueue(queueNotifications, 'mundial_events', 'match.*.red_card');
      await channel.bindQueue(queueNotifications, 'mundial_events', 'match.*.match_status');

      console.log('📱 Servicio de notificaciones activo...');

      channel.consume(queueNotifications, async (msg) => {
        if (msg !== null) {
          const event = JSON.parse(msg.content.toString());

          // Aquí podrías enviar notificaciones push, emails, etc.
          console.log('📲 Notificación generada:', event.eventType, '-', event.matchId);

          // Acknowledge del mensaje
          channel.ack(msg);
        }
      });
    } catch (error) {
      console.error('Error en notifications consumer:', error);
    }
  }
}

module.exports = new NotificationsConsumer();
