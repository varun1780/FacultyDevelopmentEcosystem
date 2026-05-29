import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { facultyAPI, analyticsAPI, notificationAPI, certificateAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  HiOutlineUser, 
  HiOutlineMail, 
  HiOutlineAcademicCap, 
  HiOutlineBriefcase,
  HiOutlinePhone,
  HiOutlineLink,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineShieldCheck,
  HiOutlineKey,
  HiOutlineLockClosed,
  HiOutlineClock,
  HiOutlineBadgeCheck,
  HiOutlineDownload,
  HiOutlineCheck,
  HiOutlineDesktopComputer
} from 'react-icons/hi';
import { generateNativePDF } from '../utils/pdfGenerator';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  
  // Dashboard state variables
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [certificates, setCertificates] = useState([]);
  
  // Editing profile details state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    department: '',
    designation: '',
    experience: '',
    linkedinUrl: '',
    bio: '',
    institutionName: ''
  });

  // Skills state
  const [skills, setSkills] = useState({});
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillScore, setNewSkillScore] = useState(80);
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);

  // Security password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // File Upload Cropper States
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const fileInputRef = useRef(null);

  const accentColor = '#6C63FF';

  // Fetch initial profile & dashboard data
  useEffect(() => {
    if (!user) return;
    
    setEditForm({
      name: user.name || '',
      phone: user.phone || '',
      department: user.department || '',
      designation: user.designation || '',
      experience: user.experience || '',
      linkedinUrl: user.linkedinUrl || '',
      bio: user.bio || '',
      institutionName: user.institutionName || ''
    });

    setSkills(user.skills || {});

    const loadDashboardData = async () => {
      setLoading(true);
      try {
        if (user.role === 'ADMIN') {
          const res = await analyticsAPI.getAdminAnalytics();
          setStats(res.data);
        } else {
          const res = await analyticsAPI.getFacultyAnalytics(user.id);
          setStats(res.data);
        }

        const notifRes = await notificationAPI.getAll();
        setActivities(notifRes.data || []);

        if (user.role === 'FACULTY') {
          const certRes = await certificateAPI.getMyCertificates(user.id);
          setCertificates(certRes.data || []);
        }
      } catch (err) {
        console.error('Failed to load profile dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  // Profile Save Actions
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const saveToast = toast.loading('Saving changes...');
    try {
      const res = await facultyAPI.update(user.id, editForm);
      updateProfile(res.data.user);
      setIsEditModalOpen(false);
      toast.success('Profile updated successfully!', { id: saveToast });
    } catch (err) {
      toast.error('Failed to update profile', { id: saveToast });
    }
  };

  // Image Upload handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // HTML5 Canvas Center Cropping Helper
  const handleCropAndSave = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.src = imageSrc;
    img.onload = async () => {
      canvas.width = 160;
      canvas.height = 160;
      const size = Math.min(img.width, img.height);
      const startX = (img.width - size) / 2;
      const startY = (img.height - size) / 2;

      ctx.drawImage(img, startX, startY, size, size, 0, 0, 160, 160);
      const croppedBase64 = canvas.toDataURL('image/jpeg', 0.85);
      
      const saveToast = toast.loading('Saving photo...');
      try {
        const res = await facultyAPI.update(user.id, { profilePhoto: croppedBase64 });
        updateProfile(res.data.user);
        setIsCropModalOpen(false);
        setImageSrc(null);
        toast.success('Profile photo updated!', { id: saveToast });
      } catch (err) {
        toast.error('Failed to save image', { id: saveToast });
      }
    };
  };

  // Skill Management
  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    
    const updatedSkills = { ...skills, [newSkillName.trim()]: newSkillScore };
    const saveToast = toast.loading('Adding skill...');
    try {
      const res = await facultyAPI.update(user.id, { skills: updatedSkills });
      updateProfile(res.data.user);
      setSkills(updatedSkills);
      setNewSkillName('');
      setIsAddSkillOpen(false);
      toast.success('Skill added!', { id: saveToast });
    } catch (e) {
      toast.error('Failed to add skill', { id: saveToast });
    }
  };

  const handleRemoveSkill = async (skillKey) => {
    const updatedSkills = { ...skills };
    delete updatedSkills[skillKey];
    
    const saveToast = toast.loading('Removing skill...');
    try {
      const res = await facultyAPI.update(user.id, { skills: updatedSkills });
      updateProfile(res.data.user);
      setSkills(updatedSkills);
      toast.success('Skill removed!', { id: saveToast });
    } catch (e) {
      toast.error('Failed to remove skill', { id: saveToast });
    }
  };

  // Dynamic Password Updates
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setChangingPassword(true);
    const saveToast = toast.loading('Changing password...');
    try {
      await facultyAPI.changePassword(user.id, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      toast.success('Password changed successfully!', { id: saveToast });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password. Double check current password.', { id: saveToast });
    } finally {
      setChangingPassword(false);
    }
  };

  // Two Factor Auth Toggle
  const handle2FAToggle = async (checked) => {
    const saveToast = toast.loading('Updating security setting...');
    try {
      const res = await facultyAPI.update(user.id, { twoFactorEnabled: checked });
      updateProfile(res.data.user);
      toast.success(`2FA ${checked ? 'enabled' : 'disabled'}!`, { id: saveToast });
    } catch (e) {
      toast.error('Failed to update settings', { id: saveToast });
    }
  };

  // Download PDF Certificate trigger
  const handleDownloadCertificate = async (certItem) => {
    const loadToast = toast.loading('Preparing PDF...');
    try {
      const pdf = await generateNativePDF(certItem, user, certItem.templateSettings);
      pdf.save(`Certificate-${certItem.certificateId}.pdf`);
      toast.success('Certificate downloaded!', { id: loadToast });
    } catch (err) {
      toast.error('Failed to generate PDF', { id: loadToast });
    }
  };

  // Dynamic timelines icon resolver
  const getActivityIcon = (type) => {
    switch (type) {
      case 'CERTIFICATE': return <HiOutlineBadgeCheck className="text-emerald-500 text-base" />;
      case 'QUIZ': return <HiOutlineShieldCheck className="text-blue-500 text-base" />;
      case 'ENROLLMENT': return <HiOutlineAcademicCap className="text-purple-500 text-base" />;
      default: return <HiOutlineClock className="text-gray-400 text-base" />;
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 py-6 text-[#1E293B] font-sans selection:bg-indigo-100">
      
      {/* ── TOP SECTION ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Circular avatar box */}
          <div className="relative w-20 h-20 rounded-full border border-gray-200 overflow-hidden bg-gray-50 shrink-0 group">
            {user.profilePhoto ? (
              <img src={user.profilePhoto} alt="Profile Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold bg-[#6C63FF]">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <button 
              onClick={() => fileInputRef.current.click()}
              className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Upload
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>

          {/* User metadata */}
          <div className="text-center md:text-left space-y-2">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">{user.name}</h1>
              <p className="text-xs font-semibold text-[#6C63FF] mt-0.5">
                {user.designation || (user.role === 'ADMIN' ? 'System Administrator' : 'Faculty Member')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 text-xs font-medium text-gray-500">
              <span className="flex items-center gap-1.5 justify-center md:justify-start">
                <HiOutlineMail className="text-gray-400" /> {user.email}
              </span>
              {user.department && (
                <span className="flex items-center gap-1.5 justify-center md:justify-start">
                  <HiOutlineAcademicCap className="text-gray-400" /> {user.department}
                </span>
              )}
              {user.experience !== undefined && (
                <span className="flex items-center gap-1.5 justify-center md:justify-start">
                  <HiOutlineBriefcase className="text-gray-400" /> {user.experience} Years Exp.
                </span>
              )}
            </div>
          </div>
        </div>

        <button 
          onClick={() => setIsEditModalOpen(true)}
          className="px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-xs font-bold text-gray-700 shadow-sm flex items-center gap-1.5 transition-colors shrink-0"
        >
          <HiOutlinePencil /> Edit Profile
        </button>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {user.role === 'ADMIN' && stats ? (
          <>
            {[
              { label: 'FDPs Created', value: stats.totalFdps || 0, icon: HiOutlineAcademicCap },
              { label: 'Active Programs', value: stats.activeFdps || 0, icon: HiOutlineBriefcase },
              { label: 'Certificates Issued', value: stats.totalCertificates || 0, icon: HiOutlineBadgeCheck },
              { label: 'Faculty Joined', value: stats.totalFaculty || 0, icon: HiOutlineUser }
            ].map((card, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{card.label}</p>
                  <p className="text-xl font-bold tracking-tight text-gray-800 mt-1">{card.value}</p>
                </div>
                <card.icon className="text-lg" style={{ color: accentColor }} />
              </div>
            ))}
          </>
        ) : stats ? (
          <>
            {[
              { label: 'FDPs Enrolled', value: stats.totalEnrolled || 0, icon: HiOutlineAcademicCap },
              { label: 'FDPs Completed', value: stats.completed || 0, icon: HiOutlineCheck },
              { label: 'Certificates Earned', value: stats.certificates || 0, icon: HiOutlineBadgeCheck },
              { label: 'Quiz Average', value: `${stats.averageScore || 0}%`, icon: HiOutlineShieldCheck }
            ].map((card, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{card.label}</p>
                  <p className="text-xl font-bold tracking-tight text-gray-800 mt-1">{card.value}</p>
                </div>
                <card.icon className="text-lg" style={{ color: accentColor }} />
              </div>
            ))}
          </>
        ) : (
          <p className="col-span-4 text-center text-xs text-gray-400">Loading metrics...</p>
        )}
      </div>

      {/* ── MAIN LAYOUT WITH SIDEBAR TABS ── */}
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Sidebar Tabs */}
        <div className="w-full md:w-48 shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl p-2 space-y-1 shadow-sm">
            {[
              { id: 'overview', label: 'Overview', icon: HiOutlineUser },
              { id: 'activity', label: 'Activity Feed', icon: HiOutlineClock },
              { id: 'security', label: 'Security Auth', icon: HiOutlineShieldCheck },
              { id: 'settings', label: 'Settings', icon: HiOutlineDesktopComputer }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: activeTab === tab.id ? '#F0EFFF' : 'transparent',
                  color: activeTab === tab.id ? '#6C63FF' : '#475569'
                }}
              >
                <tab.icon className="text-base" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Display Pane */}
        <div className="flex-1 min-w-0">
          
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* About Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">About</h3>
                <p className="text-xs leading-relaxed text-gray-600 font-medium">
                  {user.bio || 'Add a bio using Edit Profile to describe your academic focus, achievements, and research interests.'}
                </p>
              </div>

              {/* Personal Details & Contact */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Info</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Email Address</p>
                    <p className="text-gray-800 mt-1">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Phone Number</p>
                    <p className="text-gray-800 mt-1">{user.phone || 'Not Set'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">LinkedIn URL</p>
                    {user.linkedinUrl ? (
                      <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[#6C63FF] hover:underline block mt-1">{user.linkedinUrl}</a>
                    ) : (
                      <p className="text-gray-800 mt-1">Not Set</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Institution Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Institution Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Affiliation / Organization</p>
                    <p className="text-gray-800 mt-1">{user.institutionName || 'Not Set'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Academic Department</p>
                    <p className="text-gray-800 mt-1">{user.department || 'Not Set'}</p>
                  </div>
                </div>
              </div>

              {/* Skills Progress */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Skills Progress</h3>
                  <button 
                    onClick={() => setIsAddSkillOpen(true)}
                    className="text-xs font-bold text-[#6C63FF] hover:underline flex items-center gap-1"
                  >
                    <HiOutlinePlus /> Add Skill
                  </button>
                </div>

                <div className="space-y-3.5">
                  {Object.entries(skills).map(([key, score]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-medium">
                        <span className="text-gray-700">{key}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-gray-400 text-[11px]">{score}%</span>
                          <button onClick={() => handleRemoveSkill(key)} className="text-red-500 hover:text-red-700">
                            <HiOutlineTrash />
                          </button>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full transition-all duration-300" 
                          style={{ width: `${score}%`, backgroundColor: accentColor }}
                        ></div>
                      </div>
                    </div>
                  ))}

                  {Object.keys(skills).length === 0 && (
                    <p className="text-xs text-gray-400 italic">No custom competencies added yet.</p>
                  )}
                </div>

                {isAddSkillOpen && (
                  <form onSubmit={handleAddSkill} className="border border-gray-150 bg-gray-50 p-4 rounded-lg space-y-3 animate-fade-in text-xs font-medium">
                    <h4 className="text-xs font-bold text-gray-700">Add Skill</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1">Skill Name</label>
                        <input 
                          type="text" 
                          value={newSkillName}
                          onChange={e => setNewSkillName(e.target.value)}
                          className="input-field !py-1" 
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1">Proficiency ({newSkillScore}%)</label>
                        <input 
                          type="range" 
                          min="10" 
                          max="100"
                          value={newSkillScore}
                          onChange={e => setNewSkillScore(parseInt(e.target.value))}
                          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-3"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setIsAddSkillOpen(false)} className="btn-secondary !py-1 px-3">Cancel</button>
                      <button type="submit" className="btn-primary !py-1 px-3" style={{ backgroundColor: accentColor }}>Add</button>
                    </div>
                  </form>
                )}
              </div>

              {/* Earned Certifications (for Faculty) */}
              {user.role === 'FACULTY' && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Earned Certificates</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {certificates.map((cert) => (
                      <div key={cert.id} className="border border-gray-150 rounded-lg p-3 bg-gray-50 flex items-center justify-between gap-3 hover:border-gray-300 transition-colors text-xs font-medium">
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 truncate">{cert.fdpProgram?.title}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{cert.certificateId}</p>
                        </div>
                        <button 
                          onClick={() => handleDownloadCertificate(cert)}
                          className="px-2.5 py-1 bg-white border border-gray-200 text-gray-700 rounded hover:bg-gray-100 flex items-center gap-1 text-[11px]"
                        >
                          <HiOutlineDownload /> PDF
                        </button>
                      </div>
                    ))}
                    {certificates.length === 0 && (
                      <p className="text-xs text-gray-400 italic col-span-2">No certificates generated yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. ACTIVITY TAB */}
          {activeTab === 'activity' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Activity Timeline</h3>
              
              <div className="relative pl-6 border-l border-gray-200 ml-2 space-y-5 py-1">
                {activities.map((act) => (
                  <div key={act.id} className="relative text-xs">
                    <span className="absolute -left-[29px] top-0.5 bg-white border border-gray-300 rounded-full w-4 h-4 flex items-center justify-center">
                      {getActivityIcon(act.type)}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 font-mono">
                      {act.createdAt ? new Date(act.createdAt).toLocaleString('en-IN') : 'Just now'}
                    </span>
                    <p className="font-bold text-gray-800 mt-0.5">{act.title}</p>
                    <p className="text-gray-500 mt-0.5">{act.message}</p>
                  </div>
                ))}

                {activities.length === 0 && (
                  <p className="text-xs text-gray-400 italic">No recent timeline logs found.</p>
                )}
              </div>
            </div>
          )}

          {/* 3. SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              
              {/* Change Password */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Change Password</h3>
                <form onSubmit={handlePasswordChange} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium">
                  <div>
                    <label className="block text-gray-500 mb-1">Current Password</label>
                    <input 
                      type="password" 
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="input-field" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">New Password</label>
                    <input 
                      type="password" 
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="input-field" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={passwordForm.confirmNewPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                      className="input-field" 
                      required
                    />
                  </div>
                  <div className="sm:col-span-3 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={changingPassword}
                      className="px-3.5 py-2 rounded-lg text-white font-bold flex items-center gap-1.5 transition-colors text-xs"
                      style={{ backgroundColor: accentColor }}
                    >
                      <HiOutlineLockClosed /> Update Password
                    </button>
                  </div>
                </form>
              </div>

              {/* Two-Factor Authentication */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between text-xs font-medium">
                  <div>
                    <p className="font-bold text-gray-700">Verify Identity with OTP</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Require a secondary verification code during platform auth login sessions.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={user.twoFactorEnabled || false} 
                      onChange={e => handle2FAToggle(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-8 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#6C63FF]"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 4. SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              
              {/* Login session records */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Login Activity Sessions</h3>
                <div className="divide-y divide-gray-150 border border-gray-150 rounded-lg overflow-hidden text-xs">
                  {[
                    { browser: 'Chrome on Windows 11', location: 'Bengaluru, India (IP: 103.86.177.10)', time: 'Active now' },
                    { browser: 'Vivaldi on Windows 10', location: 'Bengaluru, India (IP: 103.86.177.10)', time: 'May 26, 2026, 04:32 PM' }
                  ].map((session, idx) => (
                    <div key={idx} className="p-3 bg-white flex items-center gap-3 font-medium">
                      <HiOutlineDesktopComputer className="text-gray-400 text-base" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800">{session.browser}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{session.location}</p>
                      </div>
                      <span className={`text-[10px] font-bold shrink-0 ${idx === 0 ? 'text-emerald-500' : 'text-gray-400'}`}>{session.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── AVATAR PHOTO CROP MODAL ── */}
      {isCropModalOpen && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4 border border-gray-150">
            <h3 className="text-sm font-bold text-gray-800">Preview & Save Photo</h3>
            <p className="text-xs text-gray-500">Confirm the cropped square circular preview layout below before persisting changes.</p>
            
            <div className="flex items-center justify-center bg-gray-50 p-6 rounded-lg border border-dashed border-gray-200">
              <div className="overflow-hidden border border-gray-200 shadow-inner w-32 h-32 rounded-full">
                <img src={imageSrc} alt="Crop Preview" className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="flex justify-end gap-3 text-xs pt-2">
              <button 
                type="button" 
                onClick={() => {
                  setIsCropModalOpen(false);
                  setImageSrc(null);
                }} 
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleCropAndSave}
                className="px-3.5 py-2 text-white font-bold rounded-lg flex items-center gap-1"
                style={{ backgroundColor: accentColor }}
              >
                <HiOutlineCheck /> Crop & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT PROFILE DETAILS MODAL ── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <h2 className="text-lg font-bold border-b pb-3">Edit Profile Details</h2>
            
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="input-field" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    className="input-field" 
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Institution Name</label>
                  <input 
                    type="text" 
                    value={editForm.institutionName}
                    onChange={e => setEditForm({ ...editForm, institutionName: e.target.value })}
                    className="input-field" 
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Department</label>
                  <input 
                    type="text" 
                    value={editForm.department}
                    onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                    className="input-field" 
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Designation</label>
                  <input 
                    type="text" 
                    value={editForm.designation}
                    onChange={e => setEditForm({ ...editForm, designation: e.target.value })}
                    className="input-field" 
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Experience (Years)</label>
                  <input 
                    type="number" 
                    value={editForm.experience}
                    onChange={e => setEditForm({ ...editForm, experience: e.target.value })}
                    className="input-field" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-500 mb-1">LinkedIn Profile URL</label>
                  <input 
                    type="text" 
                    value={editForm.linkedinUrl}
                    onChange={e => setEditForm({ ...editForm, linkedinUrl: e.target.value })}
                    className="input-field" 
                    placeholder="https://www.linkedin.com/in/username"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-500 mb-1">Professional Bio</label>
                  <textarea 
                    value={editForm.bio}
                    onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={4}
                    className="input-field" 
                    placeholder="Describe your academic summary..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-white font-bold rounded-lg"
                  style={{ backgroundColor: accentColor }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
