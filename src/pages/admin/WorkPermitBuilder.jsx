import './CertificateBuilder.css'

export default function WorkPermitBuilder({
  permitDraft,
  permitPreview,
  workPermitTextDraft,
  workPermitOverlayItems,
  workPermitBarcode,
  workPermitArrangeMode,
  selectedWorkPermitField,
  workPermitDraggingField,
  workPermitNudgeStep,
  workPermitSnapEnabled,
  workPermitSnapStep,
  workPermitExporting,
  updatePermitField,
  setWorkPermitArrangeMode,
  setSelectedWorkPermitField,
  setWorkPermitSnapEnabled,
  setWorkPermitSnapStep,
  setWorkPermitNudgeStep,
  addWorkPermitCustomTextItem,
  addWorkPermitCustomImageItem,
  clearWorkPermitCustomTextItems,
  removeWorkPermitCustomTextItem,
  handleAddWorkPermitImage,
  handleWorkPermitStageDoubleClick,
  resetWorkPermitLayout,
  beginWorkPermitDrag,
  updateWorkPermitTextDraft,
  updateWorkPermitCustomTextItem,
  handleReset,
}) {
  return (
    <>
      <form className="certificate-builder-form" onSubmit={(event) => event.preventDefault()}>
        <div className="certificate-form-actions">
          <button type="button" className="admin-btn admin-btn-soft" onClick={handleReset}>
            New Work Permit
          </button>
        </div>

        <div className="certificate-form-grid work-permit-form-grid">
          <label className="admin-field">
            <span>Permit No.</span>
            <input type="text" value={permitDraft.ea_number} onChange={(event) => updatePermitField('ea_number', event.target.value)} />
          </label>
          <label className="admin-field">
            <span>UCI No.</span>
            <input type="text" value={permitDraft.client_number} onChange={(event) => updatePermitField('client_number', event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Application No.</span>
            <input type="text" value={permitDraft.application_number} onChange={(event) => updatePermitField('application_number', event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Family name / Nom</span>
            <input type="text" value={permitDraft.family_name} onChange={(event) => updatePermitField('family_name', event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Given names / Prénom(s)</span>
            <input type="text" value={permitDraft.given_names} onChange={(event) => updatePermitField('given_names', event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Address Line 1</span>
            <input type="text" value={permitDraft.address_line1 || ''} onChange={(event) => updatePermitField('address_line1', event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Address Line 2</span>
            <input type="text" value={permitDraft.address_line2 || ''} onChange={(event) => updatePermitField('address_line2', event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Country</span>
            <input type="text" value={permitDraft.country_line || ''} onChange={(event) => updatePermitField('country_line', event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Date of Birth</span>
            <input type="text" value={permitDraft.date_of_birth} onChange={(event) => updatePermitField('date_of_birth', event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Sex</span>
            <input type="text" value={permitDraft.sex} onChange={(event) => updatePermitField('sex', event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Country of Birth</span>
            <input type="text" value={permitDraft.country_of_birth} onChange={(event) => updatePermitField('country_of_birth', event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Nationality</span>
            <input type="text" value={permitDraft.nationality} onChange={(event) => updatePermitField('nationality', event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Travel Doc No</span>
            <input type="text" value={permitDraft.travel_doc} onChange={(event) => updatePermitField('travel_doc', event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Document Type</span>
            <input type="text" value={permitDraft.travel_doc_type} onChange={(event) => updatePermitField('travel_doc_type', event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Date Issued</span>
            <input type="text" value={permitDraft.date_issued} onChange={(event) => updatePermitField('date_issued', event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Expiry Date</span>
            <input type="text" value={permitDraft.expiry_date} onChange={(event) => updatePermitField('expiry_date', event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Case Type</span>
            <input type="text" value={permitDraft.case_type} onChange={(event) => updatePermitField('case_type', event.target.value)} />
          </label>
          <label className="admin-field">
            <span>LMIA / Exempt No.</span>
            <input type="text" value={permitDraft.lmia_number} onChange={(event) => updatePermitField('lmia_number', event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Employer</span>
            <input type="text" value={permitDraft.employer} onChange={(event) => updatePermitField('employer', event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Employment Location</span>
            <input type="text" value={permitDraft.employment_location} onChange={(event) => updatePermitField('employment_location', event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Occupation</span>
            <input type="text" value={permitDraft.occupation} onChange={(event) => updatePermitField('occupation', event.target.value)} />
          </label>
          <label className="admin-field">
            <span>In Force From</span>
            <input type="text" value={permitDraft.in_force_from} onChange={(event) => updatePermitField('in_force_from', event.target.value)} />
          </label>
          <label className="admin-field admin-field-full">
            <span>Remarks</span>
            <textarea rows="3" value={permitDraft.remarks} onChange={(event) => updatePermitField('remarks', event.target.value)} />
          </label>
        </div>
      </form>

      <aside className="certificate-builder-preview">
        <div className="work-permit-preview">
          <div className="work-permit-arrange-toolbar no-print">
            <div className="work-permit-arrange-copy">
              <strong>Arrange layout</strong>
              <span>Choose a field and nudge it without changing the permit background or artwork.</span>
            </div>
            <button
              type="button"
              className={`admin-btn admin-btn-soft work-permit-arrange-toggle${workPermitArrangeMode ? ' is-active' : ''}`}
              onClick={() => {
                if (workPermitArrangeMode) {
                  /* keep dragging state clean */
                }
                setWorkPermitArrangeMode((current) => !current)
              }}
            >
              {workPermitArrangeMode ? 'Finish arranging' : 'Arrange text'}
            </button>
            <button type="button" className="admin-btn admin-btn-soft" onClick={resetWorkPermitLayout}>
              Reset positions
            </button>
            <button
              type="button"
              className={`admin-btn admin-btn-soft work-permit-arrange-toggle${workPermitSnapEnabled ? ' is-active' : ''}`}
              onClick={() => setWorkPermitSnapEnabled((current) => !current)}
            >
              {workPermitSnapEnabled ? 'Snap on' : 'Snap off'}
            </button>
            <button type="button" className="admin-btn admin-btn-soft" onClick={() => addWorkPermitCustomTextItem('text')}>
              + Text box
            </button>
            <button type="button" className="admin-btn admin-btn-soft" onClick={handleAddWorkPermitImage}>
              + Image
            </button>
            <button type="button" className="admin-btn admin-btn-soft" onClick={() => addWorkPermitCustomTextItem('condition')}>
              + Condition line
            </button>
            <button type="button" className="admin-btn admin-btn-soft" onClick={() => addWorkPermitCustomTextItem('footer')}>
              + Footer line
            </button>
            <button type="button" className="admin-btn admin-btn-soft" onClick={clearWorkPermitCustomTextItems}>
              Clear extras
            </button>
            {selectedWorkPermitField.startsWith('work-permit-custom') ? (
              <button type="button" className="admin-btn admin-btn-soft" onClick={() => removeWorkPermitCustomTextItem(selectedWorkPermitField)}>
                Remove selected
              </button>
            ) : null}
            <label className="work-permit-arrange-field">
              <span>Field</span>
              <select value={selectedWorkPermitField} onChange={(event) => setSelectedWorkPermitField(event.target.value)}>
                {workPermitOverlayItems.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="work-permit-arrange-field">
              <span>Grid</span>
              <select value={workPermitSnapStep} onChange={(event) => setWorkPermitSnapStep(Number.parseFloat(event.target.value) || 0.25)}>
                {[0.1, 0.25, 0.5].map((step) => (
                  <option key={step} value={step}>
                    {step.toFixed(2)}%
                  </option>
                ))}
              </select>
            </label>
            <label className="work-permit-arrange-field">
              <span>Step</span>
              <select value={workPermitNudgeStep} onChange={(event) => setWorkPermitNudgeStep(Number.parseFloat(event.target.value) || 0.15)}>
                {[0.05, 0.15, 0.3].map((step) => (
                  <option key={step} value={step}>
                    {step.toFixed(2)}%
                  </option>
                ))}
              </select>
            </label>
            <div className="work-permit-nudge-pad">
              <button type="button" className="work-permit-nudge-btn" onClick={() => updateWorkPermitTextDraft(selectedWorkPermitField, 0, -workPermitNudgeStep)}>
                Up
              </button>
              <div className="work-permit-nudge-middle">
                <button type="button" className="work-permit-nudge-btn" onClick={() => updateWorkPermitTextDraft(selectedWorkPermitField, -workPermitNudgeStep, 0)}>
                  Left
                </button>
                <button type="button" className="work-permit-nudge-btn" onClick={() => updateWorkPermitTextDraft(selectedWorkPermitField, workPermitNudgeStep, 0)}>
                  Right
                </button>
              </div>
              <button type="button" className="work-permit-nudge-btn" onClick={() => updateWorkPermitTextDraft(selectedWorkPermitField, 0, workPermitNudgeStep)}>
                Down
              </button>
            </div>
          </div>

          <div
            className={`work-permit-stage${workPermitArrangeMode ? ' is-arrange-mode' : ''}`}
            onDoubleClick={handleWorkPermitStageDoubleClick}
          >
            <img className="work-permit-preview-image" src="/documents/work-permit-template-v5.png" alt="Work permit template preview" />
            <div className="work-permit-rules" aria-hidden="true">
              {workPermitOverlayItems && workPermitOverlayItems.map((item) => item.style && (
                <span key={item.key} className={`work-permit-rule is-${item.key}`} style={item.style} />
              ))}
            </div>
            <div className="work-permit-overlay" aria-label="Editable work permit fields">
              {workPermitOverlayItems.map((item) => {
                const value = item.value ?? ''
                const style = item.style
                const kindClass = item.isCustom ? ` is-custom-text is-${item.kind}` : ''

                return (
                  <div
                    key={item.key}
                    className={`work-permit-hotspot is-${item.type} is-${item.key}${kindClass}${selectedWorkPermitField === item.key ? ' is-selected' : ''}${workPermitDraggingField === item.key ? ' is-dragging' : ''}`}
                    style={style}
                    onPointerDown={workPermitArrangeMode ? (event) => beginWorkPermitDrag(event, item.key) : undefined}
                    onClick={() => {
                      if (workPermitArrangeMode) {
                        setSelectedWorkPermitField(item.key)
                      }
                    }}
                  >
                    {workPermitArrangeMode ? (
                      <button
                        type="button"
                        className="work-permit-drag-handle"
                        aria-label={`Move ${item.label}`}
                        onPointerDown={(event) => beginWorkPermitDrag(event, item.key)}
                      >
                        Drag
                      </button>
                    ) : null}
                    {item.type === 'textarea' ? (
                      <textarea
                        aria-label={item.key}
                        spellCheck={false}
                        value={value}
                        onChange={(event) => {
                          if (item.isCustom) {
                            updateWorkPermitCustomTextItem(item.key, event.target.value)
                            return
                          }
                          updateWorkPermitTextDraft(item.key, event.target.value)
                        }}
                      />
                    ) : item.type === 'image' ? (
                      value ? (
                        <img className="work-permit-freeform-image" src={value} alt={item.label} draggable={false} />
                      ) : (
                        <div className="work-permit-freeform-image-placeholder">{item.label}</div>
                      )
                    ) : (
                      <input
                        aria-label={item.key}
                        spellCheck={false}
                        value={value}
                        onChange={(event) => updateWorkPermitTextDraft(item.key, event.target.value)}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="certificate-records-panel">
          <div className="admin-panel-card-header compact">
            <div>
              <h3>Work Permit Preview</h3>
              <p>This mode shows the work permit layout and does not store records in Supabase.</p>
            </div>
          </div>
          <p className="admin-empty">Use the form above to update the work permit preview data.</p>
        </div>
      </aside>
    </>
  )
}
