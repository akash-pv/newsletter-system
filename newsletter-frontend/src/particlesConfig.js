// src/particlesConfig.js

export const particlesConfig = {
  // Make the canvas cover the entire viewport (full‐screen) behind every other element
  fullScreen: {
    enable: true,
    zIndex: 0, // place the particle canvas at z-index: 0
  },

  // Cap the framerate to 60 for performance
  fpsLimit: 60,

  particles: {
    number: {
      value: 80,
      density: { enable: true, area: 800 },
    },
    // A palette of bright Tailwind‐style colors so the particles show up clearly
    color: {
      value: ["#3b82f6", "#a855f7", "#06b6d4", "#ef4444"],
    },
    shape: { type: "circle" },
    opacity: {
      value: 0.8,
      random: { enable: true, minimumValue: 0.3 },
    },
    size: {
      random: { enable: true, minimumValue: 3 },
      value: 6,
    },
    move: {
      enable: true,
      speed: 2,
      direction: "none",
      random: false,
      straight: false,
      outModes: { default: "bounce" },
    },
    links: {
      enable: true,
      distance: 120,
      color: "#94a3b8",
      opacity: 0.25,
      width: 1,
    },
    collisions: { enable: false },
  },

  detectRetina: true,
};
