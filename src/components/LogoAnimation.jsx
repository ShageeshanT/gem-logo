import { motion, useAnimationControls } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { GEM_GROUPS } from './gemPaths';
import './LogoAnimation.css';

const BORDER_ID = 'gray-border';
const LOOP_DURATION = 120_000;
const HOLD_DURATION = 1500;

const FLIGHT_ORIGINS = {
  'crown-red':          { x: 0,     y: -5000 },
  'upper-left-pink':    { x: -4500, y: -3500 },
  'upper-right-orange': { x: 4500,  y: -3500 },
  'bottom-right-yellow':{ x: 4000,  y: 3800  },
  'bottom-green':       { x: 0,     y: 5000  },
  'bottom-left-teal':   { x: -4000, y: 3800  },
  'center-blue':        { x: 0,     y: 0     },
  'left-purple':        { x: -5000, y: 1000  },
  'left-magenta':       { x: -4500, y: -1500 },
};

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

const REVERSE_ORDER = [...ANIM_ORDER].reverse();

export default function LogoAnimation() {
  const [glowing, setGlowing] = useState(false);
  const [shining, setShining] = useState(false);
  const shineControls = useAnimationControls();
  const startTime = useRef(Date.now());
  const controlsMap = useRef({});

  const gemPieces = GEM_GROUPS.filter(g => g.id !== BORDER_ID);

  ANIM_ORDER.forEach(id => {
    if (!controlsMap.current[id]) {
      controlsMap.current[id] = null;
    }
  });

  const animateIn = useCallback(async () => {
    setGlowing(false);

    const promises = ANIM_ORDER.map((pieceId, i) => {
      const origin = FLIGHT_ORIGINS[pieceId] || { x: 0, y: -5000 };
      const isCenter = pieceId === 'center-blue';
      const delay = i * 0.07;
      const ctrl = controlsMap.current[pieceId];
      if (!ctrl) return Promise.resolve();

      ctrl.set({
        x: origin.x,
        y: origin.y,
        opacity: 0,
        scale: isCenter ? 0 : 0.5,
      });

      return ctrl.start({
        x: 0,
        y: 0,
        opacity: 1,
        scale: 1,
        transition: {
          x: { type: 'tween', ease: [0.12, 1, 0.25, 1], duration: 1.8, delay },
          y: { type: 'tween', ease: [0.12, 1, 0.25, 1], duration: 1.8, delay },
          scale: { type: 'tween', ease: [0.12, 1, 0.25, 1], duration: 1.8, delay },
          opacity: { duration: 0.25, ease: 'easeOut', delay },
        },
      });
    });

    await Promise.all(promises);

    setGlowing(true);
    setShining(true);
    // Reset shine to top then sweep down
    shineControls.set({ y: -400 });
    shineControls.start({
      y: 2400,
      transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 },
    });
    await new Promise(r => setTimeout(r, HOLD_DURATION));
    setGlowing(false);
    setShining(false);
  }, []);

  const animateOut = useCallback(async () => {
    const promises = REVERSE_ORDER.map((pieceId, i) => {
      const origin = FLIGHT_ORIGINS[pieceId] || { x: 0, y: -5000 };
      const isCenter = pieceId === 'center-blue';
      const delay = i * 0.06;
      const ctrl = controlsMap.current[pieceId];
      if (!ctrl) return Promise.resolve();

      return ctrl.start({
        x: origin.x,
        y: origin.y,
        opacity: 0,
        scale: isCenter ? 0 : 0.5,
        transition: {
          x: { type: 'tween', ease: [0.6, 0, 0.85, 0.15], duration: 1.4, delay },
          y: { type: 'tween', ease: [0.6, 0, 0.85, 0.15], duration: 1.4, delay },
          scale: { type: 'tween', ease: [0.6, 0, 0.85, 0.15], duration: 1.4, delay },
          opacity: { duration: 0.3, ease: 'easeIn', delay: delay + 0.8 },
        },
      });
    });

    await Promise.all(promises);
    await new Promise(r => setTimeout(r, 400));
  }, []);

  const runLoop = useCallback(async () => {
    while (Date.now() - startTime.current < LOOP_DURATION) {
      await animateIn();
      if (Date.now() - startTime.current >= LOOP_DURATION) break;
      await animateOut();
    }
    await animateIn();
  }, [animateIn, animateOut]);

  useEffect(() => {
    const timer = setTimeout(() => runLoop(), 100);
    return () => clearTimeout(timer);
  }, [runLoop]);

  return (
    <div className="logo-container">
      <div className="logo-sizer">
        <svg
          className={`gem-svg ${glowing ? 'glow-active' : ''}`}
          viewBox="0 0 1288 2000"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {gemPieces.map(group => (
              <clipPath key={`clip-${group.id}`} id={`clip-${group.id}`}>
                {group.paths.map((p, i) => (
                  <path key={i} d={p.d} />
                ))}
              </clipPath>
            ))}

            {/* Full gem clip for the shine line */}
            <clipPath id="clip-full-gem">
              {gemPieces.flatMap(group =>
                group.paths.map((p, i) => (
                  <path key={`${group.id}-${i}`} d={p.d} />
                ))
              )}
            </clipPath>

            {/* Thin reflective line gradient */}
            <linearGradient id="shine-line-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="40%" stopColor="white" stopOpacity="0" />
              <stop offset="48%" stopColor="white" stopOpacity="0.4" />
              <stop offset="50%" stopColor="white" stopOpacity="1" />
              <stop offset="52%" stopColor="white" stopOpacity="0.4" />
              <stop offset="60%" stopColor="white" stopOpacity="0" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>

          {ANIM_ORDER.map((pieceId) => {
            const group = gemPieces.find(g => g.id === pieceId);
            if (!group) return null;

            return (
              <PieceGroup
                key={group.id}
                group={group}
                pieceId={pieceId}
                controlsMap={controlsMap}
              />
            );
          })}

          {/* Shine line — horizontal bar sweeping top to bottom, clipped to gem */}
          {shining && (
            <g clipPath="url(#clip-full-gem)">
              <motion.rect
                x={0}
                width={1288}
                height={120}
                fill="url(#shine-line-grad)"
                animate={shineControls}
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

function PieceGroup({ group, pieceId, controlsMap }) {
  const controls = useAnimationControls();
  const origin = FLIGHT_ORIGINS[pieceId] || { x: 0, y: -5000 };
  const isCenter = pieceId === 'center-blue';

  useEffect(() => {
    controlsMap.current[pieceId] = controls;
    controls.set({
      x: origin.x,
      y: origin.y,
      opacity: 0,
      scale: isCenter ? 0 : 0.5,
    });
  }, [controls, controlsMap, pieceId, origin.x, origin.y, isCenter]);

  return (
    <motion.g
      clipPath={`url(#clip-${group.id})`}
      animate={controls}
    >
      <image
        href="/logo.png"
        x="0"
        y="0"
        width="1288"
        height="2000"
      />
    </motion.g>
  );
}
