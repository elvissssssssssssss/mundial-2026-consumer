const mysql = require('mysql2/promise');

class DatabaseConfig {
  constructor() {
    this.pool = null;
  }

  async connect() {
    try {
      this.pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      // Probar conexión
      const connection = await this.pool.getConnection();
      console.log('✅ MySQL conectado');
      connection.release();

      return this.pool;
    } catch (error) {
      console.error('❌ Error conectando MySQL:', error);
      throw error;
    }
  }

  getPool() {
    return this.pool;
  }
}

module.exports = new DatabaseConfig();
