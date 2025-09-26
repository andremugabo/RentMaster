import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

export function Header() {
  const { user } = useAuth()

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Welcome back, {user?.full_name}</h2>
          <p className="text-sm text-muted-foreground">
            {user?.role === 'ADMIN' ? 'Administrator' : 'Property Manager'}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarFallback>
              {user ? getInitials(user.full_name) : 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
