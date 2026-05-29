import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fdpAPI, enrollmentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineBookOpen,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineDownload,
  HiOutlineExternalLink,
  HiOutlineClipboardCheck,
  HiOutlineSparkles,
  HiOutlineChatAlt2
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

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

const getKeywordResponse = (messageText, module) => {
  const text = messageText.toLowerCase();
  
  if (text.includes("hi") || text.includes("hello") || text.includes("hey")) {
    return "Hello! I'm your AI Tutor. How can I help you understand this module? Feel free to ask about the summary, quiz preparation, or core concepts like AI and blockchain.";
  }
  
  if (text.includes("summary") || text.includes("summarize")) {
    if (module && (module.description || module.content)) {
      return `Here is a summary of **${module.title}**:\n\n${module.description || module.content.substring(0, 300) + '...'}`;
    }
    return "This module covers the core concepts, objectives, and assessments associated with the learning track. Let me know if you want me to explain any specific part!";
  }
  
  if (text.includes("quiz") || text.includes("test") || text.includes("exam")) {
    return "To prepare for the quiz:\n1. Review the concepts inside this module.\n2. Complete the mini knowledge check at the bottom.\n3. Make sure you understand the key terms. Once you complete all modules, the final assessment will unlock in the sidebar!";
  }
  
  if (text.includes("blockchain")) {
    return "Blockchain is a decentralized, distributed ledger technology that securely records transactions across a network of computers. In this hub, we use blockchain (Hardhat/Solidity) to register and verify course certificates immutably, ensuring complete authenticity and trust.";
  }
  
  if (text.includes("ai") || text.includes("artificial intelligence") || text.includes("tutor")) {
    return "Artificial Intelligence (AI) uses advanced algorithms and machine learning to analyze datasets, recognize patterns, and make intelligent decisions. In this FDP Hub, the AI companion assists you with study materials, syllabus outlines, and interactive quiz generation.";
  }
  
  // Generic helper response
  return "I've analyzed your question. As your LMS AI Assistant, I recommend reviewing this module's learning material. Let me know if you would like a 'summary' of this module, 'quiz' preparation tips, or help with concepts like 'blockchain' and 'AI'!";
};
import remarkGfm from 'remark-gfm';

/* Professional Markdown Renderer Component */
const MarkdownComponents = {
  h1: ({node, ...props}) => <h1 className="text-3xl font-extrabold text-gray-900 mt-10 mb-6 pb-4 border-b-2 border-gray-100 flex items-center gap-3" {...props} />,
  h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4 flex items-center gap-2 text-primary-800" {...props} />,
  h3: ({node, ...props}) => <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3 flex items-center gap-2"><span className="w-2 h-5 bg-primary-500 rounded-full inline-block"></span>{props.children}</h3>,
  p: ({node, ...props}) => <p className="text-gray-700 leading-relaxed mb-5 text-[15px] text-justify" {...props} />,
  ul: ({node, ...props}) => <ul className="ml-6 mb-6 space-y-2 text-gray-700 list-disc list-outside" {...props} />,
  ol: ({node, ...props}) => <ol className="ml-6 mb-6 space-y-2 text-gray-700 list-decimal list-outside" {...props} />,
  li: ({node, ...props}) => <li className="text-[15px] pl-1" {...props} />,
  blockquote: ({node, ...props}) => (
    <div className="my-8 p-6 bg-gradient-to-r from-primary-50 to-indigo-50 border-l-4 border-primary-500 rounded-r-xl shadow-sm">
      <blockquote className="text-primary-900 text-[15px] m-0 italic font-medium" {...props} />
    </div>
  ),
  code: ({node, inline, className, children, ...props}) => {
    return inline ? (
      <code className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
    ) : (
      <div className="my-6 rounded-xl overflow-hidden shadow-sm border border-gray-200">
        <div className="bg-gray-800 px-4 py-2 flex items-center gap-2">
          <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-yellow-500"></div><div className="w-3 h-3 rounded-full bg-green-500"></div></div>
          <span className="text-xs text-gray-400 font-mono ml-2">Code Snippet</span>
        </div>
        <pre className="bg-gray-900 p-5 overflow-x-auto text-sm text-gray-100 font-mono leading-relaxed" {...props}>
          <code>{children}</code>
        </pre>
      </div>
    );
  }
};

