import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { WireframePlane } from '@/components/landing/WireframePlane';

const menuItems = [
  { id: '01', name: 'SCENE_RECONSTRUCTION', type: 'R3F', desc: 'Crime scene 3D blueprint & evidence' },
  { id: '02', name: 'EVIDENCE_ANALYSIS', type: 'LLM', desc: 'AI-powered reasoning & hypotheses' },
  { id: '03', name: 'TIMELINE_PLAYBACK', type: 'ANM', desc: 'Temporal reconstruction of events' },
  { id: '04', name: 'SUSPECT_PROFILING', type: 'GEN', desc: 'Iterative composite generation' },
  { id: '05', name: 'CASE_DATABASE', type: 'DB', desc: 'Supabase real-time case management' },
  { id: '06', name: 'ENTER_SYSTEM', type: 'SYS', desc: 'Launch investigation interface' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('06');
  const [hovered, setHovered] = useState<string | null>(null);

  const handleItemClick = (id: string) => {
    setActiveItem(id);
    if (id === '06') {
      navigate('/app');
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex items-center justify-center"
      style={{ backgroundColor: '#051433', cursor: 'crosshair' }}
    >
      {/* Main viewport container */}
      <div className="relative w-full h-full max-w-[1440px] max-h-[1024px] overflow-hidden border border-white/20"
        style={{
          background: 'radial-gradient(circle at center, #FFFFFF 0%, #0D2B6E 100%)',
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: 'calc(100vw / 24) calc(100vw / 24)',
        }}
      >
        {/* Structural background type — "DN01" */}
        <div className="absolute bottom-[4%] left-0 w-full h-[35%] flex justify-between px-[4%] pointer-events-none z-[1] opacity-20">
          {/* D */}
          <div className="relative h-full" style={{ width: 'calc(100vw / 6)' }}>
            <div className="absolute top-0 left-0 h-full bg-white" style={{ width: '35%' }} />
            <div className="absolute top-0 left-0 w-full bg-white" style={{ height: '25%', borderRadius: '0 2vw 0 0' }} />
            <div className="absolute bottom-0 left-0 w-full bg-white" style={{ height: '25%', borderRadius: '0 0 2vw 0' }} />
            <div className="absolute right-0 bg-white" style={{ top: '25%', width: '35%', height: '50%', borderRadius: '1vw 0 0 1vw' }} />
          </div>
          {/* N */}
          <div className="relative h-full" style={{ width: 'calc(100vw / 6)' }}>
            <div className="absolute top-0 left-0 h-full bg-white" style={{ width: '30%' }} />
            <div className="absolute top-0 right-0 h-full bg-white" style={{ width: '30%' }} />
            <div className="absolute top-0 left-[15%] bg-white" style={{ width: '70%', height: '100%', clipPath: 'polygon(0 0, 35% 0, 100% 100%, 65% 100%)' }} />
          </div>
          {/* 0 */}
          <div className="relative h-full" style={{ width: 'calc(100vw / 6)' }}>
            <div className="absolute top-0 left-0 h-full bg-white" style={{ width: '30%', borderRadius: '2vw 0 0 2vw' }} />
            <div className="absolute top-0 left-0 w-full bg-white" style={{ height: '25%' }} />
            <div className="absolute bottom-0 left-0 w-full bg-white" style={{ height: '25%' }} />
            <div className="absolute top-0 right-0 h-full bg-white" style={{ width: '30%', borderRadius: '0 2vw 2vw 0' }} />
          </div>
          {/* 1 */}
          <div className="relative h-full" style={{ width: 'calc(100vw / 6)' }}>
            <div className="absolute top-0 left-0 bg-white" style={{ width: '60%', height: '25%', clipPath: 'polygon(0 100%, 100% 0, 100% 100%)' }} />
            <div className="absolute top-0 right-0 h-full bg-white" style={{ width: '30%' }} />
          </div>
        </div>

        {/* Top-left: Meta panel */}
        <div className="absolute top-0 left-0 z-10 backdrop-blur-xl bg-white/10 border-r border-b border-white/20"
          style={{ width: 'clamp(200px, 18vw, 300px)' }}
        >
          <div className="px-4 py-3 border-b border-white/20">
            <h1 className="font-mono font-extrabold text-white text-[clamp(14px,1.3vw,22px)] tracking-wider leading-none">
              DIANOIA<span className="text-[0.5em] align-top ml-0.5 opacity-60">TM</span>
            </h1>
          </div>
          <ul className="font-mono text-white">
            <li className="text-[clamp(8px,0.65vw,11px)] font-bold tracking-wide uppercase px-4 py-2 border-b border-white/10">
              DIR: CRIME/INVESTIGATION
            </li>
            <li className="text-[clamp(8px,0.65vw,11px)] font-bold tracking-wide uppercase px-4 py-2 border-b border-white/10">
              CLASS: AI_RECONSTRUCTION
            </li>
            <li className="text-[clamp(8px,0.65vw,11px)] font-bold tracking-wide uppercase px-4 py-2 border-b border-white/10">
              STATE: AWAITING_INPUT
            </li>
            <li className="text-[clamp(8px,0.65vw,11px)] font-bold tracking-wide uppercase px-4 py-2">
              BUILD: HACKATHON_v0.1
            </li>
          </ul>
        </div>

        {/* Top-right: Logo SVG */}
        <div className="absolute top-0 right-0 z-10 backdrop-blur-xl bg-white/10 border-l border-b border-white/20 flex items-center justify-center"
          style={{ width: 'clamp(160px, 14vw, 240px)', height: 'clamp(80px, 7vw, 120px)' }}
        >
          <svg className="w-[75%] h-auto" viewBox="0 0 180 40" xmlns="http://www.w3.org/2000/svg">
            <g stroke="white" strokeWidth="5" fill="none" strokeLinejoin="miter" strokeMiterlimit={4}>
              {/* D */}
              <path d="M 5 35 L 5 5 L 25 5 Q 35 5 35 20 Q 35 35 25 35 Z" />
              {/* N */}
              <path d="M 45 35 L 45 5 L 70 35 L 70 5" />
              {/* 0 */}
              <ellipse cx="95" cy="20" rx="15" ry="15" />
              {/* 1 */}
              <path d="M 120 10 L 130 5 L 130 35" />
            </g>
          </svg>
        </div>

        {/* Center-left: Node index menu */}
        <div className="absolute z-20 backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl"
          style={{
            top: 'clamp(180px, 22%, 260px)',
            left: 'clamp(40px, 4%, 80px)',
            width: 'clamp(240px, 22vw, 380px)',
          }}
        >
          <div className="flex items-center justify-between px-4 py-2 bg-white/10 border-b border-white/20">
            <span className="font-mono text-white text-[clamp(9px,0.7vw,12px)] font-bold tracking-wider">// SYSTEM_MODULES</span>
            <span className="font-mono text-white text-[clamp(9px,0.7vw,12px)] font-bold">[NAV]</span>
          </div>
          <ul>
            {menuItems.map((item) => (
              <li
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                onMouseEnter={() => setHovered(item.id)}
                onMouseLeave={() => setHovered(null)}
                className={`flex items-center px-4 py-3 border-b border-white/10 cursor-pointer transition-colors duration-200 ${
                  activeItem === item.id ? 'bg-white/20' : 'hover:bg-white/15'
                }`}
              >
                <span className="font-mono text-white/60 font-bold text-[clamp(9px,0.65vw,11px)] w-6">{item.id}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-white text-[clamp(9px,0.65vw,11px)] font-medium">{item.name}</span>
                  {(hovered === item.id || activeItem === item.id) && (
                    <p className="font-mono text-white/50 text-[clamp(7px,0.5vw,9px)] mt-0.5 animate-fade-in">{item.desc}</p>
                  )}
                </div>
                <span className="font-mono text-white/70 text-[clamp(7px,0.5vw,9px)] border border-white/40 px-1.5 py-0.5 ml-2 shrink-0">
                  {item.type}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Center-right: 3D Viewer */}
        <div className="absolute z-15 backdrop-blur-sm bg-white/5 border border-white/20 shadow-2xl flex flex-col"
          style={{
            top: 'clamp(100px, 12%, 180px)',
            right: 'clamp(40px, 4%, 80px)',
            width: 'clamp(400px, 55vw, 840px)',
            height: 'clamp(350px, 55vh, 600px)',
          }}
        >
          {/* Viewer header */}
          <div className="flex items-center justify-between px-4 h-8 bg-white/5 border-b border-white/20 shrink-0">
            <span className="font-mono text-white text-[clamp(8px,0.6vw,10px)]">/dianoia/scene_reconstruction/preview</span>
            <span className="font-mono text-white text-[clamp(8px,0.6vw,10px)]">VIEWER_ACTIVE</span>
          </div>

          {/* Three.js canvas */}
          <div className="flex-1 relative overflow-hidden"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
            }}
          >
            <Canvas
              camera={{ position: [0, 10, 25], fov: 45 }}
              style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.15))' }}
            >
              <WireframePlane />
            </Canvas>
          </div>

          {/* Viewer footer */}
          <div className="flex items-center justify-between px-4 h-8 bg-white/5 border-t border-white/20 shrink-0">
            <span className="font-mono text-white text-[clamp(8px,0.6vw,10px)] flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-status-blink" />
              RENDERING
            </span>
            <span className="font-mono text-white/60 text-[clamp(8px,0.6vw,10px)]">R3F // THREE.js r128</span>
          </div>
        </div>

        {/* Bottom-right: Enter button */}
        <div className="absolute bottom-[4%] right-[4%] z-20">
          <button
            onClick={() => navigate('/app')}
            className="group backdrop-blur-xl bg-white/10 border border-white/30 px-6 py-3 font-mono font-bold text-white text-[clamp(10px,0.8vw,14px)] uppercase tracking-[0.15em] transition-all duration-300 hover:bg-white/25 hover:border-white/50 hover:shadow-[0_0_24px_rgba(255,255,255,0.15)]"
          >
            <span className="flex items-center gap-3">
              <span className="inline-block w-2 h-2 rounded-full bg-white animate-status-blink" />
              ENTER_INVESTIGATION
              <span className="text-white/40 group-hover:text-white/80 transition-colors">&rarr;</span>
            </span>
          </button>
        </div>

        {/* Bottom-left: build info */}
        <div className="absolute bottom-[4%] left-[4%] z-10">
          <p className="font-mono text-white/30 text-[clamp(7px,0.5vw,9px)] tracking-wider">
            DIANOIA v0.1 // TECHEUROPE STOCKHOLM 2026 // OPEN_SOURCE_PALANTIR
          </p>
        </div>
      </div>
    </div>
  );
}
