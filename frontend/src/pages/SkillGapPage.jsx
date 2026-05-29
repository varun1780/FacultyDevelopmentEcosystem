import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { skillAnalysisAPI } from '../services/api';
import { HiOutlineIdentification, HiOutlineLightBulb, HiOutlineAcademicCap, HiOutlineChartBar } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function SkillGapPage() {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    Promise.all([
      skillAnalysisAPI.getAnalysis(user.id),
      skillAnalysisAPI.getRecommendations(user.id),
    ])
      .then(([analysisRes, recsRes]) => {
        setAnalysis(analysisRes.data);
        setRecommendations(recsRes.data);
      })
      .catch((err) => {
        console.error('Skill analysis fetch failed:', err);
        setError('Failed to load skill analysis. Please try again.');
        toast.error('Failed to load skill analysis');
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  /* ===== LOADING STATE ===== */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-400 animate-pulse">Analyzing your skill profile…</p>
      </div>
    );
  }

  /* ===== ERROR STATE ===== */
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <HiOutlineIdentification className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-gray-500">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary text-sm !py-2">Retry</button>
      </div>
    );
  }

  /* ===== EMPTY STATE ===== */
  const hasGaps = analysis?.gaps?.length > 0;
  const hasRecs = recommendations?.recommendations?.length > 0 || recommendations?.recommendedFdps?.length > 0;

  if (!hasGaps && !hasRecs) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <HiOutlineIdentification className="text-primary-500" /> Skill Gap Analysis
          </h1>
          <p className="text-gray-500 mt-1">AI-powered analysis of your skill development needs</p>
        </div>
        <div className="card p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <HiOutlineAcademicCap className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Data Yet</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            {analysis?.analysis || 'Enroll in FDP programs and complete assessments to unlock your personalized skill gap analysis.'}
          </p>
        </div>
      </div>
    );
  }

  /* ===== STATS BAR ===== */
  const stats = analysis?.stats || {};

  /* ===== Priority color helpers ===== */
  const priorityBadge = (p) => {
    if (p === 'High') return 'bg-red-100 text-red-700';
    if (p === 'Medium') return 'bg-amber-100 text-amber-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  const barColor = (p) => {
    if (p === 'High') return 'bg-red-400';
    if (p === 'Medium') return 'bg-amber-400';
    return 'bg-emerald-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <HiOutlineIdentification className="text-primary-500" /> Skill Gap Analysis
        </h1>
        <p className="text-gray-500 mt-1">Personalized analysis based on your assessment performance</p>
      </div>

      {/* Stats Overview */}
      {(stats.totalEnrollments > 0 || stats.assessmentsAttempted > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Enrollments', value: stats.totalEnrollments ?? 0, icon: '📚' },
            { label: 'Completed', value: stats.completedFdps ?? 0, icon: '✅' },
            { label: 'Assessments', value: stats.assessmentsAttempted ?? 0, icon: '📝' },
            { label: 'Avg Score', value: `${stats.averageScore ?? 0}%`, icon: '📊' },
          ].map((s, i) => (
            <div key={i} className="card p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-bold text-gray-800">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Analysis Summary */}
      {analysis?.analysis && (
        <div className="card p-6">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <HiOutlineChartBar className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Analysis Summary</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{analysis.analysis}</p>
            </div>
          </div>
        </div>
      )}

      {/* Skill Gaps */}
      {hasGaps && (
        <div className="card p-6">
          <h3 className="section-title flex items-center gap-2">
            <HiOutlineIdentification className="text-primary-500" /> Skill Gaps
          </h3>
          <div className="space-y-4 mt-4">
            {analysis.gaps.map((g, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-800">{g.skill}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Gap: {g.gapPercentage}%</span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${priorityBadge(g.priority)}`}>
                      {g.priority}
                    </span>
                  </div>
                </div>
                {/* Current level bar */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-16">Current</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-700 ${barColor(g.priority)}`}
                      style={{ width: `${g.currentLevel}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-10 text-right">{g.currentLevel}%</span>
                </div>
                {/* Target level bar */}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500 w-16">Target</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-3 rounded-full transition-all duration-700"
                      style={{ width: `${g.targetLevel}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-10 text-right">{g.targetLevel}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {hasRecs && (
        <div className="card p-6">
          <h3 className="section-title flex items-center gap-2">
            <HiOutlineLightBulb className="text-amber-500" /> Recommended FDPs
          </h3>
          {recommendations.recommendations?.length > 0 ? (
            <div className="space-y-3 mt-4">
              {recommendations.recommendations.map((r, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 flex items-start gap-3 hover:shadow-sm transition-shadow">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold text-white ${
                    r.priority === 'High' ? 'bg-red-500' : r.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-800">{r.title}</span>
                      {r.category && (
                        <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">{r.category}</span>
                      )}
                      {r.difficulty && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{r.difficulty}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{r.reason}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0 ${priorityBadge(r.priority)}`}>
                    {r.priority}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            /* Fall back to simple title list */
            <div className="flex flex-wrap gap-2 mt-4">
              {recommendations.recommendedFdps?.map((f, i) => (
                <span key={i} className="badge-primary">{f}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Completed FDPs */}
      {analysis?.completedFdpTitles?.length > 0 && (
        <div className="card p-6">
          <h3 className="section-title flex items-center gap-2">
            <HiOutlineAcademicCap className="text-emerald-500" /> Completed FDPs
          </h3>
          <div className="flex flex-wrap gap-2 mt-3">
            {analysis.completedFdpTitles.map((t, i) => (
              <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full font-medium">
                ✓ {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
