// Super Admin API utility functions

const API_BASE = '/api/superadmin';

class SuperAdminAPI {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  // Authentication
  async login(email: string, password: string, rememberDevice: boolean = false) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberDevice }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Dashboard
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  async getDashboardCharts(period: string = '12') {
    return this.request(`/dashboard/charts?period=${period}`);
  }

  async getDashboardAlerts() {
    return this.request('/dashboard/alerts');
  }

  async getDashboardActivity(limit: number = 10) {
    return this.request(`/dashboard/activity?limit=${limit}`);
  }

  // Tenants
  async getTenants(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    plan?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    
    return this.request(`/tenants?${searchParams.toString()}`);
  }

  async getTenant(id: string) {
    return this.request(`/tenants/${id}`);
  }

  async createTenant(data: {
    name: string;
    email: string;
    phone?: string;
    plan?: string;
    status?: string;
  }) {
    return this.request('/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTenant(id: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    plan?: string;
    status?: string;
  }) {
    return this.request(`/tenants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTenant(id: string) {
    return this.request(`/tenants/${id}`, {
      method: 'DELETE',
    });
  }

  // Users
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    tenantId?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    
    return this.request(`/users?${searchParams.toString()}`);
  }

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role: string;
    tenantId?: string;
  }) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // System Health
  async getSystemHealth() {
    return this.request('/system/health');
  }

  // Billing
  async getBillingOverview(period: string = '30') {
    return this.request(`/billing/overview?period=${period}`);
  }

  // Audit Logs
  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    search?: string;
    action?: string;
    severity?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    
    return this.request(`/audit/logs?${searchParams.toString()}`);
  }
}

export const superAdminAPI = new SuperAdminAPI();