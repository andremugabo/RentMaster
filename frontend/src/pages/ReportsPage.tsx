import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart2, 
  Download, 
  Calendar,
  DollarSign,
  Building2,
  Users,
  Home,
  TrendingUp,
  TrendingDown,
  Loader2,
  FileText,
  PieChart
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { RevenueReport, OccupancyReport } from '@/types'

export function ReportsPage() {
  const [reportType, setReportType] = useState<'revenue' | 'occupancy'>('revenue')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [groupBy, setGroupBy] = useState<'day' | 'month'>('month')
  const { toast } = useToast()

  const { data: revenueReport, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-report', dateRange.start, dateRange.end, groupBy],
    queryFn: () => apiClient.getRevenueReport({
      start_date: dateRange.start || undefined,
      end_date: dateRange.end || undefined,
      group_by: groupBy
    }),
    enabled: reportType === 'revenue'
  })

  const { data: occupancyReport, isLoading: occupancyLoading } = useQuery({
    queryKey: ['occupancy-report'],
    queryFn: () => apiClient.getOccupancyReport(),
    enabled: reportType === 'occupancy'
  })

  const handleExport = () => {
    toast({
      title: 'Export Feature',
      description: 'Export functionality will be implemented in the next version',
    })
  }

  const isLoading = revenueLoading || occupancyLoading

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            View analytics and generate reports
          </p>
        </div>
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={(value: 'revenue' | 'occupancy') => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue Report</SelectItem>
                  <SelectItem value="occupancy">Occupancy Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {reportType === 'revenue' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group-by">Group By</Label>
                  <Select value={groupBy} onValueChange={(value: 'day' | 'month') => setGroupBy(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grouping" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Daily</SelectItem>
                      <SelectItem value="month">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          {/* Revenue Report */}
          {reportType === 'revenue' && revenueReport && (
            <div className="space-y-6">
              {/* Revenue Summary */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(revenueReport.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">
                      {revenueReport.totalTransactions} transactions
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(revenueReport.totalRevenue / revenueReport.totalTransactions)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Per transaction
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Payment Methods</CardTitle>
                    <PieChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{revenueReport.revenueByPaymentMode.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Different methods used
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Period</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{revenueReport.revenueData.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {groupBy === 'day' ? 'Days' : 'Months'} covered
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Data Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by {groupBy === 'day' ? 'Day' : 'Month'}</CardTitle>
                  <CardDescription>
                    Detailed breakdown of revenue over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Transactions</TableHead>
                        <TableHead>Average</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenueReport.revenueData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.period}</TableCell>
                          <TableCell>{formatCurrency(item.amount)}</TableCell>
                          <TableCell>{item.count}</TableCell>
                          <TableCell>{formatCurrency(item.amount / item.count)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Payment Methods Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Payment Method</CardTitle>
                  <CardDescription>
                    Breakdown of revenue by payment method
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Transactions</TableHead>
                        <TableHead>Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenueReport.revenueByPaymentMode.map((item, index) => {
                        const percentage = (item.amount / revenueReport.totalRevenue) * 100
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.payment_mode}</TableCell>
                            <TableCell>{formatCurrency(item.amount)}</TableCell>
                            <TableCell>{item.count}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{percentage.toFixed(1)}%</Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Occupancy Report */}
          {reportType === 'occupancy' && occupancyReport && (
            <div className="space-y-6">
              {/* Occupancy Summary */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{occupancyReport.overallStats.totalProperties}</div>
                    <p className="text-xs text-muted-foreground">
                      Properties managed
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Units</CardTitle>
                    <Home className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{occupancyReport.overallStats.totalLocals}</div>
                    <p className="text-xs text-muted-foreground">
                      Units available
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Occupied Units</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{occupancyReport.overallStats.totalOccupied}</div>
                    <p className="text-xs text-muted-foreground">
                      Currently occupied
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{occupancyReport.overallStats.overallOccupancyRate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                      Overall occupancy
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Property Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Property Occupancy Details</CardTitle>
                  <CardDescription>
                    Detailed breakdown by property
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Total Units</TableHead>
                        <TableHead>Occupied</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Maintenance</TableHead>
                        <TableHead>Occupancy Rate</TableHead>
                        <TableHead>Active Leases</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {occupancyReport.properties.map((property) => (
                        <TableRow key={property.propertyId}>
                          <TableCell className="font-medium">{property.propertyName}</TableCell>
                          <TableCell>{property.location}</TableCell>
                          <TableCell>{property.totalLocals}</TableCell>
                          <TableCell>
                            <Badge variant="default">{property.occupiedLocals}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="success">{property.availableLocals}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="warning">{property.maintenanceLocals}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={property.occupancyRate > 80 ? "success" : property.occupancyRate > 60 ? "default" : "destructive"}>
                              {property.occupancyRate.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell>{property.activeLeases}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}