interface User {
    id: string;
    role: 'ADMIN' | 'MANAGER';
    email?: string;
    full_name?: string;
  }