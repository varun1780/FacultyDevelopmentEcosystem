import { useState, useEffect, useRef } from 'react';
import { certificateAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { 
  HiOutlineSparkles, 
  HiOutlineUpload, 
  HiOutlineSave, 
  HiOutlineRefresh, 
  HiOutlineEye, 
  HiOutlineChevronRight,
  HiOutlineDocumentText
} from 'react-icons/hi';
import { QRCodeSVG } from 'qrcode.react';

export default function AdminCertificateEditorPage() {
  const { user } = useAuth();
  const [template, setTemplate] = useState({
    collegeName: 'National Institute of Technology',
    departmentName: 'Department of Computer Science & Engineering',
    logoUrl: '',
    backgroundUrl: '',
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
  });

  const [certificateData, setCertificateData] = useState({
    facultyName: user?.name || 'Faculty',
    courseName: 'Generative AI & Modern Classroom Pedagogies',
    completionDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    certificateId: 'CERT-E8C2B3F9',
    instructorName: 'Dr. Aris Thorne',
    score: '85'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputLogoRef = useRef(null);
  const fileInputPrincipalRef = useRef(null);
  const fileInputHodRef = useRef(null);
  const fileInputCoordRef = useRef(null);

  useEffect(() => {
    fetchTemplate();
  }, []);

  const fetchTemplate = async () => {
    setLoading(true);
    try {
      const res = await certificateAPI.getActiveTemplate();
      if (res.data) {
        setTemplate(prev => ({
          ...prev,
          ...res.data
        }));
      }
    } catch (e) {
      console.error('Failed to fetch certificate template:', e);
      toast.error('Failed to load certificate template settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await certificateAPI.updateActiveTemplate(template);
      toast.success('Certificate template saved and activated!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to save certificate template');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setTemplate(prev => ({
        ...prev,
        [field]: reader.result // Reader.result is the base64 Data URL
      }));
      toast.success('Asset uploaded successfully');
    };
    reader.readAsDataURL(file);
  };

  const clearAsset = (field) => {
    setTemplate(prev => ({
      ...prev,
      [field]: ''
    }));
  };

  // Helper to replace template placeholder tags
  const renderCertificateText = (text) => {
    if (!text) return '';
    
    try {
      // Replace markdown double asterisks with bold HTML tags
      let formatted = text
        .replace(/\{\{facultyName\}\}/g, certificateData?.facultyName || 'Faculty Name')
        .replace(/\{\{courseName\}\}/g, certificateData?.courseName || 'Course Name')
        .replace(/\{\{completionDate\}\}/g, certificateData?.completionDate || 'Completion Date')
        .replace(/\{\{score\}\}/g, certificateData?.score || '85')
        .replace(/\{\{certificateId\}\}/g, certificateData?.certificateId || 'Certificate ID')
        .replace(/\{\{instructorName\}\}/g, certificateData?.instructorName || 'Instructor Name');
        
      // Simple markdown conversion
      formatted = formatted
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br/>');

      return formatted;
    } catch (e) {
      console.error('Error formatting certificate text:', e);
      return text || '';
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading certificate configuration...</p>
        </div>
      </div>
    );
  }

  // Determine font family style class
  const fontClass = template.fontFamily === 'serif' 
    ? 'font-serif' 
    : template.fontFamily === 'monospace' 
      ? 'font-mono' 
      : 'font-sans';

  // Determine border style CSS mapping
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <HiOutlineSparkles className="text-primary-500" /> Certificate Template Editor
          </h1>
          <p className="text-gray-500 mt-1">Design the official graduation certificates for your LMS platform</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchTemplate} 
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <HiOutlineRefresh /> Reset
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <HiOutlineSave className="text-base" />
            {saving ? 'Saving...' : 'Save & Activate'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor controls - 5 cols */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card p-5 space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto">
            <h3 className="section-title flex items-center gap-1.5 pb-2 border-b border-gray-100">
              <HiOutlineDocumentText className="text-primary-500" /> Layout Settings
            </h3>

            {/* Typography & Borders */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-style">Font Family</label>
                <select 
                  value={template.fontFamily} 
                  onChange={e => setTemplate({ ...template, fontFamily: e.target.value })}
                  className="input-field py-1.5 text-xs bg-white"
                >
                  <option value="serif">Playfair / Serif</option>
                  <option value="sans-serif">Inter / Sans-Serif</option>
                  <option value="monospace">Courier / Monospace</option>
                </select>
              </div>
              <div>
                <label className="label-style">Border Style</label>
                <select 
                  value={template.borderStyle} 
                  onChange={e => setTemplate({ ...template, borderStyle: e.target.value })}
                  className="input-field py-1.5 text-xs bg-white"
                >
                  <option value="double">Elegant Double</option>
                  <option value="solid">Minimal Solid</option>
                  <option value="floral">Dashed Detail</option>
                  <option value="none">No Border</option>
                </select>
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="label-style">Primary Color</label>
                <div className="flex gap-1.5 items-center">
                  <input 
                    type="color" 
                    value={template.primaryColor} 
                    onChange={e => setTemplate({ ...template, primaryColor: e.target.value })}
                    className="w-8 h-8 rounded border cursor-pointer p-0 overflow-hidden" 
                  />
                  <span className="text-[10px] font-mono">{template.primaryColor}</span>
                </div>
              </div>
              <div>
                <label className="label-style">Secondary Color</label>
                <div className="flex gap-1.5 items-center">
                  <input 
                    type="color" 
                    value={template.secondaryColor} 
                    onChange={e => setTemplate({ ...template, secondaryColor: e.target.value })}
                    className="w-8 h-8 rounded border cursor-pointer p-0 overflow-hidden" 
                  />
                  <span className="text-[10px] font-mono">{template.secondaryColor}</span>
                </div>
              </div>
              <div>
                <label className="label-style">Text Color</label>
                <div className="flex gap-1.5 items-center">
                  <input 
                    type="color" 
                    value={template.textColor} 
                    onChange={e => setTemplate({ ...template, textColor: e.target.value })}
                    className="w-8 h-8 rounded border cursor-pointer p-0 overflow-hidden" 
                  />
                  <span className="text-[10px] font-mono">{template.textColor}</span>
                </div>
              </div>
            </div>

            {/* College & Department */}
            <div>
              <label className="label-style">Institution Name</label>
              <input 
                type="text" 
                value={template.collegeName} 
                onChange={e => setTemplate({ ...template, collegeName: e.target.value })}
                className="input-field text-xs py-1.5" 
                placeholder="Enter college name..."
              />
            </div>
            <div>
              <label className="label-style">Sub-Header / Department</label>
              <input 
                type="text" 
                value={template.departmentName} 
                onChange={e => setTemplate({ ...template, departmentName: e.target.value })}
                className="input-field text-xs py-1.5" 
                placeholder="Enter department or body name..."
              />
            </div>

            {/* Certificate Body Text */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label-style !mb-0">Certificate Body Text</label>
                <span className="text-[9px] text-gray-400 font-mono">Use placeholders like {"`{{facultyName}}`"}</span>
              </div>
              <textarea 
                value={template.certificateText} 
                onChange={e => setTemplate({ ...template, certificateText: e.target.value })}
                rows={4}
                className="input-field text-xs" 
                placeholder="Write certificate text template here..."
              />
            </div>

            {/* Footer & Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label-style">Footer Text</label>
                <input 
                  type="text" 
                  value={template.footerText} 
                  onChange={e => setTemplate({ ...template, footerText: e.target.value })}
                  className="input-field text-xs py-1.5" 
                  placeholder="Enter footer text..."
                />
              </div>
              <div className="flex flex-col justify-end space-y-2 pb-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-gray-600">
                  <input 
                    type="checkbox" 
                    checked={template.enableBlockchain} 
                    onChange={e => setTemplate({ ...template, enableBlockchain: e.target.checked })}
                    className="w-4 h-4 accent-primary-500 rounded" 
                  />
                  <span>Decentralized Ledger Sync</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-gray-600">
                  <input 
                    type="checkbox" 
                    checked={template.enableQr} 
                    onChange={e => setTemplate({ ...template, enableQr: e.target.checked })}
                    className="w-4 h-4 accent-primary-500 rounded" 
                  />
                  <span>Dynamic QR verification</span>
                </label>
              </div>
            </div>

            {/* Image Uploads (Logo & Signatures) */}
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Upload Assets (Logo & Signatures)</h4>
              
              {/* College Logo */}
              <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-150 rounded-xl">
                <div>
                  <p className="font-semibold text-xs text-gray-800">Institution Logo</p>
                  <p className="text-[10px] text-gray-400">{template.logoUrl ? 'Asset Linked ✓' : 'Upload PNG (max 2MB)'}</p>
                </div>
                <div className="flex gap-1">
                  <input type="file" ref={fileInputLogoRef} onChange={e => handleFileUpload(e, 'logoUrl')} className="hidden" accept="image/*" />
                  <button onClick={() => fileInputLogoRef.current.click()} className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-xs flex items-center gap-1">
                    <HiOutlineUpload /> Link
                  </button>
                  {template.logoUrl && (
                    <button onClick={() => clearAsset('logoUrl')} className="p-1.5 bg-red-50 text-red-500 border border-red-100 rounded-lg hover:bg-red-100/50 text-xs">
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Principal Signature */}
              <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-150 rounded-xl">
                <div>
                  <p className="font-semibold text-xs text-gray-800">Principal Signature</p>
                  <p className="text-[10px] text-gray-400">{template.principalSignatureUrl ? 'Asset Linked ✓' : 'Upload PNG (max 2MB)'}</p>
                </div>
                <div className="flex gap-1">
                  <input type="file" ref={fileInputPrincipalRef} onChange={e => handleFileUpload(e, 'principalSignatureUrl')} className="hidden" accept="image/*" />
                  <button onClick={() => fileInputPrincipalRef.current.click()} className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-xs flex items-center gap-1">
                    <HiOutlineUpload /> Link
                  </button>
                  {template.principalSignatureUrl && (
                    <button onClick={() => clearAsset('principalSignatureUrl')} className="p-1.5 bg-red-50 text-red-500 border border-red-100 rounded-lg hover:bg-red-100/50 text-xs">
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* HOD Signature */}
              <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-150 rounded-xl">
                <div>
                  <p className="font-semibold text-xs text-gray-800">HOD Signature</p>
                  <p className="text-[10px] text-gray-400">{template.hodSignatureUrl ? 'Asset Linked ✓' : 'Upload PNG (max 2MB)'}</p>
                </div>
                <div className="flex gap-1">
                  <input type="file" ref={fileInputHodRef} onChange={e => handleFileUpload(e, 'hodSignatureUrl')} className="hidden" accept="image/*" />
                  <button onClick={() => fileInputHodRef.current.click()} className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-xs flex items-center gap-1">
                    <HiOutlineUpload /> Link
                  </button>
                  {template.hodSignatureUrl && (
                    <button onClick={() => clearAsset('hodSignatureUrl')} className="p-1.5 bg-red-50 text-red-500 border border-red-100 rounded-lg hover:bg-red-100/50 text-xs">
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Coordinator Signature */}
              <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-150 rounded-xl">
                <div>
                  <p className="font-semibold text-xs text-gray-800">Coordinator Signature</p>
                  <p className="text-[10px] text-gray-400">{template.coordinatorSignatureUrl ? 'Asset Linked ✓' : 'Upload PNG (max 2MB)'}</p>
                </div>
                <div className="flex gap-1">
                  <input type="file" ref={fileInputCoordRef} onChange={e => handleFileUpload(e, 'coordinatorSignatureUrl')} className="hidden" accept="image/*" />
                  <button onClick={() => fileInputCoordRef.current.click()} className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-xs flex items-center gap-1">
                    <HiOutlineUpload /> Link
                  </button>
                  {template.coordinatorSignatureUrl && (
                    <button onClick={() => clearAsset('coordinatorSignatureUrl')} className="p-1.5 bg-red-50 text-red-500 border border-red-100 rounded-lg hover:bg-red-100/50 text-xs">
                      Clear
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Certificate Preview Data */}
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <HiOutlineSparkles className="text-primary-500" /> Preview Data (Test Fields)
              </h4>
              <p className="text-[10px] text-gray-400">Modify these fields to test certificate live previews. They are not stored in the template database.</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-style">Faculty Name</label>
                  <input 
                    type="text" 
                    value={certificateData?.facultyName || ''} 
                    onChange={e => setCertificateData({ ...certificateData, facultyName: e.target.value })}
                    className="input-field text-xs py-1.5" 
                    placeholder="Faculty Name"
                  />
                </div>
                <div>
                  <label className="label-style">Course Name</label>
                  <input 
                    type="text" 
                    value={certificateData?.courseName || ''} 
                    onChange={e => setCertificateData({ ...certificateData, courseName: e.target.value })}
                    className="input-field text-xs py-1.5" 
                    placeholder="Course Name"
                  />
                </div>
                <div>
                  <label className="label-style">Completion Date</label>
                  <input 
                    type="text" 
                    value={certificateData?.completionDate || ''} 
                    onChange={e => setCertificateData({ ...certificateData, completionDate: e.target.value })}
                    className="input-field text-xs py-1.5" 
                    placeholder="Completion Date"
                  />
                </div>
                <div>
                  <label className="label-style">Certificate ID</label>
                  <input 
                    type="text" 
                    value={certificateData?.certificateId || ''} 
                    onChange={e => setCertificateData({ ...certificateData, certificateId: e.target.value })}
                    className="input-field text-xs py-1.5" 
                    placeholder="Certificate ID"
                  />
                </div>
                <div>
                  <label className="label-style">Instructor Name</label>
                  <input 
                    type="text" 
                    value={certificateData?.instructorName || ''} 
                    onChange={e => setCertificateData({ ...certificateData, instructorName: e.target.value })}
                    className="input-field text-xs py-1.5" 
                    placeholder="Instructor Name"
                  />
                </div>
                <div>
                  <label className="label-style">Score (%)</label>
                  <input 
                    type="text" 
                    value={certificateData?.score || ''} 
                    onChange={e => setCertificateData({ ...certificateData, score: e.target.value })}
                    className="input-field text-xs py-1.5" 
                    placeholder="Score"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Live WYSIWYG Canvas Preview - 7 cols */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card p-5 space-y-4">
            <h3 className="section-title flex items-center gap-1.5">
              <HiOutlineEye className="text-primary-500" /> Live Canvas Preview
            </h3>

            {/* Wrapper to scale and display the certificate preview sheet */}
            <div className="border border-gray-200 rounded-2xl bg-gray-100 p-4 flex items-center justify-center overflow-x-auto shadow-inner min-h-[460px]">
              <div 
                id="certificate-preview-canvas"
                className={`w-[720px] h-[510px] p-10 flex flex-col justify-between relative shadow-2xl transition-all duration-300 ${fontClass}`}
                style={{
                  background: template.backgroundUrl 
                    ? `url(${template.backgroundUrl}) no-repeat center center/cover` 
                    : 'linear-gradient(180deg, #fffdf8 0%, #fff9ee 100%)',
                  border: getBorderStyle(),
                  color: template.textColor,
                }}
              >
                {/* Corner Accents */}
                <div className="absolute top-2 left-2 w-12 h-12 border-t-2 border-l-2 opacity-30" style={{ borderColor: template.primaryColor }}></div>
                <div className="absolute top-2 right-2 w-12 h-12 border-t-2 border-r-2 opacity-30" style={{ borderColor: template.primaryColor }}></div>
                <div className="absolute bottom-2 left-2 w-12 h-12 border-b-2 border-l-2 opacity-30" style={{ borderColor: template.primaryColor }}></div>
                <div className="absolute bottom-2 right-2 w-12 h-12 border-b-2 border-r-2 opacity-30" style={{ borderColor: template.primaryColor }}></div>

                {/* College Logo & Headers */}
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-4">
                    {template.logoUrl ? (
                      <img src={template.logoUrl} alt="Logo" className="w-14 h-14 object-contain" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200/80 flex items-center justify-center text-[10px] text-gray-400 font-bold border border-dashed border-gray-300">LOGO</div>
                    )}
                    <div className="text-left">
                      <h2 className="text-lg font-bold tracking-wide uppercase select-none leading-tight">{template.collegeName}</h2>
                      <p className="text-xs opacity-75 font-medium">{template.departmentName}</p>
                    </div>
                  </div>
                  <div className="w-24 h-0.5 mx-auto my-3" style={{ background: `linear-gradient(90deg, ${template.primaryColor}, ${template.secondaryColor})` }}></div>
                </div>

                {/* Certificate Title */}
                <div className="text-center space-y-1">
                  <span className="text-[10px] font-bold tracking-widest uppercase select-none" style={{ color: template.primaryColor }}>CERTIFICATE OF PARTICIPATION</span>
                  <h1 className="text-2xl font-bold tracking-wide font-serif">Completion Award</h1>
                </div>

                {/* Certificate Body Text */}
                <div className="text-center px-6 my-2">
                  <p 
                    className="text-sm leading-relaxed" 
                    dangerouslySetInnerHTML={{ __html: renderCertificateText(template.certificateText) }}
                  />
                </div>

                {/* Date & Verification IDs */}
                <div className="grid grid-cols-3 items-end gap-2 text-center text-[10px]">
                  <div className="text-left pl-4 space-y-1">
                    <p className="opacity-50 select-none text-[8px] uppercase tracking-wider">Date Issued</p>
                    <p className="font-semibold">{certificateData?.completionDate || 'Completion Date'}</p>
                    <p className="opacity-50 select-none text-[8px] uppercase tracking-wider mt-1">Certificate ID</p>
                    <p className="font-mono font-bold" style={{ color: template.primaryColor }}>{certificateData?.certificateId || 'Certificate ID'}</p>
                  </div>
                  
                  {/* QR code verification preview */}
                  <div className="flex flex-col items-center justify-center">
                    {template.enableQr ? (
                      <div className="p-1 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <QRCodeSVG value={`${window.location.origin}/verify-certificate/${certificateData?.certificateId || ''}`} size={50} />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gray-150 rounded border border-dashed flex items-center justify-center text-[8px] text-gray-400">QR disabled</div>
                    )}
                    <span className="text-[8px] mt-1 opacity-50 select-none">Scan to Verify</span>
                  </div>

                  <div className="text-right pr-4 space-y-1">
                    <p className="opacity-50 select-none text-[8px] uppercase tracking-wider">Verification Ledger</p>
                    <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[8px] font-bold border border-emerald-100">Verified</span>
                    {template.enableBlockchain && (
                      <span className="block text-[8px] font-mono text-primary-500 truncate mt-1">TX: 0x8a92...b5f8</span>
                    )}
                  </div>
                </div>

                {/* Signatures */}
                <div className="border-t border-gray-200/60 pt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="flex flex-col items-center justify-end">
                    {template.principalSignatureUrl ? (
                      <img src={template.principalSignatureUrl} alt="Principal Signature" className="h-8 object-contain" />
                    ) : (
                      <div className="h-6 w-16 border-b border-dashed border-gray-300 mb-1 flex items-center justify-center text-[8px] text-gray-300">Principal</div>
                    )}
                    <p className="text-[9px] font-semibold opacity-85">Principal</p>
                  </div>
                  <div className="flex flex-col items-center justify-end">
                    {template.hodSignatureUrl ? (
                      <img src={template.hodSignatureUrl} alt="HOD Signature" className="h-8 object-contain" />
                    ) : (
                      <div className="h-6 w-16 border-b border-dashed border-gray-300 mb-1 flex items-center justify-center text-[8px] text-gray-300">HOD</div>
                    )}
                    <p className="text-[9px] font-semibold opacity-85">Head of Dept.</p>
                  </div>
                  <div className="flex flex-col items-center justify-end">
                    {template.coordinatorSignatureUrl ? (
                      <img src={template.coordinatorSignatureUrl} alt="Coordinator Signature" className="h-8 object-contain" />
                    ) : (
                      <div className="h-6 w-16 border-b border-dashed border-gray-300 mb-1 flex items-center justify-center text-[8px] text-gray-300">Coordinator</div>
                    )}
                    <p className="text-[9px] font-semibold opacity-85">FDP Coordinator</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick Template Tips */}
            <div className="bg-primary-50/50 border border-primary-100 rounded-xl p-4 text-xs text-primary-800 space-y-1.5">
              <p className="font-bold flex items-center gap-1"><HiOutlineSparkles className="text-primary-500" /> Template Styling Tips</p>
              <ul className="list-disc list-inside space-y-1 text-primary-700">
                <li>Double asterisks `**text**` render the enclosed text in bold.</li>
                <li>Ensure you insert placeholders like {"`{{facultyName}}`"} and {"`{{courseName}}`"} to let the system pull dynamic values.</li>
                <li>Enable the **Decentralized Ledger Sync** toggle to include secure blockchain hash verification.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
