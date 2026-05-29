import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { enrollmentAPI, certificateAPI, analyticsAPI } from '../services/api';
import { HiOutlineAcademicCap, HiOutlineBadgeCheck, HiOutlineChartBar, HiOutlineClipboardCheck } from 'react-icons/hi';
import { Link } from 'react-router-dom';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [enrollRes, certRes, analyticsRes] = await Promise.allSettled([
        enrollmentAPI.getMyEnrollments(user.id),
        certificateAPI.getMyCertificates(user.id),
        analyticsAPI.getFacultyAnalytics(user.id),
      ]);
      if (enrollRes.status === 'fulfilled') setEnrollments(enrollRes.value.data);
      if (certRes.status === 'fulfilled') setCertificates(certRes.value.data);
      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data);
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  }

  const stats = [
    { label: 'Enrolled FDPs', value: analytics?.totalEnrolled || enrollments.length, icon: HiOutlineAcademicCap, color: 'from-blue-500 to-blue-600' },
    { label: 'Completed', value: analytics?.completed || 0, icon: HiOutlineClipboardCheck, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Certificates', value: analytics?.certificates || certificates.length, icon: HiOutlineBadgeCheck, color: 'from-purple-500 to-purple-600' },
    { label: 'Avg Score', value: (analytics?.averageScore || 0) + '%', icon: HiOutlineChartBar, color: 'from-amber-500 to-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 mt-1">Here's your learning progress overview</p>
      </div>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="section-title">Current Enrollments</h3>
          {enrollments.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <HiOutlineAcademicCap className="text-4xl mx-auto mb-2" />
              <p>No enrollments yet. <Link to="/courses" className="text-primary-600">Browse FDPs</Link></p>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.slice(0, 5).map((e, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-sm text-gray-800">{e.fdpProgram?.title || 'FDP Program'}</p>
                    <p className="text-xs text-gray-500">Progress: {e.progressPercentage || 0}%</p>
                  </div>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all" style={{ width: `${e.progressPercentage || 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card p-6">
          <h3 className="section-title">My Certificates</h3>
          {certificates.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <HiOutlineBadgeCheck className="text-4xl mx-auto mb-2" />
              <p>Complete an FDP to earn your first certificate!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {certificates.slice(0, 5).map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-sm text-gray-800">{c.fdpProgram?.title}</p>
                    <p className="text-xs text-gray-500">{c.certificateId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/verify-certificate/${c.certificateId}`} className="btn-secondary !py-1 !px-2.5 text-xs font-semibold">
                      View
                    </Link>
                    <span className={`badge-${c.isOnChain ? 'success' : 'warning'}`}>
                      {c.isOnChain ? 'On-Chain' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-3">
        <Link to="/courses" className="btn-primary">Browse FDPs</Link>
        <Link to="/ai-mentor" className="btn-secondary">AI Mentor</Link>
        <Link to="/skill-gap" className="btn-ghost">Skill Analysis</Link>
      </div>
    </div>
  );
}
