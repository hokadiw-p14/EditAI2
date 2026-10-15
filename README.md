# EditAI2

A responsive, browser-based writing workspace starter with Markdown export, local draft storage, and prepared AI prompts.

## Live site
After GitHub Pages deployment succeeds: https://hokadiw-p14.github.io/EditAI2/

## Run locally
No build tools required. Open `index.html` in a browser, or run:
```sh
python -m http.server 8000
```
Then visit http://localhost:8000.

## Deploy
1. Open repository **Settings → Pages**.
2. Set **Build and deployment → Source** to **GitHub Actions**.
3. The workflow deploys automatically when changes are pushed to `main`.
4. Follow **Actions** to check deployment status.

## Important
The AI panel currently prepares prompts; it does not call an AI model. For real AI responses, create a server-side endpoint and store API credentials as server-side secrets. Never put an API key in browser JavaScript or `index.html`.

## Structure
- `index.html` — responsive front-end
- `.github/workflows/deploy.yml` — GitHub Pages deployment
