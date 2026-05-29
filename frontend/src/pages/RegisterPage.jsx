import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineAcademicCap } from 'react-icons/hi';
import { HiSparkles } from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '', role: 'FACULTY' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register(form);
      toast.success('Registration successful!');
      navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-11 h-11 rounded-xl gradient-bg flex items-center justify-center">
            <HiSparkles className="text-white text-xl" />
          </div>
          <h1 className="text-xl font-bold gradient-text">AI FDP Hub</h1>
        </div>
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Create Account</h2>
          <p className="text-gray-500 mb-6 text-center">Join the Faculty Development Platform</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="register-name" name="name" value={form.name} onChange={handleChange} placeholder="Dr. John Doe" className="input-field !pl-10" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="register-email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@university.edu" className="input-field !pl-10" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="register-password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min 6 characters" className="input-field !pl-10" required minLength={6} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <div className="relative">
                <HiOutlineAcademicCap className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="register-dept" name="department" value={form.department} onChange={handleChange} placeholder="e.g. Computer Science" className="input-field !pl-10" />
              </div>
            </div>
            <button id="register-submit" type="submit" disabled={loading} className="btn-primary w-full !py-3 flex items-center justify-center">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account? <Link to="/login" className="text-primary-600 font-medium">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
