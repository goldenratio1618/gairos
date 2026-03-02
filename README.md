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

## Data persistence

Runtime data is stored in `generated/tabletop/state.json`.

## Backup script

Create a backup of all persisted game data:

```bash
./scripts/backup-game-data.sh /path/to/backup/location
```
