import React, { useState, useEffect, useCallback } from "react";
import { PhoneCall, TrendingUp, CheckCircle2, AlertTriangle, Copy, Trash2, Sparkles, ChevronRight, Download, ClipboardList, Heart } from "lucide-react";

// ---- Palette (aligned with the "Piloter une activité de 50 ETP" deck) ----
const NAVY = "#173A6B";
const VIOLET = "#3D2170";
const YELLOW = "#F0C230";
const SKY = "#5570A8";
const PAPER = "#FBFCFE";

const FID_CAUSES = {
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

const DISC_CAUSES = {
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

const DMT_CAUSES = {
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

const COM_CAUSES = {
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

function buildDMT(nom, actuel, cible, causeKey) {
  const cause = DMT_CAUSES[causeKey];
  const ecart = Math.max(0, Math.round(actuel - cible));
  const dateObjectif = addWeeks(3);
  return {
    id: uid(),
    theme: "dmt",
    nom,
    createdAt: new Date().toISOString(),
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

function buildCommerce(nom, actuel, cible, causeKey) {
  const cause = COM_CAUSES[causeKey];
  const ecart = Math.max(0, Math.round((cible - actuel) * 10) / 10);
  const dateObjectif = addWeeks(4);
  return {
    id: uid(),
    theme: "commerce",
    nom,
    createdAt: new Date().toISOString(),
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

function buildDisc(nom, causeKey, mesureFormelle) {
  const cause = DISC_CAUSES[causeKey];
  const dateEcheance = addWeeks(3);
  return {
    id: uid(),
    theme: "disc",
    nom,
    createdAt: new Date().toISOString(),
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

function buildFidelisation(nom, causeKey) {
  const cause = FID_CAUSES[causeKey];
  const dateEcheance = addWeeks(6);
  return {
    id: uid(),
    theme: "fid",
    nom,
    createdAt: new Date().toISOString(),
    status: "en cours",
    causeLabel: cause.label,
    indicateurEcart: `Risque de départ précoce identifié — cause principale : ${cause.label.toLowerCase()}. Constat de référence : rétention à 6 mois autour de 50 %, ambition de la dépasser durablement.`,
    actionsFactuelles: cause.actions,
    commentaire: `${cause.outil} Impact individuel : montée en compétence et projection dans le poste. Impact collectif : moins de recrutements à refaire, équipe plus stable.`,
    suiviSmart: `Spécifique : sécuriser la présence du conseiller au-delà de 6 mois en traitant « ${cause.label.toLowerCase()} ». Mesurable : points d'étape à J30, J60, J90. Atteignable : actions ci-dessus, sans charge supplémentaire hors accompagnement. Réaliste : concentré sur la période à risque (6 premiers mois). Temporel : point de suivi au ${dateEcheance}.`,
    felicitation: "Cap des 6 mois franchi : le conseiller passe en suivi standard, et son parcours d'intégration devient un exemple à partager avec les nouveaux arrivants.",
  };
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
  const [tab, setTab] = useState("dmt");
  const [history, setHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedRebond, setCopiedRebond] = useState(null);
  const [toast, setToast] = useState(null);

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

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/paa");
        if (!res.ok) throw new Error("api not ready");
        const data = await res.json();
        setHistory(data);
      } catch (e) {
        setSyncError(true);
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) setHistory(JSON.parse(raw));
        } catch (e2) {
          // no local history either
        }
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback(async (next) => {
    setHistory(next);
    try {
      const res = await fetch("/api/paa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error("api save failed");
      setSyncError(false);
    } catch (e) {
      setSyncError(true);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e2) {
        console.error("Sauvegarde impossible", e2);
      }
    }
  }, []);

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
    const paa = buildDMT(dmtNom.trim(), actuel, cible, dmtCause);
    persist([paa, ...history]);
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
    const paa = buildCommerce(comNom.trim(), actuel, cible, comCause);
    persist([paa, ...history]);
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
    const entry = buildDisc(discNom.trim(), discCause, discMesure);
    persist([entry, ...history]);
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
    const entry = buildFidelisation(fidNom.trim(), fidCause);
    persist([entry, ...history]);
    setFidNom("");
    showToast("Plan de fidélisation généré et enregistré.");
  }

  function markAtteint(id) {
    const next = history.map((p) =>
      p.id === id ? { ...p, status: "atteint", atteintAt: new Date().toISOString() } : p
    );
    persist(next);
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
    persist(history.filter((p) => p.id !== id));
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
    tab === "dmt" ? DMT_CAUSES : tab === "commerce" ? COM_CAUSES : tab === "disc" ? DISC_CAUSES : FID_CAUSES;

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
            En cas d'écart sur la DMT ou le commerce, l'outil diagnostique la cause et génère un
            PAA factuel centré sur la montée en compétences — jamais la sanction.
          </p>
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
                  {Object.entries(DMT_CAUSES).map(([k, v]) => (
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
                  {Object.entries(COM_CAUSES).map(([k, v]) => (
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
                  {Object.entries(DISC_CAUSES).map(([k, v]) => (
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
                  {Object.entries(FID_CAUSES).map(([k, v]) => (
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
