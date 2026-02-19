'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface TenantConfig {
  tenant: {
    id: number
    codigo: string
    nombre: string
    dominio_principal: string
  }
  branding: {
    logo_url: string
    favicon_url: string
    nombre_comercial: string
  }
  colores: {
    primario: string
    primario_light: string
    primario_dark: string
    secundario: string
    secundario_light: string
    secundario_dark: string
    acento: string
    fondo_hero_inicio: string
    fondo_hero_fin: string
    fondo_seccion: string
  }
  hero: {
    titulo: string
    subtitulo: string
    imagen_url: string
    cta_texto: string
    cta_link: string
    badges: Array<{
      icono: string
      texto: string
    }>
  }
  beneficios: Array<{
    icono: string
    titulo: string
    descripcion: string
  }>
  footer: {
    redes_sociales: {
      facebook?: string
      instagram?: string
      whatsapp?: string
    }
    telefono: string
    email: string
    direccion: string
    descripcion: string
    copyright: string
  }
  seo: {
    title: string
    description: string
  }
  displaySettings: {
    mostrar_precios: boolean
    mostrar_stock: boolean
    habilitar_carrito: boolean
  }
}

interface TenantConfigContextType {
  config: TenantConfig | null
  loading: boolean
  error: string | null
}

const TenantConfigContext = createContext<TenantConfigContextType | undefined>(undefined)

export function TenantConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<TenantConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadConfig() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const currentHostname = window.location.hostname
        
        console.log('🔍 Cargando config desde:', `${apiUrl}/api/config/landing`)
        console.log('🌐 Dominio actual:', currentHostname)
        
        // Enviar el hostname actual al backend para detección de tenant
        const response = await fetch(`${apiUrl}/api/config/landing`, {
          headers: {
            'X-Forwarded-Host': currentHostname
          }
        })
        
        if (!response.ok) {
          // Si es 403, probablemente el tenant está suspendido
          if (response.status === 403) {
            const errorData = await response.json().catch(() => ({ detail: 'Cuenta suspendida' }))
            throw new Error(errorData.detail || 'Tu cuenta está suspendida')
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('✅ Config cargada:', data)
        setConfig(data)
        
        // Inyectar CSS variables para colores dinámicos
        if (data.colores) {
          const root = document.documentElement
          root.style.setProperty('--color-primario', data.colores.primario)
          root.style.setProperty('--color-primario-light', data.colores.primario_light)
          root.style.setProperty('--color-primario-dark', data.colores.primario_dark)
          root.style.setProperty('--color-secundario', data.colores.secundario)
          root.style.setProperty('--color-secundario-light', data.colores.secundario_light)
          root.style.setProperty('--color-secundario-dark', data.colores.secundario_dark)
          root.style.setProperty('--color-acento', data.colores.acento)
          root.style.setProperty('--fondo-hero-inicio', data.colores.fondo_hero_inicio)
          root.style.setProperty('--fondo-hero-fin', data.colores.fondo_hero_fin)
          root.style.setProperty('--fondo-seccion', data.colores.fondo_seccion)
        }
        
        // Actualizar título y meta description del SEO
        if (data.seo) {
          document.title = data.seo.title
          const metaDescription = document.querySelector('meta[name="description"]')
          if (metaDescription) {
            metaDescription.setAttribute('content', data.seo.description)
          }
        }
        
      } catch (err) {
        console.error('Error cargando configuración:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [])

  return (
    <TenantConfigContext.Provider value={{ config, loading, error }}>
      {children}
    </TenantConfigContext.Provider>
  )
}

export function useTenantConfig() {
  const context = useContext(TenantConfigContext)
  if (context === undefined) {
    throw new Error('useTenantConfig debe usarse dentro de TenantConfigProvider')
  }
  return context
}
