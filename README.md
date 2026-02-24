# 🚀 FitFusion AI

**The Ultimate AI-Powered Personal Trainer & Nutritionist**

FitFusion AI is a premium mobile application designed to provide a completely personalized health journey. By leveraging the power of Google Gemini AI and a robust Supabase backend, FitFusion creates dynamic plans that adapt to your goals, equipment, and dietary needs.

---

## ✨ Features

### 🤖 AI Workout Architect
- **7-Day Dynamic Programs**: Custom plans generated for your specific goals (Weight Loss, Muscle Gain, etc.).
- **Active Recovery**: Dedicated mobility and tissue health routines for rest days.
- **Detailed Instructions**: Every exercise comes with sets, reps, and professional form guidance.
- **Calorie Burn Estimation**: Real-time tracking of calories burned per session.

### 🥗 Intelligent Nutrition
- **Weekly Meal Plans**: Personalized menus that respect your dietary preferences (Gluten-free, Vegan, etc.).
- **Interactive Recipes**: Tap any meal to see full ingredients and step-by-step cooking instructions.
- **Micro-Tracking**: Precise macro goals (Protein, Carbs, Fats) tailored to your biology.

### 🔥 Real-time Dashboard
- **Live Nutrition Rings**: Track `Eaten` vs `Burned` calories visually.
- **Streak System**: Motivational streaks for both your Workout and Diet adherence.
- **AI Coach Insights**: Daily motivational quotes and tailored advice based on your progress.

### 🛠️ Coming Soon
- **📸 AI Meal Scanner**: Log your food instantly by snapping a photo.
- **📈 Progress Analytics**: Detailed charts to visualize weight loss and strength gains.

---

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **AI Processing**: [Google Gemini 2.5 Flash](https://ai.google.dev/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + RLS)
- **Icons**: [Lucide React Native](https://lucide.dev/icons/)
- **Navigation**: React Navigation (Tabs + Stack)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Expo Go app on your mobile device
- Supabase Account & Project
- Google AI (Gemini) API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Scalium-Tech/FitFusion.git
   cd FitFusion
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Initialize Supabase**
   Run the provided `supabase_setup.sql` in your Supabase SQL Editor to create the necessary tables and RLS policies.

5. **Start the app**
   ```bash
   npx expo start
   ```
   Scan the QR code with Expo Go (Android) or the Camera app (iOS).

---

## 🎨 Design System

FitFusion uses a custom **Glassmorphism Dark Theme**:
- **Primary Color**: `#13EC5B` (Vibrant Green)
- **Background**: Deep Charcoal/Black
- **Typography**: Modern sans-serif hierarchy
- **Micro-animations**: Smooth transitions and haptic feedback

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---

**Developed with ❤️ by Scalium Tech**