function KnowledgeCheckQuestion({ q, idx }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const isCorrect = selectedOption === q.correctAnswer;
  
  return (
    <div className="space-y-4">
      <p className="font-bold text-gray-800 text-[15px]">
        <span className="text-indigo-600 mr-1">{idx + 1}.</span> {q.question}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {q.options.map((opt, oIdx) => {
          const isSelected = selectedOption === opt;
          const isOptionCorrect = opt === q.correctAnswer;
          
          let btnClass = "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-gray-700";
          if (selectedOption) {
            if (isOptionCorrect) btnClass = "border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold ring-1 ring-emerald-500";
            else if (isSelected) btnClass = "border-red-300 bg-red-50 text-red-700";
            else btnClass = "border-gray-100 opacity-50 bg-gray-50";
          }
          
          return (
            <button 
              key={oIdx}
              disabled={selectedOption !== null}
              onClick={() => setSelectedOption(opt)}
              className={`text-left p-4 rounded-xl border-2 transition-all text-sm shadow-sm ${btnClass}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {selectedOption && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className={`p-4 rounded-xl text-sm border-l-4 shadow-sm ${isCorrect ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-amber-50 border-amber-500 text-amber-900'}`}
        >
          <span className="font-bold">{isCorrect ? '✨ Correct!' : '💡 Keep Learning!'}</span> {q.explanation}
        </motion.div>
      )}
    </div>
  );
}

export default function FDPLearningPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fdp, setFdp] = useState(null);
  const [modules, setModules] = useState([]);
  const [activeModule, setActiveModule] = useState(0);
  const [completedModules, setCompletedModules] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState(null);

  // Dynamic Video Resolver
  const [activeVideoUrl, setActiveVideoUrl] = useState('');

  // Search state for Sidebar
  const [moduleSearch, setModuleSearch] = useState('');

  // Floating Assistant state
  const [showAiTutor, setShowAiTutor] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', content: "Hello! I'm your AI Tutor. I can help explain complex concepts from this module, summarize the reading, or test your knowledge. What would you like to explore?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatLoading]);

  // Scroll Progress
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    if (!modules || modules.length === 0 || !modules[activeModule]) {
      setActiveVideoUrl('');
      return;
    }
    
    const currentModule = modules[activeModule];
    
    if (currentModule.videoUrl) {
      setActiveVideoUrl(getYouTubeEmbedUrl(currentModule.videoUrl));
    } else {
      setActiveVideoUrl('');
    }
  }, [activeModule, modules]);

  const handleEnroll = async () => {
    try {
      const resp = await enrollmentAPI.enroll(fdp.id, user.id);
      setEnrollment(resp.data);
      toast.success('Successfully enrolled!');
    } catch (err) {
      toast.error('Failed to enroll.');
    }
  };



  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const context = currentModule?.content || currentModule?.description || '';
      const res = await fdpAPI.chat(userMsg, context);
      
      const reply = res.data?.reply || res.data?.answer;
      if (reply) {
        setChatMessages(prev => [...prev, { role: 'ai', content: reply }]);
      } else {
        const fallbackReply = getKeywordResponse(userMsg, currentModule);
        setChatMessages(prev => [...prev, { role: 'ai', content: fallbackReply }]);
      }
    } catch (err) {
      console.error("AI service connection failed, using local simulated tutor response");
      setTimeout(() => {
        const fallbackReply = getKeywordResponse(userMsg, currentModule);
        setChatMessages(prev => [...prev, { role: 'ai', content: fallbackReply }]);
        setIsChatLoading(false);
      }, 800);
      return;
    } finally {
      setIsChatLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const fdpRes = await fdpAPI.getById(id);
      setFdp(fdpRes.data);
      try { setModules(JSON.parse(fdpRes.data.modules || '[]')); } catch { setModules([]); }

      // Fetch enrollment for progress tracking
      const enrollRes = await enrollmentAPI.getMyEnrollments(user.id);
      const myEnroll = enrollRes.data?.find(e => e.fdpProgram?.id === parseInt(id));
      if (myEnroll) {
        setEnrollment(myEnroll);
        // Mark completed modules
        const completed = new Set();
        for (let i = 0; i < (myEnroll.completedModules || 0); i++) completed.add(i);
        setCompletedModules(completed);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const markModuleComplete = async (idx) => {
    const newCompleted = new Set(completedModules);
    newCompleted.add(idx);
    setCompletedModules(newCompleted);

    const totalModules = modules.length || 1;
    const progress = Math.round((newCompleted.size / totalModules) * 100);

    if (enrollment) {
      try {
        await enrollmentAPI.completeModule(enrollment.id, {
          progressPercentage: progress,
          completedModules: newCompleted.size,
        });
        toast.success(`Module ${idx + 1} completed! Progress: ${progress}%`);
        // Refresh enrollment state
        loadData();
      } catch {
        toast.success(`Module ${idx + 1} marked complete`);
      }
    }

    // Auto-advance
    if (idx < modules.length - 1) {
      setTimeout(() => setActiveModule(idx + 1), 800);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  if (!fdp) return <p className="text-gray-400 text-center py-16">FDP not found</p>;

  const currentModule = modules[activeModule];
  const allModulesComplete = completedModules.size >= modules.length && modules.length > 0;
  const progress = modules.length > 0 ? Math.round((completedModules.size / modules.length) * 100) : 0;
  const quizPassed = enrollment && enrollment.quizScore >= (fdp.passingScore || 60);



  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* Sidebar — Navigation and Modules */}
      <div className="w-80 flex-shrink-0 card p-4 overflow-y-auto flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="mb-4 px-2">
            <h3 className="font-bold text-gray-800 text-sm leading-snug">{fdp.title}</h3>
            <p className="text-xs text-gray-400 mt-1">{fdp.category} • {fdp.duration}</p>
            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Modules Complete</span>
                <span className="font-bold">{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          {/* Search bar for modules */}
          <div className="mb-3 px-1">
            <input 
              type="text" 
              placeholder="Search modules..." 
              value={moduleSearch}
              onChange={(e) => setModuleSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-xs rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
            />
          </div>

          {/* Sidebar Tabs Content */}
          <div className="space-y-2">
            {modules.length === 0 ? (
              <p className="text-xs text-gray-400 px-2">No learning modules created yet.</p>
            ) : (
              modules.filter(m => m.title.toLowerCase().includes(moduleSearch.toLowerCase())).map((m, originalIndex) => {
                const i = modules.findIndex(mod => mod.title === m.title);
                const isComplete = completedModules.has(i);
                const isActive = i === activeModule;
                return (
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    key={i} 
                    onClick={() => { setActiveModule(i); }}
                    className={`w-full text-left px-3 py-3 rounded-xl text-xs transition-all relative overflow-hidden ${
                      isActive ? 'bg-white text-primary-700 font-bold border border-primary-200 shadow-[0_0_15px_rgba(124,58,237,0.15)] ring-1 ring-primary-500 z-10'
                      : isComplete ? 'text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50'
                      : 'text-gray-600 hover:bg-white hover:shadow-sm border border-transparent'
                    }`}>
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-l-xl"></div>}
                    <span className="flex items-center gap-2 relative z-10">
                      {isComplete ? (
                        <HiOutlineCheckCircle className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <span className={`w-4.5 h-4.5 rounded-md text-[10px] flex items-center justify-center font-bold flex-shrink-0 transition-colors ${isActive ? 'bg-primary-500 text-white shadow-sm' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</span>
                      )}
                      <span className="truncate">{m.title}</span>
                    </span>
                  </motion.button>
                );
              })
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-gray-100 pt-4 space-y-2 mt-4">
          <button
            onClick={() => navigate('/assessments')}
            className={`w-full text-center text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              allModulesComplete ? 'bg-primary-500 hover:bg-primary-600 text-white font-semibold shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!allModulesComplete}
          >
            <HiOutlineClipboardCheck className="text-base" />
            {quizPassed ? 'Retake Program Quiz' : 'Take Program Quiz'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-y-auto relative" id="scrollable-article-area">
        <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-400 to-indigo-500 origin-left z-50 rounded-r-full" style={{ scaleX }} />

        {currentModule && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-4xl mx-auto p-8 md:p-12"
          >
            {/* Header */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4">
              <span className="px-2.5 py-1 bg-primary-50 text-primary-700 font-bold rounded-lg flex items-center gap-1.5 border border-primary-100 shadow-sm">
                <HiOutlineSparkles className="text-sm" /> AI Powered
              </span>
              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 font-semibold rounded-lg border border-gray-200">
                {fdp.difficultyLevel || 'Intermediate'}
              </span>
              <span>•</span>
              <HiOutlineBookOpen className="w-4 h-4" />
              <span className="font-medium">Module {activeModule + 1} of {modules.length}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><HiOutlineClock className="w-3.5 h-3.5" /> {currentModule.duration}</span>
              {currentModule.estimatedReadingTime && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-primary-600 font-medium">
                    <HiOutlineBookOpen className="w-3.5 h-3.5" /> {currentModule.estimatedReadingTime} Read
                  </span>
                </>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 leading-tight tracking-tight">{currentModule.title}</h1>
            <p className="text-gray-500 text-sm mb-8 border-b border-gray-150 pb-6">{currentModule.description}</p>

            <div className="mb-10 relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-gradient-to-b from-primary-400 to-primary-600 rounded-full inline-block shadow-sm"></span>
                  Read & Learn Material
                </h3>
              </div>
              
              {/* Markdown Text (AI Notes) */}
              <div id="module-content-area" className="bg-white p-6 md:p-8 rounded-xl border border-gray-150 shadow-sm">
                <article className="max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                    {currentModule.content || currentModule.description}
                  </ReactMarkdown>
                </article>
              </div>
            </div>

            {/* Resource Files block */}
            {(currentModule.pdfUrl || currentModule.pptUrl || currentModule.externalLinks) && (
              <div className="bg-gray-50 border border-gray-150 rounded-2xl p-5 mb-8">
                <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-3">Module resource materials</h4>
                <div className="flex flex-wrap gap-3">
                  {currentModule.pdfUrl && (
                    <a href={currentModule.pdfUrl} target="_blank" rel="noreferrer" className="btn-secondary !py-2 !px-3 text-xs flex items-center gap-1.5 bg-white">
                      <HiOutlineDownload className="text-base" /> Download PDF Notes
                    </a>
                  )}
                  {currentModule.pptUrl && (
                    <a href={currentModule.pptUrl} target="_blank" rel="noreferrer" className="btn-secondary !py-2 !px-3 text-xs flex items-center gap-1.5 bg-white">
                      <HiOutlineDownload className="text-base" /> Download Lecture Slides
                    </a>
                  )}
                  {currentModule.externalLinks && (
                    <a href={currentModule.externalLinks} target="_blank" rel="noreferrer" className="btn-secondary !py-2 !px-3 text-xs flex items-center gap-1.5 bg-white text-primary-600 border-primary-100">
                      <HiOutlineExternalLink className="text-base" /> Reference Link
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Module-Specific Deliverables & Resources */}
            {(currentModule.resources || currentModule.quiz || currentModule.assignment) && (
              <div className="border-t border-gray-150 pt-6 mt-8 space-y-6 mb-8">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-1.5 h-4.5 bg-primary-500 rounded-full inline-block"></span>
                  Module Tasks & Extra Materials
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentModule.resources && (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-1.5">
                      <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Resources</h4>
                      <p className="text-gray-700 text-xs whitespace-pre-wrap leading-relaxed">{currentModule.resources}</p>
                    </div>
                  )}
                  {currentModule.assignment && (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-1.5">
                      <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Module Tasks</h4>
                      <p className="text-gray-700 text-xs whitespace-pre-wrap leading-relaxed">{currentModule.assignment}</p>
                    </div>
                  )}
                  {currentModule.quiz && (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 md:col-span-2 space-y-1.5">
                      <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Concept Checks</h4>
                      <p className="text-gray-700 text-xs whitespace-pre-wrap leading-relaxed">{currentModule.quiz}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Optional Video Player */}
            {activeVideoUrl && (() => {
              const isMp4 = activeVideoUrl.endsWith('.mp4') || activeVideoUrl.includes('/uploads/videos/');

              return (
                <div className="mt-8 border-t border-gray-150 pt-6">
                  <div className="mb-8 rounded-2xl overflow-hidden shadow-md aspect-video max-w-2xl bg-black">
                    {isMp4 ? (
                      <video
                        className="w-full h-full"
                        src={activeVideoUrl}
                        controls
                      />
                    ) : (
                      <iframe
                        className="w-full h-full"
                        src={activeVideoUrl}
                        title="Module Video"
                        allowFullScreen
                      />
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Interactive Knowledge Check */}
            {currentModule.knowledgeCheck && currentModule.knowledgeCheck.length > 0 && (
              <div className="mt-12 bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-150">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                    <HiOutlineClipboardCheck className="text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900">Mini Knowledge Check</h3>
                    <p className="text-xs text-gray-500">Test your understanding of this module's core concepts</p>
                  </div>
                </div>
                
                <div className="space-y-8">
                  {currentModule.knowledgeCheck.map((q, idx) => (
                    <KnowledgeCheckQuestion key={idx} q={q} idx={idx} />
                  ))}
                </div>
              </div>
            )}

            {/* Nav controls */}
            <div className="flex items-center gap-4 mt-12 pt-8 border-t border-gray-200">
              {activeModule > 0 && (
                <button onClick={() => setActiveModule(activeModule - 1)}
                  className="px-5 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2">
                  <HiOutlineChevronLeft className="w-4 h-4" /> Previous
                </button>
              )}
              <div className="flex-1" />
              {!completedModules.has(activeModule) && (
                <button onClick={() => markModuleComplete(activeModule)}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2">
                  <HiOutlineCheckCircle className="text-lg" /> Mark as Complete
                </button>
              )}
              {activeModule < modules.length - 1 && (
                <button onClick={() => setActiveModule(activeModule + 1)}
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2">
                  Next <HiOutlineChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Floating AI Assistant Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAiTutor(!showAiTutor)}
          className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-primary-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all"
        >
          <HiOutlineChatAlt2 className="text-2xl" />
        </motion.button>
        
        <AnimatePresence>
          {showAiTutor && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-20 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-indigo-500 to-primary-600 p-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white">
                  <HiOutlineSparkles />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">AI Tutor</h3>
                  <p className="text-indigo-100 text-[10px]">Ask questions about {fdp.title}</p>
                </div>
              </div>
              <div className="p-5 h-72 overflow-y-auto bg-gray-50 flex flex-col gap-3">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`max-w-[85%] rounded-xl p-3 text-xs shadow-sm border ${
                    msg.role === 'user' 
                      ? 'bg-indigo-500 text-white border-indigo-600 rounded-tr-sm self-end' 
                      : 'bg-white text-gray-700 border-gray-150 rounded-tl-sm self-start'
                  }`}>
                    <div className="text-[13px] leading-relaxed break-words">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="max-w-[85%] rounded-xl p-3 text-xs shadow-sm border bg-white text-gray-400 border-gray-150 rounded-tl-sm self-start flex items-center gap-2">
                    <HiOutlineSparkles className="animate-pulse text-primary-500" /> AI Tutor is typing...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-150 bg-white">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question..." 
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-primary-500 transition-all"
                />
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
