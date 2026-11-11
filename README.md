# FEMBOTS website

The website for FEMBOTS, an independent slot provider making games for Stake Engine.

**[View the live site →](https://fembots-gaming.github.io/website/)**

## What's on it

- A hero with the FEMBOTS robot, whose eye follows the mouse
- The games catalogue: Midnight Broker and Noble Seal
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
| `main.js` | Navigation, the hero robot's eye, and everything built from the game data |
| `data/games.json` | Every game: card, Up Next spotlight and details pop-up |
| `.pages.yml` | The Pages CMS editor setup for `data/games.json` |
| `404.html` | The page shown for any address that doesn't exist |
| `assets/` | The robot icon, the logo and the game art |
| `assets/fonts/` | Bungee and Inter, served from the site instead of Google Fonts |
| `assets/apple-touch-icon.png` | The icon for "Add to Home Screen" on iPhone |

## Adding or editing games

Go to [app.pagescms.org](https://app.pagescms.org), sign in with GitHub and open **Fembots-Gaming/website**. Only people with write access to this repo can save. Each save is a commit to `main`, and the live site updates a minute or two later.

Tick **In review** to show a game under "Up next". Games stay in the order of the list.

The site deploys to GitHub Pages from the `main` branch whenever changes are pushed.
