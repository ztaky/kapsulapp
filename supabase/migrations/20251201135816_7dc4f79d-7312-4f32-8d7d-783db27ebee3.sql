-- Insert default email templates for transactional emails
INSERT INTO email_templates (name, email_type, subject, html_content, variables, is_default, is_active, organization_id)
VALUES 
-- Welcome Purchase Template
(
  'Bienvenue - Achat Formation',
  'welcome_purchase',
  'Bienvenue dans {{course_name}} ! 🎉',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, {{brand_color}} 0%, {{brand_color}}dd 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Bienvenue {{recipient_name}} ! 🎉</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Félicitations pour votre inscription à <strong>{{course_name}}</strong> !
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Vous pouvez dès maintenant accéder à votre formation et commencer votre apprentissage.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{course_url}}" style="display: inline-block; background-color: {{brand_color}}; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                      Accéder à ma formation
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                {{academy_name}}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["recipient_name", "course_name", "course_url", "academy_name", "brand_color"]'::jsonb,
  true,
  true,
  NULL
),

-- Invoice Template
(
  'Confirmation de Paiement',
  'invoice',
  'Confirmation de votre paiement - {{course_name}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background-color: {{brand_color}}; padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">✓ Paiement confirmé</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Bonjour {{recipient_name}},
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Nous avons bien reçu votre paiement. Voici le récapitulatif :
              </p>
              <table width="100%" style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 10px 20px; color: #6b7280;">Formation :</td>
                  <td style="padding: 10px 20px; color: #111827; font-weight: bold; text-align: right;">{{course_name}}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 20px; color: #6b7280;">Montant :</td>
                  <td style="padding: 10px 20px; color: #111827; font-weight: bold; text-align: right;">{{amount}} €</td>
                </tr>
                <tr>
                  <td style="padding: 10px 20px; color: #6b7280;">N° Transaction :</td>
                  <td style="padding: 10px 20px; color: #111827; font-size: 12px; text-align: right;">{{payment_id}}</td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{course_url}}" style="display: inline-block; background-color: {{brand_color}}; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                      Accéder à ma formation
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                {{academy_name}}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["recipient_name", "course_name", "course_url", "amount", "payment_id", "academy_name", "brand_color"]'::jsonb,
  true,
  true,
  NULL
),

-- Founder Welcome Template
(
  'Bienvenue Fondateur Kapsul',
  'founder_welcome',
  'Bienvenue dans la famille des Fondateurs Kapsul ! 🚀',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); padding: 50px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0 0 10px; font-size: 32px;">🎉 Félicitations !</h1>
              <p style="color: #fef3c7; margin: 0; font-size: 18px;">Vous êtes maintenant Fondateur Kapsul</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Bonjour {{recipient_name}},
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Merci infiniment pour votre confiance ! En rejoignant le programme Fondateur, vous faites partie des pionniers qui façonnent l''avenir de Kapsul.
              </p>
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 24px; margin: 30px 0;">
                <h3 style="color: #92400e; margin: 0 0 16px; font-size: 18px;">✨ Vos avantages exclusifs :</h3>
                <ul style="color: #78350f; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li>Accès à vie à toutes les fonctionnalités</li>
                  <li>Étudiants illimités</li>
                  <li>5000 crédits IA / mois</li>
                  <li>3000 emails / mois</li>
                  <li>Support prioritaire</li>
                  <li>Badge Fondateur exclusif</li>
                </ul>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{dashboard_url}}" style="display: inline-block; background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                      Accéder à mon dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #fffbeb; padding: 24px 40px; text-align: center;">
              <p style="color: #92400e; font-size: 14px; margin: 0;">
                Merci de faire partie de l''aventure Kapsul ! 💛
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["recipient_name", "dashboard_url"]'::jsonb,
  true,
  true,
  NULL
),

