import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Recipe } from './types';
import { generateRecipes, generateRecipeImage, identifyIngredientsFromImage } from './services/geminiService';
import IngredientInput from './components/IngredientInput';
import RecipeCard from './components/RecipeCard';
import Spinner from './components/Spinner';
import ScannedIngredientsModal from './components/ScannedIngredientsModal';
import { getFallbackImageUrl } from './components/fallbackImages';

const locales = {
    en: {
        title: "NutriChef",
        subtitle: "Healthy meals from your ingredients, in seconds.",
        yourIngredients: "Your Ingredients",
        generate: "Generate Healthy Recipes",
        generating: "Generating...",
        addPlaceholder: "e.g., Quinoa, Broccoli, Chicken",
        add: "Add",
        errorTitle: "Oops!",
        errorContent: "An unknown error occurred.",
        errorApiRecipes: "Failed to generate recipes. The AI chef might be on a break. Please check your ingredients and try again.",
        errorApiScan: "Failed to identify ingredients from the image. The AI might be blinking. Please try again with a clearer picture.",
        errorEmptyIngredients: "Please add at least one ingredient to generate a healthy recipe.",
        loadingRecipes: "Crafting healthy recipes...",
        loadingImages: "Plating your healthy dish...",
        myFavoriteRecipes: "My Favorite Recipes",
        imageErrorTitle: "Image Generation Issue",
        scanWithCamera: "Scan Ingredients with Camera",
        scanning: "Scanning...",
        confirmIngredients: "Confirm Your Ingredients",
        addScanned: "Add to My List",
        editIngredientsPrompt: "Remove any ingredients that were incorrectly identified before adding them to your list.",
        cancel: "Cancel",
        shareRecipe: "Share Recipe",
        shareError: "Sharing failed. This feature may not be supported by your browser or requires a secure (HTTPS) connection.",
    },
    es: {
        title: "NutriChef",
        subtitle: "Platos saludables con tus ingredientes, en segundos.",
        yourIngredients: "Tus Ingredientes",
        generate: "Generar Recetas Saludables",
        generating: "Generando...",
        addPlaceholder: "Ej: Quinoa, Brócoli, Pollo",
        add: "Añadir",
        errorTitle: "¡Ups!",
        errorContent: "Ocurrió un error desconocido.",
        errorApiRecipes: "No se pudieron generar las recetas. Puede que el chef de IA esté en un descanso. Por favor, revisa tus ingredientes e inténtalo de nuevo.",
        errorApiScan: "No se pudieron identificar los ingredientes de la imagen. Puede que la IA esté parpadeando. Inténtalo de nuevo con una imagen más clara.",
        errorEmptyIngredients: "Por favor, añade al menos un ingrediente para generar una receta saludable.",
        loadingRecipes: "Creando recetas saludables...",
        loadingImages: "Emplatando tu plato saludable...",
        myFavoriteRecipes: "Mis Recetas Favoritas",
        imageErrorTitle: "Problema al Generar Imágenes",
        scanWithCamera: "Escanear Ingredientes con la Cámara",
        scanning: "Escaneando...",
        confirmIngredients: "Confirma Tus Ingredientes",
        addScanned: "Añadir a Mi Lista",
        editIngredientsPrompt: "Elimina cualquier ingrediente que no haya sido identificado correctamente antes de añadirlo a tu lista.",
        cancel: "Cancelar",
        shareRecipe: "Compartir Receta",
        shareError: "No se pudo compartir. Es posible que esta función no sea compatible con tu navegador o que requiera una conexión segura (HTTPS).",
    }
};

const allIngredients = {
    en: {
        proteins: ['Chicken Breast', 'Salmon', 'Tofu', 'Black Beans', 'Greek Yogurt', 'Eggs', 'Lentils'],
        vegetables: ['Broccoli', 'Spinach', 'Kale', 'Bell Pepper', 'Onion', 'Tomato', 'Sweet Potato', 'Zucchini'],
        carbsFats: ['Quinoa', 'Brown Rice', 'Avocado', 'Olive Oil', 'Almonds', 'Oats']
    },
    es: {
        proteins: ['Pechuga de Pollo', 'Salmón', 'Tofu', 'Frijoles Negros', 'Yogur Griego', 'Huevos', 'Lentejas'],
        vegetables: ['Brócoli', 'Espinacas', 'Kale', 'Pimiento', 'Cebolla', 'Tomate', 'Batata', 'Calabacín'],
        carbsFats: ['Quinoa', 'Arroz Integral', 'Aguacate', 'Aceite de Oliva', 'Almendras', 'Avena']
    }
};

