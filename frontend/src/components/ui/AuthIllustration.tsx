import React from 'react';
// Removed static YssLogo import

export type AuthIllustrationProps = React.HTMLAttributes<HTMLDivElement>;

const SERVICES = [
  { label: 'HRMS',      icon: '👥', angle: 0,   radius: 255 },
  { label: 'POS',       icon: '🛒', angle: 60,  radius: 200 },
  { label: 'Pharmacy',  icon: '💊', angle: 120, radius: 155 },
  { label: 'Inventory', icon: '📦', angle: 180, radius: 255 },
  { label: 'CRM',       icon: '🤝', angle: 240, radius: 200 },
  { label: 'Analytics', icon: '📊', angle: 300, radius: 155 },
];

const R = 200, CX = 260, CY = 260;

export const AuthIllustration: React.FC<AuthIllustrationProps> = ({ style, ...props }) => {
  return (
    <div style={{ position: 'relative', overflow: 'visible', ...style }} {...props}>
      <div className="relative w-full h-full aspect-square max-w-[520px] max-h-[520px] mx-auto animate-in fade-in zoom-in-95 duration-1000 delay-500 fill-mode-both" style={{ pointerEvents: 'auto' }}>
        {/* We use 520x520 as the coordinate system but it scales via responsive CSS */}
        <svg viewBox="0 0 520 520" className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="ai-rg1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#6366f1" stopOpacity="1" />
              <stop offset="50%"  stopColor="#a78bfa" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="ai-rg2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#f59e0b" stopOpacity="1" />
              <stop offset="50%"  stopColor="#f97316" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="ai-rg3" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#10b981" stopOpacity="1" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" className="text-blue-500" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" className="text-indigo-500" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Multiple concentric tracks for a deep 3D ecosystem feel */}
          <circle cx={CX} cy={CY} r={R} stroke="url(#ai-rg1)" strokeWidth="1.5" strokeDasharray="4 8" fill="none" opacity="0.85"/>
          <circle cx={CX} cy={CY} r={R - 45} stroke="url(#ai-rg2)" strokeWidth="1.5" strokeDasharray="2 6" fill="none" opacity="0.85"/>
          <circle cx={CX} cy={CY} r={R + 55} stroke="url(#ai-rg3)" strokeWidth="1.5" fill="none" opacity="0.85"/>
          
          {/* Glowing data particles orbiting the tracks */}
          <circle cx={CX + R} cy={CY} r="3.5" className="fill-blue-500" filter="url(#glow)">
            <animateTransform attributeName="transform" type="rotate" from={`0 ${CX} ${CY}`} to={`360 ${CX} ${CY}`} dur="25s" repeatCount="indefinite" />
          </circle>
          <circle cx={CX - R + 45} cy={CY} r="3" className="fill-indigo-400" filter="url(#glow)">
            <animateTransform attributeName="transform" type="rotate" from={`360 ${CX} ${CY}`} to={`0 ${CX} ${CY}`} dur="35s" repeatCount="indefinite" />
          </circle>
          <circle cx={CX} cy={CY - R - 55} r="4" className="fill-purple-500" filter="url(#glow)">
            <animateTransform attributeName="transform" type="rotate" from={`0 ${CX} ${CY}`} to={`360 ${CX} ${CY}`} dur="50s" repeatCount="indefinite" />
          </circle>

          {/* Connecting data lines */}
          {SERVICES.map(s => {
            const rad = (s.angle*Math.PI)/180;
            const startR = 60;
            return (
              <line 
                key={s.label} 
                x1={CX+startR*Math.cos(rad)} 
                y1={CY+startR*Math.sin(rad)} 
                x2={CX+s.radius*Math.cos(rad)} 
                y2={CY+s.radius*Math.sin(rad)} 
                stroke="url(#lineGrad)"
                strokeWidth="1.5" 
                strokeDasharray="4 4"
              />
            );
          })}
          
          {/* Glowing inner hub */}
          <circle cx={CX} cy={CY} r={56} className="stroke-primary/40 fill-transparent" strokeWidth="1.5" filter="drop-shadow(0 0 25px rgba(59,130,246,0.25))"/>
          
          {/* Double pulsing radar rings */}
          <circle cx={CX} cy={CY} r={56} className="stroke-primary" strokeWidth="2" fill="none" opacity=".5">
            <animate attributeName="r" from="56" to="115" dur="3.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from=".5" to="0" dur="3.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx={CX} cy={CY} r={56} className="stroke-indigo-400" strokeWidth="1.5" fill="none" opacity=".3">
            <animate attributeName="r" from="56" to="85" dur="3.5s" begin="1.75s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from=".4" to="0" dur="3.5s" begin="1.75s" repeatCount="indefinite"/>
          </circle>
          
          {/* Center Logo */}
          <foreignObject x={CX - 36} y={CY - 36} width="72" height="72">
            <img src="/images/branding/YSS_Logo.png" alt="YSS Orbit" className="w-full h-full object-contain" />
          </foreignObject>
          <style>{`
            @keyframes hero-orbit { to { transform: rotate(360deg); } }
            @keyframes hero-orbit-r { to { transform: rotate(-360deg); } }
          `}</style>
        </svg>
        
        {/* Rotating Orbit Nodes */}
        <div className="absolute inset-0 rounded-full" style={{ animation: 'hero-orbit 120s linear infinite' }}>
          {SERVICES.map(s => {
            const rad = (s.angle*Math.PI)/180;
            // Use percentage based coordinates to ensure it scales correctly down to mobile/small screens
            // Since viewBox is 520x520, coordinates need to be mapped to percentages
            const topPct = ((CY + s.radius * Math.sin(rad)) / 520) * 100;
            const leftPct = ((CX + s.radius * Math.cos(rad)) / 520) * 100;

            return (
              <div 
                key={s.label} 
                style={{ top: `${topPct}%`, left: `${leftPct}%` }} 
                className="absolute -translate-x-1/2 -translate-y-1/2"
              >
                <div 
                  style={{ animation: 'hero-orbit-r 120s linear infinite' }}
                  className="py-1.5 px-3 md:py-2.5 md:px-4 rounded-xl md:rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-white/10 flex items-center gap-1.5 md:gap-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] whitespace-nowrap transition-all duration-300 hover:scale-110 hover:shadow-[0_8px_30px_rgba(59,130,246,0.2)] hover:border-primary/30 cursor-default"
                >
                  <span className="text-[1rem] md:text-[1.2rem]">{s.icon}</span>
                  <span className="text-[0.7rem] md:text-[0.85rem] font-sans font-semibold text-foreground">{s.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
