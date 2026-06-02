export function buildOverlayBackground(url, fallback, overlay = 'rgba(91, 44, 137, 0.52)', overlayEnd = 'rgba(53, 21, 83, 0.28)') {
  const imageUrl = url || fallback

  if (!imageUrl) {
    return `linear-gradient(${overlay}, ${overlayEnd})`
  }

  return `linear-gradient(${overlay}, ${overlayEnd}), url(${imageUrl}) center/cover`
}
