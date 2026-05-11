const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 465,
    secure: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) === 465 : true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 10000,  // 10s máximo para conectar
    greetingTimeout: 10000,
    socketTimeout: 15000
});

module.exports = transporter;
