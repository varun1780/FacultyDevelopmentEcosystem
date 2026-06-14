import { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Share2,
  Link2,
  Mail,
  MessageCircle,
  QrCode,
  X,
  Check,
  Download,
  Smartphone,
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * ShareFDPModal — a polished share modal for FDP courses.
 *
 * Props:
 *   fdp       – the FDP object (must have at least `id` and `title`)
 *   isOpen    – boolean controlling visibility
 *   onClose   – callback to close the modal
 */
export default function ShareFDPModal({ fdp, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const qrRef = useRef(null);
  const modalRef = useRef(null);

  // Build course URL
  const courseLink = fdp ? `${window.location.origin}/fdp/${fdp.id}` : '';

  // Reset internal state whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setShowQR(false);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Close on click outside modal content
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen || !fdp) return null;

  /* ─── Share actions ──────────────────────────────────── */

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(courseLink);
      setCopied(true);
      toast.success('Course link copied successfully', {
        icon: '🔗',
        style: {
          borderRadius: '12px',
          background: '#1e1b4b',
          color: '#e0e7ff',
        },
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🎓 Check out this FDP Course: *${fdp.title}*\n\n${courseLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`FDP Course: ${fdp.title}`);
    const body = encodeURIComponent(
      `Hi,\n\nI'd like to share this Faculty Development Programme with you:\n\n📚 ${fdp.title}\n🔗 ${courseLink}\n\nBest regards`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: fdp.title,
          text: `Check out this FDP Course: ${fdp.title}`,
          url: courseLink,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          toast.error('Share cancelled');
        }
      }
    } else {
      toast('Native share is not supported on this browser. Use the other options!', {
        icon: 'ℹ️',
      });
    }
  };

  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const a = document.createElement('a');
      a.download = `fdp-${fdp.id}-qr.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
      toast.success('QR code downloaded!', { icon: '📥' });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  /* ─── Share option data ──────────────────────────────── */
  const shareOptions = [
    {
      id: 'copy',
      label: copied ? 'Copied!' : 'Copy Link',
      icon: copied ? Check : Link2,
      onClick: handleCopyLink,
      color: 'from-indigo-500 to-indigo-600',
      hoverColor: 'hover:from-indigo-600 hover:to-indigo-700',
      ring: 'focus-visible:ring-indigo-400',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      onClick: handleWhatsAppShare,
      color: 'from-emerald-500 to-green-600',
      hoverColor: 'hover:from-emerald-600 hover:to-green-700',
      ring: 'focus-visible:ring-emerald-400',
    },
    {
      id: 'email',
      label: 'Email',
      icon: Mail,
      onClick: handleEmailShare,
      color: 'from-orange-500 to-red-500',
      hoverColor: 'hover:from-orange-600 hover:to-red-600',
      ring: 'focus-visible:ring-orange-400',
    },
    {
      id: 'native',
      label: 'More…',
      icon: Smartphone,
      onClick: handleNativeShare,
      color: 'from-purple-500 to-fuchsia-600',
      hoverColor: 'hover:from-purple-600 hover:to-fuchsia-700',
      ring: 'focus-visible:ring-purple-400',
    },
  ];

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={`Share ${fdp.title}`}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up"
      >
        {/* Header — gradient banner */}
        <div className="gradient-bg px-6 pt-6 pb-8 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            aria-label="Close share dialog"
          >
            <X size={18} />
          </button>

          {/* Title area */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
              <Share2 size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-white text-lg font-bold leading-tight">Share FDP Course</h2>
              <p className="text-white/70 text-sm mt-0.5 line-clamp-1">{fdp.title}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* ── URL preview ───────────────── */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2.5">
            <Link2 size={16} className="text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-600 truncate flex-1 select-all">{courseLink}</span>
            <button
              onClick={handleCopyLink}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex-shrink-0 cursor-pointer"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* ── Share option buttons ──────── */}
          <div className="grid grid-cols-2 gap-3">
            {shareOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={opt.onClick}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r ${opt.color} ${opt.hoverColor} text-white font-medium text-sm shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 ${opt.ring} cursor-pointer`}
                >
                  <Icon size={18} />
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* ── QR Code toggle ────────────── */}
          <div>
            <button
              onClick={() => setShowQR((v) => !v)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-gray-300 text-sm font-medium text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors cursor-pointer"
            >
              <QrCode size={16} />
              {showQR ? 'Hide QR Code' : 'Show QR Code'}
            </button>

            {showQR && (
              <div className="mt-4 flex flex-col items-center gap-3 animate-slide-up">
                <div
                  ref={qrRef}
                  className="bg-white p-4 rounded-2xl shadow-inner border border-gray-100"
                >
                  <QRCodeSVG
                    value={courseLink}
                    size={180}
                    bgColor="#ffffff"
                    fgColor="#312e81"
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <p className="text-xs text-gray-400">Scan to open this course</p>
                <button
                  onClick={handleDownloadQR}
                  className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors cursor-pointer"
                >
                  <Download size={14} />
                  Download QR
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * A small "Share" button you can drop into any card or page.
 *
 * Usage:
 *   <ShareFDPButton fdp={fdp} />
 */
export function ShareFDPButton({ fdp, className = '', size = 'md' }) {
  const [open, setOpen] = useState(false);

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-sm gap-2',
  };

  const iconSizes = { sm: 14, md: 16, lg: 18 };

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={`inline-flex items-center ${sizes[size]} bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.97] cursor-pointer ${className}`}
        title="Share this FDP course"
      >
        <Share2 size={iconSizes[size]} />
        Share
      </button>
      <ShareFDPModal fdp={fdp} isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
