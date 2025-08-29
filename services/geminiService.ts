import { GoogleGenAI, Type } from "@google/genai";
import type { Recipe } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      recipeName: {
        type: Type.STRING,
        description: "The name of the recipe."
      },
      description: {
        type: Type.STRING,
        description: "A short, enticing description of the healthy dish."
      },
      prepTime: {
        type: Type.STRING,
        description: "Estimated preparation time, e.g., '15 minutes'."
      },
      cookTime: {
        type: Type.STRING,
        description: "Estimated cooking time, e.g., '30 minutes'."
      },
      servings: {
          type: Type.NUMBER,
          description: "The number of people this recipe serves."
      },
      calories: {
          type: Type.NUMBER,
          description: "Estimated calorie count per serving."
      },
      difficulty: {
          type: Type.STRING,
          description: "The cooking difficulty, must be one of: 'Very Easy', 'Easy', 'Medium', 'Hard', 'Expert'."
      },
      healthTip: {
          type: Type.STRING,
          description: "A useful tip on how to make the dish even healthier, or a nutritional benefit."
      },
      nutrition: {
        type: Type.OBJECT,
        description: "Nutritional information per serving.",
        properties: {
          protein: {
            type: Type.STRING,
            description: "Amount of protein per serving, including unit, e.g., '30g'."
          },
          carbs: {
            type: Type.STRING,
            description: "Amount of carbohydrates per serving, including unit, e.g., '45g'."
          },
          fats: {
            type: Type.STRING,
            description: "Amount of fats per serving, including unit, e.g., '15g'."
          }
        },
        required: ['protein', 'carbs', 'fats']
      },
      ingredients: {
        type: Type.ARRAY,
        description: "A list of all ingredients required for the recipe.",
        items: {
          type: Type.OBJECT,
          properties: {
            quantity: {
              type: Type.STRING,
              description: "The amount of the ingredient, e.g., '1 cup', '2 tbsp'."
            },
            name: {
              type: Type.STRING,
              description: "The name of the ingredient, e.g., 'quinoa', 'broccoli'."
            },
            isStaple: {
                type: Type.BOOLEAN,
                description: "Set to true if this ingredient is a suggested pantry staple, not from the user's original list. Only use for the third creative recipe."
            }
          },
          required: ['quantity', 'name']
        }
      },
      instructions: {
        type: Type.ARRAY,
        description: "Step-by-step instructions for preparing the dish.",
        items: {
          type: Type.STRING
        }
      }
    },
    required: ['recipeName', 'description', 'prepTime', 'cookTime', 'servings', 'calories', 'difficulty', 'healthTip', 'nutrition', 'ingredients', 'instructions']
  }
};

export const generateRecipes = async (ingredients: string[], language: 'en' | 'es'): Promise<Omit<Recipe, 'id'>[]> => {
    if (!ingredients || ingredients.length === 0) {
        throw new Error("Please provide at least one ingredient.");
    }
    
    const model = "gemini-2.5-flash";
    const languageInstruction = language === 'es' ? 'Spanish' : 'English';

    const prompt = `You are an expert nutritionist and chef. Your task is to generate 3 healthy recipes based on these ingredients: ${ingredients.join(', ')}. Respond entirely in ${languageInstruction}.

- The first two recipes must STRICTLY use ONLY the provided ingredients. For these, the 'isStaple' property for all ingredients must be false or omitted.
- The third recipe should use the provided ingredients and can creatively add 1-3 common pantry staples (like oil, spices, onion). For any added staple ingredient, set its 'isStaple' property to true.

For each of the three recipes, provide all the information required by the JSON schema.`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            },
        });

        const jsonText = response.text.trim();
        const recipes = JSON.parse(jsonText);
        return recipes as Omit<Recipe, 'id'>[];

    } catch (error) {
        console.error("Error generating recipes from Gemini API:", error);
        throw new Error("Failed to generate recipes. The AI chef might be on a break. Please check your ingredients and try again.");
    }
};


export const generateRecipeImage = async (recipeName: string, recipeDescription: string): Promise<string> => {
    const prompt = `A healthy, fresh, and vibrant photo of a freshly prepared "${recipeName}". ${recipeDescription}. Professional food photography, bright natural lighting, minimalist styling, focus on fresh ingredients. The food should look incredibly delicious and nutritious, served on a modern white plate.`;
    
    const maxRetries = 3;
    let delay = 1000; // Start with a 1-second delay

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await ai.models.generateImages({
                // Using 'imagen-4.0-generate-001', the recommended and stable General Availability (GA) model for image generation.
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
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

            // Normalize the error structure to handle different API error formats
            let errorDetails;
            try {
                // Case 1: error.message is a JSON string, which is common for API errors
                const parsed = JSON.parse(error.message);
                errorDetails = parsed.error || parsed;
            } catch (e) {
                // Case 2: error is an object with an 'error' property, or just the error object itself
                errorDetails = error.error || error;
            }

            const isQuotaError = (errorDetails?.status === 'RESOURCE_EXHAUSTED') || (errorDetails?.code === 429);

            if (isQuotaError) {
                // Don't retry on quota errors, fail fast and inform the user.
                const apiMessage = errorDetails.message || "You have exceeded your API quota. Please check your plan and billing details.";
                throw new Error(apiMessage); // This will be caught by App.tsx
            }

            // For other transient errors, retry with exponential backoff.
            if (attempt === maxRetries) {
                // If this was the last attempt, re-throw the error to be caught by the calling function.
                throw new Error("Failed to create a healthy image for the recipe. Please try again.");
            }
            
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
    
    // This line should be unreachable, but it satisfies TypeScript's need for a return path.
    throw new Error("Image generation failed after all retries.");
};

export const identifyIngredientsFromImage = async (base64Image: string, language: 'en' | 'es'): Promise<string[]> => {
    const model = "gemini-2.5-flash";
    const languageInstruction = language === 'es' ? 'Spanish' : 'English';

    const match = base64Image.match(/^data:(image\/.+);base64,(.+)$/);
    if (!match) {
        throw new Error("Invalid image format.");
    }
    const mimeType = match[1];
    const imageData = match[2];

    const imagePart = {
        inlineData: {
            mimeType: mimeType,
            data: imageData,
        },
    };

    const textPart = {
        text: `Identify all the food ingredients in this image. List only the names of the ingredients. Respond entirely in ${languageInstruction}.`,
    };

    const ingredientSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.STRING,
            description: "The name of a single food ingredient found in the image."
        }
    };

    try {
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
        
        if (!Array.isArray(ingredients) || !ingredients.every(i => typeof i === 'string')) {
            throw new Error("AI returned an unexpected format for ingredients.");
        }
        
        return ingredients as string[];

    } catch (error) {
        console.error("Error identifying ingredients from image:", error);
        throw new Error("Failed to identify ingredients from the image. The AI might be blinking. Please try again with a clearer picture.");
    }
};