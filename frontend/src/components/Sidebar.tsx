import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText, 
  CreditCard, 
  FileImage, 
  BarChart3,
  LogOut
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Properties', href: '/properties', icon: Building2 },
  { name: 'Tenants', href: '/tenants', icon: Users },
  { name: 'Leases', href: '/leases', icon: FileText },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Documents', href: '/documents', icon: FileImage },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
]

export function Sidebar() {
  const { logout } = useAuth()

  return (
    <div className="w-64 bg-card border-r border-border h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">RentMaster</h1>
        <p className="text-sm text-muted-foreground">Property Management</p>
      </div>
      
      <nav className="flex-1 px-4 pb-4">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )
                }
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={logout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  )
}


