import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Calendar,
  DollarSign,
  Users,
  Building2,
  Home,
  FileText,
  Loader2,
  Filter,
  Download
} from 'lucide-react'
import { formatDate, formatCurrency, formatDateTime } from '@/lib/utils'
import { Payment, Lease, PaymentMode } from '@/types'

const paymentSchema = z.object({
  lease_id: z.string().min(1, 'Please select a lease'),
  amount: z.number().positive('Amount must be positive'),
  payment_mode_id: z.string().min(1, 'Please select a payment method'),
  reference: z.string().optional(),
  status: z.enum(['PENDING', 'COMPLETED']).default('COMPLETED'),
})

type PaymentForm = z.infer<typeof paymentSchema>

export function PaymentsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [leaseFilter, setLeaseFilter] = useState<string>('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', { status: statusFilter, lease_id: leaseFilter, start_date: dateRange.start, end_date: dateRange.end }],
    queryFn: () => apiClient.getPayments({ 
      status: statusFilter as 'PENDING' | 'COMPLETED' || undefined,
      lease_id: leaseFilter || undefined,
      start_date: dateRange.start || undefined,
      end_date: dateRange.end || undefined,
    }),
  })

  const { data: leases } = useQuery({
    queryKey: ['leases'],
    queryFn: () => apiClient.getLeases({ status: 'ACTIVE' }),
  })

  const { data: paymentModes } = useQuery({
    queryKey: ['payment-modes'],
    queryFn: () => apiClient.getPaymentModes(),
  })

  const createPaymentMutation = useMutation({
    mutationFn: (data: PaymentForm) => apiClient.createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast({ title: 'Payment recorded successfully' })
      setIsDialogOpen(false)
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to record payment', 
        description: error.response?.data?.message,
        variant: 'destructive'
      })
    },
  })

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PaymentForm }) => 
      apiClient.updatePayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast({ title: 'Payment updated successfully' })
      setIsDialogOpen(false)
      setEditingPayment(null)
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to update payment', 
        description: error.response?.data?.message,
        variant: 'destructive'
      })
    },
  })

  const deletePaymentMutation = useMutation({
    mutationFn: (id: string) => apiClient.deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast({ title: 'Payment deleted successfully' })
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to delete payment', 
        description: error.response?.data?.message,
        variant: 'destructive'
      })
    },
  })

  const form = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      lease_id: '',
      amount: 0,
      payment_mode_id: '',
      reference: '',
      status: 'COMPLETED',
    },
  })

  const handleSubmit = (data: PaymentForm) => {
    if (editingPayment) {
      updatePaymentMutation.mutate({ id: editingPayment.id, data })
    } else {
      createPaymentMutation.mutate(data)
    }
  }

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment)
    form.reset({
      lease_id: payment.lease_id,
      amount: payment.amount,
      payment_mode_id: payment.payment_mode_id,
      reference: payment.reference || '',
      status: payment.status,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (payment: Payment) => {
    if (confirm(`Are you sure you want to delete this payment of ${formatCurrency(payment.amount)}?`)) {
      deletePaymentMutation.mutate(payment.id)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredPayments = payments?.filter(payment => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      payment.reference?.toLowerCase().includes(searchLower) ||
      payment.lease.tenant.name.toLowerCase().includes(searchLower) ||
      payment.lease.lease_reference.toLowerCase().includes(searchLower) ||
      payment.lease.local.reference_code.toLowerCase().includes(searchLower) ||
      payment.payment_mode.display_name.toLowerCase().includes(searchLower)
    )
  })

  const totalAmount = filteredPayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">
            Track and manage rental payments
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingPayment(null)
              form.reset()
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPayment ? 'Edit Payment' : 'Record New Payment'}
              </DialogTitle>
              <DialogDescription>
                {editingPayment ? 'Update payment information' : 'Record a new rental payment'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lease_id">Lease</Label>
                <Select
                  value={form.watch('lease_id')}
                  onValueChange={(value) => form.setValue('lease_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lease" />
                  </SelectTrigger>
                  <SelectContent>
                    {leases?.map((lease) => (
                      <SelectItem key={lease.id} value={lease.id}>
                        {lease.lease_reference} - {lease.tenant.name} ({lease.local.reference_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.lease_id && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.lease_id.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    {...form.register('amount', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                  {form.formState.errors.amount && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.amount.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_mode_id">Payment Method</Label>
                  <Select
                    value={form.watch('payment_mode_id')}
                    onValueChange={(value) => form.setValue('payment_mode_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentModes?.map((mode) => (
                        <SelectItem key={mode.id} value={mode.id}>
                          {mode.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.payment_mode_id && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.payment_mode_id.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reference">Reference (Optional)</Label>
                  <Input
                    id="reference"
                    {...form.register('reference')}
                    placeholder="Payment reference number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.watch('status')}
                    onValueChange={(value) => form.setValue('status', value as 'PENDING' | 'COMPLETED')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createPaymentMutation.isPending || updatePaymentMutation.isPending}>
                  {createPaymentMutation.isPending || updatePaymentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {editingPayment ? 'Update' : 'Record'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPayments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {statusFilter ? `Filtered by ${statusFilter.toLowerCase()}` : 'All payments'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {statusFilter ? `Filtered by ${statusFilter.toLowerCase()}` : 'All payments'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredPayments?.filter(p => p.status === 'COMPLETED').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Completed payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={leaseFilter} onValueChange={setLeaseFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by lease" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Leases</SelectItem>
                {leases?.map((lease) => (
                  <SelectItem key={lease.id} value={lease.id}>
                    {lease.lease_reference}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="Start date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
              <Input
                type="date"
                placeholder="End date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payments ({filteredPayments?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPayments && filteredPayments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Lease</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.reference || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{payment.lease.lease_reference}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Home className="h-3 w-3" />
                          <span>{payment.lease.local.reference_code}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{payment.lease.tenant.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formatCurrency(payment.amount)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.payment_mode.display_name}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(payment.paid_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(payment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(payment)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No payments found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter || leaseFilter || dateRange.start || dateRange.end
                  ? 'No payments match your search criteria' 
                  : 'Get started by recording your first payment'
                }
              </p>
              {!searchTerm && !statusFilter && !leaseFilter && !dateRange.start && !dateRange.end && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
