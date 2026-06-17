import { LetterHeader, LetterFooter, SignatureBlock, renderTextBlocks } from '../shared/LetterComponents.jsx'

export default function ClassicTemplate({ letterData, colors, universityConfig }) {
  return (
    <div className="letter-page classic-layout" style={{ backgroundColor: colors.pageBg, color: colors.text }}>
      <LetterHeader
        university={letterData.university_name}
        subtitle={universityConfig?.header?.office || 'Office of Admissions'}
        logoUrl={letterData.university_logo_url || universityConfig?.logoUrl}
        colors={colors}
        universityConfig={universityConfig}
      />
      <div className="letter-body">
        <div className="letter-meta">
          <span>Reference {letterData.reference_number}</span>
          <span>{letterData.offer_date}</span>
        </div>
        <div className="letter-greeting">Dear {letterData.student_name || 'Applicant'},</div>
        <div className="letter-content">{renderTextBlocks(letterData.offer_text)}</div>
        {letterData.conditions ? (
          <div className="letter-conditions" style={{ borderLeftColor: colors.primary }}>
            <h4>Conditions of Offer</h4>
            {renderTextBlocks(letterData.conditions)}
          </div>
        ) : null}
        <div className="letter-details-grid">
          <div>
            <span>Program</span>
            <strong>{letterData.program_name}</strong>
          </div>
          <div>
            <span>Level</span>
            <strong>{letterData.program_level}</strong>
          </div>
          <div>
            <span>Start Date</span>
            <strong>{letterData.start_date || 'TBA'}</strong>
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
