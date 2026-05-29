import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { enrollmentAPI, aiAPI } from '../services/api';
import { HiOutlineClipboardCheck, HiCheck, HiX, HiOutlineInformationCircle, HiOutlineClock, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function AssessmentsPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Quiz UI states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    enrollmentAPI.getMyEnrollments(user.id)
      .then(r => setEnrollments(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.id]);

  useEffect(() => {
    let interval;
    if (timerActive && timeLeft > 0 && !result) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            submitQuiz(); // Auto-submit when time is up
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, result]);

  const handleAnswerSelect = (questionId, optionId) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const startQuiz = async (enrollment) => {
    try {
      let quizData = null;
      if (enrollment.fdpProgram?.quiz) {
        try {
          const parsed = JSON.parse(enrollment.fdpProgram.quiz);
          if (parsed && parsed.questions && parsed.questions.length > 0) {
            quizData = parsed;
          }
        } catch (e) {
          console.error("Failed to parse stored FDP quiz, falling back to AI", e);
        }
      }
      
      if (!quizData) {
        toast.loading("Generating professional assessment...", { id: 'quiz' });
        const res = await aiAPI.generateQuiz({ topic: enrollment.fdpProgram?.title, questionCount: 10 });
        quizData = res.data;
        toast.dismiss('quiz');
      }

      if (quizData && quizData.questions) {
        quizData.questions = quizData.questions.map((q, idx) => {
          let options = [];
          let correctAnswer = 0;

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
              const foundIdx = options.findIndex(o => o === q.correctAnswer);
              correctAnswer = foundIdx !== -1 ? foundIdx : parseInt(q.correctAnswer) || 0;
            } else {
              correctAnswer = q.correctAnswer !== undefined ? q.correctAnswer : 0;
            }
          }

          return {
            ...q,
            id: q.questionId || q.id || idx + 1,
            options,
            correctAnswer
          };
        });
      }

      setActiveQuiz({ enrollment, quiz: quizData });
      setAnswers({});
      setResult(null);
      setCurrentIndex(0);
      setTimeLeft(15 * 60);
      setTimerActive(true);
    } catch (err) { 
      toast.dismiss('quiz');
      toast.error('Failed to load quiz'); 
      console.error(err);
    }
  };

  const submitQuiz = async () => {
    if (!activeQuiz || submitting) return;
    setSubmitting(true);
    setTimerActive(false);
    
    const quiz = activeQuiz.quiz;

    // Calculate real local score and build detailed breakdown with explanations
    let correct = 0;
    const breakdown = [];
    quiz.questions?.forEach(q => {
      const selectedAnswer = answers[q.id];
      const correctAnswer = q.correctAnswer;

      console.log("Selected:", selectedAnswer);
      console.log("Correct:", correctAnswer);

      const isCorrect = selectedAnswer === correctAnswer;
      if (isCorrect) correct++;
      
      const userAnsOptText = selectedAnswer !== undefined ? q.options[selectedAnswer] : '(Skipped)';
      const correctAnsOptText = correctAnswer !== undefined ? q.options[correctAnswer] : '';
      
      breakdown.push({
        questionNumber: q.id,
        question: q.question,
        yourAnswer: userAnsOptText,
        correctAnswer: correctAnsOptText,
        isCorrect,
        explanation: q.explanation // Preserve AI explanation!
      });
    });
    
    const total = quiz.questions?.length || 1;
    const percentage = Math.round((correct / total) * 100);

    try {
      const res = await enrollmentAPI.submitQuiz(activeQuiz.enrollment.id, {
        answers,
        correctAnswers: quiz.questions?.map(q => q.correctAnswer),
      });
      setResult({
        ...res.data,
        score: res.data.percentage ?? percentage,
        total,
        correct: res.data.score ?? correct,
        breakdown: breakdown, // Force use local breakdown to keep explanations
      });
      toast.success(`Quiz submitted! Score: ${res.data.percentage ?? percentage}%`);
    } catch {
      setResult({ score: percentage, total, correct, breakdown, feedback: 'Evaluation completed locally.' });
    }
    setSubmitting(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  /* ===== ACTIVE QUIZ (PROFESSIONAL WIZARD) ===== */
  if (activeQuiz && !result) {
    const quiz = activeQuiz.quiz;
    const totalQ = quiz.questions?.length || 0;
    const q = quiz.questions[currentIndex];
    const answeredCount = Object.keys(answers).length;
    
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{quiz.topic} Assessment</h1>
            <p className="text-sm text-gray-500">Passing score: {quiz.passingScore || 70}%</p>
          </div>
          <div className="flex items-center gap-6 mt-4 sm:mt-0">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border">
              <span className="text-sm font-medium text-gray-600">Answered:</span>
              <span className="font-bold text-primary-600">{answeredCount}/{totalQ}</span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-lg ${
              timeLeft < 120 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-primary-50 text-primary-700'
            }`}>
              <HiOutlineClock className="w-6 h-6" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="card p-8 min-h-[400px] flex flex-col">
          <div className="mb-6 flex justify-between items-end">
            <span className="text-sm font-bold tracking-widest text-primary-500 uppercase">Question {currentIndex + 1} of {totalQ}</span>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-800 mb-8 leading-relaxed">
            {q.question}
          </h2>

          <div className="space-y-3 flex-1">
            {(q.options || []).map((optText, j) => {
              const isSelected = answers[q.id] === j;
              return (
                <label key={j}
                  className={`flex items-center gap-4 w-full text-left px-5 py-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 text-primary-800 font-medium ring-2 ring-primary-200 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                  <input
                    type="radio"
                    name={`question-${q.id}`}
                    value={j}
                    checked={isSelected}
                    onChange={() => handleAnswerSelect(q.id, j)}
                    className="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500 cursor-pointer"
                  />
                  <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    isSelected ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-300 text-gray-400'
                  }`}>{String.fromCharCode(65 + j)}</span>
                  <span className="text-gray-700 flex-1 text-lg">{optText}</span>
                </label>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between items-center">
            <button 
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors ${
                currentIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
              }`}>
              <HiChevronLeft className="w-5 h-5" /> Previous
            </button>
            
            {currentIndex === totalQ - 1 ? (
              <button onClick={submitQuiz} disabled={submitting}
                className="btn-primary flex items-center gap-2 px-8">
                {submitting ? 'Evaluating...' : 'Submit Assessment'} <HiCheck className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={() => setCurrentIndex(prev => Math.min(totalQ - 1, prev + 1))}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-primary-600 hover:bg-primary-50 transition-colors">
                Next <HiChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Question Grid Map */}
        <div className="card p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Assessment Map</p>
          <div className="flex flex-wrap gap-2">
            {quiz.questions.map((qMap, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                  currentIndex === idx 
                    ? 'ring-2 ring-offset-2 ring-primary-500 bg-primary-100 text-primary-700' 
                    : answers[qMap.id]
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ===== RESULTS WITH EXPLANATIONS ===== */
  if (result) {
    const passed = result.score >= 70;
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <h1 className="page-title">Assessment Results</h1>

        <div className={`card p-10 text-center ${passed ? 'border-2 border-emerald-200' : 'border-2 border-red-200'}`}>
          <div className={`w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center text-5xl font-bold text-white shadow-xl ${
            passed ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-red-400 to-red-600'
          }`}>
            {result.score}%
          </div>
          <h2 className="text-3xl font-bold mb-2">{passed ? '🎉 Congratulations, You Passed!' : '❌ Not Passed'}</h2>
          <p className="text-gray-500 text-lg">{result.correct}/{result.total} correct answers</p>
          {result.grade && <span className={`inline-block mt-4 px-6 py-2 rounded-full text-lg font-bold shadow-sm ${
            result.grade?.startsWith('A') ? 'bg-emerald-100 text-emerald-800'
            : result.grade?.startsWith('B') ? 'bg-blue-100 text-blue-800'
            : result.grade?.startsWith('C') ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
          }`}>Final Grade: {result.grade}</span>}
        </div>

        <div className="card p-8">
          <h3 className="font-bold text-gray-800 mb-6 text-2xl border-b pb-4">Detailed Breakdown</h3>
          <div className="space-y-6">
            {result.breakdown?.map((b, i) => (
              <div key={i} className={`p-6 rounded-2xl border-l-4 shadow-sm ${
                b.isCorrect ? 'bg-emerald-50/50 border-emerald-500' : 'bg-red-50/50 border-red-500'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 shadow-sm ${
                    b.isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {b.isCorrect ? <HiCheck className="w-5 h-5" /> : <HiX className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-lg mb-3">Q{b.questionNumber}. {b.question}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-lg border">
                        <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Your Answer</span>
                        <p className={b.isCorrect ? 'text-emerald-700 font-medium' : 'text-red-700 font-medium'}>
                          {b.yourAnswer || '(Skipped)'}
                        </p>
                      </div>
                      {!b.isCorrect && (
                        <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                          <span className="text-xs font-bold text-emerald-600 uppercase block mb-1">Correct Answer</span>
                          <p className="text-emerald-800 font-medium">{b.correctAnswer}</p>
                        </div>
                      )}
                    </div>

                    {/* AI EXPLANATION */}
                    {b.explanation && (
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                        <HiOutlineInformationCircle className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-blue-900 text-sm mb-1">Learning Note:</p>
                          <p className="text-blue-800 text-sm leading-relaxed">{b.explanation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <span className={`text-sm font-black px-3 py-1 rounded-lg ${
                    b.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {b.isCorrect ? '+10' : '0'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => { setActiveQuiz(null); setResult(null); }} className="btn-primary w-full py-4 text-lg">
          ← Return to Dashboard
        </button>
      </div>
    );
  }

  /* ===== ENROLLMENT LIST ===== */
  return (
    <div className="space-y-6">
      <h1 className="page-title flex items-center gap-2">
        <HiOutlineClipboardCheck className="text-primary-500" /> My Assessments
      </h1>
      {enrollments.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          <HiOutlineClipboardCheck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-lg">You must enroll in a Faculty Development Program to take assessments.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((e, i) => {
            const hasScore = e.quizScore > 0;
            const passed = e.quizScore >= (e.fdpProgram?.passingScore || 70);
            return (
              <div key={i} className="card p-6 flex flex-col h-full hover:shadow-lg transition-shadow">
                <div className="flex-1">
                  <span className="text-xs font-bold tracking-wider text-primary-500 uppercase mb-2 block">
                    {e.fdpProgram?.category || 'Professional FDP'}
                  </span>
                  <h3 className="font-bold text-gray-900 text-lg mb-3 leading-snug">{e.fdpProgram?.title}</h3>
                  <div className="flex flex-col gap-2 mb-6">
                    {hasScore ? (
                      <div className={`p-3 rounded-xl flex items-center justify-between ${
                        passed ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'
                      }`}>
                        <div>
                          <span className="text-xs text-gray-500 block mb-0.5">Latest Score</span>
                          <span className={`font-black text-xl ${passed ? 'text-emerald-700' : 'text-red-700'}`}>
                            {e.quizScore}%
                          </span>
                        </div>
                        <span className={`font-bold text-sm px-3 py-1 rounded-full ${
                          passed ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'
                        }`}>
                          {passed ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-gray-500 text-sm font-medium">Not Attempted Yet</span>
                      </div>
                    )}
                    <span className="text-xs text-gray-400 font-medium">Total Attempts: {e.quizAttempts || 0}</span>
                  </div>
                </div>
                <button onClick={() => startQuiz(e)} className="btn-primary w-full">
                  {hasScore ? 'Retake Assessment' : 'Start Assessment'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
