'use client';

import React, { useMemo } from 'react';
import { X, Play, Video, ExternalLink } from 'lucide-react';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
  title?: string;
  onUpdateUrl?: (newUrl: string) => void;
  isEditMode?: boolean;
}

export function parseYouTubeVideoId(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = trimmed.match(regExp);
  return match && match[1] ? match[1] : null;
}

export function getYouTubeEmbedUrl(url?: string): string | null {
  const videoId = parseYouTubeVideoId(url);
  if (videoId) {
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
  }
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    return url;
  }
  return null;
}

export function getYouTubeThumbnailUrl(url?: string, fallback?: string): string {
  const videoId = parseYouTubeVideoId(url);
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  return fallback || '';
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  title = 'Video Tour & Walkthrough',
  onUpdateUrl,
  isEditMode = false,
}) => {
  const [inputUrl, setInputUrl] = React.useState(videoUrl || '');

  React.useEffect(() => {
    setInputUrl(videoUrl || '');
  }, [videoUrl]);

  const embedUrl = useMemo(() => getYouTubeEmbedUrl(videoUrl || inputUrl), [videoUrl, inputUrl]);
  const videoId = useMemo(() => parseYouTubeVideoId(videoUrl || inputUrl), [videoUrl, inputUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 bg-slate-900/90 text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#ea110d]/20 text-[#ea110d] flex items-center justify-center shrink-0">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-poppins text-white truncate">
                {title}
              </h3>
              <p className="text-[11px] text-slate-400">
                {videoId ? `YouTube Video ID: ${videoId}` : 'HD Video Walkthrough'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {videoUrl && (
              <a
                href={videoUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
                title="Open in YouTube"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>YouTube</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Close video player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Player Container */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="p-8 text-center text-white max-w-md">
              <div className="w-16 h-16 rounded-full bg-[#ea110d]/20 border border-[#ea110d]/40 text-[#ea110d] flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 ml-1" />
              </div>
              <h4 className="text-base font-bold font-poppins">No Video Demo Linked</h4>
              <p className="text-xs text-slate-400 mt-1">
                Enter any YouTube video URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...) to showcase your property walkthrough.
              </p>
            </div>
          )}
        </div>

        {/* Quick URL updater in footer for Admin / Vendor */}
        {(isEditMode || !embedUrl) && (
          <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:flex-1 flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2">
              <Video className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Paste YouTube Video URL (e.g. https://www.youtube.com/watch?v=...)"
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
              />
            </div>
            {onUpdateUrl && (
              <button
                type="button"
                onClick={() => onUpdateUrl(inputUrl.trim())}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#ea110d] hover:bg-red-700 text-white text-xs font-bold font-poppins transition cursor-pointer shrink-0"
              >
                Apply Video Link
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

