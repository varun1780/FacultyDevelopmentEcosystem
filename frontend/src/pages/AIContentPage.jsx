import { useState } from 'react';
import { aiAPI } from '../services/api';
import { HiSparkles } from 'react-icons/hi2';
import { HiOutlineBookOpen, HiOutlineClipboardCheck, HiOutlineLightBulb } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function AIContentPage() {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('Intermediate');
  const [content, setContent] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState('');

  const generateContent = async () => {
    if (!topic.trim()) return toast.error('Enter a topic');
    setLoading('content');
    try {
      const res = await aiAPI.generateContent({ topic, level });
      setContent(res.data);
      toast.success('Content generated!');
    } catch (e) { toast.error('Generation failed'); }
    finally { setLoading(''); }
  };

  const generateQuiz = async () => {
    if (!topic.trim()) return toast.error('Enter a topic');
    setLoading('quiz');
    try {
      const res = await aiAPI.generateQuiz({ topic, questionCount: 5 });
      setQuiz(res.data);
      toast.success('Quiz generated!');
    } catch (e) { toast.error('Generation failed'); }
    finally { setLoading(''); }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="page-title flex items-center gap-2"><HiSparkles className="text-primary-500" /> AI Content Generation</h1><p className="text-gray-500 mt-1">Generate course content and quizzes using AI</p></div>
      <div className="card p-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]"><label className="block text-sm font-medium text-gray-700 mb-1">Topic</label><input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., Machine Learning in Education" className="input-field" /></div>
          <div className="w-40"><label className="block text-sm font-medium text-gray-700 mb-1">Level</label><select value={level} onChange={e => setLevel(e.target.value)} className="input-field"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div>
          <button onClick={generateContent} disabled={loading === 'content'} className="btn-primary flex items-center gap-2">
            {loading === 'content' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <HiOutlineBookOpen />} Generate Content
          </button>
          <button onClick={generateQuiz} disabled={loading === 'quiz'} className="btn-secondary flex items-center gap-2">
            {loading === 'quiz' ? <div className="w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" /> : <HiOutlineClipboardCheck />} Generate Quiz
          </button>
        </div>
      </div>
      {content && (
        <div className="card p-6 animate-slide-up">
          <h2 className="text-xl font-bold text-gray-800 mb-2">{content.title}</h2>
          <p className="text-gray-600 mb-4">{content.description}</p>
          {content.modules && (<div className="space-y-4">{content.modules.map((m, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <div className="flex items-center gap-3 mb-2"><div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white text-sm font-bold">{i + 1}</div><h3 className="font-semibold text-gray-800">{m.title}</h3><span className="text-xs text-gray-400 ml-auto">{m.duration}</span></div>
              <p className="text-sm text-gray-600 ml-11">{m.content}</p>
            </div>
          ))}</div>)}
          {content.learningOutcomes && (<div className="mt-6"><h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><HiOutlineLightBulb className="text-amber-500" /> Learning Outcomes</h3><ul className="space-y-1">{content.learningOutcomes.map((o, i) => <li key={i} className="text-sm text-gray-600 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary-500" />{o}</li>)}</ul></div>)}
        </div>
      )}
      {quiz && (
        <div className="card p-6 animate-slide-up">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Generated Quiz: {quiz.topic}</h2>
          <p className="text-sm text-gray-500 mb-4">{quiz.totalQuestions} questions • Passing score: {quiz.passingScore}%</p>
          <div className="space-y-4">{quiz.questions?.map((q, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <p className="font-medium text-gray-800 mb-3">Q{q.id}. {q.question}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{q.options?.map((o, j) => (
                <div key={j} className={`px-4 py-2 rounded-lg text-sm border ${j === q.correctAnswer ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-medium' : 'bg-white border-gray-200 text-gray-600'}`}>{String.fromCharCode(65 + j)}. {o}</div>
              ))}</div>
            </div>
          ))}</div>
        </div>
      )}
    </div>
  );
}
