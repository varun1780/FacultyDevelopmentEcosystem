import { useState, useEffect, useCallback } from 'react';
import { adminReportsAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  HiRefresh, HiExclamationCircle, HiDownload, HiFilter
} from 'react-icons/hi';
import {
  BookOpen,
  GraduationCap,
  Users,
  UserPlus,
  CheckCircle,
  Award,
  TrendingUp,
  BadgeCheck
} from 'lucide-react';

export default function AdminReportsPage() {
  const [summary, setSummary] = useState(null);
  const [fdpReport, setFdpReport] = useState([]);
  const [facultyReport, setFacultyReport] = useState([]);
  const [certReport, setCertReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('fdp');

  // Filters
  const [fdpSearch, setFdpSearch] = useState('');
  const [fdpStatusFilter, setFdpStatusFilter] = useState('ALL');
  const [facSearch, setFacSearch] = useState('');
  const [certSearch, setCertSearch] = useState('');

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [sumRes, fdpRes, facRes, certRes] = await Promise.allSettled([
        adminReportsAPI.getSummary(),
        adminReportsAPI.getFdpEnrollments(),
        adminReportsAPI.getFacultyPerformance(),
        adminReportsAPI.getCertificates(),
      ]);
      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data);
      if (fdpRes.status === 'fulfilled') setFdpReport(fdpRes.value.data || []);
      if (facRes.status === 'fulfilled') setFacultyReport(facRes.value.data || []);
      if (certRes.status === 'fulfilled') setCertReport(certRes.value.data || []);
    } catch (e) {
      console.error('Reports load failed:', e);
      setError('Failed to load reports. Ensure backend is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── CSV Export ────────────────────────────────────── */
  const exportCSV = (rows, headers, filename) => {
    if (!rows.length) { toast.error('No data to export'); return; }
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${r[h] ?? ''}"` ).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filename}.csv downloaded`);
  };

  /* ── Loading / Error states ───────────────────────── */
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Generating reports…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="card p-8 text-center max-w-md">
        <HiExclamationCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-800 mb-2">Reports Error</h3>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button onClick={() => loadData()} className="btn-primary text-sm">Retry</button>
      </div>
    </div>
  );

  /* ── Filtered data ────────────────────────────────── */
  const filteredFdp = fdpReport.filter(r => {
    const matchSearch = r.title?.toLowerCase().includes(fdpSearch.toLowerCase());
    const matchStatus = fdpStatusFilter === 'ALL' || r.status === fdpStatusFilter;
    return matchSearch && matchStatus;
  });

  const filteredFac = facultyReport.filter(r =>
    (r.name?.toLowerCase().includes(facSearch.toLowerCase()) || r.email?.toLowerCase().includes(facSearch.toLowerCase()))
  );

  const filteredCert = certReport.filter(r =>
    (r.facultyName?.toLowerCase().includes(certSearch.toLowerCase()) || r.fdpTitle?.toLowerCase().includes(certSearch.toLowerCase()))
  );

  const tabs = [
    { id: 'fdp', label: 'FDP Enrollments', icon: GraduationCap },
    { id: 'faculty', label: 'Faculty Performance', icon: Users },
    { id: 'certificates', label: 'Certificates', icon: Award },
  ];

  const statCards = [
    { label: 'Total FDPs', value: summary?.totalFdps ?? 0, icon: GraduationCap, iconColor: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40 border border-blue-100/50 dark:border-blue-900/30' },
    { label: 'Total Faculty', value: summary?.totalFaculty ?? 0, icon: Users, iconColor: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100/50 dark:border-emerald-900/30' },
    { label: 'Total Enrollments', value: summary?.totalEnrollments ?? 0, icon: UserPlus, iconColor: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40 border border-violet-100/50 dark:border-violet-900/30' },
    { label: 'Completed', value: summary?.completedEnrollments ?? 0, icon: CheckCircle, iconColor: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/40 border border-teal-100/50 dark:border-teal-900/30' },
    { label: 'Certificates', value: summary?.totalCertificates ?? 0, icon: Award, iconColor: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40 border border-purple-100/50 dark:border-purple-900/30' },
    { label: 'Avg. Score', value: (summary?.averageScore ?? 0) + '%', icon: TrendingUp, iconColor: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 border border-amber-100/50 dark:border-amber-900/30' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="text-gray-500 mt-1">Comprehensive platform analytics from database</p>
        </div>
        <button onClick={() => loadData(true)} disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
          <HiRefresh className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((s, i) => (
          <div key={i} className="card p-4 text-center flex flex-col items-center justify-center">
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
              <s.icon className={`w-5 h-5 ${s.iconColor}`} />
            </div>
            <p className="text-xl font-bold text-gray-800">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ── FDP Enrollment Report ─────────────────────── */}
      {activeTab === 'fdp' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <HiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="text" placeholder="Search FDP…" value={fdpSearch} onChange={e => setFdpSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none w-56" />
              </div>
              <select value={fdpStatusFilter} onChange={e => setFdpStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white">
                <option value="ALL">All Status</option>
                <option value="Active">Active</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <button onClick={() => exportCSV(filteredFdp, ['title','category','status','totalEnrolled','completed','inProgress','averageScore','completionRate'], 'fdp_enrollment_report')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-primary-600 hover:text-primary-700 border border-primary-200 rounded-xl hover:bg-primary-50 transition-colors">
              <HiDownload className="w-4 h-4" /> Export CSV
            </button>
          </div>
          {filteredFdp.length === 0 ? (
            <p className="text-gray-400 text-center py-10">No FDP enrollment data found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    {['FDP Title','Category','Status','Enrolled','Completed','In Progress','Avg Score','Completion %'].map(h =>
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredFdp.map(r => (
                    <tr key={r.fdpId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{r.title}</td>
                      <td className="px-4 py-3 text-gray-500">{r.category}</td>
                      <td className="px-4 py-3"><span className={`badge-${r.status === 'Active' ? 'success' : r.status === 'Completed' ? 'info' : 'warning'}`}>{r.status}</span></td>
                      <td className="px-4 py-3 font-medium">{r.totalEnrolled}</td>
                      <td className="px-4 py-3 text-emerald-600 font-medium">{r.completed}</td>
                      <td className="px-4 py-3 text-amber-600 font-medium">{r.inProgress}</td>
                      <td className="px-4 py-3">{r.averageScore}%</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-500 rounded-full" style={{ width: `${r.completionRate}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{r.completionRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Faculty Performance Report ────────────────── */}
      {activeTab === 'faculty' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative">
              <HiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search faculty…" value={facSearch} onChange={e => setFacSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none w-56" />
            </div>
            <button onClick={() => exportCSV(filteredFac, ['name','email','department','totalEnrolled','completed','averageScore','bestScore','certificates','status'], 'faculty_performance_report')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-primary-600 hover:text-primary-700 border border-primary-200 rounded-xl hover:bg-primary-50 transition-colors">
              <HiDownload className="w-4 h-4" /> Export CSV
            </button>
          </div>
          {filteredFac.length === 0 ? (
            <p className="text-gray-400 text-center py-10">No faculty performance data found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    {['Faculty','Email','Department','Enrolled','Completed','Avg Score','Best Score','Certs','Status'].map(h =>
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredFac.map(r => (
                    <tr key={r.userId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(r.name || '?')[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{r.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{r.email}</td>
                      <td className="px-4 py-3 text-gray-500">{r.department || '—'}</td>
                      <td className="px-4 py-3 font-medium">{r.totalEnrolled}</td>
                      <td className="px-4 py-3 text-emerald-600 font-medium">{r.completed}</td>
                      <td className="px-4 py-3">{r.averageScore}%</td>
                      <td className="px-4 py-3 text-primary-600 font-semibold">{r.bestScore}%</td>
                      <td className="px-4 py-3">{r.certificates}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${(!r.status || r.status === 'ACTIVE') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {r.status || 'ACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Certificate Issuance Report ──────────────── */}
      {activeTab === 'certificates' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative">
              <HiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search by faculty or FDP…" value={certSearch} onChange={e => setCertSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none w-64" />
            </div>
            <button onClick={() => exportCSV(filteredCert, ['certificateId','facultyName','facultyEmail','fdpTitle','issuedAt','isOnChain','isValid'], 'certificate_report')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-primary-600 hover:text-primary-700 border border-primary-200 rounded-xl hover:bg-primary-50 transition-colors">
              <HiDownload className="w-4 h-4" /> Export CSV
            </button>
          </div>
          {filteredCert.length === 0 ? (
            <div className="text-center py-10">
              <BadgeCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">No certificates issued yet.</p>
              <p className="text-xs text-gray-300 mt-1">Certificates appear here after faculty complete FDPs.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    {['Certificate ID','Faculty','Email','FDP','Issued','On-Chain','Valid'].map(h =>
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCert.map(r => (
                    <tr key={r.certificateId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{r.certificateId?.substring(0, 12)}…</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{r.facultyName}</td>
                      <td className="px-4 py-3 text-gray-500">{r.facultyEmail}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{r.fdpTitle}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{r.issuedAt ? new Date(r.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.isOnChain ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {r.isOnChain ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {r.isValid ? 'Valid' : 'Revoked'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
