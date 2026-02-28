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
