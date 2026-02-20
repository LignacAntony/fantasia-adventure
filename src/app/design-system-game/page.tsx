"use client"

import { FeatureCard } from "@/components/feature-card"
import { AlertCircleIcon, Users } from "lucide-react"

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
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
  )
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
  )
}
