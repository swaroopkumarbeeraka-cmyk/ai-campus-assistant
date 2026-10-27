# Campus Assistant - VLITS R23 Regulations

A standalone, mobile-first web chatbot designed for **Vignan's Lara Institute of Technology & Science (VLITS), Vadlamudi**. It provides fast and accurate answers to student questions regarding **B.Tech R23 Academic Regulations**, course structures, credit schemes, evaluation criteria, and first-year syllabus.

---

## Quick Customization Guide (For HTML/CSS Beginners)

### 1. How to Edit the System Prompt (`src/prompts/system.txt`)
- The assistant's entire knowledge, persona, and rules come strictly from `src/prompts/system.txt`.
- Open `src/prompts/system.txt` in any text editor.
- Paste your full R23 prompt text (up to ~45k tokens) directly into this file and save it.
- **That's it!** The server reads this file fresh on every question at runtime. You do **not** need to touch any code or rebuild the app for prompt changes to take effect.

---

### 2. How to Change Model & Temperature (`src/config.ts`)
Open `src/config.ts`:
```typescript
// To change the model name:
export const GEMINI_MODEL = 'gemini-3.8-flash';

// To change the creativity/temperature (0.0 to 1.0; 0.1 is recommended for strict rules):
export const TEMPERATURE = 0.1;
```

---

### 3. How to Change Colors & Theme (`src/index.css`)
All colors are defined right at the top of `src/index.css` inside `:root` (light mode) and `.dark` (dark mode):
```css
:root {
  --primary: #1E40AF;        /* Primary button, user avatar & accents */
  --primary-hover: #1D4ED8;  /* Hover state */
  --bg: #F8FAFC;             /* Page background */
  --surface: #FFFFFF;        /* Cards and input backgrounds */
  --bubble-user: #1E40AF;    /* User bubble background */
  --bubble-user-text: #FFFFFF; /* User bubble text color */
  --bubble-bot: #FFFFFF;     /* Assistant bubble background */
  --bubble-bot-text: #0F172A; /* Assistant bubble text color */
}
```
Simply change any hex code (e.g., `#1E40AF`) to match your college website's color palette!

---

### 4. Embedding & Pre-filling Questions via URL
You can link directly to Campus Assistant from your college Campus OS portal with pre-filled questions using the `?q=` URL parameter:
```
https://your-domain.com/?q=Attendance+shortage+rules
```
The assistant will automatically load, populate the question, and generate the answer immediately on page open.

---

### 5. Negative Feedback Logs
When a student clicks the **Thumbs Down** icon on an answer:
- The question, answer, and timestamp are saved in the student's browser `localStorage` under the key `"feedback_log"`.
- A "Thanks, noted" toast appears on screen.

---

### 6. How to Run & Deploy

#### Development Mode:
```bash
npm run dev
```

#### Production Build & Run:
```bash
npm run build
npm start
```
`npm start` launches the Express server on port 3000 (or `process.env.PORT`) serving the compiled production frontend and the streaming `/api/chat` endpoint.
