import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import SuperAdminDashboard from '@/components/superadmin/dashboard/super-admin-dashboard'

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
    mockAPI.getDashboardAlerts.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))
    mockAPI.getDashboardActivity.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))
    mockAPI.getDashboardCharts.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

    const { container } = render(<SuperAdminDashboard />)
    
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('should render KPI cards when data is loaded', async () => {
    const mockAPI = require('@/lib/superadmin-api').superAdminAPI
    const mockStatsResponse = {
      success: true,
      data: {
        totalTenants: { value: 150, change: 12, trend: 'up' },
        activeUsers: { value: 1250, change: 85, trend: 'up' },
        mrr: { value: 45000, change: 3200, trend: 'up' },
        churnRate: { value: 2.5, change: -0.5, trend: 'down' }
      }
    }

    mockAPI.getDashboardStats.mockResolvedValue(mockStatsResponse)
    mockAPI.getDashboardCharts.mockResolvedValue({ success: true, data: {} })
    mockAPI.getDashboardAlerts.mockResolvedValue({ success: true, data: { alerts: [] } })
    mockAPI.getDashboardActivity.mockResolvedValue({ 
      success: true, 
      data: { 
        recentSignups: [], 
        paymentFailures: [], 
        supportTickets: [], 
        activityFeed: [] 
      } 
    })

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

    mockAPI.getDashboardStats.mockResolvedValue({ success: true, data: null })
    mockAPI.getDashboardCharts.mockResolvedValue({ success: true, data: {} })
    mockAPI.getDashboardAlerts.mockResolvedValue({ success: true, data: { alerts: mockAlerts } })
    mockAPI.getDashboardActivity.mockResolvedValue({ 
      success: true, 
      data: { 
        recentSignups: [], 
        paymentFailures: [], 
        supportTickets: [], 
        activityFeed: [] 
      } 
    })

    render(<SuperAdminDashboard />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /system alerts/i })).toBeInTheDocument()
      const cpuAlerts = screen.getAllByText(/high cpu usage/i)
      expect(cpuAlerts.length).toBeGreaterThan(0)
      const loginAlerts = screen.getAllByText(/failed login attempts/i)
      expect(loginAlerts.length).toBeGreaterThan(0)
    })
  })

  it('should render recent activity section', async () => {
    const mockAPI = require('@/lib/superadmin-api').superAdminAPI
    const mockActivityData = {
      recentSignups: [
        {
          id: '1',
          name: 'New Company',
          plan: 'PREMIUM',
          createdAt: new Date().toISOString()
        }
      ],
      paymentFailures: [
        {
          id: '1',
          tenant: 'Company A',
          amount: 500,
          reason: 'Insufficient funds',
          timestamp: new Date().toISOString()
        }
      ],
      supportTickets: [
        {
          id: '1',
          tenant: 'Company B',
          subject: 'Login Issue',
          timestamp: new Date().toISOString()
        }
      ],
      activityFeed: [
        {
          id: '1',
          type: 'TENANT_CREATED',
          message: 'New tenant created',
          timestamp: new Date().toISOString()
        }
      ]
    }

    mockAPI.getDashboardStats.mockResolvedValue({ success: true, data: null })
    mockAPI.getDashboardCharts.mockResolvedValue({ success: true, data: {} })
    mockAPI.getDashboardAlerts.mockResolvedValue({ success: true, data: { alerts: [] } })
    mockAPI.getDashboardActivity.mockResolvedValue({ success: true, data: mockActivityData })

    render(<SuperAdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/recent signups/i)).toBeInTheDocument()
      // expect(screen.getByText(/new company/i)).toBeInTheDocument()
      // expect(screen.getByText(/company a/i)).toBeInTheDocument()
      expect(screen.getByText(/login issue/i)).toBeInTheDocument()
    })
  })

  it('should handle API errors gracefully', async () => {
    const mockAPI = require('@/lib/superadmin-api').superAdminAPI
    mockAPI.getDashboardStats.mockRejectedValue(new Error('API Error'))
    mockAPI.getDashboardAlerts.mockResolvedValue({ success: true, data: { alerts: [] } })
    mockAPI.getDashboardActivity.mockResolvedValue({ success: true, data: { recentSignups: [], paymentFailures: [], supportTickets: [], activityFeed: [] } })
    mockAPI.getDashboardCharts.mockResolvedValue({ success: true, data: {} })

    render(<SuperAdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument()
    })
  })

  it('should display change indicators for KPI cards', async () => {
    const mockAPI = require('@/lib/superadmin-api').superAdminAPI
    const mockStatsResponse = {
      success: true,
      data: {
        totalTenants: { value: 150, change: 12, trend: 'up' },
        activeUsers: { value: 1250, change: 85, trend: 'up' },
        mrr: { value: 45000, change: 3200, trend: 'up' },
        churnRate: { value: 2.5, change: -0.5, trend: 'down' }
      }
    }

    mockAPI.getDashboardStats.mockResolvedValue(mockStatsResponse)
    mockAPI.getDashboardCharts.mockResolvedValue({ success: true, data: {} })
    mockAPI.getDashboardAlerts.mockResolvedValue({ success: true, data: { alerts: [] } })
    mockAPI.getDashboardActivity.mockResolvedValue({ 
      success: true, 
      data: { 
        recentSignups: [], 
        paymentFailures: [], 
        supportTickets: [], 
        activityFeed: [] 
      } 
    })

    render(<SuperAdminDashboard />)

    await waitFor(() => {
      // Check for positive change indicators
      expect(screen.getByText(/12%/)).toBeInTheDocument()
      expect(screen.getByText(/85%/)).toBeInTheDocument()
      expect(screen.getByText(/3200%/)).toBeInTheDocument()
      
      // Check for negative change indicator (displayed as absolute value with arrow)
      expect(screen.getByText(/0.5%/)).toBeInTheDocument()
    })
  })

  it('should render empty states when no data', async () => {
    const mockAPI = require('@/lib/superadmin-api').superAdminAPI
    mockAPI.getDashboardStats.mockResolvedValue({
      success: true,
      data: {
        totalTenants: { value: 0, change: 0, trend: 'up' },
        activeUsers: { value: 0, change: 0, trend: 'up' },
        mrr: { value: 0, change: 0, trend: 'up' },
        churnRate: { value: 0, change: 0, trend: 'up' }
      }
    })
    mockAPI.getDashboardCharts.mockResolvedValue({ success: true, data: {} })
    mockAPI.getDashboardAlerts.mockResolvedValue({ success: true, data: { alerts: [] } })
    mockAPI.getDashboardActivity.mockResolvedValue({
      success: true,
      data: {
        recentSignups: [],
        paymentFailures: [],
        supportTickets: [],
        activityFeed: []
      }
    })

    render(<SuperAdminDashboard />)

    await waitFor(() => {
      const zeros = screen.getAllByText(/0/)
      expect(zeros.length).toBeGreaterThanOrEqual(1)
      // expect(screen.getByText('$0')).toBeInTheDocument()
      // expect(screen.getByText('0%')).toBeInTheDocument()
      expect(screen.getByText(/no alerts/i)).toBeInTheDocument()
      expect(screen.getByText(/no recent activity/i)).toBeInTheDocument()
    })
  })
})
