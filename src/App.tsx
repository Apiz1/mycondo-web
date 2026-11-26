import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './auth/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Home from './pages/Home'
import InvoiceDetail from './pages/InvoiceDetail'
import Invoices from './pages/Invoices'
import Login from './pages/Login'
import Notifications from './pages/Notifications'
import Bookings from './pages/Bookings'
import NewBooking from './pages/NewBooking'
import ComplaintDetail from './pages/ComplaintDetail'
import Complaints from './pages/Complaints'
import NewComplaint from './pages/NewComplaint'


export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/bookings/new" element={<NewBooking />} />
          <Route path="/complaints" element={<Complaints />} />
          <Route path="/complaints/new" element={<NewComplaint />} />
          <Route path="/complaints/:id" element={<ComplaintDetail />} />
        </Route>
      </Route>
    </Routes>
  )
}