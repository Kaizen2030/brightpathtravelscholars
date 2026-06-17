import { LetterFooter, SignatureBlock, renderTextBlocks } from '../shared/LetterComponents.jsx'

export default function GiftBoxTemplate({ letterData, colors, universityConfig }) {
  const locationLine = [letterData.university_city || universityConfig?.city, letterData.university_destination].filter(Boolean).join(' • ')

  return (
    <div className="letter-page gift-box-layout" style={{ backgroundColor: colors.pageBg, color: colors.text }}>
      <div className="letter-header gift-box-header" style={{ backgroundColor: colors.primary, color: '#ffffff' }}>
        <div>
          <span className="gift-box-label">Admission Offer</span>
          <h1>{letterData.university_name}</h1>
          <p>{locationLine}</p>
        </div>
      </div>
      <div className="letter-body gift-box-body">
        <div className="letter-greeting">Dear {letterData.student_name || 'Applicant'},</div>
        <div className="letter-content">{renderTextBlocks(letterData.offer_text)}</div>
        <div className="letter-details-grid gift-box-grid">
          <div>
            <span>Program</span>
            <strong>{letterData.program_name}</strong>
          </div>
          <div>
            <span>Start date</span>
            <strong>{letterData.start_date || 'TBA'}</strong>
          </div>
          <div>
            <span>Deadline</span>
            <strong>{letterData.acceptance_deadline || 'Within 30 days'}</strong>
          </div>
        </div>
        <div className="gift-box-highlight" style={{ backgroundColor: colors.accentSoft, borderColor: colors.accent }}>
          <strong>Offer valid until</strong>
          <span>{letterData.acceptance_deadline || 'Within 30 days'}</span>
        </div>
      </div>
      <SignatureBlock
        sealUrl={letterData.seal_image_url}
        signatureUrl={letterData.signature_image_url}
        stampUrl={letterData.stamp_image_url}
        registrarName={letterData.signatory_name}
        registrarTitle={letterData.signatory_title}
        colors={colors}
        universityConfig={universityConfig}
      />
      <LetterFooter university={letterData.university_name} colors={colors} universityConfig={universityConfig} />
    </div>
  )
}
