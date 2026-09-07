"use client";

import { motion } from "framer-motion";

import { GPU } from "./landing-tokens";

// Stylized face mesh — designed in a 480×600 viewBox. Coordinates loosely
// follow MediaPipe FaceMesh topology, but reduced to ~130 visible dots so
// the SVG stays cheap on phones. The wireframe feel comes from triangulation
// lines connecting selected dots.
//
// When the user supplies a real face photo, swap the SVG `<g class="scan-overlay">`
// with an <Image> + this same dot/line/hotspot overlay positioned on top.

const FACE_OUTLINE =
  "M240 80 C160 80, 100 170, 100 320 C100 460, 180 540, 240 545 C300 540, 380 460, 380 320 C380 170, 320 80, 240 80 Z";

// ~130 dot positions arranged in face-mesh anatomy:
//   forehead band · brow arc · eye orbits · cheek · nose ridge · mouth · jaw
const DOTS: [number, number][] = [
  // Forehead (3 rows)
  [200, 105], [240, 100], [280, 105],
  [175, 130], [210, 125], [240, 122], [270, 125], [305, 130],
  [160, 160], [195, 155], [225, 152], [255, 152], [285, 155], [320, 160],
  // Brow arc
  [165, 185], [195, 178], [225, 175], [255, 175], [285, 178], [315, 185],
  // Outer face contour upper
  [135, 200], [350, 200],
  // Eye orbit (left)
  [175, 215], [200, 210], [225, 215], [200, 230], [215, 225], [190, 225],
  // Eye orbit (right)
  [255, 215], [280, 210], [305, 215], [280, 230], [265, 225], [290, 225],
  // Between eyes (nose top)
  [240, 215], [240, 240],
  // Cheek upper
  [140, 250], [165, 260], [195, 275], [220, 285],
  [260, 285], [285, 275], [315, 260], [340, 250],
  // Nose bridge + tip
  [240, 265], [240, 290], [240, 315], [225, 335], [255, 335],
  [220, 350], [240, 358], [260, 350],
  // Cheek lower
  [150, 320], [180, 335], [210, 345],
  [270, 345], [300, 335], [330, 320],
  // Mouth area
  [195, 395], [220, 390], [240, 395], [260, 390], [285, 395],
  [205, 410], [225, 415], [240, 418], [255, 415], [275, 410],
  // Lip lower
  [215, 425], [240, 432], [265, 425],
  // Chin
  [220, 460], [240, 470], [260, 460],
  // Jawline
  [145, 380], [160, 420], [185, 455], [215, 485], [240, 500],
  [265, 485], [295, 455], [320, 420], [335, 380],
  // Outer face contour lower
  [125, 320], [355, 320], [130, 360], [350, 360],
  // Extra mesh fill (sparse)
  [175, 290], [305, 290], [170, 350], [310, 350], [195, 365], [285, 365],
];

// Selective triangulation lines — connect adjacent dots to suggest a mesh
// without overwhelming the visual. Each line indexes into DOTS by position.
const MESH_LINES: [[number, number], [number, number]][] = [
  // Forehead horizontal band
  [[200, 105], [240, 100]],
  [[240, 100], [280, 105]],
  [[175, 130], [210, 125]],
  [[210, 125], [240, 122]],
  [[240, 122], [270, 125]],
  [[270, 125], [305, 130]],
  // Forehead diagonals
  [[200, 105], [210, 125]],
  [[240, 100], [240, 122]],
  [[280, 105], [270, 125]],
  // Brow to eye
  [[195, 178], [200, 210]],
  [[225, 175], [225, 215]],
  [[255, 175], [255, 215]],
  [[285, 178], [280, 210]],
  // Eye triangulation
  [[175, 215], [200, 210]],
  [[200, 210], [225, 215]],
  [[255, 215], [280, 210]],
  [[280, 210], [305, 215]],
  [[200, 210], [215, 225]],
  [[225, 215], [215, 225]],
  [[280, 210], [265, 225]],
  [[255, 215], [265, 225]],
  // Nose bridge
  [[240, 240], [240, 265]],
  [[240, 265], [240, 290]],
  [[240, 290], [240, 315]],
  [[240, 315], [225, 335]],
  [[240, 315], [255, 335]],
  [[225, 335], [220, 350]],
  [[255, 335], [260, 350]],
  [[220, 350], [240, 358]],
  [[240, 358], [260, 350]],
  // Cheek to nose
  [[195, 275], [225, 335]],
  [[220, 285], [225, 335]],
  [[260, 285], [255, 335]],
  [[285, 275], [255, 335]],
  // Cheek diagonals
  [[140, 250], [165, 260]],
  [[165, 260], [195, 275]],
  [[195, 275], [220, 285]],
  [[260, 285], [285, 275]],
  [[285, 275], [315, 260]],
  [[315, 260], [340, 250]],
  // Cheek lower
  [[150, 320], [180, 335]],
  [[180, 335], [210, 345]],
  [[270, 345], [300, 335]],
  [[300, 335], [330, 320]],
  // Mouth horizontal
  [[195, 395], [220, 390]],
  [[220, 390], [240, 395]],
  [[240, 395], [260, 390]],
  [[260, 390], [285, 395]],
  [[205, 410], [225, 415]],
  [[225, 415], [240, 418]],
  [[240, 418], [255, 415]],
  [[255, 415], [275, 410]],
  // Lip closure
  [[215, 425], [240, 432]],
  [[240, 432], [265, 425]],
  // Chin
  [[240, 432], [240, 470]],
  [[220, 460], [240, 470]],
  [[240, 470], [260, 460]],
  // Jawline
  [[145, 380], [160, 420]],
  [[160, 420], [185, 455]],
  [[185, 455], [215, 485]],
  [[215, 485], [240, 500]],
  [[240, 500], [265, 485]],
  [[265, 485], [295, 455]],
  [[295, 455], [320, 420]],
  [[320, 420], [335, 380]],
  // Cheek to jaw
  [[150, 320], [145, 380]],
  [[330, 320], [335, 380]],
  // Eye to cheek
  [[175, 215], [165, 260]],
  [[305, 215], [315, 260]],
];

