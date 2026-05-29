import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { certificateAPI, enrollmentAPI } from '../services/api';
import { HiOutlineBadgeCheck, HiOutlineDownload, HiOutlineExternalLink } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { generateNativePDF } from '../utils/pdfGenerator';

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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
        {/* Certificate container scaling */}
        <div className="flex items-center justify-center overflow-x-auto bg-gray-900/10 p-2 rounded-2xl">
          <div 
            id="issued-certificate-canvas" 
            className={`w-[794px] h-[561px] p-12 flex flex-col justify-between relative ${fontClass}`}
            style={{
              background: template.backgroundUrl 
                ? `url(${template.backgroundUrl}) no-repeat center center/cover` 
                : 'linear-gradient(180deg, #fffdf8 0%, #fff9ee 100%)',
              border: getBorderStyle(),
              color: template.textColor,
            }}
          >
            {/* Corner decorations */}
            <div className="absolute top-2 left-2 w-14 h-14 border-t-2 border-l-2 opacity-30" style={{ borderColor: template.primaryColor }}></div>
            <div className="absolute top-2 right-2 w-14 h-14 border-t-2 border-r-2 opacity-30" style={{ borderColor: template.primaryColor }}></div>
            <div className="absolute bottom-2 left-2 w-14 h-14 border-b-2 border-l-2 opacity-30" style={{ borderColor: template.primaryColor }}></div>
            <div className="absolute bottom-2 right-2 w-14 h-14 border-b-2 border-r-2 opacity-30" style={{ borderColor: template.primaryColor }}></div>

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-4">
                <img 
                  src={template.logoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%237c3aed"><path d="M12 2L1 7l11 5 9-4.09V14a1 1 0 0 0 2 0V7.91L23 7M4.73 14a9 9 0 0 0 14.54 0"/></svg>`} 
                  alt="Logo" 
                  className="w-14 h-14 object-contain" 
                />
                <div className="text-left">
                  <h2 className="text-lg font-bold tracking-wide uppercase leading-tight">{template.collegeName}</h2>
                  <p className="text-xs opacity-75 font-medium">{template.departmentName}</p>
                </div>
              </div>
              <div className="w-28 h-0.5 mx-auto my-3" style={{ background: `linear-gradient(90deg, ${template.primaryColor}, ${template.secondaryColor})` }}></div>
            </div>

            {/* Title */}
            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: template.primaryColor }}>CERTIFICATE OF COMPLETION</span>
              <h1 className="text-2xl font-bold tracking-wide">Faculty Development Platform</h1>
            </div>

            {/* Body */}
            <div className="text-center px-8 my-2">
              <p 
                className="text-sm leading-relaxed" 
                dangerouslySetInnerHTML={{ __html: getFormattedText() }}
              />
            </div>

            {/* Verification & IDs */}
            <div className="grid grid-cols-3 items-end gap-2 text-center text-[10px]">
              <div className="text-left pl-4 space-y-1">
                <p className="opacity-50 text-[8px] uppercase tracking-wider">Date Issued</p>
                <p className="font-semibold">{issuedDate}</p>
                <p className="opacity-50 text-[8px] uppercase tracking-wider mt-1">Certificate ID</p>
                <p className="font-mono font-bold" style={{ color: template.primaryColor }}>{cert.certificateId}</p>
              </div>

              {/* QR verification */}
              <div className="flex flex-col items-center justify-center">
                {template.enableQr ? (
                  <div className="p-1 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <QRCodeSVG value={`http://localhost:5173/verify-certificate/${cert.certificateId}`} size={54} />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gray-150 rounded border border-dashed flex items-center justify-center text-[8px] text-gray-400">QR disabled</div>
                )}
                <span className="text-[8px] mt-1 opacity-50">Scan to Verify</span>
              </div>

              <div className="text-right pr-4 space-y-1">
                <p className="opacity-50 text-[8px] uppercase tracking-wider">Blockchain Ledger</p>
                <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[8px] font-bold border border-emerald-100">
                  {cert.isOnChain ? 'On Chain' : 'Verified'}
                </span>
                {cert.txHash && (
                  <span className="block text-[8px] font-mono text-primary-500 truncate mt-1">{cert.txHash.substring(0, 16)}...</span>
                )}
              </div>
            </div>

            {/* Signatures */}
            <div className="border-t border-gray-150 pt-4 grid grid-cols-3 gap-2 text-center">
              <div className="flex flex-col items-center justify-end">
                {template.principalSignatureUrl ? (
                  <img src={template.principalSignatureUrl} alt="Principal Signature" className="h-8 object-contain" />
                ) : (
                  <div className="h-6 w-16 border-b border-dashed border-gray-300 mb-1"></div>
                )}
                <p className="text-[9px] font-semibold opacity-85">Principal</p>
              </div>
              <div className="flex flex-col items-center justify-end">
                {template.hodSignatureUrl ? (
                  <img src={template.hodSignatureUrl} alt="HOD Signature" className="h-8 object-contain" />
                ) : (
                  <div className="h-6 w-16 border-b border-dashed border-gray-300 mb-1"></div>
                )}
                <p className="text-[9px] font-semibold opacity-85">Head of Dept.</p>
              </div>
              <div className="flex flex-col items-center justify-end">
                {template.coordinatorSignatureUrl ? (
                  <img src={template.coordinatorSignatureUrl} alt="Coordinator Signature" className="h-8 object-contain" />
                ) : (
                  <div className="h-6 w-16 border-b border-dashed border-gray-300 mb-1"></div>
                )}
                <p className="text-[9px] font-semibold opacity-85">FDP Coordinator</p>
              </div>
            </div>

          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-3 mt-4">
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

  // Auto-issue certificate for completed enrollments that don't have one yet
  const issueCertificate = async (enrollment) => {
    setIssuing(enrollment.id);
    try {
      const res = await certificateAPI.issue(user.id, enrollment.fdpProgram?.id);
      toast.success(`Certificate issued: ${res.data.certificateId}`);
      // Reload certificates
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

  // Find completed enrollments without certificates
  const completedWithoutCert = enrollments.filter(e => {
    const isComplete = e.isCompleted || e.progressPercentage >= 100;
    const hasCert = certs.some(c => c.fdpProgram?.id === e.fdpProgram?.id);
    const passedQuiz = e.quizScore >= (e.fdpProgram?.passingScore || 60);
    return isComplete && passedQuiz && !hasCert;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="page-title">My Certificates</h1>

      {/* Eligible for Certificate */}
      {completedWithoutCert.length > 0 && (
        <div className="card p-5 border-2 border-primary-200 bg-primary-50/30">
          <h3 className="font-bold text-primary-700 mb-3 flex items-center gap-2">
            🎓 Ready to Generate
          </h3>
          <p className="text-sm text-gray-600 mb-4">You've completed these FDPs and passed the assessment. Generate your certificate!</p>
          <div className="space-y-3">
            {completedWithoutCert.map(e => (
              <div key={e.id} className="flex items-center justify-between bg-white rounded-xl p-4 border border-primary-100">
                <div>
                  <p className="font-semibold text-gray-800">{e.fdpProgram?.title}</p>
                  <p className="text-xs text-gray-500">Score: {e.quizScore}% • Progress: {e.progressPercentage}%</p>
                </div>
                <button onClick={() => issueCertificate(e)} disabled={issuing === e.id}
                  className="btn-primary text-sm !py-2 flex items-center gap-1">
                  {issuing === e.id ? 'Generating...' : '🏆 Generate Certificate'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Certificates */}
      {certs.length === 0 && completedWithoutCert.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <HiOutlineBadgeCheck className="text-5xl mx-auto mb-3" />
          <p className="font-medium">No certificates yet</p>
          <p className="text-sm mt-1">Complete an FDP course and pass the assessment to earn your certificate</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certs.map((c, i) => (
            <div key={i} className="card p-6 hover:shadow-lg transition-all cursor-pointer group" onClick={() => setViewingCert(c)}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                  <HiOutlineBadgeCheck className="text-white text-xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{c.fdpProgram?.title}</p>
                  <p className="text-xs text-gray-500 font-mono">{c.certificateId}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Hash: <span className="font-mono text-xs">{c.certificateHash?.substring(0, 24)}...</span></p>
                <p>Status: <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${c.isOnChain ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{c.isOnChain ? '✓ On Blockchain' : '⏳ Pending'}</span></p>
                {c.txHash && <p>TX: <span className="font-mono text-xs text-primary-600">{c.txHash.substring(0, 24)}...</span></p>}
                {c.issuedAt && <p className="text-xs text-gray-400">Issued: {new Date(c.issuedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-primary-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <HiOutlineExternalLink className="w-4 h-4" /> View Certificate
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Certificate Viewer Modal */}
      {viewingCert && <CertificateView cert={viewingCert} user={user} onClose={() => setViewingCert(null)} />}
    </div>
  );
}
