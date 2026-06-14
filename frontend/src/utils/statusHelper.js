export const getCertificateStatusBadge = (cert) => {
  if (!cert) return { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  if (cert.isOnChain) return { label: 'Blockchain Verified', color: 'bg-purple-100 text-purple-700 border-purple-200' };
  const status = (cert.status || '').toUpperCase();
  if (status === 'ISSUED') return { label: 'Issued', color: 'bg-green-100 text-green-700 border-green-200' };
  if (status === 'VERIFYING') return { label: 'Verifying', color: 'bg-blue-100 text-blue-700 border-blue-200' };
  return { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
};