type Hotspot = {
  id: string;
  x: number;
  y: number;
  label: string;
  metric: string;
  color: string;
  delay: number;
  side: "left" | "right";
};

const HOTSPOTS: Hotspot[] = [
  {
    id: "hydration",
    x: 240,
    y: 145,
    label: "Trán",
    metric: "Độ ẩm · 68",
    color: "#3b82f6",
    delay: 2.6,
    side: "right",
  },
  {
    id: "pore",
    x: 175,
    y: 290,
    label: "Má trái",
    metric: "Lỗ chân lông · 71",
    color: "#a855f7",
    delay: 3.0,
    side: "left",
  },
  {
    id: "sebum",
    x: 240,
    y: 310,
    label: "Vùng chữ T",
    metric: "Bã nhờn · 52",
    color: "#f59e0b",
    delay: 3.4,
    side: "right",
  },
  {
    id: "dark-circle",
    x: 200,
    y: 235,
    label: "Mắt",
    metric: "Quầng thâm · 44",
    color: "#6366f1",
    delay: 3.8,
    side: "left",
  },
];

export function FaceScanVisualizer({ reduced }: { reduced: boolean }) {
  // Per-stage delays: outline draws first, dots populate, lines fade in,
  // then scan line + hotspots start their continuous loop.
  const lineDelay = 1.0;
  const dotsStart = 1.4;
  const scanStart = 2.4;

  return (
    <div
      className="relative mx-auto aspect-[4/5] w-full max-w-[480px]"
      style={GPU}
    >
      <div
        className="relative h-full w-full overflow-hidden rounded-[2rem]"
        style={{
          background:
            "linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
          boxShadow:
            "0 60px 120px rgba(15,23,42,0.35), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/1.png"
          alt="AI face scan target"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{ transform: "scale(1.28) translateY(5%)", objectPosition: "center" }}
        />

        {/* Background blobs — give the dark surface depth */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-[10%] -top-[15%] size-[60%] rounded-full blur-2xl"
          style={{
            background:
              "radial-gradient(circle, rgba(168,85,247,0.40), transparent 65%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-[10%] right-[5%] size-[55%] rounded-full blur-2xl"
          style={{
            background:
              "radial-gradient(circle, rgba(59,130,246,0.35), transparent 65%)",
          }}
        />

        {/* Subtle grid pattern — "scanner screen" aesthetic */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Face mesh SVG */}
        <svg
          viewBox="0 0 480 600"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="face-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="50%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            <linearGradient id="mesh-line" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(167,139,250,0.85)" />
              <stop offset="100%" stopColor="rgba(96,165,250,0.85)" />
            </linearGradient>
            <radialGradient id="dot-fill">
              <stop offset="0%" stopColor="rgba(255,255,255,1)" />
              <stop offset="60%" stopColor="rgba(255,255,255,0.85)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>

          {/* Face outline */}
          <motion.path
            d={FACE_OUTLINE}
            fill="none"
            stroke="url(#face-stroke)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.95 }}
            transition={{
              duration: 1.4,
              ease: [0.22, 1, 0.36, 1],
            }}
          />

          {/* Mesh lines — fade in after outline */}
          <g>
            {MESH_LINES.map(([[x1, y1], [x2, y2]], idx) => (
              <motion.line
                key={`line-${idx}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="url(#mesh-line)"
                strokeWidth="1.2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.9 }}
                transition={{
                  duration: 0.6,
                  delay: lineDelay + idx * 0.015,
                  ease: "easeOut",
                }}
              />
            ))}
          </g>

          {/* Dot landmarks — staggered fade-in */}
          <g>
            {DOTS.map(([x, y], idx) => (
              <motion.circle
                key={`dot-${idx}`}
                cx={x}
                cy={y}
                r="3"
                fill="url(#dot-fill)"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.45,
                  delay: dotsStart + idx * 0.012,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            ))}
          </g>

          {/* Hotspot pulses */}
          {HOTSPOTS.map((hs) => (
            <motion.g
              key={hs.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: hs.delay }}
            >
              <motion.circle
                cx={hs.x}
                cy={hs.y}
                r="10"
                fill={hs.color}
                fillOpacity="0.55"
                animate={
                  reduced
                    ? undefined
                    : {
                        r: [10, 28, 10],
                        fillOpacity: [0.55, 0, 0.55],
                      }
                }
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: (hs.delay - 2.6) * 0.4,
                }}
              />
              <circle cx={hs.x} cy={hs.y} r="4" fill={hs.color} />
              <circle
                cx={hs.x}
                cy={hs.y}
                r="2"
                fill="white"
                opacity="0.9"
              />
            </motion.g>
          ))}
        </svg>

        {/* Scanning line — sweeps top to bottom continuously */}
        {!reduced && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 8%, rgba(168,85,247,0.85) 30%, rgba(59,130,246,0.95) 50%, rgba(52,211,153,0.85) 70%, transparent 92%)",
              boxShadow:
                "0 0 16px rgba(168,85,247,0.65), 0 0 32px rgba(59,130,246,0.40)",
            }}
            initial={{ top: "10%", opacity: 0 }}
            animate={{ top: ["8%", "92%", "8%"], opacity: [0, 1, 1, 1, 0] }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: scanStart,
              times: [0, 0.05, 0.5, 0.95, 1],
            }}
          />
        )}

        {/* HUD chrome — top status strip */}
        <div className="absolute inset-x-5 top-5 flex items-center justify-between font-mono text-[10px] tracking-wider">
          <motion.span
            className="flex items-center gap-1.5 text-emerald-400/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.span
              className="size-1.5 rounded-full bg-emerald-400"
              animate={reduced ? undefined : { opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            AI SCAN · ACTIVE
          </motion.span>
          <motion.span
            className="text-white/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            468 LANDMARKS
          </motion.span>
        </div>

        {/* HUD chrome — bottom info strip */}
        <div className="absolute inset-x-5 bottom-5 flex items-end justify-between font-mono text-[10px] tracking-wider">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-white/55"
          >
            <p className="text-white/40">MODEL</p>
            <p className="text-white/80">FaceMesh v3.2</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-right text-white/55"
          >
            <p className="text-white/40">METRICS</p>
            <p className="text-emerald-400/90">11 / 11</p>
          </motion.div>
        </div>

        {/* Hotspot annotation chips — floating callouts at the edge */}
        <div className="absolute inset-0 pointer-events-none">
          {HOTSPOTS.map((hs) => (
            <HotspotChip key={hs.id} hotspot={hs} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Side-mounted annotation chip with a thin connector line back to the
// hotspot dot. Positioned in percentage-space so it scales with the SVG.
function HotspotChip({ hotspot }: { hotspot: Hotspot }) {
  // SVG viewBox is 480 wide, 600 tall — convert to percent for absolute layout.
  const pctX = (hotspot.x / 480) * 100;
  const pctY = (hotspot.y / 600) * 100;
  const isLeft = hotspot.side === "left";

  return (
    <motion.div
      className="absolute"
      style={{
        left: isLeft ? "4%" : "auto",
        right: isLeft ? "auto" : "4%",
        top: `${pctY}%`,
        transform: "translateY(-50%)",
      }}
      initial={{ opacity: 0, x: isLeft ? -10 : 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: hotspot.delay + 0.2, duration: 0.5 }}
    >
      <div
        className="flex items-center gap-2 rounded-full px-2.5 py-1.5 backdrop-blur"
        style={{
          background: "rgba(15,23,42,0.65)",
          border: `1px solid ${hotspot.color}55`,
          boxShadow: `0 8px 20px ${hotspot.color}30`,
        }}
      >
        <span
          className="size-1.5 rounded-full"
          style={{ background: hotspot.color, boxShadow: `0 0 6px ${hotspot.color}` }}
        />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/85">
          {hotspot.label}
        </span>
        <span className="text-[10px] font-mono text-white/55">
          {hotspot.metric.split(" · ")[1]}
        </span>
      </div>
      {/* Connector line — thin SVG from chip to hotspot */}
      <svg
        aria-hidden
        className="pointer-events-none absolute top-1/2 h-px"
        style={{
          [isLeft ? "left" : "right"]: "100%",
          width: `${isLeft ? pctX - 4 : 96 - pctX}%`,
          transform: "translateY(-50%)",
        }}
      >
        <line
          x1="0"
          y1="0.5"
          x2="100%"
          y2="0.5"
          stroke={hotspot.color}
          strokeOpacity="0.5"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
      </svg>
    </motion.div>
  );
}
