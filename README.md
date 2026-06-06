# Claude Usage Monitor

A lightweight Chrome/Edge extension that shows your [Claude.ai](https://claude.ai) plan usage right on the toolbar badge, refreshing automatically in the background. No need to open the settings panel.

> **Heads up:** This uses Claude.ai's **unofficial internal endpoint** (`/api/organizations/{id}/usage`). It is not a documented public API. If Anthropic changes it, the extension may stop working until the code is updated. Use at your own discretion.

## What it does

- Polls your usage every 5 minutes in the background.
- Toolbar badge shows the highest "% used" across your limits (green `<60%` / amber `60–85%` / red `>85%`).
- Click the icon for a breakdown: current session, weekly limits, and reset countdowns.
- A **Refresh** button in the popup forces an immediate update.

## How it works

The extension makes requests using your browser's existing logged-in Claude.ai session cookies (`credentials: "include"`). It does **not** store, read, or transmit any tokens, passwords, or cookies. It simply reads your own account's usage as your logged-in browser already can.

Your organization ID is fetched automatically from `/api/organizations`, so it is **not** hardcoded — the extension works for any account, not just the author's.

## Install

1. Download or clone this repo.
2. Open `chrome://extensions` (Edge: `edge://extensions`).
3. Toggle on **Developer mode** (top-right corner).
4. Click **Load unpacked** and select this folder.
5. Pin the extension to your toolbar (click the puzzle-piece icon).

You must be **logged in to claude.ai** in the same browser. If you're not, the badge shows `!` and the popup will prompt you to sign in.

## Configuration

To change the refresh interval, edit the top of `background.js`:

```js
const POLL_MINUTES = 5; // change to your preferred interval
```

Keep it reasonable (a few minutes). Polling too aggressively is unnecessary and more likely to draw attention.

## Compatibility

Built and tested against a Pro plan, which returns `five_hour` and `seven_day` usage fields. Other plan types may return a slightly different shape. If your usage doesn't display correctly, inspect the response from the `usage` endpoint and adjust the `normalize()` function in `background.js`.

## License

MIT — see [LICENSE](LICENSE).

---

*Not affiliated with or endorsed by Anthropic. "Claude" is a trademark of Anthropic.*
