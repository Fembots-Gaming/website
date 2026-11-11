/*
 * FEMBOTS game catalogue. The whole site reads from this file:
 * add a game here and it shows up in the games grid.
 *
 * Midnight Broker's numbers are copied from its math draft
 * (stake-slot-try/math/games/neon_night_market/game_config.py and src/game/rules.ts).
 * Update them here if the math changes before release.
 */
window.FEMBOTS = {
  studio: {
    name: 'FEMBOTS',
    // Leave empty to hide the email button in the Contact section.
    contactEmail: '',
  },

  games: [
    {
      slug: 'midnight-broker',
      title: 'Midnight Broker',
      status: 'coming-soon', // 'released' or 'coming-soon'
      // true while it is submitted on Engine and waiting for approval. Only these show under "Up next".
      inReview: true,
      release: 'Coming soon',
      cover: 'assets/mb/cover-tall.webp',
      coverWide: 'assets/mb/cover-wide.webp',
      logo: 'assets/mb/logo.webp',
      tagline: 'Light the lanterns. Let the Broker collect.',
      blurb:
        'A 5×4 cluster slot set in a lantern-lit night market. Every win lights its cells, and when the Night Broker drifts in, every lit lantern flips open for cash or a multiplier.',
      rtp: '96.70%',
      maxWin: '10,000x',
      grid: '5×4 Cluster',
      modes: 7,
      playUrl: '', // set once it is live on Stake
    },
    // Noble Seal's numbers are copied from its rules panel and math
    // (noble-seal/src/game/rules.ts, game.config.json and math/games/noble-seal/game_config.py).
    {
      slug: 'noble-seal',
      title: 'Noble Seal',
      status: 'coming-soon',
      inReview: true,
      release: 'Coming soon',
      cover: 'assets/ns/cover-tall.webp',
      logo: 'assets/ns/logo.webp',
      tagline: 'Royal Seals fill the reels.',
      blurb:
        'A 6×5 lines slot in a storybook market town. Royal Seals fill whole reels with wilds and multipliers up to 1000x, and in free spins they stick and grow.',
      rtp: '96.70%',
      maxWin: '50,000x',
      grid: '6×5 Lines',
      modes: 8,
      playUrl: '',
    },
    // Ember Reign is on Engine (team "fembots") but has no art or details in this
    // folder yet. Add cover, logo, blurb, rtp, maxWin and grid when ready.
    {
      slug: 'ember-reign',
      title: 'Ember Reign',
      status: 'coming-soon',
      release: 'Coming soon',
      blurb: 'Our next game on Engine. Details soon.',
      playUrl: '',
    },
  ],
};
