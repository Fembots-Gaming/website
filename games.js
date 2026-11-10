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
    // Ember Reign and Noble Seal are on Engine (team "fembots") but have no art or
    // details in this folder yet. Add cover, logo, blurb, rtp, maxWin and grid when ready.
    {
      slug: 'ember-reign',
      title: 'Ember Reign',
      status: 'coming-soon',
      release: 'Coming soon',
      blurb: 'Our next game on Engine. Details soon.',
      detailsAnchor: false,
      playUrl: '',
    },
    {
      slug: 'noble-seal',
      title: 'Noble Seal',
      status: 'coming-soon',
      release: 'Coming soon',
      blurb: 'Our next game on Engine. Details soon.',
      detailsAnchor: false,
      playUrl: '',
    },
  ],
};
