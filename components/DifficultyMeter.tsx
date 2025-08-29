import React from 'react';
import type { Difficulty } from '../types';

interface DifficultyMeterProps {
    difficulty: Difficulty;
    language: 'en' | 'es';
}

const difficultyMap: Record<Difficulty, { level: number; label: { en: string; es: string; } }> = {
    'Very Easy': { level: 1, label: { en: 'Very Easy', es: 'Muy Fácil' } },
    'Easy': { level: 2, label: { en: 'Easy', es: 'Fácil' } },
    'Medium': { level: 3, label: { en: 'Medium', es: 'Media' } },
    'Hard': { level: 4, label: { en: 'Hard', es: 'Difícil' } },
    'Expert': { level: 5, label: { en: 'Expert', es: 'Experta' } }
};

const DifficultyMeter: React.FC<DifficultyMeterProps> = ({ difficulty, language }) => {
    const { level, label } = difficultyMap[difficulty] || difficultyMap['Medium'];
    const totalBars = 5;

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <h5 className="text-sm font-semibold text-slate-600">{language === 'es' ? 'Dificultad' : 'Difficulty'}</h5>
                <p className="text-sm font-medium text-green-700">{label[language]}</p>
            </div>
            <div className="flex gap-1">
                {Array.from({ length: totalBars }).map((_, index) => (
                    <div
                        key={index}
                        className={`h-2 flex-1 rounded-full ${index < level ? 'bg-green-500' : 'bg-slate-200'}`}
                        role="presentation"
                        aria-label={index < level ? 'Filled level' : 'Empty level'}
                    ></div>
                ))}
            </div>
        </div>
    );
};

export default DifficultyMeter;