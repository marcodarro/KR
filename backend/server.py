from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import base64
import json
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserGoals(BaseModel):
    user_id: str
    daily_net_carbs: int = 25  # Default 25g for keto
    daily_calories: int = 2000
    daily_protein: int = 100
    daily_fat: int = 150
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserGoalsUpdate(BaseModel):
    daily_net_carbs: Optional[int] = None
    daily_calories: Optional[int] = None
    daily_protein: Optional[int] = None
    daily_fat: Optional[int] = None

# ==================== FASTING MODELS ====================

class FastingProtocol(BaseModel):
    protocol_id: str
    name: str
    fasting_hours: int
    eating_hours: int
    description: str

# Pre-defined fasting protocols (like Zero app)
FASTING_PROTOCOLS = [
    FastingProtocol(protocol_id="16_8", name="16:8", fasting_hours=16, eating_hours=8, description="Most popular. Fast for 16 hours, eat within 8 hours."),
    FastingProtocol(protocol_id="18_6", name="18:6", fasting_hours=18, eating_hours=6, description="Extended fast. Fast for 18 hours, eat within 6 hours."),
    FastingProtocol(protocol_id="20_4", name="20:4", fasting_hours=20, eating_hours=4, description="Warrior Diet. Fast for 20 hours, eat within 4 hours."),
    FastingProtocol(protocol_id="14_10", name="14:10", fasting_hours=14, eating_hours=10, description="Beginner friendly. Fast for 14 hours, eat within 10 hours."),
    FastingProtocol(protocol_id="23_1", name="23:1 (OMAD)", fasting_hours=23, eating_hours=1, description="One Meal A Day. Fast for 23 hours."),
    FastingProtocol(protocol_id="36", name="36 Hour", fasting_hours=36, eating_hours=0, description="Extended fast for 36 hours."),
    FastingProtocol(protocol_id="custom", name="Custom", fasting_hours=0, eating_hours=0, description="Set your own fasting duration."),
]

class FastingSession(BaseModel):
    session_id: str = Field(default_factory=lambda: f"fast_{uuid.uuid4().hex[:12]}")
    user_id: str
    protocol_id: str
    protocol_name: str
    target_hours: int
    start_time: datetime
    end_time: Optional[datetime] = None
    target_end_time: datetime
    is_active: bool = True
    completed: bool = False
    actual_hours: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StartFastRequest(BaseModel):
    protocol_id: str
    custom_hours: Optional[int] = None  # For custom protocol
    start_time: Optional[datetime] = None  # Optional, defaults to now

class EndFastRequest(BaseModel):
    notes: Optional[str] = None

class FastingStats(BaseModel):
    total_fasts: int = 0
    completed_fasts: int = 0
    total_hours_fasted: float = 0
    average_fast_duration: float = 0
    longest_fast: float = 0
    current_streak: int = 0
    best_streak: int = 0

# ==================== HEALTH DATA MODELS ====================

