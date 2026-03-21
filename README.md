# Gemstone Logo Animation

A React-based logo intro animation where individual gemstone pieces spiral in from off-screen, assemble into the complete logo, glow, and loop — built for use as a page loading/splash screen.

## Tech Stack

| Tool | Purpose |
|------|---------|
| **React 19** | UI framework |
| **Vite** | Dev server & build tool |
| **Framer Motion** | Animation engine (spiral paths, spring physics, staggered timing) |
| **CSS** | Glow effect, shine line, layout |

## Quick Start

```bash
cd logo-animation
npm install
npm run dev
```

Open `http://localhost:5173` to see the animation.

## How It Works

- 10 individual gemstone PNG images (transparent background, same canvas size) are stacked on top of each other
- Each piece starts off-screen at a unique angle calculated using the **golden angle spiral** (137.5° apart)
- Pieces fly in with **curved paths** (different easing on X vs Y axes), **rotation**, and **scale**
- The center blue gem scales up from the middle with a spring animation
- On assembly: a **silver glow** pulse + **reflective shine line** sweeps across
- After a hold, pieces spiral out to new angles, then loop for 120 seconds

## Using as a Page Loading Animation

### Option 1: Splash Screen with Fade-Out

Wrap your app content and show the animation until loading is complete:

```jsx
import { useState, useEffect } from 'react';
import LogoAnimation from './components/LogoAnimation';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Replace with your actual loading logic
    // (API calls, asset preloading, auth check, etc.)
    const timer = setTimeout(() => setLoading(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {loading && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          transition: 'opacity 0.5s ease',
          opacity: loading ? 1 : 0,
        }}>
          <LogoAnimation />
        </div>
      )}
      <div style={{
        opacity: loading ? 0 : 1,
        transition: 'opacity 0.5s ease',
      }}>
        {/* Your actual app/page content */}
      </div>
    </>
  );
}
```

### Option 2: Route-Based Splash (React Router)

```jsx
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LogoAnimation from './components/LogoAnimation';
import HomePage from './pages/HomePage';

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Wait for fonts, images, API data, etc.
    Promise.all([
      document.fonts.ready,
      // ...other preload promises
    ]).then(() => setReady(true));
  }, []);

  if (!ready) return <LogoAnimation />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Option 3: Copy into an Existing Project

1. Install the dependency:
   ```bash
   npm install framer-motion
   ```

2. Copy these files into your project:
   ```
   src/components/LogoAnimation.jsx
   src/components/LogoAnimation.css
   public/*.png              (all 10 gemstone piece images)
   ```

3. Import and use:
   ```jsx
   import LogoAnimation from './components/LogoAnimation';

   // Use it anywhere
   <LogoAnimation />
   ```

## Customization

| What | Where | Default |
|------|-------|---------|
| Loop duration | `LOOP_DURATION` in `LogoAnimation.jsx` | 120 seconds |
| Hold time (assembled) | `HOLD_DURATION` | 1500ms |
| Spiral radius | `RADIUS` | 2800px |
| Animation speed (in) | `duration` in `animateIn` | 1.4s per piece |
| Animation speed (out) | `duration` in `animateOut` | 1.5s per piece |
| Stagger delay | `delay = i * 0.04` | 40ms between pieces |
| Logo size | `.logo-sizer` in CSS | `min(22vw, 200px)` |
| Background color | `.logo-container` in CSS | `#ffffff` |

## Build for Production

```bash
npm run build
```

Output is in the `dist/` folder — deploy anywhere (Vercel, Netlify, S3, etc.).
