export function renderTextBlocks(text) {
  if (!text) return null

  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
      const headingMatch = lines[0]?.match(/^(.+?:)\s*$/)

      if (headingMatch && lines.length > 1) {
        return (
          <div key={index} className="letter-text-block has-heading">
            <h4>{headingMatch[1]}</h4>
            <p>{lines.slice(1).join(' ')}</p>
          </div>
        )
      }

      return (
        <p key={index} className="letter-text-block">
          {block}
        </p>
      )
  })
}

function buildLocationLine(universityConfig) {
  const parts = [universityConfig?.city, universityConfig?.destination].filter(Boolean)
  return parts.join(' • ')
}

export function LetterHeader({ university, subtitle, logoUrl, colors, universityConfig }) {
  const resolvedUniversity = universityConfig?.header?.name || university || 'University Name'
  const resolvedSubtitle = universityConfig?.header?.office || subtitle
  const locationLine = buildLocationLine(universityConfig)
  const addressLine = universityConfig?.header?.address || universityConfig?.address || ''

  return (
    <div className="letter-header" style={{ backgroundColor: colors.primary, color: '#ffffff', gap: '1rem' }}>
      <div style={{ minWidth: 0 }}>
        <h1>{resolvedUniversity}</h1>
        {resolvedSubtitle ? <p className="letter-header-subtitle">{resolvedSubtitle}</p> : null}
        {locationLine ? <p className="letter-header-subtitle" style={{ marginTop: '0.2rem', opacity: 0.8 }}>{locationLine}</p> : null}
        {addressLine ? <p className="letter-header-subtitle" style={{ marginTop: '0.2rem', opacity: 0.72, lineHeight: 1.45 }}>{addressLine}</p> : null}
      </div>
      {logoUrl ? <img className="letter-header-logo" src={logoUrl} alt="University logo" /> : null}
    </div>
  )
}

export function LetterFooter({ university, colors, universityConfig }) {
  const resolvedUniversity = universityConfig?.header?.name || university || 'University Name'
  const locationLine = buildLocationLine(universityConfig)

  return (
    <div className="letter-footer" style={{ backgroundColor: colors.primaryLight, color: colors.text, gap: '0.75rem' }}>
      <span>{resolvedUniversity}</span>
      <span>{locationLine || new Date().getFullYear()}</span>
    </div>
  )
}

export function SignatureBlock({ sealUrl, signatureUrl, stampUrl, registrarName, registrarTitle, colors, universityConfig }) {
  const resolvedSealUrl = sealUrl || universityConfig?.sealUrl || ''
  const resolvedSignatureUrl = signatureUrl || universityConfig?.signatureUrl || ''
  const resolvedStampUrl = stampUrl || universityConfig?.stampUrl || ''
  const resolvedRegistrarName = registrarName || universityConfig?.signatory?.name || 'Registrar'
  const resolvedRegistrarTitle = registrarTitle || universityConfig?.signatory?.title || 'Registrar and Secretary'
  const initials = `${(universityConfig?.name || resolvedRegistrarName || 'BP')}`
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'BP'

  return (
    <div className="letter-signature" style={{ borderTopColor: colors.primaryLight, gap: '1rem' }}>
      {resolvedSealUrl ? (
        <img className="signature-seal" src={resolvedSealUrl} alt="University seal" />
      ) : (
        <div className="signature-seal" style={{ display: 'grid', placeItems: 'center', borderRadius: '50%', background: '#fff', border: `1px solid ${colors.primaryLight}`, color: colors.primary, fontWeight: 800 }}>
          {initials}
        </div>
      )}
      <div className="signature-copy">
        <div className="signature-line">
          {resolvedSignatureUrl ? <img src={resolvedSignatureUrl} alt="Registrar signature" /> : <span style={{ color: colors.primary }}>Registrar</span>}
        </div>
        <div className="signature-name">{resolvedRegistrarName}</div>
        <div className="signature-title">{resolvedRegistrarTitle}</div>
      </div>
      {resolvedStampUrl ? (
        <img className="signature-stamp" src={resolvedStampUrl} alt="Admission stamp" />
      ) : (
        <div className="signature-stamp" style={{ display: 'grid', placeItems: 'center', borderRadius: '50%', border: `2px solid ${colors.primary}`, color: colors.primary, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Admitted
        </div>
      )}
    </div>
  )
}
