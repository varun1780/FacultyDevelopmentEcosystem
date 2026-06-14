import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI, notificationAPI, fdpAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  HiOutlineAcademicCap, HiOutlineUsers, HiOutlineBadgeCheck, 
  HiOutlineChartBar, HiRefresh, HiExclamationCircle, HiOutlineBell,
  HiOutlinePencilAlt, HiOutlineEye, HiOutlineTrash
} from 'react-icons/hi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const collegeName = user?.college?.collegeName || user?.college?.collegeCode || 'Institution';
  
  const [analytics, setAnalytics] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [analyticsRes, notifRes] = await Promise.all([
        analyticsAPI.getAdminAnalytics(),
        notificationAPI.getAll()
      ]);
      setAnalytics(analyticsRes.data);
      setNotifications(notifRes.data || []);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => loadData(true), 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleDeleteFdp = async (id) => {
    if (!window.confirm("Are you sure you want to delete this FDP? All enrollments and certificates will be lost.")) return;
    try {
      await fdpAPI.delete(id);
      toast.success("FDP deleted successfully");
      loadData(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete FDP");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading {collegeName} dashboard...</p>
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
    { label: 'Total FDPs', value: analytics?.totalFdps ?? 0, icon: HiOutlineAcademicCap, color: 'from-blue-500 to-blue-600', link: '/admin/fdps' },
    { label: 'Total Faculty', value: analytics?.totalFaculty ?? 0, icon: HiOutlineUsers, color: 'from-emerald-500 to-emerald-600', link: '/admin/users' },
    { label: 'Total Enrollments', value: analytics?.totalEnrollments ?? 0, icon: HiOutlineChartBar, color: 'from-violet-500 to-violet-600', link: '/admin/reports' },
    { label: 'Certificates Issued', value: analytics?.totalCertificates ?? 0, icon: HiOutlineBadgeCheck, color: 'from-purple-500 to-purple-600', link: '/admin/certificates' },
    { label: 'Completion Rate', value: (analytics?.completionRate ?? 0) + '%', icon: HiOutlineChartBar, color: 'from-amber-500 to-amber-600', link: '/admin/reports' },
    { label: 'Avg. Quiz Score', value: (analytics?.averageQuizScore ?? 0) + '%', icon: HiOutlineBadgeCheck, color: 'from-teal-500 to-teal-600', link: '/admin/reports' },
  ];

  const recentFdps = analytics?.recentFdps || [];
  const topPerformers = analytics?.topPerformers || [];
  
  // Format Chart Data
  const categoryData = Object.entries(analytics?.categoryDistribution || {}).map(([name, value]) => ({ name, value }));
  const trendData = Object.entries(analytics?.enrollmentTrends || {}).map(([month, count]) => ({ month, count }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title text-2xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <span className="font-semibold text-primary-600">{collegeName}</span>
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full border border-gray-200">Admin Dashboard</span>
          </p>
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
          <Link to="/admin/create-fdp" className="btn-primary shadow-lg shadow-primary-500/20">+ Create FDP</Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {stats.map((s, i) => (
          <Link key={i} to={s.link} className="card-hover p-4 text-center rounded-2xl flex flex-col items-center justify-center border border-gray-100 bg-white">
            <div className={`w-10 h-10 mb-3 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-inner`}>
              <s.icon className="text-white text-lg" />
            </div>
            <p className="text-2xl font-bold text-gray-800 leading-none">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1.5 font-medium">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FDP Category Distribution */}
        <div className="card p-6">
          <h3 className="section-title mb-4 text-sm font-bold text-gray-700 uppercase tracking-wider">FDP Category Distribution</h3>
          {categoryData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No data available</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {categoryData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Enrollment Trends */}
        <div className="card p-6">
          <h3 className="section-title mb-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Enrollment Trends</h3>
          {trendData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No data available</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent FDPs & Top Performers & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent FDPs */}
        <div className="card p-6 lg:col-span-2 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title text-sm font-bold text-gray-700 uppercase tracking-wider">Recent Programs</h3>
            <Link to="/admin/fdps" className="text-xs font-semibold text-primary-600 hover:text-primary-700">View All</Link>
          </div>
          {recentFdps.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
              <HiOutlineAcademicCap className="text-4xl text-gray-300 mb-2" />
              <p className="text-gray-400 text-sm">No FDPs created yet</p>
              <Link to="/admin/create-fdp" className="text-primary-600 text-xs font-medium mt-1">Create your first FDP</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentFdps.map((fdp) => (
                <div key={fdp.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/50 hover:bg-white rounded-xl border border-gray-100 hover:border-primary-100 hover:shadow-md hover:shadow-primary-500/5 transition-all gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-primary-600">{fdp.category ? fdp.category.substring(0, 2).toUpperCase() : 'AI'}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-gray-900 truncate">{fdp.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span className={`badge-${fdp.status === 'Active' ? 'success' : fdp.status === 'Completed' ? 'info' : 'warning'} px-1.5 py-0.5 text-[10px]`}>{fdp.status}</span>
                        <span>•</span>
                        <span>{fdp.enrolledCount} / {fdp.maxSeats} enrolled</span>
                        <span>•</span>
                        <span>{fdp.duration}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to={`/admin/reports`} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Analytics">
                      <HiOutlineChartBar className="text-lg" />
                    </Link>
                    <Link to={`/admin/fdp/edit/${fdp.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit FDP">
                      <HiOutlinePencilAlt className="text-lg" />
                    </Link>
                    <button onClick={() => handleDeleteFdp(fdp.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete FDP">
                      <HiOutlineTrash className="text-lg" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6 flex flex-col">
          {/* Top Performers */}
          <div className="card p-6 flex-1">
            <h3 className="section-title mb-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Top Faculty</h3>
            {topPerformers.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No faculty enrolled yet</p>
            ) : (
              <div className="space-y-4">
                {topPerformers.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm shadow-primary-500/20">{i + 1}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-gray-800 truncate">{p.facultyName}</p>
                      <p className="text-[10px] text-gray-500 truncate">{p.fdpName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-sm font-bold text-emerald-600 block">{p.score}%</span>
                      <span className="text-[10px] text-gray-400 block">{p.certificates} Certs</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="card p-6 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title text-sm font-bold text-gray-700 uppercase tracking-wider">Live Updates</h3>
              <HiOutlineBell className="text-gray-400 text-lg" />
            </div>
            {notifications.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No new updates</p>
            ) : (
              <div className="space-y-4">
                {notifications.slice(0, 4).map((n) => (
                  <div key={n.id} className="flex items-start gap-3">
                    <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${!n.isRead ? 'bg-primary-500' : 'bg-gray-300'}`} />
                    <div>
                      <p className={`text-sm ${!n.isRead ? 'font-medium text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{n.message}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-2 text-center border-t border-gray-100">
                  <Link to="/dashboard" className="text-xs font-medium text-primary-600 hover:text-primary-700">View all notifications</Link>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
