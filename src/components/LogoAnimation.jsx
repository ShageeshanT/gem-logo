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

export default function LogoAnimation() {
  const [glowing, setGlowing] = useState(false);
  const [shining, setShining] = useState(false);
  const shineControls = useAnimationControls();
  const controlsMap = useRef({});

  const animateIn = useCallback(async () => {
    setGlowing(false);
    setShining(false);

    const promises = ANIM_ORDER.map((pieceId, i) => {
      const isCenter = pieceId === 'center';
      const origin = getSpiralOrigin(i);
      const delay = i * 0.12;
      const ctrl = controlsMap.current[pieceId];
      if (!ctrl) return Promise.resolve();

      if (isCenter) {
        // Center waits for all outer pieces to mostly land
        const centerDelay = 1.6;
        ctrl.set({ x: 0, y: 0, rotate: 0, opacity: 0, scale: 0 });
        return ctrl.start({
          opacity: 1, scale: 1,
          transition: {
            scale:   { type: 'spring', stiffness: 80, damping: 12, delay: centerDelay },
            opacity: { duration: 0.8, ease: 'easeOut', delay: centerDelay },
          },
        });
      }

      ctrl.set({
        x: origin.x,
        y: origin.y,
        rotate: origin.rotate,
        opacity: 0,
        scale: 0.3,
      });

      return ctrl.start({
        x: 0, y: 0, rotate: 0, opacity: 1, scale: 1,
        transition: {
          // Slower, buttery ease — fast start, long deceleration into place
          x:       { type: 'tween', ease: [0.0, 0.7, 0.15, 1], duration: 1.8, delay },
          y:       { type: 'tween', ease: [0.1, 0.8, 0.2, 1],  duration: 1.8, delay },
          rotate:  { type: 'tween', ease: [0.0, 0.6, 0.15, 1], duration: 1.8, delay },
          scale:   { type: 'tween', ease: [0.0, 0.7, 0.15, 1], duration: 1.8, delay },
          opacity: { duration: 0.4, ease: 'easeOut', delay },
        },
      });
    });

    await Promise.all(promises);

    // Intense glow burst + shine after assembly
    setGlowing(true);
    await new Promise(r => setTimeout(r, 200));
    setShining(true);
    shineControls.set({ y: '-150%' });
    shineControls.start({
      y: '150%',
      transition: { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 },
    });
  }, [shineControls]);

  useEffect(() => {
    const timer = setTimeout(() => animateIn(), 100);
    return () => clearTimeout(timer);
  }, [animateIn]);

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
