import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/reports/export/route'
import { prisma, cleanupDatabase, createTestTenant, createTestUser } from '../setup/test-db'
import { ReportType } from '@prisma/client'

// Mock auth helpers
jest.mock('@/lib/auth-helpers', () => ({
  requireTenantForDashboard: jest.fn(),
}))

// Mock premium features
jest.mock('@/lib/premium-features', () => ({
  PremiumFeatureService: {
    hasFeatureAccess: jest.fn(),
  },
}))

// Mock report generator
jest.mock('@/services/report-generator.service', () => ({
  reportGeneratorService: {
    generateReport: jest.fn(),
  },
}))

// Mock logger
jest.mock('@/lib/logger', () => ({
  apiLogger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}))

describe('Report Export API', () => {
  let tenant: any
  let user: any
  const mockRequireTenant = require('@/lib/auth-helpers').requireTenantForDashboard
  const mockPremiumFeature = require('@/lib/premium-features').PremiumFeatureService
  const mockReportGenerator = require('@/services/report-generator.service').reportGeneratorService

  const mockReportData = {
    title: 'Financial Summary Report',
    headers: ['Date', 'Type', 'Amount', 'Description'],
    rows: [
      ['2024-01-01', 'Income', '$1000', 'Payment received'],
      ['2024-01-02', 'Expense', '$500', 'Maintenance'],
    ],
    metadata: {
      'Generated': '2024-01-15',
      'Period': 'January 2024',
    },
  }

  beforeEach(async () => {
    await cleanupDatabase()

    tenant = await createTestTenant({
      name: 'Test Company',
      plan: 'BASIC',
    })

    user = await createTestUser({
      tenantId: tenant.id,
      email: 'user@example.com',
    })

    // Default mock implementations
    mockRequireTenant.mockResolvedValue({ tenantId: tenant.id })
    mockPremiumFeature.hasFeatureAccess.mockResolvedValue({ allowed: true })
    mockReportGenerator.generateReport.mockResolvedValue(mockReportData)
  })

  afterEach(async () => {
    await cleanupDatabase()
    jest.clearAllMocks()
  })

  describe('POST /api/reports/export', () => {
    it('should export report as PDF successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/export', {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'FINANCIAL_SUMMARY',
          format: 'pdf',
          data: {},
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/pdf')
      expect(response.headers.get('Content-Disposition')).toContain('attachment')
      expect(response.headers.get('Content-Disposition')).toContain('.pdf')
    })

    it('should export report as CSV successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/export', {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'FINANCIAL_SUMMARY',
          format: 'csv',
          data: {},
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/csv')
      expect(response.headers.get('Content-Disposition')).toContain('attachment')
      expect(response.headers.get('Content-Disposition')).toContain('.csv')

      // Verify CSV content
      const content = await response.text()
      expect(content).toContain('Date,Type,Amount,Description')
      expect(content).toContain('2024-01-01,Income,$1000,Payment received')
    })

    it('should export report as Excel successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/export', {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'FINANCIAL_SUMMARY',
          format: 'excel',
          data: {},
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      expect(response.headers.get('Content-Disposition')).toContain('attachment')
      expect(response.headers.get('Content-Disposition')).toContain('.xlsx')
    })

    it('should accept xlsx as format alias for excel', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/export', {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'FINANCIAL_SUMMARY',
          format: 'xlsx',
          data: {},
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
    })

    it('should reject export without premium feature access', async () => {
      mockPremiumFeature.hasFeatureAccess.mockResolvedValue({
        allowed: false,
        reason: 'Report export requires BASIC plan or higher',
        suggestedPlan: 'BASIC',
        upgradeMessage: 'Please upgrade to access report export',
      })

      const request = new NextRequest('http://localhost:3000/api/reports/export', {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'FINANCIAL_SUMMARY',
          format: 'pdf',
          data: {},
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBeDefined()
      expect(data.suggestedPlan).toBe('BASIC')
    })

    it('should reject export without report type', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/export', {
        method: 'POST',
        body: JSON.stringify({
          format: 'pdf',
          data: {},
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Report type and format are required')
    })

    it('should reject export without format', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/export', {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'FINANCIAL_SUMMARY',
          data: {},
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Report type and format are required')
    })

    it('should reject invalid report type', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/export', {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'INVALID_TYPE',
          format: 'pdf',
          data: {},
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Invalid report type')
    })

    it('should reject unsupported export format', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/export', {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'FINANCIAL_SUMMARY',
          format: 'docx',
          data: {},
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Unsupported format')
      expect(data.error).toContain('Use pdf, csv, or excel')
    })

    it('should handle CSV escaping for special characters', async () => {
      mockReportGenerator.generateReport.mockResolvedValue({
        title: 'Test Report',
        headers: ['Name', 'Description'],
        rows: [
          ['John, Doe', 'Test "quoted" value'],
          ['Company\nName', 'Value with\nnewline'],
        ],
      })

      const request = new NextRequest('http://localhost:3000/api/reports/export', {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'FINANCIAL_SUMMARY',
          format: 'csv',
          data: {},
        }),
      })

      const response = await POST(request)
      const content = await response.text()

      // Check that commas and quotes are properly escaped
      expect(content).toContain('"John, Doe"')
      expect(content).toContain('"Test ""quoted"" value"')
      expect(content).toContain('"Company\nName"')
    })

    it('should pass filters to report generator', async () => {
      const filters = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      }

      const request = new NextRequest('http://localhost:3000/api/reports/export', {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'FINANCIAL_SUMMARY',
          format: 'pdf',
          data: { filters },
        }),
      })

      await POST(request)

      expect(mockReportGenerator.generateReport).toHaveBeenCalledWith(
        tenant.id,
        'FINANCIAL_SUMMARY',
        filters
      )
    })

    it('should generate filename with timestamp', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/export', {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'FINANCIAL_SUMMARY',
          format: 'pdf',
          data: {},
        }),
      })

      const response = await POST(request)
      const disposition = response.headers.get('Content-Disposition')

      expect(disposition).toMatch(/Financial_Summary_Report_\d+\.pdf/)
    })

    it('should set correct Content-Length header', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/export', {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'FINANCIAL_SUMMARY',
          format: 'csv',
          data: {},
        }),
      })

      const response = await POST(request)
      const contentLength = response.headers.get('Content-Length')

      expect(contentLength).toBeDefined()
      expect(Number(contentLength)).toBeGreaterThan(0)
    })

    it('should handle all valid report types', async () => {
      const reportTypes = [
        'FINANCIAL_SUMMARY',
        'VEHICLE_PERFORMANCE',
        'DRIVER_PERFORMANCE',
        'MAINTENANCE_SUMMARY',
        'REMITTANCE_SUMMARY',
      ]

      for (const reportType of reportTypes) {
        const request = new NextRequest('http://localhost:3000/api/reports/export', {
          method: 'POST',
          body: JSON.stringify({
            reportType,
            format: 'pdf',
            data: {},
          }),
        })

        const response = await POST(request)
        expect(response.status).toBe(200)
      }

      expect(mockReportGenerator.generateReport).toHaveBeenCalledTimes(reportTypes.length)
    })

    it('should log export attempts', async () => {
      const mockLogger = require('@/lib/logger').apiLogger

      const request = new NextRequest('http://localhost:3000/api/reports/export', {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'FINANCIAL_SUMMARY',
          format: 'pdf',
          data: {},
        }),
      })

      await POST(request)

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: tenant.id,
          reportType: 'FINANCIAL_SUMMARY',
          format: 'pdf',
        }),
        'Generating report export'
      )
    })
  })
})
