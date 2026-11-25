export type Role = 'admin' | 'committee' | 'resident' | 'security'

export interface User {
  id: number
  name: string
  email: string
  role: Role
  status: string
}

export interface AppNotification {
  id: string
  type: string | null
  title: string | null
  message: string | null
  data: Record<string, unknown>
  read_at: string | null
  created_at: string
}

export interface Paginated<T> {
  data: T[]
  meta: { current_page: number; last_page: number }
}