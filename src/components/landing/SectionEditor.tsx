import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { ImageUploader } from "./ImageUploader";

interface SectionEditorProps {
  section: string;
  content: any;
  trainerInfo: any;
  organizationId?: string;
  onChange: (section: string, data: any) => void;
  onTrainerChange: (data: any) => void;
}

export function SectionEditor({ 
  section, 
  content, 
  trainerInfo,
  organizationId,
  onChange, 
  onTrainerChange 
}: SectionEditorProps) {
  const updateField = (field: string, value: any) => {
    const currentSectionData = content[section] || {};
    onChange(section, { ...currentSectionData, [field]: value });
  };

  const updateArrayField = (field: string, index: number, value: any) => {
    const currentArray = content[section]?.[field] || [];
    const newArray = [...currentArray];
    newArray[index] = value;
    updateField(field, newArray);
  };

  const addArrayItem = (field: string, defaultValue: any) => {
    const currentArray = content[section]?.[field] || [];
    updateField(field, [...currentArray, defaultValue]);
  };

  const removeArrayItem = (field: string, index: number) => {
    const currentArray = content[section]?.[field] || [];
    updateField(field, currentArray.filter((_: any, i: number) => i !== index));
  };

  switch (section) {
    case 'hero':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Badge (optionnel)</Label>
            <Input
              value={content?.hero?.badge || ""}
              onChange={(e) => updateField('badge', e.target.value)}
              placeholder="🚀 Formation Premium"
            />
          </div>
          <div className="space-y-2">
            <Label>Titre principal (H1)</Label>
            <Textarea
              value={content?.hero?.headline || ""}
              onChange={(e) => updateField('headline', e.target.value)}
              placeholder="Le titre accrocheur de votre formation"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Sous-titre</Label>
            <Textarea
              value={content?.hero?.subheadline || ""}
              onChange={(e) => updateField('subheadline', e.target.value)}
              placeholder="Une description courte et impactante"
              rows={3}
            />
          </div>
          <ImageUploader
            label="Image Hero (optionnel)"
            value={content?.hero?.hero_image || ""}
            onChange={(url) => updateField('hero_image', url)}
            organizationId={organizationId}
            placeholder="Image d'arrière-plan pour la section hero"
          />
          <div className="space-y-2">
            <Label>Texte du CTA</Label>
            <Input
              value={content?.hero?.cta_text || ""}
              onChange={(e) => updateField('cta_text', e.target.value)}
              placeholder="S'inscrire maintenant"
            />
          </div>
          <div className="space-y-2">
            <Label>Sous-texte CTA (optionnel)</Label>
            <Input
              value={content?.hero?.cta_subtext || ""}
              onChange={(e) => updateField('cta_subtext', e.target.value)}
              placeholder="Garantie satisfait ou remboursé"
            />
          </div>
        </div>
      );

    case 'problem':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Titre de section</Label>
            <Input
              value={content?.problem?.title || ""}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Vous reconnaissez-vous ?"
            />
          </div>
          <div className="space-y-2">
            <Label>Texte d'agitation</Label>
            <Textarea
              value={content?.problem?.agitation_text || ""}
              onChange={(e) => updateField('agitation_text', e.target.value)}
              placeholder="Description des frustrations..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Points de douleur</Label>
            {(content?.problem?.pain_points || []).map((pain: string, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={pain}
                  onChange={(e) => updateArrayField('pain_points', index, e.target.value)}
                />
                <Button variant="ghost" size="icon" onClick={() => removeArrayItem('pain_points', index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addArrayItem('pain_points', '')}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Risques (optionnel)</Label>
            {(content?.problem?.risks || []).map((risk: string, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={risk}
                  onChange={(e) => updateArrayField('risks', index, e.target.value)}
                />
                <Button variant="ghost" size="icon" onClick={() => removeArrayItem('risks', index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addArrayItem('risks', '')}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter
            </Button>
          </div>
        </div>
      );

    case 'method':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Titre de section</Label>
            <Input
              value={content?.method?.title || ""}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="La méthode en 3 étapes"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={content?.method?.description || ""}
              onChange={(e) => updateField('description', e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-3">
            <Label>Piliers</Label>
            {(content?.method?.pillars || []).map((pillar: any, index: number) => (
              <Card key={index} className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm">Pilier {index + 1}</Label>
                  <Button variant="ghost" size="sm" onClick={() => removeArrayItem('pillars', index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  value={pillar.title || ""}
                  onChange={(e) => updateArrayField('pillars', index, { ...pillar, title: e.target.value })}
                  placeholder="Titre du pilier"
                />
                <Textarea
                  value={pillar.description || ""}
                  onChange={(e) => updateArrayField('pillars', index, { ...pillar, description: e.target.value })}
                  placeholder="Description"
                  rows={2}
                />
                <ImageUploader
                  label="Icône/Image (optionnel)"
                  value={pillar.icon_url || ""}
                  onChange={(url) => updateArrayField('pillars', index, { ...pillar, icon_url: url })}
                  organizationId={organizationId}
                  placeholder="Icône ou image pour ce pilier"
                />
              </Card>
            ))}
            <Button variant="outline" size="sm" onClick={() => addArrayItem('pillars', { title: '', description: '', icon_url: '' })}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter un pilier
            </Button>
          </div>
        </div>
      );

    case 'transformation':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Titre de section</Label>
            <Input
              value={content?.transformation?.title || ""}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Votre transformation"
            />
          </div>
          <Card className="p-4 space-y-3">
            <Label>Carte gauche</Label>
            <Input
              value={content?.transformation?.left_card?.title || ""}
              onChange={(e) => {
                const current = content?.transformation?.left_card || {};
                updateField('left_card', { ...current, title: e.target.value });
              }}
              placeholder="Titre carte gauche"
            />
            <Textarea
              value={content?.transformation?.left_card?.description || ""}
              onChange={(e) => {
                const current = content?.transformation?.left_card || {};
                updateField('left_card', { ...current, description: e.target.value });
              }}
              placeholder="Description"
              rows={2}
            />
          </Card>
          <Card className="p-4 space-y-3">
            <Label>Carte droite</Label>
            <Input
              value={content?.transformation?.right_card?.title || ""}
              onChange={(e) => {
                const current = content?.transformation?.right_card || {};
                updateField('right_card', { ...current, title: e.target.value });
              }}
              placeholder="Titre carte droite"
            />
            <Textarea
              value={content?.transformation?.right_card?.description || ""}
              onChange={(e) => {
                const current = content?.transformation?.right_card || {};
                updateField('right_card', { ...current, description: e.target.value });
              }}
              placeholder="Description"
              rows={2}
            />
          </Card>
        </div>
      );

    case 'program':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Titre de section</Label>
            <Input
              value={content?.program?.title || ""}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Le programme complet"
            />
          </div>
          <div className="space-y-3">
            <Label>Modules</Label>
            {(content?.program?.modules || []).map((module: any, index: number) => (
              <Card key={index} className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm">Module {index + 1}</Label>
                  <Button variant="ghost" size="sm" onClick={() => removeArrayItem('modules', index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  value={module.title || ""}
                  onChange={(e) => updateArrayField('modules', index, { ...module, title: e.target.value })}
                  placeholder="Titre du module"
                />
                <Textarea
                  value={module.description || ""}
                  onChange={(e) => updateArrayField('modules', index, { ...module, description: e.target.value })}
                  placeholder="Description"
                  rows={2}
                />
                <Input
                  type="number"
                  value={module.lessons_count || ""}
                  onChange={(e) => updateArrayField('modules', index, { ...module, lessons_count: parseInt(e.target.value) || 0 })}
                  placeholder="Nombre de leçons"
                />
              </Card>
            ))}
            <Button variant="outline" size="sm" onClick={() => addArrayItem('modules', { title: '', description: '', lessons_count: 0 })}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter un module
            </Button>
          </div>
        </div>
      );

    case 'trainer':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tagline (optionnel)</Label>
            <Input
              value={content?.trainer?.tagline || ""}
              onChange={(e) => updateField('tagline', e.target.value)}
              placeholder="Expert en..."
            />
          </div>
          <div className="space-y-2">
            <Label>Titre de section</Label>
            <Input
              value={content?.trainer?.title || ""}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Votre formateur"
            />
          </div>
          <div className="space-y-2">
            <Label>Bio courte</Label>
            <Textarea
              value={content?.trainer?.bio_highlight || ""}
              onChange={(e) => updateField('bio_highlight', e.target.value)}
              rows={3}
            />
          </div>
          <ImageUploader
            label="Photo du formateur"
            value={trainerInfo?.photo || ""}
            onChange={(url) => onTrainerChange({ ...trainerInfo, photo: url })}
            organizationId={organizationId}
            placeholder="Photo professionnelle du formateur"
          />
          <div className="space-y-2">
            <Label>Credentials</Label>
            {(content?.trainer?.credentials || []).map((cred: string, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={cred}
                  onChange={(e) => updateArrayField('credentials', index, e.target.value)}
                />
                <Button variant="ghost" size="icon" onClick={() => removeArrayItem('credentials', index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addArrayItem('credentials', '')}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Citation (optionnel)</Label>
            <Textarea
              value={content?.trainer?.quote || ""}
              onChange={(e) => updateField('quote', e.target.value)}
              rows={2}
            />
          </div>
        </div>
      );

    case 'testimonials':
      return (
        <div className="space-y-4">
          <Label>Témoignages</Label>
          {(content?.testimonials || []).map((testimonial: any, index: number) => (
            <Card key={index} className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm">Témoignage {index + 1}</Label>
                <Button variant="ghost" size="sm" onClick={() => {
                  const newTestimonials = [...(content?.testimonials || [])];
                  newTestimonials.splice(index, 1);
                  onChange('testimonials', newTestimonials);
                }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <ImageUploader
                label="Photo (optionnel)"
                value={testimonial.avatar || ""}
                onChange={(url) => {
                  const newTestimonials = [...(content?.testimonials || [])];
                  newTestimonials[index] = { ...testimonial, avatar: url };
                  onChange('testimonials', newTestimonials);
                }}
                organizationId={organizationId}
                placeholder="Photo du témoin"
              />
              <Input
                value={testimonial.name || ""}
                onChange={(e) => {
                  const newTestimonials = [...(content?.testimonials || [])];
                  newTestimonials[index] = { ...testimonial, name: e.target.value };
                  onChange('testimonials', newTestimonials);
                }}
                placeholder="Nom"
              />
              <Input
                value={testimonial.role || ""}
                onChange={(e) => {
                  const newTestimonials = [...(content?.testimonials || [])];
                  newTestimonials[index] = { ...testimonial, role: e.target.value };
                  onChange('testimonials', newTestimonials);
                }}
                placeholder="Rôle / Entreprise"
              />
              <Textarea
                value={testimonial.text || ""}
                onChange={(e) => {
                  const newTestimonials = [...(content?.testimonials || [])];
                  newTestimonials[index] = { ...testimonial, text: e.target.value };
                  onChange('testimonials', newTestimonials);
                }}
                placeholder="Témoignage"
                rows={3}
              />
              <Input
                type="number"
                min="1"
                max="5"
                value={testimonial.rating || 5}
                onChange={(e) => {
                  const newTestimonials = [...(content?.testimonials || [])];
                  newTestimonials[index] = { ...testimonial, rating: parseInt(e.target.value) || 5 };
                  onChange('testimonials', newTestimonials);
                }}
                placeholder="Note (1-5)"
              />
            </Card>
          ))}
          <Button variant="outline" size="sm" onClick={() => {
            const newTestimonials = [...(content?.testimonials || []), { name: '', role: '', text: '', rating: 5, avatar: '' }];
            onChange('testimonials', newTestimonials);
          }}>
            <Plus className="h-4 w-4 mr-2" /> Ajouter un témoignage
          </Button>
        </div>
      );

    case 'faq':
      return (
        <div className="space-y-4">
          <Label>Questions fréquentes</Label>
          {(content?.faq || []).map((item: any, index: number) => (
            <Card key={index} className="p-4 space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm">Question {index + 1}</Label>
                <Button variant="ghost" size="sm" onClick={() => {
                  const newFaq = [...(content?.faq || [])];
                  newFaq.splice(index, 1);
                  onChange('faq', newFaq);
                }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={item.question || ""}
                onChange={(e) => {
                  const newFaq = [...(content?.faq || [])];
                  newFaq[index] = { ...item, question: e.target.value };
                  onChange('faq', newFaq);
                }}
                placeholder="Question"
              />
              <Textarea
                value={item.answer || ""}
                onChange={(e) => {
                  const newFaq = [...(content?.faq || [])];
                  newFaq[index] = { ...item, answer: e.target.value };
                  onChange('faq', newFaq);
                }}
                placeholder="Réponse"
                rows={3}
              />
            </Card>
          ))}
          <Button variant="outline" size="sm" onClick={() => {
            const newFaq = [...(content?.faq || []), { question: '', answer: '' }];
            onChange('faq', newFaq);
          }}>
            <Plus className="h-4 w-4 mr-2" /> Ajouter une question
          </Button>
        </div>
      );

    case 'final_cta':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Badge d'urgence (optionnel)</Label>
            <Input
              value={content?.final_cta?.urgency_badge || ""}
              onChange={(e) => updateField('urgency_badge', e.target.value)}
              placeholder="🔥 Offre limitée"
            />
          </div>
          <div className="space-y-2">
            <Label>Titre</Label>
            <Textarea
              value={content?.final_cta?.title || ""}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Ne restez pas sur le quai"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Sous-titre</Label>
            <Textarea
              value={content?.final_cta?.subtitle || ""}
              onChange={(e) => updateField('subtitle', e.target.value)}
              placeholder="Rejoignez la formation dès maintenant"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Texte du CTA</Label>
            <Input
              value={content?.final_cta?.cta_text || ""}
              onChange={(e) => updateField('cta_text', e.target.value)}
              placeholder="Je démarre la formation"
            />
          </div>
          <div className="space-y-2">
            <Label>Garantie (optionnel)</Label>
            <Input
              value={content?.final_cta?.guarantee || ""}
              onChange={(e) => updateField('guarantee', e.target.value)}
              placeholder="Satisfait ou remboursé pendant 30 jours"
            />
          </div>
        </div>
      );

    default:
      return <p className="text-muted-foreground">Sélectionnez une section à éditer</p>;
  }
}
