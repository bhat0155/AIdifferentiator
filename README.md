# 🤖 AI Differentiator

**AI Differentiator** is a playground to compare AI models side-by-side.  
Users type a single prompt, and responses from **OpenAI GPT-4o-mini** and **Google Gemini 2.5 Flash** stream back in **real-time**.  

The app displays:  
- Live streaming responses  
- Status updates (streaming → complete → error)  
- Performance metrics:  
  - ⏱️ Response time (ms)  
  - 🔢 Token count (approx)  
  - 💲 Cost estimate  
- Responses stored in a shared **PostgreSQL database**  

---

## 🚀 Live Demo

- **Frontend (Next.js on Vercel)** → https://a-idifferentiator.vercel.app  
- **Backend (NestJS on Render)** → https://aidifferentiator-backend.onrender.com  
- Example Health Check → https://aidifferentiator-backend.onrender.com/health  

---

## 📦 Project Structure
AIdifferentiator/
├── frontend/   # Next.js 15 + Zustand + Tailwind + React Markdown
└── backend/    # NestJS + Prisma + PostgreSQL + SSE streaming

---

## ⚙️ Setup Instructions (Local)

### 1. Clone the repo
```bash
git clone https://github.com/<your-username>/AIdifferentiator.git
cd AIdifferentiator

2. Install dependencies
cd backend
npm install

Frontend:
cd ../frontend
npm install


Backend → backend/.env
PORT=3001

# ✅ Render-hosted Postgres (already provisioned)
DATABASE_URL="postgresql://aidifferentaitor_user:RUTqwIpRK9pK0Kk8AA3WpHciNGAEK5h5@dpg-d3erehili9vc73dm0p6g-a.oregon-postgres.render.com:5432/aidifferentaitor?sslmode=require"

# Allow local + deployed frontend
CORS_ORIGIN=http://localhost:3000,https://aidifferentiator.vercel.app

# Your API Keys
OPENAI_API_KEY=sk-xxxx
GEMINI_API_KEY=AIza-xxxx

Frontend → frontend/.env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

Database migration:
cd backend
npx prisma migrate dev

start app:
backend
cd backend
npm run start:dev

frontend
cd frontend
npm run dev

	•	Frontend runs on → http://localhost:3000
	•	Backend runs on → http://localhost:3001

⸻

💡 Usage
	1.	Open the frontend in your browser.
	2.	Enter a prompt (e.g. “Explain WebSockets vs SSE”).
	3.	Press Submit.
	4.	Both OpenAI and Gemini stream their answers live side-by-side.
	5.	Once complete, metrics are shown under each column.

📚 Tech Stack
	•	Frontend → Next.js 15, React 19, TailwindCSS, Zustand, React Markdown
	•	Backend → NestJS 11, Prisma, PostgreSQL (Render), RxJS SSE
	•	Models → OpenAI GPT-4o-mini, Google Gemini 2.5 Flash
	•	Deployment →
	•	Frontend on Vercel
	•	Backend on Render
	•	Database on Render (Postgres)

⸻

👨‍💻 Developer Notes
	•	For local testing, you can use your own OpenAI/Gemini API keys.
	•	The included DATABASE_URL points to a Render Postgres instance created for this project (expires if the free tier resets).
	•	To reset schema locally, run: npx prisma migrate reset