export type Role = 'admin' | 'committee' | 'resident' | 'security'

export interface User {
  id: number
  name: string
  email: string
  role: Role
  status: string
}