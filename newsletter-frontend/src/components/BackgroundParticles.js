// src/components/BackgroundParticles.js
import React, { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

export default function BackgroundParticles() {
  // initialize the tsParticles engine with all features
  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);

  const options = {
    fullScreen: {
      enable: true,
      zIndex: 0,       // behind your UI
    },
    fpsLimit: 60,
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: "repulse",  // particles repel on hover
        },
        onClick: {
          enable: true,
          mode: "push",     // add particles on click
        },
      },
      modes: {
        repulse: { distance: 100, duration: 0.4 },
        push: { quantity: 4 },
      },
    },
    particles: {
      number: {
        value: 50,
        density: { enable: true, area: 800 },
      },
      color: { value: "#3b82f6" },
      shape: { type: "circle" },
      opacity: {
        value: 0.4,
        random: { enable: true, minimumValue: 0.1 },
      },
      size: {
        value: { min: 1, max: 3 },
      },
      links: {
        enable: true,
        distance: 150,
        color: "#3b82f6",
        opacity: 0.2,
        width: 1,
      },
      move: {
        enable: true,
        speed: 1,
        direction: "none",
        outModes: { default: "out" },
      },
    },
    detectRetina: true,
  };

  return (
    <Particles
      id="background-particles"
      init={particlesInit}
      options={options}
    />
  );
}
