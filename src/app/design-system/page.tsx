"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircleIcon } from "lucide-react";

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

function VariableGrid({
  items,
}: {
  items: { name: string; usage?: string }[];
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ name, usage }) => (
        <div
          key={name}
          className="rounded-md border bg-muted/30 px-3 py-2 font-mono text-sm"
        >
          <span className="text-foreground">{name}</span>
          {usage && (
            <span className="text-muted-foreground ml-1 text-xs">
              → {usage}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl space-y-16 px-6 py-12">
        <header>
          <h1 className="text-4xl font-bold tracking-tight">Design System</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Composants shadcn/ui et variables CSS du thème.
          </p>
        </header>

        {/* CSS Variables */}
        <Section
          title="Variables CSS (thème)"
          description="Variables définies dans :root et .dark (globals.css). Utilisables en Tailwind via les classes semantic (bg-background, text-primary, etc.)."
        >
          <div className="space-y-8">
            <div>
              <h3 className="mb-3 font-medium">Couleurs principales</h3>
              <VariableGrid
                items={[
                  { name: "--background", usage: "bg-background" },
                  { name: "--foreground", usage: "text-foreground" },
                  { name: "--card", usage: "bg-card" },
                  { name: "--card-foreground", usage: "text-card-foreground" },
                  { name: "--popover", usage: "bg-popover" },
                  {
                    name: "--popover-foreground",
                    usage: "text-popover-foreground",
                  },
                  { name: "--primary", usage: "bg-primary" },
                  {
                    name: "--primary-foreground",
                    usage: "text-primary-foreground",
                  },
                  { name: "--secondary", usage: "bg-secondary" },
                  {
                    name: "--secondary-foreground",
                    usage: "text-secondary-foreground",
                  },
                  { name: "--muted", usage: "bg-muted" },
                  {
                    name: "--muted-foreground",
                    usage: "text-muted-foreground",
                  },
                  { name: "--accent", usage: "bg-accent" },
                  {
                    name: "--accent-foreground",
                    usage: "text-accent-foreground",
                  },
                  { name: "--destructive", usage: "bg-destructive" },
                  { name: "--border", usage: "border-border" },
                  { name: "--input", usage: "champ formulaire" },
                  { name: "--ring", usage: "focus ring" },
                ]}
              />
            </div>
            <div>
              <h3 className="mb-3 font-medium">Radius (coins arrondis)</h3>
              <VariableGrid
                items={[
                  { name: "--radius", usage: "base" },
                  { name: "--radius-sm", usage: "radius-sm" },
                  { name: "--radius-md", usage: "radius-md" },
                  { name: "--radius-lg", usage: "radius-lg" },
                  { name: "--radius-xl", usage: "radius-xl" },
                  { name: "--radius-2xl", usage: "radius-2xl" },
                ]}
              />
            </div>
            <div>
              <h3 className="mb-3 font-medium">Charts & Sidebar</h3>
              <VariableGrid
                items={[
                  { name: "--chart-1" },
                  { name: "--chart-2" },
                  { name: "--chart-3" },
                  { name: "--chart-4" },
                  { name: "--chart-5" },
                  { name: "--sidebar" },
                  { name: "--sidebar-foreground" },
                  { name: "--sidebar-primary" },
                  { name: "--sidebar-accent" },
                  { name: "--sidebar-border" },
                  { name: "--sidebar-ring" },
                ]}
              />
            </div>
          </div>
        </Section>

        {/* Buttons */}
        <a
          className="text-4xl font-bold tracking-tight text-red-800 mb-4 block"
          target="_blank"
          href="https://lucide.dev/icons/"
        >
          --- Lucide Icons ---
        </a>
        <Section
          title="Button"
          description="variant: default | destructive | outline | secondary | ghost | link. size: default | xs | sm | lg | icon | icon-xs | icon-sm | icon-lg"
        >
          <div className="flex flex-wrap gap-3">
            <Button>Default</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button size="xs">XS</Button>
            <Button size="sm">SM</Button>
            <Button>Default</Button>
            <Button size="lg">LG</Button>
            <Button size="icon" aria-label="icon">
              +
            </Button>
            <Button size="icon-sm" aria-label="icon sm">
              +
            </Button>
          </div>
          <div className="mt-4">
            <Button disabled>Disabled</Button>
          </div>
          <p className="text-muted-foreground mt-6 text-sm font-medium">
            Variantes thème (variant: yellow | green | blue | red | purple |
            orange)
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="yellow">Yellow</Button>
            <Button variant="green">Green</Button>
            <Button variant="blue">Blue</Button>
            <Button variant="red">Red</Button>
            <Button variant="purple">Purple</Button>
            <Button variant="orange">Orange</Button>
          </div>
        </Section>

        {/* Badge */}
        <Section
          title="Badge"
          description="variant: default | secondary | destructive | outline | ghost | link | yellow | green | blue | red | purple | orange."
        >
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="ghost">Ghost</Badge>
            <Badge variant="link">Link</Badge>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge>12</Badge>
            <Badge variant="secondary">Nouveau</Badge>
            <Badge variant="outline">Beta</Badge>
          </div>
          <p className="text-muted-foreground mt-6 text-sm font-medium">
            Variantes thème (variant: yellow | green | blue | red | purple |
            orange)
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="yellow">Yellow</Badge>
            <Badge variant="green">Green</Badge>
            <Badge variant="blue">Blue</Badge>
            <Badge variant="red">Red</Badge>
            <Badge variant="purple">Purple</Badge>
            <Badge variant="orange">Orange</Badge>
          </div>
        </Section>

        {/* Button Group */}
        <Section
          title="Button Group"
          description="orientation: horizontal | vertical"
        >
          <ButtonGroup>
            <Button variant="outline">One</Button>
            <Button variant="outline">Two</Button>
            <Button variant="outline">Three</Button>
          </ButtonGroup>
          <div className="mt-4">
            <ButtonGroup orientation="vertical">
              <Button variant="outline">One</Button>
              <Button variant="outline">Two</Button>
              <Button variant="outline">Three</Button>
            </ButtonGroup>
          </div>
        </Section>

        {/* Input */}
        <Section
          title="Input"
          description="Champ texte avec états focus, disabled, aria-invalid"
        >
          <div className="grid gap-4 sm:max-w-sm">
            <div className="space-y-2">
              <Label htmlFor="input-demo">Label</Label>
              <Input id="input-demo" placeholder="Placeholder" />
            </div>
            <Input type="email" placeholder="email@example.com" />
            <Input disabled placeholder="Disabled" />
          </div>
        </Section>

        {/* Input Group */}
        <Section
          title="Input Group"
          description="Input avec addons (texte ou bouton) en inline-start | inline-end | block-start | block-end"
        >
          <div className="space-y-4 sm:max-w-sm">
            <InputGroup>
              <InputGroupAddon align="inline-start">https://</InputGroupAddon>
              <InputGroupInput placeholder="site.com" />
            </InputGroup>
            <InputGroup>
              <InputGroupInput placeholder="Rechercher" />
              <InputGroupAddon align="inline-end">
                <InputGroupButton variant="ghost" size="icon-xs" type="button">
                  ⌕
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </Section>

        {/* Textarea */}
        <Section title="Textarea">
          <Textarea
            placeholder="Écrivez votre message..."
            className="max-w-md"
          />
        </Section>

        {/* Label */}
        <Section title="Label">
          <div className="space-y-2">
            <Label htmlFor="label-demo">Nom</Label>
            <Input id="label-demo" placeholder="Associé via htmlFor" />
          </div>
        </Section>

        {/* Checkbox */}
        <Section title="Checkbox">
          <div className="flex items-center space-x-2">
            <Checkbox id="cb1" />
            <Label htmlFor="cb1">Accepter les conditions</Label>
          </div>
          <div className="mt-3 flex items-center space-x-2">
            <Checkbox id="cb2" defaultChecked />
            <Label htmlFor="cb2">Checked par défaut</Label>
          </div>
        </Section>

        {/* Radio Group */}
        <Section title="Radio Group">
          <RadioGroup defaultValue="option-one" className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option-one" id="r1" />
              <Label htmlFor="r1">Option 1</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option-two" id="r2" />
              <Label htmlFor="r2">Option 2</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option-three" id="r3" />
              <Label htmlFor="r3">Option 3</Label>
            </div>
          </RadioGroup>
        </Section>

        {/* Select */}
        <Section title="Select" description="SelectTrigger size: sm | default">
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Choisir..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a">Option A</SelectItem>
              <SelectItem value="b">Option B</SelectItem>
              <SelectItem value="c">Option C</SelectItem>
            </SelectContent>
          </Select>
        </Section>

        {/* Card */}
        <Section
          title="Card"
          description="Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction"
        >
          <Card className="max-w-sm">
            <CardHeader>
              <CardTitle>Titre de la carte</CardTitle>
              <CardDescription>Description optionnelle.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Contenu de la carte.</p>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button size="sm">Action</Button>
              <Button size="sm" variant="outline">
                Annuler
              </Button>
            </CardFooter>
          </Card>
        </Section>

        {/* Alert */}
        <Section title="Alert" description="variant: default | destructive">
          <div className="space-y-4">
            <Alert>
              <AlertCircleIcon className="size-4" />
              <AlertTitle>Info</AlertTitle>
              <AlertDescription>
                Message d&apos;information par défaut.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertCircleIcon className="size-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>
                Message d&apos;erreur ou avertissement.
              </AlertDescription>
            </Alert>
          </div>
        </Section>

        {/* Tabs */}
        <Section
          title="Tabs"
          description="TabsList variant: default | line. orientation: horizontal | vertical"
        >
          <Tabs defaultValue="tab1">
            <TabsList>
              <TabsTrigger value="tab1">Onglet 1</TabsTrigger>
              <TabsTrigger value="tab2">Onglet 2</TabsTrigger>
              <TabsTrigger value="tab3">Onglet 3</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1" className="rounded-md border p-4">
              Contenu de l&apos;onglet 1.
            </TabsContent>
            <TabsContent value="tab2" className="rounded-md border p-4">
              Contenu de l&apos;onglet 2.
            </TabsContent>
            <TabsContent value="tab3" className="rounded-md border p-4">
              Contenu de l&apos;onglet 3.
            </TabsContent>
          </Tabs>
          <div className="mt-6">
            <Tabs defaultValue="line1">
              <TabsList variant="line">
                <TabsTrigger value="line1">Line 1</TabsTrigger>
                <TabsTrigger value="line2">Line 2</TabsTrigger>
              </TabsList>
              <TabsContent value="line1" className="py-2">
                Style &quot;line&quot; (soulignement).
              </TabsContent>
              <TabsContent value="line2" className="py-2">
                Contenu line 2.
              </TabsContent>
            </Tabs>
          </div>
        </Section>

        {/* Progress */}
        <Section title="Progress" description="value: 0–100">
          <div className="space-y-4 max-w-md">
            <Progress value={33} />
            <Progress value={66} />
            <Progress value={100} />
          </div>
        </Section>

        {/* Skeleton */}
        <Section title="Skeleton" description="Placeholder de chargement">
          <div className="space-y-3 max-w-md">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </Section>

        {/* Spinner */}
        <Section title="Spinner">
          <div className="flex items-center gap-4">
            <Spinner className="size-4" />
            <Spinner className="size-6" />
            <Spinner className="size-8" />
          </div>
        </Section>

        {/* Avatar */}
        <Section
          title="Avatar"
          description="size: default | sm | lg. AvatarGroup pour grouper, AvatarBadge pour indicateur."
        >
          <div className="flex flex-wrap items-center gap-6">
            <Avatar size="sm">
              <AvatarImage src="https://github.com/shadcn.png" alt="sm" />
              <AvatarFallback>SM</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="default" />
              <AvatarFallback>DF</AvatarFallback>
            </Avatar>
            <Avatar size="lg">
              <AvatarFallback>LG</AvatarFallback>
            </Avatar>
            <AvatarGroup className="ml-4">
              <Avatar size="sm">
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
              <Avatar size="sm">
                <AvatarFallback>B</AvatarFallback>
              </Avatar>
              <Avatar size="sm">
                <AvatarFallback>C</AvatarFallback>
              </Avatar>
            </AvatarGroup>
          </div>
        </Section>

        {/* Separator */}
        <Section
          title="Separator"
          description="orientation: horizontal | vertical"
        >
          <div className="space-y-2">
            <p className="text-sm">Au-dessus</p>
            <Separator />
            <p className="text-sm">En dessous</p>
          </div>
          <div className="mt-4 flex h-8 items-center gap-2">
            <span className="text-sm">Left</span>
            <Separator orientation="vertical" className="h-full" />
            <span className="text-sm">Right</span>
          </div>
        </Section>

        {/* Scroll Area */}
        <Section title="Scroll Area">
          <ScrollArea className="h-32 w-48 rounded-md border p-4">
            <p className="text-sm">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris.
              Duis aute irure dolor in reprehenderit in voluptate velit esse
              cillum dolore eu fugiat nulla pariatur.
            </p>
          </ScrollArea>
        </Section>

        {/* Dialog */}
        <Section title="Dialog">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Ouvrir le dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Titre du dialog</DialogTitle>
                <DialogDescription>
                  Description optionnelle. Le dialog se ferme en cliquant à
                  l&apos;extérieur ou sur le bouton de fermeture.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Annuler</Button>
                </DialogClose>
                <Button>Confirmer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Section>

        {/* Sheet */}
        <Section
          title="Sheet"
          description="side: top | right | bottom | left. Panneau latéral coulissant."
        >
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Ouvrir le sheet (droite)</Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Titre</SheetTitle>
                <SheetDescription>Description du panneau.</SheetDescription>
              </SheetHeader>
              <p className="text-muted-foreground mt-4 text-sm">
                Contenu du sheet. Fermez avec le bouton X ou en cliquant à
                l&apos;extérieur.
              </p>
            </SheetContent>
          </Sheet>
        </Section>

        {/* Dropdown Menu */}
        <Section title="Dropdown Menu">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Menu déroulant</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profil</DropdownMenuItem>
              <DropdownMenuItem>Paramètres</DropdownMenuItem>
              <DropdownMenuItem variant="destructive">
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Section>

        {/* Hover Card */}
        <Section title="Hover Card" description="Infobulle au survol">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="link">Survolez-moi</Button>
            </HoverCardTrigger>
            <HoverCardContent>
              <p className="text-sm">
                Contenu de la hover card. S&apos;affiche au survol. align /
                sideOffset configurables.
              </p>
            </HoverCardContent>
          </HoverCard>
        </Section>
      </div>
    </div>
  );
}
