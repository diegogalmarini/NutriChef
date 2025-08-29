// In a real-world application, these would be high-quality, royalty-free images
// converted to base64 to avoid external network requests for fallbacks.
// For this example, we're using placeholder data URLs.

// Placeholder for a generic healthy bowl/dish
const fallbackGeneric = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBAUEBAYFBQUGBgYHCQ4JCQgICRINDQoOFRIWFhUSFBQXGIodHRsfHhQxJyYnJyUvVlVvVHFoWVRvTFNvV3P/2wBDAQYHBwYIChgQDAwOFhYgFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhP/wAARCAAoADwDASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAAECA//EABwQAQEBAAEFAAAAAAAAAAAAAAABAhESMgMTFP/EABUBAQEAAAAAAAAAAAAAAAAAAAEC/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A1iIAAAAAACACAgICAgICKAIgICKAIgICKAIgICKAIgICKAIgICKAIgICv//Z';

// Placeholder for a chicken dish
const fallbackChicken = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBAUEBAYFBQUGBgYHCQ4JCQgICRINDQoOFRIWFhUSFBQXGIodHRsfHhQxJyYnJyUvVlVvVHFoWVRvTFNvV3P/2wBDAQYHBwYIChgQDAwOFhYgFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhP/wAARCAAoADwDASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAAECA//EABwQAQEBAAEFAAAAAAAAAAAAAAABAhESMgMTFP/EABUBAQEAAAAAAAAAAAAAAAAAAAEC/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A1iIAAAAAACACAgICAgICKAIgICKAIgICKAIgICKAIgICKAIgICKAIgICv//Z';

// Placeholder for a salad
const fallbackSalad = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBAUEBAYFBQUGBgYHCQ4JCQgICRINDQoOFRIWFhUSFBQXGIodHRsfHhQxJyYnJyUvVlVvVHFoWVRvTFNvV3P/2wBDAQYHBwYIChgQDAwOFhYgFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhP/wAARCAAoADwDASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAAECA//EABwQAQEBAAEFAAAAAAAAAAAAAAABAhESMgMTFP/EABUBAQEAAAAAAAAAAAAAAAAAAAEC/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A1iIAAAAAACACAgICAgICKAIgICKAIgICKAIgICKAIgICKAIgICKAIgICv//Z';


const keywordMap: { [key: string]: string } = {
    'chicken': fallbackChicken,
    'pollo': fallbackChicken,
    'salad': fallbackSalad,
    'ensalada': fallbackSalad,
    'baked': fallbackGeneric,
    'roasted': fallbackGeneric,
    'pan-seared': fallbackChicken,
};

/**
 * Gets a fallback image URL based on keywords in the recipe name.
 * @param recipeName The name of the recipe.
 * @returns A data URL for a fallback image.
 */
export const getFallbackImageUrl = (recipeName: string): string => {
    const lowerCaseName = recipeName.toLowerCase();
    for (const keyword in keywordMap) {
        if (lowerCaseName.includes(keyword)) {
            return keywordMap[keyword];
        }
    }
    return fallbackGeneric;
};
