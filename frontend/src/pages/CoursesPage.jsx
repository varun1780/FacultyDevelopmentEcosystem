import { useState, useEffect } from 'react';
import { fdpAPI, enrollmentAPI, collegeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { HiOutlineAcademicCap, HiOutlineClock, HiOutlineUsers, HiOutlineFilter } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { ShareFDPButton } from '../components/ShareFDPModal';

export default function CoursesPage() {
  const { user } = useAuth();
  const [fdps, setFdps] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => { 
    loadData();
  }, []);

  useEffect(() => {
    loadFdps();
  }, [selectedCollege, selectedCategory]);

  const loadData = async () => {
    try {
      const [resCol, resCat] = await Promise.all([
        collegeAPI.getAll(),
        fdpAPI.getCategories()
      ]);
      setColleges(resCol.data);
      setCategories(resCat.data);
    } catch (e) { console.error(e); }
  };

  const loadFdps = async () => {
    setLoading(true);
    try {
      const res = await fdpAPI.getAll(selectedCollege, selectedCategory);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Browse FDP Programs</h1>
          <p className="text-gray-500 mt-1">Explore and enroll in multi-college faculty development programs</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200">
            <HiOutlineFilter className="text-gray-400" />
            <select 
              value={selectedCollege} 
              onChange={e => setSelectedCollege(e.target.value)}
              className="bg-transparent text-sm font-medium focus:outline-none text-gray-700"
            >
              <option value="">All Institutions</option>
              {colleges.map(c => <option key={c.id} value={c.id}>{c.collegeName}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200">
            <select 
              value={selectedCategory} 
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-transparent text-sm font-medium focus:outline-none text-gray-700"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
      ) : fdps.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><HiOutlineAcademicCap className="text-5xl mx-auto mb-3" /><p>No FDP programs match your criteria</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fdps.map((fdp) => (
            <div key={fdp.id} className="card-hover flex flex-col">
              <div className="p-1.5 relative">
                <div className="h-36 gradient-bg rounded-xl flex items-center justify-center overflow-hidden">
                  {fdp.thumbnailUrl ? (
                    <img src={fdp.thumbnailUrl} alt={fdp.title} className="absolute w-full h-full object-cover" />
                  ) : (
                    <>
                      {fdp.college && fdp.college.logo ? (
                         <img src={fdp.college.logo} alt={fdp.college.collegeName} className="opacity-30 absolute w-full h-full object-cover mix-blend-overlay" />
                      ) : null}
                      <HiOutlineAcademicCap className="text-white text-4xl relative z-10" />
                    </>
                  )}
                </div>
                {fdp.college && (
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded-lg text-primary-700 shadow-sm flex items-center gap-1.5">
                    {fdp.college.logo && <img src={fdp.college.logo} className="w-4 h-4 rounded-full" alt="logo" />}
                    {fdp.college.collegeCode}
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <span className={`badge-${fdp.status === 'Active' ? 'success' : fdp.status === 'Completed' ? 'info' : 'warning'}`}>{fdp.status}</span>
                  {fdp.category && <span className="badge-primary">{fdp.category}</span>}
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{fdp.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">{fdp.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                  <span className="flex items-center gap-1"><HiOutlineClock />{fdp.duration}</span>
                  <span className="flex items-center gap-1"><HiOutlineUsers />{fdp.enrolledCount || 0}/{fdp.maxSeats || '∞'}</span>
                  <span className="badge-ghost">{fdp.difficultyLevel}</span>
                </div>
                <div className="flex gap-2">
                  <Link to={`/fdp/${fdp.id}`} className="btn-secondary flex-1 text-center text-sm !py-2">Details</Link>
                  <button onClick={() => handleEnroll(fdp.id)} disabled={enrolling === fdp.id} className="btn-primary flex-1 text-sm !py-2">
                    {enrolling === fdp.id ? 'Enrolling...' : 'Enroll'}
                  </button>
                  <ShareFDPButton fdp={fdp} size="sm" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
