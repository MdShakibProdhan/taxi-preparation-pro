# Taxi Exam Practice App

A static React (Vite) Single Page Application for practicing Finnish taxi exams.

## Features
- **6 Study Modes:** Question Bank, Exclusive, Study (Keywords), Exam Preparation (Topics), Mock Exam, and Recovery Quiz.
- **Client-Side Only:** No backend or database required.
- **LocalStorage Persistence:** Remembers your wrong answers for the Recovery Quiz across sessions.

## Local Development
1. Clone the repository and run `npm install`.
2. Start the dev server with `npm run dev`.

## Data Pipeline
To regenerate the question database from the raw Markdown files:
1. Ensure the source `.md` files are in their respective sibling folders (e.g., `../Rakib Bhai/Rakib Bhai.md`).
2. Run `node scripts/parseData.js` from the `taxi-exam-app` directory.
3. The script will generate `src/data/questions.json` with auto-tagged keywords and topics.

## GitHub Pages Deployment
1. Push this directory to your GitHub repository (e.g., `taxi-exam-app`).
2. The GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically build and deploy the app to the `gh-pages` branch on every push to `main`.
3. Go to your repository settings -> **Pages**.
4. Set the source to **Deploy from a branch**.
5. Select the `gh-pages` branch and `/ (root)` folder, then save.
6. Your site will be live at `https://<your-username>.github.io/taxi-exam-app/`.
