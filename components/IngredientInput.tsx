import React, { useState } from 'react';
import Spinner from './Spinner';

interface IngredientInputProps {
    ingredients: string[];
    onAddIngredient: (ingredient: string) => void;
    onRemoveIngredient: (ingredient: string) => void;
    placeholder: string;
    addButtonText: string;
    onScanClick: () => void;
    isScanning: boolean;
    scanButtonText: string;
    scanningText: string;
}

const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);


const IngredientInput: React.FC<IngredientInputProps> = ({
    ingredients,
    onAddIngredient,
    onRemoveIngredient,
    placeholder,
    addButtonText,
    onScanClick,
    isScanning,
    scanButtonText,
    scanningText
}) => {
    const [inputValue, setInputValue] = useState('');

    const handleAdd = () => {
        if (inputValue.trim()) {
            onAddIngredient(inputValue.trim());
            setInputValue('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    return (
        <div className="flex flex-col gap-4">
             <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="flex-grow w-full px-4 py-3 text-slate-700 bg-slate-100 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-colors"
                    aria-label="Add a new ingredient"
                />
                <button
                    onClick={handleAdd}
                    className="bg-green-200 text-green-800 font-semibold px-6 py-3 rounded-lg hover:bg-green-300 transition-colors duration-200 flex-shrink-0"
                >
                    {addButtonText}
                </button>
                 <button
                    onClick={onScanClick}
                    disabled={isScanning}
                    className="flex-shrink-0 p-3 bg-slate-200 text-slate-600 hover:bg-slate-300 rounded-lg transition-colors duration-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400"
                    aria-label={isScanning ? scanningText : scanButtonText}
                    title={isScanning ? scanningText : scanButtonText}
                >
                    {isScanning ? (
                        <Spinner />
                    ) : (
                        <CameraIcon />
                    )}
                </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
                {ingredients.map(ingredient => (
                    <span key={ingredient} className="flex items-center bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full shadow-sm">
                        {ingredient}
                        <button
                            onClick={() => onRemoveIngredient(ingredient)}
                            className="ml-2 text-green-500 hover:text-green-700"
                            aria-label={`Remove ${ingredient}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </span>
                ))}
            </div>
        </div>
    );
};

export default IngredientInput;