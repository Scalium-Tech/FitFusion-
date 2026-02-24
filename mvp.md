MVP PLAN — AI Personal Trainer + Diet Planner (Mobile App Builder)

I want to build a production-ready cross-platform mobile application using React Native with Expo, designed to be deployed on both iOS and Android (App Store & Play Store ready).

Tech stack: React Native + Expo
Goal: A clean, fully working mobile app that onboards users, generates personalized workout & diet plans, tracks calories (including photo-based tracking), maintains streaks, and shows progress.

This version includes all agreed features:

AI workout plan

AI diet plan

calorie tracking (manual + photo)

streak system

progress dashboard

basic AI chat

Mobile-first. Simple. Realistic MVP.

🎯 MVP Scope (What must work)

User completes onboarding

App generates workout plan

App generates diet plan

User tracks calories (manual + photo scan)

User marks workouts complete

Streak system updates

Dashboard shows progress

Basic AI chat trainer

Everything screen-based and simple.

📱 App Navigation Structure

Bottom tabs after onboarding:

Home

Workout

Diet

Tracker

Progress

AI Chat

👤 Onboarding Flow (Multi-Screen)

Collect essential info in under 2 minutes.

Screens:

Welcome

Name

Goal

Body details (age, gender, height, weight)

Target weight (if needed)

Health conditions

Activity level + workout days

Diet preference

Workout preference

Lifestyle habits

Generate plan

Result → Dashboard

Store user profile locally.

🏠 Home Dashboard (UPDATED)

Shows:

Greeting with name

🔥 Workout streak

🥗 Diet streak

🏆 Best streak

Today’s workout

Today’s calorie progress

Calories goal

Quick buttons:

Start Workout

Scan Meal

Add Meal

View Plan

Purpose: daily overview + motivation.

🏋️ AI Workout Plan Generator

Button:
Generate My Plan

Output:

Weekly workout split

Exercises per day

Sets & reps

Rest time

Difficulty

Features:

Exercise detail screen

Instructions

Beginner alternative

Replace exercise button

When user taps:
Workout Completed
→ workout streak updates.

Store weekly plan locally.

🥗 AI Diet Plan Generator

Based on:

Goal

Calories

Diet type

Health conditions

Output:

Breakfast

Lunch

Dinner

Calories

Protein

Features:

Meal cards with calories

Mark meal completed

Regenerate plan

📸 Photo-Based Calorie Tracker (NEW CORE MVP FEATURE)

User can:

Upload food photo

App estimates calories

Shows result

User confirms

Calories added to daily total

Also allow:
Manual calorie entry.

Tracker shows:
Calories consumed
Calories goal
Remaining calories

Progress bar included.

📅 Daily Tracker (UPDATED)

User logs:

Weight

Workout completion

Meals

Calories

Buttons:

Workout Completed

Meal Done

Scan Meal

Show:

Daily summary

Streak status

🔥 Streak System (CORE FEATURE)

Track:

1️⃣ Workout streak
2️⃣ Diet/calorie streak
3️⃣ Perfect day streak

Logic:

Workout completed → workout streak +1

Calorie goal reached → diet streak +1

Both → perfect streak

Miss day → reset.

Show streak on:

Home screen

Dashboard

📊 Progress Dashboard

Charts:

Weight trend

Calories trend

Streak history

Consistency

Also show:

Goal progress %

Estimated goal date

Mobile-friendly visuals only.

🤖 AI Chat Trainer (Basic)

Chat screen where user asks:

“What should I eat today?”

“I missed gym”

“Motivate me”

Limit:
5 messages/day.

Simple rule-based responses tied to:

user goal

streak

plan