# 📚 Grammar Quest

An interactive, browser-based grammar worksheet game for middle/high school English classes. Students complete worksheets at home for points, classes compete for a semester prize, and the teacher can easily track who completed what.

---

## 🗂️ File Structure

```
grammar-quest/
├── index.html                  ← Student home page & identity setup
├── leaderboard.html            ← Public block standings (no student names)
├── teacher.html                ← Teacher dashboard, answer key, export/import
├── css/
│   └── style.css               ← Shared styles
├── js/
│   └── core.js                 ← Shared logic: scoring, storage, student ID
└── worksheets/
    ├── parts-of-speech.html    ← Worksheet 1 (10 pts)
    ├── parts-of-sentence.html  ← Worksheet 2 (10 pts)
    ├── phrases.html            ← Worksheet 3 (10 pts)
    ├── clauses.html            ← Worksheet 4 (10 pts)
    └── cumulative.html         ← Grand Challenge (30 pts)
```

**Total possible points per student: 70**

---

## 🚀 Setup Options

### Option A — GitHub Pages (Recommended, Free)

1. Create a GitHub account at [github.com](https://github.com) if you don't have one.
2. Click **New repository** → name it `grammar-quest` → set to **Public**.
3. Upload all files, preserving the folder structure above.
4. Go to **Settings → Pages → Source: Deploy from branch → main / root**.
5. Your site will be live at:  
   `https://YOUR-USERNAME.github.io/grammar-quest/`
6. Share that link with students!

### Option B — Run Locally (No internet required)

Just open `index.html` in any modern browser. All features work offline.  
*(Students must each open the files on their own device — scores are stored locally.)*

---

## 🎮 How It Works for Students

1. Student opens the site and goes to **Home**.
2. They enter their **Block** (A, D, or F) and **first name** — saved automatically.
3. They click any worksheet, answer 20 multiple-choice questions with instant feedback.
4. On submit, their score is saved and added to their block's total.
5. They can view the **Leaderboard** anytime to see block standings (no names shown).

> **Retakes:** Students may retake any worksheet. Only their **highest score** is kept.

---

## 📊 How It Works for Teachers

### Viewing Scores (Single Device)
If all students use the same shared computer (e.g., a lab), open **Teacher Dashboard** to see all records, block totals, and the full answer key.

### Collecting Scores from Student Devices
Since scores are stored in each browser's `localStorage`, use the **Export / Import** workflow:

1. Ask each student to visit **Teacher Dashboard → Export → Download JSON** on their device.
2. They email or share that file with you.
3. You open **Teacher Dashboard → Import** on your computer and paste each file's contents.
4. The dashboard automatically merges records (keeping the highest score per student).
5. Download a **CSV** for your gradebook.

### Answer Key
The full answer key for all 5 worksheets (100 questions total) is in the **Teacher Dashboard → Answer Key** tab.

---

## 📋 Worksheet Summary

| Worksheet | Topic | Questions | Points |
|-----------|-------|-----------|--------|
| 1 | Parts of Speech | 20 | 10 |
| 2 | Parts of a Sentence | 20 | 10 |
| 3 | Phrases | 20 | 10 |
| 4 | Clauses & Sentence Types | 20 | 10 |
| 5 | Grand Challenge (Cumulative) | 20 | 30 |

Each worksheet progresses from **simple → complex**, with the most difficult items requiring multi-layered grammatical analysis.

---

## 🏆 The Block Competition

- The **Leaderboard** page shows only **Block A / D / F totals** — never individual student names.
- Block totals update in real time as worksheets are submitted on the same device.
- After consolidating all scores via Export/Import, your Teacher Dashboard shows the authoritative totals.
- The block with the most total points at semester's end wins the prize! 🎉

---

## 🛠️ Customization

### Change the Block Letters
Edit the `<select>` options in `js/core.js` → `initStudentWidget()` and in `index.html`.

### Add or Edit Questions
Each worksheet's questions are in a `const QUESTIONS = [...]` array at the bottom of the HTML file. Each question object has:
```js
{
  text: `Sentence with <mark>highlighted word</mark> or <strong>bolded part</strong>`,
  choices: [
    { label:'A', text:'Answer option text' },
    { label:'B', text:'Answer option text' },
    // ...
  ],
  correct: 0,            // index of the correct choice (0 = A, 1 = B, etc.)
  explanation: 'Why this is correct — shown as feedback after answering.'
}
```

### Change Point Values
In each worksheet's `<script>` block at the bottom, find:
```js
GG.runWorksheet({
  pointsEach: 0.5,   // 20 × 0.5 = 10 pts
```
Adjust `pointsEach` to change the points per question.

---

## 🔒 Privacy Notes

- No data ever leaves students' devices unless they export and share the file with you.
- No login, no server, no database — everything runs in the browser.
- The public Leaderboard shows **block totals only** — student names are never displayed publicly.

---

## 📬 Questions?

Open an issue on this GitHub repository or contact your department for support.
