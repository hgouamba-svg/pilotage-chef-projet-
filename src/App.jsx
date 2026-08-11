import React, { useState, useEffect, useCallback } from "react";
import { PhoneCall, TrendingUp, CheckCircle2, AlertTriangle, Copy, Trash2, Sparkles, ChevronRight, Download, ClipboardList, Heart, LogOut, Users, UserPlus, X, KeyRound, FileSpreadsheet } from "lucide-react";
import ExcelJS from "exceljs";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

// ---- Palette (aligned with the "Piloter une activité de 50 ETP" deck) ----
const NAVY = "#173A6B";
const VIOLET = "#3D2170";
const YELLOW = "#F0C230";
const SKY = "#5570A8";
const PAPER = "#FBFCFE";

const DEFAULT_EQUIPES = [
  { id: "A", label: "Équipe A — FO" },
  { id: "B", label: "Équipe B — FO" },
  { id: "C", label: "Équipe C — FO/BO" },
  { id: "D", label: "Équipe D — FO/BO" },
];

// equipesList : liste dynamique [{id, label}, ...] chargée depuis le serveur — pas
// limitée à 4, un admin peut en ajouter autant que nécessaire. DEFAULT_EQUIPES ne sert
// que de valeur de secours avant le premier chargement.
function equipeLabel(id, equipesList) {
  const found = (equipesList || DEFAULT_EQUIPES).find((e) => e.id === id);
  return found ? found.label : id || "—";
}

const DEFAULT_FID_CAUSES = {
  onboarding: {
    label: "Manque d'accompagnement initial",
    outil: "Parcours d'intégration formalisé J1-J30, pas une simple formation d'accueil.",
    actions: [
      "Programme d'intégration structuré sur 30 jours, avec jalons explicites.",
      "Binôme ou parrain dédié dès le premier jour, pas seulement en cas de difficulté.",
      "Point à J7 pour lever les premières incompréhensions avant qu'elles ne s'installent.",
    ],
  },
  isolement: {
    label: "Isolement / pas de lien d'équipe",
    outil: "Rituels d'équipe qui incluent systématiquement les nouveaux arrivants.",
    actions: [
      "Inclusion immédiate dans les rituels d'équipe existants (pas d'attente de mois 2).",
      "Binôme social distinct du binôme technique, pour créer un lien hors production.",
      "Feedback superviseur sur le ressenti d'intégration, pas seulement sur la performance.",
    ],
  },
  decalage: {
    label: "Décalage attentes / réalité du poste",
    outil: "Clarification explicite du poste dès l'entretien, pas seulement à l'arrivée.",
    actions: [
      "Entretien de cadrage à J15 : le poste correspond-il à ce qui était annoncé ?",
      "Ajustement rapide des missions si l'écart est identifié tôt, plutôt que de laisser dériver.",
      "Transparence sur la trajectoire d'évolution possible, pour redonner du sens.",
    ],
  },
  perspective: {
    label: "Absence de perspective perçue",
    outil: "Points d'étape à J30/J60/J90, avec projection concrète au-delà de la période d'essai.",
    actions: [
      "Point d'étape formel à J30, J60, J90 — pas seulement l'entretien de fin de période d'essai.",
      "Reconnaissance rapide des premiers succès, pour ancrer le sentiment d'utilité.",
      "Discussion explicite sur les perspectives d'évolution, même à ce stade précoce.",
    ],
  },
};

const DEFAULT_DISC_CAUSES = {
  retards: {
    label: "Retards répétés",
    outil: "Entretien sur les causes réelles (transport, organisation personnelle) avant tout aménagement d'horaire.",
    actions: [
      "Entretien individuel pour identifier la cause réelle, pas seulement constater le fait.",
      "Aménagement d'horaire à l'essai si la cause est structurelle (transport, contraintes familiales).",
      "Suivi hebdomadaire de ponctualité, partagé avec le conseiller, pas seulement archivé.",
    ],
  },
  absenteisme: {
    label: "Absentéisme",
    outil: "Entretien de retour systématique, pour comprendre avant de sanctionner.",
    actions: [
      "Entretien de retour à chaque absence, même courte, pour maintenir le lien.",
      "Plan de présence coconstruit si les absences deviennent récurrentes.",
      "Orientation vers les ressources internes (RH, médecine du travail) si signal de mal-être.",
    ],
  },
  qualite: {
    label: "Manquement qualité / procédure",
    outil: "Formation flash ciblée et binôme avec un référent qualité — la même logique que la DMT et le commerce.",
    actions: [
      "Diagnostic par écoute : erreur de compétence ou erreur d'application ponctuelle ?",
      "Formation flash ciblée sur le point précis en écart, pas une reprise générale.",
      "Binôme avec un référent qualité/formation pendant 2 à 3 semaines.",
    ],
  },
  posture: {
    label: "Posture / comportement",
    outil: "Recadrage individuel suivi d'un coaching de posture avec le superviseur.",
    actions: [
      "Recadrage factuel et individuel, sur des faits précis, jamais en public.",
      "Coaching de posture avec le superviseur : objectifs de comportement observables et datés.",
      "Point de suivi à mi-échéance pour ajuster avant l'échéance finale.",
    ],
  },
};

const DEFAULT_DMT_CAUSES = {
  conversation: {
    label: "Temps de conversation",
    outil: "Grille d'écoute ciblée sur la structuration de l'appel (découverte, réponse, clôture).",
    actions: [
      "Écoute conjointe avec le superviseur : identifier les silences et digressions.",
      "Formation flash sur les scripts de découverte rapide (3 questions clés).",
      "Objectif progressif par palier hebdomadaire plutôt qu'un saut direct.",
    ],
  },
  wrapup: {
    label: "Post-appel (wrap-up)",
    outil: "Modèle de clôture standardisé + raccourcis outils pour la saisie CRM.",
    actions: [
      "Script de clôture court à mémoriser (moins de 20 secondes).",
      "Session raccourcis clavier / modèles de notes pré-remplis dans l'outil métier.",
      "Chronométrage du wrap-up sur 5 appels pour objectiver le geste.",
    ],
  },
  recherche: {
    label: "Recherche d'information",
    outil: "Binôme avec un conseiller expert ou le référent qualité/formation.",
    actions: [
      "Shadowing d'un pair référent sur les cas complexes récurrents.",
      "Fiche réflexe des 5 motifs de recherche les plus fréquents.",
      "Point hebdo dédié sur les cas où l'information a été longue à trouver.",
    ],
  },
};

const DEFAULT_COM_CAUSES = {
  proposition: {
    label: "Absence de proposition",
    outil: "Méthode du questionnement guidé — 4 questions ouvertes qui amènent le client à l'offre (voir la bibliothèque ci-dessous).",
    actions: [
      "Mise en situation : dérouler les 4 questions (situation, problème, implication, orientation) sur un cas réel.",
      "Doublon avec un top performer sur 5 appels pour observer l'enchaînement des questions.",
      "Auto-évaluation post-appel : \"ai-je posé les 4 questions ?\" oui/non, sur une semaine.",
    ],
  },
  moment: {
    label: "Mauvais moment dans l'appel",
    outil: "La question d'orientation (étape 4 de la méthode) doit arriver juste après la question d'implication — jamais avant.",
    actions: [
      "Écoute ciblée pour vérifier l'ordre des 4 questions, pas seulement leur présence.",
      "Entraînement sur l'enchaînement avec le superviseur (jeu de rôle sur les 4 étapes).",
      "Grille de repérage des signaux d'ouverture client avant de passer à l'orientation.",
    ],
  },
  conviction: {
    label: "Manque de conviction dans le ton",
    outil: "La question d'orientation doit reprendre les mots du client (étapes 2 et 3), pas un argumentaire plaqué.",
    actions: [
      "Enregistrement + réécoute croisée pour vérifier que l'orientation part bien de la réponse du client.",
      "Entraînement à reformuler la réponse du client avant de poser la question d'orientation.",
      "Challenge court en équipe pour ancrer l'enchaînement des 4 questions dans la durée.",
    ],
  },
};

const DEFAULT_DMT_TOOLS = [
  {
    id: "grille-conversation",
    cause: "conversation",
    title: "Grille d'écoute — structuration de l'appel",
    profil: "Tous profils",
    type: "grille",
    rows: [
      { phase: "Accueil / identification", cible: "≤ 15s", vigilance: "Une seule formule d'accueil, pas de répétition." },
      { phase: "Découverte du besoin", cible: "≤ 45s", vigilance: "3 questions fermées max avant de traiter." },
      { phase: "Traitement / réponse", cible: "≤ 90s", vigilance: "Une seule recherche outil ; si 2e recherche, basculer en mode expert." },
      { phase: "Reformulation", cible: "≤ 20s", vigilance: "Une phrase, pas un résumé complet du dossier." },
      { phase: "Clôture", cible: "≤ 20s", vigilance: "Script standard (voir outil ci-dessous), pas d'improvisation." },
    ],
  },
  {
    id: "script-wrapup",
    cause: "wrapup",
    title: "Script de clôture type",
    profil: "Tous profils",
    type: "script",
    content:
      "Je résume : [action réalisée]. Vous allez recevoir [confirmation/document] sous [délai]. Y a-t-il autre chose pour lequel je peux vous aider ? Je vous remercie de votre appel [prénom], bonne journée à vous, au revoir.",
  },
  {
    id: "fiche-recherche",
    cause: "recherche",
    title: "Fiche réflexe — motifs de recherche fréquents",
    profil: "Tous profils",
    type: "fiche",
    rows: [
      { motif: "Historique de facturation", source: "Onglet Facturation > Historique 12 mois", cible: "≤ 20s" },
      { motif: "Statut d'une réclamation en cours", source: "Module Réclamations > Recherche par n° dossier", cible: "≤ 15s" },
      { motif: "Éligibilité à une offre", source: "Fiche produit > Grille d'éligibilité", cible: "≤ 30s" },
      { motif: "Procédure non standard", source: "Base de connaissance > Mot-clé + référent", cible: "Escalade si > 30s" },
    ],
  },
];

const DEFAULT_COMMERCE_TOOLS = [
  {
    id: "grille-commerce",
    cause: "proposition",
    title: "Grille d'écoute — structuration de l'échange commercial",
    profil: "Tous profils",
    type: "grille",
    rows: [
      { phase: "Découverte du besoin", cible: "≤ 60s", vigilance: "Au moins 1 question de situation avant toute proposition." },
      { phase: "Question d'implication", cible: "Systématique", vigilance: "Le client doit formuler lui-même l'impact du problème, pas le conseiller." },
      { phase: "Proposition commerciale", cible: "Reliée au besoin exprimé", vigilance: "L'offre cite un mot ou une contrainte dite par le client, pas un pitch générique." },
      { phase: "Traitement de l'objection", cible: "1 reformulation + 1 argument", vigilance: "Reformuler l'objection avant d'y répondre, jamais répondre à chaud." },
      { phase: "Conclusion", cible: "Question fermée explicite", vigilance: "Une vraie question de conclusion posée, pas une offre laissée en suspens." },
    ],
  },
  {
    id: "script-objections",
    cause: "conviction",
    title: "Script — traitement des objections courantes",
    profil: "Tous profils",
    type: "script",
    content:
      "Je comprends votre hésitation sur [objection reformulée]. Beaucoup de nos clients avaient la même réserve au départ, et voici ce qu'ils ont constaté : [bénéfice concret lié au besoin exprimé]. Est-ce que ça répond à votre préoccupation, ou y a-t-il autre chose qui vous freine ?",
  },
  {
    id: "fiche-arguments",
    cause: "moment",
    title: "Fiche réflexe — argument par situation client",
    profil: "Tous profils",
    type: "fiche",
    rows: [
      { motif: "Client déjà équipé ailleurs", source: "Comparer sur le point faible connu de la concurrence, pas sur le prix seul", cible: "≤ 20s" },
      { motif: "Client indécis / \"je vais réfléchir\"", source: "Reformuler le bénéfice concret déjà exprimé par le client lui-même", cible: "≤ 15s" },
      { motif: "Client sensible au prix", source: "Ramener au coût par usage/mois, pas au prix total affiché", cible: "≤ 20s" },
      { motif: "Client pressé", source: "Proposer un engagement court (rappel à date fixe) plutôt que forcer la vente", cible: "≤ 10s" },
    ],
  },
];

const TOOLS_THEMES = ["dmt", "commerce"];

