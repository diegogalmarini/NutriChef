import { GoogleGenAI, Type } from "@google/genai";
import type { Recipe } from '../types';

// Initialize the Google AI client. The API key is available via process.env.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schemas for structured responses from the AI model.
const recipeSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            recipeName: { type: Type.STRING, description: "The name of the recipe." },
            description: { type: Type.STRING, description: "A short, enticing description of the healthy dish." },
            prepTime: { type: Type.STRING, description: "Estimated preparation time, e.g., '15 minutes'." },
            cookTime: { type: Type.STRING, description: "Estimated cooking time, e.g., '30 minutes'." },
            servings: { type: Type.NUMBER, description: "The number of people this recipe serves." },
            calories: { type: Type.NUMBER, description: "Estimated calorie count per serving." },
            difficulty: { type: Type.STRING, description: "The cooking difficulty, must be one of: 'Very Easy', 'Easy', 'Medium', 'Hard', 'Expert'." },
            healthTip: { type: Type.STRING, description: "A useful tip on how to make the dish even healthier, or a nutritional benefit." },
            nutrition: {
                type: Type.OBJECT,
                description: "Nutritional information per serving.",
                properties: {
                    protein: { type: Type.STRING, description: "Amount of protein per serving, including unit, e.g., '30g'." },
                    carbs: { type: Type.STRING, description: "Amount of carbohydrates per serving, including unit, e.g., '45g'." },
                    fats: { type: Type.STRING, description: "Amount of fats per serving, including unit, e.g., '15g'." }
                },
                required: ['protein', 'carbs', 'fats']
            },
            ingredients: {
                type: Type.ARRAY,
                description: "A list of all ingredients required for the recipe.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        quantity: { type: Type.STRING, description: "The amount of the ingredient, e.g., '1 cup', '2 tbsp'." },
                        name: { type: Type.STRING, description: "The name of the ingredient, e.g., 'quinoa', 'broccoli'." },
                        isStaple: { type: Type.BOOLEAN, description: "Set to 'false' for user-provided ingredients. Set to 'true' ONLY for common pantry staples (like oil, spices) added in the third, creative recipe." }
                    },
                    required: ['quantity', 'name', 'isStaple']
                }
            },
            instructions: {
                type: Type.ARRAY,
                description: "Step-by-step instructions for preparing the dish.",
                items: { type: Type.STRING }
            }
        },
        required: ['recipeName', 'description', 'prepTime', 'cookTime', 'servings', 'calories', 'difficulty', 'healthTip', 'nutrition', 'ingredients', 'instructions']
    }
};

const ingredientSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.STRING,
        description: "The name of a single food ingredient found in the image."
    }
};

export const generateRecipes = async (ingredients: string[], language: 'en' | 'es', errorMessage: string): Promise<Omit<Recipe, 'id'>[]> => {
    if (!ingredients || ingredients.length === 0) {
        throw new Error("Please provide at least one ingredient.");
    }

    try {
        const model = "gemini-2.5-flash";
        const languageInstruction = language === 'es' ? 'Spanish' : 'English';

        const systemInstruction = `You are an expert chef specializing in healthy, delicious cuisine. Your task is to generate exactly three distinct, healthy recipes based on a list of ingredients provided by the user.

Your response MUST be a valid JSON array containing three recipe objects that strictly adheres to the provided JSON schema. All text in the recipes (names, descriptions, instructions, etc.) MUST be in the language requested by the user.

**Recipe Generation Rules:**
1.  **First Two Recipes:** Use ONLY the ingredients from the user's list. For these ingredients, the 'isStaple' flag in the JSON output must be set to \`false\`.
2.  **Third (Creative) Recipe:** Use the user's ingredients (with 'isStaple' set to \`false\`) AND creatively introduce 1-3 common pantry staples (like olive oil, salt, pepper, common spices). For these added staples ONLY, the 'isStaple' flag must be set to \`true\`.
3.  **Completeness and Quality:** Ensure every single field in the JSON schema is filled with relevant, high-quality, and creative content for all three recipes. Do not omit any fields. The recipes should be genuinely appealing and well-described.`;

        const userPrompt = `Please generate recipes in ${languageInstruction} using the following ingredients: ${ingredients.join(', ')}.`;

        const response = await ai.models.generateContent({
            model,
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: recipeSchema,
            },
        });

        const jsonText = response.text.trim();
        if (!jsonText) {
            throw new Error("The AI model returned an empty response. Please try again.");
        }
        
        const parsedResponse = JSON.parse(jsonText);
        if (!Array.isArray(parsedResponse)) {
             throw new Error("The AI model returned an invalid format. Expected an array of recipes.");
        }

        return parsedResponse as Omit<Recipe, 'id'>[];

    } catch (error: any) {
        console.error("Gemini Service Error (generateRecipes):", error);
        throw new Error(errorMessage || error.message);
    }
};


