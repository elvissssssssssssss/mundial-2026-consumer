require('dotenv').config();
const amqp = require('amqplib');

class RabbitMQConfig {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
      this.channel = await this.connection.createChannel();
      
      // Crear exchange tipo 'topic' para routing flexible
      await this.channel.assertExchange('mundial_events', 'topic', { 
        durable: true 
      });
      
      console.log('✅ RabbitMQ conectado');
      return this.channel;
    } catch (error) {
      console.error('❌ Error conectando RabbitMQ:', error);
      throw error;
    }
  }

  getChannel() {
    return this.channel;
  }
}

module.exports = new RabbitMQConfig();
