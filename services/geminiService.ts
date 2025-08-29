import type { Recipe } from '../types';

const handleApiResponse = async (response: Response, errorMessage: string) => {
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: errorMessage }));
        console.error("API Error:", errorBody);
        throw new Error(errorBody.error || errorMessage);
    }
    return response.json();
};

export const generateRecipes = async (ingredients: string[], language: 'en' | 'es', errorMessage: string): Promise<Omit<Recipe, 'id'>[]> => {
    if (!ingredients || ingredients.length === 0) {
        throw new Error("Please provide at least one ingredient.");
    }
    
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, language, errorMessage }),
    });

    const data = await handleApiResponse(response, errorMessage);
    return data.recipes as Omit<Recipe, 'id'>[];
};


export const generateRecipeImage = async (recipeName: string, recipeDescription: string): Promise<string> => {
     const response = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeName, recipeDescription }),
    });
    
    // The specific error message for image generation failure is handled server-side now.
    const data = await handleApiResponse(response, "Failed to create a healthy image for the recipe. Please try again.");
    return data.imageUrl;
};

export const identifyIngredientsFromImage = async (base64Image: string, language: 'en' | 'es', errorMessage: string): Promise<string[]> => {
    const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image, language, errorMessage }),
    });

    const data = await handleApiResponse(response, errorMessage);
    return data.ingredients as string[];
};
