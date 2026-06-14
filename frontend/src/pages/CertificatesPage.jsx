import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { certificateAPI, enrollmentAPI } from '../services/api';
import { 
  HiOutlineDownload, HiOutlineX, HiOutlineEye, 
  HiOutlineFilter, HiOutlineSearch, HiOutlineAcademicCap,
  HiOutlineBadgeCheck, HiOutlineExternalLink, HiOutlineOfficeBuilding
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { generateNativePDF } from '../utils/pdfGenerator';
import { getCertificateStatusBadge } from '../utils/statusHelper';
import CertificateTemplate from '../components/CertificateTemplate';

/* Visual certificate component rendered as styled HTML for printing/download */
function CertificateView({ cert, user, onClose }) {
  const certRef = useRef(null);

  // Parse template settings from snapshot
  let template = {
    collegeName: 'National Institute of Technology',
    departmentName: 'Department of Computer Science & Engineering',
    logoUrl: '',
    principalSignatureUrl: '',
    hodSignatureUrl: '',
    coordinatorSignatureUrl: '',
    borderStyle: 'double', // double, solid, floral, none
    fontFamily: 'serif', // serif, sans-serif, monospace
    primaryColor: '#7c3aed',
    secondaryColor: '#a78bfa',
    textColor: '#1a1a2e',
    certificateText: 'This is to certify that **{{facultyName}}**\nhas successfully completed the Faculty Development Program on\n**{{courseName}}**\nand achieved an assessment score of **{{score}}%**.',
    footerText: 'Verified via AI FDP Hub Registry Ledger.',
    enableBlockchain: false,
    enableQr: true,
  };

  if (cert.templateSettings) {
    try {
      const parsed = JSON.parse(cert.templateSettings);
      template = { ...template, ...parsed };
    } catch (e) {
      console.error('Failed to parse certificate templateSettings:', e);
    }
  }

  const printCertificate = async () => {
    const loadToast = toast.loading('Generating high-resolution native PDF...');
    try {
      const pdf = await generateNativePDF(cert, user, cert.templateSettings);
      pdf.save(`Certificate-${cert.certificateId}.pdf`);
      toast.success('Certificate downloaded successfully!', { id: loadToast });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF. Falling back to print window.', { id: loadToast });
      window.print();
    }
  };

  const issuedDate = cert.issuedAt 
    ? new Date(cert.issuedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) 
    : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  // Format templates variables
  const getFormattedText = () => {
    if (!template.certificateText) return '';
    let text = template.certificateText
      .replace(/\{\{facultyName\}\}/g, cert.user?.name || user?.name || 'Faculty Member')
      .replace(/\{\{courseName\}\}/g, cert.fdpProgram?.title || 'Faculty Development Program')
      .replace(/\{\{completionDate\}\}/g, issuedDate)
      .replace(/\{\{score\}\}/g, cert.quizScore || '80')
      .replace(/\{\{certificateId\}\}/g, cert.certificateId || 'N/A')
      .replace(/\{\{instructorName\}\}/g, cert.fdpProgram?.instructorName || 'FDP Instructor');

    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  const getBorderStyle = () => {
    switch (template.borderStyle) {
      case 'double':
        return `8px double ${template.primaryColor}`;
      case 'solid':
        return `4px solid ${template.primaryColor}`;
      case 'floral':
        return `6px dashed ${template.secondaryColor}`;
      case 'none':
      default:
        return 'none';
    }
  };

  const fontClass = template.fontFamily === 'serif' 
    ? 'font-serif' 
    : template.fontFamily === 'monospace' 
      ? 'font-mono' 
      : 'font-sans';

  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth - 16;
        const newScale = Math.min(0.9, containerWidth / 1123);
        setScale(newScale);
      }
    };
    const timer = setTimeout(updateScale, 100);
    window.addEventListener('resize', updateScale);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full flex flex-col items-center gap-4"
        style={{ maxWidth: '95vw', maxHeight: '95vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Certificate scroll wrapper */}
        <div
          ref={containerRef}
          className="certificate-preview bg-gray-900/10 p-2 rounded-2xl border-2 border-white/10 shadow-2xl overflow-visible"
          style={{ width: '100%', maxWidth: '1150px' }}
        >
          {/* Spacer approach: container naturally sizes to scaled height */}
          <div
            style={{
              position: 'relative',
              width: `${1123 * scale}px`,
              height: `${794 * scale}px`,
              margin: '0 auto',
              overflow: 'visible',
            }}
          >
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                width: '1123px',
                height: '794px',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            >
              <CertificateTemplate cert={cert} user={user} templateSettings={cert.templateSettings} />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-3">
          <button onClick={printCertificate} className="px-5 py-2.5 bg-white text-gray-800 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-gray-100 transition-all shadow border border-gray-150">
            <HiOutlineDownload className="w-4 h-4" /> Download PDF Certificate
          </button>
          <button onClick={onClose} className="px-5 py-2.5 bg-white/20 text-white rounded-xl text-sm font-medium hover:bg-white/30 transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CertificatesPage() {
  const { user } = useAuth();
  const [certs, setCerts] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingCert, setViewingCert] = useState(null);
  const [issuing, setIssuing] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [institutionFilter, setInstitutionFilter] = useState('All');

  useEffect(() => {
    Promise.all([
      certificateAPI.getMyCertificates(user.id),
      enrollmentAPI.getMyEnrollments(user.id),
    ]).then(([certRes, enrollRes]) => {
      const fetchedCerts = certRes.data || [];
      const fetchedEnrollments = enrollRes.data || [];
      const certsWithScore = fetchedCerts.map(c => {
        const matchingEnrollment = fetchedEnrollments.find(e => e.fdpProgram?.id === c.fdpProgram?.id);
        return {
          ...c,
          quizScore: matchingEnrollment ? matchingEnrollment.quizScore : 80
        };
      });
      setCerts(certsWithScore);
      setEnrollments(fetchedEnrollments);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const issueCertificate = async (enrollment) => {
    setIssuing(enrollment.id);
    try {
      const res = await certificateAPI.issue(user.id, enrollment.fdpProgram?.id);
      toast.success(`Certificate issued: ${res.data.certificateId}`);
      const certRes = await certificateAPI.getMyCertificates(user.id);
      const fetchedCerts = certRes.data || [];
      const certsWithScore = fetchedCerts.map(c => {
        const matchingEnrollment = enrollments.find(e => e.fdpProgram?.id === c.fdpProgram?.id);
        return {
          ...c,
          quizScore: matchingEnrollment ? matchingEnrollment.quizScore : 80
        };
      });
      setCerts(certsWithScore);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to issue certificate');
    }
    setIssuing(null);
  };

  const handleDownload = async (cert, e) => {
    e.stopPropagation();
    const loadToast = toast.loading('Generating PDF...');
    try {
      const pdf = await generateNativePDF(cert, user, cert.templateSettings);
      pdf.save(`Certificate-${cert.certificateId}.pdf`);
      toast.success('Downloaded successfully!', { id: loadToast });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF', { id: loadToast });
    }
  };

  const completedWithoutCert = enrollments.filter(e => {
    const isComplete = e.isCompleted || e.progressPercentage >= 100;
    const hasCert = certs.some(c => c.fdpProgram?.id === e.fdpProgram?.id);
    const passedQuiz = e.quizScore >= (e.fdpProgram?.passingScore || 60);
    return isComplete && passedQuiz && !hasCert;
  });

  const institutions = [...new Set(certs.map(c => c.college?.collegeName || 'Global Platform'))];

  const filteredGroupedCerts = certs.reduce((acc, cert) => {
    const college = cert.college || cert.fdpProgram?.college;
    const collegeId = college ? college.id : 'global';
    const collegeName = college ? college.collegeName : 'Global Platform';
    const logo = college ? college.logo : null;
    const code = college ? college.collegeCode : 'GLOBAL';

    if (institutionFilter !== 'All' && collegeName !== institutionFilter) return acc;
    if (statusFilter === 'On-Chain' && !cert.isOnChain) return acc;
    if (statusFilter === 'Pending' && cert.status?.toUpperCase() !== 'PENDING') return acc;
    if (statusFilter === 'Issued' && cert.status?.toUpperCase() !== 'ISSUED' && cert.status?.toUpperCase() !== 'VERIFYING') return acc;
    if (searchTerm && !cert.fdpProgram?.title?.toLowerCase().includes(searchTerm.toLowerCase())) return acc;

    if (!acc[collegeId]) {
      acc[collegeId] = { collegeName, logo, code, certificates: [] };
    }
    acc[collegeId].certificates.push(cert);
    return acc;
  }, {});

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <HiOutlineBadgeCheck className="text-primary-600 w-8 h-8" />
            My Certificates
          </h1>
          <p className="text-gray-500 mt-2">Manage and verify your FDP completion certificates across institutions.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-auto">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search FDP title..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none w-full sm:w-48 text-sm transition-all"
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <HiOutlineOfficeBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select 
              value={institutionFilter}
              onChange={(e) => setInstitutionFilter(e.target.value)}
              className="pl-9 pr-8 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none appearance-none bg-white text-sm w-full"
            >
              <option value="All">All Institutions</option>
              {institutions.map(inst => <option key={inst} value={inst}>{inst}</option>)}
            </select>
          </div>
          <div className="relative w-full sm:w-auto">
            <HiOutlineFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field max-w-[150px] !py-2 !text-sm">
              <option value="All">All Status</option>
              <option value="On-Chain">Blockchain Verified</option>
              <option value="Issued">Issued</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {completedWithoutCert.length > 0 && (
        <div className="p-6 border border-primary-200 bg-gradient-to-br from-primary-50 to-white rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-primary-800 mb-2 flex items-center gap-2">🎓 Ready to Generate</h3>
          <p className="text-sm text-gray-600 mb-5">You've completed these FDPs and passed the assessment. Generate your certificate!</p>
          <div className="grid gap-3">
            {completedWithoutCert.map(e => (
              <div key={e.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-primary-100/50 gap-4">
                <div>
                  <p className="font-bold text-gray-800">{e.fdpProgram?.title}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                    <span className="font-medium bg-gray-100 px-2 py-0.5 rounded">Score: {e.quizScore}%</span>
                    <span className="font-medium bg-gray-100 px-2 py-0.5 rounded">Progress: {e.progressPercentage}%</span>
                    {e.fdpProgram?.college && <span className="text-primary-600 font-medium ml-1">@{e.fdpProgram.college.collegeCode}</span>}
                  </p>
                </div>
                <button onClick={() => issueCertificate(e)} disabled={issuing === e.id}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
                  {issuing === e.id ? 'Generating...' : '🏆 Generate Certificate'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(filteredGroupedCerts).length === 0 && completedWithoutCert.length === 0 ? (
        <div className="text-center py-20 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <HiOutlineBadgeCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No certificates found</h3>
          <p className="text-sm text-gray-500">No certificates match your filters or you haven't earned any yet.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.values(filteredGroupedCerts).map((group, idx) => (
            <div key={idx} className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-lg bg-white border border-gray-150 shadow-sm p-1.5 flex flex-shrink-0 items-center justify-center">
                  {group.logo ? (
                    <img src={group.logo} alt={group.code} className="w-full h-full object-contain" />
                  ) : (
                    <HiOutlineOfficeBuilding className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{group.collegeName}</h2>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 font-medium">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{group.code}</span>
                    <span>•</span>
                    <span>{group.certificates.length} Certificate{group.certificates.length > 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {group.certificates.map((c, i) => (
                  <div key={i} className="group bg-white rounded-2xl p-5 border border-gray-150 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col h-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative z-10 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white shadow-inner">
                          <HiOutlineBadgeCheck className="w-6 h-6" />
                        </div>
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getCertificateStatusBadge(c).color}`}>
                          {getCertificateStatusBadge(c).label}
                        </span>
                      </div>
                      
                      <div className="mb-4 flex-1">
                        <h4 className="font-bold text-gray-900 leading-snug line-clamp-2" title={c.fdpProgram?.title}>{c.fdpProgram?.title}</h4>
                        <p className="text-xs text-gray-500 font-mono mt-1" title={c.certificateId}>ID: {c.certificateId}</p>
                      </div>
                      
                      <div className="space-y-2 mb-5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Issued to</span>
                          <span className="font-semibold text-gray-800">{user.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Institution</span>
                          <span className="font-semibold text-gray-800 truncate max-w-[120px]">{group.collegeName}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Date</span>
                          <span className="font-medium text-gray-700">
                            {c.issuedAt ? new Date(c.issuedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                          </span>
                        </div>
                        {c.certificateHash && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Hash</span>
                            <span className="font-mono text-gray-500 truncate max-w-[120px]" title={c.certificateHash}>{c.certificateHash}</span>
                          </div>
                        )}
                        {c.txHash && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Ledger TX</span>
                            <span className="font-mono text-primary-600 truncate max-w-[120px]" title={c.txHash}>{c.txHash}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100 mt-auto">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setViewingCert(c); }}
                          className="py-2 flex justify-center items-center gap-1 text-[11px] font-bold text-primary-700 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
                        >
                          <HiOutlineExternalLink className="w-3.5 h-3.5" /> View
                        </button>
                        <button 
                          onClick={(e) => handleDownload(c, e)}
                          className="py-2 flex justify-center items-center gap-1 text-[11px] font-bold text-secondary-700 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors"
                        >
                          <HiOutlineDownload className="w-3.5 h-3.5" /> PDF
                        </button>
                        <a 
                          href={`/verify-certificate/${c.certificateId}`}
                          target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="py-2 flex justify-center items-center gap-1 text-[11px] font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-colors"
                        >
                          Verify
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingCert && <CertificateView cert={viewingCert} user={user} onClose={() => setViewingCert(null)} />}
    </div>
  );
}
