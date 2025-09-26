import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { User, Property, Tenant, Lease, Payment, PaymentMode, Document, DashboardData, RevenueReport, OccupancyReport } from '@/types'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      timeout: 10000,
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      if (config.url?.includes('/auth/login') || config.url?.includes('/auth/register')) {
        return config; // don't attach token
      }
    
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    

    // Response interceptor to handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const response: AxiosResponse<{ token: string; user: User }> = await this.client.post('/auth/login', {
      email,
      password,
    })
    return response.data
  }

  async register(data: { email: string; password: string; full_name: string; role: 'ADMIN' | 'MANAGER' }): Promise<User> {
    const response: AxiosResponse<User> = await this.client.post('/auth/register', data)
    return response.data
  }

  async getCurrentUser(): Promise<{ user: User }> {
    const response: AxiosResponse<{ user: User }> = await this.client.get('/auth/me')
    return response.data
  }

  // Property endpoints
  async getProperties(): Promise<Property[]> {
    const response: AxiosResponse<Property[]> = await this.client.get('/properties')
    return response.data
  }

  async getProperty(id: string): Promise<Property> {
    const response: AxiosResponse<Property> = await this.client.get(`/properties/${id}`)
    return response.data
  }

  async createProperty(data: { name: string; location: string; description?: string }): Promise<Property> {
    const response: AxiosResponse<Property> = await this.client.post('/properties', data)
    return response.data
  }

  async updateProperty(id: string, data: { name: string; location: string; description?: string }): Promise<Property> {
    const response: AxiosResponse<Property> = await this.client.put(`/properties/${id}`, data)
    return response.data
  }

  async deleteProperty(id: string): Promise<void> {
    await this.client.delete(`/properties/${id}`)
  }

  async createLocal(propertyId: string, data: {
    reference_code: string
    floor?: string
    unit_type?: string
    size_m2?: number
    status?: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'
  }): Promise<any> {
    const response = await this.client.post(`/properties/${propertyId}/locals`, data)
    return response.data
  }

  async updateLocal(id: string, data: {
    reference_code: string
    floor?: string
    unit_type?: string
    size_m2?: number
    status?: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'
  }): Promise<any> {
    const response = await this.client.put(`/properties/locals/${id}`, data)
    return response.data
  }

  async deleteLocal(id: string): Promise<void> {
    await this.client.delete(`/properties/locals/${id}`)
  }

  // Tenant endpoints
  async getTenants(params?: { search?: string; type?: 'INDIVIDUAL' | 'COMPANY' }): Promise<Tenant[]> {
    const response: AxiosResponse<Tenant[]> = await this.client.get('/tenants', { params })
    return response.data
  }

  async getTenant(id: string): Promise<Tenant> {
    const response: AxiosResponse<Tenant> = await this.client.get(`/tenants/${id}`)
    return response.data
  }

  async createTenant(data: { name: string; type: 'INDIVIDUAL' | 'COMPANY'; email?: string; phone?: string }): Promise<Tenant> {
    const response: AxiosResponse<Tenant> = await this.client.post('/tenants', data)
    return response.data
  }

  async updateTenant(id: string, data: { name: string; type: 'INDIVIDUAL' | 'COMPANY'; email?: string; phone?: string }): Promise<Tenant> {
    const response: AxiosResponse<Tenant> = await this.client.put(`/tenants/${id}`, data)
    return response.data
  }

  async deleteTenant(id: string): Promise<void> {
    await this.client.delete(`/tenants/${id}`)
  }

  // Lease endpoints
  async getLeases(params?: { status?: 'ACTIVE' | 'TERMINATED'; tenant_id?: string; local_id?: string }): Promise<Lease[]> {
    const response: AxiosResponse<Lease[]> = await this.client.get('/leases', { params })
    return response.data
  }

  async getLease(id: string): Promise<Lease> {
    const response: AxiosResponse<Lease> = await this.client.get(`/leases/${id}`)
    return response.data
  }

  async createLease(data: {
    tenant_id: string
    local_id: string
    lease_reference: string
    start_date: string
    end_date?: string
    rent_amount: number
    billing_cycle: 'MONTHLY' | 'QUARTERLY'
  }): Promise<Lease> {
    const response: AxiosResponse<Lease> = await this.client.post('/leases', data)
    return response.data
  }

  async updateLease(id: string, data: {
    lease_reference: string
    start_date: string
    end_date?: string
    rent_amount: number
    billing_cycle: 'MONTHLY' | 'QUARTERLY'
    status: 'ACTIVE' | 'TERMINATED'
  }): Promise<Lease> {
    const response: AxiosResponse<Lease> = await this.client.put(`/leases/${id}`, data)
    return response.data
  }

  async terminateLease(id: string, terminationDate?: string): Promise<Lease> {
    const response: AxiosResponse<Lease> = await this.client.post(`/leases/${id}/terminate`, {
      termination_date: terminationDate,
    })
    return response.data
  }

  // Payment endpoints
  async getPayments(params?: {
    lease_id?: string
    status?: 'PENDING' | 'COMPLETED'
    payment_mode_id?: string
    start_date?: string
    end_date?: string
  }): Promise<Payment[]> {
    const response: AxiosResponse<Payment[]> = await this.client.get('/payments', { params })
    return response.data
  }

  async getPayment(id: string): Promise<Payment> {
    const response: AxiosResponse<Payment> = await this.client.get(`/payments/${id}`)
    return response.data
  }

  async createPayment(data: {
    lease_id: string
    amount: number
    payment_mode_id: string
    reference?: string
    status?: 'PENDING' | 'COMPLETED'
  }): Promise<Payment> {
    const response: AxiosResponse<Payment> = await this.client.post('/payments', data)
    return response.data
  }

  async updatePayment(id: string, data: {
    amount: number
    payment_mode_id: string
    reference?: string
    status: 'PENDING' | 'COMPLETED'
  }): Promise<Payment> {
    const response: AxiosResponse<Payment> = await this.client.put(`/payments/${id}`, data)
    return response.data
  }

  async deletePayment(id: string): Promise<void> {
    await this.client.delete(`/payments/${id}`)
  }

  async getPaymentModes(): Promise<PaymentMode[]> {
    const response: AxiosResponse<PaymentMode[]> = await this.client.get('/payments/modes')
    return response.data
  }

  // Document endpoints
  async getDocuments(params?: { owner_table?: 'LEASES' | 'PAYMENTS'; owner_id?: string }): Promise<Document[]> {
    const response: AxiosResponse<Document[]> = await this.client.get('/documents', { params })
    return response.data
  }

  async getDocument(id: string): Promise<Document> {
    const response: AxiosResponse<Document> = await this.client.get(`/documents/${id}`)
    return response.data
  }

  async uploadDocument(formData: FormData): Promise<Document> {
    const response: AxiosResponse<Document> = await this.client.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  async deleteDocument(id: string): Promise<void> {
    await this.client.delete(`/documents/${id}`)
  }

  async downloadDocument(id: string): Promise<Blob> {
    const response = await this.client.get(`/documents/${id}/download`, {
      responseType: 'blob',
    })
    return response.data
  }

  // Dashboard endpoints
  async getDashboardStats(): Promise<DashboardData> {
    const response: AxiosResponse<DashboardData> = await this.client.get('/dashboard/stats')
    return response.data
  }

  async getRevenueReport(params?: {
    start_date?: string
    end_date?: string
    group_by?: 'day' | 'month'
  }): Promise<RevenueReport> {
    const response: AxiosResponse<RevenueReport> = await this.client.get('/dashboard/revenue', { params })
    return response.data
  }

  async getOccupancyReport(): Promise<OccupancyReport> {
    const response: AxiosResponse<OccupancyReport> = await this.client.get('/dashboard/occupancy')
    return response.data
  }
}

export const apiClient = new ApiClient()

