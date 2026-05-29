import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

// Helper to convert hex to RGB
const hexToRgb = (hex) => {
  const defaultColor = { r: 124, g: 58, b: 237 }; // #7c3aed
  if (!hex) return defaultColor;
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6) return defaultColor;
  return {
    r: parseInt(cleanHex.substring(0, 2), 16),
    g: parseInt(cleanHex.substring(2, 4), 16),
    b: parseInt(cleanHex.substring(4, 6), 16)
  };
};

// Helper to get image data url (handles potential CORS issues by trying to fetch if needed, though typically we expect base64 for signatures)
const getBase64Image = async (url) => {
  if (!url) return null;
  if (url.startsWith('data:image')) return url;
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Failed to load image for PDF:", url, e);
    return null;
  }
};

export const generateNativePDF = async (cert, user, templateStr) => {
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

  if (templateStr) {
    try {
      const parsed = JSON.parse(templateStr);
      template = { ...template, ...parsed };
    } catch (e) { }
  }

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const w = 297;
  const h = 210;

  // Set Background
  pdf.setFillColor(255, 253, 248);
  pdf.rect(0, 0, w, h, 'F');

  const primaryRgb = hexToRgb(template.primaryColor);
  const textRgb = hexToRgb(template.textColor);

  // Border
  if (template.borderStyle !== 'none') {
    pdf.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    pdf.setLineWidth(template.borderStyle === 'solid' ? 2 : 4);
    // Outer border
    pdf.rect(10, 10, w - 20, h - 20, 'S');
    // Inner border if double
    if (template.borderStyle === 'double') {
      pdf.setLineWidth(1);
      pdf.rect(13, 13, w - 26, h - 26, 'S');
    }
  }

  const isMono = template.fontFamily === 'monospace';
  const isSans = template.fontFamily === 'sans-serif';
  const fontName = isMono ? 'courier' : isSans ? 'helvetica' : 'times';

  // Load Images (Logos & Signatures)
  const rawLogo = template.logoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%237c3aed"><path d="M12 2L1 7l11 5 9-4.09V14a1 1 0 0 0 2 0V7.91L23 7M4.73 14a9 9 0 0 0 14.54 0"/></svg>`;
  const logoData = await getBase64Image(rawLogo);
  const sig1 = await getBase64Image(template.principalSignatureUrl);
  const sig2 = await getBase64Image(template.hodSignatureUrl);
  const sig3 = await getBase64Image(template.coordinatorSignatureUrl);

  // Header
  if (logoData) {
    const logoFormat = logoData.startsWith('data:image/svg+xml') ? 'SVG' : 'PNG';
    pdf.addImage(logoData, logoFormat, 25, 15, 25, 25);
  }

  pdf.setFont(fontName, 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(textRgb.r, textRgb.g, textRgb.b);
  pdf.text(template.collegeName.toUpperCase(), 55, 25);

  pdf.setFont(fontName, 'normal');
  pdf.setFontSize(14);
  pdf.setTextColor(100, 100, 100);
  pdf.text(template.departmentName, 55, 33);

  let yPos = 55;
  pdf.setFont(fontName, 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.text('CERTIFICATE OF COMPLETION', w / 2, yPos, { align: 'center', charSpace: 2 });

  yPos += 12;
  pdf.setFont(fontName, 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor(textRgb.r, textRgb.g, textRgb.b);
  pdf.text('Faculty Development Program', w / 2, yPos, { align: 'center' });

  // Body Text Replacement
  const issuedDate = cert.issuedAt 
    ? new Date(cert.issuedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) 
    : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  const rawText = template.certificateText
    .replace(/\{\{facultyName\}\}/g, cert.facultyName || cert.user?.name || user?.name || 'Faculty Member')
    .replace(/\{\{courseName\}\}/g, cert.fdpName || cert.fdpProgram?.title || 'Faculty Development Program')
    .replace(/\{\{completionDate\}\}/g, issuedDate)
    .replace(/\{\{score\}\}/g, cert.quizScore || '80')
    .replace(/\{\{certificateId\}\}/g, cert.certificateId || 'N/A')
    .replace(/\{\{instructorName\}\}/g, cert.instructorName || cert.fdpProgram?.instructorName || 'FDP Instructor');

  yPos += 20;
  const lines = rawText.split('\n');

  lines.forEach(line => {
    // Simple bold parser. If a line contains **text**, we make the whole line bold for simplicity in jsPDF,
    // or just render the text. Since precise inline font switching in jsPDF is math heavy, 
    // we'll just check if the line contains bold markers and bold the whole line if it's the faculty name or course name.
    const isBold = line.includes('**');
    const cleanLine = line.replace(/\*\*/g, '');
    
    pdf.setFont(fontName, isBold ? 'bold' : 'normal');
    pdf.setFontSize(isBold ? 18 : 14);
    pdf.setTextColor(textRgb.r, textRgb.g, textRgb.b);
    pdf.text(cleanLine, w / 2, yPos, { align: 'center' });
    yPos += isBold ? 10 : 8;
  });

  // Footer & Signatures
  const footerY = h - 35;
  
  // Left: Verification Info
  pdf.setFont(fontName, 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(150, 150, 150);
  pdf.text('Date Issued', 30, footerY);
  pdf.setTextColor(textRgb.r, textRgb.g, textRgb.b);
  pdf.text(issuedDate, 30, footerY + 5);

  pdf.setTextColor(150, 150, 150);
  pdf.text('Certificate ID', 30, footerY + 12);
  pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.text(cert.certificateId || 'N/A', 30, footerY + 17);

  // Center: QR Code
  if (template.enableQr) {
    try {
      const qrDataUrl = await QRCode.toDataURL(`http://localhost:5173/verify-certificate/${cert.certificateId}`);
      pdf.addImage(qrDataUrl, 'PNG', w / 2 - 15, footerY - 5, 30, 30);
      pdf.setFontSize(7);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Scan to Verify', w / 2, footerY + 28, { align: 'center' });
    } catch (e) {
      console.error("Failed to generate QR:", e);
    }
  }

  // Right: Signatures (Principal, HOD, Coordinator side-by-side)
  const sigWidth = 35;
  const sigHeight = 15;
  
  // Principal: w - 130 to w - 95
  if (sig1) {
    const sig1Format = sig1.startsWith('data:image/svg+xml') ? 'SVG' : 'PNG';
    pdf.addImage(sig1, sig1Format, w - 130, footerY, sigWidth, sigHeight);
  }
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.line(w - 130, footerY + sigHeight + 2, w - 95, footerY + sigHeight + 2);
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Principal', w - 112.5, footerY + sigHeight + 6, { align: 'center' });

  // HOD: w - 90 to w - 55
  if (sig2) {
    const sig2Format = sig2.startsWith('data:image/svg+xml') ? 'SVG' : 'PNG';
    pdf.addImage(sig2, sig2Format, w - 90, footerY, sigWidth, sigHeight);
  }
  pdf.line(w - 90, footerY + sigHeight + 2, w - 55, footerY + sigHeight + 2);
  pdf.text('Head of Dept.', w - 72.5, footerY + sigHeight + 6, { align: 'center' });

  // Coordinator: w - 50 to w - 15
  if (sig3) {
    const sig3Format = sig3.startsWith('data:image/svg+xml') ? 'SVG' : 'PNG';
    pdf.addImage(sig3, sig3Format, w - 50, footerY, sigWidth, sigHeight);
  }
  pdf.line(w - 50, footerY + sigHeight + 2, w - 15, footerY + sigHeight + 2);
  pdf.text('FDP Coordinator', w - 32.5, footerY + sigHeight + 6, { align: 'center' });

  return pdf;
};
