import { LetterFooter, SignatureBlock, renderTextBlocks } from '../shared/LetterComponents.jsx'

export default function EditorialTemplate({ letterData, colors, universityConfig }) {
  const locationLine = [letterData.university_city || universityConfig?.city, letterData.university_destination].filter(Boolean).join(' • ')

  return (
    <div className="letter-page editorial-layout" style={{ backgroundColor: colors.pageBg, color: colors.text }}>
      <div className="letter-header editorial-header" style={{ borderBottom: `1px solid ${colors.accent}` }}>
        <div>
          <span className="editorial-label">Official Offer</span>
          <h1>{letterData.university_name}</h1>
          <p>{locationLine}</p>
        </div>
      </div>
      <div className="letter-body editorial-body">
        <div className="letter-meta-row editorial-meta-row">
          <div>
            <span>Reference</span>
            <strong>{letterData.reference_number}</strong>
          </div>
          <div>
            <span>Date</span>
            <strong>{letterData.offer_date}</strong>
          </div>
        </div>
        <div className="letter-greeting">Dear {letterData.student_name || 'Applicant'},</div>
        <div className="letter-content">{renderTextBlocks(letterData.offer_text)}</div>
        <div className="letter-details-grid editorial-grid">
          <div>
            <span>Program</span>
            <strong>{letterData.program_name}</strong>
          </div>
          <div>
            <span>Level</span>
            <strong>{letterData.program_level}</strong>
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
        {letterData.conditions ? (
          <div className="letter-conditions editorial-conditions" style={{ borderColor: colors.primary }}>
            <h4>Offer Conditions</h4>
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
