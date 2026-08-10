import React from 'react'
import { Toaster } from 'react-hot-toast'
import AppRouter from './router/router'

export const App: React.FC = () => {
  return (
    <>
      {/* Root Router mapping */}
      <AppRouter />

      {/* Global Toast Alert Layer */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          className: 'glass-card border border-border text-foreground font-semibold rounded-xl text-sm shadow-lg',
          duration: 3000,
          style: {
            background: 'var(--card)',
            color: 'var(--foreground)',
          },
        }}
      />
    </>
  )
}
export default App
