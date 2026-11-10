# FEMBOTS website

The website for FEMBOTS, an independent slot provider making games for Stake Engine.

**[View the live site →](https://fembots-gaming.github.io/website/)**

## What's on it

- A hero with the FEMBOTS robot, whose eye follows the mouse
- The games catalogue: Midnight Broker, Ember Reign and Noble Seal
- About, partners and contact sections

## Running it locally

It's a static site with no build step. Serve the folder with any web server, for example:

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

## Files

| File | What it holds |
| --- | --- |
| `index.html` | The page |
| `styles.css` | All styles |
| `main.js` | Navigation, the hero robot's eye, and the games grid |
| `games.js` | The game list and details |
| `assets/` | The robot icon, the logo and the Midnight Broker art |

The site deploys to GitHub Pages from the `main` branch whenever changes are pushed.
