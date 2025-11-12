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
  async login(email: string, password: string, rememberDevice: boolean = false, otp?: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberDevice, otp }),
    });
  }

  // 2FA OTP
  async sendOTP(email: string) {
    const response = await fetch('/api/auth/send-verification-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type: 'sign-in' }),
    });
    return response.json();
  }

  async verifyOTP(email: string, otp: string) {
    const response = await fetch('/api/auth/check-verification-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type: 'sign-in', otp }),
    });
    return response.json();
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

  async getAnalyticsSummary(range: string = '30d') {
    const params = new URLSearchParams();
    if (range) {
      params.append('range', range);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/analytics/summary${query}`);
  }

  async getErrorLogs(params: {
    search?: string;
    level?: string;
    source?: string;
    range?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, value.toString());
      }
    });
    const query = searchParams.toString();
    return this.request(`/error-logs${query ? `?${query}` : ""}`);
  }

  async getPerformanceMetrics(range: string = '24h') {
    const params = new URLSearchParams();
    if (range) {
      params.append('range', range);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/performance/metrics${query}`);
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

  async getSubscriptions(params: {
    search?: string;
    status?: string;
    plan?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, value.toString());
      }
    });
    const query = searchParams.toString();
    return this.request(`/subscriptions${query ? `?${query}` : ""}`);
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

  // Users (using BetterAuth admin plugin)
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

  async updateUser(userId: string, data: Record<string, any>) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(userId: string) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async banUser(userId: string, banReason?: string, banExpiresIn?: number) {
    return this.request(`/users/${userId}/ban`, {
      method: 'POST',
      body: JSON.stringify({ banReason, banExpiresIn }),
    });
  }

  async unbanUser(userId: string) {
    return this.request(`/users/${userId}/unban`, {
      method: 'POST',
    });
  }

  async setUserRole(userId: string, role: string | string[]) {
    return this.request(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async setUserPassword(userId: string, newPassword: string) {
    return this.request(`/users/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    });
  }

  async getUserSessions(userId: string) {
    return this.request(`/users/${userId}/sessions`);
  }

  async revokeUserSessions(userId: string) {
    return this.request(`/users/${userId}/sessions`, {
      method: 'DELETE',
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

  // Invoices
  async getInvoices(params: {
    page?: number;
    limit?: number;
    status?: string;
    tenantId?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    
    return this.request(`/invoices?${searchParams.toString()}`);
  }

  async retryPayment(invoiceId: string) {
    return this.request(`/invoices/${invoiceId}/retry`, {
      method: 'POST'
    });
  }

  // Impersonation
  async impersonateTenant(tenantId: string, reason: string) {
    return this.request(`/tenants/${tenantId}/impersonate`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  async stopImpersonation() {
    return this.request('/impersonation/stop', {
      method: 'POST'
    });
  }

  // Settings
  async getSettings() {
    return this.request('/settings');
  }

  async updateSettings(data: any) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Security
  async getSecuritySettings() {
    return this.request('/security');
  }

  async updateSecuritySettings(data: any) {
    return this.request('/security', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Admin Users
  async getAdminUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    return this.request(`/admin-users?${searchParams.toString()}`);
  }

  async createAdminUser(data: {
    name: string;
    email: string;
    password: string;
    role: string;
    tenantId?: string;
  }) {
    return this.request('/admin-users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteAdminUser(userId: string) {
    return this.request(`/admin-users?userId=${userId}`, {
      method: 'DELETE',
    });
  }

  // Email Templates
  async getEmailTemplates(params: {
    category?: string;
    search?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    return this.request(`/email-templates?${searchParams.toString()}`);
  }

  async saveEmailTemplate(data: any) {
    return this.request('/email-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async seedEmailTemplates() {
    return this.request('/email-templates', {
      method: 'PUT',
    });
  }

  async deleteEmailTemplate(templateId: string) {
    return this.request(`/email-templates?id=${templateId}`, {
      method: 'DELETE',
    });
  }

  // Notifications
  async getNotifications(params: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    return this.request(`/notifications?${searchParams.toString()}`);
  }

  async sendNotification(data: {
    title: string;
    message: string;
    recipients: string;
    type?: string;
    userIds?: string[];
    tenantIds?: string[];
    link?: string;
    metadata?: any;
  }) {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteNotification(notificationId: string) {
    return this.request(`/notifications?id=${notificationId}`, {
      method: 'DELETE',
    });
  }

  async deleteOldNotifications() {
    return this.request('/notifications?bulk=deleteOld', {
      method: 'DELETE',
    });
  }

  // Search
  async search(query: string, type: string = 'all', limit: number = 10) {
    const searchParams = new URLSearchParams({
      q: query,
      type,
      limit: limit.toString(),
    });

    return this.request(`/search?${searchParams.toString()}`);
  }
}

export const superAdminAPI = new SuperAdminAPI();