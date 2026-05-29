import { useState, useEffect } from 'react';
import { certificateAPI } from '../services/api';
import { HiOutlineBadgeCheck } from 'react-icons/hi';

export default function AdminCertificatesPage() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get all certificates (admin view)
    certificateAPI.getMyCertificates(0).then(r => setCerts(r.data || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="page-title">Certificate Management</h1>
      {certs.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><HiOutlineBadgeCheck className="text-5xl mx-auto mb-3" /><p>No certificates issued yet</p></div>
      ) : (
        <div className="card overflow-hidden"><table className="w-full text-sm"><thead className="bg-gray-50"><tr>{['Certificate ID', 'Faculty', 'FDP', 'Status', 'TX Hash'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{certs.map((c, i) => (
          <tr key={i} className="hover:bg-gray-50"><td className="px-4 py-3 font-mono text-xs">{c.certificateId}</td><td className="px-4 py-3">{c.user?.name}</td><td className="px-4 py-3">{c.fdpProgram?.title}</td><td className="px-4 py-3"><span className={`badge-${c.isOnChain ? 'success' : 'warning'}`}>{c.isOnChain ? 'On-Chain' : 'Pending'}</span></td><td className="px-4 py-3 font-mono text-xs">{c.txHash?.substring(0, 16)}...</td></tr>
        ))}</tbody></table></div>
      )}
    </div>
  );
}
