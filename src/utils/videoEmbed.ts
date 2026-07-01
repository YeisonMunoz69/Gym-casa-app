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

/** Extrae el ID numérico de un link largo de TikTok (.../video/1234...).
 *  Links cortos (vm.tiktok.com/xxxx) no se pueden resolver sin seguir un
 *  redirect cross-origin — se detectan pero no se embeben (ver getVideoEmbedUrl). */
function getTiktokVideoId(parsed: URL): string | null {
  const match = parsed.pathname.match(/\/video\/(\d+)/)
  return match ? match[1] : null
}

/** Extrae el shortcode de un post/reel de Instagram (/p/{code}/ o /reel/{code}/).
 *  Links de tipo /share/... tampoco se pueden resolver sin seguir un redirect. */
function getInstagramShortcode(parsed: URL): string | null {
  const match = parsed.pathname.match(/\/(p|reel|reels)\/([^/]+)/)
  return match ? match[2] : null
}

/** URL para iframe embebido. null si la plataforma no soporta iframe para
 *  este link (ej. links cortos que no se pueden resolver desde el navegador) —
 *  en ese caso la UI debe caer al botón "Ver en {plataforma}" (getVideoDirectUrl). */
export function getVideoEmbedUrl(rawUrl: string): string | null {
  const parsed = normalizeUrl(rawUrl)
  if (!parsed) return null
  const platform = detectVideoPlatform(rawUrl)

  if (platform === 'youtube') {
    const id = getYoutubeVideoId(parsed)
    return id ? `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0&modestbranding=1` : null
  }
  if (platform === 'tiktok') {
    const id = getTiktokVideoId(parsed)
    return id ? `https://www.tiktok.com/embed/v2/${id}` : null
  }
  if (platform === 'instagram') {
    const code = getInstagramShortcode(parsed)
    return code ? `https://www.instagram.com/reel/${code}/embed/` : null
  }
  return null
}

/** Link directo para abrir en la app/sitio original — botón de respaldo
 *  cuando el iframe no se puede armar o falla al cargar. */
export function getVideoDirectUrl(rawUrl: string): string {
  const parsed = normalizeUrl(rawUrl)
  return parsed ? parsed.toString() : rawUrl
}
