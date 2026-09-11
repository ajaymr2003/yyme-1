import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './core/contexts/SellerAuthContext'
import { QuotaProvider } from './core/contexts/QuotaContext'
import { AppRoutes } from './AppRoutes'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <QuotaProvider>
          <AppRoutes />
        </QuotaProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
