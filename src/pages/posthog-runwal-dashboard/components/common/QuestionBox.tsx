import React from 'react';

interface QuestionBoxProps {
  questions: string[];
}

export const QuestionBox: React.FC<QuestionBoxProps> = ({ questions }) => {
  return (
    <div className="qbox">
      <b>Key questions</b>
      <ul>
        {questions.map((q, idx) => (
          <li key={idx}>{q}</li>
        ))}
      </ul>
    </div>
  );
};
