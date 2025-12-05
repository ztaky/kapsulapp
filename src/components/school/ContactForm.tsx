import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Send, MessageSquare, Loader2 } from 'lucide-react';

const contactSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  email: z.string().trim().email("Email invalide").max(255),
  message: z.string().trim().min(10, "Le message doit contenir au moins 10 caractères").max(2000),
  website: z.string().optional(), // Honeypot field
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
  organizationName: string;
  organizationEmail: string | null;
  brandColor: string;
}

export const ContactForm = ({ organizationName, organizationEmail, brandColor }: ContactFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const formLoadTime = useRef<number>(Date.now());

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  // Reset form load time on mount
  useEffect(() => {
    formLoadTime.current = Date.now();
  }, []);

  const onSubmit = async (data: ContactFormData) => {
    // Honeypot check - if website field is filled, it's a bot
    if (data.website) {
      // Silently fail for bots
      setSubmitted(true);
      return;
    }

    // Time check - if form submitted too fast (< 3 seconds), likely a bot
    const timeSinceLoad = Date.now() - formLoadTime.current;
    if (timeSinceLoad < 3000) {
      toast.error("Veuillez patienter quelques secondes avant d'envoyer");
      return;
    }

    if (!organizationEmail) {
      toast.error("Cette académie n'a pas configuré d'email de contact");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: responseData, error } = await supabase.functions.invoke('send-school-contact', {
        body: {
          senderName: data.name,
          senderEmail: data.email,
          message: data.message,
          organizationName,
          organizationEmail,
          timestamp: formLoadTime.current,
        },
      });

      if (error) throw error;
      
      if (responseData?.rateLimited) {
        toast.error("Trop de messages envoyés. Veuillez réessayer plus tard.");
        return;
      }

      setSubmitted(true);
      reset();
      toast.success("Votre message a été envoyé avec succès !");
    } catch (error) {
      console.error('Error sending contact form:', error);
      toast.error("Une erreur est survenue lors de l'envoi du message");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="pt-6 text-center">
          <div 
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: `${brandColor}20` }}
          >
            <Send className="h-8 w-8" style={{ color: brandColor }} />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Message envoyé !</h3>
          <p className="text-muted-foreground mb-4">
            Merci pour votre message. Nous vous répondrons dans les plus brefs délais.
          </p>
          <Button 
            variant="outline" 
            onClick={() => setSubmitted(false)}
          >
            Envoyer un autre message
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" style={{ color: brandColor }} />
          Nous contacter
        </CardTitle>
        <CardDescription>
          Une question ? Envoyez-nous un message et nous vous répondrons rapidement.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Honeypot field - hidden from users, bots will fill it */}
          <div className="absolute -left-[9999px] opacity-0 pointer-events-none" aria-hidden="true">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              {...register('website')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nom complet</Label>
            <Input
              id="name"
              placeholder="Votre nom"
              {...register('name')}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              {...register('email')}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Votre question ou message..."
              rows={5}
              {...register('message')}
              disabled={isSubmitting}
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            style={{ backgroundColor: brandColor }}
            disabled={isSubmitting || !organizationEmail}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer le message
              </>
            )}
          </Button>

          {!organizationEmail && (
            <p className="text-sm text-muted-foreground text-center">
              Le formulaire de contact n'est pas disponible pour cette académie.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
