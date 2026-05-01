import { describe, it, expect } from 'vitest';
import { evaluarAcceso, evaluarAdmin } from '../../middleware/auth.js';

// === PRUEBAS UNITARIAS ===

describe('Middleware de Seguridad - Lógica auth.js', () => {

  describe('requireLogin', () => {
    it('Debería permitir el paso si hay userId y la sesión es válida', () => {
      const session = { userId: 1 };
      expect(evaluarAcceso(session, true)).toBe('pass');
    });

    it('Debería denegar acceso si no hay sesión', () => {
      expect(evaluarAcceso(null, true)).toBe('no_auth');
    });

    it('Debería denegar acceso si la sesión no tiene userId', () => {
      const session = {};
      expect(evaluarAcceso(session, true)).toBe('no_auth');
    });

    it('Debería detectar sesión concurrente si isSessionValid es false', () => {
      const session = { userId: 1 };
      expect(evaluarAcceso(session, false)).toBe('concurrent');
    });

    it('Debería priorizar no_auth sobre concurrent si no hay userId', () => {
      // Si no hay userId, ni siquiera debería llegar a verificar la concurrencia
      expect(evaluarAcceso({}, false)).toBe('no_auth');
    });
  });

  describe('requireAdmin', () => {
    it('Debería permitir el paso si el rol es Administrador', () => {
      const session = { userId: 1, rol: 'Administrador' };
      expect(evaluarAdmin(session)).toBe('pass');
    });

    it('Debería denegar acceso si el rol es Colaborador', () => {
      const session = { userId: 2, rol: 'Colaborador' };
      expect(evaluarAdmin(session)).toBe('forbidden');
    });

    it('Debería denegar acceso si no hay sesión', () => {
      expect(evaluarAdmin(null)).toBe('forbidden');
    });

    it('Debería denegar acceso si el rol no está definido', () => {
      const session = { userId: 1 };
      expect(evaluarAdmin(session)).toBe('forbidden');
    });
  });
});
