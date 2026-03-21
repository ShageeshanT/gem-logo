import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { GEM_GROUPS } from './gemPaths';
import './LogoAnimation.css';

const BORDER_ID = 'gray-border';

// Direction each piece flies in from (screen edges)
const FLIGHT_ORIGINS = {
  'crown-red':          { x: 0,     y: -1400 },
  'upper-left-pink':    { x: -1300, y: -900  },
  'upper-right-orange': { x: 1300,  y: -900  },
  'bottom-right-yellow':{ x: 1200,  y: 1000  },
  'bottom-green':       { x: 0,     y: 1400  },
  'bottom-left-teal':   { x: -1200, y: 1000  },
  'center-blue':        { x: 0,     y: 0     },
  'left-purple':        { x: -1400, y: 300   },
  'left-magenta':       { x: -1300, y: -400  },
};

// Animation order — center blue comes last
const ANIM_ORDER = [
  'crown-red',
  'upper-right-orange',
  'left-magenta',
  'bottom-right-yellow',
  'upper-left-pink',
  'bottom-left-teal',
  'left-purple',
  'bottom-green',
  'center-blue',
];

export default function LogoAnimation() {
  const [phase, setPhase] = useState('assembling');

  const borderGroup = GEM_GROUPS.find(g => g.id === BORDER_ID);
  const gemPieces = GEM_GROUPS.filter(g => g.id !== BORDER_ID);

  const handleLastDone = () => {
    setPhase('glowing');
    setTimeout(() => setPhase('settled'), 900);
  };

  return (
    <div className="logo-container">
      <div className="logo-sizer">
        {/* SVG animation layer */}
        <svg
          className={`gem-svg ${phase === 'glowing' ? 'glow-active' : ''} ${phase === 'settled' ? 'glow-settled' : ''}`}
          viewBox="0 0 1288 2000"
          xmlns="http://www.w3.org/2000/svg"
          style={{ opacity: phase === 'settled' ? 0 : 1 }}
        >
          {/* Gem pieces fly in */}
          {ANIM_ORDER.map((pieceId, orderIndex) => {
            const group = gemPieces.find(g => g.id === pieceId);
            if (!group) return null;
            const origin = FLIGHT_ORIGINS[pieceId] || { x: 0, y: -1200 };
            const isCenter = pieceId === 'center-blue';
            const isLast = orderIndex === ANIM_ORDER.length - 1;
            const delay = orderIndex * 0.055;

            return (
              <motion.g
                key={group.id}
                initial={{
                  x: origin.x,
                  y: origin.y,
                  opacity: 0,
                  scale: isCenter ? 0 : 0.7,
                }}
                animate={{
                  x: 0,
                  y: 0,
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  type: 'tween',
                  ease: [0.25, 1, 0.35, 1],
                  duration: 1,
                  delay: delay,
                }}
                onAnimationComplete={isLast ? handleLastDone : undefined}
              >
                {group.paths.map((p, i) => (
                  <path
                    key={i}
                    fill={p.fill}
                    d={p.d}
                    stroke={p.fill}
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                ))}
              </motion.g>
            );
          })}

          {/* Gray border is baked into the final PNG — not needed here */}
        </svg>

        {/* Final PNG — fades in after assembly for pixel-perfect result */}
        <motion.img
          className="final-logo"
          src="/logo.png"
          alt="Gem Logo"
          draggable={false}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'settled' ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}