class SleepData(BaseModel):
    record_id: str = Field(default_factory=lambda: f"sleep_{uuid.uuid4().hex[:12]}")
    user_id: str
    date: str  # YYYY-MM-DD
    duration_hours: float = 0
    sleep_quality: int = 0  # 1-100 score
    deep_sleep_hours: float = 0
    light_sleep_hours: float = 0
    rem_sleep_hours: float = 0
    awake_hours: float = 0
    sleep_start: Optional[str] = None  # ISO timestamp
    sleep_end: Optional[str] = None
    source: str = "manual"  # manual, terra, apple_health, samsung_health
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HeartData(BaseModel):
    record_id: str = Field(default_factory=lambda: f"heart_{uuid.uuid4().hex[:12]}")
    user_id: str
    date: str
    resting_heart_rate: Optional[int] = None  # bpm
    hrv: Optional[float] = None  # ms (heart rate variability)
    avg_heart_rate: Optional[int] = None
    max_heart_rate: Optional[int] = None
    min_heart_rate: Optional[int] = None
    heart_rate_zones: Dict[str, float] = Field(default_factory=dict)  # zone: minutes
    source: str = "manual"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ActivityData(BaseModel):
    record_id: str = Field(default_factory=lambda: f"activity_{uuid.uuid4().hex[:12]}")
    user_id: str
    date: str
    steps: int = 0
    active_calories: float = 0
    total_calories: float = 0
    distance_km: float = 0
    floors_climbed: int = 0
    active_minutes: int = 0
    workouts: List[Dict[str, Any]] = Field(default_factory=list)
    source: str = "manual"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GlucoseData(BaseModel):
    record_id: str = Field(default_factory=lambda: f"glucose_{uuid.uuid4().hex[:12]}")
    user_id: str
    date: str
    readings: List[Dict[str, Any]] = Field(default_factory=list)  # [{timestamp, value_mg_dl}]
    avg_glucose: Optional[float] = None  # mg/dL
    min_glucose: Optional[float] = None
    max_glucose: Optional[float] = None
    time_in_range_percent: Optional[float] = None  # 70-180 mg/dL
    time_below_range_percent: Optional[float] = None
    time_above_range_percent: Optional[float] = None
    glucose_variability: Optional[float] = None  # CV%
    estimated_a1c: Optional[float] = None
    spike_count: int = 0
    source: str = "manual"  # manual, dexcom, libre, terra
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StressRecoveryData(BaseModel):
    record_id: str = Field(default_factory=lambda: f"stress_{uuid.uuid4().hex[:12]}")
    user_id: str
    date: str
    stress_level: Optional[int] = None  # 1-100
    recovery_score: Optional[int] = None  # 1-100
    readiness_score: Optional[int] = None  # 1-100
    strain_score: Optional[float] = None
    body_battery: Optional[int] = None  # Garmin style 1-100
    source: str = "manual"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BodyData(BaseModel):
    record_id: str = Field(default_factory=lambda: f"body_{uuid.uuid4().hex[:12]}")
    user_id: str
    date: str
    weight_kg: Optional[float] = None
    body_fat_percent: Optional[float] = None
    muscle_mass_kg: Optional[float] = None
    bone_mass_kg: Optional[float] = None
    water_percent: Optional[float] = None
    bmi: Optional[float] = None
    waist_cm: Optional[float] = None
    hydration_ml: Optional[int] = None
    source: str = "manual"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NutritionSummary(BaseModel):
    date: str
    calories: float = 0
    net_carbs: float = 0
    total_carbs: float = 0
    fiber: float = 0
    protein: float = 0
    fat: float = 0
    saturated_fat: float = 0
    # Micronutrients
    sodium: float = 0
    potassium: float = 0
    cholesterol: float = 0
    # Vitamins
    vitamin_a: float = 0  # mcg
    vitamin_c: float = 0  # mg
    vitamin_d: float = 0  # mcg
    vitamin_e: float = 0  # mg
    vitamin_k: float = 0  # mcg
    vitamin_b1: float = 0  # mg (thiamine)
    vitamin_b2: float = 0  # mg (riboflavin)
    vitamin_b3: float = 0  # mg (niacin)
    vitamin_b6: float = 0  # mg
    vitamin_b12: float = 0  # mcg
    folate: float = 0  # mcg
    # Minerals
    calcium: float = 0  # mg
    iron: float = 0  # mg
    magnesium: float = 0  # mg
    phosphorus: float = 0  # mg
    zinc: float = 0  # mg
    selenium: float = 0  # mcg
    copper: float = 0  # mg
    manganese: float = 0  # mg

class HealthDataInput(BaseModel):
    date: str
    # Sleep
    sleep_duration_hours: Optional[float] = None
    sleep_quality: Optional[int] = None
    deep_sleep_hours: Optional[float] = None
    light_sleep_hours: Optional[float] = None
    rem_sleep_hours: Optional[float] = None
    # Heart
    resting_heart_rate: Optional[int] = None
    hrv: Optional[float] = None
    # Activity
    steps: Optional[int] = None
    active_calories: Optional[float] = None
    active_minutes: Optional[int] = None
    # Glucose
    glucose_reading: Optional[float] = None  # Single reading
    # Stress/Recovery
    stress_level: Optional[int] = None
    recovery_score: Optional[int] = None
    readiness_score: Optional[int] = None
    # Body
    weight_kg: Optional[float] = None
    body_fat_percent: Optional[float] = None
    hydration_ml: Optional[int] = None

