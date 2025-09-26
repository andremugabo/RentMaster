export interface User {
  id: string
  email: string
  full_name: string
  role: 'ADMIN' | 'MANAGER'
  is_active: boolean
  created_at: string
}

export interface Property {
  id: string
  name: string
  location: string
  description: string
  created_at: string
  locals: Local[]
}

export interface Local {
  id: string
  property_id: string
  reference_code: string
  floor?: string
  unit_type?: string
  size_m2?: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'
  property?: Property
  leases: Lease[]
}

export interface Tenant {
  id: string
  name: string
  type: 'INDIVIDUAL' | 'COMPANY'
  email?: string
  phone?: string
  created_at: string
  leases: Lease[]
}

export interface Lease {
  id: string
  tenant_id: string
  local_id: string
  lease_reference: string
  start_date: string
  end_date?: string
  rent_amount: number
  billing_cycle: 'MONTHLY' | 'QUARTERLY'
  status: 'ACTIVE' | 'TERMINATED'
  tenant: Tenant
  local: Local
  payments: Payment[]
  documents: Document[]
}

export interface Payment {
  id: string
  lease_id: string
  amount: number
  paid_at: string
  payment_mode_id: string
  reference?: string
  status: 'PENDING' | 'COMPLETED'
  lease: Lease
  payment_mode: PaymentMode
  documents: Document[]
}

export interface PaymentMode {
  id: string
  code: string
  display_name: string
  requires_proof: boolean
}

export interface Document {
  id: string
  owner_table: 'LEASES' | 'PAYMENTS'
  owner_id: string
  file_key: string
  filename: string
  doc_type: string
  uploaded_by: string
  uploaded_at: string
  file_url: string
  uploaded_user: {
    id: string
    full_name: string
    email: string
  }
}

export interface DashboardStats {
  totalProperties: number
  totalLocals: number
  availableLocals: number
  occupiedLocals: number
  totalTenants: number
  activeLeases: number
  totalPayments: number
  monthlyRevenue: number
  overduePayments: number
  occupancyRate: number
}

export interface RecentActivity {
  id: string
  action: string
  entity_table: string
  entity_id: string
  user: {
    full_name: string
    email: string
  }
  created_at: string
}

export interface PaymentTrend {
  date: string
  amount: number
  count: number
}

export interface TopProperty {
  id: string
  name: string
  location: string
  totalRevenue: number
  localsCount: number
  occupiedLocals: number
}

export interface DashboardData {
  stats: DashboardStats
  recentActivities: RecentActivity[]
  paymentTrends: PaymentTrend[]
  topProperties: TopProperty[]
}

export interface RevenueReport {
  revenueData: Array<{
    period: string
    amount: number
    count: number
  }>
  revenueByPaymentMode: Array<{
    payment_mode: string
    amount: number
    count: number
  }>
  totalRevenue: number
  totalTransactions: number
}

export interface OccupancyReport {
  properties: Array<{
    propertyId: string
    propertyName: string
    location: string
    totalLocals: number
    occupiedLocals: number
    availableLocals: number
    maintenanceLocals: number
    occupancyRate: number
    activeLeases: number
  }>
  overallStats: {
    totalProperties: number
    totalLocals: number
    totalOccupied: number
    totalAvailable: number
    totalMaintenance: number
    overallOccupancyRate: number
  }
}

export interface ApiResponse<T> {
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