const QUESTIONING_STEPS = [
  { key: "situationQ", label: "1. Question de situation", role: "Ouvrir le dialogue sur le contexte actuel du client — jamais fermée." },
  { key: "problemeQ", label: "2. Question de problème", role: "Faire émerger un point de friction que le client n'a pas forcément verbalisé." },
  { key: "implicationQ", label: "3. Question d'implication", role: "Faire réaliser au client l'impact concret de ce problème, pour lui — pas pour nous." },
  { key: "orientationQ", label: "4. Question d'orientation", role: "Ouvrir la porte vers l'offre à partir de ce que LE CLIENT vient de dire, pas d'un pitch plaqué." },
];

const GUIDED_QUESTIONING = [
  {
    typologie: "Appel facturation",
    situationQ: "Comment se passe le paiement de vos factures aujourd'hui, plutôt fluide ou parfois compliqué ?",
    problemeQ: "Qu'est-ce qui vous gêne le plus : le montant, la régularité, ou les surprises en fin d'année ?",
    implicationQ: "Et sur une année complète, ces régularisations, ça représente quoi pour votre budget ?",
    orientationQ: "Si je vous montrais comment lisser ça avec la mensualisation, ça vous intéresserait d'en savoir plus ?",
  },
  {
    typologie: "Appel réclamation (résolue)",
    situationQ: "Maintenant que c'est réglé, comment se passe le reste de votre contrat au quotidien ?",
    problemeQ: "Il y a un point qui vous a déjà semblé pas clair, ou pas optimal pour votre usage ?",
    implicationQ: "Et concrètement, cette situation vous a fait perdre du temps ou de l'argent ?",
    orientationQ: "Justement, [offre] évite ce genre de situation à l'avenir — je vous en dis deux mots ?",
  },
  {
    typologie: "Appel renseignement",
    situationQ: "Qu'est-ce qui vous amène à vous poser cette question aujourd'hui ?",
    problemeQ: "Il y a quelque chose dans votre contrat actuel qui ne colle plus tout à fait à votre situation ?",
    implicationQ: "Et ça, ça a un impact sur votre quotidien ou votre budget ?",
    orientationQ: "[Offre] a justement été pensée pour ce cas de figure, je peux vous en dire plus ?",
  },
  {
    typologie: "Appel résiliation / déménagement",
    situationQ: "Qu'est-ce qui motive ce changement, si ce n'est pas indiscret ?",
    problemeQ: "Il y avait un point du contrat actuel qui ne vous convenait pas vraiment ?",
    implicationQ: "Dans votre nouveau logement, quels sont vos besoins prioritaires ?",
    orientationQ: "Je vérifie avec vous si [offre] est disponible à votre nouvelle adresse, ça vous va ?",
  },
];

const STORAGE_KEY = "paa-history";

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function addWeeks(n) {
  const d = new Date();
  d.setDate(d.getDate() + n * 7);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long" });
}

function addWeeksISO(n) {
  const d = new Date();
  d.setDate(d.getDate() + n * 7);
  return d.toISOString();
}

function buildDMT(nom, actuel, cible, causeKey, equipe, causesBank) {
  const cause = (causesBank || DEFAULT_DMT_CAUSES)[causeKey];
  const ecart = Math.max(0, Math.round(actuel - cible));
  const dateObjectif = addWeeks(3);
  return {
    id: uid(),
    theme: "dmt",
    nom,
    equipe,
    createdAt: new Date().toISOString(),
    dateEcheance: addWeeksISO(3),
    status: "en cours",
    metricLabel: "DMT",
    causeLabel: cause.label,
    actuel: `${actuel}s`,
    cible: `${cible}s`,
    indicateurEcart: `DMT : ${actuel}s (cible ${cible}s) — écart de ${ecart}s. Cause identifiée : ${cause.label.toLowerCase()}.`,
    actionsFactuelles: cause.actions,
    commentaire: `${cause.outil} Le conseiller maîtrise le fond ; l'écart porte sur la structuration du temps d'appel, pas sur la compétence produit.`,
    suiviSmart: `Spécifique : ramener la DMT à ${cible}s sur les appels concernés par « ${cause.label.toLowerCase()} ». Mesurable : DMT relevée chaque semaine par le superviseur. Atteignable : via les actions ci-dessus, sans charge supplémentaire hors accompagnement. Réaliste : écart de ${ecart}s, cohérent avec 3 semaines d'accompagnement ciblé. Temporel : point hebdomadaire, objectif au ${dateObjectif}.`,
    felicitation: "Valorisation en réunion d'équipe ; le conseiller devient binôme référent pour un pair en écart.",
  };
}

function buildCommerce(nom, actuel, cible, causeKey, equipe, causesBank) {
  const cause = (causesBank || DEFAULT_COM_CAUSES)[causeKey];
  const ecart = Math.max(0, Math.round((cible - actuel) * 10) / 10);
  const dateObjectif = addWeeks(4);
  return {
    id: uid(),
    theme: "commerce",
    nom,
    equipe,
    createdAt: new Date().toISOString(),
    dateEcheance: addWeeksISO(4),
    status: "en cours",
    metricLabel: "Taux de transformation",
    causeLabel: cause.label,
    actuel: `${actuel}%`,
    cible: `${cible}%`,
    indicateurEcart: `Taux de transformation : ${actuel}% (cible ${cible}%) — écart de ${ecart} pts. Cause identifiée : ${cause.label.toLowerCase()}.`,
    actionsFactuelles: cause.actions,
    commentaire: `${cause.outil} Le volume de contacts éligibles est suffisant : l'écart porte sur la pratique en appel, pas sur l'opportunité commerciale disponible.`,
    suiviSmart: `Spécifique : atteindre ${cible}% de transformation sur les situations « ${cause.label.toLowerCase()} ». Mesurable : taux de transformation suivi chaque semaine par le superviseur. Atteignable : via les actions ci-dessus, sans dégrader la satisfaction. Réaliste : écart de ${ecart} pts, cohérent avec 4 semaines d'accompagnement ciblé. Temporel : débrief hebdomadaire, objectif au ${dateObjectif}.`,
    felicitation: "Reconnaissance visible en équipe ; le conseiller devient point d'appui pour les mises en situation des autres.",
  };
}

function buildDisc(nom, causeKey, mesureFormelle, equipe, causesBank) {
  const cause = (causesBank || DEFAULT_DISC_CAUSES)[causeKey];
  const dateEcheance = addWeeks(3);
  return {
    id: uid(),
    theme: "disc",
    nom,
    equipe,
    createdAt: new Date().toISOString(),
    dateEcheance: addWeeksISO(3),
    status: "en cours",
    causeLabel: cause.label,
    mesureFormelle: mesureFormelle || "Aucune",
    indicateurEcart: `Manquement constaté : ${cause.label.toLowerCase()}.${mesureFormelle && mesureFormelle !== "Aucune" ? ` Mesure formelle associée : ${mesureFormelle}.` : " Pas de mesure formelle à ce stade — traité en développement."}`,
    actionsFactuelles: cause.actions,
    commentaire: `${cause.outil} L'objectif n'est pas d'archiver un écart, c'est de le transformer en progression mesurable.`,
    suiviSmart: `Spécifique : résorber la cause « ${cause.label.toLowerCase()} » via les actions ci-dessus. Mesurable : point de suivi formalisé. Atteignable : action proportionnée à la cause réelle, pas au symptôme. Réaliste : échéance courte pour ne pas laisser le sujet dériver. Temporel : échéance de suivi au ${dateEcheance}.`,
    felicitation: "Écart résorbé : point positif tracé dans le même historique que le manquement — la progression est aussi visible que l'écart l'a été.",
  };
}

function themeLabel(theme) {
  if (theme === "dmt") return "Maîtrise de la DMT";
  if (theme === "commerce") return "Développement commercial";
  if (theme === "disc") return "Registre disciplinaire orienté solution";
  if (theme === "fid") return "Fidélisation orientée solution";
  return theme;
}

function buildFidelisation(nom, causeKey, equipe, causesBank) {
  const cause = (causesBank || DEFAULT_FID_CAUSES)[causeKey];
  const dateEcheance = addWeeks(6);
  return {
    id: uid(),
    theme: "fid",
    nom,
    equipe,
    createdAt: new Date().toISOString(),
    dateEcheance: addWeeksISO(6),
    status: "en cours",
    causeLabel: cause.label,
    indicateurEcart: `Risque de départ précoce identifié — cause principale : ${cause.label.toLowerCase()}. Constat de référence : rétention à 6 mois autour de 50 %, ambition de la dépasser durablement.`,
    actionsFactuelles: cause.actions,
    commentaire: `${cause.outil} Impact individuel : montée en compétence et projection dans le poste. Impact collectif : moins de recrutements à refaire, équipe plus stable.`,
    suiviSmart: `Spécifique : sécuriser la présence du conseiller au-delà de 6 mois en traitant « ${cause.label.toLowerCase()} ». Mesurable : points d'étape à J30, J60, J90. Atteignable : actions ci-dessus, sans charge supplémentaire hors accompagnement. Réaliste : concentré sur la période à risque (6 premiers mois). Temporel : point de suivi au ${dateEcheance}.`,
    felicitation: "Cap des 6 mois franchi : le conseiller passe en suivi standard, et son parcours d'intégration devient un exemple à partager avec les nouveaux arrivants.",
  };
}

