/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { SCHOLARSHIP_CARD_FALLBACKS } from '../../lib/scholarshipCatalog'
import './AdminCatalog.css'

const EMPTY_FORM = {
  id: '',
  university: '',
  name: '',
  amount: '',
  deadline: '',
  eligibility: '',
  apply_url: '/contact',
}

function formatDate(value) {
  if (!value) return 'Rolling'
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

function isPast(value) {
  if (!value) return false
  return new Date(value).getTime() < Date.now() - 24 * 60 * 60 * 1000
}

/** Manages the scholarship cards shown in the "Scholarships" section of the Study Abroad page. */
function ScholarshipsManager() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('scholarships').select('*').order('deadline', { ascending: true })
      if (error) throw error
      setRows(data ?? [])
    } catch (error) {
      setNotice({ type: 'error', text: `Could not load scholarships: ${error.message || error}` })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function importDefaults() {
    setBusy(true)
    setNotice(null)
    try {
      const payload = SCHOLARSHIP_CARD_FALLBACKS.map((item) => ({
        university: item.university,
        name: item.name,
        amount: item.amount,
        deadline: item.deadline || null,
        eligibility: item.eligibility,
        apply_url: item.apply_url,
      }))
      const { error } = await supabase.from('scholarships').insert(payload)
      if (error) throw error
      setNotice({ type: 'success', text: `Added ${payload.length} default scholarships. Edit them to update deadlines and amounts.` })
      await load()
    } catch (error) {
      setNotice({ type: 'error', text: error.message || String(error) })
    } finally {
      setBusy(false)
    }
  }

  function openEditor(row = null) {
    setForm(row ? { ...EMPTY_FORM, ...row, deadline: row.deadline || '' } : EMPTY_FORM)
    setModalOpen(true)
  }

  async function handleSave(event) {
    event.preventDefault()
    setBusy(true)
    setNotice(null)
    try {
      const payload = {
        university: form.university.trim(),
        name: form.name.trim(),
        amount: form.amount.trim() || null,
        deadline: form.deadline || null,
        eligibility: form.eligibility.trim() || null,
        apply_url: form.apply_url.trim() || null,
      }
      const { error } = form.id
        ? await supabase.from('scholarships').update(payload).eq('id', form.id)
        : await supabase.from('scholarships').insert(payload)
      if (error) throw error
      setNotice({ type: 'success', text: form.id ? 'Scholarship updated.' : 'Scholarship added.' })
      setModalOpen(false)
      await load()
    } catch (error) {
      setNotice({ type: 'error', text: error.message || String(error) })
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(row) {
    if (!window.confirm(`Delete "${row.name}" (${row.university})? This cannot be undone.`)) return
    setBusy(true)
    setNotice(null)
    try {
      const { error } = await supabase.from('scholarships').delete().eq('id', row.id)
      if (error) throw error
      setRows((current) => current.filter((item) => item.id !== row.id))
      setNotice({ type: 'success', text: 'Scholarship deleted.' })
    } catch (error) {
      setNotice({ type: 'error', text: error.message || String(error) })
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="admin-loading">Loading scholarships...</div>

  return (
    <div className="admin-section-stack">
      {notice ? <div className={`admin-notice ${notice.type === 'error' ? 'error' : 'success'}`}>{notice.text}</div> : null}

      {!rows.length ? (
        <section className="admin-panel-card catalog-import-card">
          <div className="admin-panel-card-header">
            <div>
              <h2>No scholarships in the database yet</h2>
              <p>
                The Study Abroad page is showing {SCHOLARSHIP_CARD_FALLBACKS.length} built-in example cards. Import them to edit,
                or add your own.
              </p>
            </div>
            <button type="button" className="admin-btn admin-btn-primary" onClick={importDefaults} disabled={busy}>
              Import {SCHOLARSHIP_CARD_FALLBACKS.length} defaults
            </button>
          </div>
        </section>
      ) : null}

      <section className="admin-panel-card">
        <div className="admin-panel-card-header">
          <div>
            <h2>Scholarships</h2>
            <p>Cards shown in the Scholarships section of the Study Abroad page ({rows.length}).</p>
          </div>
          <button type="button" className="admin-btn admin-btn-primary" onClick={() => openEditor(null)}>
            Add Scholarship
          </button>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Scholarship</th>
                <th>University</th>
                <th>Amount</th>
                <th>Deadline</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td data-label="Scholarship">
                    <strong>{row.name}</strong>
                    <div className="catalog-subtext">{row.eligibility}</div>
                  </td>
                  <td data-label="University">{row.university}</td>
                  <td data-label="Amount">{row.amount}</td>
                  <td data-label="Deadline">
                    {formatDate(row.deadline)}
                    {isPast(row.deadline) ? <span className="catalog-tag hidden">Passed</span> : null}
                  </td>
                  <td data-label="Actions">
                    <div className="admin-action-row">
                      <button type="button" className="admin-btn admin-btn-soft" onClick={() => openEditor(row)}>
                        Edit
                      </button>
                      <button type="button" className="admin-btn admin-btn-danger" disabled={busy} onClick={() => handleDelete(row)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length ? <p className="admin-empty">No scholarships yet.</p> : null}
        </div>
      </section>

      {modalOpen ? (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>{form.id ? 'Edit Scholarship' : 'Add Scholarship'}</h3>
              <button type="button" className="admin-icon-btn" onClick={() => setModalOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <form className="admin-modal-form" onSubmit={handleSave}>
              <label className="admin-field">
                <span>Scholarship name *</span>
                <input value={form.name} onChange={(event) => setForm((c) => ({ ...c, name: event.target.value }))} required />
              </label>
              <label className="admin-field">
                <span>University / provider *</span>
                <input
                  value={form.university}
                  onChange={(event) => setForm((c) => ({ ...c, university: event.target.value }))}
                  required
                />
              </label>
              <label className="admin-field">
                <span>Amount</span>
                <input
                  value={form.amount}
                  onChange={(event) => setForm((c) => ({ ...c, amount: event.target.value }))}
                  placeholder="e.g. Up to CAD 10,000"
                />
              </label>
              <label className="admin-field">
                <span>Deadline (leave empty for rolling)</span>
                <input type="date" value={form.deadline} onChange={(event) => setForm((c) => ({ ...c, deadline: event.target.value }))} />
              </label>
              <label className="admin-field">
                <span>Eligibility</span>
                <textarea
                  rows={3}
                  value={form.eligibility}
                  onChange={(event) => setForm((c) => ({ ...c, eligibility: event.target.value }))}
                />
              </label>
              <label className="admin-field">
                <span>Apply link</span>
                <input
                  value={form.apply_url}
                  onChange={(event) => setForm((c) => ({ ...c, apply_url: event.target.value }))}
                  placeholder="/contact or https://..."
                />
              </label>
              <div className="admin-modal-actions">
                <button type="button" className="admin-btn admin-btn-soft" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={busy}>
                  {busy ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default ScholarshipsManager
