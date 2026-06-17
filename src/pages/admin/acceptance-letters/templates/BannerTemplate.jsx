import { LetterHeader, LetterFooter, SignatureBlock, renderTextBlocks } from '../shared/LetterComponents.jsx'

export default function BannerTemplate({ letterData, colors, universityConfig }) {
  const locationLine = [letterData.university_city || universityConfig?.city, letterData.university_destination].filter(Boolean).join(' • ')

  return (
    <div className="letter-page banner-layout" style={{ backgroundColor: colors.pageBg, color: colors.text }}>
      <div className="letter-header banner-header" style={{ backgroundColor: colors.primary, color: '#ffffff' }}>
        <div>
          <span className="banner-label">Admission Notice</span>
          <h1>{letterData.university_name}</h1>
          <p>{locationLine}</p>
        </div>
        {letterData.university_logo_url || universityConfig?.logoUrl ? (
          <img className="banner-logo" src={letterData.university_logo_url || universityConfig?.logoUrl} alt="University logo" />
        ) : null}
      </div>
      <div className="letter-body banner-body">
        <div className="letter-detail-row">
          <div>
            <span>Reference</span>
            <strong>{letterData.reference_number}</strong>
          </div>
          <div>
            <span>Date</span>
            <strong>{letterData.offer_date}</strong>
          </div>
          <div>
            <span>Intake</span>
            <strong>{letterData.intake_term}</strong>
          </div>
        </div>
        <div className="letter-greeting">Dear {letterData.student_name || 'Applicant'},</div>
        <div className="letter-content">{renderTextBlocks(letterData.offer_text)}</div>
        {letterData.conditions ? (
          <div className="letter-conditions" style={{ borderColor: colors.accent }}>
            <h4>Conditions of Offer</h4>
            {renderTextBlocks(letterData.conditions)}
          </div>
        ) : null}
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
