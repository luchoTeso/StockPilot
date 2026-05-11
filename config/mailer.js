const nodemailer = require('nodemailer');

// En producción usa Resend (HTTPS, no SMTP — funciona en Railway/Heroku/etc.)
// En desarrollo usa Gmail SMTP directamente
const useResend = !!process.env.RESEND_API_KEY;

let transporter;

if (useResend) {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Adaptador con la misma interfaz que nodemailer para no cambiar el resto del código
    transporter = {
        sendMail: async (options) => {
            const { from, to, subject, html, text } = options;
            const { data, error } = await resend.emails.send({
                from: from || `StockPilot <onboarding@resend.dev>`,
                to: Array.isArray(to) ? to : [to],
                subject,
                html,
                text
            });
            if (error) throw new Error(error.message || 'Error enviando email con Resend');
            return data;
        }
    };
    console.log('📧 Mailer: usando Resend (producción)');
} else {
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 465,
        secure: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) === 465 : true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
    });
    console.log('📧 Mailer: usando Gmail SMTP (desarrollo)');
}

module.exports = transporter;
