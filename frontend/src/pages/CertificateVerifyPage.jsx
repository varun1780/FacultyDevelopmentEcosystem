import { useState, useEffect } from 'react';
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

export default function CertificateVerifyPage() {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const [certId, setCertId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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
                           <div className="flex items-center justify-center overflow-x-auto bg-gray-900/10 p-3 rounded-2xl border border-gray-200 shadow-inner">
                    <div 
                      id="issued-certificate-canvas" 
                      className={`w-[794px] h-[561px] p-12 flex flex-col justify-between relative shrink-0 ${fontClass}`}
                      style={{
                        background: canvasBg,
                        border: getBorderStyle(),
                        color: canvasTextColor,
                      }}
                    >
                      {/* Corner decorations */}
                      {!isDarkTheme && (
                        <>
                          <div className="absolute top-2 left-2 w-14 h-14 border-t-2 border-l-2 opacity-30" style={{ borderColor: template.primaryColor }}></div>
                          <div className="absolute top-2 right-2 w-14 h-14 border-t-2 border-r-2 opacity-30" style={{ borderColor: template.primaryColor }}></div>
                          <div className="absolute bottom-2 left-2 w-14 h-14 border-b-2 border-l-2 opacity-30" style={{ borderColor: template.primaryColor }}></div>
                          <div className="absolute bottom-2 right-2 w-14 h-14 border-b-2 border-r-2 opacity-30" style={{ borderColor: template.primaryColor }}></div>
                        </>
                      )}
                      {isDarkTheme && (
                        <>
                          <div className="absolute top-2 left-2 w-14 h-14 border-t-2 border-l-2 opacity-70 border-cyan-500"></div>
                          <div className="absolute top-2 right-2 w-14 h-14 border-t-2 border-r-2 opacity-70 border-cyan-500"></div>
                          <div className="absolute bottom-2 left-2 w-14 h-14 border-b-2 border-l-2 opacity-70 border-cyan-500"></div>
                          <div className="absolute bottom-2 right-2 w-14 h-14 border-b-2 border-r-2 opacity-70 border-cyan-500"></div>
                        </>
                      )}

                      {/* Header */}
                      <div className="text-center space-y-2">
                        <div className="flex items-center justify-center gap-4">
                          <img 
                            src={template.logoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%237c3aed"><path d="M12 2L1 7l11 5 9-4.09V14a1 1 0 0 0 2 0V7.91L23 7M4.73 14a9 9 0 0 0 14.54 0"/></svg>`} 
                            alt="Logo" 
                            className="w-14 h-14 object-contain animate-fade-in" 
                          />
                          <div className="text-left">
                            <h2 className="text-lg font-bold tracking-wide uppercase leading-tight">{template.collegeName}</h2>
                            <p className="text-xs opacity-75 font-medium">{template.departmentName}</p>
                          </div>
                        </div>
                        <div className="w-28 h-0.5 mx-auto my-3" style={{ background: isDarkTheme ? 'linear-gradient(90deg, #06b6d4, #8b5cf6)' : `linear-gradient(90deg, ${template.primaryColor}, ${template.secondaryColor})` }}></div>
                      </div>

                      {/* Title */}
                      <div className="text-center space-y-1">
                        <span className="text-[10px] font-bold tracking-widest uppercase animate-pulse" style={{ color: isDarkTheme ? '#06b6d4' : template.primaryColor }}>CERTIFICATE OF COMPLETION</span>
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
                          <p className="font-mono font-bold" style={{ color: isDarkTheme ? '#06b6d4' : template.primaryColor }}>{result.certificateId}</p>
                        </div>

                        {/* QR verification */}
                        <div className="flex flex-col items-center justify-center">
                          {template.enableQr ? (
                            <div className="p-1 bg-white border border-gray-200 rounded-lg shadow-sm">
                              <QRCodeSVG value={`http://localhost:5173/verify-certificate/${result.certificateId}`} size={54} />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gray-150 rounded border border-dashed flex items-center justify-center text-[8px] text-gray-400">QR disabled</div>
                          )}
                          <span className="text-[8px] mt-1 opacity-50 font-medium">Scan to Verify</span>
                        </div>

                        <div className="text-right pr-4 space-y-1">
                          <p className="opacity-50 text-[8px] uppercase tracking-wider">Blockchain Ledger</p>
                          <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[8px] font-bold border border-emerald-100">
                            {result.isOnChain ? 'On Chain' : 'Verified'}
                          </span>
                          {result.txHash && (
                            <span className="block text-[8px] font-mono text-primary-500 truncate mt-1">{result.txHash.substring(0, 16)}...</span>
                          )}
                        </div>
                      </div>

                      {/* Signatures */}
                      <div className="border-t border-gray-250/20 pt-4 grid grid-cols-3 gap-2 text-center">
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
