# Flash Card System: Project Vision & Strategy

## Core Philosophy
A seamless, local-first ecosystem that bridges the gap between **Knowledge Capture** (Notes) and **Long-term Retention** (Flashcards). The system is "organic"—it adapts to the user's habits rather than forcing a rigid structure.

---

## 1. Minimum Viable Product (MVP)
The MVP is achieved when a user can move from **Raw Information** to **Mastered Knowledge** with zero friction.

### MVP Feature Checklist:
*   [x] **Rich-Text Notes:** Notion-style editor for capturing thoughts.
*   [x] **SM-2 SRS Brain:** Algorithm-driven review scheduling.
*   [ ] **PDF Ingestion:** Drag & drop document text extraction (Current Goal).
*   [ ] **Smart "Study Now" Engine:** Proactive dashboard guidance.
*   [ ] **Bidirectional Linking:** Seamless connection between cards and source notes.

---

## 2. Strategic Pivot: Intelligence & Automation
We have moved away from manual organization in favor of an automated experience. The system's intelligence comes from its ability to ingest material and suggest study actions.

### "Study Mission Control"
The **Dashboard** is the "Action Center."
*   **Daily Goals:** Dynamic targets based on SRS due dates.
*   **Focus Suggestions:** The system suggests a "Bundle" (e.g., "You have 15 cards due in *Biology*; here is a related *Note* to review first").
*   **Mastery Tracking:** Visual progress bars for every module.

---

## 3. The Roadmap (Post-MVP)

### Phase 1: The "Smart Bridge" (Current Focus)
*   **PDF Ingestion:** Automatic text extraction from document drops.
*   **Enhanced Extraction:** Primary workflow for creating content from ingested text.
*   **Bidirectional Linking:** Context-aware study (Cards <-> Notes).

### Phase 2: Dashboard 2.0 (The Brain)
*   **Activity Heatmap:** (Implemented) - expand to include "Note Activity."
*   **The "Study Now" Engine:** Single-button filtered review session.
*   **Mastery Visualization:** Circular progress rings for each Module.

---

## 4. Technical Mandates
*   **Privacy by Design:** No PII collection; strictly local-first.
*   **Visual Excellence:** High-signal visuals, "Squircle" (rounded-[2rem]) aesthetic, and smooth transitions.
*   **Clean Architecture:** Use "Derived State" (via `useMemo`) for speed and consistency.

---

## 5. Definition of Success
The user feels they are "building a second brain" where they can drop a PDF, extract key concepts into flashcards, and let the app guide their daily study routine with zero manual organization.
