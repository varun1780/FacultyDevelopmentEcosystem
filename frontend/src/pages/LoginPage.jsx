import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import { HiSparkles } from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch {
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-bg relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 border border-white rounded-full" />
          <div className="absolute bottom-20 right-20 w-96 h-96 border border-white rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 border border-white/50 rounded-full" />
        </div>
        <div className="relative z-10 text-white max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <HiSparkles className="text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI FDP Hub</h1>
              <p className="text-white/70 text-sm">Faculty Development Platform</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-6">AI-Driven Faculty Development with Blockchain Certification</h2>
          <p className="text-white/80 text-lg leading-relaxed mb-8">
            Autonomous evaluation, blockchain credentialing, and adaptive learning intelligence — all in one platform.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'AI-Powered', desc: 'Smart content & evaluation' },
              { label: 'Blockchain', desc: 'Tamper-proof certificates' },
              { label: 'Adaptive', desc: 'Personalized learning paths' },
              { label: 'Analytics', desc: 'Deep skill insights' },
            ].map(f => (
              <div key={f.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="font-semibold text-sm">{f.label}</p>
                <p className="text-white/60 text-xs mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl gradient-bg flex items-center justify-center">
              <HiSparkles className="text-white text-xl" />
            </div>
            <h1 className="text-xl font-bold gradient-text">AI FDP Hub</h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome back</h2>
          <p className="text-gray-500 mb-8">Sign in to your account to continue</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" className="input-field !pl-10" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="login-password" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" className="input-field !pl-10 !pr-10" required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                </button>
              </div>
            </div>
            <button id="login-submit" type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 !py-3">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Sign In</>}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-medium hover:text-primary-700">Register here</Link>
          </p>
          <div className="mt-4 text-center">
            <Link to="/admin/register" className="text-xs text-gray-400 hover:text-primary-600 transition-colors">
              Register as Administrator →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
