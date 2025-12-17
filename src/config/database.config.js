// src/config/database.config.js
const mysql = require('mysql2/promise');

class DatabaseConfig {
  constructor() {
    this.pool = null;
  }

  async connect() {
    try {
      this.pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'partido',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
      });

      // Probar conexión
      const connection = await this.pool.getConnection();
      console.log('✅ MySQL conectado exitosamente');
      console.log(`   📊 Base de datos: ${process.env.DB_NAME || 'partido'}`);
      console.log(`   🌐 Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
      connection.release();

      return this.pool;
    } catch (error) {
      console.error('❌ Error conectando a MySQL:', error.message);
      console.error('   Verifica tu archivo .env y que MySQL esté corriendo');
      throw error;
    }
  }

  getPool() {
    if (!this.pool) {
      throw new Error('Database pool no inicializado. Llama a connect() primero.');
    }
    return this.pool;
  }
}

module.exports = new DatabaseConfig();
