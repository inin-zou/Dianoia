import { Box } from 'lucide-react';

interface MarbleEmbedProps {
  embedUrl: string | null;
}

/**
 * MarbleEmbed renders the Marble (World Labs) 3D world iframe
 * for the "Realistic 3D" view in the Scene module.
 */
export function MarbleEmbed({ embedUrl }: MarbleEmbedProps) {
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

  return (
    <iframe
      src={embedUrl}
      style={{ width: '100%', height: '100%', border: 'none' }}
      allow="xr-spatial-tracking"
      title="Marble 3D World"
    />
  );
}
