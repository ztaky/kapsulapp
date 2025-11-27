import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";

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

interface QuizEditorProps {
  config: QuizConfig;
  onChange: (config: QuizConfig) => void;
}

export function QuizEditor({ config, onChange }: QuizEditorProps) {
  const questions = config.questions || [];

  const addQuestion = () => {
    onChange({
      ...config,
      questions: [
        ...questions,
        {
          question: "",
          answers: ["", ""],
          correct: 0,
          explanation: "",
        },
      ],
    });
  };

  const removeQuestion = (qIdx: number) => {
    onChange({
      ...config,
      questions: questions.filter((_, i) => i !== qIdx),
    });
  };

  const updateQuestion = (qIdx: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[qIdx] = { ...updated[qIdx], [field]: value };
    onChange({ ...config, questions: updated });
  };

  const addAnswer = (qIdx: number) => {
    const updated = [...questions];
    updated[qIdx].answers.push("");
    onChange({ ...config, questions: updated });
  };

  const removeAnswer = (qIdx: number, aIdx: number) => {
    const updated = [...questions];
    updated[qIdx].answers = updated[qIdx].answers.filter((_, i) => i !== aIdx);
    if (updated[qIdx].correct >= aIdx) {
      updated[qIdx].correct = Math.max(0, updated[qIdx].correct - 1);
    }
    onChange({ ...config, questions: updated });
  };

  const updateAnswer = (qIdx: number, aIdx: number, value: string) => {
    const updated = [...questions];
    updated[qIdx].answers[aIdx] = value;
    onChange({ ...config, questions: updated });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Titre du Quiz</Label>
        <Input
          placeholder="Mon Quiz"
          value={config.title || ""}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
        />
      </div>

      <div className="space-y-4">
        {questions.map((q, qIdx) => (
          <Card key={qIdx} className="border-2">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Question {qIdx + 1}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeQuestion(qIdx)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div>
                <Label>Question</Label>
                <Input
                  placeholder="Quelle est la capitale de la France ?"
                  value={q.question}
                  onChange={(e) => updateQuestion(qIdx, "question", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Réponses possibles</Label>
                {q.answers.map((ans, aIdx) => (
                  <div key={aIdx} className="flex items-center gap-2">
                    <Input
                      placeholder={`Réponse ${aIdx + 1}`}
                      value={ans}
                      onChange={(e) => updateAnswer(qIdx, aIdx, e.target.value)}
                    />
                    <Button
                      variant={q.correct === aIdx ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateQuestion(qIdx, "correct", aIdx)}
                      className="shrink-0"
                    >
                      {q.correct === aIdx ? "✓ Correcte" : "Correcte ?"}
                    </Button>
                    {q.answers.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAnswer(qIdx, aIdx)}
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addAnswer(qIdx)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une réponse
                </Button>
              </div>

              <div>
                <Label>Explication (optionnel)</Label>
                <Textarea
                  placeholder="Pourquoi cette réponse est correcte..."
                  value={q.explanation || ""}
                  onChange={(e) => updateQuestion(qIdx, "explanation", e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button onClick={addQuestion} className="w-full" variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Ajouter une question
      </Button>
    </div>
  );
}
