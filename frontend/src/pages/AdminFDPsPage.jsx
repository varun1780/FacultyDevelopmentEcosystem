import { useState, useEffect } from 'react';
import { fdpAPI } from '../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AdminFDPsPage() {
  const [fdps, setFdps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState(null); // Track which FDP is generating

  useEffect(() => { load(); }, []);
  const load = () => fdpAPI.getAll().then(r => setFdps(r.data)).catch(console.error).finally(() => setLoading(false));

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this FDP?')) return;
    const loadToast = toast.loading('Deleting FDP Program...');
    try {
      await fdpAPI.delete(id);
      toast.success('FDP Program deleted successfully', { id: loadToast });
      load();
    } catch (err) {
      console.error('Failed to delete FDP:', err);
      const errorMsg = err.response?.data?.message
        || err.response?.data?.error
        || err.message
        || 'Failed to delete FDP Program';
      toast.error(errorMsg, { id: loadToast });
    }
  };

  const handleGenerateContent = async (id) => {
    setGeneratingId(id);
    const loadToast = toast.loading('Generating AI content — modules, quizzes & assignments...');
    try {
      const res = await fdpAPI.generateContent(id);
      const data = res.data;

      if (data.error) {
        // AI service returned a specific error (e.g., no API key)
        toast.error(data.error, { id: loadToast });
        console.error('AI generation error:', data.error);
      } else {
        const modulesCount = data.modules ? data.modules.length : 0;
        const quizzesCount = data.quizzes ? data.quizzes.length : 0;
        const assignmentsCount = data.assignments ? data.assignments.length : 0;
        toast.success(
          `AI content generated! ${modulesCount} modules, ${quizzesCount} quiz questions, ${assignmentsCount} assignments saved.`,
          { id: loadToast, duration: 5000 }
        );
        load(); // Refresh the list
      }
    } catch (err) {
      console.error('AI content generation failed:', err);

      // Try to extract error message from response
      const errorMsg = err.response?.data?.error
        || err.response?.data?.message
        || err.message
        || 'Generation failed';

      toast.error(errorMsg, { id: loadToast });
    } finally {
      setGeneratingId(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="page-title">Manage FDPs</h1><Link to="/admin/create-fdp" className="btn-primary">+ Create FDP</Link></div>
      {fdps.length === 0 ? <p className="text-gray-400 text-center py-16">No FDPs yet</p> : (
        <div className="card overflow-hidden"><table className="w-full text-sm"><thead className="bg-gray-50"><tr>{['Title', 'Category', 'Status', 'Enrolled', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{fdps.map(f => (
          <tr key={f.id} className="hover:bg-gray-50"><td className="px-4 py-3 font-medium">{f.title}</td><td className="px-4 py-3 text-gray-500">{f.category}</td><td className="px-4 py-3"><span className={`badge-${f.status === 'Active' ? 'success' : f.status === 'Completed' ? 'info' : 'warning'}`}>{f.status}</span></td><td className="px-4 py-3 text-gray-500">{f.enrolledCount || 0}/{f.maxSeats || '∞'}</td>
          <td className="px-4 py-3 flex gap-3 items-center">
            <Link to={`/fdp/${f.id}`} className="text-primary-600 hover:text-primary-700 text-xs font-semibold">View</Link>
            <Link to={`/admin/edit-fdp/${f.id}`} className="text-amber-600 hover:text-amber-700 text-xs font-semibold">Edit</Link>
            <button
              onClick={() => handleGenerateContent(f.id)}
              disabled={generatingId !== null}
              className={`text-xs font-medium ${
                generatingId === f.id
                  ? 'text-gray-400 cursor-wait'
                  : generatingId !== null
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-emerald-600 hover:text-emerald-700'
              }`}
            >
              {generatingId === f.id ? (
                <span className="flex items-center gap-1">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                  Generating...
                </span>
              ) : 'AI Content'}
            </button>
            <button onClick={() => handleDelete(f.id)} className="text-red-600 hover:text-red-700 text-xs">Delete</button>
          </td></tr>
        ))}</tbody></table></div>
      )}
    </div>
  );
}
