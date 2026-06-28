// ─── AdminDashboard.tsx ───────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import {
  getAdminDashboard, adminDecision, getAllUsers, getAllProjects, getAllocations,
  addProject,
  type AdminReview, type DashboardStats,
} from '../services/api';

const BASE_URL = "https://ecoconnect-backend-7qov.onrender.com";

// ─── Types ────────────────────────────────────────────────────────────────────
type DecisionState = Record<string, 'loading' | 'approved' | 'rejected' | null>;
type ActiveTab = 'reviews' | 'allocations' | 'users' | 'kyc' | 'create';

// ─── Shared micro-components ──────────────────────────────────────────────────
function StatCard({ icon, value, label, color = 'text-primary' }:
  { icon: React.ReactNode; value: string | number; label: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-border p-6 hover:shadow-md transition-shadow">
      <span className={`text-2xl mb-4 block ${color}`}>{icon}</span>
      <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function KYCBadge({ status }: { status?: string }) {
  if (!status) return null;
  const map: Record<string, string> = {
    verified: 'text-emerald-600',
    pending:  'text-amber-500',
    rejected: 'text-red-500',
  };
  return (
    <span className={`text-xs font-medium ${map[status] ?? 'text-slate-500'}`}>
      {status === 'verified' ? '✓' : '○'}
    </span>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────
function ReviewCard({
  review, decision, onDecision,
}: {
  review: AdminReview;
  decision: 'loading' | 'approved' | 'rejected' | null;
  onDecision: (id: string, action: 'approve' | 'reject' | 'reshortlist') => void;
}) {
  const isSettled = decision === 'approved' || decision === 'rejected';

  return (
    <div className={`border rounded-xl p-5 mb-4 last:mb-0 transition-all duration-300
                    ${isSettled ? 'opacity-60 bg-slate-50' : 'bg-white border-border'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground">{review.project_title}</h4>
            <span className="text-muted-foreground text-sm">ⓘ</span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Budget: ${review.budget?.toLocaleString()}
          </p>
        </div>
        {isSettled && (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold
            ${decision === 'approved'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-red-100 text-red-700'}`}>
            {decision}
          </span>
        )}
      </div>

      {/* Client + Champion grid */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Client</p>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">{review.client_name}</span>
            <KYCBadge status="verified" />
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Champion</p>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">{review.champion_name}</span>
            <span className="text-primary text-xs">🌿</span>
          </div>
        </div>
      </div>

      {/* Submitted */}
      <p className="text-xs text-muted-foreground mb-4">
        Submitted: {review.submitted_at}
      </p>

      {/* Actions */}
      {!isSettled && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDecision(review.project_id, 'reject')}
            disabled={decision === 'loading'}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border
                       text-sm font-medium text-slate-600 hover:bg-red-50 hover:border-red-200
                       hover:text-red-600 transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <line x1="15" y1="9" x2="9" y2="15" strokeWidth="2"/>
              <line x1="9" y1="9" x2="15" y2="15" strokeWidth="2"/>
            </svg>
            Reject
          </button>
          <button
            onClick={() => onDecision(review.project_id, 'approve')}
            disabled={decision === 'loading'}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-emerald-200
                       bg-emerald-50 text-sm font-medium text-emerald-700
                       hover:bg-emerald-100 transition-all disabled:opacity-50"
          >
            {decision === 'loading'
              ? <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" strokeDasharray="30" strokeDashoffset="10"/>
                </svg>
              : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            }
            Approve
          </button>
          <button
            onClick={() => onDecision(review.project_id, 'reshortlist')}
            disabled={decision === 'loading'}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border
                       text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all
                       disabled:opacity-50 bg-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            Review
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Activity Row ─────────────────────────────────────────────────────────────
function ActivityRow({ item }: { item: any }) {
  const isApproval = item.type === 'approved' || item.action?.includes('Approved');
  const isKYC      = item.type === 'kyc' || item.action?.includes('KYC');
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center
                      ${isApproval ? 'text-emerald-500' : isKYC ? 'text-blue-500' : 'text-slate-400'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">
          {item.action ?? (isApproval ? 'Project Approved' : isKYC ? 'KYC Verified' : 'Action Taken')}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {item.detail ?? item.project_title ?? item.champion_name}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          by {item.admin_name ?? 'Admin'} · {item.time ?? item.submitted_at}
        </p>
      </div>
    </div>
  );
}

// ─── Tab component ────────────────────────────────────────────────────────────
function Tab({ label, active, badge, onClick }:
  { label: string; active: boolean; badge?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                  transition-all ${active
                    ? 'bg-white border border-border text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'}`}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold
          ${active ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── KYC Candidate Card ───────────────────────────────────────────────────────
function KYCCandidateCard({ user, onStatusChange }: { user: any; onStatusChange: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const statusColor =
    user.kyc_status === 'verified'  ? 'bg-emerald-100 text-emerald-700' :
    user.kyc_status === 'rejected'  ? 'bg-red-100 text-red-700' :
    user.kyc_status === 'pending'   ? 'bg-amber-100 text-amber-700' :
                                      'bg-slate-100 text-slate-500';

  const updateKYC = async (status: 'verified' | 'rejected') => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/update-user/${user.user_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ kyc_status: status }),
      });
      if (!res.ok) throw new Error('Update failed');
      onStatusChange();
    } catch {
      alert('KYC update failed. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const initials = user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) ?? '??';

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header row — always visible */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center
                          text-sm font-bold text-primary flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="font-medium text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColor}`}>
            {user.kyc_status ?? 'not submitted'}
          </span>
          <span className="text-muted-foreground text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded profile */}
      {expanded && (
        <div className="border-t border-border p-5 bg-slate-50 space-y-5">

          {/* Basic info grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: 'Occupation',      value: user.occupation },
              { label: 'Country',         value: user.country },
              { label: 'Experience',      value: user.experience_years },
              { label: 'Employer',        value: user.employer },
              { label: 'Portfolio',       value: user.portfolio },
              { label: 'Certifications',  value: user.certifications },
              { label: 'Internships',     value: user.internships },
            ].map(({ label, value }) => value ? (
              <div key={label}>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-0.5">
                  {label}
                </p>
                <p className="text-foreground break-words">{value}</p>
              </div>
            ) : null)}
          </div>

          {/* Bio */}
          {user.bio && (
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">Bio</p>
              <p className="text-sm text-foreground leading-relaxed">{user.bio}</p>
            </div>
          )}

          {/* Skills */}
          {user.skills?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Skills</p>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((s: string) => (
                  <span key={s}
                    className="px-2.5 py-1 bg-white border border-border rounded-full text-xs text-foreground">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Domains */}
          {user.domains?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Domains</p>
              <div className="flex flex-wrap gap-2">
                {user.domains.map((d: string) => (
                  <span key={d}
                    className="px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary font-medium">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Documents section */}
          <div className="bg-white border border-border rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              📋 KYC Documents
            </p>

            {/* Government ID */}
            <div className="flex items-center justify-between py-2 border-b border-border text-sm">
              <span className="text-foreground font-medium">Government ID</span>
              {user.id_proof ? (
                <span className="font-mono text-foreground bg-slate-100 px-2.5 py-1 rounded text-xs">
                  {user.id_proof}
                </span>
              ) : (
                <span className="text-red-500 text-xs font-medium">⚠ Not provided</span>
              )}
            </div>

            {/* Resume */}
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="text-foreground font-medium">Resume / CV</span>
              {user.resume ? (
                <a
                  href={user.resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white
                             text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  ⬇ Download Resume
                </a>
              ) : (
                <span className="text-red-500 text-xs font-medium">⚠ Not uploaded</span>
              )}
            </div>
          </div>

          {/* KYC action buttons */}
          {user.kyc_status !== 'verified' && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => updateKYC('verified')}
                disabled={updating}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white
                           text-sm font-semibold rounded-lg hover:bg-emerald-700
                           transition-colors disabled:opacity-60"
              >
                {updating ? '...' : '✓ Approve KYC'}
              </button>
              <button
                onClick={() => updateKYC('rejected')}
                disabled={updating}
                className="flex items-center gap-1.5 px-4 py-2 border border-red-200
                           text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50
                           transition-colors disabled:opacity-60"
              >
                {updating ? '...' : '✕ Reject KYC'}
              </button>
            </div>
          )}

          {user.kyc_status === 'verified' && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => updateKYC('rejected')}
                disabled={updating}
                className="flex items-center gap-1.5 px-4 py-2 border border-red-200
                           text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50
                           transition-colors disabled:opacity-60"
              >
                {updating ? '...' : '✕ Revoke KYC'}
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ─── KYC Panel ────────────────────────────────────────────────────────────────
function KYCPanel() {
  const [kycUsers, setKycUsers]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');

  const load = () => {
    setLoading(true);
    getAllUsers()
      .then((users: any[]) => setKycUsers(users.filter(u => u.role === 'freelancer')))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = filter === 'all'
    ? kycUsers
    : kycUsers.filter(u => (u.kyc_status ?? 'not submitted') === filter);

  const counts = {
    all:      kycUsers.length,
    pending:  kycUsers.filter(u => u.kyc_status === 'pending').length,
    verified: kycUsers.filter(u => u.kyc_status === 'verified').length,
    rejected: kycUsers.filter(u => u.kyc_status === 'rejected').length,
  };

  return (
    <div className="bg-white rounded-xl border border-border">
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
        <div>
          <h2 className="font-semibold text-lg text-foreground">KYC Verification</h2>
          <p className="text-sm text-muted-foreground">Review candidate profiles and documents</p>
        </div>
        <button
          onClick={load}
          className="text-xs text-primary font-medium hover:underline"
        >
          Refresh
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 px-6 pt-4">
        {(['all', 'pending', 'verified', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border
              ${filter === f
                ? f === 'verified'  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                : f === 'pending'   ? 'bg-amber-100 text-amber-700 border-amber-200'
                : f === 'rejected'  ? 'bg-red-100 text-red-700 border-red-200'
                :                    'bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-white text-muted-foreground border-border hover:bg-slate-50'}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {' '}({counts[f]})
          </button>
        ))}
      </div>

      <div className="p-6 space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-muted-foreground text-sm">No candidates in this category.</p>
          </div>
        ) : (
          filtered.map(u => (
            <KYCCandidateCard key={u.user_id} user={u} onStatusChange={load} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Create Project Panel ─────────────────────────────────────────────────────
function CreateProjectPanel() {
  const [form, setForm] = useState({
    title:           '',
    required_skills: '',
    budget:          '',
    timeline:        '',
    scope:           '',
    client_email:    '',
    company_name:    '',
    duration:        '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  const handleSubmit = async () => {
  if (!form.title.trim() || !form.budget || !form.timeline.trim()) {
    setError('Title, budget and timeline are required.');
    return;
  }
  setLoading(true);
  setError('');
  setSuccess('');
  try {
    const payload = {
      ...form,
      budget: parseFloat(form.budget),
      required_skills: form.required_skills
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean),
    };
    await addProject(payload);
    setSuccess('Project created successfully! 🎉');
    setForm({
      title: '', required_skills: '', budget: '',
      timeline: '', scope: '', client_email: '',
      company_name: '', duration: '',
    });
  } catch (e: any) {
    setError(e.message || 'Something went wrong. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const Field = ({
    label, fieldKey, placeholder, required = false, type = 'text',
  }: {
    label: string; fieldKey: string; placeholder: string;
    required?: boolean; type?: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={(form as any)[fieldKey]}
        onChange={e => setForm(f => ({ ...f, [fieldKey]: e.target.value }))}
        placeholder={placeholder}
        className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-foreground
                   placeholder:text-muted-foreground focus:outline-none
                   focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
      />
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-border">
      <div className="px-6 pt-5 pb-4 border-b border-border">
        <h2 className="font-semibold text-lg text-foreground">Create New Project</h2>
        <p className="text-sm text-muted-foreground">Add a project to the platform</p>
      </div>

      <div className="p-6 max-w-2xl space-y-4">
        <Field label="Project Title"     fieldKey="title"        placeholder="e.g. ESG Reporting Consultant"            required />
        <Field label="Required Skills"   fieldKey="required_skills" placeholder="e.g. ESG, Carbon Accounting, Excel (comma separated)" />
        <Field label="Budget (₹)"        fieldKey="budget"       placeholder="e.g. 50000"  required type="number" />
        <Field label="Timeline"          fieldKey="timeline"     placeholder="e.g. 3 months" required />
        <Field label="Duration"          fieldKey="duration"     placeholder="e.g. Part-time, 3 months" />
        <Field label="Client Email"      fieldKey="client_email" placeholder="client@company.com" type="email" />
        <Field label="Company Name"      fieldKey="company_name" placeholder="e.g. Tata Power" />

        {/* Scope textarea */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Scope</label>
          <textarea
            value={form.scope}
            onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}
            placeholder="Describe the project scope and deliverables..."
            rows={4}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-foreground
                       placeholder:text-muted-foreground resize-none focus:outline-none
                       focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {error   && <p className="text-red-500 text-sm">{error}</p>}
        {success && (
          <p className="text-emerald-600 text-sm font-medium bg-emerald-50 border border-emerald-100
                        rounded-lg px-4 py-2.5">
            {success}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg
                     hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {loading ? 'Creating...' : 'Create Project →'}
        </button>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
export function AdminDashboard() {
  const [data, setData] = useState<{
    stats: DashboardStats; pending_reviews: AdminReview[]; recent_activity: any[];
  } | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [decisions, setDecisions] = useState<DecisionState>({});
  const [activeTab, setActiveTab] = useState<ActiveTab>('reviews');
  const [allAllocations, setAllAllocations] = useState<AdminReview[]>([]);
  const [allocLoading, setAllocLoading]     = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getAdminDashboard()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  // Load allocations when tab switches
  useEffect(() => {
    if (activeTab !== 'allocations') return;
    setAllocLoading(true);
    getAllocations()
      .then(setAllAllocations)
      .catch(() => {})
      .finally(() => setAllocLoading(false));
  }, [activeTab]);

  const handleDecision = async (projectId: string, action: 'approve' | 'reject' | 'reshortlist') => {
    setDecisions(d => ({ ...d, [projectId]: 'loading' }));
    try {
      await adminDecision(projectId, action);
      setDecisions(d => ({
        ...d,
        [projectId]: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : null,
      }));
      setTimeout(load, 800);
    } catch (e: any) {
      setDecisions(d => ({ ...d, [projectId]: null }));
      alert(`Decision failed: ${e.message}`);
    }
  };

  if (loading) return <AdminSkeleton />;
  if (error)   return <ErrorState message={error} onRetry={load} />;
  if (!data)   return null;

  const { stats, pending_reviews, recent_activity } = data;

  const pendingCount = pending_reviews.filter(r =>
    !decisions[r.project_id] || decisions[r.project_id] === 'loading'
  ).length;

  const statCards = [
    {
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
            </svg>,
      value: stats.pending_reviews ?? 0, label: 'Pending Reviews', color: 'text-amber-500',
    },
    {
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>,
      value: stats.approved_today ?? 0, label: 'Approved Today', color: 'text-emerald-500',
    },
    {
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
            </svg>,
      value: stats.kyc_pending ?? 0, label: 'KYC Verification', color: 'text-blue-500',
    },
    {
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round"
                d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z"/>
              <path strokeWidth="2" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>,
      value: stats.active_users?.toLocaleString() ?? '—', label: 'Active Users', color: 'text-primary',
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Page header */}
      <div className="bg-white border-b border-border px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage platform approvals and user verification</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200
                             text-amber-700 text-sm font-semibold rounded-xl hover:bg-amber-100
                             transition-colors">
            🏅 Project Associate
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => <StatCard key={i} {...s} />)}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-muted/60 p-1 rounded-xl w-fit mb-6 flex-wrap">
          <Tab label="Pending Reviews"  active={activeTab === 'reviews'}
            badge={pendingCount}         onClick={() => setActiveTab('reviews')} />
          <Tab label="All Allocations"  active={activeTab === 'allocations'}
            onClick={() => setActiveTab('allocations')} />
          <Tab label="User Management"  active={activeTab === 'users'}
            onClick={() => setActiveTab('users')} />
          <Tab label="KYC Verification" active={activeTab === 'kyc'}
            badge={stats.kyc_pending}    onClick={() => setActiveTab('kyc')} />
          <Tab label="Create Project"   active={activeTab === 'create'}
            onClick={() => setActiveTab('create')} />
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          {/* ── Main panel ── */}
          <div>
            {/* ─ Pending Reviews ─ */}
            {activeTab === 'reviews' && (
              <div className="bg-white rounded-xl border border-border">
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
                  <div>
                    <h2 className="font-semibold text-lg text-foreground">Pending Project Reviews</h2>
                    <p className="text-sm text-muted-foreground">Projects awaiting approval</p>
                  </div>
                  {pendingCount > 0 && (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 rounded-full
                                     text-xs font-semibold text-amber-700">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                        <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
                      </svg>
                      {pendingCount} pending
                    </span>
                  )}
                </div>
                <div className="p-6">
                  {pending_reviews.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-3xl mb-3">✅</p>
                      <p className="text-muted-foreground text-sm">All caught up! No pending reviews.</p>
                    </div>
                  ) : (
                    pending_reviews.map(r => (
                      <ReviewCard
                        key={r.allocation_id}
                        review={r}
                        decision={decisions[r.project_id] ?? null}
                        onDecision={handleDecision}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ─ All Allocations ─ */}
            {activeTab === 'allocations' && (
              <div className="bg-white rounded-xl border border-border">
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
                  <div>
                    <h2 className="font-semibold text-lg text-foreground">All Allocations</h2>
                    <p className="text-sm text-muted-foreground">Complete assignment history</p>
                  </div>
                  <button onClick={() => {
                    setAllocLoading(true);
                    getAllocations().then(setAllAllocations).finally(() => setAllocLoading(false));
                  }} className="text-xs text-primary font-medium hover:underline">
                    Refresh
                  </button>
                </div>
                <div className="p-6">
                  {allocLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : allAllocations.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-3xl mb-3">📋</p>
                      <p className="text-muted-foreground text-sm">No allocations yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            {['Project', 'Client', 'Champion', 'Budget', 'Status', 'Date'].map(h => (
                              <th key={h} className="text-left py-3 px-2 text-xs font-semibold
                                                     text-muted-foreground uppercase tracking-wide">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {allAllocations.map(a => (
                            <tr key={a.allocation_id}
                              className="border-b border-border last:border-0 hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-2 font-medium text-foreground max-w-[160px]">
                                <span className="truncate block">{a.project_title}</span>
                              </td>
                              <td className="py-3 px-2 text-muted-foreground">{a.client_name}</td>
                              <td className="py-3 px-2">
                                <span className="flex items-center gap-1">
                                  {a.champion_name}
                                  <span className="text-primary text-xs">🌿</span>
                                </span>
                              </td>
                              <td className="py-3 px-2 font-semibold text-foreground">
                                ${a.budget?.toLocaleString()}
                              </td>
                              <td className="py-3 px-2">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                                  ${a.status === 'approved'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : a.status === 'rejected'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-amber-100 text-amber-700'}`}>
                                  {a.status}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-muted-foreground text-xs">
                                {a.submitted_at}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─ User Management ─ */}
            {activeTab === 'users' && <UserManagementPanel />}

            {/* ─ KYC Verification ─ */}
            {activeTab === 'kyc' && <KYCPanel />}

            {/* ─ Create Project ─ */}
            {activeTab === 'create' && <CreateProjectPanel />}
          </div>

          {/* ── Right sidebar ── */}
          <div className="space-y-5">
            {/* Today's overview */}
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground mb-4">Today's Overview</h3>
              <div className="space-y-3">
                {[
                  { label: 'Approvals',        value: stats.approvals_today ?? 12,        color: 'text-emerald-600' },
                  { label: 'Rejections',       value: stats.rejections_today ?? 3,        color: 'text-red-500' },
                  { label: 'KYC Verified',     value: stats.kyc_verified_today ?? 7,      color: 'text-blue-600' },
                  { label: 'Avg. Review Time', value: stats.avg_review_time ?? '2.5 hrs', color: 'text-slate-700' },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className={`font-bold ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent activity */}
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground mb-1">Recent Activity</h3>
              <p className="text-sm text-muted-foreground mb-4">Latest admin actions</p>
              {recent_activity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No activity yet.</p>
              ) : (
                recent_activity.slice(0, 5).map((a, i) => <ActivityRow key={i} item={a} />)
              )}
            </div>

            {/* Platform health */}
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground mb-4">Platform Health</h3>
              <div className="space-y-3">
                {[
                  { label: 'Approval Rate', value: '80%', bar: 80 },
                  { label: 'KYC Pass Rate', value: '93%', bar: 93 },
                  { label: 'Active Rate',   value: '67%', bar: 67 },
                ].map((m, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{m.label}</span>
                      <span className="font-semibold text-foreground">{m.value}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-primary transition-all duration-700"
                        style={{ width: `${m.bar}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── User Management Panel ────────────────────────────────────────────────────
function UserManagementPanel() {
  const [users, setUsers]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<'all' | 'freelancer' | 'client'>('all');

  useEffect(() => {
    getAllUsers().then(setUsers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? users : users.filter(u => u.role === filter);

  return (
    <div className="bg-white rounded-xl border border-border">
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
        <div>
          <h2 className="font-semibold text-lg text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground">{users.length} registered users</p>
        </div>
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
          {(['all', 'freelancer', 'client'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded text-xs font-medium capitalize transition-all
                ${filter === f ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'}`}>
              {f === 'freelancer' ? 'Champions' : f === 'client' ? 'Clients' : 'All'}
            </button>
          ))}
        </div>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-lg"/>)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">No users found.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(u => (
              <div key={u.user_id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50
                           transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center
                                  justify-center text-xs font-bold text-primary">
                    {u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium
                    ${u.role === 'freelancer' ? 'bg-emerald-100 text-emerald-700'
                      : u.role === 'client'   ? 'bg-blue-100 text-blue-700'
                      :                         'bg-amber-100 text-amber-700'}`}>
                    {u.role === 'freelancer' ? 'Champion' : u.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Skeletons & Error ────────────────────────────────────────────────────────
function AdminSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30 animate-pulse">
      <div className="bg-white border-b border-border px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 w-52 bg-slate-200 rounded mb-2"/>
          <div className="h-4 w-72 bg-slate-100 rounded"/>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-xl border h-32"/>)}
        </div>
        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          <div className="bg-white rounded-xl border h-96"/>
          <div className="space-y-5">
            <div className="bg-white rounded-xl border h-48"/>
            <div className="bg-white rounded-xl border h-48"/>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-4">⚠️</p>
        <h2 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h2>
        <p className="text-sm text-muted-foreground mb-5">{message}</p>
        <button onClick={onRetry}
          className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold
                     hover:bg-primary/90 transition-colors">
          Retry
        </button>
      </div>
    </div>
  );
}
