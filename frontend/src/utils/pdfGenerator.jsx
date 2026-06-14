import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import React from 'react';
import { createRoot } from 'react-dom/client';
import CertificateTemplate from '../components/CertificateTemplate';

export const generateNativePDF = async (cert, user, templateStr) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if the certificate is currently being previewed on screen
      let element = document.getElementById('certificate-export-container');
      let isOffscreenRender = false;
      let root = null;
      let container = null;

      // If it's not on screen, we MUST render it invisibly to capture it
      if (!element) {
        if (!cert) {
           throw new Error("No certificate data provided to render off-screen");
        }
        isOffscreenRender = true;
        container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '-9999px';
        container.style.left = '-9999px';
        container.style.width = '1123px';
        container.style.height = '794px';
        document.body.appendChild(container);

        root = createRoot(container);
        
        // Render it
        await new Promise((res) => {
           root.render(
             <div id="certificate-export-container-hidden">
               <CertificateTemplate cert={cert} user={user} templateSettings={templateStr} />
             </div>
           );
           // Give React a tick to mount
           setTimeout(res, 500);
        });

        element = document.getElementById('certificate-export-container-hidden');
      }

      // Capture the element
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (documentClone) => {
            // Optional: modify the cloned DOM just before capture if needed
            // Ensure no transforms interfere if it was an on-screen preview inside a scaled wrapper
            const clonedEl = documentClone.getElementById(element.id);
            if (clonedEl) {
               clonedEl.style.transform = 'none';
               clonedEl.style.zoom = '1';
            }
        }
      });

      // Generate PDF using exact image dimensions
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1123, 794]
      });

      // Export as PNG with highest quality
      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, 1123, 794);

      // Cleanup off-screen render if used
      if (isOffscreenRender) {
         root.unmount();
         document.body.removeChild(container);
      }

      resolve(pdf);
    } catch (err) {
      console.error("PDF Generation failed:", err);
      reject(err);
    }
  });
};