const allEnIngredients = [
    ...allIngredients.en.proteins,
    ...allIngredients.en.vegetables,
    ...allIngredients.en.carbsFats,
];
const allEsIngredients = [
    ...allIngredients.es.proteins,
    ...allIngredients.es.vegetables,
    ...allIngredients.es.carbsFats,
];

const getRandomIngredients = (): string[] => {
    // Use the English list as the base for the initial random ingredients.
    const { proteins, vegetables, carbsFats } = allIngredients.en;

    const randomProtein = proteins[Math.floor(Math.random() * proteins.length)];
    const randomVegetable = vegetables[Math.floor(Math.random() * vegetables.length)];
    const randomCarbFat = carbsFats[Math.floor(Math.random() * carbsFats.length)];

    return [randomProtein, randomVegetable, randomCarbFat];
};

const NutriChefLogo = () => (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-green-600">
        <path d="M14.5 13.25C14.5 12.0074 15.5074 11 16.75 11C17.9926 11 19 12.0074 19 13.25V21H14.5V13.25Z" fill="currentColor" fillOpacity="0.3"/>
        <path d="M5 13.25C5 12.0074 6.00736 11 7.25 11C8.49264 11 9.5 12.0074 9.5 13.25V21H5V13.25Z" fill="currentColor" fillOpacity="0.3"/>
        <path d="M9.5 16.25C9.5 15.0074 10.5074 14 11.75 14C12.9926 14 14 15.0074 14 16.25V21H9.5V16.25Z" fill="currentColor" fillOpacity="0.3"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M12 3.25C12.4142 3.25 12.75 3.58579 12.75 4V8.53554C13.9926 8.53554 15 9.5429 15 10.7855V11.25H9V10.7855C9 9.5429 10.0074 8.53554 11.25 8.53554V4C11.25 3.58579 11.5858 3.25 12 3.25ZM16.5 9.75C16.9142 9.75 17.25 10.0858 17.25 10.5V11.25H19.5V10.75C19.5 8.67893 17.8211 7 15.75 7C14.7364 7 13.844 7.39953 13.187 8.03153C12.8256 8.2431 12.7214 8.7402 12.9329 9.1016C13.1444 9.463 13.6415 9.5672 14.0029 9.35573C14.4925 9.06648 15.0831 8.875 15.75 8.875C17.1528 8.875 18.25 9.9722 18.25 11.375V11.25H17.25V11.375C17.25 11.028 16.9142 10.75 16.5 10.75V9.75ZM7.75 11.25H6.75V11.375C6.75 9.9722 7.84721 8.875 9.25 8.875C9.91692 8.875 10.5075 9.06648 10.9971 9.35573C11.3585 9.5672 11.8556 9.463 12.0671 9.1016C12.2786 8.7402 12.1744 8.2431 11.813 8.03153C11.156 7.39953 10.2636 7 9.25 7C7.17893 7 5.5 8.67893 5.5 10.75V11.25H7.75V11.375C7.75 11.028 7.41421 10.75 7 10.75V9.75C7.41421 9.75 7.75 10.0858 7.75 10.5V11.25Z" fill="currentColor"/>
    </svg>
);


