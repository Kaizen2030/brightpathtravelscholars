import './CertificateBuilder.css'

export default function IeltsBuilder({
  draft,
  preview,
  overallBand,
  records,
  updateField,
  renderUploadCard,
  handleSave,
  handleDuplicate,
  handleReset,
  handleLoad,
  handleDelete,
  saving,
}) {
  return (
    <>
      <form className="certificate-builder-form" onSubmit={handleSave}>
        <div className="certificate-form-actions">
          <button type="button" className="admin-btn admin-btn-soft" onClick={handleReset}>
            New Applicant
          </button>
          <button type="button" className="admin-btn admin-btn-soft" onClick={handleDuplicate}>
            Duplicate
          </button>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Record'}
          </button>
        </div>

        <div className="certificate-image-grid">
          {['profile_photo_url', 'centre_stamp_url', 'validation_stamp_url', 'british_council_logo_url', 'idp_logo_url', 'cambridge_logo_url'].map((key) => {
            const field = {
              key,
              label: key
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (char) => char.toUpperCase()),
              helper: '',
              fit: key === 'profile_photo_url' ? 'cover' : 'contain',
            }
            return renderUploadCard(field)
          })}
        </div>

        <div className="certificate-form-grid">
          <label className="admin-field">
            <span>Applicant Full Name</span>
            <input
              type="text"
              required
              value={draft.full_name}
              onChange={(event) => updateField('full_name', event.target.value)}
            />
          </label>

          <label className="admin-field">
            <span>Candidate ID</span>
            <input type="text" value={draft.candidate_id} onChange={(event) => updateField('candidate_id', event.target.value)} />
          </label>

          <label className="admin-field">
            <span>Report Number</span>
            <input type="text" value={draft.report_number} onChange={(event) => updateField('report_number', event.target.value)} />
          </label>

          <label className="admin-field">
            <span>Passport Number</span>
            <input type="text" value={draft.passport_number} onChange={(event) => updateField('passport_number', event.target.value)} />
          </label>

          <label className="admin-field">
            <span>Nationality</span>
            <input type="text" value={draft.nationality} onChange={(event) => updateField('nationality', event.target.value)} />
          </label>

          <label className="admin-field">
            <span>Date of Birth</span>
            <input type="date" value={draft.date_of_birth} onChange={(event) => updateField('date_of_birth', event.target.value)} />
          </label>

          <label className="admin-field">
            <span>Test Type</span>
            <select value={draft.test_type} onChange={(event) => updateField('test_type', event.target.value)}>
              <option value="Academic">Academic</option>
              <option value="General Training">General Training</option>
            </select>
          </label>

          <label className="admin-field">
            <span>Test Date</span>
            <input type="date" value={draft.test_date} onChange={(event) => updateField('test_date', event.target.value)} />
          </label>

          <label className="admin-field">
            <span>Issue Date</span>
            <input type="date" value={draft.issue_date} onChange={(event) => updateField('issue_date', event.target.value)} />
          </label>

          <label className="admin-field">
            <span>Centre Name</span>
            <input type="text" value={draft.centre_name} onChange={(event) => updateField('centre_name', event.target.value)} />
          </label>

          <label className="admin-field">
            <span>Centre Code</span>
            <input type="text" value={draft.centre_code} onChange={(event) => updateField('centre_code', event.target.value)} />
          </label>

          <label className="admin-field">
            <span>Location</span>
            <input type="text" value={draft.location} onChange={(event) => updateField('location', event.target.value)} />
          </label>

          <label className="admin-field">
            <span>Listening Band</span>
            <input
              type="number"
              min="0"
              max="9"
              step="0.5"
              value={draft.listening}
              onChange={(event) => updateField('listening', event.target.value)}
            />
          </label>

          <label className="admin-field">
            <span>Reading Band</span>
            <input
              type="number"
              min="0"
              max="9"
              step="0.5"
              value={draft.reading}
              onChange={(event) => updateField('reading', event.target.value)}
            />
          </label>

          <label className="admin-field">
            <span>Writing Band</span>
            <input
              type="number"
              min="0"
              max="9"
              step="0.5"
              value={draft.writing}
              onChange={(event) => updateField('writing', event.target.value)}
            />
          </label>

          <label className="admin-field">
            <span>Speaking Band</span>
            <input
              type="number"
              min="0"
              max="9"
              step="0.5"
              value={draft.speaking}
              onChange={(event) => updateField('speaking', event.target.value)}
            />
          </label>

          <label className="admin-field">
            <span>Overall Band</span>
            <input
              type="number"
              min="0"
              max="9"
              step="0.5"
              value={draft.overall}
              onChange={(event) => updateField('overall', event.target.value)}
              placeholder={overallBand}
            />
          </label>

          <label className="admin-field">
            <span>Verifier Name</span>
            <input type="text" value={draft.verifier_name} onChange={(event) => updateField('verifier_name', event.target.value)} />
          </label>

          <label className="admin-field">
            <span>Verifier Title</span>
            <input type="text" value={draft.verifier_title} onChange={(event) => updateField('verifier_title', event.target.value)} />
          </label>

          <label className="admin-field admin-field-full">
            <span>Notes</span>
            <textarea rows="3" value={draft.notes} onChange={(event) => updateField('notes', event.target.value)} />
          </label>
        </div>
      </form>

      <aside className="certificate-builder-preview">
        <div className="ielts-trf-preview">
          <div className="ielts-paper-page">
            <div className="ielts-paper-content">
              <div className="ielts-paper-top-header">
                <div className="ielts-logo">
                  <div className="ielts-logo-text">IELTS</div>
                  <div className="ielts-logo-sub">Test report form</div>
                </div>
                <div className="ielts-general-box">{preview.testType}</div>
              </div>

              <div className="ielts-notice">
                NOTE. &nbsp;Admission to undergraduate and postgraduate courses should be based on ACADEMIC Reading and Writing Modules.
                {preview.trainingLabel}
                <br />
                Reading and Writing Modules are not designed to best the fill range of language skills required for academic purposes
                <br />
                It is recommended that the candidate&apos;s language, ability as indicated in this Test Report Form be re-assessed after two years from date of the test
              </div>

              <div className="ielts-meta-row">
                <div className="ielts-meta-item">
                  <span className="ielts-meta-label">Centre number</span>
                  <div className="ielts-meta-box">{preview.centreCode}</div>
                </div>
                <div className="ielts-meta-item">
                  <span className="ielts-meta-label">Date</span>
                  <div className="ielts-meta-box">{preview.issueDate}</div>
                </div>
                <div className="ielts-meta-spacer" />
                <div className="ielts-meta-item" style={{ borderRight: 'none' }}>
                  <span className="ielts-meta-label">Candidate number</span>
                  <div className="ielts-meta-box" style={{ minWidth: '100px' }}>
                    {preview.candidateNumber}
                  </div>
                </div>
              </div>

              <div className="ielts-section-title">Candidate Details</div>

              <div className="ielts-candidate-section">
                <div className="ielts-fields-col">
                  <div className="ielts-field-row">
                    <div className="ielts-field-label">Family name</div>
                    <div className="ielts-field-box">{preview.familyName}</div>
                  </div>

                  <div className="ielts-field-row">
                    <div className="ielts-field-label">First name</div>
                    <div className="ielts-field-box">{preview.firstName}</div>
                  </div>

                  <div className="ielts-field-row">
                    <div className="ielts-field-label">Candidate ID</div>
                    <div className="ielts-field-box">{preview.candidateId}</div>
                  </div>

                  <div className="ielts-field-row" style={{ minHeight: '36px' }}>
                    <div className="ielts-field-label">Date of birth</div>
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 0 }}>
                      <div className="ielts-field-box" style={{ minWidth: '110px' }}>
                        {preview.dob}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 8px' }}>
                        <span className="ielts-field-label-sm" style={{ fontSize: '10px', color: '#333' }}>
                          Sex(M/F)
                        </span>
                        <div className="ielts-field-box-sm" style={{ minWidth: '32px' }}>
                          {preview.sex}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 8px' }}>
                        <span className="ielts-field-label-sm" style={{ fontSize: '10px', color: '#333' }}>
                          Scheme code
                        </span>
                        <div className="ielts-field-box-sm" style={{ minWidth: '110px' }}>
                          {preview.schemeCode}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ielts-field-row">
                    <div className="ielts-field-label">
                      Country or region
                      <br />
                      of origin
                    </div>
                    <div className="ielts-field-box">{preview.originCountry}</div>
                  </div>

                  <div className="ielts-field-row">
                    <div className="ielts-field-label">
                      Country of
                      <br />
                      nationality
                    </div>
                    <div className="ielts-field-box">{preview.nationality}</div>
                  </div>

                  <div className="ielts-field-row">
                    <div className="ielts-field-label">First language</div>
                    <div className="ielts-field-box">{preview.firstLanguage}</div>
                  </div>
                </div>

                <div className="ielts-photo-col">
                  <div className={`ielts-photo-placeholder${preview.profilePhotoUrl ? ' has-photo' : ''}`} aria-hidden="true">
                    {preview.profilePhotoUrl ? <img className="ielts-photo-image" src={preview.profilePhotoUrl} alt="Candidate" /> : null}
                  </div>
                </div>
              </div>

              <div className="ielts-section-title">Test results</div>

              <div className="ielts-results-section">
                <div className="ielts-scores-row">
                  <div className="ielts-score-item">
                    <span className="ielts-score-skill-label">Listening</span>
                    <div className="ielts-score-box">{preview.listening}</div>
                  </div>
                  <div className="ielts-score-item">
                    <span className="ielts-score-skill-label">Reading</span>
                    <div className="ielts-score-box">{preview.reading}</div>
                  </div>
                  <div className="ielts-score-item">
                    <span className="ielts-score-skill-label">Writing</span>
                    <div className="ielts-score-box">{preview.writing}</div>
                  </div>
                  <div className="ielts-score-item">
                    <span className="ielts-score-skill-label">Speaking</span>
                    <div className="ielts-score-box">{preview.speaking}</div>
                  </div>

                  <div className="ielts-overall-group">
                    <div className="ielts-overall-label-stack">
                      Overall
                      <br />
                      band
                      <br />
                      score
                    </div>
                    <div className="ielts-overall-box">{preview.overallDisplay}</div>
                  </div>

                  <div className="ielts-cefr-group">
                    <div className="ielts-cefr-label-stack">CEFR<br />Level</div>
                    <div className="ielts-cefr-box">{preview.cefr}</div>
                  </div>
                </div>
              </div>

              <div className="ielts-bottom-section">
                <div className="ielts-good-box-wrap">
                  <div className="ielts-good-box">
                    <span className="ielts-good-text">GOOD</span>
                  </div>
                </div>

                <div className="ielts-stamps-col">
                  <div className="ielts-stamps-row">
                    <div className="ielts-stamp-group">
                      <div className="ielts-stamp-caption">Centre stamp</div>
                      <div className="ielts-stamp-bc">
                        {preview.centreStampUrl ? (
                          <img className="ielts-stamp-image" src={preview.centreStampUrl} alt="Centre stamp" />
                        ) : (
                          <>
                            <div className="ielts-stamp-bc-dots">
                              <div className="ielts-stamp-bc-dot" />
                              <div className="ielts-stamp-bc-dot" />
                              <div className="ielts-stamp-bc-dot" />
                              <div className="ielts-stamp-bc-dot" />
                            </div>
                            <div className="ielts-stamp-bc-text">
                              BRITISH
                              <br />
                              COUNCIL
                              <br />
                              EXAMINATIONS
                              <br />
                              SERVICES
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="ielts-stamp-group">
                      <div className="ielts-stamp-caption">Validation stamp</div>
                      <div className="ielts-stamp-ielts">
                        {preview.validationStampUrl ? (
                          <img className="ielts-stamp-image" src={preview.validationStampUrl} alt="Validation stamp" />
                        ) : (
                          <div className="ielts-stamp-ielts-inner">
                            <span className="ielts-stamp-ielts-text">IELTS</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ielts-sig-row">
                <div className="ielts-sig-block">
                  <div className="ielts-sig-label">Administrator&apos;s<br />signature</div>
                  <div className="ielts-sig-line">
                    <span className="ielts-sig-cursive">{preview.verifierName}</span>
                  </div>
                </div>

                <div className="ielts-date-block">
                  <span className="ielts-date-label">Date</span>
                  <div className="ielts-date-box">{preview.issueDate}</div>
                </div>

                <div className="ielts-trf-block">
                  <div className="ielts-trf-label">Test Report Form<br />Number</div>
                  <div className="ielts-trf-box">{preview.reportNumber}</div>
                </div>
              </div>

              <div className="ielts-bottom-logos">
                <div className="ielts-logo-bc">
                  {preview.britishCouncilLogoUrl ? (
                    <img className="ielts-footer-image is-british-council" src={preview.britishCouncilLogoUrl} alt="British Council logo" />
                  ) : (
                    <div className="ielts-footer-placeholder is-british-council" aria-hidden="true" />
                  )}
                </div>

                <div className="ielts-logo-idp">
                  {preview.idpLogoUrl ? (
                    <img className="ielts-footer-image is-idp" src={preview.idpLogoUrl} alt="IDP logo" />
                  ) : (
                    <div className="ielts-footer-placeholder is-idp" aria-hidden="true" />
                  )}
                </div>

                <div className="ielts-logo-cambridge">
                  {preview.cambridgeLogoUrl ? (
                    <img className="ielts-footer-image is-cambridge" src={preview.cambridgeLogoUrl} alt="Cambridge logo" />
                  ) : (
                    <div className="ielts-footer-placeholder is-cambridge" aria-hidden="true" />
                  )}
                </div>
              </div>

              <div className="ielts-verify-footer">
                The validity of IELTS Test Report Form can be verified online by recognising organizations at https//IELTS.ucles.org.uk
              </div>
            </div>
          </div>
        </div>

        <div className="certificate-records-panel">
          <div className="admin-panel-card-header compact">
            <div>
              <h3>Shared Applicants</h3>
              <p>Records are synced to Supabase and cached locally as a fallback.</p>
            </div>
            <span className="certificate-record-count">{records.length}</span>
          </div>

          <div className="certificate-record-list">
            {records.length ? (
              records.map((record) => {
                const isActive = record.id === draft.id
                return (
                  <article key={record.id} className={`certificate-record-item${isActive ? ' active' : ''}`}>
                    <div>
                      <strong>{record.full_name || 'Unnamed applicant'}</strong>
                      <span>
                        {record.candidate_id || 'No candidate ID'}
                        {record.report_number ? ` | ${record.report_number}` : ''}
                      </span>
                      <small>
                        {record.test_type || 'Academic'} | {record.nationality || 'Nationality pending'}
                      </small>
                    </div>
                    <div className="certificate-record-actions">
                      <button type="button" className="admin-btn admin-btn-soft" onClick={() => handleLoad(record)}>
                        Load
                      </button>
                      <button type="button" className="admin-btn admin-btn-danger" onClick={() => handleDelete(record.id)}>
                        Delete
                      </button>
                    </div>
                  </article>
                )
              })
            ) : (
              <p className="admin-empty">
                No shared applicants yet. Save this record to push it to Supabase and make it reusable for the team.
              </p>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
