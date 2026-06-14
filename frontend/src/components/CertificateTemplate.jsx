import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const CertificateTemplate = forwardRef(({ cert, user, templateSettings }, ref) => {
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
    enableQr: true,
  };

  if (templateSettings) {
    try {
      const parsed = typeof templateSettings === 'string' ? JSON.parse(templateSettings) : templateSettings;
      template = { ...template, ...parsed };
    } catch (e) {
      console.error('Failed to parse template settings', e);
    }
  }

  const issuedDate = cert?.issuedAt
    ? new Date(cert.issuedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  const getFormattedText = () => {
    if (!template.certificateText) return '';
    let text = template.certificateText
      .replace(/\{\{facultyName\}\}/g, cert?.facultyName || cert?.user?.name || user?.name || 'Faculty Member')
      .replace(/\{\{courseName\}\}/g, cert?.fdpProgram?.title || 'Faculty Development Program')
      .replace(/\{\{completionDate\}\}/g, issuedDate)
      .replace(/\{\{score\}\}/g, cert?.quizScore || '80')
      .replace(/\{\{certificateId\}\}/g, cert?.certificateId || 'N/A')
      .replace(/\{\{instructorName\}\}/g, cert?.fdpProgram?.instructorName || 'FDP Instructor');

    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  const getBorderStyle = () => {
    switch (template.borderStyle) {
      case 'double': return `10px double ${template.primaryColor}`;
      case 'solid': return `6px solid ${template.primaryColor}`;
      case 'floral': return `8px dashed ${template.secondaryColor}`;
      case 'none': default: return 'none';
    }
  };

  const fontClass = template.fontFamily === 'serif' ? 'font-serif' : template.fontFamily === 'monospace' ? 'font-mono' : 'font-sans';
  const defaultLogo = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%237c3aed"><path d="M12 2L1 7l11 5 9-4.09V14a1 1 0 0 0 2 0V7.91L23 7M4.73 14a9 9 0 0 0 14.54 0"/></svg>`;

  return (
    <div 
      ref={ref}
      id="certificate-export-container"
      className={`certificate-container ${fontClass}`}
      style={{
        width: '1123px',
        height: '794px',
        position: 'relative',
        overflow: 'hidden',
        background: template.backgroundUrl ? `url(${template.backgroundUrl}) no-repeat center center/cover` : '#ffffff',
        color: template.textColor,
        margin: 0,
        padding: 0,
        boxSizing: 'border-box'
      }}
    >
      {/* Background/Border Overlay */}
      <div style={{
        position: 'absolute',
        top: '20px', left: '20px', right: '20px', bottom: '20px',
        border: getBorderStyle(),
        pointerEvents: 'none'
      }}></div>
      
      {/* Corner Decorations */}
      <div style={{ position: 'absolute', top: '25px', left: '25px', width: '60px', height: '60px', borderTop: `3px solid ${template.primaryColor}`, borderLeft: `3px solid ${template.primaryColor}`, opacity: 0.4 }}></div>
      <div style={{ position: 'absolute', top: '25px', right: '25px', width: '60px', height: '60px', borderTop: `3px solid ${template.primaryColor}`, borderRight: `3px solid ${template.primaryColor}`, opacity: 0.4 }}></div>
      <div style={{ position: 'absolute', bottom: '25px', left: '25px', width: '60px', height: '60px', borderBottom: `3px solid ${template.primaryColor}`, borderLeft: `3px solid ${template.primaryColor}`, opacity: 0.4 }}></div>
      <div style={{ position: 'absolute', bottom: '25px', right: '25px', width: '60px', height: '60px', borderBottom: `3px solid ${template.primaryColor}`, borderRight: `3px solid ${template.primaryColor}`, opacity: 0.4 }}></div>

      {/* Header Container */}
      <div style={{ position: 'absolute', top: '80px', left: '0', width: '100%', textAlign: 'center' }}>
        <img 
          src={template.logoUrl || defaultLogo} 
          alt="Logo" 
          crossOrigin="anonymous"
          style={{ width: '80px', height: '80px', objectFit: 'contain', margin: '0 auto', display: 'block' }} 
        />
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '15px' }}>
          {template.collegeName}
        </h2>
        <p style={{ fontSize: '16px', fontWeight: '500', opacity: 0.75, marginTop: '5px' }}>
          {template.departmentName}
        </p>
        <div style={{ width: '150px', height: '3px', background: `linear-gradient(90deg, ${template.primaryColor}, ${template.secondaryColor})`, margin: '20px auto 0' }}></div>
      </div>

      {/* Certificate Title */}
      <div style={{ position: 'absolute', top: '280px', left: '0', width: '100%', textAlign: 'center', padding: '0 40px', boxSizing: 'border-box' }}>
        <span style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '4px', textTransform: 'uppercase', color: template.primaryColor }}>
          CERTIFICATE OF COMPLETION
        </span>
        <h1 style={{ fontSize: '42px', fontWeight: 'bold', marginTop: '10px', wordBreak: 'break-word', overflowWrap: 'break-word', lineHeight: '1.4', maxWidth: '85%', margin: '10px auto 0' }}>
          Faculty Development Program
        </h1>
      </div>

      {/* Body Text */}
      <div style={{ position: 'absolute', top: '400px', left: '10%', right: '10%', textAlign: 'center' }}>
        <p 
          style={{ fontSize: '20px', lineHeight: '1.8', margin: 0, padding: 0, wordBreak: 'break-word', overflowWrap: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: getFormattedText() }}
        />
      </div>

      {/* Left Verification Info */}
      <div style={{ position: 'absolute', bottom: '70px', left: '60px', textAlign: 'left' }}>
        <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6, margin: 0 }}>Date Issued</p>
        <p style={{ fontSize: '14px', fontWeight: '600', margin: '2px 0 15px 0' }}>{issuedDate}</p>
        
        <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6, margin: 0 }}>Certificate ID</p>
        <p style={{ fontSize: '14px', fontWeight: 'bold', color: template.primaryColor, margin: '2px 0 0 0' }}>{cert?.certificateId || 'N/A'}</p>
      </div>

      {/* Center QR Code */}
      {template.enableQr && (
        <div style={{ position: 'absolute', bottom: '60px', left: '0', width: '100%', textAlign: 'center' }}>
          <div style={{ display: 'inline-block' }}>
            <div style={{ padding: '5px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', display: 'inline-block' }}>
              <QRCodeSVG value={`http://localhost:5173/verify-certificate/${cert?.certificateId || ''}`} size={80} />
            </div>
            <p style={{ fontSize: '11px', opacity: 0.6, marginTop: '8px', margin: '8px 0 0 0' }}>Scan to Verify</p>
          </div>
        </div>
      )}

      {/* Right Signatures */}
      <div style={{ position: 'absolute', bottom: '70px', right: '50px', display: 'flex', gap: '20px', textAlign: 'center', alignItems: 'flex-end' }}>
        <div style={{ width: '140px' }}>
          {template.principalSignatureUrl ? (
            <img crossOrigin="anonymous" src={template.principalSignatureUrl} alt="Principal Signature" style={{ height: '50px', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
          ) : (
            <div style={{ height: '40px', borderBottom: '1px dashed #ccc', margin: '0 15px 10px 15px' }}></div>
          )}
          <p style={{ fontSize: '13px', fontWeight: '600', opacity: 0.85, margin: '5px 0 0 0', whiteSpace: 'nowrap' }}>Principal</p>
        </div>
        <div style={{ width: '140px' }}>
          {template.hodSignatureUrl ? (
            <img crossOrigin="anonymous" src={template.hodSignatureUrl} alt="HOD Signature" style={{ height: '50px', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
          ) : (
            <div style={{ height: '40px', borderBottom: '1px dashed #ccc', margin: '0 15px 10px 15px' }}></div>
          )}
          <p style={{ fontSize: '13px', fontWeight: '600', opacity: 0.85, margin: '5px 0 0 0', whiteSpace: 'nowrap' }}>Head of Dept.</p>
        </div>
        <div style={{ width: '140px' }}>
          {template.coordinatorSignatureUrl ? (
            <img crossOrigin="anonymous" src={template.coordinatorSignatureUrl} alt="Coordinator Signature" style={{ height: '50px', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
          ) : (
            <div style={{ height: '40px', borderBottom: '1px dashed #ccc', margin: '0 15px 10px 15px' }}></div>
          )}
          <p style={{ fontSize: '13px', fontWeight: '600', opacity: 0.85, margin: '5px 0 0 0', whiteSpace: 'nowrap' }}>Coordinator</p>
        </div>
      </div>
    </div>
  );
});

export default CertificateTemplate;
