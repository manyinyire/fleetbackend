import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import { SuperAdminDashboard } from '@/components/superadmin/dashboard/super-admin-dashboard'

// Mock the Super Admin API
jest.mock('@/lib/superadmin-api', () => ({
  superAdminAPI: {
    getDashboardStats: jest.fn(),
    getDashboardCharts: jest.fn(),
    getDashboardAlerts: jest.fn(),
    getDashboardActivity: jest.fn(),
  },
}))

describe('Super Admin Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render dashboard with loading state initially', () => {
    const mockAPI = require('@/lib/superadmin-api').superAdminAPI
    mockAPI.getDashboardStats.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

    render(<SuperAdminDashboard />)

    expect(screen.getByText(/loading dashboard data.../i)).toBeInTheDocument()
  })

  it('should render KPI cards when data is loaded', async () => {
    const mockAPI = require('@/lib/superadmin-api').superAdminAPI
    const mockStats = {
      totalTenants: 150,
      activeUsers: 1250,
      mrr: 45000,
      churnRate: 2.5,
      changes: {
        totalTenants: 12,
        activeUsers: 85,
        mrr: 3200,
        churnRate: -0.5
      }
    }

    mockAPI.getDashboardStats.mockResolvedValue(mockStats)
    mockAPI.getDashboardCharts.mockResolvedValue({})
    mockAPI.getDashboardAlerts.mockResolvedValue([])
    mockAPI.getDashboardActivity.mockResolvedValue({})

    render(<SuperAdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument()
      expect(screen.getByText('1,250')).toBeInTheDocument()
      expect(screen.getByText('$45,000')).toBeInTheDocument()
      expect(screen.getByText('2.5%')).toBeInTheDocument()
    })

    expect(screen.getByText(/total tenants/i)).toBeInTheDocument()
    expect(screen.getByText(/active users/i)).toBeInTheDocument()
    expect(screen.getByText(/monthly recurring revenue/i)).toBeInTheDocument()
    expect(screen.getByText(/churn rate/i)).toBeInTheDocument()
  })

  it('should render alerts section', async () => {
    const mockAPI = require('@/lib/superadmin-api').superAdminAPI
    const mockAlerts = [
      {
        id: '1',
        type: 'system_health',
        title: 'High CPU Usage',
        message: 'Server CPU usage is above 90%',
        severity: 'warning',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        type: 'security',
        title: 'Failed Login Attempts',
        message: 'Multiple failed login attempts detected',
        severity: 'critical',
        timestamp: new Date().toISOString()
      }
    ]

    mockAPI.getDashboardStats.mockResolvedValue({})
    mockAPI.getDashboardCharts.mockResolvedValue({})
    mockAPI.getDashboardAlerts.mockResolvedValue(mockAlerts)
    mockAPI.getDashboardActivity.mockResolvedValue({})

    render(<SuperAdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/system alerts/i)).toBeInTheDocument()
      expect(screen.getByText(/high cpu usage/i)).toBeInTheDocument()
      expect(screen.getByText(/failed login attempts/i)).toBeInTheDocument()
    })
  })

  it('should render recent activity section', async () => {
    const mockAPI = require('@/lib/superadmin-api').superAdminAPI
    const mockActivity = {
      signups: [
        {
          id: '1',
          tenantName: 'New Company',
          plan: 'PREMIUM',
          timestamp: new Date().toISOString()
        }
      ],
      paymentFailures: [
        {
          id: '1',
          tenantName: 'Company A',
          amount: 500,
          timestamp: new Date().toISOString()
        }
      ],
      supportTickets: [
        {
          id: '1',
          subject: 'Login Issue',
          priority: 'high',
          timestamp: new Date().toISOString()
        }
      ],
      activityFeed: [
        {
          id: '1',
          action: 'TENANT_CREATED',
          details: 'New tenant created',
          timestamp: new Date().toISOString()
        }
      ]
    }

    mockAPI.getDashboardStats.mockResolvedValue({})
    mockAPI.getDashboardCharts.mockResolvedValue({})
    mockAPI.getDashboardAlerts.mockResolvedValue([])
    mockAPI.getDashboardActivity.mockResolvedValue(mockActivity)

    render(<SuperAdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/recent activity/i)).toBeInTheDocument()
      expect(screen.getByText(/new company/i)).toBeInTheDocument()
      expect(screen.getByText(/company a/i)).toBeInTheDocument()
      expect(screen.getByText(/login issue/i)).toBeInTheDocument()
    })
  })

  it('should handle API errors gracefully', async () => {
    const mockAPI = require('@/lib/superadmin-api').superAdminAPI
    mockAPI.getDashboardStats.mockRejectedValue(new Error('API Error'))

    render(<SuperAdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/error loading dashboard data/i)).toBeInTheDocument()
    })
  })

  it('should display change indicators for KPI cards', async () => {
    const mockAPI = require('@/lib/superadmin-api').superAdminAPI
    const mockStats = {
      totalTenants: 150,
      activeUsers: 1250,
      mrr: 45000,
      churnRate: 2.5,
      changes: {
        totalTenants: 12,
        activeUsers: 85,
        mrr: 3200,
        churnRate: -0.5
      }
    }

    mockAPI.getDashboardStats.mockResolvedValue(mockStats)
    mockAPI.getDashboardCharts.mockResolvedValue({})
    mockAPI.getDashboardAlerts.mockResolvedValue([])
    mockAPI.getDashboardActivity.mockResolvedValue({})

    render(<SuperAdminDashboard />)

    await waitFor(() => {
      // Check for positive change indicators
      expect(screen.getByText('+12')).toBeInTheDocument()
      expect(screen.getByText('+85')).toBeInTheDocument()
      expect(screen.getByText('+$3,200')).toBeInTheDocument()
      
      // Check for negative change indicator
      expect(screen.getByText('-0.5%')).toBeInTheDocument()
    })
  })

  it('should render empty states when no data', async () => {
    const mockAPI = require('@/lib/superadmin-api').superAdminAPI
    mockAPI.getDashboardStats.mockResolvedValue({
      totalTenants: 0,
      activeUsers: 0,
      mrr: 0,
      churnRate: 0,
      changes: { totalTenants: 0, activeUsers: 0, mrr: 0, churnRate: 0 }
    })
    mockAPI.getDashboardCharts.mockResolvedValue({})
    mockAPI.getDashboardAlerts.mockResolvedValue([])
    mockAPI.getDashboardActivity.mockResolvedValue({
      signups: [],
      paymentFailures: [],
      supportTickets: [],
      activityFeed: []
    })

    render(<SuperAdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument()
      expect(screen.getByText(/no alerts/i)).toBeInTheDocument()
      expect(screen.getByText(/no recent activity/i)).toBeInTheDocument()
    })
  })
})