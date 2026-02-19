'use client'

import { useEffect } from 'react'
import { useTenantConfig } from '@/context/TenantConfigContext'

export default function DynamicMetadata() {
  const { config } = useTenantConfig()

  useEffect(() => {
    if (!config) return

    // Actualizar título
    if (config.seo?.title) {
      document.title = config.seo.title
    }

    // Actualizar meta description
    if (config.seo?.description) {
      let metaDescription = document.querySelector('meta[name="description"]')
      if (!metaDescription) {
        metaDescription = document.createElement('meta')
        metaDescription.setAttribute('name', 'description')
        document.head.appendChild(metaDescription)
      }
      metaDescription.setAttribute('content', config.seo.description)
    }

    // Actualizar favicon
    if (config.branding?.favicon_url) {
      const faviconUrl = config.branding.favicon_url.startsWith('/static/')
        ? `${process.env.NEXT_PUBLIC_API_URL}${config.branding.favicon_url}`
        : config.branding.favicon_url

      // Buscar o crear el link del favicon
      let faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement
      
      if (!faviconLink) {
        faviconLink = document.createElement('link')
        faviconLink.rel = 'icon'
        document.head.appendChild(faviconLink)
      }
      
      faviconLink.href = faviconUrl
      
      console.log('🔖 Favicon actualizado:', faviconUrl)
    }
  }, [config])

  return null // Este componente no renderiza nada
}
