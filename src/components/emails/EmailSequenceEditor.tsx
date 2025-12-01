import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

type SequenceTriggerEvent = Database["public"]["Enums"]["sequence_trigger_event"];
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, Clock, Mail } from "lucide-react";

interface EmailSequenceEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sequence?: any;
  organizationId?: string;
  isAdmin?: boolean;
}

const TRIGGER_EVENTS = [
  { value: "purchase_completed", label: "Après un achat" },
  { value: "student_signup", label: "Après inscription" },
  { value: "course_completed", label: "Formation terminée" },
  { value: "manual", label: "Déclenchement manuel" },
];

interface SequenceStep {
  id?: string;
  template_id: string;
  delay_hours: number;
  step_order: number;
}

export function EmailSequenceEditor({
  open,
  onOpenChange,
  sequence,
  organizationId,
  isAdmin,
}: EmailSequenceEditorProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerEvent, setTriggerEvent] = useState<SequenceTriggerEvent | "">("");
  const [triggerCourseId, setTriggerCourseId] = useState<string | null>(null);
  const [steps, setSteps] = useState<SequenceStep[]>([]);

  const { data: templates } = useQuery({
    queryKey: ["email-templates-for-sequence", organizationId, isAdmin],
    queryFn: async () => {
      let query = supabase.from("email_templates").select("id, name, email_type");
      if (isAdmin) {
        query = query.is("organization_id", null);
      } else if (organizationId) {
        query = query.eq("organization_id", organizationId);
      }
      const { data, error } = await query.eq("is_active", true);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: courses } = useQuery({
    queryKey: ["courses-for-sequence", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("courses")
        .select("id, title")
        .eq("organization_id", organizationId);
      if (error) throw error;
      return data;
    },
    enabled: open && !!organizationId,
  });

  const { data: existingSteps } = useQuery({
    queryKey: ["sequence-steps", sequence?.id],
    queryFn: async () => {
      if (!sequence?.id) return [];
      const { data, error } = await supabase
        .from("email_sequence_steps")
        .select("*")
        .eq("sequence_id", sequence.id)
        .order("step_order");
      if (error) throw error;
      return data;
    },
    enabled: open && !!sequence?.id,
  });

  useEffect(() => {
    if (sequence) {
      setName(sequence.name);
      setDescription(sequence.description || "");
      setTriggerEvent(sequence.trigger_event);
      setTriggerCourseId(sequence.trigger_course_id);
    } else {
      setName("");
      setDescription("");
      setTriggerEvent("");
      setTriggerCourseId(null);
      setSteps([]);
    }
  }, [sequence, open]);

  useEffect(() => {
    if (existingSteps) {
      setSteps(
        existingSteps.map((s) => ({
          id: s.id,
          template_id: s.template_id,
          delay_hours: s.delay_hours,
          step_order: s.step_order,
        }))
      );
    }
  }, [existingSteps]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!triggerEvent) throw new Error("Déclencheur requis");
      
      const sequenceData = {
        name,
        description,
        trigger_event: triggerEvent as SequenceTriggerEvent,
        trigger_course_id: triggerCourseId,
        organization_id: isAdmin ? null : organizationId,
      };

      let sequenceId = sequence?.id;

      if (sequenceId) {
        const { error } = await supabase
          .from("email_sequences")
          .update(sequenceData)
          .eq("id", sequenceId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("email_sequences")
          .insert(sequenceData)
          .select()
          .single();
        if (error) throw error;
        sequenceId = data.id;
      }

      // Delete existing steps
      if (sequence?.id) {
        await supabase.from("email_sequence_steps").delete().eq("sequence_id", sequence.id);
      }

      // Insert new steps
      if (steps.length > 0) {
        const stepsData = steps.map((step, index) => ({
          sequence_id: sequenceId,
          template_id: step.template_id,
          delay_hours: step.delay_hours,
          step_order: index,
        }));

        const { error: stepsError } = await supabase
          .from("email_sequence_steps")
          .insert(stepsData);
        if (stepsError) throw stepsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-sequences"] });
      toast.success(sequence ? "Séquence mise à jour" : "Séquence créée");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Une erreur est survenue");
    },
  });

  const addStep = () => {
    setSteps([
      ...steps,
      {
        template_id: "",
        delay_hours: steps.length === 0 ? 0 : 24,
        step_order: steps.length,
      },
    ]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof SequenceStep, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const formatDelay = (hours: number) => {
    if (hours === 0) return "Immédiatement";
    if (hours < 24) return `${hours}h après`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (remainingHours === 0) return `J+${days}`;
    return `J+${days} + ${remainingHours}h`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {sequence ? "Modifier la séquence" : "Nouvelle séquence"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la séquence</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Onboarding nouvel étudiant"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trigger">Déclencheur</Label>
              <Select value={triggerEvent} onValueChange={(v) => setTriggerEvent(v as SequenceTriggerEvent)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un déclencheur" />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_EVENTS.map((trigger) => (
                    <SelectItem key={trigger.value} value={trigger.value}>
                      {trigger.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {triggerEvent === "purchase_completed" && courses && courses.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="course">Formation spécifique (optionnel)</Label>
              <Select
                value={triggerCourseId || "all"}
                onValueChange={(v) => setTriggerCourseId(v === "all" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les formations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les formations</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez l'objectif de cette séquence..."
              rows={2}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Étapes de la séquence</Label>
              <Button variant="outline" size="sm" onClick={addStep} className="gap-1">
                <Plus className="h-4 w-4" />
                Ajouter une étape
              </Button>
            </div>

            {steps.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Mail className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">Aucune étape configurée</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <Card key={index} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2 text-slate-400 pt-2">
                          <GripVertical className="h-4 w-4" />
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Template</Label>
                            <Select
                              value={step.template_id}
                              onValueChange={(v) => updateStep(index, "template_id", v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner..." />
                              </SelectTrigger>
                              <SelectContent>
                                {templates?.map((template) => (
                                  <SelectItem key={template.id} value={template.id}>
                                    {template.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Délai (heures)</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                value={step.delay_hours}
                                onChange={(e) =>
                                  updateStep(index, "delay_hours", parseInt(e.target.value) || 0)
                                }
                              />
                              <span className="text-xs text-slate-500 whitespace-nowrap flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDelay(step.delay_hours)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStep(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!name || !triggerEvent || saveMutation.isPending}
            >
              {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
