import { FeatureCard } from "@/components/feature-card";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { BookOpen, Crown, Repeat, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <Navbar
        brand="FantasIA Adventure"
        items={[
          { label: "Accueil", href: "/" },
          { label: "Créer une partie", href: "#" },
          { label: "Rejoindre", href: "#" },
        ]}
      />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[#080e20]" />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139, 92, 246, 0.35), transparent), radial-gradient(ellipse 60% 40% at 80% 50%, rgba(99, 102, 241, 0.2), transparent), radial-gradient(ellipse 50% 30% at 20% 80%, rgba(168, 85, 247, 0.15), transparent)",
        }}
      />
      <div className="relative z-10 flex min-h-[calc(100vh-64px)] flex-col">
        <main className="flex flex-1 w-full flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center w-full">
            <h1 className="bg-linear-to-r from-purple-500 via-pink-500 to-amber-400 bg-clip-text text-center text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-7xl">
              FantasIA Adventure
            </h1>
            <p className="mt-3 text-center text-base text-white/95 sm:text-lg md:text-2xl">
              L&apos;expérience collaborative de fiction interactive <br />{" "}
              menée par une IA
            </p>
          </div>
          <div className="flex flex-row gap-8 items-center justify-center w-full mt-16">
            <Button variant="purple" size="xl">
              <Crown className="size-4" />
              Créer une partie
            </Button>
            <Button variant="outline" size="xl">
              Rejoindre
            </Button>
          </div>
          <div className="mt-16 flex flex-wrap items-stretch justify-center gap-6 px-4">
            <FeatureCard
              icon={<Users className="size-6" />}
              title="1-6 Joueurs"
              description="Coopérez avec vos amis en temps réel."
              variant="dark"
              iconClassName="text-purple-400"
            />
            <FeatureCard
              icon={<BookOpen className="size-6" />}
              title="IA Maître du Jeu"
              description="Une histoire unique générée selon vos choix."
              variant="dark"
              iconClassName="text-purple-400"
            />
            <FeatureCard
              icon={<Repeat className="size-6" />}
              title="Rejouabilité"
              description="Chaque session est une nouvelle épopée."
              variant="dark"
              iconClassName="text-purple-400"
            />
          </div>
        </main>
        <Footer
          brand="FantasIA Adventure"
          links={[
            { label: "Mentions légales", href: "#" },
            { label: "CGU", href: "#" },
            { label: "Contact", href: "#" },
          ]}
          copyright="© 2026 FantasIA Adventure"
        />
      </div>
    </div>
  );
}
