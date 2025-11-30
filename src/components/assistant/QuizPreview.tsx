import { CheckCircle2, Circle } from "lucide-react";

interface Question {
  question: string;
  answers: string[];
  correctIndex: number;
  explanation?: string;
}

interface QuizPreviewProps {
  title: string;
  questions: Question[];
}

export function QuizPreview({ title, questions }: QuizPreviewProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-slate-900">{title}</h4>
      <div className="space-y-3">
        {questions.map((q, idx) => (
          <div key={idx} className="bg-slate-50 rounded-lg p-3">
            <p className="text-sm font-medium text-slate-800 mb-2">
              {idx + 1}. {q.question}
            </p>
            <div className="space-y-1.5 pl-2">
              {q.answers.map((answer, ansIdx) => (
                <div 
                  key={ansIdx} 
                  className={`flex items-center gap-2 text-xs ${
                    ansIdx === q.correctIndex 
                      ? "text-green-700 font-medium" 
                      : "text-slate-600"
                  }`}
                >
                  {ansIdx === q.correctIndex ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-slate-400" />
                  )}
                  {answer}
                </div>
              ))}
            </div>
            {q.explanation && (
              <p className="text-xs text-slate-500 mt-2 italic pl-2">
                💡 {q.explanation}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
