import { describe, it, expect } from 'vitest';

// === PRUEBAS UNITARIAS: Patrón Factory Method + Modelo de Producto ===

const ProductFactory = require('../../models/products/ProductFactory.js');
const ProductBase = require('../../models/products/ProductBase.js');
const PerishableProduct = require('../../models/products/PerishableProduct.js');
const NonPerishableProduct = require('../../models/products/NonPerishableProduct.js');
const DigitalProduct = require('../../models/products/DigitalProduct.js');

describe('Patrón Factory Method (ProductFactory.js)', () => {

  // ────────────────────────────────────────────────────
  //  Factory — Creación polimórfica
  // ────────────────────────────────────────────────────

  describe('ProductFactory.create() — Selector polimórfico', () => {
    it('Debería crear un PerishableProduct cuando tipo es "Perecedero"', () => {
      const prod = ProductFactory.create({ tipo_producto: 'Perecedero', nombre_producto: 'Leche' });
      expect(prod).toBeInstanceOf(PerishableProduct);
    });

    it('Debería crear un NonPerishableProduct cuando tipo es "No Perecedero"', () => {
      const prod = ProductFactory.create({ tipo_producto: 'No Perecedero', nombre_producto: 'Arroz' });
      expect(prod).toBeInstanceOf(NonPerishableProduct);
    });

    it('Debería crear un DigitalProduct cuando tipo es "Digital"', () => {
      const prod = ProductFactory.create({ tipo_producto: 'Digital', nombre_producto: 'Licencia' });
      expect(prod).toBeInstanceOf(DigitalProduct);
    });

    it('Debería crear NonPerishableProduct por defecto si no se pasa tipo', () => {
      const prod = ProductFactory.create({ nombre_producto: 'Genérico' });
      expect(prod).toBeInstanceOf(NonPerishableProduct);
    });

    it('Debería crear NonPerishableProduct para tipos desconocidos (fallback)', () => {
      const prod = ProductFactory.create({ tipo_producto: 'Inventado', nombre_producto: 'X' });
      expect(prod).toBeInstanceOf(NonPerishableProduct);
    });

    it('Todas las instancias deberían heredar de ProductBase', () => {
      const perecedero = ProductFactory.create({ tipo_producto: 'Perecedero', nombre_producto: 'A' });
      const noPerecedero = ProductFactory.create({ tipo_producto: 'No Perecedero', nombre_producto: 'B' });
      const digital = ProductFactory.create({ tipo_producto: 'Digital', nombre_producto: 'C' });

      expect(perecedero).toBeInstanceOf(ProductBase);
      expect(noPerecedero).toBeInstanceOf(ProductBase);
      expect(digital).toBeInstanceOf(ProductBase);
    });
  });

  // ────────────────────────────────────────────────────
  //  ProductBase — Valores por defecto y validate()
  // ────────────────────────────────────────────────────

  describe('ProductBase — Defaults y validación', () => {
    it('Debería aplicar valores por defecto si no se pasan datos', () => {
      const prod = new NonPerishableProduct({});
      const defaults = prod.data;
      expect(defaults.stock_minimo).toBe(5);
      expect(defaults.lead_time).toBe(7);
    });

    it('Debería permitir sobreescribir los defaults con datos del usuario', () => {
      const prod = new NonPerishableProduct({ stock_minimo: 20, lead_time: 14 });
      expect(prod.data.stock_minimo).toBe(20);
      expect(prod.data.lead_time).toBe(14);
    });

    it('validate() debería fallar si no hay nombre de producto', () => {
      const prod = new NonPerishableProduct({ nombre_producto: '' });
      const result = prod.validate();
      expect(result.valid).toBe(false);
      expect(result.error).toContain('nombre');
    });

    it('validate() debería fallar si el precio es negativo', () => {
      const prod = new NonPerishableProduct({ nombre_producto: 'Test', precio: -10 });
      const result = prod.validate();
      expect(result.valid).toBe(false);
      expect(result.error).toContain('precio');
    });

    it('validate() debería pasar con datos válidos', () => {
      const prod = new NonPerishableProduct({ nombre_producto: 'Arroz', precio: 5000 });
      const result = prod.validate();
      expect(result.valid).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────
  //  ProductBase — toDBRecord()
  // ────────────────────────────────────────────────────

  describe('ProductBase.toDBRecord() — Conversión a registro SQL', () => {
    it('Debería convertir precio a float', () => {
      const prod = new NonPerishableProduct({ nombre_producto: 'A', precio: '1500.50' });
      const record = prod.toDBRecord();
      expect(typeof record.precio).toBe('number');
      expect(record.precio).toBe(1500.50);
    });

    it('Debería convertir cantidad a integer', () => {
      const prod = new NonPerishableProduct({ nombre_producto: 'A', cantidad: '25' });
      const record = prod.toDBRecord();
      expect(typeof record.cantidad).toBe('number');
      expect(record.cantidad).toBe(25);
    });

    it('Debería poner id_proveedor como null si no se pasa', () => {
      const prod = new NonPerishableProduct({ nombre_producto: 'A' });
      const record = prod.toDBRecord();
      expect(record.id_proveedor).toBeNull();
    });

    it('Debería convertir id_proveedor a integer si se pasa como string', () => {
      const prod = new NonPerishableProduct({ nombre_producto: 'A', id_proveedor: '5' });
      const record = prod.toDBRecord();
      expect(record.id_proveedor).toBe(5);
    });

    it('Debería usar defaults para stock_minimo y lead_time si no se pasan', () => {
      const prod = new NonPerishableProduct({ nombre_producto: 'A' });
      const record = prod.toDBRecord();
      expect(record.stock_minimo).toBeGreaterThan(0);
      expect(record.lead_time).toBeGreaterThan(0);
    });
  });

  // ────────────────────────────────────────────────────
  //  PerishableProduct — Validaciones específicas
  // ────────────────────────────────────────────────────

  describe('PerishableProduct — Validación de vencimiento', () => {
    it('Debería fallar si falla la validación base (ej. precio negativo)', () => {
      const prod = new PerishableProduct({ nombre_producto: 'Leche', precio: -50, fecha_vencimiento: '2050-01-01' });
      const result = prod.validate();
      expect(result.valid).toBe(false);
      expect(result.error).toContain('precio');
    });

    it('Debería fallar si no tiene fecha de vencimiento', () => {
      const prod = new PerishableProduct({ nombre_producto: 'Leche', precio: 3000 });
      const result = prod.validate();
      expect(result.valid).toBe(false);
      expect(result.error).toContain('vencimiento');
    });

    it('Debería fallar si la fecha de vencimiento es pasada', () => {
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      const prod = new PerishableProduct({
        nombre_producto: 'Leche',
        precio: 3000,
        fecha_vencimiento: ayer.toISOString()
      });
      const result = prod.validate();
      expect(result.valid).toBe(false);
      expect(result.error).toContain('futura');
    });

    it('Debería pasar con fecha de vencimiento futura', () => {
      const futuro = new Date();
      futuro.setDate(futuro.getDate() + 30);
      const prod = new PerishableProduct({
        nombre_producto: 'Leche',
        precio: 3000,
        fecha_vencimiento: futuro.toISOString()
      });
      const result = prod.validate();
      expect(result.valid).toBe(true);
    });

    it('Debería tener defaults diferentes a NonPerishable (stock_minimo más alto)', () => {
      const perecedero = new PerishableProduct({});
      const noPerecedero = new NonPerishableProduct({});
      expect(perecedero.data.stock_minimo).toBeGreaterThan(noPerecedero.data.stock_minimo);
    });

    it('Debería tener lead_time más corto que no perecedero', () => {
      const perecedero = new PerishableProduct({});
      const noPerecedero = new NonPerishableProduct({});
      expect(perecedero.data.lead_time).toBeLessThan(noPerecedero.data.lead_time);
    });
  });

  // ────────────────────────────────────────────────────
  //  DigitalProduct — Características únicas
  // ────────────────────────────────────────────────────

  describe('DigitalProduct — Producto intangible', () => {
    it('Debería tener stock virtualmente infinito por defecto', () => {
      const prod = new DigitalProduct({ nombre_producto: 'Licencia Software' });
      expect(prod.data.cantidad).toBe(999999);
    });

    it('Debería tener lead_time = 0 (entrega inmediata)', () => {
      const prod = new DigitalProduct({});
      expect(prod.data.lead_time).toBe(0);
    });

    it('Debería tener stock_minimo = 0 (no requiere stock físico)', () => {
      const prod = new DigitalProduct({});
      expect(prod.data.stock_minimo).toBe(0);
    });

    it('validate() debería pasar sin fecha de vencimiento', () => {
      const prod = new DigitalProduct({ nombre_producto: 'Licencia', precio: 50000 });
      const result = prod.validate();
      expect(result.valid).toBe(true);
    });

    it('validate() debería fallar sin nombre igual que los demás', () => {
      const prod = new DigitalProduct({ nombre_producto: '', precio: 100 });
      const result = prod.validate();
      expect(result.valid).toBe(false);
    });
  });
});
