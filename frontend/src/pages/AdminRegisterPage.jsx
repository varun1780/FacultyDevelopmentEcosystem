import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
  HiOutlinePhotograph,
  HiOutlineShieldCheck,
  HiOutlineX,
} from 'react-icons/hi';
import { HiSparkles } from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function AdminRegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    designation: '',
    role: 'ADMIN',
    collegeName: '',
    collegeCode: '',
    website: '',
    principalName: '',
  });

  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      // Crop to square and resize via canvas
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 200;
        const size = Math.min(img.width, img.height);
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;
        ctx.drawImage(img, startX, startY, size, size, 0, 0, 200, 200);
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        setProfileImage(base64);
        setProfilePreview(base64);
      };
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setProfileImage(null);
    setProfilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = 'Name is required';
    else if (form.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';

    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Enter a valid email address';

    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (!form.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (!form.department.trim()) newErrors.department = 'Department is required';
    if (!form.designation.trim()) newErrors.designation = 'Designation is required';
    if (!form.collegeName.trim()) newErrors.collegeName = 'College Name is required';
    if (!form.collegeCode.trim()) newErrors.collegeCode = 'College Code is required';
    if (!form.principalName.trim()) newErrors.principalName = 'Principal Name is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        department: form.department.trim(),
        designation: form.designation.trim(),
        role: 'ADMIN',
        collegeName: form.collegeName.trim(),
        collegeCode: form.collegeCode.trim(),
        website: form.website.trim(),
        principalName: form.principalName.trim(),
      };

      // Include profile photo if selected
      if (profileImage) {
        payload.profilePhoto = profileImage;
      }

      const user = await register(payload);
      toast.success('Admin account created successfully!');
      navigate('/admin');
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ field }) =>
    errors[field] ? <p className="text-red-500 text-xs mt-1 animate-fade-in">{errors[field]}</p> : null;

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-5/12 gradient-bg relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-16 left-16 w-64 h-64 border border-white rounded-full" />
          <div className="absolute bottom-16 right-16 w-80 h-80 border border-white rounded-full" />
          <div className="absolute top-1/2 left-1/4 w-40 h-40 border border-white/50 rounded-full" />
          <div className="absolute top-1/3 right-1/4 w-24 h-24 border border-white/30 rounded-full animate-float" />
        </div>
        <div className="relative z-10 text-white max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <HiSparkles className="text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI FDP Hub</h1>
              <p className="text-white/70 text-sm">Administrator Portal</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold leading-tight mb-6">
            Set Up Your Admin Account
          </h2>
          <p className="text-white/80 text-lg leading-relaxed mb-8">
            As an administrator, you'll manage faculty development programs, 
            issue blockchain-verified certificates, and monitor platform analytics.
          </p>
          <div className="space-y-4">
            {[
              { icon: HiOutlineShieldCheck, label: 'Full Platform Control', desc: 'Manage users, FDPs & certificates' },
              { icon: HiOutlineAcademicCap, label: 'AI-Powered Tools', desc: 'Generate content & quizzes with AI' },
              { icon: HiOutlineBriefcase, label: 'Analytics Dashboard', desc: 'Real-time metrics & insights' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <item.icon className="text-xl mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-white/60 text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-10 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-lg animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-11 h-11 rounded-xl gradient-bg flex items-center justify-center">
              <HiSparkles className="text-white text-xl" />
            </div>
            <h1 className="text-xl font-bold gradient-text">AI FDP Hub</h1>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                <HiOutlineShieldCheck className="text-primary-600 text-lg" />
              </div>
              <span className="badge-primary">Administrator</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mt-3">Create Admin Account</h2>
            <p className="text-gray-500 mt-1">Set up your administrator profile to manage the platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Profile Image Upload */}
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all duration-200"
                >
                  {profilePreview ? (
                    <img src={profilePreview} alt="Profile preview" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <HiOutlinePhotograph className="text-2xl text-gray-400" />
                  )}
                </div>
                {profilePreview && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                  >
                    <HiOutlineX className="text-xs" />
                  </button>
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  {profilePreview ? 'Change photo' : 'Upload profile photo'}
                </button>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG. Max 2MB. Auto-cropped to square.</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                <div className="relative">
                  <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="admin-register-name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Dr. Jane Smith"
                    className={`input-field !pl-10 ${errors.name ? '!border-red-400 !ring-red-200' : ''}`}
                  />
                </div>
                <FieldError field="name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
                <div className="relative">
                  <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="admin-register-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="admin@university.edu"
                    className={`input-field !pl-10 ${errors.email ? '!border-red-400 !ring-red-200' : ''}`}
                  />
                </div>
                <FieldError field="email" />
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="admin-register-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    className={`input-field !pl-10 !pr-10 ${errors.password ? '!border-red-400 !ring-red-200' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                  </button>
                </div>
                <FieldError field="password" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="admin-register-confirm-password"
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className={`input-field !pl-10 !pr-10 ${errors.confirmPassword ? '!border-red-400 !ring-red-200' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                  </button>
                </div>
                <FieldError field="confirmPassword" />
              </div>
            </div>

            {/* Password strength indicator */}
            {form.password && (
              <div className="animate-fade-in">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((level) => {
                    const strength =
                      (form.password.length >= 6 ? 1 : 0) +
                      (/[A-Z]/.test(form.password) ? 1 : 0) +
                      (/[0-9]/.test(form.password) ? 1 : 0) +
                      (/[^A-Za-z0-9]/.test(form.password) ? 1 : 0);
                    const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400'];
                    return (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          level <= strength ? colors[strength - 1] : 'bg-gray-200'
                        }`}
                      />
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  {(() => {
                    const s =
                      (form.password.length >= 6 ? 1 : 0) +
                      (/[A-Z]/.test(form.password) ? 1 : 0) +
                      (/[0-9]/.test(form.password) ? 1 : 0) +
                      (/[^A-Za-z0-9]/.test(form.password) ? 1 : 0);
                    return ['Weak', 'Fair', 'Good', 'Strong'][s - 1] || 'Too short';
                  })()}{' '}
                  — Use uppercase, numbers & symbols for a stronger password
                </p>
              </div>
            )}

            {/* Department & Designation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Department *</label>
                <div className="relative">
                  <HiOutlineAcademicCap className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="admin-register-department"
                    name="department"
                    type="text"
                    value={form.department}
                    onChange={handleChange}
                    placeholder="e.g. Administration"
                    className={`input-field !pl-10 ${errors.department ? '!border-red-400 !ring-red-200' : ''}`}
                  />
                </div>
                <FieldError field="department" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Designation *</label>
                <div className="relative">
                  <HiOutlineBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="admin-register-designation"
                    name="designation"
                    type="text"
                    value={form.designation}
                    onChange={handleChange}
                    placeholder="e.g. Platform Administrator"
                    className={`input-field !pl-10 ${errors.designation ? '!border-red-400 !ring-red-200' : ''}`}
                  />
                </div>
                <FieldError field="designation" />
              </div>
            </div>

            {/* College Details */}
            <div className="pt-4 border-t border-gray-200 mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Institution Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">College Name *</label>
                  <input
                    name="collegeName"
                    type="text"
                    value={form.collegeName}
                    onChange={handleChange}
                    placeholder="e.g. KLE Technological University"
                    className={`input-field ${errors.collegeName ? '!border-red-400 !ring-red-200' : ''}`}
                  />
                  <FieldError field="collegeName" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">College Code *</label>
                  <input
                    name="collegeCode"
                    type="text"
                    value={form.collegeCode}
                    onChange={handleChange}
                    placeholder="e.g. COLLEGE-01"
                    className={`input-field ${errors.collegeCode ? '!border-red-400 !ring-red-200' : ''}`}
                  />
                  <FieldError field="collegeCode" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
                  <input
                    name="website"
                    type="url"
                    value={form.website}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Principal Name *</label>
                  <input
                    name="principalName"
                    type="text"
                    value={form.principalName}
                    onChange={handleChange}
                    placeholder="Dr. John Doe"
                    className={`input-field ${errors.principalName ? '!border-red-400 !ring-red-200' : ''}`}
                  />
                  <FieldError field="principalName" />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="admin-register-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 !py-3 text-base"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <HiOutlineShieldCheck className="text-lg" />
                  Create Admin Account
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
                Sign In
              </Link>
            </p>
            <p className="text-sm text-gray-400">
              Registering as faculty?{' '}
              <Link to="/register" className="text-primary-600 font-medium hover:text-primary-700">
                Faculty Registration
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
