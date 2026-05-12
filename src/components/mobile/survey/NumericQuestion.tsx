import React from "react";

interface NumericQuestionProps {
    selectedRating: number | null;
    onRatingSelect: (rating: number) => void;
}

export const NumericQuestion: React.FC<NumericQuestionProps> = ({
    selectedRating,
    onRatingSelect,
}) => {
    const numericValues = Array.from({ length: 11 }, (_, index) => index);

    const getButtonColor = (value: number) => {
        if (value <= 1) return '#f87171';
        if (value <= 6) return '#f97659';
        if (value <= 8) return '#fbbf24';
        return '#4ade80';
    };

    return (
        <div className="w-full flex flex-col gap-3">
            {/* Buttons row */}
            <div className="flex items-center justify-between gap-1 sm:gap-2">
                {numericValues.map((value) => (
                    <button
                        key={value}
                        onClick={() => onRatingSelect(value)}
                        style={{ backgroundColor: getButtonColor(value) }}
                        className={`
                            flex-1 aspect-square max-w-[52px] min-w-0
                            rounded-[7px] sm:rounded-[9px]
                            text-white font-bold
                            text-xs sm:text-sm md:text-lg
                            transition-all duration-150
                            flex items-center justify-center
                            ${selectedRating === value
                                ? 'scale-110 shadow-lg'
                                : 'hover:scale-105 hover:shadow-md'
                            }
                        `}
                    >
                        {value}
                    </button>
                ))}
            </div>

            {/* Labels */}
            <div className="flex justify-between text-xs font-semibold text-gray-500">
                <span>😠 0 - NOT LIKELY</span>
                <span>10 - VERY LIKELY 😌</span>
            </div>

            {/* Selected state feedback */}
            {selectedRating !== null && (
                <div className="mt-2 p-2 rounded-lg border-2 text-center">
                    <p className="text-sm">
                        Selected value: <span className="text-sm">{selectedRating}</span>
                    </p>
                    <div className="mt-1">
                        {selectedRating <= 6 && (
                            <span className="inline-block px-3 bg-red-100 text-red-800 rounded-full text-sm">
                                Poor (0-6)
                            </span>
                        )}
                        {selectedRating >= 7 && selectedRating <= 8 && (
                            <span className="inline-block px-3 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                                Average (7-8)
                            </span>
                        )}
                        {selectedRating >= 9 && (
                            <span className="inline-block px-3 bg-green-100 text-green-800 rounded-full text-sm">
                                Excellent (9-10)
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};