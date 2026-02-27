# Paper Airplane Wind Lab

An interactive wind tunnel simulation that teaches students how airplane shape affects airflow. Three paper airplane designs are displayed side-by-side, each with hundreds of animated wind particles showing drag, lift, and turbulence in real time.

**Live Demo:** Deployed on Vercel — push to `master` to auto-deploy.

---

## What Students See

The app shows three animated wind tunnels, each containing a different paper airplane:

| Tunnel | Airplane | Concept Taught |
|--------|----------|----------------|
| **The Dart** | Sleek, pointed nose | **Low Drag** — air slides smoothly past the narrow shape |
| **The Glide** | Wide wings, glider shape | **Lift** — broad wings deflect air up and down |
| **The Flatline** | Blunt, heavy front | **High Drag** — the flat nose plows through air, creating turbulence |

Wind particles (streamlines) flow from right to left across each tunnel. When particles interact with the airplane, they change color and deflect based on the airplane's shape — making the invisible physics of flight visible.

### Student Interactions
- **Hover** over a tunnel to see the airplane glow
- **Scroll** between the three tunnels to compare airflow patterns
- **Observe** how particle color shifts indicate interaction zones (blue = normal, cyan/green = interacting, red/orange = turbulence)

---

## How to Run It

This is a plain HTML/CSS/JavaScript project — **no installation or build tools required**.

### Option 1: Open Directly
Double-click `index.html` in a browser. (Some browsers may restrict canvas rendering from `file://` — if so, use a local server below.)

### Option 2: Python (quickest if Python is installed)
```bash
cd Aero_Visit
python3 -m http.server 8000
```
Then open **http://localhost:8000** in a browser.

### Option 3: Node.js
```bash
npx http-server
```

### Option 4: VS Code Live Server
1. Install the **Live Server** extension in VS Code
2. Right-click `index.html` → **Open with Live Server**

### Option 5: Vercel (production deployment)
The project is already configured for Vercel. Pushing to `master` triggers an automatic deployment.

---

## Project Structure

```
Aero_Visit/
├── index.html    ← Page layout with three canvas sections
├── app.js        ← All simulation logic (streamlines, airplanes, wind tunnels)
├── style.css     ← Styling, responsive layout, color themes
└── .vercel/      ← Vercel deployment config (auto-generated)
```

**That's it — three files.** No frameworks, no dependencies, no build step.

---

## How It Works (Technical Overview)

The simulation is built with vanilla JavaScript and the **HTML5 Canvas API**.

### Core Components

1. **Streamline** — A single wind particle. Each one tracks its position, velocity, color, and a trail of past positions. When it gets close to the airplane, physics-based deflection is applied depending on the airplane type. ~700 streamlines animate per tunnel.

2. **PaperAirplane** — Draws one of three airplane designs on the canvas. Each has a unique shape drawn with Canvas paths, complete with shadows, shading, and accent lines. The airplane subtly oscillates in the wind.

3. **WindTunnel** — Manages a single canvas: sets up sizing, runs the animation loop (`requestAnimationFrame`), draws the background gradient and grid, and coordinates all streamlines and the airplane.

### Animation Loop (per tunnel, every frame)
1. Clear canvas, draw gradient background
2. Update all ~700 streamlines — check distance to airplane, apply deflection, update color
3. Draw streamline trails
4. Draw the airplane with its current oscillation offset
5. Request next frame

### Performance
- **IntersectionObserver** pauses tunnels when scrolled off-screen
- **devicePixelRatio** scaling for sharp rendering on high-DPI screens
- Debounced window resize handling
- Particles recycle (reset to right edge) rather than being destroyed and recreated

---

## Using This in the Classroom

### Suggested Activity Flow
1. **Predict** — Before showing the simulation, ask students: "Which airplane shape do you think will have the least air resistance? Why?"
2. **Observe** — Open the simulation and let students watch all three tunnels
3. **Compare** — Have students describe the differences in airflow between the three designs
4. **Discuss** — Connect observations to real-world concepts:
   - Why are jets pointed at the front? (Dart = low drag)
   - How do glider wings generate lift? (Glide = wide wings redirect air)
   - What happens when a shape isn't aerodynamic? (Flatline = turbulence and drag)
5. **Extend** — Students can fold real paper airplanes matching these designs and test flight distance, then compare results to the simulation

### Concepts Covered
- Drag and air resistance
- Lift and wing shape
- Streamlined vs. blunt body aerodynamics
- Fluid dynamics (introductory)

### Standards Alignment
Supports **NGSS** Physical Science standards related to forces, motion, and engineering design (MS-PS2, MS-ETS1).

---

## Requirements

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No internet required after initial load (fonts are the only external resource)
- Works on desktop, tablets, and phones (responsive layout)
