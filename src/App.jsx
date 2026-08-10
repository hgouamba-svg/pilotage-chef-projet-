import React, { useState, useEffect, useCallback } from "react";
import { PhoneCall, TrendingUp, CheckCircle2, AlertTriangle, Copy, Trash2, Sparkles, ChevronRight, Download, ClipboardList, Heart, LogOut, Users, UserPlus, X } from "lucide-react";

// ---- Palette (aligned with the "Piloter une activité de 50 ETP" deck) ----
const NAVY = "#173A6B";
const VIOLET = "#3D2170";
const YELLOW = "#F0C230";
const SKY = "#5570A8";
const PAPER = "#FBFCFE";

const EQUIPES = [
  { id: "A", label: "Équipe A — FO" },
  { id: "B", label: "Équipe B — FO" },
  { id: "C", label: "Équipe C — FO/BO" },
  { id: "D", label: "Équipe D — FO/BO" },
];

function equipeLabel(id) {
  return EQUIPES.find((e) => e.id === id)?.label || id || "—";
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

const DMT_TOOLS = [
  {
    cause: "conversation",
    title: "Grille d'écoute — structuration de l'appel",
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
    cause: "wrapup",
    title: "Script de clôture type",
    type: "script",
    content:
      "Je résume : [action réalisée]. Vous allez recevoir [confirmation/document] sous [délai]. Y a-t-il autre chose pour lequel je peux vous aider ? Je vous remercie de votre appel [prénom], bonne journée à vous, au revoir.",
  },
  {
    cause: "recherche",
    title: "Fiche réflexe — motifs de recherche fréquents",
    type: "fiche",
    rows: [
      { motif: "Historique de facturation", source: "Onglet Facturation > Historique 12 mois", cible: "≤ 20s" },
      { motif: "Statut d'une réclamation en cours", source: "Module Réclamations > Recherche par n° dossier", cible: "≤ 15s" },
      { motif: "Éligibilité à une offre", source: "Fiche produit > Grille d'éligibilité", cible: "≤ 30s" },
      { motif: "Procédure non standard", source: "Base de connaissance > Mot-clé + référent", cible: "Escalade si > 30s" },
    ],
  },
];

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

function exportPAAPdf(p) {
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
      <div class="meta">${escapeHtml(themeLabel(p.theme))} · ${escapeHtml(equipeLabel(p.equipe))} · ${escapeHtml(new Date(p.createdAt).toLocaleDateString("fr-FR"))}</div>
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
  const [selectedEquipe, setSelectedEquipe] = useState(EQUIPES[0].id);

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

  function exportCSV() {
    if (history.length === 0) {
      showToast("Aucun PAA à exporter pour l'instant.");
      return;
    }
    const headers = [
      "Conseiller",
      "Thème",
      "Cause",
      "Date de création",
      "Métrique",
      "Valeur initiale",
      "Cible",
      "Statut",
      "Date objectif atteint",
      "Délai (jours)",
    ];
    const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = history.map((p) => {
      const created = new Date(p.createdAt);
      const reached = p.atteintAt ? new Date(p.atteintAt) : null;
      const delaiJours = reached
        ? Math.round((reached.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
        : "";
      return [
        p.nom,
        themeLabel(p.theme),
        p.causeLabel || "",
        created.toLocaleDateString("fr-FR"),
        p.metricLabel,
        p.actuel,
        p.cible,
        p.status === "atteint" ? "Atteint" : "En cours",
        reached ? reached.toLocaleDateString("fr-FR") : "",
        delaiJours,
      ]
        .map(escape)
        .join(";");
    });
    const csv = [headers.map(escape).join(";"), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paa-export-${new Date().toISOString().slice(0, 10)}.csv`;
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
              {user.displayName} · {user.role === "admin" ? "Administrateur" : equipeLabel(user.equipe)}
            </span>
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
              {EQUIPES.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.label}
                </option>
              ))}
            </select>
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
        {tab === "dmt" && (
          <div className="mb-8 space-y-4">
            <h2 className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: SKY }}>
              Outils DMT — utilisables directement en écoute
            </h2>
            {DMT_TOOLS.map((tool, idx) => (
              <div key={idx} className="rounded-lg border p-4 bg-white" style={{ borderColor: "#E2E8F5" }}>
                <div className="text-sm font-semibold mb-2" style={{ color: NAVY }}>
                  {tool.title}
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
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ color: VIOLET }}>
                          {tool.type === "grille" ? (
                            <>
                              <th className="text-left font-bold uppercase py-1 pr-3">Phase</th>
                              <th className="text-left font-bold uppercase py-1 pr-3">Cible</th>
                              <th className="text-left font-bold uppercase py-1">Point de vigilance</th>
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
                        {tool.rows.map((row, ri) => (
                          <tr key={ri} style={{ borderTop: "1px solid #EEF1FA" }}>
                            {tool.type === "grille" ? (
                              <>
                                <td className="py-1.5 pr-3" style={{ color: NAVY }}>{row.phase}</td>
                                <td className="py-1.5 pr-3 font-semibold" style={{ color: VIOLET }}>{row.cible}</td>
                                <td className="py-1.5" style={{ color: SKY }}>{row.vigilance}</td>
                              </>
                            ) : (
                              <>
                                <td className="py-1.5 pr-3" style={{ color: NAVY }}>{row.motif}</td>
                                <td className="py-1.5 pr-3" style={{ color: SKY }}>{row.source}</td>
                                <td className="py-1.5 font-semibold" style={{ color: VIOLET }}>{row.cible}</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {tool.type === "fiche" && (
                      <div className="text-[11px] mt-2" style={{ color: SKY }}>
                        Exemple à adapter : remplace les sources ci-dessus par les menus réels de votre CRM.
                      </div>
                    )}
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
                          <span style={{ color: NAVY }}>{equipeLabel(eq)}</span>
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
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition hover:opacity-80"
              style={{ background: NAVY, color: "white" }}
            >
              <Download size={13} /> Exporter (CSV)
            </button>
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
                        {equipeLabel(p.equipe)}
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
                      onClick={() => exportPAAPdf(p)}
                      className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-full transition hover:opacity-80"
                      style={{ background: "#EEF1FA", color: SKY }}
                    >
                      <Download size={12} /> PDF
                    </button>
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

      {showUsers && user.role === "admin" && (
        <UserManagementModal token={token} onClose={() => setShowUsers(false)} showToast={showToast} />
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

function UserManagementModal({ token, onClose, showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newRole, setNewRole] = useState("superviseur");
  const [newEquipe, setNewEquipe] = useState(EQUIPES[0].id);
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
                {EQUIPES.map((eq) => (
                  <option key={eq.id} value={eq.id}>{eq.label}</option>
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
                    · {u.username} · {u.role === "admin" ? "Administrateur" : equipeLabel(u.equipe)}
                  </span>
                </div>
                <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-full transition hover:opacity-70" style={{ color: "#C0576B" }}>
                  <Trash2 size={14} />
                </button>
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

  const authHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` });

  const bank = causesConfig[theme];
  const keys = Object.keys(bank);

  useEffect(() => {
    const first = Object.keys(causesConfig[theme])[0];
    setCauseKey(first);
  }, [theme]);

  useEffect(() => {
    const c = causesConfig[theme][causeKey];
    if (c) {
      setLabel(c.label || "");
      setOutil(c.outil || "");
      setActionsText((c.actions || []).join("\n"));
    }
  }, [theme, causeKey, causesConfig]);

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
    const updatedBank = { ...causesConfig[theme], [causeKey]: { label: label.trim(), outil: outil.trim(), actions } };
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
      showToast("Banque de techniques mise à jour.");
    } catch (e) {
      showToast("Sauvegarde impossible — réessaie.");
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
            <select className={selectCls} style={{ borderColor: "#D8E0F0" }} value={causeKey} onChange={(e) => setCauseKey(e.target.value)}>
              {keys.map((k) => (
                <option key={k} value={k}>{bank[k].label}</option>
              ))}
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

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          style={{ background: VIOLET }}
        >
          {saving ? "Enregistrement..." : "Enregistrer cette cause"}
        </button>
      </div>
    </div>
  );
}
