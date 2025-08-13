WORD HUNTER — SINGLE PLAYER (Starter)
=====================================

This folder contains a ready-to-deploy single-player version of Word Hunter.

Files
-----
- index.html  → The game UI
- styles.css  → Styling
- app.js      → Game logic
- README.txt  → These instructions

Rules Implemented
-----------------
- 150 seconds per round
- Letters reshuffle every 25s
- +2 letters added at 90s
- Reminders at 30s and 15s left, and 8s before extra letters
- No repeated words within a round
- Scoring: +2 base; +1 (5), +2 (6), +3 (7), +4 (8+)
- 60s break after each round

How to Upload to GitHub (no git installs)
-----------------------------------------
1) Go to your empty GitHub repo page.
2) Click "Add file" → "Upload files".
3) Drag-and-drop all four files (index.html, styles.css, app.js, README.txt).
4) Click "Commit changes".

Deploy to Firebase Hosting (no local installs; via GitHub integration)
----------------------------------------------------------------------
1) Open https://console.firebase.google.com → Add project (e.g., word-hunter).
2) In the project, go to Build → Hosting → Get started.
3) Click "Connect to GitHub", authorize, and select your repo.
4) Choose the branch to deploy (main).
5) Set "Public directory" to "." (a single dot) because index.html is in repo root.
6) Finish. Firebase will deploy your site and give you a link like https://yourname.web.app

Next Step: Multiplayer Upgrade
------------------------------
Once the single-player is live, we can add Firebase Realtime Database for real-time multiplayer rooms so your friends can join via the same link without pasting any config.
