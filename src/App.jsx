import React, { useState, useEffect, useCallback } from "react";
import { PhoneCall, TrendingUp, CheckCircle2, AlertTriangle, Copy, Trash2, Sparkles, ChevronRight } from "lucide-react";

// ---- Palette (aligned with the "Piloter une activité de 50 ETP" deck) ----
const NAVY = "#173A6B";
const VIOLET = "#3D2170";
const YELLOW = "#F0C230";
const SKY = "#5570A8";
const PAPER = "#FBFCFE";

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
    outil: "Bibliothèque de rebonds commerciaux courts, classés par typologie d'appel.",
    actions: [
      "Mise en situation : intégrer un rebond systématique en fin d'appel.",
      "Doublon avec un top performer sur 5 appels.",
      "Auto-évaluation post-appel : \"ai-je proposé ?\" oui/non, sur une semaine.",
    ],
  },
  moment: {
    label: "Mauvais moment dans l'appel",
    outil: "Cartographie des points d'entrée commerciaux dans le scénario d'appel type.",
    actions: [
      "Écoute ciblée pour repérer le moment optimal de rebond.",
      "Entraînement sur le timing avec le superviseur (jeu de rôle).",
      "Grille de repérage des signaux d'ouverture client.",
    ],
  },
  conviction: {
    label: "Manque de conviction dans le ton",
    outil: "Travail de posture et de ton en mise en situation, pas en théorie.",
    actions: [
      "Enregistrement + réécoute croisée avec un pair pour travailler le ton.",
      "Argumentaire personnalisé construit avec le conseiller, pas imposé.",
      "Challenge court en équipe pour ancrer la pratique dans la durée.",
    ],
  },
};

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
  return {
    id: uid(),
    theme: "dmt",
    nom,
    createdAt: new Date().toISOString(),
    status: "en cours",
    metricLabel: "DMT",
    actuel: `${actuel}s`,
    cible: `${cible}s`,
    contexte: `DMT actuelle à ${actuel}s, au-dessus de la cible de ${cible}s (écart de ${ecart}s). Cause principale identifiée : ${cause.label.toLowerCase()}.`,
    objectif: `Ramener la DMT à ${cible}s d'ici le ${addWeeks(3)}, sans dégrader le taux de résolution au premier contact ni la satisfaction.`,
    impact: "Capacité de traitement libérée, moins de recours aux heures supplémentaires, meilleure occupation Front Office.",
    declinaisonLead: "Outil recommandé :",
    declinaisonBody: cause.outil,
    actions: cause.actions,
    suivi: "Point hebdo dédié avec le superviseur, DMT actualisée chaque semaine, plan ajusté si la trajectoire ne progresse pas.",
    felicitation: "Valorisation en réunion d'équipe ; le conseiller devient binôme référent pour un pair en écart.",
  };
}

function buildCommerce(nom, actuel, cible, causeKey) {
  const cause = COM_CAUSES[causeKey];
  const ecart = Math.max(0, Math.round((cible - actuel) * 10) / 10);
  return {
    id: uid(),
    theme: "commerce",
    nom,
    createdAt: new Date().toISOString(),
    status: "en cours",
    metricLabel: "Taux de transformation",
    actuel: `${actuel}%`,
    cible: `${cible}%`,
    contexte: `Taux de transformation à ${actuel}%, en dessous de l'objectif de ${cible}% (écart de ${ecart} pts), alors que le volume de contacts éligibles est suffisant. Cause principale identifiée : ${cause.label.toLowerCase()}.`,
    objectif: `Atteindre ${cible}% de transformation d'ici le ${addWeeks(4)}, sans dégrader la satisfaction — pas de vente forcée.`,
    impact: "Chiffre d'affaires additionnel, meilleure valorisation du contact déjà en ligne, contribution aux engagements COPIL.",
    declinaisonLead: "Outil recommandé :",
    declinaisonBody: cause.outil,
    actions: cause.actions,
    suivi: "Taux de transformation suivi chaque semaine, débrief avec le superviseur, ajustement de l'argumentaire si besoin.",
    felicitation: "Reconnaissance visible en équipe ; le conseiller devient point d'appui pour les mises en situation des autres.",
  };
}

function paaToText(p) {
  return [
    `PLAN D'ACCOMPAGNEMENT — ${p.nom}`,
    `Thème : ${p.theme === "dmt" ? "Maîtrise de la DMT" : "Développement commercial"}`,
    "",
    `CONTEXTE`,
    p.contexte,
    "",
    `OBJECTIF VISÉ`,
    p.objectif,
    "",
    `IMPACT`,
    p.impact,
    "",
    `DÉCLINAISON — L'OUTIL`,
    `${p.declinaisonLead} ${p.declinaisonBody}`,
    "",
    `PAA FACTUEL`,
    ...p.actions.map((a) => `- ${a}`),
    "",
    `SUIVI`,
    p.suivi,
    "",
    `PAA FÉLICITATION SI ATTEINT`,
    p.felicitation,
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
  "w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 transition";

export default function AssistantConseillers() {
  const [tab, setTab] = useState("dmt");
  const [history, setHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch (e) {
      // no history yet
    } finally {
      setLoaded(true);
    }
  }, []);

  const persist = useCallback((next) => {
    setHistory(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Erreur de sauvegarde", e);
    }
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function handleDMTSubmit(e) {
    e.preventDefault();
    const actuel = parseFloat(dmtActuel);
    const cible = parseFloat(dmtCible);
    if (!dmtNom || isNaN(actuel) || isNaN(cible)) return;
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
    const actuel = parseFloat(comActuel);
    const cible = parseFloat(comCible);
    if (!comNom || isNaN(actuel) || isNaN(cible)) return;
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

  function markAtteint(id) {
    const next = history.map((p) => (p.id === id ? { ...p, status: "atteint" } : p));
    persist(next);
    showToast("Objectif marqué comme atteint.");
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

  const causes = tab === "dmt" ? DMT_CAUSES : COM_CAUSES;

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
                  className={inputCls}
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
          ) : (
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
                  className={inputCls}
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
          )}
        </div>

        {/* Cause bank preview */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: SKY }}>
            Banque de techniques — {tab === "dmt" ? "DMT" : "Commerce"}
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {Object.entries(causes).map(([k, v]) => (
              <div key={k} className="rounded-lg border p-3 bg-white" style={{ borderColor: "#E2E8F5" }}>
                <div className="text-sm font-semibold mb-1" style={{ color: NAVY }}>
                  {v.label}
                </div>
                <div className="text-xs" style={{ color: SKY }}>
                  {v.outil}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        <div>
          <h2 className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: SKY }}>
            Plans d'accompagnement générés {loaded && history.length > 0 ? `(${history.length})` : ""}
          </h2>

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
                      · {p.metricLabel} {p.actuel} → cible {p.cible}
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
                        Contexte
                      </div>
                      <div>{p.contexte}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: VIOLET }}>
                        Objectif visé
                      </div>
                      <div>{p.objectif}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: VIOLET }}>
                        Impact
                      </div>
                      <div>{p.impact}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: VIOLET }}>
                        Déclinaison — l'outil
                      </div>
                      <div>{p.declinaisonBody}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: VIOLET }}>
                        PAA factuel
                      </div>
                      <ul className="list-disc pl-5 space-y-0.5">
                        {p.actions.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: VIOLET }}>
                        Suivi
                      </div>
                      <div>{p.suivi}</div>
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
