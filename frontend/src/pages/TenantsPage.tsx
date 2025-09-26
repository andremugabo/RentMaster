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
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Mail,
  Phone,
  Building2,
  FileText,
  Loader2,
  User,
  Building
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Tenant } from '@/types'

const tenantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['INDIVIDUAL', 'COMPANY']),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
})

type TenantForm = z.infer<typeof tenantSchema>

export function TenantsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants', { search: searchTerm, type: typeFilter }],
    queryFn: () => apiClient.getTenants({ 
      search: searchTerm || undefined, 
      type: typeFilter as 'INDIVIDUAL' | 'COMPANY' || undefined 
    }),
  })

  const createTenantMutation = useMutation({
    mutationFn: (data: TenantForm) => apiClient.createTenant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      toast({ title: 'Tenant created successfully' })
      setIsDialogOpen(false)
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create tenant', 
        description: error.response?.data?.message,
        variant: 'destructive'
      })
    },
  })

  const updateTenantMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TenantForm }) => 
      apiClient.updateTenant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      toast({ title: 'Tenant updated successfully' })
      setIsDialogOpen(false)
      setEditingTenant(null)
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to update tenant', 
        description: error.response?.data?.message,
        variant: 'destructive'
      })
    },
  })

  const deleteTenantMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      toast({ title: 'Tenant deleted successfully' })
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to delete tenant', 
        description: error.response?.data?.message,
        variant: 'destructive'
      })
    },
  })

  const form = useForm<TenantForm>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: '',
      type: 'INDIVIDUAL',
      email: '',
      phone: '',
    },
  })

  const handleSubmit = (data: TenantForm) => {
    const submitData = {
      ...data,
      email: data.email || undefined,
    }

    if (editingTenant) {
      updateTenantMutation.mutate({ id: editingTenant.id, data: submitData })
    } else {
      createTenantMutation.mutate(submitData)
    }
  }

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant)
    form.reset({
      name: tenant.name,
      type: tenant.type,
      email: tenant.email || '',
      phone: tenant.phone || '',
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (tenant: Tenant) => {
    if (confirm(`Are you sure you want to delete "${tenant.name}"?`)) {
      deleteTenantMutation.mutate(tenant.id)
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'INDIVIDUAL':
        return <Badge variant="secondary" className="flex items-center gap-1"><User className="h-3 w-3" />Individual</Badge>
      case 'COMPANY':
        return <Badge variant="outline" className="flex items-center gap-1"><Building className="h-3 w-3" />Company</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

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
          <h1 className="text-3xl font-bold">Tenants</h1>
          <p className="text-muted-foreground">
            Manage tenant information and records
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTenant(null)
              form.reset()
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTenant ? 'Edit Tenant' : 'Add New Tenant'}
              </DialogTitle>
              <DialogDescription>
                {editingTenant ? 'Update tenant information' : 'Create a new tenant record'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Enter tenant name"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={form.watch('type')}
                  onValueChange={(value) => form.setValue('type', value as 'INDIVIDUAL' | 'COMPANY')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenant type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                    <SelectItem value="COMPANY">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  placeholder="Enter email address"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...form.register('phone')}
                  placeholder="Enter phone number"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createTenantMutation.isPending || updateTenantMutation.isPending}>
                  {createTenantMutation.isPending || updateTenantMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {editingTenant ? 'Update' : 'Create'}
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
                  placeholder="Search tenants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                <SelectItem value="COMPANY">Company</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Tenants ({tenants?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tenants && tenants.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Leases</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">
                      {tenant.name}
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(tenant.type)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {tenant.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {tenant.email}
                          </div>
                        )}
                        {tenant.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {tenant.phone}
                          </div>
                        )}
                        {!tenant.email && !tenant.phone && (
                          <span className="text-sm text-muted-foreground">No contact info</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{tenant.leases.length}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(tenant.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(tenant)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(tenant)}
                          disabled={tenant.leases.length > 0}
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
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No tenants found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || typeFilter 
                  ? 'No tenants match your search criteria' 
                  : 'Get started by adding your first tenant'
                }
              </p>
              {!searchTerm && !typeFilter && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tenant
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
