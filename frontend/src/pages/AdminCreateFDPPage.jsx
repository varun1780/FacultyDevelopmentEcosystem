import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fdpAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineSparkles, HiOutlineDocumentAdd, HiOutlineAcademicCap } from 'react-icons/hi';

const CATEGORIES = ['Artificial Intelligence', 'Blockchain', 'Pedagogy', 'Research', 'Data Science', 'Cybersecurity'];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

export default function AdminCreateFDPPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('ai');
  const [loading, setLoading] = useState(false);

  const [aiForm, setAiForm] = useState({
    topic: '',
    instructorName: user?.name || '',
    category: 'Artificial Intelligence',
    difficulty: 'Intermediate',
    duration: '4 Weeks',
    maxSeats: 50
  });

  const [blankForm, setBlankForm] = useState({
    title: '',
    category: 'Artificial Intelligence'
  });

  const handleAiChange = (e) => setAiForm({ ...aiForm, [e.target.name]: e.target.value });
  const handleBlankChange = (e) => setBlankForm({ ...blankForm, [e.target.name]: e.target.value });

  const handleAiSubmit = async (e) => {
    e.preventDefault();
    if (!aiForm.topic.trim()) return toast.error('Topic is required');
    setLoading(true);
    const tid = toast.loading('AI is drafting your FDP curriculum...');
    try {
      const payload = { ...aiForm, title: aiForm.topic, mode: 'ai', status: 'Draft' };
      const res = await fdpAPI.create(payload);
      toast.success('AI Draft Generated!', { id: tid });
      navigate(`/admin/edit-fdp/${res.data.id}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to generate AI draft', { id: tid });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlankSubmit = async (e) => {
    e.preventDefault();
    if (!blankForm.title.trim()) return toast.error('Title is required');
    setLoading(true);
    const tid = toast.loading('Creating blank draft...');
    try {
      const payload = { ...blankForm, mode: 'manual', status: 'Draft' };
      const res = await fdpAPI.create(payload);
      toast.success('Draft Created!', { id: tid });
      navigate(`/admin/edit-fdp/${res.data.id}`);
    } catch (error) {
      toast.error('Failed to create FDP', { id: tid });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-2">
          <HiOutlineAcademicCap className="text-primary-600" />
          Create New FDP Program
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Start by generating a complete course draft with AI, or begin with a blank canvas. 
          You will be able to fully customize the modules, quizzes, and certificates in the next step.
        </p>
      </div>

      <div className="flex bg-gray-100 p-1.5 rounded-2xl max-w-md mx-auto shadow-inner">
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'ai' ? 'bg-white text-primary-600 shadow-md scale-100' : 'text-gray-500 hover:text-gray-700 scale-95 hover:scale-100'
          }`}
        >
          <HiOutlineSparkles className="text-lg" /> AI Draft
        </button>
        <button
          onClick={() => setActiveTab('blank')}
          className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'blank' ? 'bg-white text-primary-600 shadow-md scale-100' : 'text-gray-500 hover:text-gray-700 scale-95 hover:scale-100'
          }`}
        >
          <HiOutlineDocumentAdd className="text-lg" /> Blank FDP
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'ai' ? (
          <motion.div key="ai" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="card p-8 shadow-xl border-t-4 border-t-primary-500">
            <div className="mb-6 flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-2xl">
                <HiOutlineSparkles />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">AI Curriculum Generator</h2>
                <p className="text-sm text-gray-500">The AI will build modules, write notes, and construct a quiz.</p>
              </div>
            </div>
            
            <form onSubmit={handleAiSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Topic / Title *</label>
                <input type="text" name="topic" value={aiForm.topic} onChange={handleAiChange} className="input-field py-3 text-lg" placeholder="e.g. Advanced Pedagogy in Cloud Computing" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Primary Instructor</label>
                <input type="text" name="instructorName" value={aiForm.instructorName} onChange={handleAiChange} className="input-field" placeholder="Dr. Smith" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                <select name="category" value={aiForm.category} onChange={handleAiChange} className="input-field">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty Level</label>
                <select name="difficulty" value={aiForm.difficulty} onChange={handleAiChange} className="input-field">
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Expected Duration</label>
                <input type="text" name="duration" value={aiForm.duration} onChange={handleAiChange} className="input-field" placeholder="e.g. 5 days, 4 weeks" />
              </div>
              <div className="md:col-span-2 pt-4">
                <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-lg font-bold flex items-center justify-center gap-2 shadow-primary-500/30 shadow-lg hover:shadow-primary-500/50">
                  {loading ? <span className="animate-pulse">Generating...</span> : <><HiOutlineSparkles /> Generate Draft & Continue to Editor</>}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div key="blank" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="card p-8 shadow-xl border-t-4 border-t-gray-600">
            <div className="mb-6 flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-2xl">
                <HiOutlineDocumentAdd />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Start from Scratch</h2>
                <p className="text-sm text-gray-500">Create an empty FDP outline and build it manually.</p>
              </div>
            </div>

            <form onSubmit={handleBlankSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">FDP Title *</label>
                <input type="text" name="title" value={blankForm.title} onChange={handleBlankChange} className="input-field py-3 text-lg" placeholder="Enter the exact title" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                <select name="category" value={blankForm.category} onChange={handleBlankChange} className="input-field">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="pt-4">
                <button type="submit" disabled={loading} className="btn-primary bg-gray-800 hover:bg-gray-900 border-gray-800 w-full py-4 text-lg font-bold shadow-lg">
                  {loading ? 'Creating...' : 'Create Draft & Continue to Editor'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
