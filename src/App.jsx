import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import StudentReport from './pages/StudentReport'
import StaffDashboard from './pages/StaffDashboard'
import Analytics from './pages/Analytics'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/report" element={<StudentReport />} />
        <Route path="/dashboard" element={<StaffDashboard />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App