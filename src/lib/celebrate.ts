import confetti from 'canvas-confetti';

/**
 * Célébration de confirmation de réservation.
 * Deux vagues aux couleurs SapSapHouse (orange + navy).
 */
export const celebrateReservation = () => {
  // Vague 1 — orange SapSapHouse
  confetti({
    particleCount: 60,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#E8761A', '#F8B266', '#FDDDB0'],
    startVelocity: 35,
    gravity: 0.8,
    zIndex: 9999,
  });

  // Vague 2 — navy + orange (délai 200ms)
  setTimeout(() => {
    confetti({
      particleCount: 40,
      spread: 55,
      origin: { y: 0.6, x: 0.3 },
      colors: ['#1A3560', '#5474C1', '#AAB8E0'],
      startVelocity: 30,
      zIndex: 9999,
    });
    confetti({
      particleCount: 40,
      spread: 55,
      origin: { y: 0.6, x: 0.7 },
      colors: ['#1A3560', '#E8761A'],
      startVelocity: 30,
      zIndex: 9999,
    });
  }, 200);
};
