import { LetterHeader, LetterFooter, SignatureBlock, renderTextBlocks } from '../shared/LetterComponents.jsx'

export default function TechBoxTemplate({ letterData, colors, universityConfig }) {
  const locationLine = [letterData.university_city || universityConfig?.city, letterData.university_destination].filter(Boolean).join(' • ')

  return (
    <div className="letter-page tech-box-layout" style={{ backgroundColor: colors.pageBg, color: colors.text }}>
      <div className="letter-header tech-box-header" style={{ backgroundColor: colors.primary, color: '#ffffff' }}>
        <div>
          <div className="tech-box-label">Admissions</div>
          <h1>{letterData.university_name}</h1>
          <p>{locationLine}</p>
        </div>
        {letterData.university_logo_url || universityConfig?.logoUrl ? (
          <img className="tech-box-logo" src={letterData.university_logo_url || universityConfig?.logoUrl} alt="University logo" />
        ) : null}
      </div>
      <div className="letter-body">
        <div className="letter-highlight" style={{ borderColor: colors.accent }}>
          <strong>{letterData.offer_date}</strong>
          <span>Reference {letterData.reference_number}</span>
        </div>
        <div className="letter-greeting">Dear {letterData.student_name || 'Applicant'},</div>
        <div className="letter-content">{renderTextBlocks(letterData.offer_text)}</div>
        <div className="letter-details-grid tech-box-grid">
          <div>
            <span>Program</span>
            <strong>{letterData.program_name}</strong>
          </div>
          <div>
            <span>Start</span>
            <strong>{letterData.start_date || 'TBA'}</strong>
          </div>
          <div>
            <span>Level</span>
            <strong>{letterData.program_level}</strong>
          </div>
          <div>
            <span>Deadline</span>
            <strong>{letterData.acceptance_deadline || 'Within 30 days'}</strong>
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
      </div>
      <LetterFooter university={letterData.university_name} colors={colors} universityConfig={universityConfig} />
    </div>
  )
}
