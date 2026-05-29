import { useState, useEffect, useCallback } from 'react';
import { analyticsAPI } from '../services/api';
import { HiOutlineAcademicCap, HiOutlineUsers, HiOutlineBadgeCheck, HiOutlineChartBar, HiRefresh, HiExclamationCircle } from 'react-icons/hi';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await analyticsAPI.getAdminAnalytics();
      setAnalytics(res.data);
    } catch (e) {
      console.error('Failed to load dashboard analytics:', e);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh every 30 seconds to keep dashboard live
  useEffect(() => {
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="card p-8 text-center max-w-md">
          <HiExclamationCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800 mb-2">Dashboard Error</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button onClick={() => loadData()} className="btn-primary text-sm">Retry</button>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total FDPs', value: analytics?.totalFdps ?? 0, icon: HiOutlineAcademicCap, color: 'from-blue-500 to-blue-600' },
    { label: 'Total Faculty', value: analytics?.totalFaculty ?? 0, icon: HiOutlineUsers, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Certificates Issued', value: analytics?.totalCertificates ?? 0, icon: HiOutlineBadgeCheck, color: 'from-purple-500 to-purple-600' },
    { label: 'Completion Rate', value: (analytics?.completionRate ?? 0) + '%', icon: HiOutlineChartBar, color: 'from-amber-500 to-amber-600' },
  ];

  const recentFdps = analytics?.recentFdps || [];
  const topPerformers = analytics?.topPerformers || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Platform overview and management</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <HiRefresh className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link to="/admin/create-fdp" className="btn-primary">+ Create FDP</Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                <s.icon className="text-white text-xl" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <HiOutlineAcademicCap className="text-blue-500 text-lg" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-800">{analytics?.activeFdps ?? 0}</p>
            <p className="text-xs text-gray-500">Active FDPs</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
            <HiOutlineUsers className="text-emerald-500 text-lg" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-800">{analytics?.totalEnrollments ?? 0}</p>
            <p className="text-xs text-gray-500">Total Enrollments</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <HiOutlineChartBar className="text-amber-500 text-lg" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-800">{analytics?.averageQuizScore ?? 0}%</p>
            <p className="text-xs text-gray-500">Avg. Quiz Score</p>
          </div>
        </div>
      </div>

      {/* Recent FDPs + Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="section-title">Recent FDPs</h3>
          {recentFdps.length === 0 ? (
            <p className="text-gray-400 text-center py-6">No FDPs created yet</p>
          ) : (
            <div className="space-y-3">
              {recentFdps.map((fdp) => (
                <Link key={fdp.id} to={`/fdp/${fdp.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-sm text-gray-800">{fdp.title}</p>
                    <p className="text-xs text-gray-500">{fdp.category} • {fdp.duration}</p>
                  </div>
                  <span className={`badge-${fdp.status === 'Active' ? 'success' : fdp.status === 'Completed' ? 'info' : 'warning'}`}>{fdp.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="card p-6">
          <h3 className="section-title">Top Performers</h3>
          {topPerformers.length === 0 ? (
            <p className="text-gray-400 text-center py-6">No performance data yet</p>
          ) : (
            <div className="space-y-3">
              {topPerformers.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold">{i + 1}</div>
                    <div>
                      <p className="font-medium text-sm text-gray-800">{p.facultyName}</p>
                      <p className="text-xs text-gray-500">{p.fdpName}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-primary-600">{p.score}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/fdps" className="card-hover p-6 text-center">
          <HiOutlineAcademicCap className="text-3xl text-primary-500 mx-auto mb-2" />
          <p className="font-semibold text-gray-800">Manage FDPs</p>
          <p className="text-xs text-gray-500">{analytics?.totalFdps ?? 0} programs</p>
        </Link>
        <Link to="/admin/certificates" className="card-hover p-6 text-center">
          <HiOutlineBadgeCheck className="text-3xl text-purple-500 mx-auto mb-2" />
          <p className="font-semibold text-gray-800">Certificates</p>
          <p className="text-xs text-gray-500">{analytics?.totalCertificates ?? 0} issued</p>
        </Link>
        <Link to="/admin/analytics" className="card-hover p-6 text-center">
          <HiOutlineChartBar className="text-3xl text-emerald-500 mx-auto mb-2" />
          <p className="font-semibold text-gray-800">Analytics</p>
          <p className="text-xs text-gray-500">View insights</p>
        </Link>
      </div>
    </div>
  );
}
