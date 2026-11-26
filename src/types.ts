export type Role = 'admin' | 'committee' | 'resident' | 'security'
export type InvoiceStatus = 'unpaid' | 'overdue' | 'paid'
export type PaymentStatus = 'pending' | 'approved' | 'rejected'
export type PaymentMethod = 'transfer' | 'billplz'
export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'


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

export interface Payment {
    id: number
    invoice_id: number
    method: PaymentMethod
    amount: string
    status: PaymentStatus
    note: string | null
    review_note: string | null
    submitted_at: string
    reviewed_at: string | null
    payment_url?: string
  }

export interface Invoice {
    id: number
    period: string // "2026-11"
    amount: string
    due_date: string // "2026-11-15"
    status: InvoiceStatus
    payments?: Payment[]
  }

export interface Wrapped<T> {
    data: T
  }

  export interface Facility {
    id: number
    name: string
    open_time: string
    close_time: string
    max_duration_minutes: number
    needs_approval: boolean
  }

  export interface Booking {
    id: number
    facility?: Facility
    start_at: string
    end_at: string
    status: BookingStatus
    purpose: string | null
    review_note: string | null
  }

  export interface Availability {
    facility_id: number
    date: string
    open_time: string
    close_time: string
    booked: { start_at: string; end_at: string; status: BookingStatus }[]
  }