import type { BadgeClasseVariant } from "@/components/badge-classe";

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
  classe: BadgeClasseVariant;
}

export const AVATARS: Record<AvatarId, AvatarData> = {
  elfe: {
    id: "elfe",
    name: "Elfe",
    archetype: "Archer / éclaireur",
    advantage: "Perception et tir à distance renforcés",
    disadvantage: "Vulnérable en combat rapproché",
    classe: "bow",
  },
  nain: {
    id: "nain",
    name: "Nain",
    archetype: "Guerrier / forgeron",
    advantage: "Résistance, combat physique et artisanat",
    disadvantage: "Désavantagé en discrétion et agilité",
    classe: "sword",
  },
  humain: {
    id: "humain",
    name: "Humain",
    archetype: "Diplomate / polyvalent",
    advantage: "Négociation, persuasion et adaptabilité",
    disadvantage: "Pas de spécialité marquée",
    classe: "slice",
  },
  gobelin: {
    id: "gobelin",
    name: "Gobelin",
    archetype: "Voleur / éclaireur",
    advantage: "Infiltration, ruse et sabotage",
    disadvantage: "Mal perçu, options diplomatiques réduites",
    classe: "skull",
  },
  orc: {
    id: "orc",
    name: "Orc",
    archetype: "Berserker / tank",
    advantage: "Force brute et intimidation",
    disadvantage: "Impulsivité créant des complications",
    classe: "shield",
  },
  mage: {
    id: "mage",
    name: "Mage",
    archetype: "Lanceur de sorts",
    advantage: "Solutions magiques uniques",
    disadvantage: "Fragilité physique",
    classe: "wand",
  },
};
