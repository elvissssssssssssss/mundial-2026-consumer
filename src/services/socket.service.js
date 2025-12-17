class SocketService {
  constructor() {
    this.io = null;
  }

  initialize(io) {
    this.io = io;

    io.on('connection', (socket) => {
      console.log('🔌 Cliente conectado:', socket.id || 'ID no disponible');

      // Cliente se suscribe a un partido específico
      socket.on('subscribe_match', (matchId) => {
        socket.join(`match_${matchId}`);
        console.log(`Cliente ${socket.id} suscrito al partido ${matchId}`);
      });

      socket.on('unsubscribe_match', (matchId) => {
        socket.leave(`match_${matchId}`);
      });

      socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
      });
    });
  }

  emitToMatch(matchId, eventName, data) {
    if (this.io) {
      this.io.to(`match_${matchId}`).emit(eventName, data);
    }
  }

  emitToAll(eventName, data) {
    if (this.io) {
      this.io.emit(eventName, data);
    }
  }
}

module.exports = new SocketService();
