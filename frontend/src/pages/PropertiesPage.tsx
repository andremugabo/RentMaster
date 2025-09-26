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
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Home, 
  Users,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Property, Local } from '@/types'

const propertySchema = z.object({
  name: z.string().min(2, 'Property name must be at least 2 characters'),
  location: z.string().min(2, 'Location must be at least 2 characters'),
  description: z.string().optional(),
})

const localSchema = z.object({
  reference_code: z.string().min(2, 'Reference code must be at least 2 characters'),
  floor: z.string().optional(),
  unit_type: z.string().optional(),
  size_m2: z.number().positive('Size must be positive').optional(),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE']).default('AVAILABLE'),
})

type PropertyForm = z.infer<typeof propertySchema>
type LocalForm = z.infer<typeof localSchema>

export function PropertiesPage() {
  const [isPropertyDialogOpen, setIsPropertyDialogOpen] = useState(false)
  const [isLocalDialogOpen, setIsLocalDialogOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [editingLocal, setEditingLocal] = useState<Local | null>(null)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: () => apiClient.getProperties(),
  })

  const createPropertyMutation = useMutation({
    mutationFn: (data: PropertyForm) => apiClient.createProperty(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      toast({ title: 'Property created successfully' })
      setIsPropertyDialogOpen(false)
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create property', 
        description: error.response?.data?.message,
        variant: 'destructive'
      })
    },
  })

  const updatePropertyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PropertyForm }) => 
      apiClient.updateProperty(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      toast({ title: 'Property updated successfully' })
      setIsPropertyDialogOpen(false)
      setEditingProperty(null)
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to update property', 
        description: error.response?.data?.message,
        variant: 'destructive'
      })
    },
  })

  const deletePropertyMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      toast({ title: 'Property deleted successfully' })
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to delete property', 
        description: error.response?.data?.message,
        variant: 'destructive'
      })
    },
  })

  const createLocalMutation = useMutation({
    mutationFn: ({ propertyId, data }: { propertyId: string; data: LocalForm }) => 
      apiClient.createLocal(propertyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      toast({ title: 'Unit created successfully' })
      setIsLocalDialogOpen(false)
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create unit', 
        description: error.response?.data?.message,
        variant: 'destructive'
      })
    },
  })

  const updateLocalMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: LocalForm }) => 
      apiClient.updateLocal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      toast({ title: 'Unit updated successfully' })
      setIsLocalDialogOpen(false)
      setEditingLocal(null)
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to update unit', 
        description: error.response?.data?.message,
        variant: 'destructive'
      })
    },
  })

  const deleteLocalMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteLocal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      toast({ title: 'Unit deleted successfully' })
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to delete unit', 
        description: error.response?.data?.message,
        variant: 'destructive'
      })
    },
  })

  const propertyForm = useForm<PropertyForm>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: '',
      location: '',
      description: '',
    },
  })

  const localForm = useForm<LocalForm>({
    resolver: zodResolver(localSchema),
    defaultValues: {
      reference_code: '',
      floor: '',
      unit_type: '',
      size_m2: undefined,
      status: 'AVAILABLE',
    },
  })

  const handlePropertySubmit = (data: PropertyForm) => {
    if (editingProperty) {
      updatePropertyMutation.mutate({ id: editingProperty.id, data })
    } else {
      createPropertyMutation.mutate(data)
    }
  }

  const handleLocalSubmit = (data: LocalForm) => {
    if (editingLocal) {
      updateLocalMutation.mutate({ id: editingLocal.id, data })
    } else if (selectedProperty) {
      createLocalMutation.mutate({ propertyId: selectedProperty.id, data })
    }
  }

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property)
    propertyForm.reset({
      name: property.name,
      location: property.location,
      description: property.description,
    })
    setIsPropertyDialogOpen(true)
  }

  const handleEditLocal = (local: Local) => {
    setEditingLocal(local)
    localForm.reset({
      reference_code: local.reference_code,
      floor: local.floor || '',
      unit_type: local.unit_type || '',
      size_m2: local.size_m2 || undefined,
      status: local.status,
    })
    setIsLocalDialogOpen(true)
  }

  const handleDeleteProperty = (property: Property) => {
    if (confirm(`Are you sure you want to delete "${property.name}"?`)) {
      deletePropertyMutation.mutate(property.id)
    }
  }

  const handleDeleteLocal = (local: Local) => {
    if (confirm(`Are you sure you want to delete unit "${local.reference_code}"?`)) {
      deleteLocalMutation.mutate(local.id)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge variant="success">Available</Badge>
      case 'OCCUPIED':
        return <Badge variant="default">Occupied</Badge>
      case 'MAINTENANCE':
        return <Badge variant="warning">Maintenance</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
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
          <h1 className="text-3xl font-bold">Properties</h1>
          <p className="text-muted-foreground">
            Manage your properties and units
          </p>
        </div>
        <Dialog open={isPropertyDialogOpen} onOpenChange={setIsPropertyDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingProperty(null)
              propertyForm.reset()
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProperty ? 'Edit Property' : 'Add New Property'}
              </DialogTitle>
              <DialogDescription>
                {editingProperty ? 'Update property information' : 'Create a new property'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={propertyForm.handleSubmit(handlePropertySubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Property Name</Label>
                <Input
                  id="name"
                  {...propertyForm.register('name')}
                  placeholder="Enter property name"
                />
                {propertyForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {propertyForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  {...propertyForm.register('location')}
                  placeholder="Enter property location"
                />
                {propertyForm.formState.errors.location && (
                  <p className="text-sm text-destructive">
                    {propertyForm.formState.errors.location.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...propertyForm.register('description')}
                  placeholder="Enter property description"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPropertyDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createPropertyMutation.isPending || updatePropertyMutation.isPending}>
                  {createPropertyMutation.isPending || updatePropertyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {editingProperty ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {properties?.map((property) => (
          <Card key={property.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-xl">{property.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {property.location}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedProperty(property)
                      localForm.reset()
                      setIsLocalDialogOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Unit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditProperty(property)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteProperty(property)}
                    disabled={property.locals.length > 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {property.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {property.description}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Home className="h-4 w-4" />
                    {property.locals.length} units
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {property.locals.filter(local => local.status === 'OCCUPIED').length} occupied
                  </div>
                </div>
                
                {property.locals.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Floor</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Size (m²)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {property.locals.map((local) => (
                        <TableRow key={local.id}>
                          <TableCell className="font-medium">
                            {local.reference_code}
                          </TableCell>
                          <TableCell>{local.floor || '-'}</TableCell>
                          <TableCell>{local.unit_type || '-'}</TableCell>
                          <TableCell>{local.size_m2 || '-'}</TableCell>
                          <TableCell>{getStatusBadge(local.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditLocal(local)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteLocal(local)}
                                disabled={local.leases.length > 0}
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
                  <div className="text-center py-8 text-muted-foreground">
                    <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No units added yet</p>
                    <p className="text-sm">Click "Add Unit" to create the first unit</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {properties?.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No properties found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first property
              </p>
              <Button onClick={() => setIsPropertyDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Local Dialog */}
      <Dialog open={isLocalDialogOpen} onOpenChange={setIsLocalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLocal ? 'Edit Unit' : 'Add New Unit'}
            </DialogTitle>
            <DialogDescription>
              {editingLocal ? 'Update unit information' : `Add a new unit to ${selectedProperty?.name}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={localForm.handleSubmit(handleLocalSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reference_code">Reference Code</Label>
              <Input
                id="reference_code"
                {...localForm.register('reference_code')}
                placeholder="e.g., UNIT-101"
              />
              {localForm.formState.errors.reference_code && (
                <p className="text-sm text-destructive">
                  {localForm.formState.errors.reference_code.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  {...localForm.register('floor')}
                  placeholder="e.g., 1st Floor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_type">Unit Type</Label>
                <Input
                  id="unit_type"
                  {...localForm.register('unit_type')}
                  placeholder="e.g., Office, Shop"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size_m2">Size (m²)</Label>
                <Input
                  id="size_m2"
                  type="number"
                  {...localForm.register('size_m2', { valueAsNumber: true })}
                  placeholder="e.g., 50"
                />
                {localForm.formState.errors.size_m2 && (
                  <p className="text-sm text-destructive">
                    {localForm.formState.errors.size_m2.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={localForm.watch('status')}
                  onValueChange={(value) => localForm.setValue('status', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="OCCUPIED">Occupied</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsLocalDialogOpen(false)
                  setEditingLocal(null)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createLocalMutation.isPending || updateLocalMutation.isPending}>
                {createLocalMutation.isPending || updateLocalMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {editingLocal ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
