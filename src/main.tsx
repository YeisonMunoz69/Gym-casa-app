import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/700.css'
import './styles/global.css'
import { App } from './App'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('No se encontro el elemento root en el DOM')
}

/**
 * createBrowserRouter es el "data router" de React Router v6.
 * Es requerido para que useBlocker (en AppShell) funcione correctamente.
 * BrowserRouter es un legacy router sin soporte para la Data API.
 *
 * El path '*' captura todas las rutas — las sub-rutas las gestiona
 * el árbol de <Routes> dentro de App.tsx con rutas absolutas.
 */
const router = createBrowserRouter(
  [{ path: '*', element: <App /> }],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { future: { v7_startTransition: true, v7_relativeSplatPath: true } as any },
)

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider
      router={router}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      future={{ v7_startTransition: true } as any}
    />
  </StrictMode>,
)
