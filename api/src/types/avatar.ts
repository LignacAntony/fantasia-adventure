export const AVATAR_IDS = [
  "elfe",
  "nain",
  "humain",
  "gobelin",
  "orc",
  "mage",
] as const;

export type AvatarId = (typeof AVATAR_IDS)[number];

export interface AvatarData {
  id: AvatarId;
  name: string;
  archetype: string;
  advantage: string;
  disadvantage: string;
  /** Injected into the AI system prompt for this avatar */
  systemPrompt: string;
}

export const AVATARS: Record<AvatarId, AvatarData> = {
  elfe: {
    id: "elfe",
    name: "Elfe",
    archetype: "Archer / éclaireur",
    advantage: "Options de perception et de tir à distance renforcées",
    disadvantage: "Vulnérable en combat rapproché ou en force brute",
    systemPrompt:
      "Ce joueur est un Elfe archer-éclaireur. Propose-lui des actions liées à la perception, le tir à distance, la furtivité et la nature. Évite les actions de corps à corps direct.",
  },
  nain: {
    id: "nain",
    name: "Nain",
    archetype: "Guerrier / forgeron",
    advantage: "Excelle en résistance, combat physique et artisanat",
    disadvantage: "Désavantagé en discrétion et agilité",
    systemPrompt:
      "Ce joueur est un Nain guerrier-forgeron. Propose-lui des actions de combat rapproché, résistance physique, travail du métal et robustesse. Évite les actions de discrétion ou d'agilité.",
  },
  humain: {
    id: "humain",
    name: "Humain",
    archetype: "Diplomate / polyvalent",
    advantage: "Négociation et persuasion renforcées, adaptabilité",
    disadvantage: "Pas de spécialité marquée, surclassé par les experts",
    systemPrompt:
      "Ce joueur est un Humain diplomate polyvalent. Propose-lui des actions variées avec une emphase sur la négociation, la persuasion et l'adaptabilité. Il peut tenter n'importe quelle approche sans excellence particulière.",
  },
  gobelin: {
    id: "gobelin",
    name: "Gobelin",
    archetype: "Voleur / éclaireur",
    advantage: "Infiltration, ruse et sabotage très efficaces",
    disadvantage: "Mal perçu par les PNJ, options diplomatiques réduites",
    systemPrompt:
      "Ce joueur est un Gobelin voleur-éclaireur. Propose-lui des actions de vol, sabotage, infiltration et ruse. Les PNJ lui font peu confiance, évite les options diplomatiques directes.",
  },
  orc: {
    id: "orc",
    name: "Orc",
    archetype: "Berserker / tank",
    advantage: "Force brute et intimidation",
    disadvantage: "Impulsivité pouvant créer des complications",
    systemPrompt:
      "Ce joueur est un Orc berserker. Propose-lui des actions de force brute, intimidation et combat frontal. Son impulsivité peut créer des situations inattendues.",
  },
  mage: {
    id: "mage",
    name: "Mage",
    archetype: "Lanceur de sorts",
    advantage: "Accès à des solutions magiques uniques",
    disadvantage: "Fragilité physique",
    systemPrompt:
      "Ce joueur est un Mage. Propose-lui des actions magiques créatives et uniques. Il est physiquement fragile et doit éviter le contact direct.",
  },
};
