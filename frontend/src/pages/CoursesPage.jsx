import { useState, useEffect } from 'react';
import { fdpAPI, enrollmentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { HiOutlineAcademicCap, HiOutlineClock, HiOutlineUsers } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function CoursesPage() {
  const { user } = useAuth();
  const [fdps, setFdps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);

  useEffect(() => { loadFdps(); }, []);

  const loadFdps = async () => {
    try {
      const res = await fdpAPI.getAll();
      setFdps(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleEnroll = async (fdpId) => {
    setEnrolling(fdpId);
    try {
      await enrollmentAPI.enroll(fdpId, user.id);
      toast.success('Enrolled successfully!');
      loadFdps();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Enrollment failed');
    } finally { setEnrolling(null); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Browse FDP Programs</h1><p className="text-gray-500 mt-1">Explore and enroll in faculty development programs</p></div>
      {fdps.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><HiOutlineAcademicCap className="text-5xl mx-auto mb-3" /><p>No FDP programs available yet</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fdps.map((fdp) => (
            <div key={fdp.id} className="card-hover flex flex-col">
              <div className="p-1.5"><div className="h-36 gradient-bg rounded-xl flex items-center justify-center"><HiOutlineAcademicCap className="text-white text-4xl" /></div></div>
              <div className="p-5 flex-1 flex flex-col">
                <span className={`badge-${fdp.status === 'Active' ? 'success' : fdp.status === 'Completed' ? 'info' : 'warning'} self-start mb-3`}>{fdp.status}</span>
                <h3 className="font-semibold text-gray-800 mb-2">{fdp.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">{fdp.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                  <span className="flex items-center gap-1"><HiOutlineClock />{fdp.duration}</span>
                  <span className="flex items-center gap-1"><HiOutlineUsers />{fdp.enrolledCount || 0}/{fdp.maxSeats || '∞'}</span>
                  <span className="badge-primary">{fdp.difficultyLevel}</span>
                </div>
                <div className="flex gap-2">
                  <Link to={`/fdp/${fdp.id}`} className="btn-secondary flex-1 text-center text-sm !py-2">Details</Link>
                  <button onClick={() => handleEnroll(fdp.id)} disabled={enrolling === fdp.id} className="btn-primary flex-1 text-sm !py-2">
                    {enrolling === fdp.id ? 'Enrolling...' : 'Enroll'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
