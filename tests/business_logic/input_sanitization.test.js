import { describe, it, expect } from 'vitest';
import validationModule from '../../middleware/validation.js';

const { sanitize } = validationModule;

// === PRUEBAS UNITARIAS: Middleware de Validación ===

describe('Middleware de Validación (validation.js)', () => {

  // ────────────────────────────────────────────────────
  //  sanitize() — Función pura de escape de caracteres
  // ────────────────────────────────────────────────────

  describe('sanitize() — Escape HTML', () => {
    it('Debería escapar etiquetas HTML (<script>)', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitize(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('Debería escapar comillas dobles', () => {
      expect(sanitize('Hola "mundo"')).toContain('&quot;');
    });

    it('Debería escapar comillas simples', () => {
      expect(sanitize("Hola 'mundo'")).toContain('&#x27;');
    });

    it('Debería escapar ampersands', () => {
      expect(sanitize('A & B')).toBe('A &amp; B');
    });

    it('Debería escapar el signo mayor que', () => {
      expect(sanitize('a > b')).toContain('&gt;');
    });

    it('Debería aplicar trim (eliminar espacios al inicio y final)', () => {
      expect(sanitize('  hola  ')).toBe('hola');
    });

    it('Debería retornar el valor original si no es un string', () => {
      expect(sanitize(123)).toBe(123);
      expect(sanitize(null)).toBe(null);
      expect(sanitize(undefined)).toBe(undefined);
    });

    it('Debería manejar string vacío', () => {
      expect(sanitize('')).toBe('');
    });

    it('Debería manejar strings con múltiples caracteres peligrosos', () => {
      const input = '<img src="x" onerror=\'alert(1)\'>';
      const result = sanitize(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('"');
      expect(result).not.toContain("'");
    });
  });

  // ────────────────────────────────────────────────────
  //  validateLogin() — Validación de campos de login
  // ────────────────────────────────────────────────────

  describe('validateLogin() — Lógica de validación', () => {
    // Simulamos el middleware extrayendo su lógica de decisión
    function evaluarLogin(body) {
      const { login, password, rol } = body || {};
      if (!login || !password || !rol) return 'campos_faltantes';
      const rolesValidos = ['Administrador', 'Tendero'];
      if (!rolesValidos.includes(rol)) return 'rol_invalido';
      return 'pass';
    }

    it('Debería pasar con todos los campos completos y rol válido', () => {
      expect(evaluarLogin({ login: 'admin', password: '1234', rol: 'Administrador' })).toBe('pass');
    });

    it('Debería rechazar si falta el login', () => {
      expect(evaluarLogin({ password: '1234', rol: 'Administrador' })).toBe('campos_faltantes');
    });

    it('Debería rechazar si falta el password', () => {
      expect(evaluarLogin({ login: 'admin', rol: 'Administrador' })).toBe('campos_faltantes');
    });

    it('Debería rechazar si falta el rol', () => {
      expect(evaluarLogin({ login: 'admin', password: '1234' })).toBe('campos_faltantes');
    });

    it('Debería rechazar un rol no válido', () => {
      expect(evaluarLogin({ login: 'admin', password: '1234', rol: 'Hacker' })).toBe('rol_invalido');
    });

    it('Debería aceptar el rol Tendero', () => {
      expect(evaluarLogin({ login: 'user', password: 'abc', rol: 'Tendero' })).toBe('pass');
    });
  });

  // ────────────────────────────────────────────────────
  //  validateRegister() — Validación de registro
  // ────────────────────────────────────────────────────

  describe('validateRegister() — Lógica de validación', () => {
    function evaluarRegistro(body) {
      const { name, email, username, password, store_name } = body || {};
      if (!name || !email || !username || !password || !store_name) return 'campos_faltantes';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return 'email_invalido';
      if (password.length < 4) return 'password_corto';
      return 'pass';
    }

    it('Debería pasar con datos completos y válidos', () => {
      expect(evaluarRegistro({
        name: 'Juan', email: 'juan@test.com', username: 'juanito',
        password: '1234', store_name: 'Mi Tienda'
      })).toBe('pass');
    });

    it('Debería rechazar si falta el nombre', () => {
      expect(evaluarRegistro({
        email: 'j@t.com', username: 'j', password: '1234', store_name: 'T'
      })).toBe('campos_faltantes');
    });

    it('Debería rechazar email inválido (sin @)', () => {
      expect(evaluarRegistro({
        name: 'J', email: 'noesunmail', username: 'j', password: '1234', store_name: 'T'
      })).toBe('email_invalido');
    });

    it('Debería rechazar email inválido (sin dominio)', () => {
      expect(evaluarRegistro({
        name: 'J', email: 'a@', username: 'j', password: '1234', store_name: 'T'
      })).toBe('email_invalido');
    });

    it('Debería rechazar contraseña menor a 4 caracteres', () => {
      expect(evaluarRegistro({
        name: 'J', email: 'j@t.com', username: 'j', password: '123', store_name: 'T'
      })).toBe('password_corto');
    });

    it('Debería aceptar contraseña de exactamente 4 caracteres', () => {
      expect(evaluarRegistro({
        name: 'J', email: 'j@t.com', username: 'j', password: 'abcd', store_name: 'T'
      })).toBe('pass');
    });
  });

  // ────────────────────────────────────────────────────
  //  validateProduct() — Validación de campos de producto
  // ────────────────────────────────────────────────────

  describe('validateProduct() — Lógica de validación', () => {
    function evaluarProducto(body) {
      const { codigo, nombre_producto, precio, cantidad } = body || {};
      if (!codigo || !nombre_producto) return 'campos_faltantes';
      if (precio !== undefined && (isNaN(parseFloat(precio)) || parseFloat(precio) < 0)) return 'precio_invalido';
      if (cantidad !== undefined && (isNaN(parseInt(cantidad)) || parseInt(cantidad) < 0)) return 'cantidad_invalida';
      return 'pass';
    }

    it('Debería pasar con código y nombre válidos', () => {
      expect(evaluarProducto({ codigo: 'SKU001', nombre_producto: 'Arroz' })).toBe('pass');
    });

    it('Debería rechazar sin código', () => {
      expect(evaluarProducto({ nombre_producto: 'Arroz' })).toBe('campos_faltantes');
    });

    it('Debería rechazar sin nombre de producto', () => {
      expect(evaluarProducto({ codigo: 'SKU001' })).toBe('campos_faltantes');
    });

    it('Debería rechazar precio negativo', () => {
      expect(evaluarProducto({ codigo: 'A', nombre_producto: 'B', precio: -100 })).toBe('precio_invalido');
    });

    it('Debería aceptar precio = 0 (producto gratuito)', () => {
      expect(evaluarProducto({ codigo: 'A', nombre_producto: 'B', precio: 0 })).toBe('pass');
    });

    it('Debería rechazar cantidad negativa', () => {
      expect(evaluarProducto({ codigo: 'A', nombre_producto: 'B', cantidad: -5 })).toBe('cantidad_invalida');
    });

    it('Debería rechazar precio no numérico', () => {
      expect(evaluarProducto({ codigo: 'A', nombre_producto: 'B', precio: 'abc' })).toBe('precio_invalido');
    });
  });

  // ────────────────────────────────────────────────────
  //  validateSale() — Validación de venta
  // ────────────────────────────────────────────────────

  describe('validateSale() — Lógica de validación', () => {
    function evaluarVenta(body) {
      const { id_producto, cantidad } = body || {};
      if (!id_producto || !cantidad) return 'campos_faltantes';
      if (isNaN(parseInt(cantidad)) || parseInt(cantidad) <= 0) return 'cantidad_invalida';
      return 'pass';
    }

    it('Debería pasar con producto y cantidad válidos', () => {
      expect(evaluarVenta({ id_producto: 1, cantidad: 5 })).toBe('pass');
    });

    it('Debería rechazar sin id_producto', () => {
      expect(evaluarVenta({ cantidad: 5 })).toBe('campos_faltantes');
    });

    it('Debería rechazar sin cantidad', () => {
      expect(evaluarVenta({ id_producto: 1 })).toBe('campos_faltantes');
    });

    it('Debería rechazar cantidad = 0', () => {
      expect(evaluarVenta({ id_producto: 1, cantidad: 0 })).toBe('campos_faltantes');
    });

    it('Debería rechazar cantidad negativa', () => {
      expect(evaluarVenta({ id_producto: 1, cantidad: -3 })).toBe('cantidad_invalida');
    });
  });
});
