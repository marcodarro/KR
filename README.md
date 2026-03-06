# KetoTracker - Complete Keto Diet & Health Tracking App

A comprehensive MyFitnessPal clone built for the ketogenic diet, featuring AI-powered food recognition, intermittent fasting timer, health data aggregation from wearables, and an AI health assistant.

![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-blue)
![Framework](https://img.shields.io/badge/Framework-Expo%20React%20Native-black)
![Backend](https://img.shields.io/badge/Backend-FastAPI-green)
![Database](https://img.shields.io/badge/Database-MongoDB-brightgreen)
![AI](https://img.shields.io/badge/AI-Gemini%20Vision-orange)

---

## 📱 Features Overview

### 🥑 Keto Diet Tracking
- **Net Carbs Calculator**: Automatically calculates net carbs (Total Carbs - Fiber - Sugar Alcohols)
- **Daily Macro Goals**: Set personalized targets for net carbs (20g, 25g, 30g, 50g presets)
- **Visual Progress**: Circular progress indicator showing remaining carb budget
- **Macro Tracking**: Calories, protein, fat, and carbohydrates

### 🍔 Food Logging
- **USDA Food Database**: Search 300,000+ foods from USDA FoodData Central
- **Custom Foods**: Add your own foods with full nutritional info
- **Meal Categories**: Breakfast, Lunch, Dinner, Snacks
- **Serving Sizes**: Adjustable portions with automatic calculations
- **Micronutrients**: Track vitamins and minerals

### 📸 AI Food Recognition (Gemini Vision)
- **Camera Scanning**: Take photos of your meals
- **Automatic Detection**: AI identifies foods, portions, and weights
- **Nutritional Analysis**: Instant macro/micronutrient estimates
- **Keto-Friendly Check**: AI evaluates if the meal fits your keto diet
- **Gallery Import**: Analyze photos from your camera roll

### ⏱️ Intermittent Fasting Timer (Zero App Clone)
- **Multiple Protocols**:
  - 16:8 (Most popular)
  - 18:6 (Extended)
  - 20:4 (Warrior Diet)
  - 14:10 (Beginner)
  - 23:1 (OMAD)
  - 36 Hour (Extended fast)
  - Custom duration
- **Live Timer**: Real-time countdown with progress circle
- **Fasting Stats**: Track streaks, total hours, completion rate
- **Push Notifications**: Get notified when your fast is complete
- **History Log**: View all past fasting sessions

### ❤️ Health Data Dashboard (Apple Health / Samsung Health Style)
- **Sleep Tracking**: Duration, quality, deep/light/REM stages
- **Heart Metrics**: Resting heart rate, HRV (Heart Rate Variability)
- **Activity**: Steps, calories burned, active minutes
- **Glucose Monitoring**: CGM data visualization, time in range, spikes
- **Stress & Recovery**: Readiness score, recovery score, stress level
- **Body Composition**: Weight, body fat %, hydration

### 🤖 AI Health Assistant (Powered by Gemini)
- **Conversational Chat**: Ask questions about your health data
- **Personalized Insights**: AI analyzes your trends and patterns
- **Keto Advice**: Get diet recommendations based on your goals
- **Sleep Optimization**: Tips to improve sleep quality
- **Glucose Analysis**: Understand your CGM data

### 🔗 Wearable Integrations (Terra API Ready)
Supports 200+ devices through Terra API:
- **Platforms**: Apple Health, Google Fit, Samsung Health
- **Wearables**: Fitbit, Garmin, WHOOP, Oura Ring, Polar, COROS, Withings
- **CGM Devices**: Dexcom G6/G7, FreeStyle Libre, Medtronic

### 💡 Smart Meal Suggestions
- **Carb Budget Based**: Recommendations based on remaining daily carbs
- **Keto-Friendly Foods**: Curated list of low-carb options
- **Dynamic Updates**: Suggestions change as you log food

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Expo React Native (SDK 52)
- **Routing**: Expo Router (File-based)
- **State Management**: Zustand
- **UI Components**: React Native core + custom components
- **Charts**: react-native-svg, react-native-gifted-charts
- **Camera**: expo-camera, expo-image-picker
- **Notifications**: expo-notifications

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB with Motor (async driver)
- **Authentication**: Google OAuth via Emergent Auth
- **AI Integration**: Emergent Integrations (Gemini 2.5 Flash)
- **Food API**: USDA FoodData Central

---

## 📁 Project Structure

```
ketotracker/
├── frontend/                    # Expo React Native App
│   ├── app/                     # Screens (Expo Router)
│   │   ├── (tabs)/              # Tab navigation screens
│   │   │   ├── index.tsx        # Dashboard (Net Carbs)
│   │   │   ├── diary.tsx        # Food Diary
│   │   │   ├── fasting.tsx      # Fasting Timer
│   │   │   ├── health.tsx       # Health Dashboard
│   │   │   ├── profile.tsx      # User Profile
│   │   │   ├── goals.tsx        # Keto Goals Settings
│   │   │   └── suggestions.tsx  # Meal Suggestions
│   │   ├── login.tsx            # Google Login
│   │   ├── auth-callback.tsx    # OAuth Callback
│   │   ├── add-food.tsx         # Food Search & Add
│   │   ├── camera.tsx           # AI Food Scanner
│   │   ├── food-result.tsx      # AI Analysis Results
│   │   ├── health-chat.tsx      # AI Health Assistant
│   │   ├── log-health.tsx       # Manual Health Entry
│   │   ├── integrations.tsx     # Wearable Connections
│   │   └── _layout.tsx          # Root Layout
│   ├── src/
│   │   ├── store/               # Zustand Stores
│   │   │   ├── authStore.ts     # Authentication
│   │   │   ├── nutritionStore.ts# Food & Nutrition
│   │   │   ├── fastingStore.ts  # Fasting Timer
│   │   │   └── healthStore.ts   # Health Data
│   │   ├── components/          # Reusable Components
│   │   │   ├── NetCarbsCircle.tsx
│   │   │   ├── MacroBar.tsx
│   │   │   └── FoodLogItem.tsx
│   │   └── services/            # API Services
│   │       └── api.ts
│   ├── assets/                  # Images & Fonts
│   ├── app.json                 # Expo Configuration
│   └── package.json             # Dependencies
│
├── backend/                     # FastAPI Server
│   ├── server.py                # All API Endpoints
│   ├── requirements.txt         # Python Dependencies
│   └── .env                     # Environment Variables
│
└── README.md                    # This File
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and Yarn
- Python 3.9+
- MongoDB (local or Atlas)
- Expo Go app (for mobile testing)

### Environment Variables

#### Backend (.env)
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="ketotracker"
EMERGENT_LLM_KEY="your-emergent-llm-key"

# Optional: For real wearable data
TERRA_API_KEY="your-terra-api-key"
TERRA_DEV_ID="your-terra-dev-id"
```

#### Frontend (.env)
```env
EXPO_PUBLIC_BACKEND_URL="http://localhost:8001"
```

### Installation

#### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

#### Frontend Setup
```bash
cd frontend
yarn install
yarn start
```

### Running the App
1. Start MongoDB
2. Start the backend server
3. Start Expo development server
4. Scan QR code with Expo Go (mobile) or press 'w' for web

---

## 📡 API Documentation

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/session` | POST | Exchange OAuth session |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/logout` | POST | Logout user |

### Food & Nutrition
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/foods/search?q=` | GET | Search USDA database |
| `/api/foods/custom` | POST | Create custom food |
| `/api/food-logs` | GET/POST | Get/Create food logs |
| `/api/food-logs/{id}` | DELETE | Delete food log |
| `/api/nutrition/daily?date=` | GET | Daily nutrition summary |
| `/api/nutrition/weekly` | GET | Weekly nutrition data |
| `/api/goals` | GET/PUT | User macro goals |
| `/api/suggestions` | GET | Meal suggestions |
| `/api/ai/analyze-food` | POST | AI food image analysis |

### Fasting
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/fasting/protocols` | GET | Available protocols |
| `/api/fasting/start` | POST | Start fasting session |
| `/api/fasting/end` | POST | End fasting session |
| `/api/fasting/current` | GET | Current fast status |
| `/api/fasting/history` | GET | Fasting history |
| `/api/fasting/stats` | GET | Fasting statistics |

### Health Data
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health/dashboard?date=` | GET | Full health dashboard |
| `/api/health/weekly` | GET | 7-day health trends |
| `/api/health/log` | POST | Log health metrics |
| `/api/health/nutrition/{date}` | GET | Detailed nutrition |
| `/api/health/insights` | GET | AI health insights |
| `/api/health/chat` | POST | AI chat message |
| `/api/health/chat/history` | GET/DELETE | Chat history |

### Integrations
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/integrations/terra/providers` | GET | Available providers |
| `/api/integrations/terra/connect/{id}` | POST | Connect wearable |
| `/api/integrations/status` | GET | Integration status |

---

## 🔑 Enabling Real Integrations

### Terra API (Wearables & CGM)
1. Sign up at [tryterra.co](https://tryterra.co)
2. Get your API Key and Dev ID
3. Add to backend `.env`:
   ```env
   TERRA_API_KEY="your-key"
   TERRA_DEV_ID="your-dev-id"
   ```
4. Restart backend server

### Emergent LLM Key (AI Features)
The app uses Emergent's unified LLM key for:
- Food image analysis (Gemini Vision)
- Health insights generation
- AI health chat assistant

---

## 📊 Data Models

### User Goals
```json
{
  "daily_net_carbs": 25,
  "daily_calories": 2000,
  "daily_protein": 100,
  "daily_fat": 150
}
```

### Food Log Entry
```json
{
  "food_name": "Grilled Chicken Breast",
  "meal_type": "lunch",
  "servings": 1.5,
  "serving_size": 100,
  "serving_unit": "g",
  "calories": 165,
  "total_carbs": 0,
  "fiber": 0,
  "net_carbs": 0,
  "protein": 31,
  "fat": 3.6
}
```

### Fasting Session
```json
{
  "protocol_id": "16_8",
  "protocol_name": "16:8",
  "target_hours": 16,
  "start_time": "2024-01-15T20:00:00Z",
  "is_active": true,
  "completed": false
}
```

### Health Dashboard
```json
{
  "sleep": { "duration_hours": 7.5, "sleep_quality": 85 },
  "heart": { "resting_heart_rate": 62, "hrv": 45 },
  "activity": { "steps": 8500, "active_calories": 320 },
  "glucose": { "avg_glucose": 95, "time_in_range_percent": 92 },
  "stress_recovery": { "readiness_score": 78, "recovery_score": 82 }
}
```

---

## 🎨 UI/UX Features

- **Dark Theme**: Easy on the eyes, perfect for health apps
- **Color Coding**:
  - Green (#10B981): Keto/nutrition features
  - Orange (#F59E0B): Fasting features
  - Red (#EF4444): Heart metrics
  - Purple (#8B5CF6): Sleep metrics
  - Cyan (#06B6D4): Body metrics
- **Responsive**: Works on phones, tablets, and web
- **Haptic Feedback**: Native feel on mobile
- **Pull to Refresh**: Update data with gesture
- **Bottom Sheet Modals**: Native iOS/Android feel

---

## 🔒 Security

- Google OAuth for secure authentication
- Session tokens stored in HTTP-only cookies
- No passwords stored in database
- API endpoints protected with authentication middleware

---

## 📱 App Screens

The app includes 15+ screens:

1. **Login Screen** - Google OAuth with feature highlights
2. **Dashboard** - Net carbs circle, macro bars, keto status
3. **Food Diary** - Meals organized by category with date navigation
4. **Add Food** - Search USDA database, view nutrition, add servings
5. **AI Food Scanner** - Camera viewfinder with scan frame
6. **Food Analysis Results** - AI-detected foods with keto check
7. **Fasting Timer** - Circular progress, live countdown
8. **Protocol Selection** - Choose fasting schedule
9. **Fasting History** - Past sessions with completion status
10. **Health Dashboard** - Readiness scores, all health metrics
11. **Glucose Chart** - Visual CGM data with time in range
12. **AI Health Chat** - Conversational assistant
13. **Log Health Data** - Manual entry with tabbed categories
14. **Integrations** - Connect wearables and CGM devices
15. **Profile** - User info, goals access, logout

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- [USDA FoodData Central](https://fdc.nal.usda.gov/) - Food nutrition database
- [Terra API](https://tryterra.co/) - Wearable data aggregation
- [Expo](https://expo.dev/) - React Native framework
- [FastAPI](https://fastapi.tiangolo.com/) - Python web framework
- [Emergent](https://emergentagent.com/) - AI integrations & deployment

---

## 📞 Support

For issues and feature requests, please open a GitHub issue.

---

**Built with ❤️ for the keto community**
