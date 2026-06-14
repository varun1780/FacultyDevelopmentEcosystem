import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineViewGrid, HiOutlineAcademicCap, HiOutlineBookOpen,
  HiOutlineChatAlt2, HiOutlineClipboardCheck, HiOutlineBadgeCheck,
  HiOutlineIdentification, HiOutlineChartBar, HiOutlineUser,
  HiOutlineCog, HiOutlineLogout, HiOutlineX, HiOutlineUsers,
  HiOutlinePlusCircle, HiOutlineDocumentText,
} from 'react-icons/hi';
import { HiSparkles } from 'react-icons/hi2';

const facultyLinks = [
  { to: '/dashboard', icon: HiOutlineViewGrid, label: 'Dashboard' },
  { to: '/my-fdps', icon: HiOutlineAcademicCap, label: 'My FDPs' },
  { to: '/courses', icon: HiOutlineBookOpen, label: 'Browse FDPs' },
  { to: '/ai-mentor', icon: HiOutlineChatAlt2, label: 'AI Mentor' },
  { to: '/assessments', icon: HiOutlineClipboardCheck, label: 'Assessments' },
  { to: '/certificates', icon: HiOutlineBadgeCheck, label: 'Certificates' },
  { to: '/skill-gap', icon: HiOutlineIdentification, label: 'Skill Analysis' },
  { to: '/analytics', icon: HiOutlineChartBar, label: 'Analytics' },
  { to: '/profile', icon: HiOutlineUser, label: 'Profile' },
  { to: '/settings', icon: HiOutlineCog, label: 'Settings' },
];

const adminLinks = [
  { to: '/admin', icon: HiOutlineViewGrid, label: 'Dashboard' },
  { to: '/admin/fdps', icon: HiOutlineAcademicCap, label: 'Manage FDPs' },
  { to: '/admin/create-fdp', icon: HiOutlinePlusCircle, label: 'Create FDP' },
  { to: '/admin/users', icon: HiOutlineUsers, label: 'Manage Users' },
  { to: '/admin/certificates', icon: HiOutlineBadgeCheck, label: 'Certificates' },
  { to: '/admin/certificate-editor', icon: HiOutlineCog, label: 'Cert Templates' },
  { to: '/admin/analytics', icon: HiOutlineChartBar, label: 'Analytics' },
  { to: '/ai-content', icon: HiSparkles, label: 'AI Content' },
  { to: '/admin/reports', icon: HiOutlineDocumentText, label: 'Reports' },
  { to: '/profile', icon: HiOutlineUser, label: 'Profile' },
  { to: '/settings', icon: HiOutlineCog, label: 'Settings' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === 'ADMIN' ? adminLinks : facultyLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`fixed top-0 left-0 z-50 h-screen w-[270px] bg-sidebar flex flex-col transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <HiSparkles className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">AI FDP Hub</h1>
              <p className="text-gray-400 text-[11px]">Faculty Development Platform</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white p-1">
            <HiOutlineX className="text-xl" />
          </button>
        </div>
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name || 'User'}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">{user?.role === 'ADMIN' ? 'Admin' : user?.designation || 'Faculty'}</span>
                {user?.college && (
                  <span className="bg-primary-500/20 text-primary-300 text-[10px] px-1.5 py-0.5 rounded border border-primary-500/30 truncate max-w-[100px]">
                    {user.college.collegeCode || user.college.collegeName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <p className="px-4 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Menu</p>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              end={link.to === '/dashboard' || link.to === '/admin'}
            >
              <link.icon className="text-lg flex-shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:bg-red-500/10 hover:text-red-300">
            <HiOutlineLogout className="text-lg" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
