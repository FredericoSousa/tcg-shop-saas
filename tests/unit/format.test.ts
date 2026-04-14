import { describe, it, expect } from 'vitest'
import { formatPhone, unmaskPhone, formatCurrency, parseCurrency, formatDecimal } from '../../src/lib/utils/format'

describe('Formatting Utilities', () => {
  describe('formatPhone', () => {
    it('formats a 11-digit number correctly', () => {
      expect(formatPhone('11987654321')).toBe('(11) 98765-4321')
    })

    it('formats a 10-digit number correctly', () => {
      expect(formatPhone('1187654321')).toBe('(11) 8765-4321')
    })

    it('formats short numbers correctly', () => {
      expect(formatPhone('11')).toBe('11')
      expect(formatPhone('1198')).toBe('(11) 98')
    })

    it('returns empty string for empty input', () => {
      expect(formatPhone('')).toBe('')
      expect(formatPhone(null)).toBe('')
    })
  })

  describe('unmaskPhone', () => {
    it('removes non-numeric characters', () => {
      expect(unmaskPhone('(11) 98765-4321')).toBe('11987654321')
    })
  })

  describe('formatCurrency', () => {
    it('formats a number as BRL currency', () => {
      expect(formatCurrency(1234.56).replace(/\u00a0/g, ' ')).toBe('R$ 1.234,56')
    })

    it('formats a string as BRL currency', () => {
      expect(formatCurrency('1234.56').replace(/\u00a0/g, ' ')).toBe('R$ 1.234,56')
    })

    it('formats a Decimal-like object as BRL currency', () => {
      const d = { toNumber: () => 1234.56 }
      expect(formatCurrency(d as any).replace(/\u00a0/g, ' ')).toBe('R$ 1.234,56')
    })

    it('handles null/undefined/NaN', () => {
      expect(formatCurrency(null)).toBe('R$ 0,00')
      expect(formatCurrency(undefined)).toBe('R$ 0,00')
      expect(formatCurrency(NaN)).toBe('R$ 0,00')
    })

    it('handles custom options (zero decimals)', () => {
      expect(formatCurrency(1234.56, { maximumFractionDigits: 0 }).replace(/\u00a0/g, ' ')).toBe('R$ 1.235')
    })
  })

  describe('parseCurrency', () => {
    it('parses a formatted currency string to a number', () => {
      expect(parseCurrency('R$ 1.234,56')).toBe(1234.56)
    })

    it('handles strings without prefix', () => {
      expect(parseCurrency('1.234,56')).toBe(1234.56)
    })

    it('returns 0 for invalid input', () => {
      expect(parseCurrency('')).toBe(0)
      expect(parseCurrency('abc')).toBe(0)
    })
  })

  describe('formatDecimal', () => {
    it('formats a number correctly', () => {
      expect(formatDecimal(1234.56)).toBe('1.234,56')
    })

    it('formats a string correctly', () => {
      expect(formatDecimal('1234.56')).toBe('1.234,56')
    })

    it('formats a Decimal-like object correctly', () => {
      const d = { toNumber: () => 1234.56 }
      expect(formatDecimal(d as any)).toBe('1.234,56')
    })

    it('handles null/undefined/NaN', () => {
      expect(formatDecimal(null)).toBe('0,00')
      expect(formatDecimal(undefined)).toBe('0,00')
      expect(formatDecimal(NaN)).toBe('0,00')
    })
  })
})
