import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Trophy, RotateCcw } from "lucide-react";

interface Question {
  question: string;
  answers: string[];
  correct: number;
  explanation?: string;
}

interface QuizConfig {
  title?: string;
  questions: Question[];
}

interface QuizToolProps {
  config: QuizConfig;
  lessonId: string;
}

export function QuizTool({ config, lessonId }: QuizToolProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  
  if (!config.questions || config.questions.length === 0) {
    return (
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-background">
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">Quiz non configuré</p>
        </CardContent>
      </Card>
    );
  }

  const score = submitted
    ? Object.entries(answers).filter(([qIdx, aIdx]) => 
        config.questions[Number(qIdx)].correct === aIdx
      ).length
    : 0;

  const allAnswered = Object.keys(answers).length === config.questions.length;
  const percentage = submitted ? Math.round((score / config.questions.length) * 100) : 0;

  return (
    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-background">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            ❓ {config.title || "Quiz"}
          </span>
          {submitted && (
            <div className="flex items-center gap-2 text-2xl font-bold">
              <Trophy className={`h-6 w-6 ${percentage >= 70 ? 'text-green-600' : 'text-orange-600'}`} />
              <span className={percentage >= 70 ? 'text-green-600' : 'text-orange-600'}>
                {score}/{config.questions.length}
              </span>
            </div>
          )}
        </CardTitle>
        {submitted && (
          <p className={`text-sm font-medium ${percentage >= 70 ? 'text-green-600' : 'text-orange-600'}`}>
            {percentage >= 70 
              ? '🎉 Excellent ! Tu as réussi le quiz !' 
              : '💪 Continue, tu peux faire mieux !'}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {config.questions.map((q, qIdx) => {
          const userAnswer = answers[qIdx];
          const isCorrect = submitted && userAnswer === q.correct;
          const isWrong = submitted && userAnswer !== undefined && userAnswer !== q.correct;

          return (
            <div key={qIdx} className="space-y-3 p-4 rounded-xl border border-border bg-background">
              <p className="font-semibold text-foreground">
                {qIdx + 1}. {q.question}
              </p>
              <RadioGroup
                value={String(answers[qIdx] ?? -1)}
                onValueChange={(v) => setAnswers({ ...answers, [qIdx]: Number(v) })}
                disabled={submitted}
              >
                {q.answers.map((ans, aIdx) => {
                  const isThisCorrect = aIdx === q.correct;
                  const isThisSelected = userAnswer === aIdx;

                  return (
                    <div 
                      key={aIdx} 
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        submitted && isThisCorrect 
                          ? 'bg-green-50 border border-green-200' 
                          : submitted && isThisSelected && !isThisCorrect
                          ? 'bg-red-50 border border-red-200'
                          : 'hover:bg-accent'
                      }`}
                    >
                      <RadioGroupItem 
                        value={String(aIdx)} 
                        id={`q${qIdx}-a${aIdx}`}
                        className={submitted && isThisCorrect ? 'border-green-600' : ''}
                      />
                      <Label 
                        htmlFor={`q${qIdx}-a${aIdx}`} 
                        className="flex-1 cursor-pointer"
                      >
                        {ans}
                      </Label>
                      {submitted && isThisCorrect && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                      {submitted && isThisSelected && !isThisCorrect && (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  );
                })}
              </RadioGroup>
              {submitted && q.explanation && (
                <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                  <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">💡 Explication</p>
                  <p className="text-blue-800 dark:text-blue-200">{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
        
        <div className="pt-4">
          {!submitted ? (
            <Button 
              onClick={() => setSubmitted(true)} 
              className="w-full"
              disabled={!allAnswered}
              size="lg"
            >
              {allAnswered ? 'Soumettre les réponses' : `Réponds aux ${config.questions.length - Object.keys(answers).length} questions restantes`}
            </Button>
          ) : (
            <Button 
              onClick={() => { 
                setAnswers({}); 
                setSubmitted(false); 
              }}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Recommencer le quiz
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
