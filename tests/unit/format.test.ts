import { describe, it, expect } from 'vitest'
import { formatPhone, unmaskPhone, formatCurrency, parseCurrency } from '../../src/lib/utils/format'

describe('Formatting Utilities', () => {
  describe('formatPhone', () => {
    it('formats a 10-digit number correctly', () => {
      expect(formatPhone('11987654321')).toBe('(11) 98765-4321')
    })

    it('formats a 9-digit number correctly', () => {
      expect(formatPhone('1187654321')).toBe('(11) 8765-4321')
    })

    it('returns empty string for empty input', () => {
      expect(formatPhone('')).toBe('')
    })
  })

  describe('unmaskPhone', () => {
    it('removes non-numeric characters', () => {
      expect(unmaskPhone('(11) 98765-4321')).toBe('11987654321')
    })
  })

  describe('formatCurrency', () => {
    it('formats a number as BRL currency', () => {
      // Use regex to handle non-breaking spaces if they occur in some environments
      expect(formatCurrency(1234.56).replace(/\u00a0/g, ' ')).toBe('R$ 1.234,56')
    })

    it('formats a Decimal-like object as BRL currency', () => {
      const d = { toNumber: () => 1234.56 }
      expect(formatCurrency(d as any).replace(/\u00a0/g, ' ')).toBe('R$ 1.234,56')
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
  })
})
