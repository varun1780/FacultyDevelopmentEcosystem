import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';
import { HiOutlineMenuAlt2, HiOutlineBell, HiOutlineSearch, HiCheck } from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';

export default function Navbar({ onMenuToggle }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // refresh every 15 seconds
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="flex items-center justify-between px-4 lg:px-8 py-3">
        <div className="flex items-center gap-4">
          <button onClick={onMenuToggle} className="lg:hidden text-gray-600 hover:text-gray-900 p-1">
            <HiOutlineMenuAlt2 className="text-xl" />
          </button>
          <div className="hidden sm:flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2 w-72">
            <HiOutlineSearch className="text-gray-400" />
            <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm text-gray-700 w-full placeholder-gray-400" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <HiOutlineBell className="text-xl" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-4 h-4 flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      <HiCheck /> Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-400">
                      <HiOutlineBell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No new notifications</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                          className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                            !notif.isRead ? 'bg-primary-50/30' : ''
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <p className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                {notif.message}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-2 font-medium">
                                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                            {!notif.isRead && (
                              <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold text-xs">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-700">{user?.name}</p>
              <p className="text-[11px] text-gray-400">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
