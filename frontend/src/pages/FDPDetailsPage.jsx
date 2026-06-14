import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fdpAPI, enrollmentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HiOutlineClock, HiOutlineUsers, HiOutlineAcademicCap } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { ShareFDPButton } from '../components/ShareFDPModal';

export default function FDPDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [fdp, setFdp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fdpAPI.getById(id).then(r => setFdp(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleEnroll = async () => {
    try {
      await enrollmentAPI.enroll(id, user.id);
      toast.success('Enrolled!');
      fdpAPI.getById(id).then(r => setFdp(r.data));
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  if (!fdp) return <div className="text-center py-16 text-gray-400">FDP not found</div>;

  const outcomes = fdp.learningOutcomes?.split(',').filter(Boolean) || [];
  let modules = [];
  try { modules = JSON.parse(fdp.modules || '[]'); } catch { modules = []; }

  return (
    <div className="space-y-6 max-w-4xl">
      <Link to="/courses" className="text-sm text-primary-600 hover:text-primary-700">← Back to FDPs</Link>
      <div className="card overflow-hidden">
        <div className="gradient-bg p-8 text-white">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/20 mb-3`}>{fdp.status}</span>
          <h1 className="text-3xl font-bold mb-2">{fdp.title}</h1>
          <p className="text-white/80">{fdp.description}</p>
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-white/70">
            <span className="flex items-center gap-1"><HiOutlineClock /> {fdp.duration}</span>
            <span className="flex items-center gap-1"><HiOutlineUsers /> {fdp.enrolledCount || 0}/{fdp.maxSeats || '∞'}</span>
            <span className="flex items-center gap-1"><HiOutlineAcademicCap /> {fdp.difficultyLevel}</span>
            <span>📅 {fdp.startDate} → {fdp.endDate}</span>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex flex-wrap gap-3">
            <button onClick={handleEnroll} className="btn-primary">Enroll Now</button>
            <Link to={`/fdp/${id}/learn`} className="btn-secondary">Start Learning</Link>
            <ShareFDPButton fdp={fdp} size="md" />
          </div>
          {outcomes.length > 0 && (
            <div><h3 className="section-title">Learning Outcomes</h3><ul className="space-y-2">{outcomes.map((o, i) => <li key={i} className="flex items-center gap-2 text-sm text-gray-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />{o.trim()}</li>)}</ul></div>
          )}
          {modules.length > 0 && (
            <div><h3 className="section-title">Modules</h3><div className="space-y-3">{modules.map((m, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white text-sm font-bold">{i + 1}</div><div><p className="font-medium text-sm">{m.title}</p><p className="text-xs text-gray-500">{m.duration || m.content?.substring(0, 80) + '...'}</p></div></div></div>
            ))}</div></div>
          )}
          {fdp.instructorName && <div><h3 className="section-title">Instructor</h3><p className="text-gray-600">{fdp.instructorName}</p></div>}
        </div>
      </div>
    </div>
  );
}
