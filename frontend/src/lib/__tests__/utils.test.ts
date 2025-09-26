import { formatDate, formatDateTime, formatCurrency, formatFileSize } from '../utils'

describe('Utility Functions', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-01-15')
      expect(formatDate(date)).toBe('Jan 15, 2024')
    })

    it('formats date string correctly', () => {
      expect(formatDate('2024-01-15')).toBe('Jan 15, 2024')
    })
  })

  describe('formatDateTime', () => {
    it('formats date and time correctly', () => {
      const date = new Date('2024-01-15T14:30:00')
      const result = formatDateTime(date)
      expect(result).toContain('Jan 15, 2024')
      expect(result).toContain('2:30 PM')
    })
  })

  describe('formatCurrency', () => {
    it('formats currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
      expect(formatCurrency(0)).toBe('$0.00')
      expect(formatCurrency(1000000)).toBe('$1,000,000.00')
    })
  })

  describe('formatFileSize', () => {
    it('formats file sizes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(1073741824)).toBe('1 GB')
    })

    it('handles decimal file sizes', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB')
      expect(formatFileSize(1572864)).toBe('1.5 MB')
    })
  })
})


