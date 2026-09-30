import { ArrowLeft, FileText, Search, UserX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import DesignationField from '../../components/DesignationField'
import StatusBadge from '../../components/StatusBadge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/ui/PageHeader'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from '../../context/AuthContext'
import { DEPARTMENTS } from '../../lib/departments'
import { api } from '../../lib/api'

const STATUSES = ['applied', 'shortlisted', 'interview', 'hired', 'rejected']
const EMPTY_HIRE_FORM = { department: '', job_title: '' }

export default function JobApplicantsPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const canChangeStatus = profile?.role === 'hr'
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [hiringId, setHiringId] = useState(null)
  const [hireForm, setHireForm] = useState(EMPTY_HIRE_FORM)
  const [hireError, setHireError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const load = () =>
    api.get(`/recruitment/jobs/${jobId}/applications/`).then(({ data }) => setApplications(data))

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [jobId])

  const updateStatus = async (appId, status, extra = {}) => {
    const { data } = await api.patch(`/recruitment/applications/${appId}/status/`, { status, ...extra })
    setApplications((as) => as.map((a) => (a.id === appId ? data : a)))
  }

  const startHire = (appId) => {
    setHiringId(appId)
    setHireForm(EMPTY_HIRE_FORM)
    setHireError('')
  }

  const confirmHire = async (appId) => {
    if (!hireForm.department || !hireForm.job_title) {
      setHireError('Department and designation are both required to hire.')
      return
    }
    try {
      await updateStatus(appId, 'hired', hireForm)
      setHiringId(null)
    } catch (err) {
      setHireError(err.response?.data?.detail || 'Could not hire candidate.')
    }
  }

  const viewResume = async (app) => {
    const { data } = await api.get(app.resume, { responseType: 'blob' })
    window.open(URL.createObjectURL(data), '_blank', 'noreferrer')
  }

  const q = search.trim().toLowerCase()
  const filteredApplications = applications
    .filter((a) => !q || (a.candidate.full_name || a.candidate.email).toLowerCase().includes(q))
    .filter((a) => !statusFilter || a.status === statusFilter)

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 mb-4">
        <ArrowLeft size={16} /> Back to jobs
      </button>
      <PageHeader title="Applicants" subtitle={applications[0]?.job_code} />

      {loading ? (
        <Spinner />
      ) : applications.length === 0 ? (
        <EmptyState icon={UserX} title="No applications yet" />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search by candidate name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-2 py-2 text-sm"
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {filteredApplications.length === 0 ? (
            <EmptyState icon={UserX} title="No applicants match these filters" />
          ) : (
            <div className="space-y-3">
              {filteredApplications.map((app) => (
                <div key={app.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm shadow-slate-200/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{app.candidate.full_name || app.candidate.email}</p>
                      <p className="text-xs text-slate-400">{app.candidate.email}</p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                  {app.cover_letter && <p className="text-sm text-slate-600 mt-2">{app.cover_letter}</p>}
                  <div className="flex items-center flex-wrap gap-2 mt-3">
                    {app.resume ? (
                      <button onClick={() => viewResume(app)} className="flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:text-indigo-700">
                        <FileText size={15} /> View resume
                      </button>
                    ) : (
                      <span className="text-sm text-slate-400">Resume no longer retained</span>
                    )}
                    {app.status === 'hired' ? (
                      <span className="ml-auto text-sm text-slate-400">Status locked</span>
                    ) : !canChangeStatus ? (
                      <span className="ml-auto text-sm text-slate-400">Only HR can change status</span>
                    ) : (
                      <select
                        value={app.status}
                        onChange={(e) => (e.target.value === 'hired' ? startHire(app.id) : updateStatus(app.id, e.target.value))}
                        className="ml-auto border border-slate-300 rounded-lg px-2 py-1 text-sm"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {hiringId === app.id && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                      <select
                        value={hireForm.department}
                        onChange={(e) => setHireForm({ department: e.target.value, job_title: '' })}
                        className="border border-slate-300 rounded-lg px-2 py-1 text-sm"
                      >
                        <option value="">Department</option>
                        {DEPARTMENTS.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                      {hireForm.department && (
                        <DesignationField
                          live
                          department={hireForm.department}
                          value={hireForm.job_title}
                          onChange={(job_title) => setHireForm((f) => ({ ...f, job_title }))}
                        />
                      )}
                      {hireError && <p className="w-full text-sm text-red-600">{hireError}</p>}
                      <Button size="sm" onClick={() => confirmHire(app.id)}>Confirm hire</Button>
                      <Button size="sm" variant="ghost" onClick={() => setHiringId(null)}>Cancel</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
