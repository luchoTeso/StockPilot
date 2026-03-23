// controllers/authController.js
const User = require('../models/User');
const Store = require('../models/Store');
const crypto = require('crypto'); // Para generar tokens aleatorios

class AuthController {
    static async login(req, res) {
        try {
            const { login, password, rol } = req.body;
            console.log(`--- LOGIN ATTEMPT: ${login} | ROL: ${rol} ---`);

            if (!login || !password || !rol) {
                console.warn('Login fallido: Faltan campos');
                return res.status(400).json({ 
                    success: false, 
                    error: 'Faltan campos obligatorios' 
                });
            }

            console.log('Buscando usuario en BD...');
            const user = await User.findByCredentials(login, password, rol);
            
            if (!user) {
                console.warn('Login fallido: Usuario no encontrado o clave incorrecta');
                return res.status(401).json({ 
                    success: false, 
                    error: 'Usuario/correo, contraseña o rol incorrectos' 
                });
            }

            console.log('Login exitoso: Usuario encontrado. Asignando sesión...');
            if (!user.id_tienda) {
                console.error('ERROR: Usuario sin tienda detectado en login exitoso');
                return res.status(401).json({ 
                    success: false, 
                    error: 'Usuario no tiene tienda asignada' 
                });
            }

            req.session.userId = user.id_usuario;
            req.session.tiendaId = user.id_tienda;
            req.session.rol = user.rol;
            req.session.nombres = user.nombres;
            console.log('Sesión establecida correctamente. Enviando respuesta...');

            res.json({ 
                success: true, 
                message: 'Login exitoso',
                user: {
                    nombres: user.nombres,
                    rol: user.rol
                }
            });
        } catch (error) {
            console.error('❌ ERROR FATAL EN LOGIN:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Error interno del servidor: ' + error.message 
            });
        }
    }

    static async register(req, res) {
        let storeId = null; // Fix #4: declarar fuera del try para el rollback

        try {
            const {
                name, id, gender, email, phone,
                store_name, store_address, username, password
            } = req.body;

            if (!name || !email || !username || !password || !store_name) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Todos los campos son obligatorios' 
                });
            }

            // Crear la tienda primero
            const storeData = {
                nombre_establecimiento: store_name,
                direccion: store_address,
                anio_creacion: new Date().getFullYear()
            };
            
            storeId = await Store.create(storeData);

            // Crear el usuario administrador
            const userData = {
                nombres: name,
                genero: gender,
                correo: email,
                celular: phone,
                usuario: username,
                contrasena: password, // bcrypt se aplica dentro de User.create()
                rol: 'Administrador',
                id_tienda: storeId
            };

            const userId = await User.create(userData);

            // Establecer sesión
            req.session.userId = userId;
            req.session.tiendaId = storeId;
            req.session.rol = 'Administrador';
            req.session.nombres = name;

            res.json({ 
                success: true, 
                message: 'Registro exitoso. Redirigiendo...',
                redirect: '/ventana_tiendas.html'
            });

        } catch (error) {
            console.error('Error en registro:', error);
            
            // Rollback: eliminar la tienda creada si el usuario no se pudo crear
            if (storeId) {
                try {
                    await Store.delete(storeId);
                } catch (deleteError) {
                    console.error('Error eliminando tienda en rollback:', deleteError);
                }
            }

            if (error.message && error.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'El correo o usuario ya existe' 
                });
            }

            res.status(500).json({ 
                success: false, 
                error: 'Error en el registro: ' + error.message 
            });
        }
    }

    static getSessionInfo(req, res) {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, error: "Sesión no iniciada" });
        }

        res.json({
            success: true,
            userId: req.session.userId,
            tiendaId: req.session.tiendaId,
            rol: req.session.rol,
            nombres: req.session.nombres
        });
    }

    static async getProfile(req, res) {
        try {
            const userId = req.session.userId;
            if (!userId) return res.status(401).json({ success: false, error: 'No autorizado' });

            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

            res.json({ success: true, user });
        } catch (error) {
            console.error('Error obteniendo perfil:', error);
            res.status(500).json({ success: false, error: 'Error del servidor' });
        }
    }

    static async updateProfile(req, res) {
        try {
            const userId = req.session.userId;
            if (!userId) return res.status(401).json({ success: false, error: 'No autorizado' });

            const { nombres, genero, correo, celular, usuario, foto_url } = req.body;
            
            const success = await User.update(userId, { nombres, genero, correo, celular, usuario, foto_url });
            
            if (success) {
                // Actualizar nombres en sesión por si cambiaron
                req.session.nombres = nombres;
                res.json({ success: true, message: 'Perfil actualizado correctamente' });
            } else {
                res.status(400).json({ success: false, error: 'No se pudo actualizar el perfil' });
            }
        } catch (error) {
            console.error('Error actualizando perfil:', error);
            res.status(500).json({ success: false, error: 'Error del servidor' });
        }
    }

    static async changePassword(req, res) {
        try {
            const userId = req.session.userId;
            if (!userId) return res.status(401).json({ success: false, error: 'No autorizado' });

            const { currentPassword, newPassword } = req.body;

            // Verificar contraseña actual
            const userFull = await User.findById(userId);
            // El findById original no trae la contraseña por seguridad, necesito una forma de obtenerla
            // Pero User.js ya tiene bcrypt. Voy a re-usar una lógica de búsqueda que traiga todo.
            
            const query = `SELECT contrasena FROM Usuarios WHERE id_usuario = ?`;
            const db = require('../config/database');
            const row = await db.getAsync(query, [userId]);
            
            const isMatch = await require('bcrypt').compare(currentPassword, row.contrasena);
            if (!isMatch) {
                return res.status(400).json({ success: false, error: 'La contraseña actual es incorrecta' });
            }

            await User.updatePassword(userId, newPassword);
            res.json({ success: true, message: 'Contraseña cambiada exitosamente' });
        } catch (error) {
            console.error('Error cambiando contraseña:', error);
            res.status(500).json({ success: false, error: 'Error del servidor' });
        }
    }

    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ success: false, error: 'Correo es requerido' });

            const user = await User.findByEmail(email);
            if (!user) {
                // Por seguridad, no decimos si el correo existe o no
                return res.json({ success: true, message: 'Si el correo existe, se ha enviado un código' });
            }

            // Generar código de 6 dígitos
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

            await User.setResetToken(user.id_usuario, code, expires);

            // NOTA: Aquí se enviaría el correo. Para efectos de esta demo y facilidad del usuario, 
            // vamos a devolver el código en la respuesta para que pueda probarlo sin configurar SMTP.
            res.json({ 
                success: true, 
                message: 'Código de recuperación generado',
                demo_code: code // ESTO SOLO PARA LA ETAPA DE DESARROLLO/DUDAS DEL USUARIO
            });
        } catch (error) {
            console.error('Error en forgotPassword:', error);
            res.status(500).json({ success: false, error: 'Error del servidor' });
        }
    }

    static async verifyResetCode(req, res) {
        try {
            const { email, code } = req.body;
            const user = await User.verifyResetToken(email, code);
            
            if (!user) {
                return res.status(400).json({ success: false, error: 'Código inválido o expirado' });
            }

            res.json({ success: true, message: 'Código verificado' });
        } catch (error) {
            console.error('Error en verifyResetCode:', error);
            res.status(500).json({ success: false, error: 'Error del servidor' });
        }
    }

    static async resetPasswordWithCode(req, res) {
        try {
            const { email, code, newPassword } = req.body;
            const user = await User.verifyResetToken(email, code);
            
            if (!user) {
                return res.status(400).json({ success: false, error: 'Código inválido o expirado' });
            }

            await User.updatePassword(user.id_usuario, newPassword);
            await User.clearResetToken(user.id_usuario);

            res.json({ success: true, message: 'Tu contraseña ha sido restablecida exitosamente' });
        } catch (error) {
            console.error('Error en resetPasswordWithCode:', error);
            res.status(500).json({ success: false, error: 'Error del servidor' });
        }
    }

    static logout(req, res) {
        req.session.destroy(() => {
            res.redirect('/');
        });
    }
}

module.exports = AuthController;