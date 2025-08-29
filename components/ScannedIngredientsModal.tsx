import React, { useState, useEffect } from 'react';

interface ScannedIngredientsModalProps {
    isOpen: boolean;
    initialIngredients: string[];
    onConfirm: (finalIngredients: string[]) => void;
    onCancel: () => void;
    t: {
        confirmIngredients: string;
        editIngredientsPrompt: string;
        addScanned: string;
        cancel: string;
    };
}

const ScannedIngredientsModal: React.FC<ScannedIngredientsModalProps> = ({ isOpen, initialIngredients, onConfirm, onCancel, t }) => {
    const [ingredients, setIngredients] = useState<string[]>(initialIngredients);

    useEffect(() => {
        setIngredients(initialIngredients);
    }, [initialIngredients]);

    const handleRemoveIngredient = (ingredientToRemove: string) => {
        setIngredients(prev => prev.filter(ing => ing !== ingredientToRemove));
    };

    const handleConfirm = () => {
        onConfirm(ingredients);
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 transform transition-all">
                <h2 id="modal-title" className="text-2xl font-bold text-slate-800 mb-2">{t.confirmIngredients}</h2>
                <p className="text-slate-600 mb-4 text-sm">{t.editIngredientsPrompt}</p>

                <div className="max-h-60 overflow-y-auto p-2 border border-slate-200 rounded-md bg-slate-50 mb-6">
                    {ingredients.length > 0 ? (
                         <div className="flex flex-wrap gap-2">
                            {ingredients.map(ingredient => (
                                <span key={ingredient} className="flex items-center bg-sky-100 text-sky-800 text-sm font-medium px-3 py-1 rounded-full shadow-sm">
                                    {ingredient}
                                    <button
                                        onClick={() => handleRemoveIngredient(ingredient)}
                                        className="ml-2 text-sky-500 hover:text-sky-700"
                                        aria-label={`Remove ${ingredient}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-center py-4">No ingredients were detected.</p>
                    )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 gap-3 sm:gap-0">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
                    >
                        {t.cancel}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={ingredients.length === 0}
                        className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:bg-green-300 disabled:cursor-not-allowed"
                    >
                        {t.addScanned}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScannedIngredientsModal;