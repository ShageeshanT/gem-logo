import { motion, useAnimationControls } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import './LogoAnimation.css';

/* ── piece definitions ─────────────────────────────────── */
const PIECES = [
  { id: 'crown',              src: '/Crown.png'              },
  { id: 'upper-left',         src: '/Upper-left.png'         },
  { id: 'upper-right',        src: '/Upper-right.png'        },
  { id: 'right-orange',       src: '/Right-orange.png'       },
  { id: 'left-magenta',       src: '/Left-magenta.png'       },
  { id: 'left-purple',        src: '/Left-purple.png'        },
  { id: 'bottom-left-teal',   src: '/Bottom-left-teal.png'   },
  { id: 'bottom-green',       src: '/Bottom-green.png'       },
  { id: 'bottom-right-yellow',src: '/Bottom-right-yellow.png'},
  { id: 'center',             src: '/Center.png'             },
];

/* Spiral: evenly space pieces around a circle, each from a different angle */
const RADIUS = 2800;
const PIECE_COUNT = PIECES.length;

function getSpiralOrigin(index) {
  // Golden-angle based spiral for organic, non-uniform spacing
  const goldenAngle = 137.508 * (Math.PI / 180);
  const angle = goldenAngle * index;
  return {
    x: Math.cos(angle) * RADIUS,
    y: Math.sin(angle) * RADIUS,
    rotate: (angle * 180 / Math.PI) + 180, // face inward as they spiral in
  };
}

const ANIM_ORDER = [
  'upper-right', 'left-magenta', 'bottom-right-yellow', 'crown',
  'upper-left', 'right-orange', 'bottom-left-teal', 'left-purple',
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
      const isCenter = pieceId === 'center';
      const origin = getSpiralOrigin(i);
      const delay = i * 0.04;
      const ctrl = controlsMap.current[pieceId];
      if (!ctrl) return Promise.resolve();

      ctrl.set({
        x: origin.x,
        y: origin.y,
        rotate: isCenter ? 0 : origin.rotate,
        opacity: 0,
        scale: isCenter ? 0 : 0.4,
      });

      return ctrl.start({
        x: 0, y: 0, rotate: 0, opacity: 1, scale: 1,
        transition: {
          // Different easing on x vs y creates the curved/spiral path
          x:       { type: 'tween', ease: [0.0, 0.9, 0.2, 1], duration: 1.4, delay },
          y:       { type: 'tween', ease: [0.15, 1, 0.3, 1],  duration: 1.4, delay },
          rotate:  { type: 'tween', ease: [0.0, 0.8, 0.2, 1], duration: 1.4, delay },
          scale:   { type: 'tween', ease: [0.0, 0.9, 0.2, 1], duration: 1.4, delay },
          opacity: { duration: 0.2, ease: 'easeOut', delay },
        },
      });
    });

    await Promise.all(promises);

    // Glow + shine after assembly
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
      const isCenter = pieceId === 'center';
      // Each piece spirals out to a NEW random-ish angle for variety
      const outOrigin = getSpiralOrigin(i + PIECE_COUNT);
      const delay = i * 0.05;
      const ctrl = controlsMap.current[pieceId];
      if (!ctrl) return Promise.resolve();

      return ctrl.start({
        x: outOrigin.x,
        y: outOrigin.y,
        rotate: isCenter ? 0 : -outOrigin.rotate,
        opacity: 0,
        scale: isCenter ? 0 : 0.4,
        transition: {
          x:       { type: 'tween', ease: [0.7, 0, 1, 0.3], duration: 1.5, delay },
          y:       { type: 'tween', ease: [0.5, 0, 0.9, 0.2], duration: 1.5, delay },
          rotate:  { type: 'tween', ease: [0.5, 0, 1, 0.3],  duration: 1.5, delay },
          scale:   { type: 'tween', ease: [0.7, 0, 1, 0.3],  duration: 1.5, delay },
          opacity: { duration: 0.3, ease: 'easeIn', delay: delay + 0.9 },
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
    const origin = getSpiralOrigin(
      ANIM_ORDER.indexOf(piece.id)
    );
    controls.set({
      x: origin.x,
      y: origin.y,
      rotate: isCenter ? 0 : origin.rotate,
      opacity: 0,
      scale: isCenter ? 0 : 0.4,
    });
  }, [controls, controlsMap, piece.id, isCenter]);

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
