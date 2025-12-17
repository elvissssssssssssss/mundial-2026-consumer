// src/app.js
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const rabbitmqConfig = require('./config/rabbitmq.config');
const databaseConfig = require('./config/database.config');
const socketService = require('./services/socket.service');
const matchEventsConsumer = require('./consumers/match-events.consumer');
const statsConsumer = require('./consumers/stats.consumer');
const notificationsConsumer = require('./consumers/notifications.consumer');

const app = express();
const server = http.createServer(app);

// Configuración de Socket.IO con CORS
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:4200' }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'consumer',
    timestamp: new Date().toISOString()
  });
});

// Función de inicio
async function startServer() {
  try {
    // 1️⃣ PRIMERO: Conectar a MySQL
    console.log('🔌 Conectando a MySQL...');
    await databaseConfig.connect();
    
    // 2️⃣ SEGUNDO: Conectar a RabbitMQ
    console.log('🔌 Conectando a RabbitMQ...');
    await rabbitmqConfig.connect();
    
    // 3️⃣ TERCERO: Inicializar Socket.IO
    console.log('🔌 Inicializando Socket.IO...');
    socketService.initialize(io);
    
    // 4️⃣ CUARTO: Iniciar Consumers
    console.log('🔌 Iniciando consumers...');
    await matchEventsConsumer.startConsuming();
    await statsConsumer.startConsuming();
    await notificationsConsumer.startConsuming();
    
    // 5️⃣ QUINTO: Iniciar servidor HTTP
    const PORT = process.env.PORT || 4000;
    server.listen(PORT, () => {
      console.log(`\n🚀 Consumer Backend corriendo en puerto ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health\n`);
    });
  } catch (error) {
    console.error('❌ Error fatal iniciando servidor:', error);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

// Manejo de errores no capturados
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar servidor
startServer();
