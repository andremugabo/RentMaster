import { useState, useRef } from 'react'
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
  Folder, 
  Plus, 
  Upload, 
  Download, 
  Trash2, 
  Search,
  FileText,
  Image,
  File,
  Users,
  Building2,
  Home,
  Loader2,
  Eye,
  Calendar
} from 'lucide-react'
import { formatDate, formatFileSize } from '@/lib/utils'
import { Document, Property, Tenant, Lease } from '@/types'

const documentSchema = z.object({
  name: z.string().min(2, 'Document name must be at least 2 characters'),
  description: z.string().optional(),
  entity_type: z.enum(['PROPERTY', 'TENANT', 'LEASE']),
  entity_id: z.string().min(1, 'Please select an entity'),
  category: z.string().min(1, 'Please select a category'),
})

type DocumentForm = z.infer<typeof documentSchema>

const documentCategories = [
  'Lease Agreement',
  'Property Deed',
  'Insurance',
  'Maintenance',
  'Invoice',
  'Receipt',
  'Contract',
  'Certificate',
  'Other'
]

export function DocumentsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', { entity_type: entityTypeFilter, category: categoryFilter }],
    queryFn: () => apiClient.getDocuments({ 
      entity_type: entityTypeFilter as 'PROPERTY' | 'TENANT' | 'LEASE' || undefined,
      category: categoryFilter || undefined,
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

  const { data: leases } = useQuery({
    queryKey: ['leases'],
    queryFn: () => apiClient.getLeases(),
  })

  const uploadDocumentMutation = useMutation({
    mutationFn: ({ data, file }: { data: DocumentForm; file: File }) => 
      apiClient.uploadDocument(data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast({ title: 'Document uploaded successfully' })
      setIsDialogOpen(false)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to upload document', 
        description: error.response?.data?.message,
        variant: 'destructive'
      })
    },
  })

  const updateDocumentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DocumentForm }) => 
      apiClient.updateDocument(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast({ title: 'Document updated successfully' })
      setIsDialogOpen(false)
      setEditingDocument(null)
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to update document', 
        description: error.response?.data?.message,
        variant: 'destructive'
      })
    },
  })

  const deleteDocumentMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast({ title: 'Document deleted successfully' })
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to delete document', 
        description: error.response?.data?.message,
        variant: 'destructive'
      })
    },
  })

  const form = useForm<DocumentForm>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      name: '',
      description: '',
      entity_type: 'PROPERTY',
      entity_id: '',
      category: '',
    },
  })

  const handleSubmit = (data: DocumentForm) => {
    if (editingDocument) {
      updateDocumentMutation.mutate({ id: editingDocument.id, data })
    } else {
      if (!selectedFile) {
        toast({ 
          title: 'Please select a file', 
          variant: 'destructive'
        })
        return
      }
      uploadDocumentMutation.mutate({ data, file: selectedFile })
    }
  }

  const handleEdit = (document: Document) => {
    setEditingDocument(document)
    form.reset({
      name: document.name,
      description: document.description || '',
      entity_type: document.entity_type,
      entity_id: document.entity_id,
      category: document.category,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (document: Document) => {
    if (confirm(`Are you sure you want to delete "${document.name}"?`)) {
      deleteDocumentMutation.mutate(document.id)
    }
  }

  const handleDownload = async (document: Document) => {
    try {
      await apiClient.downloadDocument(document.id)
    } catch (error: any) {
      toast({ 
        title: 'Failed to download document', 
        description: error.response?.data?.message,
        variant: 'destructive'
      })
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!form.getValues('name')) {
        form.setValue('name', file.name.split('.')[0])
      }
    }
  }

  const getEntityName = (document: Document) => {
    switch (document.entity_type) {
      case 'PROPERTY':
        return properties?.find(p => p.id === document.entity_id)?.name || 'Unknown Property'
      case 'TENANT':
        return tenants?.find(t => t.id === document.entity_id)?.name || 'Unknown Tenant'
      case 'LEASE':
        return leases?.find(l => l.id === document.entity_id)?.lease_reference || 'Unknown Lease'
      default:
        return 'Unknown'
    }
  }

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'PROPERTY':
        return <Building2 className="h-4 w-4" />
      case 'TENANT':
        return <Users className="h-4 w-4" />
      case 'LEASE':
        return <FileText className="h-4 w-4" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="h-4 w-4 text-blue-500" />
      default:
        return <File className="h-4 w-4 text-gray-500" />
    }
  }

  const getEntityOptions = () => {
    const entityType = form.watch('entity_type')
    switch (entityType) {
      case 'PROPERTY':
        return properties?.map(property => ({
          id: property.id,
          name: property.name
        })) || []
      case 'TENANT':
        return tenants?.map(tenant => ({
          id: tenant.id,
          name: tenant.name
        })) || []
      case 'LEASE':
        return leases?.map(lease => ({
          id: lease.id,
          name: lease.lease_reference
        })) || []
      default:
        return []
    }
  }

  const filteredDocuments = documents?.filter(document => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      document.name.toLowerCase().includes(searchLower) ||
      document.description?.toLowerCase().includes(searchLower) ||
      document.category.toLowerCase().includes(searchLower) ||
      getEntityName(document).toLowerCase().includes(searchLower)
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
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">
            Manage property and lease documents
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingDocument(null)
              form.reset()
              setSelectedFile(null)
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingDocument ? 'Edit Document' : 'Upload New Document'}
              </DialogTitle>
              <DialogDescription>
                {editingDocument ? 'Update document information' : 'Upload a new document'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {!editingDocument && (
                <div className="space-y-2">
                  <Label htmlFor="file">File</Label>
                  <Input
                    ref={fileInputRef}
                    id="file"
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Document Name</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Enter document name"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  {...form.register('description')}
                  placeholder="Enter document description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entity_type">Entity Type</Label>
                  <Select
                    value={form.watch('entity_type')}
                    onValueChange={(value) => {
                      form.setValue('entity_type', value as 'PROPERTY' | 'TENANT' | 'LEASE')
                      form.setValue('entity_id', '')
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROPERTY">Property</SelectItem>
                      <SelectItem value="TENANT">Tenant</SelectItem>
                      <SelectItem value="LEASE">Lease</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entity_id">Entity</Label>
                  <Select
                    value={form.watch('entity_id')}
                    onValueChange={(value) => form.setValue('entity_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select entity" />
                    </SelectTrigger>
                    <SelectContent>
                      {getEntityOptions().map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.entity_id && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.entity_id.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={form.watch('category')}
                  onValueChange={(value) => form.setValue('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.category && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.category.message}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploadDocumentMutation.isPending || updateDocumentMutation.isPending}>
                  {uploadDocumentMutation.isPending || updateDocumentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {editingDocument ? 'Update' : 'Upload'}
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
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="PROPERTY">Property</SelectItem>
                <SelectItem value="TENANT">Tenant</SelectItem>
                <SelectItem value="LEASE">Lease</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {documentCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Documents ({filteredDocuments?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDocuments && filteredDocuments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFileIcon(document.file_name)}
                        <span className="font-medium">{document.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{document.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getEntityIcon(document.entity_type)}
                        <span>{getEntityName(document)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{document.entity_type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatFileSize(document.file_size)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {formatDate(document.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(document)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(document)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(document)}
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
              <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || entityTypeFilter || categoryFilter
                  ? 'No documents match your search criteria' 
                  : 'Get started by uploading your first document'
                }
              </p>
              {!searchTerm && !entityTypeFilter && !categoryFilter && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}