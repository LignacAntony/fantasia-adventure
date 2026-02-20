"use client";

import { BadgeClasse } from "@/components/badge-classe";
import { CharacterCard } from "@/components/character-card";
import { ChoiceCard } from "@/components/choice-card";
import { ChatHistory } from "@/components/chat-history";
import { FeatureCard } from "@/components/feature-card";
import { AlertCircleIcon, Users, WandSparkles } from "lucide-react";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        )}
      </div>
      <div className="rounded-lg border bg-card p-6">{children}</div>
    </section>
  );
}

export default function DesignSystemGamePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl space-y-16 px-6 py-12">
        <header>
          <h1 className="text-4xl font-bold tracking-tight">
            Design System Game
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Composants et patterns pour le jeu.
          </p>
        </header>

        <Section
          title="Badge Classe"
          description="Icône de classe dans un badge (style character-card) : variant sword (bleu), bow (vert), skull (rouge), shield (jaune), wand (violet), slice (orange). Couleurs theme-* du thème."
        >
          <div className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-900 p-4">
            <BadgeClasse variant="sword" />
            <BadgeClasse variant="bow" />
            <BadgeClasse variant="skull" />
            <BadgeClasse variant="shield" />
            <BadgeClasse variant="wand" />
            <BadgeClasse variant="slice" />
          </div>
        </Section>

        <Section
          title="Choice Card"
          description="Carte de choix : icon, title, riskLabel, riskVariant (variants Badge : yellow, green, blue, red, purple, orange), description, avatars. selected pour la bordure violette + glow."
        >
          <div className="max-w-2xl space-y-3 rounded-xl bg-slate-900 p-4">
            <ChoiceCard
              title="Utiliser la magie de l'air"
              riskLabel="Risque Faible"
              riskVariant="green"
              description="Demander au Mage de canaliser un courant ascendant pour porter le groupe. (Consomme du Mana)"
              avatars={[{ initials: "BB", className: "bg-violet-600" }]}
            />
            <ChoiceCard
              title="Utiliser la magie de l'air"
              riskLabel="Risque Faible"
              riskVariant="yellow"
              description="Demander au Mage de canaliser un courant ascendant pour porter le groupe. (Consomme du Mana)"
              avatars={[{ initials: "BB", className: "bg-violet-600" }]}
              selected
            />
          </div>
        </Section>

        <Section
          title="Character Card"
          description="Carte personnage : classe (BadgeClasse) ou icon, roleTag, title, description, advantages, weaknesses."
        >
          <div className="flex flex-wrap gap-4">
            <CharacterCard
              classe="sword"
              roleTag="TANK / DPS"
              title="Guerrier humain"
              description="Un combattant polyvalent capable de s'adapter à toutes les situations de combat."
              advantages={["Maîtrise", "Tactique"]}
              weaknesses={["Vulnérable à la magie"]}
              className="min-w-[320px] max-w-[380px]"
            />
          </div>
        </Section>

        <Section
          title="Chat History"
          description="Un seul message : senderName, senderIcon, watermarkIcon. Contenu en blockquote serif italique."
        >
          <div className="max-w-2xl">
            <ChatHistory senderName="Maître du jeu (IA)">
              &quot;Le vent hurle entre les parois de la faille. Devant vous,
              les restes d&apos;un pont suspendu oscillent dangereusement. Des
              ronces d&apos;un violet sombre semblent ramper le long des cordes,
              comme si elles attendaient votre passage. L&apos;énergie ici est
              instable ; un faux pas pourrait vous précipiter dans les
              profondeurs éthérées.&quot;
            </ChatHistory>
          </div>
        </Section>

        <Section
          title="Feature Card"
          description="Carte réutilisable : icon (ReactNode), title, description, iconClassName (couleur Tailwind). variant: default | dark (fond sombre violet/bleu)."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FeatureCard
              icon={<Users />}
              title="1-6 Joueurs"
              description="Coopérez avec vos amis en temps réel."
              variant="dark"
            />
            <FeatureCard
              icon={<AlertCircleIcon />}
              title="Titre"
              description="Description optionnelle. S'adapte au thème avec variant default."
              variant="default"
            />
            <FeatureCard
              icon={<Users />}
              iconClassName="text-amber-400"
              title="Icône custom"
              description="Couleur d'icône personnalisée via iconClassName."
              variant="dark"
            />
          </div>
        </Section>
      </div>
    </div>
  );
}
