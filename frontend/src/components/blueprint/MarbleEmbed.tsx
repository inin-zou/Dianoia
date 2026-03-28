import { Box, ExternalLink } from 'lucide-react';

interface MarbleEmbedProps {
  embedUrl: string | null;
  panoUrl?: string | null;
  thumbnailUrl?: string | null;
}

/**
 * MarbleEmbed shows the Marble 3D world preview.
 * Since Marble blocks iframe embedding, we show the panorama/thumbnail
 * with a button to open the full 3D viewer in a new tab.
 */
export function MarbleEmbed({ embedUrl, panoUrl, thumbnailUrl }: MarbleEmbedProps) {
  if (!embedUrl) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-muted-foreground relative z-10">
          <Box size={40} strokeWidth={1} className="opacity-15" />
          <span className="text-[11px] font-mono font-bold opacity-30 uppercase tracking-widest">
            No Scan Available
          </span>
          <span className="text-[9px] font-mono opacity-20 uppercase tracking-wider">
            Upload a scene image to generate 3D scan
          </span>
        </div>
      </div>
    );
  }

  const previewUrl = panoUrl || thumbnailUrl;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background: panorama or thumbnail */}
      {previewUrl ? (
        <img
          src={previewUrl}
          alt="3D Scene Preview"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
      ) : (
        <div className="absolute inset-0 viewport-frosted" />
      )}

      {/* Overlay with grid effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
      <div className="absolute inset-0 grid-bg-fine pointer-events-none opacity-30" />

      {/* Center: Open in new tab button */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
        <a
          href={embedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-3 glass-strong rounded-md font-mono font-bold text-[11px] uppercase tracking-wider text-foreground interactive hover:bg-white/20 hover:shadow-[0_0_24px_rgba(255,255,255,0.15)]"
        >
          <ExternalLink size={14} />
          Open 3D Viewer
        </a>
        <span className="text-[9px] font-mono text-white/50 tracking-wider">
          MARBLE // WORLD LABS
        </span>
      </div>

      {/* Bottom status */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
        <span className="status-dot" />
        <span className="text-[9px] font-mono font-bold text-white/70 tracking-wider">SCAN_READY</span>
      </div>
    </div>
  );
}
