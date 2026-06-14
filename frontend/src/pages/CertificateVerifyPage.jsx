import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { certificateAPI } from '../services/api';
import { 
  HiOutlineSearch, HiOutlineShieldCheck, HiOutlineExclamation, 
  HiOutlineDownload, HiOutlineArrowLeft, 
  HiOutlineGlobeAlt, HiOutlineClipboardCopy
} from 'react-icons/hi';
import { HiSparkles } from 'react-icons/hi2';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { generateNativePDF } from '../utils/pdfGenerator';
import CertificateTemplate from '../components/CertificateTemplate';

export default function CertificateVerifyPage() {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const [certId, setCertId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth - 24;
        const newScale = Math.min(0.85, containerWidth / 1123);
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

  const verifyCertificateId = async (id) => {
    if (!id.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await certificateAPI.verify(id.trim());
      setResult(res.data);
      if (res.data.isValid) {
        toast.success('Certificate details verified successfully!');
      } else {
        toast.error(res.data.message || 'Invalid Certificate ID');
      }
    } catch (err) {
      setResult({ isValid: false, message: 'Certificate not found or verification failed' });
      toast.error('Certificate not found or verification failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (certificateId) {
      setCertId(certificateId);
      verifyCertificateId(certificateId);
    }
  }, [certificateId]);

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    if (certId.trim()) {
      if (certificateId) {
        navigate(`/verify-certificate/${certId.trim()}`);
      } else {
        verifyCertificateId(certId.trim());
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Hash copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const printCertificate = async () => {
    const loadToast = toast.loading('Generating high-resolution native PDF...');
    try {
      const pdf = await generateNativePDF(result, result.user, result.templateSettings);
      pdf.save(`Certificate-${result.certificateId}.pdf`);
      toast.success('Certificate downloaded successfully!', { id: loadToast });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF. Please try printing manually.', { id: loadToast });
      window.print();
    }
  };

  // Parsing settings
  let template = {
    collegeName: 'National Institute of Technology',
    departmentName: 'Department of Computer Science & Engineering',
    logoUrl: '',
    principalSignatureUrl: '',
    hodSignatureUrl: '',
    coordinatorSignatureUrl: '',
    borderStyle: 'double',
    fontFamily: 'serif',
    primaryColor: '#7c3aed',
    secondaryColor: '#a78bfa',
    textColor: '#1a1a2e',
    certificateText: 'This is to certify that **{{facultyName}}**\nhas successfully completed the Faculty Development Program on\n**{{courseName}}**\nand achieved an assessment score of **{{score}}%**.',
    footerText: 'Verified via AI FDP Hub Registry Ledger.',
    enableBlockchain: false,
    enableQr: true,
  };

  if (result && result.templateSettings) {
    try {
      const parsed = JSON.parse(result.templateSettings);
      template = { ...template, ...parsed };
    } catch (e) {
      console.error('Failed to parse certificate templateSettings:', e);
    }
  }

  const issuedDate = result && result.issuedAt 
    ? new Date(result.issuedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) 
    : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  const getFormattedText = () => {
    if (!result || !template.certificateText) return '';
    let text = template.certificateText
      .replace(/\{\{facultyName\}\}/g, result.facultyName || 'Faculty Member')
      .replace(/\{\{courseName\}\}/g, result.fdpName || 'Faculty Development Program')
      .replace(/\{\{completionDate\}\}/g, issuedDate)
      .replace(/\{\{score\}\}/g, result.quizScore || '80')
      .replace(/\{\{certificateId\}\}/g, result.certificateId || 'N/A')
      .replace(/\{\{instructorName\}\}/g, result.instructorName || 'FDP Instructor');

    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  const getBorderStyle = () => {
    switch (template.borderStyle) {
      case 'double':
        return `8px double ${template.primaryColor || '#7c3aed'}`;
      case 'solid':
        return `4px solid ${template.primaryColor || '#7c3aed'}`;
      case 'floral':
        return `6px dashed ${template.primaryColor || '#7c3aed'}`;
      case 'none':
      default:
        return 'none';
    }
  };

  const fontClass = template.certificateTemplate === 'Modern Template'
    ? 'font-sans'
    : template.certificateTemplate === 'Blockchain Style'
      ? 'font-mono'
      : 'font-serif';

  const isDarkTheme = template.certificateTemplate === 'Blockchain Style';
  const canvasBg = isDarkTheme
    ? 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)'
    : template.backgroundUrl
      ? `url(${template.backgroundUrl}) no-repeat center center/cover`
      : 'linear-gradient(180deg, #fffdf8 0%, #fff9ee 100%)';
  const canvasTextColor = isDarkTheme ? '#cbd5e1' : (template.textColor || '#1a1a2e');

  const previewCert = result ? {
    certificateId: result.certificateId,
    issuedAt: result.issuedAt,
    quizScore: result.quizScore,
    fdpProgram: { title: result.fdpName, instructorName: result.instructorName },
    isOnChain: result.isOnChain,
    txHash: result.txHash,
    status: 'VERIFIED'
  } : null;

  const previewUser = result ? {
    name: result.facultyName
  } : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-10 px-4">
      <div className="w-full max-w-4xl space-y-6">
        
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-200 pb-6">
          <div className="flex items-center gap-3">
            <Link to="/login" className="w-9 h-9 rounded-xl bg-white border border-gray-250 hover:bg-gray-50 transition-colors flex items-center justify-center text-gray-500 shadow-sm">
              <HiOutlineArrowLeft className="text-lg" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center shadow-sm">
                  <HiSparkles className="text-white text-sm" />
                </div>
                <h1 className="text-lg font-extrabold tracking-tight text-gray-900">AI FDP Hub</h1>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Academic Certificate Registry & Ledger Verification</p>
            </div>
          </div>
          <Link to="/login" className="btn-secondary !py-2 !px-4 text-xs font-semibold">
            Sign In to Dashboard
          </Link>
        </div>

        {/* Verification Search Card */}
        <div className="card p-6 md:p-8">
          <div className="max-w-xl mx-auto text-center space-y-2 mb-6">
            <h2 className="text-xl font-bold text-gray-800">Verify Certification Credentials</h2>
            <p className="text-gray-500 text-xs leading-relaxed">
              Every certificate issued through the Faculty Development Platform is cryptographically hashed, optionally registered to our private Ethereum ledger node, and publicly verifiable.
            </p>
          </div>

          <form onSubmit={handleVerifySubmit} className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
              <input 
                id="verify-cert-id" 
                value={certId} 
                onChange={(e) => setCertId(e.target.value)} 
                placeholder="Enter Certificate ID (e.g., CERT-XXXXXXXX)" 
                className="input-field !pl-10 !py-2.5 text-sm" 
                required 
              />
            </div>
            <button 
              id="verify-submit" 
              type="submit" 
              disabled={loading} 
              className="btn-primary !px-8 !py-2.5 text-sm font-semibold shrink-0 flex items-center justify-center"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify Status'}
            </button>
          </form>
        </div>

        {/* Verification Results Panel */}
        {result && (
          <div className={`space-y-6 animate-slide-up`}>
            
            {/* Status Alert Banner */}
            <div className={`card border-l-4 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              result.isValid 
                ? 'bg-emerald-50/50 border-emerald-500 border-gray-150' 
                : 'bg-red-50/50 border-red-500 border-gray-150'
            }`}>
              <div className="flex gap-3">
                {result.isValid ? (
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
                    <HiOutlineShieldCheck className="text-2xl" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0 shadow-sm">
                    <HiOutlineExclamation className="text-2xl" />
                  </div>
                )}
                <div>
                  <h3 className={`font-bold text-sm ${result.isValid ? 'text-emerald-800' : 'text-red-800'}`}>
                    {result.isValid ? '✓ Authentic Credentials Verified' : '✗ Verification Failed'}
                  </h3>
                  <p className={`text-xs mt-1 ${result.isValid ? 'text-emerald-600' : 'text-red-600'}`}>
                    {result.isValid 
                      ? `This certificate is valid, authentic, and registered under ID: ${result.certificateId}`
                      : result.message || 'The requested certificate ID was not found in the registrar registry.'
                    }
                  </p>
                </div>
              </div>

              {result.isValid && (
                <button 
                  onClick={printCertificate} 
                  className="btn-primary !py-2 !px-4 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <HiOutlineDownload className="text-sm" /> Download PDF
                </button>
              )}
            </div>

            {result.isValid && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Meta details column */}
                <div className="lg:col-span-1 space-y-6">
                  
                  {/* Participant Detail Card */}
                  <div className="card p-5 space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Credential Metadata</h4>
                    
                    <div className="space-y-3.5 text-xs">
                      <div>
                        <p className="text-gray-400 font-medium">Faculty Member</p>
                        <p className="font-semibold text-gray-800 mt-0.5 text-sm">{result.facultyName}</p>
                        <p className="text-gray-500 mt-0.5">{result.facultyEmail}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-medium">Course Title</p>
                        <p className="font-semibold text-gray-800 mt-0.5 text-sm">{result.fdpName}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full font-bold text-[10px] uppercase">
                          {result.fdpCategory}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-400 font-medium">Issued Date</p>
                        <p className="font-semibold text-gray-800 mt-0.5">{issuedDate}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-medium">Assessment Score</p>
                        <p className="font-semibold text-gray-800 mt-0.5">{result.quizScore}% Passing Score</p>
                      </div>
                    </div>
                  </div>

                  {/* Blockchain Registry Security */}
                  <div className="card p-5 space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <HiOutlineGlobeAlt className="text-gray-400 text-sm" /> Ledger Registrant
                    </h4>

                    <div className="space-y-3 text-xs">
                      <div>
                        <p className="text-gray-400 font-medium">Platform Registry Hash</p>
                        <div className="flex items-center gap-1 bg-gray-50 p-2 rounded-lg border border-gray-150 mt-1 font-mono text-[10px] text-gray-600 break-all select-all">
                          <span>{result.certificateHash}</span>
                        </div>
                      </div>
                      
                      {result.txHash ? (
                        <div>
                          <p className="text-gray-400 font-medium">Ledger Transaction Hash</p>
                          <div className="flex items-center justify-between gap-1 bg-slate-900 p-2.5 rounded-lg border border-slate-800 mt-1">
                            <span className="font-mono text-[10px] text-emerald-400 break-all select-all flex-1">{result.txHash}</span>
                            <button 
                              onClick={() => copyToClipboard(result.txHash)} 
                              className="text-slate-400 hover:text-emerald-400 p-1 shrink-0 transition-colors"
                              title="Copy transaction hash"
                            >
                              <HiOutlineClipboardCopy className="text-base" />
                            </button>
                          </div>
                          <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-bold text-[10px] border border-emerald-500/30">
                            ✓ SECURED ON-CHAIN
                          </span>
                        </div>
                      ) : (
                        <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3 text-amber-800 text-[11px] leading-relaxed">
                          ⚠️ This certificate has been signed and validated on the registry database, but is currently queued for local Ethereum block confirmation.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Certificate visual render column */}
                <div className="lg:col-span-2 flex flex-col justify-start">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Visual Certificate Render</span>
                    <span className="text-xs text-gray-500">A4 Landscape Layout</span>
                  </div>
                  <div
                    ref={containerRef}
                    className="overflow-visible bg-gray-900/10 p-3 rounded-2xl border border-gray-200 shadow-inner"
                    style={{ width: '100%' }}
                  >
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
                        <CertificateTemplate cert={previewCert} user={previewUser} templateSettings={result.templateSettings} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by Secure Decentralized Ethereum Verification Registry Node • Anti-Tampering Certified
        </p>

      </div>
    </div>
  );
}
