# ✈️ JourneyGenie: AI Itinerary Planner

JourneyGenie is a modern, AI-powered travel planner that generates highly personalized, day-by-day itineraries based on your budget, travel style, and timeline. 

## ✨ Features
*   **Intelligent Planning**: Utilizes Google's Gemini AI to instantly craft custom travel routes, complete with daily activities, descriptions, and cost estimates.
*   **Climate Checker**: Analyzes your proposed travel dates to ensure you aren't visiting during adverse weather seasons.
*   **Comprehensive Dashboards**: Every generated trip includes:
    *   **Smart Packing Lists** based on destination and climate.
    *   **Local Cuisine Guide** with must-try dishes and dining tips.
    *   **Cultural Cheat Sheet** featuring local phrases, tipping etiquette, and emergency numbers.
    *   **Interactive Budget Tracker** to log your expenses on the go.
*   **Interactive Maps**: View your daily activities seamlessly integrated with Leaflet and OpenRouteService.
*   **Authentication & History**: Secure Supabase email login allows you to save, revisit, and manage all your past trip plans locally.
*   **Export & Share**: Instantly export your entire detailed itinerary to a high-quality PDF, or copy a quick link to share with friends.
*   **Premium UI/UX**: Features a custom animated loader, smooth page transitions, and a built-in Dark Mode toggle.
*   **PWA Ready**: Install the app on your mobile device for quick access.

## 🛠️ Tech Stack
*   **Frontend**: React (v19), TypeScript, Vite
*   **Styling**: Tailwind CSS
*   **AI Engine**: Google Generative AI (`@google/genai`)
*   **Backend & Auth**: Supabase
*   **PDF Generation**: `html2pdf.js`

## 🚀 Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Configure Environment Variables:**
    Create a `.env.local` file in the root directory:
    ```env
    VITE_GEMINI_API_KEY=your_gemini_api_key
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

3.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    Open `http://localhost:3000` to start planning!

## 📦 Deployment & GitHub Push

### 1. Pushing to GitHub
To push this professional project to your GitHub account:
1. Go to [GitHub](https://github.com/new) and create a new empty repository (e.g., `journeygenie-ai`).
2. Run the following commands in your terminal:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for JourneyGenie AI"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/journeygenie-ai.git
   git push -u origin main
   ```

### 2. Deploying the Application

**Option A: Vercel (Recommended)**
Since this project already includes a `vercel.json` and is a Vite React app, Vercel is highly recommended.
1. Sign in to [Vercel](https://vercel.com/) with your GitHub account.
2. Click **Add New Project** and import your `journeygenie-ai` GitHub repository.
3. In the Environment Variables section, add your `VITE_GEMINI_API_KEY`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`.
4. Click **Deploy**. Vercel will automatically build and host your app.

**Option B: Netlify**
The project also includes a `netlify.toml` file, making it ready for Netlify.
1. Sign in to [Netlify](https://www.netlify.com/) with your GitHub account.
2. Click **Add new site** -> **Import an existing project** -> **GitHub**.
3. Select your `journeygenie-ai` repository.
4. Add your Environment Variables in the "Site settings" > "Environment variables" section.
5. Click **Deploy site**.
