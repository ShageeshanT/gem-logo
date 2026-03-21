import { motion, useAnimationControls } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import './LogoAnimation.css';

const PIECES = [
  { id: 'crown',              src: '/Crown.png',              from: { x: 0,     y: -2500 } },
  { id: 'upper-left',         src: '/Upper-left.png',         from: { x: -2200, y: -1800 } },
  { id: 'upper-right',        src: '/Upper-right.png',        from: { x: 2200,  y: -1800 } },
  { id: 'right-orange',       src: '/Right-orange.png',       from: { x: 2500,  y: 500   } },
  { id: 'left-magenta',       src: '/Left-magenta.png',       from: { x: -2200, y: -800  } },
  { id: 'left-purple',        src: '/Left-purple.png',        from: { x: -2500, y: 800   } },
  { id: 'bottom-left-teal',   src: '/Bottom-left-teal.png',   from: { x: -2000, y: 2000  } },
  { id: 'bottom-green',       src: '/Bottom-green.png',       from: { x: 0,     y: 2500  } },
  { id: 'bottom-right-yellow',src: '/Bottom-right-yellow.png',from: { x: 2000,  y: 2000  } },
  { id: 'center',             src: '/Center.png',             from: { x: 0,     y: 0     } },
];

const ANIM_ORDER = [
  'crown', 'upper-right', 'left-magenta', 'bottom-right-yellow',
  'upper-left', 'bottom-left-teal', 'left-purple', 'right-orange',
  'bottom-green', 'center',
];

const REVERSE_ORDER = [...ANIM_ORDER].reverse();

const LOOP_DURATION = 120_000;
const HOLD_DURATION = 1500;

export default function LogoAnimation() {
  const [glowing, setGlowing] = useState(false);
  const [shining, setShining] = useState(false);
  const shineControls = useAnimationControls();
  const startTime = useRef(Date.now());
  const controlsMap = useRef({});

  const animateIn = useCallback(async () => {
    setGlowing(false);
    setShining(false);

    const promises = ANIM_ORDER.map((pieceId, i) => {
      const piece = PIECES.find(p => p.id === pieceId);
      if (!piece) return Promise.resolve();
      const isCenter = pieceId === 'center';
      const delay = i * 0.07;
      const ctrl = controlsMap.current[pieceId];
      if (!ctrl) return Promise.resolve();

      ctrl.set({
        x: piece.from.x,
        y: piece.from.y,
        opacity: 0,
        scale: isCenter ? 0 : 0.5,
      });

      return ctrl.start({
        x: 0, y: 0, opacity: 1, scale: 1,
        transition: {
          x:       { type: 'tween', ease: [0.12, 1, 0.25, 1], duration: 1.8, delay },
          y:       { type: 'tween', ease: [0.12, 1, 0.25, 1], duration: 1.8, delay },
          scale:   { type: 'tween', ease: [0.12, 1, 0.25, 1], duration: 1.8, delay },
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
      const piece = PIECES.find(p => p.id === pieceId);
      if (!piece) return Promise.resolve();
      const isCenter = pieceId === 'center';
      const delay = i * 0.06;
      const ctrl = controlsMap.current[pieceId];
      if (!ctrl) return Promise.resolve();

      return ctrl.start({
        x: piece.from.x, y: piece.from.y,
        opacity: 0,
        scale: isCenter ? 0 : 0.5,
        transition: {
          x:       { type: 'tween', ease: [0.6, 0, 0.85, 0.15], duration: 1.4, delay },
          y:       { type: 'tween', ease: [0.6, 0, 0.85, 0.15], duration: 1.4, delay },
          scale:   { type: 'tween', ease: [0.6, 0, 0.85, 0.15], duration: 1.4, delay },
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
        {PIECES.map((piece) => (
          <GemPiece
            key={piece.id}
            piece={piece}
            controlsMap={controlsMap}
          />
        ))}

        {shining && (
          <motion.div className="shine-line" animate={shineControls} />
        )}
      </div>
    </div>
  );
}

function GemPiece({ piece, controlsMap }) {
  const controls = useAnimationControls();
  const isCenter = piece.id === 'center';

  useEffect(() => {
    controlsMap.current[piece.id] = controls;
    controls.set({
      x: piece.from.x,
      y: piece.from.y,
      opacity: 0,
      scale: isCenter ? 0 : 0.5,
    });
  }, [controls, controlsMap, piece.id, piece.from.x, piece.from.y, isCenter]);

  return (
    <motion.div className="gem-piece" animate={controls}>
      <img
        src={piece.src}
        alt=""
        draggable={false}
        className="gem-piece-img"
      />
    </motion.div>
  );
}
