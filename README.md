# NOVA SALVAGE: DEEP BELT

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/tronolllanj-creator/best-game-01-r2/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/tronolllanj-creator/best-game-01-r2/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

A top-down 2D canvas arcade salvage shooter set in a perilous asteroid belt. Pilot a rugged salvage tug, blast colossal space rock formations, harvest drifting energy cores, fend off rogue autonomous combat drones, survive deadly minefields, and battle colossal capital-class bosses across 12 escalating waves.

## What It Is

**NOVA SALVAGE: DEEP BELT** is an original arcade space-salvage experience built entirely in pure ES modules with no external libraries, frameworks, or build steps. It features deterministic simulation governed by a seeded pseudo-random generator, a rich procedural audio suite via WebAudio, responsive scaling across screens, dynamic combat multipliers, tactical upgrade shop upgrades, and precise arcade physics.

## How It Beats a Plain Rock Shooter

- **12 Progressive Waves:** Unlike endless rock blasters, Deep Belt features handcrafted wave scaling that introduces aggressive chaser drones, heavy shooter drones, and drifting proximity mines.
- **Two Epic Boss Encounters:** Face the towering **Scrap Maw** at Wave 6 and the heavily armed **Derelict Hulk** at Wave 12.
- **In-Game Economy & Shop:** Harvest glowing energy cores from shattered rocks and foes, then spend them between waves on permanent hull plating, rapid loaders, heavy bolts, dash capacitors, and tractor magnets.
- **Tactical Drones & Mines:** Combat units that flank, maintain standoff distances, lay explosive traps, and bounce off screen boundaries.
- **Three Difficulty Modes:** Tailor your salvage run with **Chill**, **Standard**, or **Hard** settings.
- **Combo & Multiplier System:** Keep the streak alive by destroying targets or collecting cores within 2.5 seconds to build up to a 10x score multiplier.
- **Full Salvage Meta-Goal:** Collect 30 total cores in a run to unlock the Full Salvage bonus and achievement banner.

## Controls

- **Move:** `W A S D` or `Arrow Keys` (Thruster acceleration, drag, max speed 340)
- **Aim:** Mouse cursor
- **Fire:** Hold Left Mouse Button (Auto-firing bolts)
- **Dash:** `Space` or `Shift` (720 burst velocity with brief invulnerability and 2.2s cooldown)
- **Pause:** `P` or `Escape`
- **Start / Restart:** `Enter` or click on title/game-over screens
- **Restart (Instant):** `R`
- **Audio Mute:** `M`
- **Difficulty Select:** `1` (Chill), `2` (Standard), `3` (Hard) on Title Screen
- **Shop Purchase:** Keys `1` through `5` during shop intermissions

## Rules & Gameplay Mechanics

1. **Hull & Survival:** Your salvage tug starts with 100 Hull (150 on Chill, 75 on Hard). Reaching 0 Hull triggers Game Over.
2. **Scoring:** Destroying rocks (Large 50, Medium 100, Small 200), drones, mines, and collecting cores multiplies base values by your active combo multiplier.
3. **Splitting Rocks:** Large rocks split into 2 Medium rocks; Medium rocks split into 2 Small rocks. Small rocks burst into scrap and pickups.
4. **Pickups:** Dropped by destroyed rocks and foes:
   - **Repair Cell:** Restores +25 hull.
   - **Overcharge:** Doubles fire rate for 8 seconds.
   - **Shield Cell:** Absorbs one hit, lasts 10 seconds.
   - **Tractor Magnet:** Pulls nearby cores and pickups toward your ship for 8 seconds.
5. **Accuracy Tracking:** Shots fired and hits are recorded to display your final accuracy percentage on game over screens.

## Shop List

Intermissions occur after clearing every wave except Wave 12. Spend your energy cores on:

1. **Hull Plating:** +25 Max Hull (Cost: 3 Cores)
2. **Rapid Loader:** Reduces fire gap by 0.02s (Min 0.07s) (Cost: 4 Cores)
3. **Heavy Bolts:** +1 Weapon Damage (Cost: 5 Cores)
4. **Dash Capacitor:** Reduces dash cooldown by 0.3s (Min 1.0s) (Cost: 3 Cores)
5. **Tractor Magnet:** Permanent pickup radius increase +40 (Cost: 4 Cores)

## Run Instructions

Hosted as static files under `game/` with a static server (e.g. `npx serve game` or Python's `http.server`):

1. Clone or download the repository.
2. Open terminal in the project root.
3. Serve the `game/` directory locally:
   ```bash
   npx serve game
   ```
4. Open `http://localhost:3000` in any modern web browser.
5. Automated test staging and screenshot generation supported via query parameters: `?shot=start|play|boss|end&seed=12345`.

---*

*(C) NOVA SALVAGE: DEEP BELT - All rights reserved.*