function exportPAAIcs(p) {
  if (!p.dateEcheance) return;
  const dt = new Date(p.dateEcheance);
  const pad = (n) => String(n).padStart(2, "0");
  // Rappel toute la journée à la date d'échéance (format DATE, pas DATE-TIME, pour éviter
  // les soucis de fuseau horaire d'un simple rappel de suivi).
  const dateStr = `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}`;
  const nextDay = new Date(dt.getTime() + 24 * 60 * 60 * 1000);
  const nextDayStr = `${nextDay.getFullYear()}${pad(nextDay.getMonth() + 1)}${pad(nextDay.getDate())}`;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const summary = `Suivi PAA — ${p.nom}`;
  const description = `Thème : ${themeLabel(p.theme)}. Cause : ${p.causeLabel || "—"}. À revoir : ${p.indicateurEcart}`.replace(/\n/g, " ");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Assistant Conseillers//FR",
    "BEGIN:VEVENT",
    `UID:${p.id}@assistant-conseillers`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${dateStr}`,
    `DTEND;VALUE=DATE:${nextDayStr}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT9H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${summary}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rappel-paa-${p.nom.replace(/\s+/g, "-").toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportPAAPdf(p, equipesList) {
  const win = window.open("", "_blank");
  if (!win) return;
  const actionsHtml = p.actionsFactuelles.map((a) => `<li>${escapeHtml(a)}</li>`).join("");
  win.document.write(`
    <!doctype html>
    <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <title>PAA — ${escapeHtml(p.nom)}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #173A6B; padding: 40px; max-width: 720px; margin: 0 auto; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .meta { color: #5570A8; font-size: 13px; margin-bottom: 24px; }
        h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #3D2170; margin: 20px 0 6px; }
        p, li { font-size: 14px; line-height: 1.5; }
        ul { margin: 0; padding-left: 20px; }
        .footer { margin-top: 40px; font-size: 11px; color: #9FADA9; }
      </style>
    </head>
    <body>
      <h1>Plan d'accompagnement — ${escapeHtml(p.nom)}</h1>
      <div class="meta">${escapeHtml(themeLabel(p.theme))} · ${escapeHtml(equipeLabel(p.equipe, equipesList))} · ${escapeHtml(new Date(p.createdAt).toLocaleDateString("fr-FR"))}</div>
      <h2>Indicateur écart</h2>
      <p>${escapeHtml(p.indicateurEcart)}</p>
      <h2>Description des actions factuelles à mettre en place</h2>
      <ul>${actionsHtml}</ul>
      <h2>Commentaire</h2>
      <p>${escapeHtml(p.commentaire)}</p>
      <h2>Suivi SMART</h2>
      <p>${escapeHtml(p.suiviSmart)}</p>
      <div class="footer">Généré via Assistant Conseillers — ${escapeHtml(new Date().toLocaleDateString("fr-FR"))}</div>
    </body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paaToText(p) {
  return [
    `PLAN D'ACCOMPAGNEMENT — ${p.nom}`,
    `Thème : ${themeLabel(p.theme)}`,
    "",
    `INDICATEUR ÉCART`,
    p.indicateurEcart,
    "",
    `DESCRIPTION DES ACTIONS FACTUELLES À METTRE EN PLACE`,
    ...p.actionsFactuelles.map((a) => `- ${a}`),
    "",
    `COMMENTAIRE`,
    p.commentaire,
    "",
    `SUIVI SMART`,
    p.suiviSmart,
  ].join("\n");
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold tracking-wide uppercase mb-1" style={{ color: VIOLET }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 transition bg-white";
const selectCls = inputCls + " cursor-pointer";

export default function AssistantConseillers() {
  // ---- Auth ----
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [showUsers, setShowUsers] = useState(false);

  const [tab, setTab] = useState("dmt");
  const [history, setHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedRebond, setCopiedRebond] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedEquipe, setSelectedEquipe] = useState(DEFAULT_EQUIPES[0].id);
  const [equipesList, setEquipesList] = useState(DEFAULT_EQUIPES);

  // DMT form state
  const [dmtNom, setDmtNom] = useState("");
  const [dmtActuel, setDmtActuel] = useState("");
  const [dmtCible, setDmtCible] = useState("240");
  const [dmtCause, setDmtCause] = useState("conversation");

  // Commerce form state
  const [comNom, setComNom] = useState("");
  const [comActuel, setComActuel] = useState("");
  const [comCible, setComCible] = useState("20");
  const [comCause, setComCause] = useState("proposition");

  // Disciplinary register form state
  const [discNom, setDiscNom] = useState("");
  const [discCause, setDiscCause] = useState("retards");
  const [discMesure, setDiscMesure] = useState("Aucune");

  // Fidélisation form state
  const [fidNom, setFidNom] = useState("");
  const [fidCause, setFidCause] = useState("onboarding");

  const [syncError, setSyncError] = useState(false);
  const [causesConfig, setCausesConfig] = useState({
    dmt: DEFAULT_DMT_CAUSES,
    commerce: DEFAULT_COM_CAUSES,
    disc: DEFAULT_DISC_CAUSES,
    fid: DEFAULT_FID_CAUSES,
  });
  const [showCausesEditor, setShowCausesEditor] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showToolsEditor, setShowToolsEditor] = useState(false);
  const [toolsConfig, setToolsConfig] = useState({ dmt: DEFAULT_DMT_TOOLS, commerce: DEFAULT_COMMERCE_TOOLS });
  const [grilleNotes, setGrilleNotes] = useState({});
  const [grilleConseillerNom, setGrilleConseillerNom] = useState("");
  const [grilleCommentaire, setGrilleCommentaire] = useState("");

  // Charge la session sauvegardée (token + user) au premier rendu.
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("auth-token");
      const savedUser = localStorage.getItem("auth-user");
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      // session locale corrompue, on repart sur l'écran de connexion
    } finally {
      setAuthChecked(true);
    }
  }, []);

  // Une fois connecté, l'équipe par défaut d'un formulaire est celle de l'utilisateur.
  useEffect(() => {
    if (user?.equipe) setSelectedEquipe(user.equipe);
  }, [user]);

  function authHeaders() {
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  }

  function handleLogout() {
    localStorage.removeItem("auth-token");
    localStorage.removeItem("auth-user");
    setToken(null);
    setUser(null);
    setHistory([]);
    setLoaded(false);
    setAuthChecked(true);
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setLoginError("");
    if (!loginUsername.trim() || !loginPassword) {
      setLoginError("Identifiant et mot de passe requis.");
      return;
    }
    setLoginBusy(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername.trim(), password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Connexion impossible.");
        setLoginBusy(false);
        return;
      }
      localStorage.setItem("auth-token", data.token);
      localStorage.setItem("auth-user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setLoginPassword("");
    } catch (e) {
      setLoginError("Connexion impossible — vérifie ta connexion internet.");
    } finally {
      setLoginBusy(false);
    }
  }

  // Charge l'historique (déjà filtré côté serveur par équipe si non-admin) une fois connecté.
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch("/api/paa", { headers: authHeaders() });
        if (res.status === 401) {
          handleLogout();
          return;
        }
        if (!res.ok) throw new Error("api not ready");
        const data = await res.json();
        setHistory(data);
        setSyncError(false);
      } catch (e) {
        setSyncError(true);
      } finally {
        setLoaded(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Charge la banque de techniques personnalisée si un admin l'a modifiée ; sinon les
  // valeurs par défaut codées en dur restent utilisées (aucune config enregistrée = null).
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch("/api/causes", { headers: authHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        if (data) {
          setCausesConfig({
            dmt: { ...DEFAULT_DMT_CAUSES, ...(data.dmt || {}) },
            commerce: { ...DEFAULT_COM_CAUSES, ...(data.commerce || {}) },
            disc: { ...DEFAULT_DISC_CAUSES, ...(data.disc || {}) },
            fid: { ...DEFAULT_FID_CAUSES, ...(data.fid || {}) },
          });
        }
      } catch (e) {
        // pas grave : on garde les valeurs par défaut
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Charge la bibliothèque d'outils personnalisée (ajouts/modifs d'un admin), pour
  // chaque module qui en a une (DMT, Commerce) ; sinon les valeurs par défaut restent
  // utilisées, module par module.
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch("/api/tools", { headers: authHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        if (data) {
          setToolsConfig({
            dmt: Array.isArray(data.dmt) && data.dmt.length ? data.dmt : DEFAULT_DMT_TOOLS,
            commerce: Array.isArray(data.commerce) && data.commerce.length ? data.commerce : DEFAULT_COMMERCE_TOOLS,
          });
        }
      } catch (e) {
        // pas grave : on garde les valeurs par défaut
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Charge la liste d'équipes (renommées ou ajoutées) ; le serveur retourne toujours
  // une liste complète, avec 4 équipes par défaut si rien n'a encore été configuré.
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch("/api/equipes", { headers: authHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) setEquipesList(data);
      } catch (e) {
        // pas grave : on garde la liste par défaut
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleRenameEquipe(id) {
    const current = equipeLabel(id, equipesList);
    const next = window.prompt("Nouveau nom pour cette équipe :", current);
    if (!next || !next.trim() || next.trim() === current) return;
    try {
      const res = await fetch("/api/equipes", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "rename", id, label: next.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Renommage impossible.");
        return;
      }
      setEquipesList(data);
      showToast("Équipe renommée.");
    } catch (e) {
      showToast("Renommage impossible — réessaie.");
    }
  }

  async function handleAddEquipe() {
    const label = window.prompt("Nom de la nouvelle équipe :");
    if (!label || !label.trim()) return;
    try {
      const res = await fetch("/api/equipes", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "add", label: label.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Ajout impossible.");
        return;
      }
      setEquipesList(data);
      showToast("Équipe ajoutée.");
    } catch (e) {
      showToast("Ajout impossible — réessaie.");
    }
  }

  // Les trois opérations passent par des actions ciblées côté serveur (jamais un
  // remplacement du tableau complet) : un superviseur ne voit que sa propre équipe,
  // renvoyer sa vue partielle écraserait les autres équipes si le serveur faisait un
  // simple "set".
  const addEntry = useCallback(
    async (entry) => {
      setHistory((h) => [entry, ...h]);
      try {
        const res = await fetch("/api/paa", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ action: "add", entry }),
        });
        if (!res.ok) throw new Error("save failed");
        setSyncError(false);
      } catch (e) {
        setSyncError(true);
        showToast("Enregistrement en ligne impossible — réessaie dans un instant.");
      }
    },
    [token]
  );

  const updateEntry = useCallback(
    async (id, patch) => {
      setHistory((h) => h.map((p) => (p.id === id ? { ...p, ...patch } : p)));
      try {
        const res = await fetch("/api/paa", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ action: "update", id, patch }),
        });
        if (!res.ok) throw new Error("update failed");
      } catch (e) {
        showToast("Mise à jour en ligne impossible — réessaie dans un instant.");
      }
    },
    [token]
  );

  const removeEntry = useCallback(
    async (id) => {
      setHistory((h) => h.filter((p) => p.id !== id));
      try {
        const res = await fetch("/api/paa", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ action: "remove", id }),
        });
        if (!res.ok) throw new Error("delete failed");
      } catch (e) {
        showToast("Suppression en ligne impossible — réessaie dans un instant.");
      }
    },
    [token]
  );

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function genererPAADepuisConstats(tool, theme) {
    const kos = tool.rows
      .map((row, ri) => ({ phase: row.phase, vigilance: row.vigilance, statut: grilleNotes[tool.id]?.[ri] }))
      .filter((r) => r.statut === "ko");

    if (kos.length === 0) {
      showToast("Coche au moins un item en KO avant de générer un plan.");
      return;
    }
    if (!grilleConseillerNom.trim()) {
      showToast("Renseigne le nom du conseiller concerné.");
      return;
    }

    const entry = {
      id: uid(),
      theme,
      nom: grilleConseillerNom.trim(),
      equipe: selectedEquipe,
      createdAt: new Date().toISOString(),
      dateEcheance: addWeeksISO(3),
      status: "en cours",
      causeLabel: "Écoute — grille d'évaluation",
      metricLabel: "",
      actuel: "",
      cible: "",
      indicateurEcart: `Axes d'amélioration identifiés en écoute (${tool.title}) : ${kos.map((k) => k.phase).join(", ")}.`,
      actionsFactuelles: kos.map((k) => `${k.phase} — ${k.vigilance}`),
      commentaire: grilleCommentaire.trim() || "—",
      suiviSmart: `Spécifique : corriger les axes identifiés (${kos.map((k) => k.phase).join(", ")}). Mesurable : nouvelle écoute de contrôle, mêmes items. Atteignable : actions ciblées ci-dessus. Réaliste : basé sur une observation réelle. Temporel : point de suivi au ${addWeeks(3)}.`,
      felicitation: "Items repassés en OK lors de la prochaine écoute : à valoriser auprès du conseiller.",
    };

    addEntry(entry);
    setGrilleNotes((s) => ({ ...s, [tool.id]: {} }));
    setGrilleConseillerNom("");
    setGrilleCommentaire("");
    showToast("PAA généré à partir de la grille.");
  }

  function telechargerModeleGrille(tool) {
    const win = window.open("", "_blank");
    if (!win) return;
    const rowsHtml = tool.rows
      .map(
        (row) => `
        <tr>
          <td>${escapeHtml(row.phase)}</td>
          <td>${escapeHtml(row.cible)}</td>
          <td>${escapeHtml(row.vigilance)}</td>
          <td class="checkbox-cell">☐ OK &nbsp;&nbsp; ☐ KO</td>
        </tr>`
      )
      .join("");
    win.document.write(`
      <!doctype html>
      <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(tool.title)} — modèle vierge</title>
        <style>
          body { font-family: Arial, sans-serif; color: #173A6B; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { font-size: 18px; margin-bottom: 4px; }
          .meta { color: #5570A8; font-size: 12px; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
          th { text-align: left; text-transform: uppercase; font-size: 11px; color: #3D2170; border-bottom: 2px solid #3D2170; padding: 6px 8px; }
          td { border-bottom: 1px solid #E2E8F5; padding: 8px; vertical-align: top; }
          .checkbox-cell { white-space: nowrap; font-size: 14px; }
          .footer { margin-top: 30px; font-size: 11px; color: #9FADA9; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(tool.title)} — modèle vierge à compléter</h1>
        <div class="meta">Conseiller : ______________________&nbsp;&nbsp;&nbsp; Date : ______________</div>
        <table>
          <thead>
            <tr><th>Phase</th><th>Cible</th><th>Point de vigilance</th><th>Constat</th></tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div class="footer">Modèle imprimable — Assistant Conseillers. Reporte ensuite les items KO dans l'outil pour générer le plan d'accompagnement.</div>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }

  function handleDMTSubmit(e) {
    e.preventDefault();
    if (!dmtNom.trim()) {
      showToast("Renseigne le nom du conseiller.");
      return;
    }
    const actuel = parseFloat(dmtActuel);
    const cible = parseFloat(dmtCible);
    if (isNaN(actuel) || isNaN(cible)) {
      showToast("Renseigne une DMT actuelle et une DMT cible valides.");
      return;
    }
    if (actuel <= cible) {
      showToast(`${dmtNom} est déjà sur la cible DMT — pas de PAA nécessaire.`);
      setDmtActuel("");
      return;
    }
    const paa = buildDMT(dmtNom.trim(), actuel, cible, dmtCause, selectedEquipe, causesConfig.dmt);
    addEntry(paa);
    setDmtNom("");
    setDmtActuel("");
    showToast("PAA généré et enregistré.");
  }

  function handleComSubmit(e) {
    e.preventDefault();
    if (!comNom.trim()) {
      showToast("Renseigne le nom du conseiller.");
      return;
    }
    const actuel = parseFloat(comActuel);
    const cible = parseFloat(comCible);
    if (isNaN(actuel) || isNaN(cible)) {
      showToast("Renseigne un taux actuel et un taux cible valides.");
      return;
    }
    if (actuel >= cible) {
      showToast(`${comNom} est déjà sur la cible commerciale — pas de PAA nécessaire.`);
      setComActuel("");
      return;
    }
    const paa = buildCommerce(comNom.trim(), actuel, cible, comCause, selectedEquipe, causesConfig.commerce);
    addEntry(paa);
    setComNom("");
    setComActuel("");
    showToast("PAA généré et enregistré.");
  }

  function handleDiscSubmit(e) {
    e.preventDefault();
    if (!discNom.trim()) {
      showToast("Renseigne le nom du conseiller.");
      return;
    }
    const entry = buildDisc(discNom.trim(), discCause, discMesure, selectedEquipe, causesConfig.disc);
    addEntry(entry);
    setDiscNom("");
    setDiscMesure("Aucune");
    showToast("Plan de développement généré et enregistré.");
  }

  function handleFidSubmit(e) {
    e.preventDefault();
    if (!fidNom.trim()) {
      showToast("Renseigne le nom du conseiller.");
      return;
    }
    const entry = buildFidelisation(fidNom.trim(), fidCause, selectedEquipe, causesConfig.fid);
    addEntry(entry);
    setFidNom("");
    showToast("Plan de fidélisation généré et enregistré.");
  }

  function markAtteint(id) {
    updateEntry(id, { status: "atteint", atteintAt: new Date().toISOString() });
    showToast("Objectif marqué comme atteint.");
  }

  async function renderEvolutionChartImage(entries) {
    const monthMap = {};
    entries.forEach((p) => {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthMap[key]) monthMap[key] = { created: 0, resolved: 0 };
      monthMap[key].created += 1;
    });
    entries.forEach((p) => {
      if (!p.atteintAt) return;
      const d = new Date(p.atteintAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthMap[key]) monthMap[key] = { created: 0, resolved: 0 };
      monthMap[key].resolved += 1;
    });
    const keys = Object.keys(monthMap).sort();
    const labels = keys.map((k) => {
      const [y, m] = k.split("-");
      return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
    });
    const created = keys.map((k) => monthMap[k].created);
    const resolved = keys.map((k) => monthMap[k].resolved);

    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 420;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels.length ? labels : ["—"],
        datasets: [
          { label: "PAA créés", data: created.length ? created : [0], backgroundColor: "#3D2170" },
          { label: "PAA résolus", data: resolved.length ? resolved : [0], backgroundColor: "#F0C230" },
        ],
      },
      options: {
        responsive: false,
        animation: false,
        plugins: {
          title: { display: true, text: "Évolution mensuelle des PAA", font: { size: 18 }, color: "#173A6B" },
          legend: { position: "bottom" },
        },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
    await new Promise((r) => setTimeout(r, 60));
    const dataUrl = canvas.toDataURL("image/png");
    chart.destroy();
    return dataUrl;
  }

  async function exportExcelReport() {
    if (history.length === 0) {
      showToast("Aucun PAA à exporter pour l'instant.");
      return;
    }
    showToast("Génération du rapport Excel...");

    const NAVY_HEX = "FF173A6B";
    const VIOLET_HEX = "FF3D2170";

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Assistant Conseillers";
    workbook.created = new Date();

    const total = history.length;
    const atteints = history.filter((p) => p.status === "atteint");
    const tauxResolution = total > 0 ? Math.round((atteints.length / total) * 100) : 0;
    const delais = atteints
      .filter((p) => p.atteintAt)
      .map((p) => Math.round((new Date(p.atteintAt).getTime() - new Date(p.createdAt).getTime()) / 86400000));
    const delaiMoyen = delais.length > 0 ? Math.round(delais.reduce((a, b) => a + b, 0) / delais.length) : null;

    // ---- Feuille 1 : Synthèse ----
    const sheetSynth = workbook.addWorksheet("Synthèse");
    sheetSynth.columns = [{ width: 34 }, { width: 20 }];

    sheetSynth.mergeCells("A1:C1");
    sheetSynth.getCell("A1").value = "Rapport — Assistant Conseillers";
    sheetSynth.getCell("A1").font = { size: 18, bold: true, color: { argb: NAVY_HEX } };
    sheetSynth.getCell("A2").value = `Généré le ${new Date().toLocaleDateString("fr-FR")}`;
    sheetSynth.getCell("A2").font = { italic: true, color: { argb: "FF5570A8" } };

    const kpiRows = [
      ["Plans générés", total],
      ["Résolus", atteints.length],
      ["Taux de résolution", `${tauxResolution}%`],
      ["Délai moyen de résolution", delaiMoyen !== null ? `${delaiMoyen} jours` : "—"],
    ];
    let r = 4;
    kpiRows.forEach(([label, value]) => {
      sheetSynth.getCell(`A${r}`).value = label;
      sheetSynth.getCell(`A${r}`).font = { bold: true, color: { argb: VIOLET_HEX } };
      sheetSynth.getCell(`B${r}`).value = value;
      sheetSynth.getCell(`B${r}`).font = { size: 14, bold: true, color: { argb: NAVY_HEX } };
      r += 1;
    });

    const chartDataUrl = await renderEvolutionChartImage(history);
    const chartBase64 = chartDataUrl.replace(/^data:image\/png;base64,/, "");
    const imageId = workbook.addImage({ base64: chartBase64, extension: "png" });
    sheetSynth.addImage(imageId, { tl: { col: 0, row: r + 1 }, ext: { width: 720, height: 336 } });

    // ---- Feuille 2 : Détail ----
    const sheetDetail = workbook.addWorksheet("Détail");
    const headers = [
      "Conseiller", "Équipe", "Thème", "Cause", "Date de création",
      "Métrique", "Valeur initiale", "Cible", "Statut", "Date objectif atteint", "Délai (jours)",
    ];
    sheetDetail.addRow(headers);
    sheetDetail.getRow(1).eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY_HEX } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { vertical: "middle" };
    });
    sheetDetail.views = [{ state: "frozen", ySplit: 1 }];

    history.forEach((p) => {
      const created = new Date(p.createdAt);
      const reached = p.atteintAt ? new Date(p.atteintAt) : null;
      const delaiJours = reached ? Math.round((reached.getTime() - created.getTime()) / 86400000) : "";
      const row = sheetDetail.addRow([
        p.nom,
        equipeLabel(p.equipe, equipesList),
        themeLabel(p.theme),
        p.causeLabel || "",
        created.toLocaleDateString("fr-FR"),
        p.metricLabel || "",
        p.actuel || "",
        p.cible || "",
        p.status === "atteint" ? "Atteint" : "En cours",
        reached ? reached.toLocaleDateString("fr-FR") : "",
        delaiJours,
      ]);
      const statusCell = row.getCell(9);
      statusCell.font = p.status === "atteint"
        ? { color: { argb: "FF2F9E56" }, bold: true }
        : { color: { argb: "FFB3872A" }, bold: true };
    });

    const widths = [22, 20, 18, 26, 16, 20, 14, 12, 12, 18, 12];
    sheetDetail.columns.forEach((col, i) => { col.width = widths[i] || 16; });
    sheetDetail.autoFilter = { from: "A1", to: `K${history.length + 1}` };

    // ---- Feuille 3 : Analyse ----
    const sheetAnalyse = workbook.addWorksheet("Analyse");
    sheetAnalyse.columns = [{ width: 30 }, { width: 14 }, { width: 12 }];

    function writeBreakdown(startRow, title, counts) {
      sheetAnalyse.getCell(`A${startRow}`).value = title;
      sheetAnalyse.getCell(`A${startRow}`).font = { bold: true, size: 13, color: { argb: NAVY_HEX } };
      let rr = startRow + 1;
      ["Libellé", "Nombre", "%"].forEach((h, i) => {
        const cell = sheetAnalyse.getCell(rr, i + 1);
        cell.value = h;
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: VIOLET_HEX } };
      });
      rr += 1;
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([label, count]) => {
          sheetAnalyse.getCell(`A${rr}`).value = label;
          sheetAnalyse.getCell(`B${rr}`).value = count;
          sheetAnalyse.getCell(`C${rr}`).value = total > 0 ? `${Math.round((count / total) * 100)}%` : "0%";
          rr += 1;
        });
      return rr + 1;
    }

    const parTheme = {};
    history.forEach((p) => { const l = themeLabel(p.theme); parTheme[l] = (parTheme[l] || 0) + 1; });
    const parEquipe = {};
    history.forEach((p) => { const l = equipeLabel(p.equipe, equipesList); parEquipe[l] = (parEquipe[l] || 0) + 1; });
    const parCause = {};
    history.forEach((p) => { const l = p.causeLabel || "—"; parCause[l] = (parCause[l] || 0) + 1; });

    let cursor = 1;
    cursor = writeBreakdown(cursor, "Répartition par module", parTheme);
    cursor = writeBreakdown(cursor, "Répartition par équipe", parEquipe);
    writeBreakdown(cursor, "Causes les plus fréquentes", parCause);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-paa-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Rapport Excel généré.");
  }

  async function exportSimpleExcel() {
    if (history.length === 0) {
      showToast("Aucun PAA à exporter pour l'instant.");
      return;
    }
    const NAVY_HEX = "FF173A6B";

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Assistant Conseillers";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("PAA");
    const headers = [
      "Conseiller", "Équipe", "Thème", "Cause", "Date de création",
      "Métrique", "Valeur initiale", "Cible", "Statut", "Date objectif atteint", "Délai (jours)",
    ];
    sheet.addRow(headers);
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY_HEX } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    });
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    history.forEach((p) => {
      const created = new Date(p.createdAt);
      const reached = p.atteintAt ? new Date(p.atteintAt) : null;
      const delaiJours = reached ? Math.round((reached.getTime() - created.getTime()) / 86400000) : "";
      sheet.addRow([
        p.nom,
        equipeLabel(p.equipe, equipesList),
        themeLabel(p.theme),
        p.causeLabel || "",
        created.toLocaleDateString("fr-FR"),
        p.metricLabel || "",
        p.actuel || "",
        p.cible || "",
        p.status === "atteint" ? "Atteint" : "En cours",
        reached ? reached.toLocaleDateString("fr-FR") : "",
        delaiJours,
      ]);
    });

    const widths = [22, 20, 18, 26, 16, 20, 14, 12, 12, 18, 12];
    sheet.columns.forEach((col, i) => { col.width = widths[i] || 16; });
    sheet.autoFilter = { from: "A1", to: `K${history.length + 1}` };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paa-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function removePAA(id) {
    removeEntry(id);
  }

  async function copyPAA(p) {
    try {
      await navigator.clipboard.writeText(paaToText(p));
      setCopiedId(p.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (e) {
      showToast("Copie impossible dans cet environnement.");
    }
  }

  async function copyRebond(text, idx) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedRebond(idx);
      setTimeout(() => setCopiedRebond(null), 1500);
    } catch (e) {
      showToast("Copie impossible dans cet environnement.");
    }
  }

  const causes =
    tab === "dmt"
      ? causesConfig.dmt
      : tab === "commerce"
      ? causesConfig.commerce
      : tab === "disc"
      ? causesConfig.disc
      : causesConfig.fid;

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: PAPER }}>
        <div className="text-sm" style={{ color: SKY }}>
          Chargement...
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: NAVY, fontFamily: "Arial, sans-serif" }}
      >
        <div className="w-full max-w-sm bg-white rounded-xl p-7 shadow-xl">
          <span
            className="text-xs font-semibold tracking-[0.15em] uppercase"
            style={{ color: VIOLET }}
          >
            Assistant Conseillers
          </span>
          <h1
            className="text-xl font-bold mb-5 mt-1"
            style={{ color: NAVY, fontFamily: "Georgia, serif" }}
          >
            Connexion
          </h1>
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <Field label="Identifiant">
              <input
                className={inputCls}
                style={{ borderColor: "#D8E0F0" }}
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                autoFocus
              />
            </Field>
            <Field label="Mot de passe">
              <input
                type="password"
                className={inputCls}
                style={{ borderColor: "#D8E0F0" }}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </Field>
            {loginError && (
              <div
                className="text-xs rounded-md px-3 py-2"
                style={{ background: "#FDEDED", color: "#B3261E" }}
              >
                {loginError}
              </div>
            )}
            <button
              type="submit"
              disabled={loginBusy}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              style={{ background: VIOLET }}
            >
              {loginBusy ? "Connexion..." : "Se connecter"}
            </button>
          </form>
          <p className="text-[11px] mt-4" style={{ color: SKY }}>
            Pas encore de compte ? Le tout premier compte créé (base vide) devient
            automatiquement administrateur — voir le README pour la procédure de démarrage.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: PAPER, fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ background: NAVY }} className="px-6 py-7 sm:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <span
                className="text-xs font-semibold tracking-[0.15em] uppercase"
                style={{ color: YELLOW }}
              >
                Assistant Conseillers
              </span>
              <h1
                className="text-2xl sm:text-3xl font-bold text-white mt-1"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Plans d'accompagnement orientés solution
              </h1>
            </div>
            <div
              className="hidden sm:flex items-center justify-center rounded-xl px-3 py-2 shrink-0"
              style={{ background: "white" }}
            >
              <img src="/logo.png" alt="3 Media" className="h-9 w-auto" />
            </div>
          </div>
          <p className="text-sm mt-2 max-w-2xl" style={{ color: "#B9C6E0" }}>
            Sur la DMT, le commerce, le disciplinaire ou la fidélisation, l'outil diagnostique la
            cause et génère un plan factuel centré sur la montée en compétences, jamais la sanction.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "#20406E", color: "white" }}>
              {user.displayName} · {user.role === "admin" ? "Administrateur" : equipeLabel(user.equipe, equipesList)}
            </span>
            {user.role !== "admin" && user.equipe && (
              <button
                onClick={() => handleRenameEquipe(user.equipe)}
                className="text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-full transition hover:opacity-80"
                style={{ background: "#20406E", color: "white" }}
                title="Renommer mon équipe"
              >
                <ClipboardList size={12} /> Renommer mon équipe
              </button>
            )}
            {user.role === "admin" && (
              <button
                onClick={() => setShowUsers(true)}
                className="text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-full transition hover:opacity-80"
                style={{ background: "#20406E", color: "white" }}
              >
                <Users size={12} /> Gérer les utilisateurs
              </button>
            )}
            {user.role === "admin" && (
              <button
                onClick={() => setShowCausesEditor(true)}
                className="text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-full transition hover:opacity-80"
                style={{ background: "#20406E", color: "white" }}
              >
                <ClipboardList size={12} /> Banque de techniques
              </button>
            )}
            <button
              onClick={handleLogout}
              className="text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-full transition hover:opacity-80"
              style={{ background: "#20406E", color: "white" }}
            >
              <LogOut size={12} /> Déconnexion
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-8">
        {loaded && syncError && (
          <div
            className="mb-5 text-xs rounded-lg border px-4 py-2.5"
            style={{ borderColor: "#F0C230", background: "#FFFBEC", color: "#8A6D00" }}
          >
            Synchronisation en ligne indisponible — les données restent enregistrées sur cet
            appareil seulement, pas sur les autres. Vois le README pour activer le stockage
            partagé (Vercel KV).
          </div>
        )}

        {loaded && (() => {
          const now = Date.now();
          const overdue = history.filter(
            (p) => p.status !== "atteint" && p.dateEcheance && new Date(p.dateEcheance).getTime() < now
          );
          if (overdue.length === 0) return null;
          return (
            <div
              className="mb-5 text-xs rounded-lg border px-4 py-2.5"
              style={{ borderColor: "#F0A0A0", background: "#FDECEC", color: "#8A2020" }}
            >
              <span className="font-semibold">
                {overdue.length} plan{overdue.length > 1 ? "s" : ""} en retard de suivi
              </span>{" "}
              — échéance dépassée sans que l'objectif soit marqué atteint :{" "}
              {overdue.map((p) => p.nom).join(", ")}.
            </div>
          );
        })()}

        {user.role === "admin" && (
          <div className="mb-5 flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: VIOLET }}>
              Équipe pour les nouveaux plans
            </span>
            <select
              className={selectCls}
              style={{ borderColor: "#D8E0F0", width: "auto" }}
              value={selectedEquipe}
              onChange={(e) => setSelectedEquipe(e.target.value)}
            >
              {equipesList.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {equipeLabel(eq.id, equipesList)}
                </option>
              ))}
            </select>
            <button
              onClick={() => handleRenameEquipe(selectedEquipe)}
              className="text-xs font-semibold underline underline-offset-2 hover:opacity-70"
              style={{ color: SKY }}
            >
              Renommer
            </button>
            <button
              onClick={handleAddEquipe}
              className="text-xs font-semibold underline underline-offset-2 hover:opacity-70"
              style={{ color: SKY }}
            >
              + Ajouter une équipe
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("dmt")}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition"
            style={{
              background: tab === "dmt" ? VIOLET : "white",
              color: tab === "dmt" ? "white" : VIOLET,
              border: `1px solid ${VIOLET}`,
            }}
          >
            <PhoneCall size={16} /> Maîtrise de la DMT
          </button>
          <button
            onClick={() => setTab("commerce")}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition"
            style={{
              background: tab === "commerce" ? VIOLET : "white",
              color: tab === "commerce" ? "white" : VIOLET,
              border: `1px solid ${VIOLET}`,
            }}
          >
            <TrendingUp size={16} /> Développement commercial
          </button>
          <button
            onClick={() => setTab("disc")}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition"
            style={{
              background: tab === "disc" ? VIOLET : "white",
              color: tab === "disc" ? "white" : VIOLET,
              border: `1px solid ${VIOLET}`,
            }}
          >
            <ClipboardList size={16} /> Registre disciplinaire
          </button>
          <button
            onClick={() => setTab("fid")}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition"
            style={{
              background: tab === "fid" ? VIOLET : "white",
              color: tab === "fid" ? "white" : VIOLET,
              border: `1px solid ${VIOLET}`,
            }}
          >
            <Heart size={16} /> Fidélisation
          </button>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-8" style={{ borderColor: "#E2E8F5" }}>
          {tab === "dmt" ? (
            <form onSubmit={handleDMTSubmit} className="grid sm:grid-cols-2 gap-4">
              <Field label="Conseiller">
                <input
                  className={inputCls}
                  style={{ borderColor: "#D8E0F0" }}
                  placeholder="Nom du conseiller"
                  value={dmtNom}
                  onChange={(e) => setDmtNom(e.target.value)}
                />
              </Field>
              <Field label="Cause principale">
                <select
                  className={selectCls}
                  style={{ borderColor: "#D8E0F0" }}
                  value={dmtCause}
                  onChange={(e) => setDmtCause(e.target.value)}
                >
                  {Object.entries(causesConfig.dmt).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="DMT actuelle (secondes)">
                <input
                  type="number"
                  className={inputCls}
                  style={{ borderColor: "#D8E0F0" }}
                  placeholder="ex. 310"
                  value={dmtActuel}
                  onChange={(e) => setDmtActuel(e.target.value)}
                />
              </Field>
              <Field label="DMT cible (secondes)">
                <input
                  type="number"
                  className={inputCls}
                  style={{ borderColor: "#D8E0F0" }}
                  value={dmtCible}
                  onChange={(e) => setDmtCible(e.target.value)}
                />
              </Field>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ background: VIOLET }}
                >
                  <Sparkles size={16} /> Générer le PAA
                </button>
              </div>
            </form>
          ) : tab === "commerce" ? (
            <form onSubmit={handleComSubmit} className="grid sm:grid-cols-2 gap-4">
              <Field label="Conseiller">
                <input
                  className={inputCls}
                  style={{ borderColor: "#D8E0F0" }}
                  placeholder="Nom du conseiller"
                  value={comNom}
                  onChange={(e) => setComNom(e.target.value)}
                />
              </Field>
              <Field label="Cause principale">
                <select
                  className={selectCls}
                  style={{ borderColor: "#D8E0F0" }}
                  value={comCause}
                  onChange={(e) => setComCause(e.target.value)}
                >
                  {Object.entries(causesConfig.commerce).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Taux de transformation actuel (%)">
                <input
                  type="number"
                  className={inputCls}
                  style={{ borderColor: "#D8E0F0" }}
                  placeholder="ex. 12"
                  value={comActuel}
                  onChange={(e) => setComActuel(e.target.value)}
                />
              </Field>
              <Field label="Taux cible (%)">
                <input
                  type="number"
                  className={inputCls}
                  style={{ borderColor: "#D8E0F0" }}
                  value={comCible}
                  onChange={(e) => setComCible(e.target.value)}
                />
              </Field>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ background: VIOLET }}
                >
                  <Sparkles size={16} /> Générer le PAA
                </button>
              </div>
            </form>
          ) : tab === "disc" ? (
            <form onSubmit={handleDiscSubmit} className="grid sm:grid-cols-2 gap-4">
              <Field label="Conseiller">
                <input
                  className={inputCls}
                  style={{ borderColor: "#D8E0F0" }}
                  placeholder="Nom du conseiller"
                  value={discNom}
                  onChange={(e) => setDiscNom(e.target.value)}
                />
              </Field>
              <Field label="Type de manquement">
                <select
                  className={selectCls}
                  style={{ borderColor: "#D8E0F0" }}
                  value={discCause}
                  onChange={(e) => setDiscCause(e.target.value)}
                >
                  {Object.entries(causesConfig.disc).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Mesure formelle (si nécessaire)">
                <select
                  className={selectCls}
                  style={{ borderColor: "#D8E0F0" }}
                  value={discMesure}
                  onChange={(e) => setDiscMesure(e.target.value)}
                >
                  <option value="Aucune">Aucune — traité en développement</option>
                  <option value="Avertissement oral">Avertissement oral</option>
                  <option value="Avertissement écrit">Avertissement écrit</option>
                </select>
              </Field>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ background: VIOLET }}
                >
                  <Sparkles size={16} /> Générer le plan de développement
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleFidSubmit} className="grid sm:grid-cols-2 gap-4">
              <Field label="Conseiller">
                <input
                  className={inputCls}
                  style={{ borderColor: "#D8E0F0" }}
                  placeholder="Nom du conseiller"
                  value={fidNom}
                  onChange={(e) => setFidNom(e.target.value)}
                />
              </Field>
              <Field label="Cause du risque de départ">
                <select
                  className={selectCls}
                  style={{ borderColor: "#D8E0F0" }}
                  value={fidCause}
                  onChange={(e) => setFidCause(e.target.value)}
                >
                  {Object.entries(causesConfig.fid).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ background: VIOLET }}
                >
                  <Sparkles size={16} /> Générer le plan de fidélisation
                </button>
              </div>
            </form>
          )}

          <div className="mt-4 pt-4 border-t" style={{ borderColor: "#E2E8F5" }}>
            <button
              onClick={() => setShowManualEntry(true)}
              className="text-xs font-semibold underline underline-offset-2 hover:opacity-70"
              style={{ color: SKY }}
            >
              Le cas ne correspond à aucune cause proposée ? Saisir un plan manuellement
            </button>
          </div>
        </div>

        {/* Cause bank preview */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: SKY }}>
            Banque de techniques —{" "}
            {tab === "dmt"
              ? "DMT"
              : tab === "commerce"
              ? "Commerce"
              : tab === "disc"
              ? "Registre disciplinaire"
              : "Fidélisation"}
          </h2>
          <p className="text-xs mb-2" style={{ color: SKY }}>
            Clique une carte pour sélectionner cette cause dans le formulaire ci-dessus.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {Object.entries(causes).map(([k, v]) => {
              const active =
                tab === "dmt"
                  ? dmtCause === k
                  : tab === "commerce"
                  ? comCause === k
                  : tab === "disc"
                  ? discCause === k
                  : fidCause === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() =>
                    tab === "dmt"
                      ? setDmtCause(k)
                      : tab === "commerce"
                      ? setComCause(k)
                      : tab === "disc"
                      ? setDiscCause(k)
                      : setFidCause(k)
                  }
                  className="text-left rounded-lg border p-3 bg-white transition hover:shadow-md cursor-pointer"
                  style={{
                    borderColor: active ? VIOLET : "#E2E8F5",
                    borderWidth: active ? 2 : 1,
                    background: active ? "#F5F2FB" : "white",
                  }}
                >
                  <div className="text-sm font-semibold mb-1 flex items-center gap-1.5" style={{ color: NAVY }}>
                    {active && <CheckCircle2 size={14} color={VIOLET} />}
                    {v.label}
                  </div>
                  <div className="text-xs" style={{ color: SKY }}>
                    {v.outil}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* DMT tools library — the actual content the technique bank refers to */}
        {(tab === "dmt" || tab === "commerce") && (
          <div className="mb-8 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold tracking-wide uppercase" style={{ color: SKY }}>
                Outils {tab === "dmt" ? "DMT" : "Commerce"} — utilisables directement en écoute
              </h2>
              {user.role === "admin" && (
                <button
                  onClick={() => setShowToolsEditor(true)}
                  className="text-xs font-semibold underline underline-offset-2 hover:opacity-70"
                  style={{ color: SKY }}
                >
                  Gérer les outils
                </button>
              )}
            </div>
            {toolsConfig[tab].map((tool, idx) => (
              <div key={tool.id || idx} className="rounded-lg border p-4 bg-white" style={{ borderColor: "#E2E8F5" }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-sm font-semibold" style={{ color: NAVY }}>
                    {tool.title}
                  </div>
                  {tool.profil && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "#EEF1FA", color: VIOLET }}>
                      {tool.profil}
                    </span>
                  )}
                </div>

                {tool.type === "script" && (
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="text-sm italic rounded-md px-3 py-2 flex-1"
                      style={{ background: "#F7F9FD", color: NAVY, fontFamily: "Georgia, serif" }}
                    >
                      « {tool.content} »
                    </div>
                    <button
                      onClick={() => copyRebond(tool.content, `dmt-${idx}`)}
                      className="shrink-0 text-xs flex items-center gap-1 px-2 py-1 rounded-full transition hover:opacity-80"
                      style={{ background: "#EEF1FA", color: SKY }}
                    >
                      <Copy size={11} /> {copiedRebond === `dmt-${idx}` ? "Copié" : "Copier"}
                    </button>
                  </div>
                )}

                {(tool.type === "grille" || tool.type === "fiche") && (
                  <div className="overflow-x-auto">
                    {tool.type === "grille" && (
                      <div className="mb-3 flex items-center justify-between">
                        <div className="text-[11px]" style={{ color: SKY }}>
                          Coche OK ou KO par phase — l'outil génère automatiquement les écarts et les axes d'amélioration à partir des items en KO.
                        </div>
                        <button
                          onClick={() => telechargerModeleGrille(tool)}
                          className="text-[11px] font-semibold flex items-center gap-1 px-2 py-1 rounded-full transition hover:opacity-80 shrink-0"
                          style={{ background: "#EEF1FA", color: SKY }}
                        >
                          <Download size={11} /> Modèle vierge (PDF)
                        </button>
                      </div>
                    )}
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ color: VIOLET }}>
                          {tool.type === "grille" ? (
                            <>
                              <th className="text-left font-bold uppercase py-1 pr-3">Phase</th>
                              <th className="text-left font-bold uppercase py-1 pr-3">Cible</th>
                              <th className="text-left font-bold uppercase py-1 pr-3">Point de vigilance</th>
                              <th className="text-left font-bold uppercase py-1">Constat</th>
                            </>
                          ) : (
                            <>
                              <th className="text-left font-bold uppercase py-1 pr-3">Motif</th>
                              <th className="text-left font-bold uppercase py-1 pr-3">Où chercher</th>
                              <th className="text-left font-bold uppercase py-1">Cible</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {tool.rows.map((row, ri) => {
                          const statut = grilleNotes[tool.id]?.[ri]; // "ok" | "ko" | undefined
                          const setStatut = (v) =>
                            setGrilleNotes((s) => ({
                              ...s,
                              [tool.id]: { ...(s[tool.id] || {}), [ri]: s[tool.id]?.[ri] === v ? undefined : v },
                            }));
                          return (
                            <tr key={ri} style={{ borderTop: "1px solid #EEF1FA" }}>
                              {tool.type === "grille" ? (
                                <>
                                  <td className="py-1.5 pr-3 align-top" style={{ color: NAVY }}>{row.phase}</td>
                                  <td className="py-1.5 pr-3 align-top font-semibold" style={{ color: VIOLET }}>{row.cible}</td>
                                  <td className="py-1.5 pr-3 align-top" style={{ color: SKY }}>{row.vigilance}</td>
                                  <td className="py-1.5 align-top">
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => setStatut("ok")}
                                        className="text-[10px] font-semibold px-2 py-1 rounded transition"
                                        style={{
                                          background: statut === "ok" ? "#EAF7EF" : "#F7F9FD",
                                          color: statut === "ok" ? "#2F9E56" : "#9FADC2",
                                          border: `1px solid ${statut === "ok" ? "#2F9E56" : "#E2E8F5"}`,
                                        }}
                                      >
                                        ✓ OK
                                      </button>
                                      <button
                                        onClick={() => setStatut("ko")}
                                        className="text-[10px] font-semibold px-2 py-1 rounded transition"
                                        style={{
                                          background: statut === "ko" ? "#FDECEC" : "#F7F9FD",
                                          color: statut === "ko" ? "#B3261E" : "#9FADC2",
                                          border: `1px solid ${statut === "ko" ? "#B3261E" : "#E2E8F5"}`,
                                        }}
                                      >
                                        ✕ KO
                                      </button>
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="py-1.5 pr-3" style={{ color: NAVY }}>{row.motif}</td>
                                  <td className="py-1.5 pr-3" style={{ color: SKY }}>{row.source}</td>
                                  <td className="py-1.5 font-semibold" style={{ color: VIOLET }}>{row.cible}</td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {tool.type === "fiche" && (
                      <div className="text-[11px] mt-2" style={{ color: SKY }}>
                        Exemple à adapter : remplace les sources ci-dessus par les menus réels de votre CRM.
                      </div>
                    )}

                    {tool.type === "grille" && (() => {
                      const kos = tool.rows
                        .map((row, ri) => ({ phase: row.phase, vigilance: row.vigilance, statut: grilleNotes[tool.id]?.[ri] }))
                        .filter((r) => r.statut === "ko");
                      if (kos.length === 0) return null;
                      return (
                        <div className="mt-3 rounded-md px-3 py-2 space-y-2" style={{ background: "#FDECEC" }}>
                          <div className="text-xs font-semibold" style={{ color: "#B3261E" }}>
                            Axe{kos.length > 1 ? "s" : ""} d'amélioration : {kos.map((k) => k.phase).join(", ")}
                          </div>
                          <ul className="text-xs list-disc pl-4" style={{ color: "#8A2020" }}>
                            {kos.map((k, i) => (
                              <li key={i}>{k.vigilance}</li>
                            ))}
                          </ul>
                          <input
                            type="text"
                            placeholder="Commentaire (optionnel) — contexte utile pour le suivi, laisse vide si rien à ajouter"
                            className="w-full rounded border px-2 py-1 text-xs"
                            style={{ borderColor: "#D8E0F0" }}
                            value={grilleCommentaire}
                            onChange={(e) => setGrilleCommentaire(e.target.value)}
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Nom du conseiller concerné"
                              className="rounded border px-2 py-1 text-xs flex-1"
                              style={{ borderColor: "#D8E0F0" }}
                              value={grilleConseillerNom}
                              onChange={(e) => setGrilleConseillerNom(e.target.value)}
                            />
                            <button
                              onClick={() => genererPAADepuisConstats(tool, tab)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-full text-white transition hover:opacity-90 whitespace-nowrap"
                              style={{ background: "#B3261E" }}
                            >
                              Générer le PAA
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Guided questioning method — the actual technique used to coach conseillers */}
        {tab === "commerce" && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: SKY }}>
              Méthode du questionnement guidé
            </h2>
            <p className="text-xs mb-3" style={{ color: SKY }}>
              Le principe : ne jamais proposer à froid. Guider le client avec des questions ouvertes
              jusqu'à ce que l'offre découle naturellement de ce qu'il vient de dire lui-même.
            </p>

            <div className="grid sm:grid-cols-4 gap-2 mb-4">
              {QUESTIONING_STEPS.map((s) => (
                <div key={s.key} className="rounded-lg border p-3" style={{ borderColor: "#E2E8F5", background: "#F7F9FD" }}>
                  <div className="text-xs font-bold mb-1" style={{ color: VIOLET }}>
                    {s.label}
                  </div>
                  <div className="text-[11px]" style={{ color: SKY }}>
                    {s.role}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {GUIDED_QUESTIONING.map((g, idx) => {
                const sequence = QUESTIONING_STEPS.map((s) => g[s.key]).join("\n");
                return (
                  <div key={idx} className="rounded-lg border p-4 bg-white" style={{ borderColor: "#E2E8F5" }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-sm font-semibold" style={{ color: NAVY }}>
                        {g.typologie}
                      </span>
                      <button
                        onClick={() => copyRebond(sequence, idx)}
                        className="shrink-0 text-xs flex items-center gap-1 px-2 py-1 rounded-full transition hover:opacity-80"
                        style={{ background: "#EEF1FA", color: SKY }}
                      >
                        <Copy size={11} /> {copiedRebond === idx ? "Copié" : "Copier la séquence"}
                      </button>
                    </div>
                    <ol className="space-y-1.5">
                      {QUESTIONING_STEPS.map((s, si) => (
                        <li key={s.key} className="text-sm flex gap-2" style={{ color: NAVY }}>
                          <span className="font-bold shrink-0" style={{ color: VIOLET }}>
                            {si + 1}.
                          </span>
                          <span style={{ fontFamily: "Georgia, serif" }}>« {g[s.key]} »</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tableau de bord */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold tracking-wide uppercase" style={{ color: SKY }}>
              Tableau de bord
            </h2>
            <button
              onClick={() => setShowDashboard((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition hover:opacity-80"
              style={{ background: showDashboard ? VIOLET : "white", color: showDashboard ? "white" : VIOLET, border: `1px solid ${VIOLET}` }}
            >
              {showDashboard ? "Masquer" : "Afficher"}
            </button>
          </div>

          {showDashboard && loaded && (() => {
            const total = history.length;
            const atteints = history.filter((p) => p.status === "atteint");
            const tauxResolution = total > 0 ? Math.round((atteints.length / total) * 100) : 0;

            const delais = atteints
              .filter((p) => p.atteintAt)
              .map((p) => Math.round((new Date(p.atteintAt).getTime() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
            const delaiMoyen = delais.length > 0 ? Math.round(delais.reduce((a, b) => a + b, 0) / delais.length) : null;

            const parTheme = {};
            history.forEach((p) => {
              parTheme[p.theme] = (parTheme[p.theme] || 0) + 1;
            });

            const parEquipe = {};
            history.forEach((p) => {
              const key = p.equipe || "—";
              parEquipe[key] = (parEquipe[key] || 0) + 1;
            });

            const parCause = {};
            history.forEach((p) => {
              const key = p.causeLabel || "—";
              parCause[key] = (parCause[key] || 0) + 1;
            });
            const topCauses = Object.entries(parCause).sort((a, b) => b[1] - a[1]).slice(0, 5);

            if (total === 0) {
              return (
                <div className="rounded-lg border border-dashed p-6 text-sm text-center" style={{ borderColor: "#D8E0F0", color: SKY }}>
                  Pas encore de données pour ce tableau de bord.
                </div>
              );
            }

            return (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-4 gap-3">
                  {[
                    { label: "Plans générés", value: total },
                    { label: "Résolus", value: `${atteints.length} (${tauxResolution}%)` },
                    { label: "En cours", value: total - atteints.length },
                    { label: "Délai moyen de résolution", value: delaiMoyen !== null ? `${delaiMoyen} j` : "—" },
                  ].map((stat, i) => (
                    <div key={i} className="rounded-lg border p-4 bg-white" style={{ borderColor: "#E2E8F5" }}>
                      <div className="text-2xl font-bold" style={{ color: NAVY }}>{stat.value}</div>
                      <div className="text-xs mt-1" style={{ color: SKY }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border p-4 bg-white" style={{ borderColor: "#E2E8F5" }}>
                    <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: VIOLET }}>Par module</div>
                    {Object.entries(parTheme).map(([t, count]) => (
                      <div key={t} className="flex items-center justify-between text-sm py-1">
                        <span style={{ color: NAVY }}>{themeLabel(t)}</span>
                        <span className="font-semibold" style={{ color: SKY }}>{count}</span>
                      </div>
                    ))}
                  </div>

                  {user.role === "admin" && (
                    <div className="rounded-lg border p-4 bg-white" style={{ borderColor: "#E2E8F5" }}>
                      <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: VIOLET }}>Par équipe</div>
                      {Object.entries(parEquipe).map(([eq, count]) => (
                        <div key={eq} className="flex items-center justify-between text-sm py-1">
                          <span style={{ color: NAVY }}>{equipeLabel(eq, equipesList)}</span>
                          <span className="font-semibold" style={{ color: SKY }}>{count}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="rounded-lg border p-4 bg-white sm:col-span-2" style={{ borderColor: "#E2E8F5" }}>
                    <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: VIOLET }}>Causes les plus fréquentes</div>
                    {topCauses.map(([cause, count]) => (
                      <div key={cause} className="flex items-center justify-between text-sm py-1">
                        <span style={{ color: NAVY }}>{cause}</span>
                        <span className="font-semibold" style={{ color: SKY }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* History */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold tracking-wide uppercase" style={{ color: SKY }}>
              Plans d'accompagnement générés {loaded && history.length > 0 ? `(${history.length})` : ""}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={exportExcelReport}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition hover:opacity-80"
                style={{ background: VIOLET, color: "white" }}
              >
                <FileSpreadsheet size={13} /> Rapport Excel
              </button>
              <button
                onClick={exportSimpleExcel}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition hover:opacity-80"
                style={{ background: "white", color: NAVY, border: `1px solid ${NAVY}` }}
              >
                <Download size={13} /> Excel simple
              </button>
            </div>
          </div>

          {loaded && history.length === 0 && (
            <div
              className="rounded-lg border border-dashed p-6 text-sm text-center"
              style={{ borderColor: "#D8E0F0", color: SKY }}
            >
              Aucun PAA pour l'instant. Renseigne un écart ci-dessus pour en générer un.
            </div>
          )}

          <div className="space-y-4">
            {history.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border bg-white overflow-hidden"
                style={{ borderColor: p.status === "atteint" ? "#B9E0C4" : "#E2E8F5" }}
              >
                <div
                  className="px-5 py-3 flex items-center justify-between"
                  style={{ background: p.status === "atteint" ? "#F0FAF3" : "#F7F9FD" }}
                >
                  <div className="flex items-center gap-2">
                    {p.status === "atteint" ? (
                      <CheckCircle2 size={16} color="#2F9E56" />
                    ) : (
                      <AlertTriangle size={16} color={YELLOW} />
                    )}
                    <span className="font-semibold text-sm" style={{ color: NAVY }}>
                      {p.nom}
                    </span>
                    {p.equipe && (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                        style={{ background: "#EEF1FA", color: VIOLET }}
                      >
                        {equipeLabel(p.equipe, equipesList)}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: SKY }}>
                      {p.theme === "disc"
                        ? `· ${p.causeLabel} — ${p.mesureFormelle}`
                        : p.theme === "fid"
                        ? `· ${p.causeLabel}`
                        : `· ${p.metricLabel} ${p.actuel} → cible ${p.cible}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.status !== "atteint" && (
                      <button
                        onClick={() => markAtteint(p.id)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-full transition hover:opacity-80"
                        style={{ background: "#E9F7ED", color: "#2F9E56" }}
                      >
                        Objectif atteint
                      </button>
                    )}
                    <button
                      onClick={() => copyPAA(p)}
                      className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-full transition hover:opacity-80"
                      style={{ background: "#EEF1FA", color: SKY }}
                    >
                      <Copy size={12} /> {copiedId === p.id ? "Copié" : "Copier"}
                    </button>
                    <button
                      onClick={() => exportPAAPdf(p, equipesList)}
                      className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-full transition hover:opacity-80"
                      style={{ background: "#EEF1FA", color: SKY }}
                    >
                      <Download size={12} /> PDF
                    </button>
                    {p.dateEcheance && (
                      <button
                        onClick={() => exportPAAIcs(p)}
                        className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-full transition hover:opacity-80"
                        style={{ background: "#EEF1FA", color: SKY }}
                        title="Ajoute un rappel dans Outlook / Teams"
                      >
                        <ClipboardList size={12} /> Rappel
                      </button>
                    )}
                    <button
                      onClick={() => removePAA(p.id)}
                      className="p-1.5 rounded-full transition hover:opacity-70"
                      style={{ color: "#C0576B" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {p.status === "atteint" ? (
                  <div className="px-5 py-3 text-sm" style={{ color: "#2F9E56" }}>
                    <ChevronRight size={14} className="inline -mt-0.5 mr-1" />
                    {p.felicitation}
                  </div>
                ) : (
                  <div className="px-5 py-4 text-sm space-y-3" style={{ color: NAVY }}>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: VIOLET }}>
                        Indicateur écart
                      </div>
                      <div>{p.indicateurEcart}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: VIOLET }}>
                        Description des actions factuelles à mettre en place
                      </div>
                      <ul className="list-disc pl-5 space-y-0.5">
                        {p.actionsFactuelles.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: VIOLET }}>
                        Commentaire
                      </div>
                      <div>{p.commentaire}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: VIOLET }}>
                        Suivi SMART
                      </div>
                      <div>{p.suiviSmart}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showManualEntry && (
        <ManualEntryModal
          user={user}
          defaultEquipe={selectedEquipe}
          equipesList={equipesList}
          onClose={() => setShowManualEntry(false)}
          onCreate={(entry) => {
            addEntry(entry);
            setShowManualEntry(false);
            showToast("Plan manuel enregistré.");
          }}
        />
      )}

      {showUsers && user.role === "admin" && (
        <UserManagementModal token={token} equipesList={equipesList} onClose={() => setShowUsers(false)} showToast={showToast} />
      )}

      {showCausesEditor && user.role === "admin" && (
        <CausesEditorModal
          token={token}
          causesConfig={causesConfig}
          setCausesConfig={setCausesConfig}
          onClose={() => setShowCausesEditor(false)}
          showToast={showToast}
        />
      )}

      {showToolsEditor && user.role === "admin" && (
        <ToolsEditorModal
          token={token}
          toolsConfig={toolsConfig}
          setToolsConfig={setToolsConfig}
          initialTheme={tab === "commerce" ? "commerce" : "dmt"}
          onClose={() => setShowToolsEditor(false)}
          showToast={showToast}
        />
      )}

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full text-sm font-medium text-white shadow-lg"
          style={{ background: NAVY }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function UserManagementModal({ token, equipesList, onClose, showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newRole, setNewRole] = useState("superviseur");
  const [newEquipe, setNewEquipe] = useState(DEFAULT_EQUIPES[0].id);
  const [busy, setBusy] = useState(false);

  const authHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users", { headers: authHeaders() });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      showToast("Impossible de charger la liste des utilisateurs.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newUsername.trim() || newPassword.length < 6) {
      showToast("Identifiant requis, mot de passe de 6 caractères minimum.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword,
          displayName: newDisplayName.trim() || newUsername.trim(),
          role: newRole,
          equipe: newRole === "admin" ? null : newEquipe,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Création impossible.");
        setBusy(false);
        return;
      }
      setNewUsername("");
      setNewPassword("");
      setNewDisplayName("");
      showToast("Utilisateur créé.");
      loadUsers();
    } catch (e) {
      showToast("Création impossible — réessaie.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("failed");
      showToast("Utilisateur supprimé.");
      loadUsers();
    } catch (e) {
      showToast("Suppression impossible.");
    }
  }

  async function handleResetPassword(id) {
    const newPassword = window.prompt("Nouveau mot de passe pour ce compte (6 caractères minimum) :");
    if (!newPassword) return;
    if (newPassword.length < 6) {
      showToast("Mot de passe trop court (6 caractères minimum).");
      return;
    }
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ id, newPassword }),
      });
      if (!res.ok) throw new Error("failed");
      showToast("Mot de passe réinitialisé.");
    } catch (e) {
      showToast("Réinitialisation impossible.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(23,58,107,0.55)" }}>
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: NAVY, fontFamily: "Georgia, serif" }}>
            Gestion des utilisateurs
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:opacity-70">
            <X size={18} color={SKY} />
          </button>
        </div>

        <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-3 mb-6 border-b pb-6" style={{ borderColor: "#E2E8F5" }}>
          <Field label="Identifiant">
            <input className={inputCls} style={{ borderColor: "#D8E0F0" }} value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
          </Field>
          <Field label="Nom affiché">
            <input className={inputCls} style={{ borderColor: "#D8E0F0" }} value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} placeholder="optionnel" />
          </Field>
          <Field label="Mot de passe (6 car. min.)">
            <input type="password" className={inputCls} style={{ borderColor: "#D8E0F0" }} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </Field>
          <Field label="Rôle">
            <select className={selectCls} style={{ borderColor: "#D8E0F0" }} value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <option value="superviseur">Superviseur</option>
              <option value="admin">Administrateur</option>
            </select>
          </Field>
          {newRole !== "admin" && (
            <Field label="Équipe">
              <select className={selectCls} style={{ borderColor: "#D8E0F0" }} value={newEquipe} onChange={(e) => setNewEquipe(e.target.value)}>
                {equipesList.map((eq) => (
                  <option key={eq.id} value={eq.id}>{equipeLabel(eq.id, equipesList)}</option>
                ))}
              </select>
            </Field>
          )}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              style={{ background: VIOLET }}
            >
              <UserPlus size={15} /> Créer l'utilisateur
            </button>
          </div>
        </form>

        {loading ? (
          <div className="text-sm" style={{ color: SKY }}>Chargement...</div>
        ) : users.length === 0 ? (
          <div className="text-sm" style={{ color: SKY }}>Aucun utilisateur pour l'instant.</div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between text-sm rounded-md px-3 py-2" style={{ background: "#F7F9FD" }}>
                <div>
                  <span className="font-semibold" style={{ color: NAVY }}>{u.displayName || u.username}</span>{" "}
                  <span style={{ color: SKY }}>
                    · {u.username} · {u.role === "admin" ? "Administrateur" : equipeLabel(u.equipe, equipesList)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleResetPassword(u.id)}
                    className="p-1.5 rounded-full transition hover:opacity-70"
                    style={{ color: VIOLET }}
                    title="Réinitialiser le mot de passe"
                  >
                    <KeyRound size={14} />
                  </button>
                  <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-full transition hover:opacity-70" style={{ color: "#C0576B" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const THEME_LABELS = { dmt: "DMT", commerce: "Commerce", disc: "Registre disciplinaire", fid: "Fidélisation" };

function CausesEditorModal({ token, causesConfig, setCausesConfig, onClose, showToast }) {
  const [theme, setTheme] = useState("dmt");
  const [causeKey, setCauseKey] = useState(Object.keys(causesConfig.dmt)[0]);
  const [label, setLabel] = useState("");
  const [outil, setOutil] = useState("");
  const [actionsText, setActionsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);

  const authHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` });

  const bank = causesConfig[theme];
  const keys = Object.keys(bank);

  useEffect(() => {
    const first = Object.keys(causesConfig[theme])[0];
    setCauseKey(first);
    setCreatingNew(false);
  }, [theme]);

  useEffect(() => {
    if (creatingNew) {
      setLabel("");
      setOutil("");
      setActionsText("");
      return;
    }
    const c = causesConfig[theme][causeKey];
    if (c) {
      setLabel(c.label || "");
      setOutil(c.outil || "");
      setActionsText((c.actions || []).join("\n"));
    }
  }, [theme, causeKey, causesConfig, creatingNew]);

  function slugify(text) {
    return text
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "cause";
  }

  async function handleSave() {
    if (!label.trim() || !outil.trim()) {
      showToast("Le libellé et l'outil ne peuvent pas être vides.");
      return;
    }
    const actions = actionsText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (actions.length === 0) {
      showToast("Renseigne au moins une action.");
      return;
    }

    let key = causeKey;
    if (creatingNew) {
      let base = slugify(label);
      key = base;
      let n = 2;
      while (bank[key]) {
        key = `${base}-${n}`;
        n += 1;
      }
    }

    const updatedBank = { ...causesConfig[theme], [key]: { label: label.trim(), outil: outil.trim(), actions } };
    const nextConfig = { ...causesConfig, [theme]: updatedBank };

    setSaving(true);
    try {
      const res = await fetch("/api/causes", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ causes: nextConfig }),
      });
      if (!res.ok) throw new Error("save failed");
      setCausesConfig(nextConfig);
      showToast(creatingNew ? "Nouvelle cause ajoutée." : "Banque de techniques mise à jour.");
      setCreatingNew(false);
      setCauseKey(key);
    } catch (e) {
      showToast("Sauvegarde impossible — réessaie.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCause() {
    if (keys.length <= 1) {
      showToast("Il doit rester au moins une cause pour ce module.");
      return;
    }
    const updatedBank = { ...causesConfig[theme] };
    delete updatedBank[causeKey];
    const nextConfig = { ...causesConfig, [theme]: updatedBank };
    setSaving(true);
    try {
      const res = await fetch("/api/causes", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ causes: nextConfig }),
      });
      if (!res.ok) throw new Error("save failed");
      setCausesConfig(nextConfig);
      showToast("Cause supprimée.");
      setCauseKey(Object.keys(updatedBank)[0]);
    } catch (e) {
      showToast("Suppression impossible — réessaie.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(23,58,107,0.55)" }}>
      <div className="bg-white rounded-xl w-full max-w-xl max-h-[85vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold" style={{ color: NAVY, fontFamily: "Georgia, serif" }}>
            Banque de techniques
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:opacity-70">
            <X size={18} color={SKY} />
          </button>
        </div>
        <p className="text-xs mb-4" style={{ color: SKY }}>
          Modifie les causes proposées dans chaque module, sans toucher au code. Les
          changements s'appliquent à tous les utilisateurs dès l'enregistrement.
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <Field label="Module">
            <select className={selectCls} style={{ borderColor: "#D8E0F0" }} value={theme} onChange={(e) => setTheme(e.target.value)}>
              {Object.keys(THEME_LABELS).map((t) => (
                <option key={t} value={t}>{THEME_LABELS[t]}</option>
              ))}
            </select>
          </Field>
          <Field label="Cause à modifier">
            <select
              className={selectCls}
              style={{ borderColor: "#D8E0F0" }}
              value={creatingNew ? "__new__" : causeKey}
              onChange={(e) => {
                if (e.target.value === "__new__") {
                  setCreatingNew(true);
                } else {
                  setCreatingNew(false);
                  setCauseKey(e.target.value);
                }
              }}
            >
              {keys.map((k) => (
                <option key={k} value={k}>{bank[k].label}</option>
              ))}
              <option value="__new__">+ Nouvelle cause…</option>
            </select>
          </Field>
        </div>

        <div className="space-y-3">
          <Field label="Libellé de la cause">
            <input className={inputCls} style={{ borderColor: "#D8E0F0" }} value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field>
          <Field label="Outil recommandé">
            <textarea
              className={inputCls}
              style={{ borderColor: "#D8E0F0", minHeight: "4.5rem" }}
              value={outil}
              onChange={(e) => setOutil(e.target.value)}
            />
          </Field>
          <Field label="Actions factuelles (une par ligne)">
            <textarea
              className={inputCls}
              style={{ borderColor: "#D8E0F0", minHeight: "7rem" }}
              value={actionsText}
              onChange={(e) => setActionsText(e.target.value)}
            />
          </Field>
        </div>

        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ background: VIOLET }}
          >
            {saving ? "Enregistrement..." : creatingNew ? "Créer cette cause" : "Enregistrer cette cause"}
          </button>
          {!creatingNew && (
            <button
              onClick={handleDeleteCause}
              className="text-xs font-semibold px-3 py-2 rounded-md transition hover:opacity-80"
              style={{ color: "#C0576B" }}
            >
              Supprimer cette cause
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ManualEntryModal({ user, defaultEquipe, equipesList, onClose, onCreate }) {
  const [nom, setNom] = useState("");
  const [equipe, setEquipe] = useState(defaultEquipe || (user.equipe || DEFAULT_EQUIPES[0].id));
  const [theme, setTheme] = useState("dmt");
  const [indicateurEcart, setIndicateurEcart] = useState("");
  const [actionsText, setActionsText] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [suiviSmart, setSuiviSmart] = useState("");
  const [dateEcheance, setDateEcheance] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!nom.trim() || !indicateurEcart.trim() || !actionsText.trim()) {
      return;
    }
    const actions = actionsText.split("\n").map((l) => l.trim()).filter(Boolean);
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      theme,
      nom: nom.trim(),
      equipe: user.role === "admin" ? equipe : user.equipe,
      createdAt: new Date().toISOString(),
      dateEcheance: dateEcheance ? new Date(dateEcheance).toISOString() : null,
      status: "en cours",
      causeLabel: "Saisie manuelle",
      metricLabel: "",
      actuel: "",
      cible: "",
      indicateurEcart: indicateurEcart.trim(),
      actionsFactuelles: actions,
      commentaire: commentaire.trim() || "—",
      suiviSmart: suiviSmart.trim() || "Suivi à définir manuellement avec le superviseur.",
      felicitation: "Objectif atteint : à valoriser auprès du conseiller.",
    };
    onCreate(entry);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(23,58,107,0.55)" }}>
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold" style={{ color: NAVY, fontFamily: "Georgia, serif" }}>
            Plan d'accompagnement manuel
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:opacity-70">
            <X size={18} color={SKY} />
          </button>
        </div>
        <p className="text-xs mb-4" style={{ color: SKY }}>
          Pour une situation qui ne correspond à aucune cause proposée par l'outil — remplis
          librement chaque champ.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Conseiller">
              <input className={inputCls} style={{ borderColor: "#D8E0F0" }} value={nom} onChange={(e) => setNom(e.target.value)} />
            </Field>
            <Field label="Module">
              <select className={selectCls} style={{ borderColor: "#D8E0F0" }} value={theme} onChange={(e) => setTheme(e.target.value)}>
                {Object.keys(THEME_LABELS).map((t) => (
                  <option key={t} value={t}>{THEME_LABELS[t]}</option>
                ))}
              </select>
            </Field>
          </div>

          {user.role === "admin" && (
            <Field label="Équipe">
              <select className={selectCls} style={{ borderColor: "#D8E0F0" }} value={equipe} onChange={(e) => setEquipe(e.target.value)}>
                {equipesList.map((eq) => (
                  <option key={eq.id} value={eq.id}>{equipeLabel(eq.id, equipesList)}</option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Indicateur écart">
            <textarea className={inputCls} style={{ borderColor: "#D8E0F0", minHeight: "3.5rem" }} value={indicateurEcart} onChange={(e) => setIndicateurEcart(e.target.value)} />
          </Field>
          <Field label="Actions factuelles (une par ligne)">
            <textarea className={inputCls} style={{ borderColor: "#D8E0F0", minHeight: "5rem" }} value={actionsText} onChange={(e) => setActionsText(e.target.value)} />
          </Field>
          <Field label="Commentaire (optionnel)">
            <textarea className={inputCls} style={{ borderColor: "#D8E0F0", minHeight: "3rem" }} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} />
          </Field>
          <Field label="Suivi SMART (optionnel)">
            <textarea className={inputCls} style={{ borderColor: "#D8E0F0", minHeight: "3rem" }} value={suiviSmart} onChange={(e) => setSuiviSmart(e.target.value)} />
          </Field>
          <Field label="Date d'échéance de suivi (optionnel)">
            <input type="date" className={inputCls} style={{ borderColor: "#D8E0F0" }} value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)} />
          </Field>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: VIOLET }}
          >
            <Sparkles size={16} /> Enregistrer ce plan
          </button>
        </form>
      </div>
    </div>
  );
}

function rowsToText(tool) {
  if (!tool.rows) return "";
  if (tool.type === "grille") {
    return tool.rows.map((r) => `${r.phase} | ${r.cible} | ${r.vigilance}`).join("\n");
  }
  if (tool.type === "fiche") {
    return tool.rows.map((r) => `${r.motif} | ${r.source} | ${r.cible}`).join("\n");
  }
  return "";
}

function textToRows(type, text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.map((line) => {
    const parts = line.split("|").map((p) => p.trim());
    if (type === "grille") {
      return { phase: parts[0] || "", cible: parts[1] || "", vigilance: parts[2] || "" };
    }
    return { motif: parts[0] || "", source: parts[1] || "", cible: parts[2] || "" };
  });
}

function ToolsEditorModal({ token, toolsConfig, setToolsConfig, initialTheme, onClose, showToast }) {
  const [theme, setTheme] = useState(initialTheme || "dmt");
  const tools = toolsConfig[theme] || [];
  const [selectedId, setSelectedId] = useState(tools[0]?.id || null);
  const [title, setTitle] = useState("");
  const [profil, setProfil] = useState("Tous profils");
  const [type, setType] = useState("script");
  const [content, setContent] = useState("");
  const [rowsText, setRowsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);

  const authHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` });

  useEffect(() => {
    const first = (toolsConfig[theme] || [])[0]?.id || null;
    setSelectedId(first);
    setCreatingNew(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  useEffect(() => {
    if (creatingNew) {
      setTitle("");
      setProfil("Tous profils");
      setType("script");
      setContent("");
      setRowsText("");
      return;
    }
    const t = (toolsConfig[theme] || []).find((x) => x.id === selectedId);
    if (t) {
      setTitle(t.title || "");
      setProfil(t.profil || "Tous profils");
      setType(t.type || "script");
      setContent(t.content || "");
      setRowsText(rowsToText(t));
    }
  }, [selectedId, creatingNew, theme, toolsConfig]);

  async function persistTools(nextThemeTools) {
    setSaving(true);
    const nextConfig = { ...toolsConfig, [theme]: nextThemeTools };
    try {
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ tools: nextConfig }),
      });
      if (!res.ok) throw new Error("save failed");
      setToolsConfig(nextConfig);
      return true;
    } catch (e) {
      showToast("Sauvegarde impossible — réessaie.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      showToast("Le titre est requis.");
      return;
    }
    if (type === "script" && !content.trim()) {
      showToast("Le contenu du script ne peut pas être vide.");
      return;
    }
    if (type !== "script" && !rowsText.trim()) {
      showToast("Ajoute au moins une ligne.");
      return;
    }

    const currentTools = toolsConfig[theme] || [];
    const base = {
      id: creatingNew ? (Date.now().toString(36) + Math.random().toString(36).slice(2, 7)) : selectedId,
      title: title.trim(),
      profil: profil.trim() || "Tous profils",
      type,
    };
    const toolData = type === "script" ? { ...base, content: content.trim() } : { ...base, rows: textToRows(type, rowsText) };

    let next;
    if (creatingNew) {
      next = [...currentTools, toolData];
    } else {
      next = currentTools.map((t) => (t.id === selectedId ? toolData : t));
    }

    const ok = await persistTools(next);
    if (ok) {
      showToast(creatingNew ? "Outil ajouté." : "Outil mis à jour.");
      setCreatingNew(false);
      setSelectedId(toolData.id);
    }
  }

  async function handleDelete() {
    const currentTools = toolsConfig[theme] || [];
    if (currentTools.length <= 1) {
      showToast("Il doit rester au moins un outil pour ce module.");
      return;
    }
    const next = currentTools.filter((t) => t.id !== selectedId);
    const ok = await persistTools(next);
    if (ok) {
      showToast("Outil supprimé.");
      setSelectedId(next[0]?.id || null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(23,58,107,0.55)" }}>
      <div className="bg-white rounded-xl w-full max-w-xl max-h-[85vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold" style={{ color: NAVY, fontFamily: "Georgia, serif" }}>
            Boîte à outils
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:opacity-70">
            <X size={18} color={SKY} />
          </button>
        </div>
        <p className="text-xs mb-4" style={{ color: SKY }}>
          Ajoute, modifie ou retire des outils (grilles, scripts, fiches réflexes), et
          adapte-les par profil de conseiller si besoin.
        </p>

        <div className="mb-4">
          <Field label="Module">
            <select className={selectCls} style={{ borderColor: "#D8E0F0", width: "auto" }} value={theme} onChange={(e) => setTheme(e.target.value)}>
              {TOOLS_THEMES.map((t) => (
                <option key={t} value={t}>{t === "dmt" ? "DMT" : "Commerce"}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => { setCreatingNew(false); setSelectedId(t.id); }}
              className="text-xs px-2.5 py-1 rounded-full transition"
              style={{
                background: !creatingNew && selectedId === t.id ? VIOLET : "white",
                color: !creatingNew && selectedId === t.id ? "white" : VIOLET,
                border: `1px solid ${VIOLET}`,
              }}
            >
              {t.title}
            </button>
          ))}
          <button
            onClick={() => setCreatingNew(true)}
            className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-full transition"
            style={{ background: creatingNew ? YELLOW : "white", color: NAVY, border: `1px solid ${YELLOW}` }}
          >
            <Sparkles size={11} /> Nouvel outil
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Titre">
              <input className={inputCls} style={{ borderColor: "#D8E0F0" }} value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Profil concerné">
              <input className={inputCls} style={{ borderColor: "#D8E0F0" }} value={profil} onChange={(e) => setProfil(e.target.value)} placeholder="ex. Junior, Senior, Tous profils" />
            </Field>
          </div>
          <Field label="Type d'outil">
            <select className={selectCls} style={{ borderColor: "#D8E0F0" }} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="script">Script (texte à dire)</option>
              <option value="grille">Grille d'écoute (Phase / Cible / Vigilance)</option>
              <option value="fiche">Fiche réflexe (Motif / Où chercher / Cible)</option>
            </select>
          </Field>

          {type === "script" ? (
            <Field label="Contenu du script">
              <textarea className={inputCls} style={{ borderColor: "#D8E0F0", minHeight: "5rem" }} value={content} onChange={(e) => setContent(e.target.value)} />
            </Field>
          ) : (
            <Field label={`Lignes (une par ligne, format : ${type === "grille" ? "phase | cible | vigilance" : "motif | où chercher | cible"})`}>
              <textarea className={inputCls} style={{ borderColor: "#D8E0F0", minHeight: "6rem" }} value={rowsText} onChange={(e) => setRowsText(e.target.value)} />
            </Field>
          )}
        </div>

        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ background: VIOLET }}
          >
            {saving ? "Enregistrement..." : creatingNew ? "Créer l'outil" : "Enregistrer les modifications"}
          </button>
          {!creatingNew && tools.length > 0 && (
            <button
              onClick={handleDelete}
              className="text-xs font-semibold px-3 py-2 rounded-md transition hover:opacity-80"
              style={{ color: "#C0576B" }}
            >
              Supprimer cet outil
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
