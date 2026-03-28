require('dotenv').config();
const nodemailer = require('nodemailer');

// Configuración del Transporter para enviar correos
// Utiliza variables de entorno para evitar hardcodear credenciales en el código fuente
const transporter = nodemailer.createTransport({
    service: 'gmail', // Por defecto configurado para Gmail empresarial
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS 
        // Nota: Para Gmail, 'pass' debe ser una 'Contraseña de Aplicación' (App Password)
    }
});

class Mailer {
    /**
     * Envía un correo con el código de recuperación
     * @param {string} to - Correo del destinatario
     * @param {string} code - Código de 6 dígitos
     */
    static async sendPasswordResetCode(to, code) {
        try {
            const mailOptions = {
                from: `"StockPilot Security" <${process.env.EMAIL_USER}>`,
                to: to,
                subject: 'Tu Código de Recuperación - StockPilot',
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                        <h2 style="color: #1e293b; text-align: center; margin-bottom: 5px;">Recuperación de Acceso</h2>
                        <p style="color: #64748b; text-align: center; font-size: 14px; margin-top: 0;">StockPilot Central</p>
                        
                        <div style="margin: 30px 0;">
                            <p style="color: #334155; font-size: 16px; text-align: center;">Tu código temporal de 6 dígitos es:</p>
                            <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 12px; margin: 20px 0;">
                                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4f46e5;">${code}</span>
                            </div>
                            <p style="color: #64748b; font-size: 13px; text-align: center; margin-top: 20px;">
                                Este código expirará en 15 minutos por tu seguridad.<br>
                                Si no solicitaste este cambio, por favor ignora este correo.
                            </p>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                        <p style="color: #94a3b8; font-size: 11px; text-align: center;">
                            © 2026 StockPilot Software Empresarial.<br>Este es un correo automático, no responder.
                        </p>
                    </div>
                `
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('✅ Correo de recuperación enviado satisfactoriamente: %s', info.messageId);
            return true;
        } catch (error) {
            console.error('❌ Error enviando correo de recuperación:', error);
            // Fallback de desarrollo: si falla el correo, imprimir en la consola para depuración
            console.log('--- FALLBACK DE DESARROLLO ---');
            console.log(`[SIMULACIÓN EN TERMINAL] Código de recuperación enviado a ${to}: ${code}`);
            return false;
        }
    }
}

module.exports = Mailer;
