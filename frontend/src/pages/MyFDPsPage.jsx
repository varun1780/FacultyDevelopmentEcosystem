import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { enrollmentAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { HiOutlineAcademicCap } from 'react-icons/hi';

export default function MyFDPsPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    enrollmentAPI.getMyEnrollments(user.id).then(r => setEnrollments(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">My FDPs</h1><p className="text-gray-500 mt-1">Track your enrolled programs</p></div>
      {enrollments.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><HiOutlineAcademicCap className="text-5xl mx-auto mb-3" /><p>No enrollments yet. <Link to="/courses" className="text-primary-600">Browse FDPs</Link></p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrollments.map((e, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">{e.fdpProgram?.title || 'FDP'}</h3>
                <span className={`badge-${e.isCompleted ? 'success' : 'warning'}`}>{e.isCompleted ? 'Completed' : 'In Progress'}</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">{e.fdpProgram?.category} • Quiz Score: {e.quizScore || 0}%</p>
              <div className="mb-3"><div className="flex justify-between text-xs text-gray-500 mb-1"><span>Progress</span><span>{e.progressPercentage || 0}%</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full" style={{ width: `${e.progressPercentage || 0}%` }} /></div></div>
              <Link to={`/fdp/${e.fdpProgram?.id}`} className="btn-ghost text-sm text-primary-600">View Details →</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
