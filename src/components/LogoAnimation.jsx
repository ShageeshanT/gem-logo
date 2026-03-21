import { motion, useAnimationControls } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { GEM_GROUPS } from './gemPaths';
import './LogoAnimation.css';

const BORDER_ID = 'gray-border';
const LOOP_DURATION = 120_000;
const HOLD_DURATION = 1500;

const FLIGHT_ORIGINS = {
  'crown-red':          { x: 0,     y: -2500 },
  'upper-left-pink':    { x: -2200, y: -1800 },
  'upper-right-orange': { x: 2200,  y: -1800 },
  'bottom-right-yellow':{ x: 2000,  y: 2000  },
  'bottom-green':       { x: 0,     y: 2500  },
  'bottom-left-teal':   { x: -2000, y: 2000  },
  'center-blue':        { x: 0,     y: 0     },
  'left-purple':        { x: -2500, y: 500   },
  'left-magenta':       { x: -2200, y: -800  },
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

  const animateIn = useCallback(async () => {
    setGlowing(false);
    setShining(false);

    const promises = ANIM_ORDER.map((pieceId, i) => {
      const origin = FLIGHT_ORIGINS[pieceId] || { x: 0, y: -2500 };
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
    shineControls.set({ y: '-150%' });
    shineControls.start({
      y: '150%',
      transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 },
    });
    await new Promise(r => setTimeout(r, HOLD_DURATION));
    setGlowing(false);
    setShining(false);
  }, [shineControls]);

  const animateOut = useCallback(async () => {
    const promises = REVERSE_ORDER.map((pieceId, i) => {
      const origin = FLIGHT_ORIGINS[pieceId] || { x: 0, y: -2500 };
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
      <div className={`logo-sizer ${glowing ? 'glow-active' : ''}`}>
        {ANIM_ORDER.map((pieceId) => {
          const group = gemPieces.find(g => g.id === pieceId);
          if (!group) return null;

          return (
            <GemPiece
              key={group.id}
              group={group}
              pieceId={pieceId}
              controlsMap={controlsMap}
            />
          );
        })}

        {shining && (
          <motion.div className="shine-line" animate={shineControls} />
        )}
      </div>
    </div>
  );
}

function GemPiece({ group, pieceId, controlsMap }) {
  const controls = useAnimationControls();
  const origin = FLIGHT_ORIGINS[pieceId] || { x: 0, y: -2500 };
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
    <motion.div className="gem-piece" animate={controls}>
      <svg
        viewBox="0 0 1288 2000"
        xmlns="http://www.w3.org/2000/svg"
        className="gem-piece-svg"
      >
        <defs>
          <filter id={`expand-${group.id}`}>
            <feMorphology operator="dilate" radius="4" />
          </filter>
          <mask id={`mask-${group.id}`}>
            <rect width="1288" height="2000" fill="black" />
            <g filter={`url(#expand-${group.id})`}>
              {group.paths.map((p, i) => (
                <path key={i} d={p.d} fill="white" />
              ))}
            </g>
          </mask>
        </defs>
        <g mask={`url(#mask-${group.id})`}>
          <image
            href="/logo.png"
            x="0"
            y="0"
            width="1288"
            height="2000"
          />
        </g>
      </svg>
    </motion.div>
  );
}
