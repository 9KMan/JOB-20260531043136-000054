import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Onboarding from './pages/Onboarding'
import PromptLibrary from './pages/PromptLibrary'
import AdminPrompts from './pages/AdminPrompts'
import ReviewQueue from './pages/ReviewQueue'
import Settings from './pages/Settings'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
 if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="onboarding" element={
          <ProtectedRoute><Onboarding /></ProtectedRoute>
        } />
        <Route path="prompts" element={
          <ProtectedRoute><PromptLibrary /></ProtectedRoute>
        } />
        <Route path="admin/prompts" element={
          <ProtectedRoute><AdminPrompts /></ProtectedRoute>
        } />
        <Route path="review" element={
          <ProtectedRoute><ReviewQueue /></ProtectedRoute>
        } />
        <Route path="settings" element={
          <ProtectedRoute><Settings /></ProtectedRoute>
        } />
      </Route>
    </Routes>
  )
}

export default App
