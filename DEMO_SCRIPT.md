# DIANOIA — 2-Minute Live Demo Script

## Setup (before going on stage)
- Backend running: `cd backend && ./server`
- Frontend running: `cd frontend && npx vite --port 5173`
- Browser open at `http://localhost:5173`
- Riverside Park Homicide case loaded with seed data
- Clear hypotheses beforehand so you can generate live

---

## 0:00 — INTRO (15s)
> "This is Dianoia — an open-source Palantir for crime scene investigation. We combine 3D scene reconstruction, AI-powered evidence reasoning, and iterative suspect profiling."

**Action:** Show landing page with wireframe animation. Click **ENTER_INVESTIGATION**.

---

## 0:15 — CRIME SCENE (30s)
> "A body was found at Riverside Park. We've scanned the scene and reconstructed it in 3D."

**Action:** You're on the **Scene tab**. Rotate the 3D room — show walls, furniture, evidence markers.

> "Each piece of evidence is placed at its real-world position. The knife here, blood spatter on the wall, the body near the coffee table."

**Action:** Click evidence items in the sidebar — show type badges (PHYS, FRNSC) and credibility scores.

**Action:** Switch to **Floor Plan 2D** view — show the top-down layout.

---

## 0:45 — AI REASONING (40s)
> "Now watch what happens when we ask our AI to reason about this evidence."

**Action:** Switch to **Analysis tab**. Click **⚡ALL**.

> "Gemini is analyzing all evidence and witness statements, weighing credibility, checking for contradictions..."

**Action:** Show the loading animation with elapsed timer. Wait ~60s or talk through the evidence graph while waiting.

> "Our evidence graph shows how each piece connects to the hypotheses."

**When hypotheses arrive:**
> "The AI generated ranked hypotheses. Number one: domestic dispute at 80% probability. It cross-references the kitchen knife, the witness who heard arguing, and the blood spatter angle."

**Action:** Expand hypothesis #1 — show reasoning text, supporting evidence (green), contradicting evidence (red).

---

## 1:25 — TIMELINE PLAYBACK (20s)
> "Each hypothesis comes with a full timeline. Let's watch how the crime unfolded."

**Action:** Switch to **Timeline tab**. Select hypothesis #1 if not auto-selected. Hit **Play**.

> "The suspect enters through the front door at 8:15 PM, moves to the desk area, the confrontation happens, and they flee through the back exit."

**Action:** Show actors moving in 3D viewport. Point at the track editor below.

---

## 1:45 — SUSPECT PROFILING (15s)
> "A witness described the suspect. We use AI image generation to create a photorealistic composite."

**Action:** Switch to **Profiling tab**. Show the generated Suspect Alpha portrait.

> "And we can iteratively refine it — 'add a beard', 'make the nose wider' — each refinement maintains facial consistency."

**Action:** Type `add glasses` in the chat (or show existing refinement history).

---

## 2:00 — CLOSING
> "Dianoia: think like Sherlock, powered by AI. Open source. Built in 6 hours."

---

## Emergency Fallbacks
- If Gemini is slow: "The AI is processing — in production this takes 10-30 seconds"
- If image gen fails: show the existing Suspect Alpha image and describe the flow
- If 3D doesn't load: switch to Floor Plan 2D view
- If backend is down: everything shows seed data from Supabase

## Key Talking Points (if judges ask)
- **Architecture:** React + R3F frontend, Go backend, Supabase real-time, Gemini reasoning
- **Marble:** 3D scene reconstruction from phone photos (show Realistic 3D tab)
- **Progressive reveal:** Evidence stages shift hypothesis rankings live
- **Credibility model:** Physical evidence weighted higher than witness testimony
- **Open source:** All code on GitHub
