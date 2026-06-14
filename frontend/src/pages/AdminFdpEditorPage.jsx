import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fdpAPI, certificateAPI } from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { 
  HiOutlineViewGrid, 
  HiOutlineCollection, 
  HiOutlineQuestionMarkCircle, 
  HiOutlineClipboardList, 
  HiOutlineBadgeCheck,
  HiOutlineSave,
  HiOutlineCloudUpload,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineEye
} from 'react-icons/hi';


const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
const STATUSES = ['Draft', 'Upcoming', 'Active', 'Completed'];

function getYouTubeEmbedUrl(url) {
  if (!url) return '';
  if (url.includes("youtu.be/")) {
    return `https://www.youtube.com/embed/${url.split("youtu.be/")[1].split("?")[0]}`;
  }
  if (url.includes("watch?v=")) {
    return `https://www.youtube.com/embed/${url.split("watch?v=")[1].split("&")[0]}`;
  }
  return url;
}

export default function AdminFdpEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const saveTimeoutRef = useRef(null);

  const [fdp, setFdp] = useState(null);
  const [certTemplate, setCertTemplate] = useState(null);
  const [logoObjectUrl, setLogoObjectUrl] = useState(null);
  const [categories, setCategories] = useState([]);

  // Modals for editing nested arrays
  const [editingModule, setEditingModule] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null);

  // ── Fetch Initial Data ──
  useEffect(() => {
    const loadData = async () => {
      try {
        const [res, catRes] = await Promise.all([
          fdpAPI.getById(id),
          fdpAPI.getCategories()
        ]);
        const data = res.data;
        setCategories(catRes.data);
        // Parse JSON fields
        const parsedModules = data.modules ? JSON.parse(data.modules) : [];
        const parsedQuizObj = data.quiz ? JSON.parse(data.quiz) : {};
        const parsedQuizzesRaw = parsedQuizObj.questions || [];
        const parsedQuizzes = parsedQuizzesRaw.map((q, qIdx) => {
          let options = [];
          let correctAnswer = 0; // index

          // 1. Backward compatibility: if it has optionA/B/C/D format
          if (!q.options && q.optionA) {
            options = [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean);
            if (q.correctAnswer === q.optionA) correctAnswer = 0;
            else if (q.correctAnswer === q.optionB) correctAnswer = 1;
            else if (q.correctAnswer === q.optionC) correctAnswer = 2;
            else if (q.correctAnswer === q.optionD) correctAnswer = 3;
          } 
          // 2. Backward compatibility: if options is an array of { id, text } objects
          else if (q.options && q.options.length > 0 && typeof q.options[0] === 'object') {
            options = q.options.map(o => o.text || o.option || '');
            const correctOptId = q.correctOptionId || q.correctAnswer;
            const foundIdx = q.options.findIndex(o => o.id === correctOptId || o.text === correctOptId);
            correctAnswer = foundIdx !== -1 ? foundIdx : 0;
          }
          // 3. Standard format: options is already an array of strings, and correctAnswer is index
          else {
            options = q.options || [];
            if (typeof q.correctAnswer === 'string') {
              // try to see if it matches option text
              const foundIdx = options.findIndex(o => o === q.correctAnswer);
              correctAnswer = foundIdx !== -1 ? foundIdx : parseInt(q.correctAnswer) || 0;
            } else {
              correctAnswer = q.correctAnswer !== undefined ? q.correctAnswer : 0;
            }
          }

          return {
            id: q.id || q.questionId || (qIdx + 1),
            question: q.question,
            options,
            correctAnswer,
            explanation: q.explanation || '',
            marks: q.marks || 10
          };
        });
        const parsedAssignments = data.assignment ? JSON.parse(data.assignment) : [];
        
        setFdp({
          ...data,
          modules: parsedModules,
          quizzes: parsedQuizzes,
          assignments: parsedAssignments
        });

        if (data.enableCertificate) {
          const certRes = await certificateAPI.getTemplateByFdpId(id);
          setCertTemplate(certRes.data || {});
        }
      } catch (error) {
        toast.error('Failed to load FDP details');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  // ── Auto Save Logic ──
  const triggerAutoSave = useCallback((updatedFdp) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        const payload = {
          ...updatedFdp,
          modules: JSON.stringify(updatedFdp.modules),
          quiz: JSON.stringify({ topic: updatedFdp.title, passingScore: updatedFdp.passingScore, questions: updatedFdp.quizzes }),
          assignment: JSON.stringify(updatedFdp.assignments)
        };
        await fdpAPI.update(id, payload);
        setLastSaved(new Date());
      } catch (error) {
        toast.error('Auto-save failed');
      } finally {
        setSaving(false);
      }
    }, 2000); // Save 2 seconds after last edit
  }, [id]);

  // Handle local state updates + trigger auto save
  const updateFdp = (updater) => {
    setFdp((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      triggerAutoSave(next);
      return next;
    });
  };

  const handleBasicChange = (e) => {
    const { name, value } = e.target;
    updateFdp({ [name]: value });
  };

  const getSignatureForRole = (role) => {
    if (!certTemplate || !certTemplate.signatures) return '';
    try {
      const parsed = JSON.parse(certTemplate.signatures);
      return parsed[role.toLowerCase()] || '';
    } catch (e) {
      return '';
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create local object URL for instant preview update
      const objectUrl = URL.createObjectURL(file);
      if (logoObjectUrl) {
        URL.revokeObjectURL(logoObjectUrl);
      }
      setLogoObjectUrl(objectUrl);

      // Convert to base64 Data URL and save to database
      const reader = new FileReader();
      reader.onloadend = () => {
        const updated = { ...certTemplate, logo: reader.result };
        setCertTemplate(updated);
        certificateAPI.saveTemplate(id, updated);
        setLastSaved(new Date());
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    if (logoObjectUrl) {
      URL.revokeObjectURL(logoObjectUrl);
      setLogoObjectUrl(null);
    }
    const updated = { ...certTemplate, logo: '' };
    setCertTemplate(updated);
    certificateAPI.saveTemplate(id, updated);
    setLastSaved(new Date());
  };

  const handlePublish = async () => {
    setSaving(true);
    const tid = toast.loading('Publishing FDP...');
    try {
      const payload = {
        ...fdp,
        status: 'Active',
        modules: JSON.stringify(fdp.modules),
        quiz: JSON.stringify({ topic: fdp.title, passingScore: fdp.passingScore, questions: fdp.quizzes }),
        assignment: JSON.stringify(fdp.assignments)
      };
      await fdpAPI.update(id, payload);
      toast.success('FDP Published Successfully!', { id: tid });
      navigate('/admin/fdps');
    } catch (err) {
      toast.error('Failed to publish', { id: tid });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAIQuiz = async () => {
    setIsGeneratingQuiz(true);
    const tid = toast.loading('Generating intelligent assessment...');
    try {
      const res = await fdpAPI.generateQuiz(id, 10);
      if (res.data && res.data.questions) {
        updateFdp({ quizzes: res.data.questions });
        toast.success('AI Quiz generated successfully!', { id: tid });
      } else {
        toast.error('Failed to generate quiz format', { id: tid });
      }
    } catch (err) {
      toast.error('Failed to generate AI Quiz', { id: tid });
    } finally {
      setIsGeneratingQuiz(false);
    }
  };


  if (loading) return <div className="flex h-96 items-center justify-center"><div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!fdp) return <div className="text-center text-red-500 mt-20">FDP Not Found</div>;

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm mb-6 border border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 line-clamp-1">{fdp.title || 'Untitled FDP'}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className={`px-2.5 py-0.5 rounded-full font-bold ${fdp.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {fdp.status}
            </span>
            <span className="flex items-center gap-1">
              {saving ? <HiOutlineCloudUpload className="animate-pulse text-primary-500" /> : <HiOutlineSave />}
              {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'All changes saved'}
            </span>
          </div>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button onClick={() => navigate('/admin/fdps')} className="btn-secondary">Exit Editor</button>
          <button onClick={handlePublish} className="btn-primary">Publish FDP</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Nav */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 sticky top-24">
            <nav className="space-y-1">
              {[
                { id: 'basic', icon: HiOutlineViewGrid, label: 'Basic Info' },
                { id: 'modules', icon: HiOutlineCollection, label: 'Modules & Content', count: fdp.modules.length },
                { id: 'quiz', icon: HiOutlineQuestionMarkCircle, label: 'Assessment Quiz', count: fdp.quizzes.length },
                { id: 'assignments', icon: HiOutlineClipboardList, label: 'Assignments', count: fdp.assignments.length },
                { id: 'certificate', icon: HiOutlineBadgeCheck, label: 'Certificate Settings' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === tab.id ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <tab.icon className="text-xl" />
                    {tab.label}
                  </div>
                  {tab.count !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-primary-200 text-primary-800' : 'bg-gray-200'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Editor Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <AnimatePresence mode="wait">
              
              {/* BASIC INFO TAB */}
              {activeTab === 'basic' && (
                <motion.div key="basic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 border-b pb-4">Basic Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">FDP Title</label>
                      <input type="text" name="title" value={fdp.title} onChange={handleBasicChange} className="input-field" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                      <textarea name="description" value={fdp.description} onChange={handleBasicChange} className="input-field" rows={4} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                      <input list="category-list" name="category" value={fdp.category} onChange={handleBasicChange} className="input-field" placeholder="Select or type a category" />
                      <datalist id="category-list">
                        {categories.map(c => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty Level</label>
                      <select name="difficultyLevel" value={fdp.difficultyLevel} onChange={handleBasicChange} className="input-field">
                        {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Instructor Name</label>
                      <input type="text" name="instructorName" value={fdp.instructorName} onChange={handleBasicChange} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Max Seats</label>
                      <input type="number" name="maxSeats" value={fdp.maxSeats} onChange={handleBasicChange} className="input-field" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Thumbnail URL</label>
                      <input type="text" name="thumbnailUrl" value={fdp.thumbnailUrl} onChange={handleBasicChange} className="input-field" placeholder="https://..." />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* MODULES TAB */}
              {activeTab === 'modules' && (
                <motion.div key="modules" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="flex justify-between items-center border-b pb-4">
                    <h2 className="text-xl font-bold text-gray-900">Curriculum Modules</h2>
                    <button onClick={() => setEditingModule({ title: '', content: '' })} className="btn-primary !py-2 px-4 flex items-center gap-2">
                      <HiOutlinePlus /> Add Module
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {fdp.modules.map((mod, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-xl p-4 hover:border-primary-300 transition-colors bg-gray-50 flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-gray-900">Module {idx + 1}: {mod.title}</h3>
                          <p className="text-sm text-gray-500 line-clamp-1">{mod.description || mod.content}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingModule({ ...mod, _index: idx })} className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg">
                            <HiOutlinePencil />
                          </button>
                          <button onClick={() => updateFdp(p => ({ ...p, modules: p.modules.filter((_, i) => i !== idx) }))} className="p-2 text-red-600 hover:bg-red-100 rounded-lg">
                            <HiOutlineTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                    {fdp.modules.length === 0 && <p className="text-gray-500 text-center py-8">No modules added yet.</p>}
                  </div>
                </motion.div>
              )}

              {/* QUIZ TAB */}
              {activeTab === 'quiz' && (
                <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="flex justify-between items-center border-b pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Assessment Quiz</h2>
                      <div className="flex items-center gap-4 mt-2">
                        <label className="text-sm font-semibold text-gray-700">Passing Score (%):</label>
                        <input type="number" name="passingScore" value={fdp.passingScore} onChange={handleBasicChange} className="input-field !w-24 !py-1" />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={handleGenerateAIQuiz} 
                        disabled={isGeneratingQuiz}
                        className="btn-secondary !py-2 px-4 flex items-center gap-2 disabled:opacity-50"
                      >
                        <span className="text-xl">✨</span>
                        {isGeneratingQuiz ? 'Generating...' : 'Regenerate AI Quiz'}
                      </button>
                      <button onClick={() => setEditingQuiz({ 
                        question: '', 
                        options: ['', '', '', ''],
                        correctAnswer: 0, 
                        marks: 10 
                      })} className="btn-primary !py-2 px-4 flex items-center gap-2">
                        <HiOutlinePlus /> Add Question
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {fdp.quizzes.map((q, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-xl p-5 hover:border-primary-300 transition-colors bg-white shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-gray-900 flex gap-2">
                            <span className="text-primary-600">Q{idx + 1}.</span> {q.question}
                          </h3>
                          <div className="flex gap-2 ml-4">
                            <button onClick={() => setEditingQuiz({ ...q, _index: idx })} className="p-1.5 text-primary-600 hover:bg-primary-100 rounded-lg"><HiOutlinePencil /></button>
                            <button onClick={() => updateFdp(p => ({ ...p, quizzes: p.quizzes.filter((_, i) => i !== idx) }))} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg"><HiOutlineTrash /></button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          {(q.options || []).map((optText, i) => {
                            const isCorrect = q.correctAnswer === i;
                            const label = String.fromCharCode(65 + i);
                            return (
                              <div key={i} className={`p-2 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200 font-semibold' : 'bg-gray-50 border-gray-100'}`}>
                                {label}. {optText}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {fdp.quizzes.length === 0 && <p className="text-gray-500 text-center py-8">No quiz questions added.</p>}
                  </div>
                </motion.div>
              )}
              
              {/* ASSIGNMENTS TAB */}
              {activeTab === 'assignments' && (
                <motion.div key="assignments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="flex justify-between items-center border-b pb-4">
                    <h2 className="text-xl font-bold text-gray-900">Assignments & Projects</h2>
                    <button onClick={() => setEditingAssignment({ title: '', description: '', deadline: 'End of Week 1', maxMarks: 100 })} className="btn-primary !py-2 px-4 flex items-center gap-2">
                      <HiOutlinePlus /> Add Assignment
                    </button>
                  </div>
                  <div className="space-y-4">
                    {fdp.assignments.map((ast, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-xl p-5 hover:border-primary-300 transition-colors bg-white shadow-sm flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-900">{ast.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">{ast.description}</p>
                          <div className="flex gap-4 mt-3 text-xs font-semibold text-gray-600">
                            <span className="bg-gray-100 px-2 py-1 rounded-md">Deadline: {ast.deadline}</span>
                            <span className="bg-primary-50 text-primary-700 px-2 py-1 rounded-md">Max Marks: {ast.maxMarks}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingAssignment({ ...ast, _index: idx })} className="p-1.5 text-primary-600 hover:bg-primary-100 rounded-lg"><HiOutlinePencil /></button>
                          <button onClick={() => updateFdp(p => ({ ...p, assignments: p.assignments.filter((_, i) => i !== idx) }))} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg"><HiOutlineTrash /></button>
                        </div>
                      </div>
                    ))}
                    {fdp.assignments.length === 0 && <p className="text-gray-500 text-center py-8">No assignments added.</p>}
                  </div>
                </motion.div>
              )}

              {/* CERTIFICATE TAB */}
              {activeTab === 'certificate' && (
                <motion.div key="certificate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 border-b pb-4">Certificate Settings</h2>
                  
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                    <HiOutlineBadgeCheck className="text-blue-600 text-2xl flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-blue-900 text-sm">Issue Certificates</h3>
                      <p className="text-sm text-blue-700 mt-1">Enable this to automatically issue a digital certificate to faculty who complete this program.</p>
                      <label className="mt-3 flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={fdp.enableCertificate} onChange={(e) => updateFdp({ enableCertificate: e.target.checked })} className="w-4 h-4 text-primary-600 rounded" />
                        <span className="text-sm font-bold text-gray-800">Enable Certificates for this FDP</span>
                      </label>
                    </div>
                  </div>

                  {fdp.enableCertificate && certTemplate && (
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mt-6">
                      {/* Left: Editor Inputs (5 cols) */}
                      <div className="xl:col-span-5 space-y-6">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Template Style</label>
                          <select 
                            name="certificateTemplate" 
                            value={fdp.certificateTemplate || 'Classic Template'} 
                            onChange={handleBasicChange} 
                            className="input-field"
                          >
                            {['Classic Template', 'Modern Template', 'University Style'].map(t => <option key={t}>{t}</option>)}
                          </select>
                        </div>

                        {/* Institute Branding Section */}
                        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-4">
                          <h3 className="font-bold text-gray-800 text-sm border-b pb-2">Institute Branding</h3>
                          
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-2">Institute Logo</label>
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/svg+xml"
                                onChange={handleLogoUpload}
                                className="text-xs w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                              />
                            </div>
                            
                            {(logoObjectUrl || certTemplate.logo) && (
                              <div className="flex items-center gap-4">
                                <div className="border border-gray-200 bg-white p-2 rounded-lg max-w-[120px] max-h-[100px] flex items-center justify-center">
                                  <img
                                    src={logoObjectUrl || certTemplate.logo}
                                    alt="Logo Preview"
                                    className="max-h-[80px] max-w-full object-contain"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={handleRemoveLogo}
                                  className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-lg text-xs font-semibold"
                                >
                                  Remove Logo
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Institute Details Section */}
                        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-4">
                          <h3 className="font-bold text-gray-800 text-sm border-b pb-2">Institute Details</h3>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Institution Name</label>
                              <input 
                                type="text" 
                                value={certTemplate.institutionName || ''} 
                                onChange={e => {
                                  const updated = { ...certTemplate, institutionName: e.target.value };
                                  setCertTemplate(updated);
                                  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                                  saveTimeoutRef.current = setTimeout(() => {
                                    certificateAPI.saveTemplate(id, updated);
                                    setLastSaved(new Date());
                                  }, 2000);
                                }} 
                                className="input-field" 
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Subtitle / Department</label>
                              <input 
                                type="text" 
                                value={certTemplate.institutionSubtitle || ''} 
                                onChange={e => {
                                  const updated = { ...certTemplate, institutionSubtitle: e.target.value };
                                  setCertTemplate(updated);
                                  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                                  saveTimeoutRef.current = setTimeout(() => {
                                    certificateAPI.saveTemplate(id, updated);
                                    setLastSaved(new Date());
                                  }, 2000);
                                }} 
                                className="input-field" 
                              />
                            </div>
                          </div>
                        </div>

                        {/* Signatures Section */}
                        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-4">
                          <h3 className="font-bold text-gray-800 text-sm border-b pb-2">Signatures</h3>
                          <div className="space-y-4">
                            {['Principal', 'HOD', 'Coordinator'].map(role => {
                              const currentSig = getSignatureForRole(role);
                              return (
                                <div key={role} className="border border-gray-200 rounded-xl p-3 bg-white space-y-2">
                                  <label className="block text-xs font-bold text-gray-700">{role} Signature</label>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          const sigsObj = certTemplate.signatures ? JSON.parse(certTemplate.signatures) : {};
                                          sigsObj[role.toLowerCase()] = reader.result;
                                          const updated = { ...certTemplate, signatures: JSON.stringify(sigsObj) };
                                          setCertTemplate(updated);
                                          certificateAPI.saveTemplate(id, updated);
                                          setLastSaved(new Date());
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }} 
                                    className="text-xs w-full text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" 
                                  />
                                  {currentSig && (
                                    <div className="flex items-center gap-3">
                                      <div className="border border-gray-200 bg-white p-1 rounded max-w-[120px] h-10 flex items-center justify-center">
                                        <img src={currentSig} alt={`${role} Signature Preview`} className="h-full object-contain" />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const sigsObj = certTemplate.signatures ? JSON.parse(certTemplate.signatures) : {};
                                          delete sigsObj[role.toLowerCase()];
                                          const updated = { ...certTemplate, signatures: JSON.stringify(sigsObj) };
                                          setCertTemplate(updated);
                                          certificateAPI.saveTemplate(id, updated);
                                          setLastSaved(new Date());
                                        }}
                                        className="px-2 py-1 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded text-xs font-semibold"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Right: Live Canvas Preview (7 cols) */}
                      <div className="xl:col-span-7 space-y-4">
                        <h3 className="section-title flex items-center gap-1.5 font-bold text-gray-800 text-sm">
                          <HiOutlineEye className="text-primary-500" /> Live Certificate Preview
                        </h3>

                        <div className="border border-gray-200 rounded-2xl bg-gray-100 p-4 flex items-center justify-center overflow-x-auto shadow-inner min-h-[460px]">
                          <div 
                            id="certificate-preview-canvas"
                            className="w-[720px] h-[510px] p-8 flex flex-col justify-between relative shadow-2xl transition-all duration-300 font-serif"
                            style={{
                              background: 'linear-gradient(180deg, #fffdf8 0%, #fff9ee 100%)',
                              border: `8px double #7c3aed`,
                              color: '#1a1a2e',
                            }}
                          >
                            {/* Corner Accents */}
                            <div className="absolute top-2 left-2 w-12 h-12 border-t-2 border-l-2 opacity-30 border-purple-600"></div>
                            <div className="absolute top-2 right-2 w-12 h-12 border-t-2 border-r-2 opacity-30 border-purple-600"></div>
                            <div className="absolute bottom-2 left-2 w-12 h-12 border-b-2 border-l-2 opacity-30 border-purple-600"></div>
                            <div className="absolute bottom-2 right-2 w-12 h-12 border-b-2 border-r-2 opacity-30 border-purple-600"></div>

                            {/* College Logo & Headers (Top-Left Logo + Next-to-Logo text) */}
                            <div className="flex items-start gap-4">
                              <img 
                                src={logoObjectUrl || certTemplate.logo || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%237c3aed"><path d="M12 2L1 7l11 5 9-4.09V14a1 1 0 0 0 2 0V7.91L23 7M4.73 14a9 9 0 0 0 14.54 0"/></svg>`} 
                                alt="Logo" 
                                className="w-20 h-20 object-contain max-h-[100px]" 
                              />
                              <div className="text-left pt-2">
                                <h2 className="text-xl font-bold tracking-wide uppercase select-none leading-tight">{certTemplate.institutionName || 'National Institute of Technology'}</h2>
                                <p className="text-sm opacity-75 font-medium">{certTemplate.institutionSubtitle || 'Department of Computer Science & Engineering'}</p>
                              </div>
                            </div>

                            {/* Certificate Title */}
                            <div className="text-center space-y-1 my-2">
                              <span className="text-[10px] font-bold tracking-widest uppercase select-none text-purple-600">CERTIFICATE OF PARTICIPATION</span>
                              <h1 className="text-2xl font-bold tracking-wide font-serif">Completion Award</h1>
                            </div>

                            {/* Certificate Body Text */}
                            <div className="text-center px-6 my-2 text-sm leading-relaxed">
                              This is to certify that <strong>Faculty Member</strong><br/>
                              has successfully completed the Faculty Development Program on<br/>
                              <strong>{fdp.title || 'Faculty Development Program'}</strong><br/>
                              and achieved an assessment score of <strong>85%</strong>.
                            </div>

                            {/* Date & Verification IDs */}
                            <div className="grid grid-cols-3 items-end gap-2 text-center text-[10px] mt-2">
                              <div className="text-left pl-4 space-y-1">
                                <p className="opacity-50 select-none text-[8px] uppercase tracking-wider">Date Issued</p>
                                <p className="font-semibold">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                <p className="opacity-50 select-none text-[8px] uppercase tracking-wider mt-1">Certificate ID</p>
                                <p className="font-mono font-bold text-purple-600">CERT-FDP-PREVIEW</p>
                              </div>
                              
                              {/* QR code verification preview */}
                              <div className="flex flex-col items-center justify-center">
                                <div className="p-1 bg-white border border-gray-200 rounded-lg shadow-sm">
                                  <QRCodeSVG value="http://localhost:5173/verify-certificate/CERT-FDP-PREVIEW" size={50} />
                                </div>
                                <span className="text-[8px] mt-1 opacity-50 select-none">Scan to Verify</span>
                              </div>

                              <div className="text-right pr-4 space-y-1">
                                <p className="opacity-50 select-none text-[8px] uppercase tracking-wider">Verification Ledger</p>
                                <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[8px] font-bold border border-emerald-100">Verified</span>
                              </div>
                            </div>

                            {/* Signatures */}
                            <div className="border-t border-gray-200/60 pt-4 grid grid-cols-3 gap-2 text-center mt-2">
                              {['Principal', 'HOD', 'Coordinator'].map(role => {
                                const currentSig = getSignatureForRole(role);
                                return (
                                  <div key={role} className="flex flex-col items-center justify-end">
                                    {currentSig ? (
                                      <img src={currentSig} alt={`${role} Signature`} className="h-8 object-contain" />
                                    ) : (
                                      <div className="h-6 w-16 border-b border-dashed border-gray-300 mb-1 flex items-center justify-center text-[8px] text-gray-300">{role}</div>
                                    )}
                                    <p className="text-[9px] font-semibold opacity-85">{role === 'HOD' ? 'Head of Dept.' : role === 'Coordinator' ? 'FDP Coordinator' : role}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
              
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Editor Modals */}
      <AnimatePresence>
        {editingModule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-xl font-bold mb-4">{editingModule._index !== undefined ? 'Edit Module' : 'Add Module'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Module Title</label>
                  <input type="text" value={editingModule.title} onChange={e => setEditingModule({...editingModule, title: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Learning Content (Markdown supported)</label>
                  <textarea value={editingModule.content} onChange={e => setEditingModule({...editingModule, content: e.target.value})} className="input-field font-mono text-sm" rows={8} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Video URL (Optional)</label>
                    <input type="text" value={editingModule.videoUrl || ''} onChange={e => setEditingModule({...editingModule, videoUrl: e.target.value})} className="input-field" placeholder="YouTube or MP4 URL" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">External Link (Optional)</label>
                    <input type="text" value={editingModule.externalLinks || ''} onChange={e => setEditingModule({...editingModule, externalLinks: e.target.value})} className="input-field" placeholder="https://..." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">PDF Notes</label>
                    {editingModule.pdfUrl ? (
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                        <HiOutlineCloudUpload className="text-emerald-500" />
                        <span className="text-xs text-emerald-700 font-medium truncate flex-1">PDF uploaded</span>
                        <button type="button" onClick={() => setEditingModule({...editingModule, pdfUrl: ''})} className="text-red-500 hover:text-red-700 text-xs font-bold">Remove</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all text-sm text-gray-500">
                          <HiOutlineCloudUpload className="text-lg" />
                          <span>Upload PDF</span>
                          <input type="file" accept=".pdf" className="hidden" onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            const formData = new FormData();
                            formData.append('file', file);
                            try {
                              const res = await fdpAPI.uploadPdf(formData);
                              if (res.data.success) {
                                setEditingModule(prev => ({...prev, pdfUrl: res.data.fileUrl}));
                                toast.success('PDF uploaded successfully!');
                              }
                            } catch {
                              toast.error('PDF upload failed');
                            }
                          }} />
                        </label>
                        <input type="text" value={editingModule.pdfUrl || ''} onChange={e => setEditingModule({...editingModule, pdfUrl: e.target.value})} className="input-field flex-1 !text-xs" placeholder="or paste URL" />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Lecture Slides (PPT)</label>
                    {editingModule.pptUrl ? (
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                        <HiOutlineCloudUpload className="text-emerald-500" />
                        <span className="text-xs text-emerald-700 font-medium truncate flex-1">Slides uploaded</span>
                        <button type="button" onClick={() => setEditingModule({...editingModule, pptUrl: ''})} className="text-red-500 hover:text-red-700 text-xs font-bold">Remove</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all text-sm text-gray-500">
                          <HiOutlineCloudUpload className="text-lg" />
                          <span>Upload PPT</span>
                          <input type="file" accept=".ppt,.pptx,.pdf" className="hidden" onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            const formData = new FormData();
                            formData.append('file', file);
                            try {
                              const res = await fdpAPI.uploadPdf(formData);
                              if (res.data.success) {
                                setEditingModule(prev => ({...prev, pptUrl: res.data.fileUrl}));
                                toast.success('Slides uploaded successfully!');
                              }
                            } catch {
                              toast.error('Slides upload failed');
                            }
                          }} />
                        </label>
                        <input type="text" value={editingModule.pptUrl || ''} onChange={e => setEditingModule({...editingModule, pptUrl: e.target.value})} className="input-field flex-1 !text-xs" placeholder="or paste URL" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setEditingModule(null)} className="btn-secondary">Cancel</button>
                <button onClick={() => {
                  let videoUrl = editingModule.videoUrl ? editingModule.videoUrl.trim() : '';
                  if (videoUrl) {
                    const isYoutube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
                    if (isYoutube) {
                      const isValidYoutube = videoUrl.includes("watch?v=") || videoUrl.includes("youtu.be/") || videoUrl.includes("youtube.com/embed/");
                      if (!isValidYoutube) {
                        toast.error("Invalid YouTube link. Please provide a valid watch or shared link.");
                        return;
                      }
                      videoUrl = getYouTubeEmbedUrl(videoUrl);
                    }
                  }

                  const moduleToSave = { ...editingModule, videoUrl };

                  updateFdp(p => {
                    const mods = [...p.modules];
                    if (moduleToSave._index !== undefined) mods[moduleToSave._index] = moduleToSave;
                    else mods.push(moduleToSave);
                    return { ...p, modules: mods };
                  });
                  setEditingModule(null);
                }} className="btn-primary">Save Module</button>
              </div>
            </motion.div>
          </div>
        )}

        {editingQuiz && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
              <h2 className="text-xl font-bold mb-4">{editingQuiz._index !== undefined ? 'Edit Question' : 'Add Question'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Question Text</label>
                  <textarea value={editingQuiz.question} onChange={e => setEditingQuiz({...editingQuiz, question: e.target.value})} className="input-field" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {(editingQuiz.options || ['', '', '', '']).map((optText, i) => (
                    <div key={i}>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Option {String.fromCharCode(65 + i)}</label>
                      <input type="text" value={optText} onChange={e => {
                        const newOpts = [...editingQuiz.options];
                        newOpts[i] = e.target.value;
                        setEditingQuiz({...editingQuiz, options: newOpts});
                      }} className="input-field" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Correct Answer</label>
                    <select value={editingQuiz.correctAnswer !== undefined ? editingQuiz.correctAnswer : ''} onChange={e => setEditingQuiz({...editingQuiz, correctAnswer: parseInt(e.target.value)})} className="input-field">
                      <option value="">Select correct option...</option>
                      {(editingQuiz.options || []).map((optText, i) => (
                        <option key={i} value={i}>Option {String.fromCharCode(65 + i)}: {optText.substring(0, 30)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Marks</label>
                    <input type="number" value={editingQuiz.marks || 10} onChange={e => setEditingQuiz({...editingQuiz, marks: parseInt(e.target.value)})} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Explanation (Optional)</label>
                  <textarea value={editingQuiz.explanation || ''} onChange={e => setEditingQuiz({...editingQuiz, explanation: e.target.value})} className="input-field" rows={2} placeholder="Explain why this answer is correct..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setEditingQuiz(null)} className="btn-secondary">Cancel</button>
                <button onClick={() => {
                  updateFdp(p => {
                    const qz = [...p.quizzes];
                    if (editingQuiz._index !== undefined) qz[editingQuiz._index] = editingQuiz;
                    else qz.push(editingQuiz);
                    return { ...p, quizzes: qz };
                  });
                  setEditingQuiz(null);
                }} className="btn-primary">Save Question</button>
              </div>
            </motion.div>
          </div>
        )}

        {editingAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6">
              <h2 className="text-xl font-bold mb-4">{editingAssignment._index !== undefined ? 'Edit Assignment' : 'Add Assignment'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                  <input type="text" value={editingAssignment.title} onChange={e => setEditingAssignment({...editingAssignment, title: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Instructions / Description</label>
                  <textarea value={editingAssignment.description} onChange={e => setEditingAssignment({...editingAssignment, description: e.target.value})} className="input-field" rows={4} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Deadline</label>
                    <input type="text" value={editingAssignment.deadline} onChange={e => setEditingAssignment({...editingAssignment, deadline: e.target.value})} className="input-field" placeholder="e.g. End of Week 2" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Max Marks</label>
                    <input type="number" value={editingAssignment.maxMarks} onChange={e => setEditingAssignment({...editingAssignment, maxMarks: parseInt(e.target.value)})} className="input-field" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setEditingAssignment(null)} className="btn-secondary">Cancel</button>
                <button onClick={() => {
                  updateFdp(p => {
                    const asts = [...p.assignments];
                    if (editingAssignment._index !== undefined) asts[editingAssignment._index] = editingAssignment;
                    else asts.push(editingAssignment);
                    return { ...p, assignments: asts };
                  });
                  setEditingAssignment(null);
                }} className="btn-primary">Save Assignment</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
