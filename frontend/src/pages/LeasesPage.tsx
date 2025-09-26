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
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Calendar,
  DollarSign,
  Users,
  Building2,
  Home,
  AlertTriangle,
  Loader2,
  X
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Lease, Property, Tenant } from '@/types'

const leaseSchema = z.object({
  tenant_id: z.string().min(1, 'Please select a tenant'),
  local_id: z.string().min(1, 'Please select a unit'),
  lease_reference: z.string().min(2, 'Lease reference must be at least 2 characters'),
  start_date: z.string().min(1, 'Please select a start date'),
  end_date: z.string().optional(),
  rent_amount: z.number().positive('Rent amount must be positive'),
  billing_cycle: z.enum(['MONTHLY', 'QUARTERLY']),
})

type LeaseForm = z.infer<typeof leaseSchema>

export function LeasesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLease, setEditingLease] = useState<Lease | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: leases, isLoading } = useQuery({
    queryKey: ['leases', { status: statusFilter }],
    queryFn: () => apiClient.getLeases({ 
      status: statusFilter as 'ACTIVE' | 'TERMINATED' || undefined 
    }),
  })

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: () => apiClient.getProperties(),
  })

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => apiClient.getTenants(),
  })

  const createLeaseMutation = useMutation({
    mutationFn: (data: LeaseForm) => apiClient.createLease(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      toast({ title: 'Lease created successfully' })
      setIsDialogOpen(false)
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create lease', 
        description: error.response?.data?.message,
        variant: 'destructive'
      })
    },
  })

  const updateLeaseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: LeaseForm & { status: 'ACTIVE' | 'TERMINATED' } }) => 
      apiClient.updateLease(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      toast({ title: 'Lease updated successfully' })
      setIsDialogOpen(false)
      setEditingLease(null)
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to update lease', 
        description: error.response?.data?.message,
        variant: 'destructive'
      })
    },
  })

  const terminateLeaseMutation = useMutation({
    mutationFn: ({ id, terminationDate }: { id: string; terminationDate?: string }) => 
      apiClient.terminateLease(id, terminationDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      toast({ title: 'Lease terminated successfully' })
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to terminate lease', 
        description: error.response?.data?.message,
        variant: 'destructive'
      })
    },
  })

  const form = useForm<LeaseForm>({
    resolver: zodResolver(leaseSchema),
    defaultValues: {
      tenant_id: '',
      local_id: '',
      lease_reference: '',
      start_date: '',
      end_date: '',
      rent_amount: 0,
      billing_cycle: 'MONTHLY',
    },
  })

  const handleSubmit = (data: LeaseForm) => {
    if (editingLease) {
      updateLeaseMutation.mutate({ 
        id: editingLease.id, 
        data: { ...data, status: editingLease.status } 
      })
    } else {
      createLeaseMutation.mutate(data)
    }
  }

  const handleEdit = (lease: Lease) => {
    setEditingLease(lease)
    form.reset({
      tenant_id: lease.tenant_id,
      local_id: lease.local_id,
      lease_reference: lease.lease_reference,
      start_date: lease.start_date.split('T')[0],
      end_date: lease.end_date ? lease.end_date.split('T')[0] : '',
      rent_amount: lease.rent_amount,
      billing_cycle: lease.billing_cycle,
    })
    setIsDialogOpen(true)
  }

  const handleTerminate = (lease: Lease) => {
    const terminationDate = prompt('Enter termination date (YYYY-MM-DD) or leave empty for today:')
    if (terminationDate !== null) {
      terminateLeaseMutation.mutate({ 
        id: lease.id, 
        terminationDate: terminationDate || undefined 
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>
      case 'TERMINATED':
        return <Badge variant="destructive">Terminated</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getBillingCycleBadge = (cycle: string) => {
    switch (cycle) {
      case 'MONTHLY':
        return <Badge variant="outline">Monthly</Badge>
      case 'QUARTERLY':
        return <Badge variant="outline">Quarterly</Badge>
      default:
        return <Badge variant="secondary">{cycle}</Badge>
    }
  }

  const getAvailableLocals = () => {
    if (!properties) return []
    return properties.flatMap(property => 
      property.locals
        .filter(local => local.status === 'AVAILABLE')
        .map(local => ({
          ...local,
          property_name: property.name,
          property_location: property.location,
        }))
    )
  }

  const filteredLeases = leases?.filter(lease => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      lease.lease_reference.toLowerCase().includes(searchLower) ||
      lease.tenant.name.toLowerCase().includes(searchLower) ||
      lease.local.reference_code.toLowerCase().includes(searchLower) ||
      lease.local.property?.name.toLowerCase().includes(searchLower)
    )
  })

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
          <h1 className="text-3xl font-bold">Leases</h1>
          <p className="text-muted-foreground">
            Manage lease agreements and contracts
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingLease(null)
              form.reset()
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Lease
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingLease ? 'Edit Lease' : 'Add New Lease'}
              </DialogTitle>
              <DialogDescription>
                {editingLease ? 'Update lease information' : 'Create a new lease agreement'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant_id">Tenant</Label>
                  <Select
                    value={form.watch('tenant_id')}
                    onValueChange={(value) => form.setValue('tenant_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants?.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name} ({tenant.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.tenant_id && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.tenant_id.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="local_id">Unit</Label>
                  <Select
                    value={form.watch('local_id')}
                    onValueChange={(value) => form.setValue('local_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableLocals().map((local) => (
                        <SelectItem key={local.id} value={local.id}>
                          {local.reference_code} - {local.property_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.local_id && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.local_id.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lease_reference">Lease Reference</Label>
                <Input
                  id="lease_reference"
                  {...form.register('lease_reference')}
                  placeholder="e.g., LEASE-2024-001"
                />
                {form.formState.errors.lease_reference && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.lease_reference.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    {...form.register('start_date')}
                  />
                  {form.formState.errors.start_date && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.start_date.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date (Optional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    {...form.register('end_date')}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rent_amount">Rent Amount</Label>
                  <Input
                    id="rent_amount"
                    type="number"
                    step="0.01"
                    {...form.register('rent_amount', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                  {form.formState.errors.rent_amount && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.rent_amount.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing_cycle">Billing Cycle</Label>
                  <Select
                    value={form.watch('billing_cycle')}
                    onValueChange={(value) => form.setValue('billing_cycle', value as 'MONTHLY' | 'QUARTERLY')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select billing cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly</SelectItem>
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
                <Button type="submit" disabled={createLeaseMutation.isPending || updateLeaseMutation.isPending}>
                  {createLeaseMutation.isPending || updateLeaseMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {editingLease ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="TERMINATED">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leases Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Leases ({filteredLeases?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLeases && filteredLeases.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeases.map((lease) => (
                  <TableRow key={lease.id}>
                    <TableCell className="font-medium">
                      {lease.lease_reference}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{lease.tenant.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span>{lease.local.reference_code}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{lease.local.property?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>{formatCurrency(lease.rent_amount)}</span>
                        {getBillingCycleBadge(lease.billing_cycle)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{formatDate(lease.start_date)}</span>
                        </div>
                        {lease.end_date && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <X className="h-3 w-3" />
                            <span>{formatDate(lease.end_date)}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(lease.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(lease)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {lease.status === 'ACTIVE' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTerminate(lease)}
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No leases found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter 
                  ? 'No leases match your search criteria' 
                  : 'Get started by creating your first lease'
                }
              </p>
              {!searchTerm && !statusFilter && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lease
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