class TerraIntegration(BaseModel):
    user_id: str
    terra_user_id: Optional[str] = None
    provider: str  # fitbit, garmin, whoop, oura, etc.
    connected: bool = False
    last_sync: Optional[datetime] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessage(BaseModel):
    message_id: str = Field(default_factory=lambda: f"msg_{uuid.uuid4().hex[:12]}")
    user_id: str
    role: str  # user or assistant
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    message: str
    include_health_context: bool = True

class FoodItem(BaseModel):
    food_id: str = Field(default_factory=lambda: f"food_{uuid.uuid4().hex[:12]}")
    name: str
    brand: Optional[str] = None
    serving_size: float = 100
    serving_unit: str = "g"
    calories: float = 0
    total_carbs: float = 0
    fiber: float = 0
    sugar_alcohols: float = 0
    net_carbs: float = 0  # Calculated: total_carbs - fiber - sugar_alcohols
    protein: float = 0
    fat: float = 0
    saturated_fat: float = 0
    sodium: float = 0
    potassium: float = 0
    cholesterol: float = 0
    vitamin_a: float = 0
    vitamin_c: float = 0
    calcium: float = 0
    iron: float = 0
    is_custom: bool = False
    user_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FoodItemCreate(BaseModel):
    name: str
    brand: Optional[str] = None
    serving_size: float = 100
    serving_unit: str = "g"
    calories: float = 0
    total_carbs: float = 0
    fiber: float = 0
    sugar_alcohols: float = 0
    protein: float = 0
    fat: float = 0
    saturated_fat: float = 0
    sodium: float = 0
    potassium: float = 0
    cholesterol: float = 0
    vitamin_a: float = 0
    vitamin_c: float = 0
    calcium: float = 0
    iron: float = 0

class FoodLog(BaseModel):
    log_id: str = Field(default_factory=lambda: f"log_{uuid.uuid4().hex[:12]}")
    user_id: str
    food_id: str
    food_name: str
    meal_type: str  # breakfast, lunch, dinner, snack
    servings: float = 1.0
    serving_size: float = 100
    serving_unit: str = "g"
    calories: float = 0
    total_carbs: float = 0
    fiber: float = 0
    sugar_alcohols: float = 0
    net_carbs: float = 0
    protein: float = 0
    fat: float = 0
    log_date: str  # YYYY-MM-DD format
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FoodLogCreate(BaseModel):
    food_id: str
    food_name: str
    meal_type: str
    servings: float = 1.0
    serving_size: float = 100
    serving_unit: str = "g"
    calories: float = 0
    total_carbs: float = 0
    fiber: float = 0
    sugar_alcohols: float = 0
    net_carbs: float = 0
    protein: float = 0
    fat: float = 0
    log_date: str

class ImageAnalysisRequest(BaseModel):
    image_base64: str

class DailyNutrition(BaseModel):
    user_id: str
    date: str  # YYYY-MM-DD
    total_calories: float = 0
    total_carbs: float = 0
    total_fiber: float = 0
    total_sugar_alcohols: float = 0
    total_net_carbs: float = 0
    total_protein: float = 0
    total_fat: float = 0
    meals: Dict[str, List[str]] = Field(default_factory=lambda: {
        "breakfast": [], "lunch": [], "dinner": [], "snack": []
    })

# ==================== AUTH HELPERS ====================

async def get_current_user(request: Request) -> User:
    """Get current user from session token"""
    # Check cookie first
    session_token = request.cookies.get("session_token")
    
    # Fall back to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange session_id for session data and set cookie"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get session data
    async with httpx.AsyncClient() as client_http:
        try:
            auth_response = await client_http.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            session_data = auth_response.json()
        except Exception as e:
            logger.error(f"Auth error: {e}")
            raise HTTPException(status_code=500, detail="Authentication failed")
    
    # Extract user info
    email = session_data.get("email")
    name = session_data.get("name")
    picture = session_data.get("picture")
    session_token = session_data.get("session_token")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = User(
            user_id=user_id,
            email=email,
            name=name,
            picture=picture
        )
        await db.users.insert_one(user.model_dump())
        
        # Create default goals for new user
        goals = UserGoals(user_id=user_id)
        await db.user_goals.insert_one(goals.model_dump())
    
    # Store session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session = UserSession(
        user_id=user_id,
        session_token=session_token,
        expires_at=expires_at
    )
    
    # Remove old sessions for this user
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one(session.model_dump())
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    # Get user data
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    return {"user": user_doc}

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    """Get current user info"""
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# ==================== GOALS ROUTES ====================

