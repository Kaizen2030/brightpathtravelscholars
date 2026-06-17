import { LetterFooter, SignatureBlock, renderTextBlocks } from '../shared/LetterComponents.jsx'

export default function TicketTemplate({ letterData, colors, universityConfig }) {
  const locationLine = [letterData.university_city || universityConfig?.city, letterData.university_destination].filter(Boolean).join(' • ')

  return (
    <div className="letter-page ticket-layout" style={{ backgroundColor: colors.pageBg, color: colors.text }}>
      <div className="letter-header ticket-header" style={{ borderBottom: `1px dashed ${colors.accent}` }}>
        <div>
          <span className="ticket-label">Admissions Pass</span>
          <h1>{letterData.university_name}</h1>
          <p>{locationLine}</p>
        </div>
        <div className="ticket-meta">
          <strong>{letterData.reference_number}</strong>
          <span>{letterData.offer_date}</span>
        </div>
      </div>
      <div className="letter-body ticket-body">
        <div className="letter-greeting">Dear {letterData.student_name || 'Applicant'},</div>
        <div className="letter-content">{renderTextBlocks(letterData.offer_text)}</div>
        <div className="letter-details-grid ticket-grid">
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