-- Coach Welcome Template
(
  'Bienvenue Coach',
  'coach_welcome',
  'Bienvenue sur Kapsul ! Créez votre première formation 🎓',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Bienvenue {{recipient_name}} ! 🎓</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Félicitations ! Votre académie <strong>{{academy_name}}</strong> est prête.
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Voici les prochaines étapes pour lancer votre première formation :
              </p>
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
                <div style="margin-bottom: 16px;">
                  <span style="display: inline-block; background-color: #d97706; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; margin-right: 12px;">1</span>
                  <span style="color: #374151;">Personnalisez votre branding</span>
                </div>
                <div style="margin-bottom: 16px;">
                  <span style="display: inline-block; background-color: #d97706; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; margin-right: 12px;">2</span>
                  <span style="color: #374151;">Créez votre première formation</span>
                </div>
                <div>
                  <span style="display: inline-block; background-color: #d97706; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; margin-right: 12px;">3</span>
                  <span style="color: #374151;">Générez votre landing page avec l''IA</span>
                </div>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{dashboard_url}}" style="display: inline-block; background-color: #d97706; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                      Accéder à mon studio
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                L''équipe Kapsul
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["recipient_name", "academy_name", "dashboard_url"]'::jsonb,
  true,
  true,
  NULL
),

-- Onboarding Day 1
(
  'Onboarding J+1 - Premiers pas',
  'onboarding_day_1',
  '{{recipient_name}}, prêt(e) à créer votre première formation ?',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background-color: #d97706; padding: 30px 40px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Jour 1 : Premiers pas 🚀</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Bonjour {{recipient_name}},
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Bienvenue sur Kapsul ! Aujourd''hui, concentrons-nous sur l''essentiel : <strong>créer votre première formation</strong>.
              </p>
              <div style="background-color: #fef3c7; border-left: 4px solid #d97706; padding: 16px 20px; margin: 24px 0;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  💡 <strong>Astuce :</strong> Commencez simple ! Une formation de 3-5 modules suffit pour démarrer.
                </p>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{dashboard_url}}" style="display: inline-block; background-color: #d97706; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                      Créer ma formation
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["recipient_name", "dashboard_url"]'::jsonb,
  true,
  true,
  NULL
),

-- Onboarding Day 3
(
  'Onboarding J+3 - Landing page IA',
  'onboarding_day_3',
  '{{recipient_name}}, générez votre landing page en 2 minutes ✨',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background-color: #d97706; padding: 30px 40px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Jour 3 : L''IA à votre service ✨</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Bonjour {{recipient_name}},
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Saviez-vous que Kapsul peut <strong>générer une landing page complète</strong> pour votre formation en quelques clics ?
              </p>
              <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="color: #166534; margin: 0 0 12px; font-weight: bold;">Ce que l''IA crée pour vous :</p>
                <ul style="color: #166534; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li>Titre accrocheur et sous-titres</li>
                  <li>Description de votre formation</li>
                  <li>Section témoignages</li>
                  <li>FAQ automatique</li>
                  <li>Boutons d''achat intégrés</li>
                </ul>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{dashboard_url}}" style="display: inline-block; background-color: #d97706; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                      Générer ma landing page
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["recipient_name", "dashboard_url"]'::jsonb,
  true,
  true,
  NULL
),

-- Onboarding Day 7
(
  'Onboarding J+7 - Fonctionnalités avancées',
  'onboarding_day_7',
  '{{recipient_name}}, découvrez les fonctionnalités avancées de Kapsul 🎯',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background-color: #d97706; padding: 30px 40px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Jour 7 : Allez plus loin 🎯</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Bonjour {{recipient_name}},
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Une semaine déjà ! Voici quelques fonctionnalités avancées pour booster votre académie :
              </p>
              <div style="margin: 24px 0;">
                <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                  <strong style="color: #d97706;">📧 Séquences emails</strong>
                  <p style="color: #6b7280; margin: 8px 0 0; font-size: 14px;">Automatisez vos emails de bienvenue et relances.</p>
                </div>
                <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                  <strong style="color: #d97706;">🤖 Assistant IA</strong>
                  <p style="color: #6b7280; margin: 8px 0 0; font-size: 14px;">Créez du contenu, des quiz et des outils interactifs.</p>
                </div>
                <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px;">
                  <strong style="color: #d97706;">📊 Analytics</strong>
                  <p style="color: #6b7280; margin: 8px 0 0; font-size: 14px;">Suivez les performances de vos formations.</p>
                </div>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{dashboard_url}}" style="display: inline-block; background-color: #d97706; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                      Explorer les fonctionnalités
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["recipient_name", "dashboard_url"]'::jsonb,
  true,
  true,
  NULL
);