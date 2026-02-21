const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export const analyzeFood = async (imageBase64: string) => {
  const response = await fetch(`${BACKEND_URL}/api/ai/analyze-food`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_base64: imageBase64 }),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to analyze food');
  }

  return response.json();
};

export const createCustomFood = async (food: any) => {
  const response = await fetch(`${BACKEND_URL}/api/foods/custom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(food),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to create custom food');
  }

  return response.json();
};
