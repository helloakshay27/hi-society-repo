import React, { useState } from "react";
import ReactDOM from "react-dom";
import { SurveyQuestion, SurveyOption, SurveyAnswers } from "./types";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import { StarRatingQuestion } from "./StarRatingQuestion";
import { EmojiRatingQuestion } from "./EmojiRatingQuestion";
import { NumericQuestion } from "./NumericQuestion";
import { getEmojiOptions, getRatingOptions } from "./surveyUtils";

interface FormViewAllQuestionsProps {
    questions: SurveyQuestion[];
    answers: SurveyAnswers;
    onAnswerChange: (questionId: number, answerData: any) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    finalComment: string;
    onFinalCommentChange: (comment: string) => void;
}

export const FormViewAllQuestions: React.FC<FormViewAllQuestionsProps> = ({
    questions,
    answers,
    onAnswerChange,
    onSubmit,
    isSubmitting,
    finalComment,
    onFinalCommentChange,
}) => {
    const [showPreview, setShowPreview] = useState(false);

    // Helper function to format answer for preview display
    const formatAnswerForPreview = (question: SurveyQuestion, answer: any) => {
        if (!answer) return "Not answered";
        
        switch (question.qtype) {
            case "multiple":
                return answer.selectedOptions?.map((opt: SurveyOption) => opt.qname).join(", ") || "Not answered";
            case "rating":
                return answer.rating ? `${answer.rating} stars` : "Not answered";
            case "emoji":
            case "smiley":
                return answer.emoji && answer.label ? `${answer.emoji} ${answer.label}` : "Not answered";
            case "numeric":
                return answer.rating ? answer.rating : "Not answered";
            case "input":
            case "input_box":
            case "text":
            case "description":
                return answer.value || "Not answered";
            default:
                return "Not answered";
        }
    };

    // Handle preview instead of direct submission
    const handlePreviewSubmit = () => {
        setShowPreview(true);
    };

    // Handle final submission after preview
    const handleFinalSubmit = () => {
        onSubmit();
    };
    const handleMultipleChoice = (questionId: number, option: SurveyOption) => {
        onAnswerChange(questionId, {
            qtype: "multiple",
            value: option.qname,
            selectedOptions: [option],
            comments: "",
        });
    };

    const handleRatingSelect = (questionId: number, rating: number, question: SurveyQuestion) => {
        onAnswerChange(questionId, {
            qtype: "rating",
            rating: rating,
            value: rating,
            comments: "",
        });
    };

    const handleEmojiSelect = (
        questionId: number,
        rating: number,
        emoji: string,
        label: string
    ) => {
        onAnswerChange(questionId, {
            qtype: "emoji",
            rating: rating,
            emoji: emoji,
            label: label,
            value: `${emoji} ${label}`,
            comments: "",
        });
    };

    const handleTextChange = (questionId: number, value: string, qtype: string) => {
        onAnswerChange(questionId, {
            qtype: qtype,
            value: value,
            comments: "",
        });
    };

    const handleNumericSelect = (questionId: number, rating: number, question: SurveyQuestion) => {
        onAnswerChange(questionId, {
            qtype: "numeric",
            rating: rating,
            value: rating,
            comments: "",
        });
    };

    const isFormValid = () => {
        // Check if all mandatory questions are answered
        return questions.every((question) => {
            if (!question.quest_mandatory) return true;
            const answer = answers[question.id];
            if (!answer) return false;

            switch (question.qtype) {
                case "multiple":
                    return answer.selectedOptions && answer.selectedOptions.length > 0;
                case "input":
                case "input_box":
                case "text":
                case "description":
                    return answer.value && answer.value.toString().trim() !== "";
                case "rating":
                case "emoji":
                case "smiley":
                case "numeric":
                    return answer.rating !== null && answer.rating !== undefined;
                default:
                    return true;
            }
        });
    };

    return (
        <div className="w-full space-y-6">
            {questions.map((question, index) => {
                const answer = answers[question.id];

                return (
                    <div
                        key={question.id}
                        className="bg-white rounded-lg p-4 shadow-md"
                    >
                        {/* Question Header */}
                        <div className="mb-4">
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="text-sm text-gray-800 flex-1">
                                    {index + 1}. {question.descr}
                                    {question.quest_mandatory && (
                                        <span className="text-red-500 ml-1">*</span>
                                    )}
                                </h3>
                            </div>
                        </div>

                        {/* Question Content */}
                        <div className="space-y-3">
                            {/* Multiple Choice */}
                            {question.qtype === "multiple" && (
                                <MultipleChoiceQuestion
                                    options={question.snag_quest_options}
                                    selectedOptions={answer?.selectedOptions || []}
                                    onOptionSelect={(option) => handleMultipleChoice(question.id, option)}
                                />
                            )}

                            {/* Rating */}
                            {question.qtype === "rating" && (
                                <StarRatingQuestion
                                    ratingOptions={getRatingOptions(question)}
                                    selectedRating={answer?.rating ?? null}
                                    onRatingSelect={(rating) => handleRatingSelect(question.id, rating, question)}
                                />
                            )}

                            {/* Emoji/Smiley */}
                            {(question.qtype === "emoji" || question.qtype === "smiley") && (
                                <EmojiRatingQuestion
                                    emojiOptions={getEmojiOptions(question)}
                                    selectedRating={answer?.rating ?? null}
                                    onEmojiSelect={(rating, emoji, label) =>
                                        handleEmojiSelect(question.id, rating, emoji, label)
                                    }
                                />
                            )}

                            {/* Numeric */}
                            {question.qtype === "numeric" && (
                                <NumericQuestion
                                    selectedRating={answer?.rating ?? null}
                                    onRatingSelect={(rating) => handleNumericSelect(question.id, rating, question)}
                                />
                            )}

                            {/* Input */}
                            {question.qtype === "input" && (
                                <input
                                    type="text"
                                    value={answer?.value?.toString() || ""}
                                    onChange={(e) => handleTextChange(question.id, e.target.value, "input")}
                                    placeholder="Enter your answer..."
                                    className="w-full p-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            )}

                            {/* Input Box - New Type */}
                            {question.qtype === "input_box" && (
                                <input
                                    type="text"
                                    value={answer?.value?.toString() || ""}
                                    onChange={(e) => handleTextChange(question.id, e.target.value, "input_box")}
                                    placeholder="Enter your response..."
                                    className="w-full p-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            )}

                            {/* Text */}
                            {question.qtype === "text" && (
                                <textarea
                                    value={answer?.value?.toString() || ""}
                                    onChange={(e) => handleTextChange(question.id, e.target.value, "text")}
                                    placeholder="Please enter your comments..."
                                    className="w-full h-32 p-3 text-base border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            )}

                            {/* Description */}
                            {question.qtype === "description" && (
                                <textarea
                                    value={answer?.value?.toString() || ""}
                                    onChange={(e) =>
                                        handleTextChange(question.id, e.target.value, "description")
                                    }
                                    placeholder="Enter your description..."
                                    className="w-full h-32 p-3 text-base border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Final Comments Section */}
            <div className="bg-white rounded-lg p-4 shadow-md">
                <div className="mb-4">
                    <h3 className="text-sm text-gray-800 mb-2">
                        Additional Comments (Optional)
                    </h3>
                    <p className="text-sm text-gray-600">
                        Share any additional feedback or suggestions
                    </p>
                </div>
                <textarea
                    value={finalComment}
                    onChange={(e) => onFinalCommentChange(e.target.value)}
                    placeholder="Please share your thoughts..."
                    className="w-full h-32 p-3 text-base border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Submit Button */}
            <div
                className="sticky bottom-0 bg-white/95 backdrop-blur-sm px-4 pt-4 rounded-lg shadow-lg"
                style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 16px))' }}
            >
                <button
                    type="button"
                    onClick={handlePreviewSubmit}
                    disabled={!isFormValid() || isSubmitting}
                    className="w-full bg-[#B88B15] hover:bg-[#B88B15] disabled:bg-gray-400 text-white py-3 px-4 rounded-lg text-base font-semibold transition-colors disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            <span className="text-base">Submiting...</span>
                        </div>
                    ) : (
                        "Preview Survey"
                    )}
                </button>
            </div>

            {/* Preview Modal */}
            {showPreview && ReactDOM.createPortal(
                <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="bg-white px-4 py-3 border-b">
                            <h2 className="text-lg font-semibold text-gray-800">Survey Preview</h2>
                            <p className="text-sm text-gray-600">Please review your answers before submitting</p>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 bg-white">
                            <div className="space-y-4">
                                {questions.map((question, index) => {
                                    const answer = answers[question.id];
                                    return (
                                        <div key={question.id} className="bg-white rounded-lg p-3 border">
                                            <div className="flex items-start">
                                                <span className="font-medium text-gray-800 mr-2">{index + 1}.</span>
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-gray-800">
                                                        {question.descr}
                                                        {question.quest_mandatory && (
                                                            <span className="text-red-500 ml-1">*</span>
                                                        )}
                                                    </h3>
                                                    <div className="mt-1 text-sm text-gray-600">
                                                        {formatAnswerForPreview(question, answer)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {/* Final Comments */}
                                {finalComment && (
                                    <div className="bg-white rounded-lg p-3 border">
                                        <h3 className="font-medium text-gray-800 mb-1">Additional Comments</h3>
                                        <p className="text-sm text-gray-600">{finalComment}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Footer */}
                        <div className="bg-white px-4 py-3 border-t flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowPreview(false)}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
                            >
                                Back to Edit
                            </button>
                            <button
                                type="button"
                                onClick={handleFinalSubmit}
                                disabled={isSubmitting}
                                className="flex-1 bg-[#B88B15] hover:bg-[#B88B15] disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        <span className="text-base">Submiting...</span>
                                    </div>
                                ) : (
                                    "Submit Survey"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            , document.body)}
        </div>
    );
};
