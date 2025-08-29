export type Difficulty = 'Very Easy' | 'Easy' | 'Medium' | 'Hard' | 'Expert';

export interface NutritionInfo {
  protein: string; // e.g., "30g"
  carbs: string;   // e.g., "45g"
  fats: string;    // e.g., "15g"
}

export interface Recipe {
  id: string;
  recipeName: string;
  description: string;
  ingredients: {
    name: string;
    quantity: string;
    isStaple?: boolean;
  }[];
  instructions: string[];
  prepTime: string;
  cookTime: string;
  calories: number;
  difficulty: Difficulty;
  healthTip: string;
  servings: number;
  nutrition?: NutritionInfo;
  imageUrl?: string;
}