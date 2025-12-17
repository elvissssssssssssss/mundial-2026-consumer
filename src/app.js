const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const rabbitmqConfig = require('./config/rabbitmq.config');
const socketService = require('./services/socket.service');
const matchEventsConsumer = require('./consumers/match-events.consumer');
const statsConsumer = require('./consumers/stats.consumer');
const notificationsConsumer = require('./consumers/notifications.consumer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Inicializar Socket.IO
socketService.initialize(io);

// Conectar RabbitMQ e iniciar consumers
async function startServer() {
  try {
    await rabbitmqConfig.connect();
    
    // Iniciar todos los consumers
    await matchEventsConsumer.startConsuming();
    await statsConsumer.startConsuming();
    await notificationsConsumer.startConsuming();

    const PORT = process.env.PORT || 4000;
    server.listen(PORT, () => {
      console.log(`🚀 Consumer Backend corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error iniciando servidor:', error);
    process.exit(1);
  }
}

startServer();
