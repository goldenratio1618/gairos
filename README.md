# gairos

Gairos tabletop system (campaigns, maps, initiative, rolls, logs).

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
```

3. Open the app:

- Player: `http://<your-ip>:3000/tabletop.html`
- DM gateway: `http://<your-ip>:3000/dm-tabletop.html`

The server accepts only local/private network connections.

## Monster builder (DM)

In **Characters → Statblocks → Create monster**, choose a challenge rating,
set hit points, and customize the creature. All 28 skills are included. Saved
monsters appear in the statblock library and in **Tokens** for map placement.
Existing character spreadsheets and statblock imports remain available.

CR attack, save, AC, and DC defaults come from the supplied
[CR Balancer](https://docs.google.com/spreadsheets/d/10GuHLF5ahpTPmeSO8W-WKBzrmMJzi0_R8HiatYer-TA/edit?gid=1701149677#gid=1701149677),
verified September 22, 2026. Its “average stat” column is empty: the builder
explicitly uses **average save** as the initial editable skill baseline. HP and
mana are not supplied by that table. The snapshot and source links are in
`public/monster-rules.js`.

Automatic size uses the creature's explicit size, description, space, or height /
length and the Gairos Size Categories table. Ambiguous or absent dimensions are
flagged for review. The map keeps creatures smaller than Medium in one grid cell;
Large, Huge, Gargantuan, and Colossal occupy 2, 3, 4, and 6 cells per side.

For token artwork, put `OPENAI_API_KEY=...` in a local `.env` file (ignored by Git)
or supply it as a server environment variable, then restart. Open the DM gateway
before generating. The key stays on the server. Each click makes exactly one
OpenAI Images API request using `gpt-image-2.5-sunburst`, without automatic retries.
The browser centers the visible artwork inside a circular ring; framing and ring
color remain adjustable, and the PNG can be downloaded. Uploaded artwork also
works without an API key. Reopening a saved monster preserves its finished token;
upload or generate new artwork to reframe it.

Run `npm test` for rule, authorization, token framing, and existing vision tests.
Optional browser checks require Playwright available to Node and Chrome installed:
`node test/monster-builder.browser.js` and `node test/tabletop.browser.js`.
They use mocked image requests and isolated campaign data.

## Data persistence

Runtime data is stored in `generated/tabletop/state.json`.

## Backup script

Create a backup of all persisted game data:

```bash
./scripts/backup-game-data.sh /path/to/backup/location
```
