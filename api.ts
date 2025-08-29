import { GoogleGenAI, Type } from "@google/genai";
import type { Recipe } from './types';

// This file acts as a simple backend, handling API calls securely.
// The API key is available on the server through process.env.API_KEY.

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const recipeSchema = {
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

const ingredientSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.STRING,
        description: "The name of a single food ingredient found in the image."
    }
};

const createJsonResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};

const handleError = (error: any, defaultMessage: string) => {
    console.error("Backend Error:", error);
    const message = error.message || defaultMessage;
    return createJsonResponse({ error: message }, 500);
}

const handleGenerateRecipes = async (request: Request) => {
    try {
        const { ingredients, language, errorMessage } = await request.json();
        
        const model = "gemini-2.5-flash";
        const languageInstruction = language === 'es' ? 'Spanish' : 'English';
        const prompt = `You are an expert nutritionist and chef. Your task is to generate 3 healthy recipes based on these ingredients: ${ingredients.join(', ')}. Respond entirely in ${languageInstruction}.

- The first two recipes must STRICTLY use ONLY the provided ingredients. For these, the 'isStaple' property for all ingredients must be false or omitted.
- The third recipe should use the provided ingredients and can creatively add 1-3 common pantry staples (like oil, spices, onion). For any added staple ingredient, set its 'isStaple' property to true.

For each of the three recipes, provide all the information required by the JSON schema.`;
        
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: recipeSchema
            },
        });

        const jsonText = response.text.trim();
        const recipes = JSON.parse(jsonText);
        return createJsonResponse({ recipes });

    } catch (error) {
        const body = await request.json().catch(() => ({}));
        return handleError(error, body.errorMessage || 'Failed to generate recipes.');
    }
};

const handleGenerateImage = async (request: Request) => {
    try {
        const { recipeName, recipeDescription } = await request.json();
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
                    const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
                    return createJsonResponse({ imageUrl });
                } else {
                     throw new Error("No image was generated by the API.");
                }
            } catch (error: any) {
                 console.error(`Error generating image for "${recipeName}" (Attempt ${attempt}/${maxRetries}):`, error);

                 let errorDetails;
                 try {
                     const parsed = JSON.parse(error.message);
                     errorDetails = parsed.error || parsed;
                 } catch (e) {
                     errorDetails = error.error || error;
                 }
                 const isQuotaError = (errorDetails?.status === 'RESOURCE_EXHAUSTED') || (errorDetails?.code === 429);
                 if (isQuotaError) {
                     throw new Error(errorDetails.message || "You have exceeded your API quota.");
                 }
                 if (attempt === maxRetries) {
                     throw new Error("Failed to create image after multiple retries.");
                 }
                 await new Promise(resolve => setTimeout(resolve, delay));
                 delay *= 2;
            }
        }
        throw new Error("Image generation failed unexpectedly.");
    } catch (error) {
        return handleError(error, 'Failed to generate image.');
    }
};

const handleScanIngredients = async (request: Request) => {
    try {
        const { base64Image, language, errorMessage } = await request.json();

        const model = "gemini-2.5-flash";
        const languageInstruction = language === 'es' ? 'Spanish' : 'English';

        const match = base64Image.match(/^data:(image\/.+);base64,(.+)$/);
        if (!match) {
            return createJsonResponse({ error: 'Invalid image format.' }, 400);
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
        
        return createJsonResponse({ ingredients });

    } catch (error) {
        const body = await request.json().catch(() => ({}));
        return handleError(error, body.errorMessage || 'Failed to identify ingredients.');
    }
};

export default {
  fetch: async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    switch (url.pathname) {
      case '/api/generate':
        return handleGenerateRecipes(request);
      case '/api/image':
        return handleGenerateImage(request);
      case '/api/scan':
        return handleScanIngredients(request);
      default:
        return new Response("Not Found", { status: 404 });
    }
  },
};
