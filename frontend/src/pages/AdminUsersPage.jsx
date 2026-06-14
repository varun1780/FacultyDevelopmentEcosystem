import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminUsersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiSearch, HiUserGroup, HiExclamationCircle } from 'react-icons/hi';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const collegeName = user?.college?.collegeName || user?.college?.collegeCode || 'Institution';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  useEffect(() => { load(); }, []);

  const load = () => {
    setLoading(true);
    setError(null);
    adminUsersAPI.getAll()
      .then(r => {
        setUsers(Array.isArray(r.data) ? r.data : []);
      })
      .catch(err => {
        console.error('Failed to load users:', err);
        setError(err.response?.status === 403
          ? 'Access denied. Admin privileges required.'
          : 'Failed to load users. Make sure the backend is running.');
      })
      .finally(() => setLoading(false));
  };

  const handleStatusToggle = async (id, currentStatus) => {
    try {
      const newStatus = (!currentStatus || currentStatus === 'ACTIVE') ? 'INACTIVE' : 'ACTIVE';
      await adminUsersAPI.updateStatus(id, newStatus);
      toast.success('Status updated');
      load();
    }
    catch { toast.error('Failed to update status'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try { await adminUsersAPI.delete(id); toast.success('User deleted'); load(); }
    catch { toast.error('Failed to delete user'); }
  };

  /* LOADING STATE */
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Loading users from database...</p>
      </div>
    </div>
  );

  /* ERROR STATE */
  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="card p-8 text-center max-w-md">
        <HiExclamationCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-800 mb-2">Could not load users</h3>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button onClick={load} className="btn-primary text-sm">Retry</button>
      </div>
    </div>
  );

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.name || '').toLowerCase().includes(search.toLowerCase())
      || (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <HiUserGroup className="text-primary-500" /> {collegeName} Users
            <span className="text-sm font-normal text-gray-400 ml-2">({users.length} total)</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage administrators and faculty within your institution</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none w-full sm:w-64"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="FACULTY">Faculty</option>
          </select>
        </div>
      </div>

      {/* EMPTY STATE */}
      {filteredUsers.length === 0 ? (
        <div className="card p-12 text-center">
          <HiUserGroup className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No users found</p>
          <p className="text-sm text-gray-400 mt-1">
            {search || roleFilter !== 'ALL' ? 'Try adjusting your search or filter.' : 'No users have registered yet.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  {['Name', 'Email', 'Role', 'Stats', 'Status', 'Joined', 'Actions'].map(h =>
                    <th key={h} className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(u.name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          {u.department && <p className="text-xs text-gray-400">{u.department}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{u.email}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {u.role === 'FACULTY' ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-600"><strong>{u.fdpCount || 0}</strong> FDPs</span>
                          <span className="text-xs text-emerald-600"><strong>{u.certificateCount || 0}</strong> Certs</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${(!u.status || u.status === 'ACTIVE') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {u.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleStatusToggle(u.id, u.status)}
                          className={`text-xs font-medium ${u.role === 'ADMIN' ? 'text-gray-300 cursor-not-allowed' : (!u.status || u.status === 'ACTIVE') ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}`}
                          disabled={u.role === 'ADMIN'}
                        >
                          {(!u.status || u.status === 'ACTIVE') ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className={`text-xs font-medium ${u.role === 'ADMIN' ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:text-red-700'}`}
                          disabled={u.role === 'ADMIN'}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