export const generateRecipeImage = async (recipeName: string, recipeDescription: string): Promise<string> => {
    try {
        const prompt = `A healthy, fresh, and vibrant photo of a freshly prepared "${recipeName}". ${recipeDescription}. Professional food photography, bright natural lighting, minimalist styling, focus on fresh ingredients. The food should look incredibly delicious and nutritious, served on a modern white plate.`;
    
        const maxRetries = 3;
        let delay = 1000;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await ai.models.generateImages({
                    model: 'imagen-4.0-generate-001',
                    prompt,
                    config: {
                        numberOfImages: 1,
                        outputMimeType: 'image/jpeg',
                        aspectRatio: '16:9',
                    },
                });

                if (response.generatedImages && response.generatedImages.length > 0) {
                    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
                    return `data:image/jpeg;base64,${base64ImageBytes}`;
                } else {
                     throw new Error("No image was generated by the API.");
                }
            } catch (error: any) {
                 console.error(`Error generating image for "${recipeName}" (Attempt ${attempt}/${maxRetries}):`, error);
                 
                 const isQuotaError = error.message?.includes("RESOURCE_EXHAUSTED") || error.message?.includes("429");
                 if (isQuotaError) {
                     throw new Error("You have exceeded your API quota. Please try again later.");
                 }
                 if (attempt === maxRetries) {
                     throw new Error(`Failed to create image for "${recipeName}" after multiple retries.`);
                 }
                 await new Promise(resolve => setTimeout(resolve, delay));
                 delay *= 2;
            }
        }
        throw new Error("Image generation failed unexpectedly.");
    } catch (error: any) {
        console.error("Gemini Service Error (generateRecipeImage):", error);
        throw new Error(error.message || 'Failed to generate image.');
    }
};

export const identifyIngredientsFromImage = async (base64Image: string, language: 'en' | 'es', errorMessage: string): Promise<string[]> => {
    try {
        const model = "gemini-2.5-flash";
        const languageInstruction = language === 'es' ? 'Spanish' : 'English';

        const match = base64Image.match(/^data:(image\/.+);base64,(.+)$/);
        if (!match) {
            throw new Error('Invalid image format.');
        }
        const mimeType = match[1];
        const imageData = match[2];

        const imagePart = { inlineData: { mimeType, data: imageData } };
        const textPart = { text: `Identify all the food ingredients in this image. List only the names of the ingredients. Respond entirely in ${languageInstruction}.` };

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: ingredientSchema,
            },
        });

        const jsonText = response.text.trim();
        const ingredients = JSON.parse(jsonText);
        
        if (!Array.isArray(ingredients) || !ingredients.every((i: any) => typeof i === 'string')) {
            throw new Error("AI returned an unexpected format for ingredients.");
        }
        
        return ingredients;

    } catch (error: any) {
        console.error("Gemini Service Error (identifyIngredientsFromImage):", error);
        throw new Error(errorMessage || error.message);
    }
};