import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStudioContext } from "@/hooks/useStudioContext";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  FileText, 
  Shield, 
  Scale, 
  Save, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Building2,
  User,
  Briefcase,
  Building
} from "lucide-react";

type LegalPageType = 'mentions_legales' | 'politique_confidentialite' | 'cgv';
type BusinessType = 'auto_entrepreneur' | 'sarl' | 'sas' | 'eurl' | 'association';

interface LegalPageData {
  title: string;
  content: string;
}

interface BusinessTemplate {
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

const BUSINESS_TYPES: Record<BusinessType, BusinessTemplate> = {
  auto_entrepreneur: {
    label: "Auto-entrepreneur",
    icon: User,
    description: "Micro-entreprise, freelance"
  },
  sarl: {
    label: "SARL",
    icon: Building2,
    description: "Société à responsabilité limitée"
  },
  sas: {
    label: "SAS / SASU",
    icon: Building,
    description: "Société par actions simplifiée"
  },
  eurl: {
    label: "EURL",
    icon: Briefcase,
    description: "Entreprise unipersonnelle"
  },
  association: {
    label: "Association",
    icon: Building2,
    description: "Association loi 1901"
  }
};

// Templates for each legal page type and business type
const LEGAL_TEMPLATES: Record<LegalPageType, Record<BusinessType, string>> = {
  mentions_legales: {
    auto_entrepreneur: `MENTIONS LÉGALES

ÉDITEUR DU SITE
Nom : [Votre prénom et nom]
Statut : Entrepreneur individuel (Auto-entrepreneur)
Siège social : [Votre adresse complète]
SIRET : [Votre numéro SIRET - 14 chiffres]
Code APE : [Votre code APE]
Email : [votre@email.com]
Téléphone : [Votre numéro]

Note : En tant qu'auto-entrepreneur, vous n'êtes pas assujetti à la TVA (article 293 B du CGI).

DIRECTEUR DE LA PUBLICATION
[Votre prénom et nom]

HÉBERGEUR DU SITE
Nom : [Nom de l'hébergeur - ex: OVH, Vercel, Netlify]
Adresse : [Adresse de l'hébergeur]
Site web : [URL de l'hébergeur]

PROPRIÉTÉ INTELLECTUELLE
L'ensemble des contenus présents sur ce site (textes, images, vidéos, logos, formations) sont protégés par le droit d'auteur et sont la propriété exclusive de [Votre nom].

Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site est interdite sans autorisation écrite préalable.

DONNÉES PERSONNELLES
Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ce droit, contactez-nous à : [votre@email.com]

COOKIES
Ce site utilise des cookies pour améliorer votre expérience de navigation et mesurer l'audience du site.`,

    sarl: `MENTIONS LÉGALES

ÉDITEUR DU SITE
Raison sociale : [Nom de votre SARL]
Forme juridique : Société à Responsabilité Limitée (SARL)
Capital social : [Montant] €
Siège social : [Adresse complète du siège]
SIRET : [Numéro SIRET - 14 chiffres]
RCS : [Ville d'immatriculation] B [Numéro RCS]
Code APE : [Code APE]
Numéro TVA intracommunautaire : FR [XX] [SIREN]
Email : [contact@votreentreprise.com]
Téléphone : [Numéro de téléphone]

GÉRANT(S)
[Nom et prénom du/des gérant(s)]

DIRECTEUR DE LA PUBLICATION
[Nom et prénom], en qualité de gérant

HÉBERGEUR DU SITE
Nom : [Nom de l'hébergeur]
Raison sociale : [Raison sociale de l'hébergeur]
Adresse : [Adresse complète]
Site web : [URL]

PROPRIÉTÉ INTELLECTUELLE
L'ensemble des éléments constituant ce site (textes, graphismes, logiciels, photographies, images, vidéos, sons, plans, logos, marques, formations et leur contenu) sont la propriété exclusive de [Nom de la SARL] ou de ses partenaires.

Ces éléments sont protégés par les lois françaises et internationales relatives à la propriété intellectuelle. Toute reproduction totale ou partielle est strictement interdite.

DONNÉES PERSONNELLES
Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous bénéficiez d'un droit d'accès, de rectification, de portabilité et d'effacement de vos données.

Responsable du traitement : [Nom de la SARL]
Contact DPO : [email du DPO ou contact]

COOKIES
Ce site utilise des cookies. Pour plus d'informations, consultez notre politique de confidentialité.`,

    sas: `MENTIONS LÉGALES

ÉDITEUR DU SITE
Dénomination sociale : [Nom de votre SAS/SASU]
Forme juridique : Société par Actions Simplifiée (SAS) [ou SASU si unipersonnelle]
Capital social : [Montant] €
Siège social : [Adresse complète du siège]
SIRET : [Numéro SIRET - 14 chiffres]
RCS : [Ville d'immatriculation] B [Numéro RCS]
Code APE : [Code APE]
Numéro TVA intracommunautaire : FR [XX] [SIREN]
Email : [contact@votreentreprise.com]
Téléphone : [Numéro de téléphone]

PRÉSIDENT
[Nom et prénom du Président]

DIRECTEUR DE LA PUBLICATION
[Nom et prénom], en qualité de Président

HÉBERGEUR DU SITE
Raison sociale : [Raison sociale de l'hébergeur]
Adresse : [Adresse complète]
Téléphone : [Numéro]
Site web : [URL]

PROPRIÉTÉ INTELLECTUELLE
Le site et l'ensemble de son contenu (marques, logos, textes, éléments graphiques, vidéos, formations) sont protégés au titre du droit de la propriété intellectuelle.

Toute utilisation, reproduction ou diffusion non autorisée constitue une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.

PROTECTION DES DONNÉES PERSONNELLES
[Nom de la SAS] s'engage à protéger vos données personnelles conformément au RGPD.

Responsable du traitement : [Nom de la SAS]
Délégué à la Protection des Données : [Nom/Email]
Finalités : Gestion des comptes clients, accès aux formations, communications commerciales
Base légale : Exécution du contrat, consentement

Vous disposez des droits d'accès, de rectification, d'effacement, de limitation, de portabilité et d'opposition.

COOKIES
Nous utilisons des cookies pour améliorer votre expérience. Consultez notre politique de confidentialité pour plus d'informations.`,

    eurl: `MENTIONS LÉGALES

ÉDITEUR DU SITE
Dénomination sociale : [Nom de votre EURL]
Forme juridique : Entreprise Unipersonnelle à Responsabilité Limitée (EURL)
Capital social : [Montant] €
Siège social : [Adresse complète du siège]
SIRET : [Numéro SIRET - 14 chiffres]
RCS : [Ville d'immatriculation] B [Numéro RCS]
Code APE : [Code APE]
Numéro TVA intracommunautaire : FR [XX] [SIREN]
Email : [contact@votreentreprise.com]
Téléphone : [Numéro de téléphone]

GÉRANT ET ASSOCIÉ UNIQUE
[Nom et prénom]

DIRECTEUR DE LA PUBLICATION
[Nom et prénom], en qualité de gérant

HÉBERGEUR DU SITE
Nom : [Nom de l'hébergeur]
Adresse : [Adresse complète]
Site web : [URL]

PROPRIÉTÉ INTELLECTUELLE
Tous les contenus présents sur ce site sont protégés par le droit d'auteur. Toute reproduction sans autorisation est interdite.

DONNÉES PERSONNELLES
Responsable du traitement : [Nom de l'EURL]
Conformément au RGPD, vous disposez de droits sur vos données personnelles.
Contact : [email]

COOKIES
Ce site utilise des cookies pour améliorer votre navigation.`,

    association: `MENTIONS LÉGALES

ÉDITEUR DU SITE
Nom de l'association : [Nom de l'association]
Forme juridique : Association loi 1901
Siège social : [Adresse complète]
Numéro RNA : W[XX][XXXXXXX]
SIRET : [Numéro SIRET si applicable]
Email : [contact@association.org]
Téléphone : [Numéro]

REPRÉSENTANT LÉGAL
[Nom et prénom du Président de l'association]

DIRECTEUR DE LA PUBLICATION
[Nom et prénom], Président de l'association

HÉBERGEUR DU SITE
Nom : [Nom de l'hébergeur]
Adresse : [Adresse complète]
Site web : [URL]

OBJET DE L'ASSOCIATION
[Description de l'objet de l'association tel que défini dans les statuts]

PROPRIÉTÉ INTELLECTUELLE
L'ensemble du contenu de ce site est protégé par le droit de la propriété intellectuelle. Toute reproduction est interdite sans autorisation préalable.

DONNÉES PERSONNELLES
L'association [Nom] s'engage à protéger vos données personnelles conformément au RGPD.
Pour exercer vos droits, contactez-nous à : [email]

COOKIES
Ce site utilise des cookies pour améliorer votre expérience de navigation.`
  },

  politique_confidentialite: {
    auto_entrepreneur: `POLITIQUE DE CONFIDENTIALITÉ

Dernière mise à jour : [Date]

RESPONSABLE DU TRAITEMENT
[Votre prénom et nom]
Auto-entrepreneur
[Adresse]
Email : [votre@email.com]

DONNÉES COLLECTÉES
Dans le cadre de mon activité de formation en ligne, je collecte les données suivantes :
• Données d'identification : nom, prénom, adresse email
• Données de connexion : identifiants de compte, historique de connexion
• Données de paiement : transactions (gérées par notre prestataire de paiement sécurisé)
• Données de progression : avancement dans les formations

FINALITÉS DU TRAITEMENT
Vos données sont collectées pour :
• Créer et gérer votre compte utilisateur
• Vous donner accès aux formations achetées
• Vous envoyer des informations relatives à vos formations
• Améliorer mes services et contenus
• Répondre à vos demandes de support

BASE LÉGALE
• Exécution du contrat : accès aux formations achetées
• Intérêt légitime : amélioration des services, support client
• Consentement : newsletter et communications marketing

DURÉE DE CONSERVATION
• Données de compte : durée de la relation commerciale + 3 ans
• Données de facturation : 10 ans (obligation légale)
• Données de connexion : 1 an

VOS DROITS
Conformément au RGPD, vous disposez des droits suivants :
• Droit d'accès à vos données
• Droit de rectification
• Droit à l'effacement ("droit à l'oubli")
• Droit à la limitation du traitement
• Droit à la portabilité
• Droit d'opposition

Pour exercer ces droits, contactez-moi à : [votre@email.com]

COOKIES
Ce site utilise des cookies :
• Cookies essentiels : fonctionnement du site et authentification
• Cookies analytiques : mesure d'audience (anonymisés)

Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.

SÉCURITÉ
Je mets en œuvre des mesures techniques et organisationnelles pour protéger vos données : connexion sécurisée (HTTPS), mots de passe chiffrés, accès restreint aux données.

MODIFICATIONS
Cette politique peut être mise à jour. La date de dernière modification est indiquée en haut du document.

CONTACT
Pour toute question : [votre@email.com]`,

    sarl: `POLITIQUE DE CONFIDENTIALITÉ

Dernière mise à jour : [Date]

1. RESPONSABLE DU TRAITEMENT
[Nom de la SARL]
[Adresse du siège social]
SIRET : [Numéro]
Email : [contact@entreprise.com]
Téléphone : [Numéro]

2. DONNÉES PERSONNELLES COLLECTÉES

2.1 Données que vous nous fournissez :
• Données d'identification : nom, prénom, adresse email, téléphone
• Données professionnelles : entreprise, fonction (si applicable)
• Données de paiement : informations de transaction (traitées par notre prestataire de paiement)

2.2 Données collectées automatiquement :
• Données de connexion : adresse IP, type de navigateur, pages visitées
• Données d'utilisation : progression dans les formations, temps passé

3. FINALITÉS ET BASE LÉGALE

| Finalité | Base légale | Durée de conservation |
|----------|-------------|----------------------|
| Gestion des comptes clients | Exécution du contrat | Durée du contrat + 3 ans |
| Accès aux formations | Exécution du contrat | Durée de l'abonnement |
| Facturation | Obligation légale | 10 ans |
| Newsletter | Consentement | Jusqu'au retrait du consentement |
| Amélioration des services | Intérêt légitime | 2 ans |
| Support client | Intérêt légitime | 3 ans |

4. DESTINATAIRES DES DONNÉES
Vos données peuvent être transmises à :
• Nos prestataires techniques (hébergement, paiement)
• Nos sous-traitants dans le cadre strict de leurs missions

Nous ne vendons jamais vos données à des tiers.

5. TRANSFERTS HORS UE
Certains de nos prestataires peuvent être situés hors de l'Union Européenne. Dans ce cas, nous nous assurons qu'ils présentent des garanties appropriées (clauses contractuelles types, certification Privacy Shield le cas échéant).

6. VOS DROITS

Vous disposez des droits suivants :
• Accès : obtenir une copie de vos données
• Rectification : corriger vos données inexactes
• Effacement : supprimer vos données
• Limitation : restreindre le traitement
• Portabilité : recevoir vos données dans un format structuré
• Opposition : vous opposer au traitement

Pour exercer vos droits : [email DPO ou contact]

Délai de réponse : 1 mois maximum

En cas de litige, vous pouvez introduire une réclamation auprès de la CNIL.

7. COOKIES
Nous utilisons différents types de cookies :
• Cookies strictement nécessaires
• Cookies de performance
• Cookies de fonctionnalité

Vous pouvez paramétrer vos préférences via notre bandeau cookies.

8. SÉCURITÉ
Nous mettons en œuvre des mesures de sécurité appropriées : chiffrement SSL, authentification sécurisée, sauvegardes régulières, accès restreint.

9. MODIFICATIONS
Cette politique peut être modifiée. Nous vous informerons de tout changement significatif.

10. CONTACT
Délégué à la Protection des Données : [Nom/Email]
Email général : [contact@entreprise.com]`,

    sas: `POLITIQUE DE CONFIDENTIALITÉ

Dernière mise à jour : [Date]

PRÉAMBULE
[Nom de la SAS] (« nous », « notre », « la Société ») s'engage à protéger la vie privée des utilisateurs de sa plateforme de formation en ligne. Cette politique décrit comment nous collectons, utilisons et protégeons vos données personnelles.

1. IDENTITÉ DU RESPONSABLE DE TRAITEMENT
[Nom de la SAS]
Société par Actions Simplifiée au capital de [montant] €
Siège social : [Adresse]
RCS [Ville] [Numéro]
Email : [privacy@entreprise.com]
DPO : [coordonnées du DPO si désigné]

2. DONNÉES PERSONNELLES TRAITÉES

Catégories de données :
• Identité : civilité, nom, prénom
• Coordonnées : email, téléphone, adresse
• Données professionnelles : société, fonction
• Données de connexion : logs, adresse IP
• Données d'utilisation : parcours de formation, évaluations
• Données financières : informations de paiement (via prestataire sécurisé)

3. FINALITÉS ET BASES LÉGALES

| Traitement | Finalité | Base légale |
|------------|----------|-------------|
| Création de compte | Accès à la plateforme | Contrat |
| Formations | Délivrance des formations | Contrat |
| Facturation | Gestion comptable | Obligation légale |
| Support | Assistance utilisateurs | Intérêt légitime |
| Statistiques | Amélioration des services | Intérêt légitime |
| Marketing | Communications commerciales | Consentement |

4. DURÉES DE CONSERVATION
• Données de compte actif : durée de la relation commerciale
• Données de compte inactif : 3 ans après la dernière activité
• Données de facturation : 10 ans
• Logs de connexion : 1 an
• Cookies : 13 mois maximum

5. DESTINATAIRES
• Services internes autorisés
• Prestataires techniques (hébergement, paiement, emailing)
• Autorités en cas d'obligation légale

6. TRANSFERTS INTERNATIONAUX
En cas de transfert hors EEE, nous appliquons les garanties prévues par le RGPD (clauses contractuelles types, décision d'adéquation).

7. VOS DROITS
Conformément au RGPD, vous pouvez :
- Accéder à vos données
- Les rectifier ou les effacer
- Limiter ou vous opposer au traitement
- Demander la portabilité
- Retirer votre consentement
- Introduire une réclamation auprès de la CNIL

Contact : [privacy@entreprise.com]

8. SÉCURITÉ
Mesures mises en œuvre :
• Chiffrement des données sensibles
• Protocole HTTPS
• Authentification forte
• Tests de sécurité réguliers
• Formation du personnel

9. COOKIES
Consultez notre politique de cookies pour plus de détails sur les cookies utilisés et leur gestion.

10. MISE À JOUR
Cette politique peut être mise à jour. La version en vigueur est celle publiée sur notre site.`,

    eurl: `POLITIQUE DE CONFIDENTIALITÉ

Dernière mise à jour : [Date]

RESPONSABLE DU TRAITEMENT
[Nom de l'EURL]
EURL au capital de [montant] €
[Adresse]
SIRET : [Numéro]
Email : [contact@entreprise.com]

COLLECTE DES DONNÉES
Nous collectons les données suivantes :
• Informations d'identification (nom, prénom, email)
• Données de connexion et d'utilisation
• Informations de paiement (via prestataire sécurisé)

UTILISATION DES DONNÉES
Vos données servent à :
• Gérer votre compte et vos accès aux formations
• Traiter vos commandes et paiements
• Vous contacter concernant vos formations
• Améliorer nos services

CONSERVATION
• Données de compte : durée de la relation + 3 ans
• Données comptables : 10 ans
• Logs : 1 an

VOS DROITS (RGPD)
Vous pouvez accéder, rectifier, supprimer vos données ou vous opposer au traitement.
Contact : [contact@entreprise.com]

COOKIES
Ce site utilise des cookies essentiels et analytiques. Vous pouvez les gérer via votre navigateur.

SÉCURITÉ
Nous protégeons vos données par des mesures techniques appropriées (HTTPS, chiffrement, accès sécurisé).

CONTACT
Pour toute question : [contact@entreprise.com]`,

    association: `POLITIQUE DE CONFIDENTIALITÉ

Dernière mise à jour : [Date]

RESPONSABLE DU TRAITEMENT
[Nom de l'association]
Association loi 1901
[Adresse du siège]
Email : [contact@association.org]

OBJET
Cette politique décrit comment l'association [Nom] collecte et traite vos données personnelles dans le cadre de ses activités de formation.

DONNÉES COLLECTÉES
• Identité : nom, prénom
• Contact : email, téléphone
• Adhésion : statut de membre (si applicable)
• Formation : inscriptions, progression

FINALITÉS
• Gestion des inscriptions aux formations
• Communication sur nos activités
• Gestion des adhésions (si applicable)

BASE LÉGALE
• Exécution du contrat de formation
• Intérêt légitime de l'association
• Consentement pour les communications

CONSERVATION
Les données sont conservées pendant la durée de votre relation avec l'association, puis archivées conformément à nos obligations.

VOS DROITS
Conformément au RGPD, vous pouvez exercer vos droits d'accès, de rectification, de suppression en nous contactant à : [contact@association.org]

SÉCURITÉ
L'association met en œuvre des mesures de sécurité adaptées pour protéger vos données.

COOKIES
Ce site utilise des cookies pour son fonctionnement. Vous pouvez les gérer dans les paramètres de votre navigateur.`
  },

  cgv: {
    auto_entrepreneur: `CONDITIONS GÉNÉRALES DE VENTE

Dernière mise à jour : [Date]

ARTICLE 1 - OBJET
Les présentes Conditions Générales de Vente (CGV) régissent les ventes de formations en ligne proposées par [Votre nom], auto-entrepreneur.

ARTICLE 2 - IDENTIFICATION DU VENDEUR
[Votre prénom et nom]
Auto-entrepreneur
Adresse : [Votre adresse]
SIRET : [Numéro SIRET]
Email : [votre@email.com]

ARTICLE 3 - PRODUITS ET SERVICES
Les formations proposées sont des contenus numériques accessibles en ligne. Le contenu détaillé de chaque formation est présenté sur la page de vente correspondante.

ARTICLE 4 - PRIX
Les prix sont indiqués en euros.
En tant qu'auto-entrepreneur non assujetti à la TVA (article 293 B du CGI), les prix affichés sont nets.
Les prix peuvent être modifiés à tout moment, mais le prix applicable est celui en vigueur au moment de la commande.

ARTICLE 5 - COMMANDE ET PAIEMENT
La commande est validée après :
1. Acceptation des présentes CGV
2. Paiement intégral du prix

Le paiement s'effectue par carte bancaire via notre plateforme sécurisée Stripe.
Un email de confirmation est envoyé après validation du paiement.

ARTICLE 6 - ACCÈS À LA FORMATION
L'accès à la formation est accordé immédiatement après confirmation du paiement.
L'accès est personnel et non transférable.
Durée d'accès : [illimitée / X mois / X an(s)]

ARTICLE 7 - DROIT DE RÉTRACTATION
Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne peut être exercé pour les contenus numériques fournis sur un support immatériel dont l'exécution a commencé avec votre accord.

En acceptant ces CGV et en accédant à la formation, vous reconnaissez renoncer expressément à votre droit de rétractation.

[OPTION : Si vous proposez une garantie]
Toutefois, je vous offre une garantie "Satisfait ou remboursé" de [X] jours. Si la formation ne correspond pas à vos attentes, contactez-moi à [email] pour un remboursement intégral.

ARTICLE 8 - PROPRIÉTÉ INTELLECTUELLE
Le contenu des formations (vidéos, textes, documents) est protégé par le droit d'auteur.
Il est strictement interdit de :
- Reproduire ou diffuser le contenu
- Partager vos identifiants d'accès
- Télécharger le contenu pour le redistribuer

Tout manquement entraînera la suspension immédiate de l'accès sans remboursement.

ARTICLE 9 - RESPONSABILITÉ
Je m'engage à fournir un contenu de qualité. Cependant, les résultats dépendent de votre implication personnelle. Je ne garantis pas de résultats spécifiques.

ARTICLE 10 - DONNÉES PERSONNELLES
Vos données sont traitées conformément à notre Politique de Confidentialité.

ARTICLE 11 - LITIGES
En cas de litige, une solution amiable sera recherchée. À défaut, les tribunaux français seront compétents.

Vous pouvez également recourir au médiateur de la consommation : [coordonnées du médiateur]

ARTICLE 12 - ACCEPTATION
La validation de votre commande implique l'acceptation sans réserve des présentes CGV.`,

    sarl: `CONDITIONS GÉNÉRALES DE VENTE

Applicables à compter du [Date]

PRÉAMBULE
Les présentes Conditions Générales de Vente (ci-après "CGV") s'appliquent à toutes les ventes de formations en ligne conclues sur le site [URL] exploité par la société [Nom de la SARL].

ARTICLE 1 - IDENTIFICATION DU VENDEUR
[Nom de la SARL]
Société à Responsabilité Limitée au capital de [montant] €
Siège social : [Adresse]
SIRET : [Numéro]
RCS : [Ville] B [Numéro]
TVA intracommunautaire : FR [XX] [SIREN]
Email : [contact@entreprise.com]
Téléphone : [Numéro]

ARTICLE 2 - CHAMP D'APPLICATION
Les présentes CGV régissent exclusivement les ventes de formations en ligne réalisées sur notre plateforme. Toute commande implique l'acceptation sans réserve des présentes CGV.

ARTICLE 3 - PRODUITS
Les formations proposées sont des contenus pédagogiques numériques. Leurs caractéristiques essentielles sont présentées sur chaque page de vente.

Nous nous réservons le droit de modifier le contenu des formations pour les améliorer ou les mettre à jour.

ARTICLE 4 - TARIFS
Les prix sont indiqués en euros, toutes taxes comprises (TTC).
TVA applicable : [20% / Autre taux / Exonération - préciser la situation]

Les tarifs peuvent être révisés à tout moment. Les formations sont facturées sur la base des tarifs en vigueur au moment de la validation de la commande.

ARTICLE 5 - COMMANDE
5.1 Processus de commande :
1. Sélection de la formation
2. Création de compte ou connexion
3. Validation des CGV
4. Paiement sécurisé
5. Confirmation par email

5.2 La commande devient définitive après encaissement du paiement.

ARTICLE 6 - MODALITÉS DE PAIEMENT
Le paiement s'effectue en ligne par carte bancaire via notre prestataire de paiement sécurisé (Stripe).

Les paiements en plusieurs fois peuvent être proposés selon les formations. Les conditions sont précisées sur la page de vente.

ARTICLE 7 - ACCÈS ET LIVRAISON
L'accès à la formation est délivré immédiatement après confirmation du paiement.
Un email contenant les informations de connexion est envoyé automatiquement.

Durée d'accès : [préciser la durée]

ARTICLE 8 - DROIT DE RÉTRACTATION
Conformément à l'article L221-28, 13° du Code de la consommation, le droit de rétractation ne s'applique pas aux contenus numériques fournis sur un support immatériel dont l'exécution a commencé avec l'accord du consommateur.

En validant votre commande, vous acceptez que l'exécution commence immédiatement et renoncez expressément à votre droit de rétractation.

[OPTION GARANTIE]
Nous offrons néanmoins une garantie "Satisfait ou remboursé" de [X] jours à compter de l'achat. Pour en bénéficier, contactez notre service client à [email].

ARTICLE 9 - PROPRIÉTÉ INTELLECTUELLE
L'ensemble des contenus des formations est protégé par les droits de propriété intellectuelle.

L'acheteur bénéficie d'un droit d'utilisation personnel et non exclusif. Sont interdits :
- La reproduction totale ou partielle
- La diffusion à des tiers
- Le partage des identifiants de connexion
- L'utilisation à des fins commerciales

Toute violation entraîne la résiliation immédiate de l'accès sans remboursement et peut donner lieu à des poursuites.

ARTICLE 10 - RESPONSABILITÉ
10.1 Nos engagements :
- Fournir un contenu de qualité professionnelle
- Assurer l'accessibilité de la plateforme
- Répondre aux demandes de support

10.2 Limitations :
- Les résultats dépendent de l'implication personnelle de l'apprenant
- Nous ne garantissons pas de résultats spécifiques
- Notre responsabilité est limitée au montant de la formation

ARTICLE 11 - DONNÉES PERSONNELLES
Les données personnelles sont traitées conformément à notre Politique de Confidentialité accessible sur notre site.

ARTICLE 12 - MÉDIATION
En cas de litige, vous pouvez recourir gratuitement au médiateur de la consommation :
[Nom et coordonnées du médiateur]
Site web : [URL du médiateur]

ARTICLE 13 - DROIT APPLICABLE
Les présentes CGV sont soumises au droit français. En cas de litige, les tribunaux de [Ville du siège] seront compétents.

ARTICLE 14 - MODIFICATION DES CGV
Nous nous réservons le droit de modifier les présentes CGV. Les conditions applicables sont celles en vigueur à la date de la commande.`,

    sas: `CONDITIONS GÉNÉRALES DE VENTE

En vigueur à compter du [Date]

PRÉAMBULE
Les présentes Conditions Générales de Vente (CGV) définissent les droits et obligations des parties dans le cadre de la vente de formations en ligne par [Nom de la SAS].

Toute commande implique l'acceptation pleine et entière des présentes CGV.

ARTICLE 1 - DÉFINITIONS
- "Vendeur" : [Nom de la SAS], société par actions simplifiée
- "Client" : toute personne physique ou morale effectuant un achat
- "Formation" : contenu pédagogique numérique commercialisé
- "Plateforme" : site web [URL]

ARTICLE 2 - IDENTIFICATION DU VENDEUR
[Nom de la SAS]
SAS au capital de [montant] €
Siège social : [Adresse]
RCS [Ville] [Numéro]
SIRET : [Numéro]
TVA : FR [XX] [SIREN]
Contact : [contact@entreprise.com]

ARTICLE 3 - OBJET
Les présentes CGV régissent les conditions de vente des formations en ligne proposées sur notre plateforme.

ARTICLE 4 - CARACTÉRISTIQUES DES FORMATIONS
Les formations sont des programmes de contenus numériques (vidéos, textes, exercices, ressources téléchargeables) accessibles en ligne.

Les caractéristiques essentielles sont décrites sur chaque page de présentation. Le contenu peut être mis à jour pour amélioration.

ARTICLE 5 - PRIX ET FACTURATION
5.1 Prix
Les prix sont exprimés en euros TTC. La TVA applicable est de [20% / taux réduit / non applicable - à préciser].

Les prix peuvent être modifiés à tout moment. Le prix applicable est celui affiché lors de la validation de la commande.

5.2 Facturation
Une facture est émise et transmise par email après chaque achat.

ARTICLE 6 - PROCESSUS DE COMMANDE
6.1 Étapes :
1. Sélection de la formation
2. Identification/création de compte
3. Acceptation des CGV
4. Paiement
5. Confirmation de commande

6.2 La vente est conclue à la réception du paiement.

ARTICLE 7 - PAIEMENT
7.1 Moyens de paiement acceptés :
- Carte bancaire (Visa, Mastercard, American Express)
- Facilités de paiement selon les offres

7.2 Sécurité
Les paiements sont sécurisés par notre prestataire [Stripe/autre] certifié PCI-DSS.

ARTICLE 8 - ACCÈS À LA FORMATION
8.1 Délivrance
L'accès est activé automatiquement après confirmation du paiement.

8.2 Durée
L'accès est accordé pour une durée de [X mois/ans / illimitée].

8.3 Conditions d'accès
L'accès est personnel, non cessible et non transférable.

ARTICLE 9 - DROIT DE RÉTRACTATION
9.1 Exclusion légale
Conformément à l'article L221-28, 13° du Code de la consommation, les contenus numériques fournis sur un support immatériel sont exclus du droit de rétractation dès lors que leur exécution a commencé avec l'accord du consommateur.

9.2 Renonciation
En passant commande et en cochant la case prévue à cet effet, le Client :
- Demande l'accès immédiat à la formation
- Reconnaît être informé de la perte du droit de rétractation
- Renonce expressément à ce droit

9.3 Garantie commerciale
Nonobstant ce qui précède, nous offrons une garantie "Satisfait ou Remboursé" de [X] jours permettant d'obtenir un remboursement intégral sur simple demande à [email].

ARTICLE 10 - PROPRIÉTÉ INTELLECTUELLE
10.1 Droits
L'intégralité des contenus est protégée par le droit d'auteur et reste notre propriété exclusive.

10.2 Licence
Le Client bénéficie d'une licence d'utilisation personnelle, non exclusive et non transférable.

10.3 Interdictions
Sont strictement interdits :
- Toute reproduction ou copie
- Le partage ou la revente
- L'enregistrement des contenus
- Le partage des identifiants

10.4 Sanctions
Toute violation entraîne la suspension immédiate de l'accès sans remboursement et expose à des poursuites.

ARTICLE 11 - RESPONSABILITÉ
11.1 Engagements du Vendeur
Nous nous engageons à :
- Fournir des contenus de qualité professionnelle
- Maintenir l'accessibilité de la plateforme
- Assurer un support client réactif

11.2 Limitation
- Les formations fournissent des connaissances et méthodes
- Les résultats dépendent de l'implication du Client
- Notre responsabilité est limitée au prix de la formation

ARTICLE 12 - FORCE MAJEURE
Aucune partie ne sera tenue responsable en cas de force majeure au sens de l'article 1218 du Code civil.

ARTICLE 13 - PROTECTION DES DONNÉES
Le traitement des données personnelles est décrit dans notre Politique de Confidentialité.

ARTICLE 14 - RÉCLAMATIONS ET MÉDIATION
14.1 Service client
Pour toute réclamation : [contact@entreprise.com]

14.2 Médiation
En cas de litige non résolu, vous pouvez recourir au médiateur de la consommation :
[Nom et coordonnées du médiateur désigné]

14.3 Plateforme européenne
Plateforme de règlement en ligne des litiges : https://ec.europa.eu/consumers/odr

ARTICLE 15 - DROIT APPLICABLE - JURIDICTION
Les présentes CGV sont soumises au droit français.
En cas de litige, compétence est attribuée aux tribunaux de [Ville].

ARTICLE 16 - DISPOSITIONS DIVERSES
La nullité d'une clause n'affecte pas la validité des autres dispositions.
Les présentes CGV prévalent sur tout autre document.`,

    eurl: `CONDITIONS GÉNÉRALES DE VENTE

Date d'effet : [Date]

ARTICLE 1 - VENDEUR
[Nom de l'EURL]
EURL au capital de [montant] €
[Adresse]
SIRET : [Numéro]
RCS : [Ville] [Numéro]
TVA : [Numéro ou mention "Non assujetti"]
Email : [contact@entreprise.com]

ARTICLE 2 - OBJET
Les présentes CGV régissent les ventes de formations en ligne.

ARTICLE 3 - PRIX
Prix en euros TTC. [Mention TVA applicable ou non]

ARTICLE 4 - COMMANDE ET PAIEMENT
La commande est confirmée après paiement intégral par carte bancaire.

ARTICLE 5 - ACCÈS
Accès immédiat après paiement.
Durée : [préciser]
Usage personnel uniquement.

ARTICLE 6 - RÉTRACTATION
Pas de droit de rétractation pour les contenus numériques dont l'accès a commencé (art. L221-28 Code de la consommation).

[Si garantie :]
Garantie "Satisfait ou remboursé" de [X] jours.

ARTICLE 7 - PROPRIÉTÉ INTELLECTUELLE
Contenus protégés. Reproduction et partage interdits.

ARTICLE 8 - RESPONSABILITÉ
Résultats non garantis. Responsabilité limitée au prix payé.

ARTICLE 9 - DONNÉES PERSONNELLES
Traitement conforme à notre Politique de Confidentialité.

ARTICLE 10 - LITIGES
Médiation : [coordonnées du médiateur]
Droit français applicable.
Tribunaux de [Ville] compétents.`,

    association: `CONDITIONS GÉNÉRALES DE VENTE

Applicables aux formations de l'association [Nom]

ARTICLE 1 - ORGANISATEUR
[Nom de l'association]
Association loi 1901
Siège : [Adresse]
RNA : [Numéro]
Email : [contact@association.org]

ARTICLE 2 - OBJET
Les présentes CGV régissent la vente des formations proposées par l'association.

ARTICLE 3 - TARIFS
Les prix sont indiqués en euros.
[Si TVA applicable] TVA : [taux]%
[Si non assujetti] L'association n'est pas assujettie à la TVA.

ARTICLE 4 - INSCRIPTION ET PAIEMENT
L'inscription est validée après réception du paiement complet.
Moyens de paiement acceptés : carte bancaire, virement.

ARTICLE 5 - ACCÈS AUX FORMATIONS
L'accès est accordé dès confirmation du paiement.
Durée d'accès : [préciser]

ARTICLE 6 - DROIT DE RÉTRACTATION
Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux contenus numériques non fournis sur un support matériel dont l'exécution a commencé.

En vous inscrivant, vous acceptez que l'accès à la formation débute immédiatement et renoncez à votre droit de rétractation.

[Si politique d'annulation :]
Annulation possible jusqu'à [X] jours avant le début, remboursement de [X]%.

ARTICLE 7 - PROPRIÉTÉ INTELLECTUELLE
Les contenus pédagogiques sont la propriété de l'association.
Toute reproduction est interdite sans autorisation.

ARTICLE 8 - RESPONSABILITÉ
L'association s'engage à fournir une formation de qualité.
Les résultats dépendent de l'implication des participants.

ARTICLE 9 - DONNÉES PERSONNELLES
Vos données sont traitées conformément à notre Politique de Confidentialité et au RGPD.

ARTICLE 10 - LITIGES
Tout différend sera soumis aux tribunaux compétents.
Médiation : [coordonnées si applicable]`
  }
};

const LEGAL_PAGE_CONFIG: Record<LegalPageType, { 
  label: string; 
  icon: React.ComponentType<any>; 
  description: string;
  requiredFields: string[];
}> = {
  mentions_legales: {
    label: "Mentions Légales",
    icon: FileText,
    description: "Informations obligatoires sur votre entreprise",
    requiredFields: ["Raison sociale", "Adresse", "SIRET", "Hébergeur"]
  },
  politique_confidentialite: {
    label: "Politique de Confidentialité",
    icon: Shield,
    description: "Collecte et traitement des données (RGPD)",
    requiredFields: ["Données collectées", "Finalité", "Droits", "Contact"]
  },
  cgv: {
    label: "Conditions Générales de Vente",
    icon: Scale,
    description: "Conditions d'achat et de remboursement",
    requiredFields: ["Prix", "Paiement", "Rétractation", "Garantie"]
  }
};

export default function LegalPages() {
  const { organizationId, isLoading: orgLoading } = useStudioContext();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<LegalPageType>('mentions_legales');
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [localData, setLocalData] = useState<Record<LegalPageType, LegalPageData>>({
    mentions_legales: { title: 'Mentions Légales', content: '' },
    politique_confidentialite: { title: 'Politique de Confidentialité', content: '' },
    cgv: { title: 'Conditions Générales de Vente', content: '' }
  });
  const [hasChanges, setHasChanges] = useState<Record<LegalPageType, boolean>>({
    mentions_legales: false,
    politique_confidentialite: false,
    cgv: false
  });

  // Fetch existing legal pages
  const { data: existingPages, isLoading } = useQuery({
    queryKey: ['legal-pages-studio', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('legal_pages')
        .select('*')
        .eq('organization_id', organizationId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Initialize local data when fetched
  useEffect(() => {
    if (existingPages) {
      const newData = { ...localData };
      existingPages.forEach((page) => {
        const pageType = page.type as LegalPageType;
        newData[pageType] = {
          title: page.title,
          content: page.content
        };
      });
      setLocalData(newData);
    }
  }, [existingPages]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (type: LegalPageType) => {
      if (!organizationId) throw new Error('Organization required');

      const { error } = await supabase
        .from('legal_pages')
        .upsert({
          organization_id: organizationId,
          type,
          title: localData[type].title,
          content: localData[type].content,
        }, { onConflict: 'organization_id,type' });

      if (error) throw error;
    },
    onSuccess: (_, type) => {
      toast.success(`${LEGAL_PAGE_CONFIG[type].label} sauvegardées !`);
      setHasChanges(prev => ({ ...prev, [type]: false }));
      queryClient.invalidateQueries({ queryKey: ['legal-pages-studio', organizationId] });
    },
    onError: () => {
      toast.error('Erreur lors de la sauvegarde');
    },
  });

  const updateField = (type: LegalPageType, field: 'title' | 'content', value: string) => {
    setLocalData(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
    setHasChanges(prev => ({ ...prev, [type]: true }));
  };

  const applyTemplate = (businessType: BusinessType) => {
    const template = LEGAL_TEMPLATES[activeTab][businessType];
    setLocalData(prev => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], content: template }
    }));
    setHasChanges(prev => ({ ...prev, [activeTab]: true }));
    setTemplateDialogOpen(false);
    toast.success(`Modèle "${BUSINESS_TYPES[businessType].label}" appliqué. N'oubliez pas de personnaliser les informations entre [crochets].`);
  };

  const getPageStatus = (type: LegalPageType): 'empty' | 'incomplete' | 'complete' => {
    const content = localData[type].content;
    if (!content || content.trim().length === 0) return 'empty';
    if (content.length < 200) return 'incomplete';
    return 'complete';
  };

  if (orgLoading || isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Pages Légales</h1>
        <p className="text-muted-foreground mt-1">
          Gérez vos documents légaux. Ils seront automatiquement liés à toutes vos landing pages.
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.entries(LEGAL_PAGE_CONFIG) as [LegalPageType, typeof LEGAL_PAGE_CONFIG[LegalPageType]][]).map(([type, config]) => {
          const status = getPageStatus(type);
          const Icon = config.icon;
          
          return (
            <Card 
              key={type}
              className={`cursor-pointer transition-all hover:shadow-md ${activeTab === type ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setActiveTab(type)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      status === 'complete' ? 'bg-green-100' : 
                      status === 'incomplete' ? 'bg-amber-100' : 'bg-slate-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        status === 'complete' ? 'text-green-600' : 
                        status === 'incomplete' ? 'text-amber-600' : 'text-slate-400'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{config.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {status === 'complete' ? 'Configuré' : 
                         status === 'incomplete' ? 'À compléter' : 'Non configuré'}
                      </p>
                    </div>
                  </div>
                  {status === 'complete' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : status === 'incomplete' ? (
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Editor */}
      <Card>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LegalPageType)}>
          <div className="p-4 pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b">
            <TabsList className="grid w-full sm:w-auto grid-cols-3">
              <TabsTrigger value="mentions_legales" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Mentions</span>
              </TabsTrigger>
              <TabsTrigger value="politique_confidentialite" className="gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Confidentialité</span>
              </TabsTrigger>
              <TabsTrigger value="cgv" className="gap-2">
                <Scale className="h-4 w-4" />
                <span className="hidden sm:inline">CGV</span>
              </TabsTrigger>
            </TabsList>

            {/* Template Button */}
            <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Utiliser un modèle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Choisir un modèle</DialogTitle>
                  <DialogDescription>
                    Sélectionnez votre structure juridique pour obtenir un modèle adapté de {LEGAL_PAGE_CONFIG[activeTab].label.toLowerCase()}.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-4">
                  {(Object.entries(BUSINESS_TYPES) as [BusinessType, BusinessTemplate][]).map(([type, config]) => {
                    const Icon = config.icon;
                    return (
                      <Button
                        key={type}
                        variant="outline"
                        className="h-auto p-4 justify-start gap-4"
                        onClick={() => applyTemplate(type)}
                      >
                        <div className="p-2 rounded-lg bg-slate-100">
                          <Icon className="h-5 w-5 text-slate-600" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{config.label}</p>
                          <p className="text-xs text-muted-foreground">{config.description}</p>
                        </div>
                      </Button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Les informations entre [crochets] devront être personnalisées avec vos données.
                </p>
              </DialogContent>
            </Dialog>
          </div>

          {(Object.entries(LEGAL_PAGE_CONFIG) as [LegalPageType, typeof LEGAL_PAGE_CONFIG[LegalPageType]][]).map(([type, config]) => (
            <TabsContent key={type} value={type} className="m-0">
              <CardContent className="pt-6 space-y-6">
                {/* Description */}
                <div className="p-4 rounded-lg bg-slate-50 border">
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground">Éléments recommandés :</span>
                    {config.requiredFields.map((field, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label>Titre de la page</Label>
                  <Input
                    value={localData[type].title}
                    onChange={(e) => updateField(type, 'title', e.target.value)}
                    placeholder={config.label}
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Contenu</Label>
                    <span className="text-xs text-muted-foreground">
                      {localData[type].content.length} caractères
                    </span>
                  </div>
                  <Textarea
                    value={localData[type].content}
                    onChange={(e) => updateField(type, 'content', e.target.value)}
                    placeholder="Utilisez le bouton 'Utiliser un modèle' pour démarrer avec un modèle pré-rempli adapté à votre structure juridique."
                    rows={16}
                    className="font-mono text-sm"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {hasChanges[type] ? (
                      <span className="text-amber-600">• Modifications non sauvegardées</span>
                    ) : (
                      <span className="text-green-600">✓ À jour</span>
                    )}
                  </p>
                  <Button 
                    onClick={() => saveMutation.mutate(type)}
                    disabled={saveMutation.isPending || !hasChanges[type]}
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Sauvegarder
                  </Button>
                </div>
              </CardContent>
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <ExternalLink className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-900">Liens automatiques</p>
              <p className="text-sm text-blue-700 mt-1">
                Ces pages légales sont automatiquement accessibles depuis le pied de page de toutes vos landing pages. 
                Les visiteurs pourront y accéder via les liens "Mentions légales", "Politique de confidentialité" et "CGV".
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
