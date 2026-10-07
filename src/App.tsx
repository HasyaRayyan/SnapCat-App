import { BrowserRouter, useRoutes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { routes } from './routes'
import './index.css'

function AppRoutes() {
  const element = useRoutes(routes)
  return element
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