@api_router.get("/goals")
async def get_goals(user: User = Depends(get_current_user)):
    """Get user's keto goals"""
    goals = await db.user_goals.find_one(
        {"user_id": user.user_id},
        {"_id": 0}
    )
    
    if not goals:
        # Create default goals
        goals = UserGoals(user_id=user.user_id)
        await db.user_goals.insert_one(goals.model_dump())
        return goals.model_dump()
    
    return goals

@api_router.put("/goals")
async def update_goals(
    goals_update: UserGoalsUpdate,
    user: User = Depends(get_current_user)
):
    """Update user's keto goals"""
    update_data = {k: v for k, v in goals_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.user_goals.update_one(
        {"user_id": user.user_id},
        {"$set": update_data},
        upsert=True
    )
    
    goals = await db.user_goals.find_one(
        {"user_id": user.user_id},
        {"_id": 0}
    )
    
    return goals

# ==================== FOOD SEARCH ROUTES ====================

@api_router.get("/foods/search")
async def search_foods(q: str, user: User = Depends(get_current_user)):
    """Search foods from USDA database and custom foods"""
    results = []
    
    # Search custom foods first
    custom_foods = await db.custom_foods.find({
        "$or": [
            {"user_id": user.user_id},
            {"is_custom": False}
        ],
        "name": {"$regex": q, "$options": "i"}
    }, {"_id": 0}).to_list(20)
    
    results.extend(custom_foods)
    
    # Search USDA FoodData Central (free API)
    try:
        async with httpx.AsyncClient() as client_http:
            response = await client_http.get(
                "https://api.nal.usda.gov/fdc/v1/foods/search",
                params={
                    "api_key": "DEMO_KEY",  # Free demo key
                    "query": q,
                    "pageSize": 20,
                    "dataType": ["Survey (FNDDS)", "Branded"]
                },
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                for food in data.get("foods", []):
                    # Parse nutrients
                    nutrients = {n.get("nutrientName", ""): n.get("value", 0) for n in food.get("foodNutrients", [])}
                    
                    food_item = {
                        "food_id": f"usda_{food.get('fdcId', '')}",
                        "name": food.get("description", ""),
                        "brand": food.get("brandOwner", None),
                        "serving_size": 100,
                        "serving_unit": "g",
                        "calories": nutrients.get("Energy", 0),
                        "total_carbs": nutrients.get("Carbohydrate, by difference", 0),
                        "fiber": nutrients.get("Fiber, total dietary", 0),
                        "sugar_alcohols": 0,
                        "net_carbs": max(0, nutrients.get("Carbohydrate, by difference", 0) - nutrients.get("Fiber, total dietary", 0)),
                        "protein": nutrients.get("Protein", 0),
                        "fat": nutrients.get("Total lipid (fat)", 0),
                        "saturated_fat": nutrients.get("Fatty acids, total saturated", 0),
                        "sodium": nutrients.get("Sodium, Na", 0),
                        "potassium": nutrients.get("Potassium, K", 0),
                        "cholesterol": nutrients.get("Cholesterol", 0),
                        "vitamin_a": nutrients.get("Vitamin A, RAE", 0),
                        "vitamin_c": nutrients.get("Vitamin C, total ascorbic acid", 0),
                        "calcium": nutrients.get("Calcium, Ca", 0),
                        "iron": nutrients.get("Iron, Fe", 0),
                        "is_custom": False
                    }
                    results.append(food_item)
    except Exception as e:
        logger.error(f"USDA API error: {e}")
    
    return results

@api_router.post("/foods/custom")
async def create_custom_food(
    food: FoodItemCreate,
    user: User = Depends(get_current_user)
):
    """Create a custom food item"""
    food_item = FoodItem(
        **food.model_dump(),
        net_carbs=max(0, food.total_carbs - food.fiber - food.sugar_alcohols),
        is_custom=True,
        user_id=user.user_id
    )
    
    await db.custom_foods.insert_one(food_item.model_dump())
    
    return food_item.model_dump()

@api_router.get("/foods/custom")
async def get_custom_foods(user: User = Depends(get_current_user)):
    """Get user's custom foods"""
    foods = await db.custom_foods.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).to_list(100)
    
    return foods

# ==================== FOOD LOG ROUTES ====================

@api_router.post("/food-logs")
async def create_food_log(
    log: FoodLogCreate,
    user: User = Depends(get_current_user)
):
    """Log a food item"""
    food_log = FoodLog(
        user_id=user.user_id,
        **log.model_dump()
    )
    
    await db.food_logs.insert_one(food_log.model_dump())
    
    # Update daily nutrition
    await update_daily_nutrition(user.user_id, log.log_date)
    
    return food_log.model_dump()

@api_router.get("/food-logs")
async def get_food_logs(
    date: str,
    user: User = Depends(get_current_user)
):
    """Get food logs for a specific date"""
    logs = await db.food_logs.find(
        {"user_id": user.user_id, "log_date": date},
        {"_id": 0}
    ).to_list(100)
    
    return logs

@api_router.delete("/food-logs/{log_id}")
async def delete_food_log(
    log_id: str,
    user: User = Depends(get_current_user)
):
    """Delete a food log"""
    log = await db.food_logs.find_one(
        {"log_id": log_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    await db.food_logs.delete_one({"log_id": log_id})
    
    # Update daily nutrition
    await update_daily_nutrition(user.user_id, log["log_date"])
    
    return {"message": "Deleted"}

async def update_daily_nutrition(user_id: str, date: str):
    """Update daily nutrition totals"""
    logs = await db.food_logs.find(
        {"user_id": user_id, "log_date": date},
        {"_id": 0}
    ).to_list(1000)
    
    totals = {
        "total_calories": 0,
        "total_carbs": 0,
        "total_fiber": 0,
        "total_sugar_alcohols": 0,
        "total_net_carbs": 0,
        "total_protein": 0,
        "total_fat": 0
    }
    
    meals = {"breakfast": [], "lunch": [], "dinner": [], "snack": []}
    
    for log in logs:
        totals["total_calories"] += log.get("calories", 0) * log.get("servings", 1)
        totals["total_carbs"] += log.get("total_carbs", 0) * log.get("servings", 1)
        totals["total_fiber"] += log.get("fiber", 0) * log.get("servings", 1)
        totals["total_sugar_alcohols"] += log.get("sugar_alcohols", 0) * log.get("servings", 1)
        totals["total_net_carbs"] += log.get("net_carbs", 0) * log.get("servings", 1)
        totals["total_protein"] += log.get("protein", 0) * log.get("servings", 1)
        totals["total_fat"] += log.get("fat", 0) * log.get("servings", 1)
        
        meal_type = log.get("meal_type", "snack")
        if meal_type in meals:
            meals[meal_type].append(log.get("log_id"))
    
    await db.daily_nutrition.update_one(
        {"user_id": user_id, "date": date},
        {"$set": {**totals, "meals": meals}},
        upsert=True
    )

@api_router.get("/nutrition/daily")
async def get_daily_nutrition(
    date: str,
    user: User = Depends(get_current_user)
):
    """Get daily nutrition summary"""
    nutrition = await db.daily_nutrition.find_one(
        {"user_id": user.user_id, "date": date},
        {"_id": 0}
    )
    
    if not nutrition:
        return {
            "user_id": user.user_id,
            "date": date,
            "total_calories": 0,
            "total_carbs": 0,
            "total_fiber": 0,
            "total_sugar_alcohols": 0,
            "total_net_carbs": 0,
            "total_protein": 0,
            "total_fat": 0,
            "meals": {"breakfast": [], "lunch": [], "dinner": [], "snack": []}
        }
    
    return nutrition

@api_router.get("/nutrition/weekly")
async def get_weekly_nutrition(user: User = Depends(get_current_user)):
    """Get last 7 days nutrition summary"""
    today = datetime.now(timezone.utc).date()
    dates = [(today - timedelta(days=i)).isoformat() for i in range(7)]
    
    nutrition_data = await db.daily_nutrition.find(
        {"user_id": user.user_id, "date": {"$in": dates}},
        {"_id": 0}
    ).to_list(7)
    
    # Create a dict for easy lookup
    nutrition_by_date = {n["date"]: n for n in nutrition_data}
    
    result = []
    for date in reversed(dates):
        if date in nutrition_by_date:
            result.append(nutrition_by_date[date])
        else:
            result.append({
                "date": date,
                "total_calories": 0,
                "total_net_carbs": 0,
                "total_protein": 0,
                "total_fat": 0
            })
    
    return result

# ==================== AI FOOD ANALYSIS ====================

@api_router.post("/ai/analyze-food")
async def analyze_food_image(
    request: ImageAnalysisRequest,
    user: User = Depends(get_current_user)
):
    """Analyze food image using Gemini Vision"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        
        # Initialize Gemini chat
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"food_analysis_{uuid.uuid4().hex[:8]}",
            system_message="""You are a nutrition expert AI that analyzes food images. 
            When shown a food image, identify all food items visible and provide detailed nutritional estimates.
            
            For each food item, estimate:
            - Food name
            - Estimated portion size/weight in grams
            - Calories (per 100g and for estimated portion)
            - Total carbohydrates (g)
            - Dietary fiber (g)
            - Net carbs (total carbs - fiber)
            - Protein (g)
            - Fat (g)
            - Sugar alcohols (g) if applicable
            
            Be as accurate as possible with portion estimates based on visual cues.
            Always respond in valid JSON format with the following structure:
            {
                "foods": [
                    {
                        "name": "string",
                        "estimated_weight_g": number,
                        "serving_size": number,
                        "serving_unit": "g",
                        "calories": number,
                        "total_carbs": number,
                        "fiber": number,
                        "sugar_alcohols": number,
                        "net_carbs": number,
                        "protein": number,
                        "fat": number
                    }
                ],
                "total_estimated": {
                    "calories": number,
                    "net_carbs": number,
                    "protein": number,
                    "fat": number
                },
                "keto_friendly": boolean,
                "keto_notes": "string explaining if this meal fits keto diet"
            }"""
        ).with_model("gemini", "gemini-2.5-flash")
        
        # Clean base64 string if it has data URL prefix
        image_data = request.image_base64
        if "base64," in image_data:
            image_data = image_data.split("base64,")[1]
        
        # Create image content
        image_content = ImageContent(image_base64=image_data)
        
        # Send message with image
        user_message = UserMessage(
            text="Please analyze this food image and provide detailed nutritional information. Estimate portion sizes based on visual cues.",
            image_contents=[image_content]
        )
        
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        try:
            # Try to extract JSON from response
            response_text = response.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            result = json.loads(response_text.strip())
            return result
        except json.JSONDecodeError:
            # Return raw response if JSON parsing fails
            return {
                "foods": [],
                "raw_response": response,
                "error": "Could not parse structured response"
            }
            
    except Exception as e:
        logger.error(f"AI analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== MEAL SUGGESTIONS ====================

@api_router.get("/suggestions")
async def get_meal_suggestions(user: User = Depends(get_current_user)):
    """Get keto-friendly meal suggestions based on remaining carb budget"""
    today = datetime.now(timezone.utc).date().isoformat()
    
    # Get goals
    goals = await db.user_goals.find_one(
        {"user_id": user.user_id},
        {"_id": 0}
    )
    
    if not goals:
        goals = {"daily_net_carbs": 25}
    
    # Get current nutrition
    nutrition = await db.daily_nutrition.find_one(
        {"user_id": user.user_id, "date": today},
        {"_id": 0}
    )
    
    current_net_carbs = nutrition.get("total_net_carbs", 0) if nutrition else 0
    remaining_carbs = goals.get("daily_net_carbs", 25) - current_net_carbs
    
    # Keto-friendly food suggestions based on remaining budget
    suggestions = []
    
    if remaining_carbs >= 10:
        suggestions.extend([
            {"name": "Avocado (half)", "net_carbs": 2, "calories": 160, "description": "Rich in healthy fats"},
            {"name": "Grilled Chicken Breast (150g)", "net_carbs": 0, "calories": 248, "description": "High protein, zero carbs"},
            {"name": "Bacon (3 strips)", "net_carbs": 0, "calories": 120, "description": "Classic keto staple"},
            {"name": "Eggs (2 large)", "net_carbs": 1, "calories": 156, "description": "Versatile protein source"},
            {"name": "Cheese (30g cheddar)", "net_carbs": 0.4, "calories": 120, "description": "Great snack option"},
        ])
    elif remaining_carbs >= 5:
        suggestions.extend([
            {"name": "Celery with Cream Cheese", "net_carbs": 2, "calories": 80, "description": "Crunchy low-carb snack"},
            {"name": "Hard Boiled Eggs (2)", "net_carbs": 1, "calories": 156, "description": "Quick protein boost"},
            {"name": "Pork Rinds (30g)", "net_carbs": 0, "calories": 150, "description": "Crunchy zero-carb snack"},
            {"name": "String Cheese", "net_carbs": 0, "calories": 80, "description": "Portable snack"},
        ])
    elif remaining_carbs > 0:
        suggestions.extend([
            {"name": "Butter Coffee", "net_carbs": 0, "calories": 230, "description": "Energy without carbs"},
            {"name": "Beef Jerky (small)", "net_carbs": 2, "calories": 80, "description": "Protein on the go"},
            {"name": "Olives (10 pieces)", "net_carbs": 1, "calories": 40, "description": "Salty, satisfying"},
        ])
    else:
        suggestions.append({
            "name": "You've reached your carb limit!",
            "net_carbs": 0,
            "calories": 0,
            "description": "Stick to zero-carb options like water, black coffee, or plain meat."
        })
    
    return {
        "remaining_carbs": max(0, remaining_carbs),
        "daily_goal": goals.get("daily_net_carbs", 25),
        "current_net_carbs": current_net_carbs,
        "suggestions": suggestions
    }

# ==================== BASIC ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "KetoTracker API", "version": "1.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# ==================== FASTING ROUTES ====================

@api_router.get("/fasting/protocols")
async def get_fasting_protocols():
    """Get all available fasting protocols"""
    return [p.model_dump() for p in FASTING_PROTOCOLS]

@api_router.post("/fasting/start")
async def start_fast(
    request: StartFastRequest,
    user: User = Depends(get_current_user)
):
    """Start a new fasting session"""
    # Check if there's already an active fast
    active_fast = await db.fasting_sessions.find_one(
        {"user_id": user.user_id, "is_active": True},
        {"_id": 0}
    )
    
    if active_fast:
        raise HTTPException(status_code=400, detail="You already have an active fast")
    
    # Get protocol details
    protocol = next((p for p in FASTING_PROTOCOLS if p.protocol_id == request.protocol_id), None)
    
    if not protocol:
        raise HTTPException(status_code=400, detail="Invalid protocol")
    
    # Determine fasting hours
    if request.protocol_id == "custom":
        if not request.custom_hours or request.custom_hours < 1:
            raise HTTPException(status_code=400, detail="Custom hours required for custom protocol")
        target_hours = request.custom_hours
    else:
        target_hours = protocol.fasting_hours
    
    # Set start time
    start_time = request.start_time or datetime.now(timezone.utc)
    target_end_time = start_time + timedelta(hours=target_hours)
    
    # Create fasting session
    session = FastingSession(
        user_id=user.user_id,
        protocol_id=request.protocol_id,
        protocol_name=protocol.name if request.protocol_id != "custom" else f"Custom {target_hours}h",
        target_hours=target_hours,
        start_time=start_time,
        target_end_time=target_end_time
    )
    
    await db.fasting_sessions.insert_one(session.model_dump())
    
    return session.model_dump()

@api_router.post("/fasting/end")
async def end_fast(
    request: EndFastRequest,
    user: User = Depends(get_current_user)
):
    """End the current fasting session"""
    active_fast = await db.fasting_sessions.find_one(
        {"user_id": user.user_id, "is_active": True},
        {"_id": 0}
    )
    
    if not active_fast:
        raise HTTPException(status_code=400, detail="No active fast to end")
    
    end_time = datetime.now(timezone.utc)
    start_time = active_fast["start_time"]
    
    if isinstance(start_time, str):
        start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)
    
    actual_hours = (end_time - start_time).total_seconds() / 3600
    completed = actual_hours >= active_fast["target_hours"]
    
    await db.fasting_sessions.update_one(
        {"session_id": active_fast["session_id"]},
        {
            "$set": {
                "end_time": end_time,
                "is_active": False,
                "completed": completed,
                "actual_hours": round(actual_hours, 2),
                "notes": request.notes
            }
        }
    )
    
    updated = await db.fasting_sessions.find_one(
        {"session_id": active_fast["session_id"]},
        {"_id": 0}
    )
    
    return updated

@api_router.get("/fasting/current")
async def get_current_fast(user: User = Depends(get_current_user)):
    """Get the current active fasting session"""
    active_fast = await db.fasting_sessions.find_one(
        {"user_id": user.user_id, "is_active": True},
        {"_id": 0}
    )
    
    if not active_fast:
        return {"active": False, "session": None}
    
    # Calculate elapsed time
    start_time = active_fast["start_time"]
    if isinstance(start_time, str):
        start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)
    
    now = datetime.now(timezone.utc)
    elapsed_seconds = (now - start_time).total_seconds()
    elapsed_hours = elapsed_seconds / 3600
    target_hours = active_fast["target_hours"]
    remaining_seconds = max(0, (target_hours * 3600) - elapsed_seconds)
    progress_percent = min(100, (elapsed_hours / target_hours) * 100)
    
    return {
        "active": True,
        "session": active_fast,
        "elapsed_seconds": int(elapsed_seconds),
        "elapsed_hours": round(elapsed_hours, 2),
        "remaining_seconds": int(remaining_seconds),
        "progress_percent": round(progress_percent, 1),
        "is_complete": elapsed_hours >= target_hours
    }

@api_router.get("/fasting/history")
async def get_fasting_history(
    limit: int = 30,
    user: User = Depends(get_current_user)
):
    """Get fasting history"""
    sessions = await db.fasting_sessions.find(
        {"user_id": user.user_id, "is_active": False},
        {"_id": 0}
    ).sort("start_time", -1).to_list(limit)
    
    return sessions

@api_router.get("/fasting/stats")
async def get_fasting_stats(user: User = Depends(get_current_user)):
    """Get fasting statistics"""
    sessions = await db.fasting_sessions.find(
        {"user_id": user.user_id, "is_active": False},
        {"_id": 0}
    ).sort("start_time", -1).to_list(1000)
    
    if not sessions:
        return FastingStats().model_dump()
    
    total_fasts = len(sessions)
    completed_fasts = sum(1 for s in sessions if s.get("completed", False))
    
    actual_hours = [s.get("actual_hours", 0) for s in sessions if s.get("actual_hours")]
    total_hours = sum(actual_hours)
    avg_duration = total_hours / len(actual_hours) if actual_hours else 0
    longest_fast = max(actual_hours) if actual_hours else 0
    
    # Calculate streak (consecutive completed fasts)
    current_streak = 0
    best_streak = 0
    temp_streak = 0
    
    for s in sessions:
        if s.get("completed", False):
            temp_streak += 1
            if temp_streak > best_streak:
                best_streak = temp_streak
        else:
            temp_streak = 0
    
    # Current streak (from most recent)
    for s in sessions:
        if s.get("completed", False):
            current_streak += 1
        else:
            break
    
    return {
        "total_fasts": total_fasts,
        "completed_fasts": completed_fasts,
        "total_hours_fasted": round(total_hours, 1),
        "average_fast_duration": round(avg_duration, 1),
        "longest_fast": round(longest_fast, 1),
        "current_streak": current_streak,
        "best_streak": best_streak
    }

@api_router.delete("/fasting/{session_id}")
async def delete_fasting_session(
    session_id: str,
    user: User = Depends(get_current_user)
):
    """Delete a fasting session"""
    result = await db.fasting_sessions.delete_one(
        {"session_id": session_id, "user_id": user.user_id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"message": "Session deleted"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
