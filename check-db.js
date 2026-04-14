const mysql = require('mysql2/promise');

function getDbConfig() {
  const socketPath = process.env.DB_SOCKET_PATH;
  const useSsl = process.env.DB_SSL === 'true';

  const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 8000)
  };

  if (socketPath) {
    config.socketPath = socketPath;
  } else {
    config.host = process.env.DB_HOST;
    config.port = Number(process.env.DB_PORT || 3306);
  }

  if (useSsl) {
    config.ssl = { rejectUnauthorized: false };
  }

  return config;
}

function getMissingDbVars() {
  const required = ['DB_USER', 'DB_PASSWORD', 'DB_NAME'];

  if (!process.env.DB_SOCKET_PATH) {
    required.push('DB_HOST');
  }

  return required.filter((key) => !process.env[key]);
}

async function run() {
  const missingVars = getMissingDbVars();
  if (missingVars.length > 0) {
    console.error('Missing required env vars:', missingVars.join(', '));
    process.exit(1);
  }

  let connection;
  try {
    connection = await mysql.createConnection(getDbConfig());
    const [rows] = await connection.query('SELECT 1 AS ok, NOW() AS serverTime');
    console.log('MySQL connection successful. Result:', rows[0]);
  } catch (error) {
    console.error('MySQL connection failed.');
    console.error('Code:', error.code || 'UNKNOWN');
    console.error('Details:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

run();
