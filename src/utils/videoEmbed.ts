export type VideoPlatform = 'youtube' | 'tiktok' | 'instagram' | 'unknown'

const PLATFORM_LABELS: Record<VideoPlatform, string> = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  unknown: 'el enlace',
}

export function getPlatformLabel(platform: VideoPlatform): string {
  return PLATFORM_LABELS[platform]
}

function normalizeUrl(rawUrl: string): URL | null {
  if (!rawUrl) return null
  let url = rawUrl.trim()
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url
  try {
    return new URL(url)
  } catch {
    return null
  }
}

export function detectVideoPlatform(rawUrl: string): VideoPlatform {
  const parsed = normalizeUrl(rawUrl)
  if (!parsed) return 'unknown'
  const host = parsed.hostname
  if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube'
  if (host.includes('tiktok.com')) return 'tiktok'
  if (host.includes('instagram.com')) return 'instagram'
  return 'unknown'
}

function getYoutubeVideoId(parsed: URL): string | null {
  if (parsed.hostname.includes('youtube.com')) {
    if (parsed.pathname.includes('/watch')) return parsed.searchParams.get('v')
    if (parsed.pathname.includes('/shorts/')) return parsed.pathname.split('/shorts/')[1].split('?')[0]
  }
  if (parsed.hostname.includes('youtu.be')) return parsed.pathname.substring(1).split('?')[0]
  return null
}

/** URL para iframe embebido. null si la plataforma no soporta iframe embebido
 *  de forma confiable — en ese caso la UI debe caer al botón "Ver en
 *  {plataforma}" (getVideoDirectUrl).
 *
 *  NOTA (2026-07): probado en producción — YouTube funciona bien via iframe.
 *  TikTok e Instagram NO: sus iframes de embed frecuentemente cargan pero
 *  muestran un muro de login o "contenido no disponible" en vez del video
 *  (falla silenciosa — el iframe "carga" con status 200, así que `onError`
 *  del <iframe> nunca se dispara para detectarlo). En vez de apostar a un
 *  iframe que puede fallar sin avisar, para esas dos plataformas siempre se
 *  usa el link directo, que sí garantiza abrir el video real. */
export function getVideoEmbedUrl(rawUrl: string): string | null {
  const parsed = normalizeUrl(rawUrl)
  if (!parsed) return null
  const platform = detectVideoPlatform(rawUrl)

  if (platform === 'youtube') {
    const id = getYoutubeVideoId(parsed)
    return id ? `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0&modestbranding=1` : null
  }
  return null
}

/** Link directo para abrir en la app/sitio original — botón de respaldo
 *  cuando el iframe no se puede armar o falla al cargar. */
export function getVideoDirectUrl(rawUrl: string): string {
  const parsed = normalizeUrl(rawUrl)
  return parsed ? parsed.toString() : rawUrl
}
