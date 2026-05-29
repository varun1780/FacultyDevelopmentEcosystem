import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI } from '../services/api';
import { HiOutlineChartBar } from 'react-icons/hi';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = user?.role === 'ADMIN' ? analyticsAPI.getAdminAnalytics() : analyticsAPI.getFacultyAnalytics(user.id);
    fetch.then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="page-title flex items-center gap-2"><HiOutlineChartBar className="text-primary-500" /> Analytics</h1><p className="text-gray-500 mt-1">{user?.role === 'ADMIN' ? 'Platform-wide analytics' : 'Your performance insights'}</p></div>
      {user?.role === 'ADMIN' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Total Faculty', value: data?.totalFaculty || 0, color: 'text-blue-600' },
            { label: 'Total FDPs', value: data?.totalFdps || 0, color: 'text-purple-600' },
            { label: 'Active FDPs', value: data?.activeFdps || 0, color: 'text-emerald-600' },
            { label: 'Total Enrollments', value: data?.totalEnrollments || 0, color: 'text-amber-600' },
            { label: 'Completion Rate', value: (data?.completionRate || 0) + '%', color: 'text-primary-600' },
            { label: 'Avg Quiz Score', value: (data?.averageQuizScore || 0) + '%', color: 'text-pink-600' },
          ].map((s, i) => (
            <div key={i} className="stat-card"><p className={`text-3xl font-bold ${s.color}`}>{s.value}</p><p className="text-sm text-gray-500 mt-1">{s.label}</p></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Enrolled Programs', value: data?.totalEnrolled || 0 },
            { label: 'Completed', value: data?.completed || 0 },
            { label: 'In Progress', value: data?.inProgress || 0 },
            { label: 'Average Score', value: (data?.averageScore || 0) + '%' },
          ].map((s, i) => (
            <div key={i} className="stat-card"><p className="text-3xl font-bold text-primary-600">{s.value}</p><p className="text-sm text-gray-500 mt-1">{s.label}</p></div>
          ))}
        </div>
      )}
      {data?.categoryDistribution && Object.keys(data.categoryDistribution).length > 0 && (
        <div className="card p-6"><h3 className="section-title">Category Distribution</h3><div className="space-y-3">{Object.entries(data.categoryDistribution).map(([cat, count]) => (
          <div key={cat} className="flex items-center gap-3"><span className="text-sm text-gray-600 w-40">{cat}</span><div className="flex-1 bg-gray-200 rounded-full h-3"><div className="bg-gradient-to-r from-primary-500 to-accent-500 h-3 rounded-full" style={{ width: `${Math.min((count / (data.totalFdps || 1)) * 100, 100)}%` }} /></div><span className="text-sm font-medium text-gray-700 w-10 text-right">{count}</span></div>
        ))}</div></div>
      )}
    </div>
  );
}
