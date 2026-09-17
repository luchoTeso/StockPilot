/**
 * @file redis.js
 * @description Configuración centralizada de Redis para StockPilot.
 * Se conecta únicamente si la variable REDIS_URL está presente (Degradación Elegante).
 */

const { createClient } = require('redis');

let redisClient = null;

if (process.env.REDIS_URL) {
    redisClient = createClient({
        url: process.env.REDIS_URL
    });

    redisClient.on('error', (err) => console.error('Redis Client Error:', err));
    redisClient.on('connect', () => console.log('🚀 Conectado a Redis exitosamente'));

    // Conectar asíncronamente
    redisClient.connect().catch(console.error);
} else {
    console.log('⚠️ REDIS_URL no definida. Operando en modo Fallback (PostgreSQL / Memoria).');
}

module.exports = redisClient;