const NutriChef: React.FC = () => {
    const [language, setLanguage] = useState<'en' | 'es'>('en');
    const [ingredients, setIngredients] = useState<string[]>(getRandomIngredients());
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedIngredients, setScannedIngredients] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const t = locales[language];

    // Load favorites from localStorage on initial render
    useEffect(() => {
        try {
            const savedFavorites = localStorage.getItem('nutrichef-favorites');
            if (savedFavorites) {
                setFavoriteRecipes(JSON.parse(savedFavorites));
            }
        } catch (e) {
            console.error("Failed to load favorite recipes from localStorage", e);
        }
    }, []);

    // Save favorites to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('nutrichef-favorites', JSON.stringify(favoriteRecipes));
        } catch (e) {
            console.error("Failed to save favorite recipes to localStorage", e);
        }
    }, [favoriteRecipes]);


    const handleAddIngredient = (ingredient: string) => {
        if (!ingredients.find(i => i.toLowerCase() === ingredient.toLowerCase())) {
            setIngredients(prev => [...prev, ingredient]);
        }
    };

    const handleRemoveIngredient = (ingredient: string) => {
        setIngredients(prev => prev.filter(i => i !== ingredient));
    };

    const handleGenerate = async () => {
        if (ingredients.length === 0) {
            setError(t.errorEmptyIngredients);
            return;
        }

        setIsLoading(true);
        setLoadingMessage(t.loadingRecipes);
        setError(null);
        setRecipes([]);

        try {
            const generated = await generateRecipes(ingredients, language, t.errorApiRecipes);
            const recipesWithIdsAndImages = generated.map(recipe => ({
                ...recipe,
                id: `${recipe.recipeName}-${Date.now()}-${Math.random()}`,
                imageUrl: undefined
            }));
            setRecipes(recipesWithIdsAndImages);
            
            // Sequentially generate images
            setLoadingMessage(t.loadingImages);
            for (let i = 0; i < recipesWithIdsAndImages.length; i++) {
                const recipe = recipesWithIdsAndImages[i];
                try {
                    const imageUrl = await generateRecipeImage(recipe.recipeName, recipe.description);
                    setRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, imageUrl } : r));
                } catch (imgError) {
                    console.error(`Image generation failed for "${recipe.recipeName}":`, imgError);
                    setRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, imageUrl: getFallbackImageUrl(recipe.recipeName) } : r));
                }
            }
            
        } catch (err: any) {
            setError(err.message || t.errorContent);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setIsScanning(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const handleScanClick = () => {
        setIsScanning(true);
        setError(null);
        startCamera();

        // Give the camera a moment to initialize
        setTimeout(() => {
            if (videoRef.current && canvasRef.current) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const context = canvas.getContext('2d');
                if (context) {
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const base64Image = canvas.toDataURL('image/jpeg');
                    stopCamera();
                    
                    identifyIngredientsFromImage(base64Image, language, t.errorApiScan)
                        .then(identifiedIngredients => {
                            setScannedIngredients(identifiedIngredients);
                            setIsModalOpen(true);
                        })
                        .catch((err: any) => {
                            setError(err.message || t.errorApiScan);
                        })
                        .finally(() => {
                             setIsScanning(false);
                        });
                } else {
                     setIsScanning(false);
                     stopCamera();
                }
            } else {
                setIsScanning(false);
                stopCamera();
            }
        }, 500); // Wait 500ms for camera to warm up
    };

    const handleConfirmScanned = (finalIngredients: string[]) => {
        const newIngredients = [...ingredients];
        finalIngredients.forEach(ing => {
            if (!newIngredients.find(i => i.toLowerCase() === ing.toLowerCase())) {
                newIngredients.push(ing);
            }
        });
        setIngredients(newIngredients);
        setIsModalOpen(false);
    };

    const handleToggleFavorite = useCallback((recipe: Recipe) => {
        setFavoriteRecipes(prev => {
            const isFav = prev.some(fav => fav.id === recipe.id);
            if (isFav) {
                return prev.filter(fav => fav.id !== recipe.id);
            } else {
                return [...prev, recipe];
            }
        });
    }, []);

    const handleShareRecipe = useCallback(async (recipe: Recipe) => {
        const t = locales[language];
        const shareData = {
            title: `${t.title}: ${recipe.recipeName}`,
            text: `${recipe.description}\n\n${language === 'es' ? 'Ingredientes' : 'Ingredients'}:\n${recipe.ingredients.map(i => `- ${i.quantity} ${i.name}`).join('\n')}\n\n...`,
            url: window.location.href, // Share the current page URL
        };
        try {
            // Check if the Web Share API is supported
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback for browsers that don't support navigator.share
                alert(t.shareError);
            }
        } catch (err: any) {
            console.error('Error sharing:', err);
            // Don't alert if the user deliberately cancelled the share dialog (AbortError)
            if (err.name !== 'AbortError') {
                 alert(t.shareError);
            }
        }
    }, [language]);


    const currentIngredientSuggestions = language === 'es' ? allEsIngredients : allEnIngredients;

    return (
        <>
        <div className="min-h-screen container mx-auto p-4 sm:p-6 md:p-8 flex flex-col items-center">
            
            <header className="w-full max-w-4xl text-center mb-8 md:mb-12">
                <div className="flex justify-center items-center gap-4 mb-4">
                    <NutriChefLogo />
                    <h1 className="text-5xl md:text-6xl font-extrabold text-slate-800 tracking-tight">{t.title}</h1>
                </div>
                 <p className="text-lg md:text-xl text-slate-600">{t.subtitle}</p>
                 <div className="mt-4 flex justify-center gap-2">
                    <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-sm rounded-full ${language === 'en' ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-600'}`}>English</button>
                    <button onClick={() => setLanguage('es')} className={`px-3 py-1 text-sm rounded-full ${language === 'es' ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-600'}`}>Español</button>
                </div>
            </header>

            <main className="w-full max-w-4xl bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 mb-12">
                <h2 className="text-2xl font-bold text-slate-700 mb-4">{t.yourIngredients}</h2>
                
                <IngredientInput
                    ingredients={ingredients}
                    onAddIngredient={handleAddIngredient}
                    onRemoveIngredient={handleRemoveIngredient}
                    placeholder={t.addPlaceholder}
                    addButtonText={t.add}
                    onScanClick={handleScanClick}
                    isScanning={isScanning}
                    scanButtonText={t.scanWithCamera}
                    scanningText={t.scanning}
                />
                 
                {error && (
                    <div className="mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                        <p className="font-bold">{t.errorTitle}</p>
                        <p>{error}</p>
                    </div>
                )}
                
                <div className="mt-6 text-center">
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full sm:w-auto bg-green-500 text-white font-bold text-lg px-12 py-4 rounded-xl hover:bg-green-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-green-300 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-3"
                    >
                        {isLoading ? (
                            <>
                                <Spinner />
                                <span>{loadingMessage || t.generating}</span>
                            </>
                        ) : (
                             t.generate
                        )}
                    </button>
                </div>
            </main>

            <section className="w-full max-w-7xl">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {recipes.map((recipe) => (
                        <RecipeCard
                            key={recipe.id}
                            recipe={recipe}
                            language={language}
                            onToggleFavorite={handleToggleFavorite}
                            isFavorite={favoriteRecipes.some(fav => fav.id === recipe.id)}
                            onShare={handleShareRecipe}
                        />
                    ))}
                </div>

                {favoriteRecipes.length > 0 && (
                     <div className="mt-16">
                        <h2 className="text-3xl font-bold text-slate-800 text-center mb-8">{t.myFavoriteRecipes}</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                           {favoriteRecipes.map(recipe => (
                                <RecipeCard
                                    key={`fav-${recipe.id}`}
                                    recipe={recipe}
                                    language={language}
                                    onToggleFavorite={handleToggleFavorite}
                                    isFavorite={true}
                                    onShare={handleShareRecipe}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </section>
            
            {/* Hidden elements for camera capture */}
            <video ref={videoRef} autoPlay playsInline className="hidden"></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>

        <ScannedIngredientsModal 
            isOpen={isModalOpen}
            initialIngredients={scannedIngredients}
            onConfirm={handleConfirmScanned}
            onCancel={() => setIsModalOpen(false)}
            t={{
                confirmIngredients: t.confirmIngredients,
                editIngredientsPrompt: t.editIngredientsPrompt,
                addScanned: t.addScanned,
                cancel: t.cancel
            }}
        />
        </>
    );
};

export default NutriChef;
