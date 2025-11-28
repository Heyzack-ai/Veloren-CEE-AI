"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type SupportedLanguage = "fr" | "en";

type TranslateParams = Record<string, string | number | undefined>;

type LanguageContextValue = {
  lang: SupportedLanguage;
  setLang: (lang: SupportedLanguage) => void;
  t: (key: string, params?: TranslateParams, fallback?: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const defaultLanguage: SupportedLanguage = "fr";

const translations: Record<SupportedLanguage, Record<string, string>> = {
  fr: {
    "nav.dashboard": "Tableau de bord",
    "nav.files": "Dossiers",
    "nav.files.all": "Tous les dossiers",
    "nav.files.pending": "En attente",
    "nav.files.documents": "Documents",
    "nav.configuration": "Configuration",
    "nav.configuration.processes": "Processus",
    "nav.configuration.documentTypes": "Types de documents",
    "nav.configuration.rules": "Règles de validation",
    "nav.configuration.schemas": "Schémas de champs",
    "nav.users": "Utilisateurs",
    "nav.installers": "Installateurs",
    "nav.billing": "Facturation",
    "nav.analytics": "Analytique",
    "nav.activity": "Journal d'activité",
    "nav.settings": "Paramètres",
    "header.brand": "CEE Validation",
    "header.search.placeholder": "Rechercher dossiers, installateurs... (⌘K)",
    "header.toggle.expand": "Déplier le menu",
    "header.toggle.collapse": "Replier le menu",
    "header.help": "Aide",
    "header.user.profile": "Profil",
    "header.user.settings": "Paramètres",
    "header.user.logout": "Déconnexion",
    "header.user.role.administrator": "Administrateur",
    "header.user.role.validator": "Validateur",
    "header.user.role.installer": "Installateur",
    "header.language.fr": "Français",
    "header.language.en": "Anglais",
    "header.language.switch": "Langue",
    "config.title": "Configuration",
    "config.subtitle": "Gérer les processus, règles et paramètres du système",
    "config.actions.viewAll": "Voir tout",
    "config.actions.create": "Créer",
    "config.sections.processes.title": "Processus",
    "config.sections.processes.description": "Configurer les processus CEE et leurs exigences documentaires",
    "config.sections.processes.stats": "{active} actifs sur {total}",
    "config.sections.rules.title": "Règles de validation",
    "config.sections.rules.description": "Gérer les règles de validation automatique des documents",
    "config.sections.rules.stats": "{active} actives sur {total}",
    "config.sections.documentTypes.title": "Types de documents",
    "config.sections.documentTypes.description": "Définir les types de documents et leurs schémas de champs",
    "config.sections.documentTypes.stats": "{system} système, {custom} personnalisés",
    "config.sections.schemas.title": "Schémas de champs",
    "config.sections.schemas.description": "Configurer les schémas d'extraction pour chaque type de document",
    "config.sections.schemas.stats": "{count} champs configurés",
    "config.overview.title": "Aperçu de la configuration",
    "config.overview.description": "Résumé des éléments configurés dans le système",
    "config.overview.processes": "Processus",
    "config.overview.rules": "Règles",
    "config.overview.documentTypes": "Types de documents",
    "config.overview.fields": "Champs",
  },
  en: {
    "nav.dashboard": "Dashboard",
    "nav.files": "Cases",
    "nav.files.all": "All cases",
    "nav.files.pending": "Pending",
    "nav.files.documents": "Documents",
    "nav.configuration": "Configuration",
    "nav.configuration.processes": "Processes",
    "nav.configuration.documentTypes": "Document types",
    "nav.configuration.rules": "Validation rules",
    "nav.configuration.schemas": "Field schemas",
    "nav.users": "Users",
    "nav.installers": "Installers",
    "nav.billing": "Billing",
    "nav.analytics": "Analytics",
    "nav.activity": "Activity log",
    "nav.settings": "Settings",
    "header.brand": "CEE Validation",
    "header.search.placeholder": "Search cases, installers... (⌘K)",
    "header.toggle.expand": "Expand menu",
    "header.toggle.collapse": "Collapse menu",
    "header.help": "Help",
    "header.user.profile": "Profile",
    "header.user.settings": "Settings",
    "header.user.logout": "Sign out",
    "header.user.role.administrator": "Administrator",
    "header.user.role.validator": "Validator",
    "header.user.role.installer": "Installer",
    "header.language.fr": "French",
    "header.language.en": "English",
    "header.language.switch": "Language",
    "config.title": "Configuration",
    "config.subtitle": "Manage processes, rules, and system parameters",
    "config.actions.viewAll": "View all",
    "config.actions.create": "Create",
    "config.sections.processes.title": "Processes",
    "config.sections.processes.description": "Configure CEE processes and their document requirements",
    "config.sections.processes.stats": "{active} active of {total}",
    "config.sections.rules.title": "Validation rules",
    "config.sections.rules.description": "Manage automated document validation rules",
    "config.sections.rules.stats": "{active} active of {total}",
    "config.sections.documentTypes.title": "Document types",
    "config.sections.documentTypes.description": "Define document types and their field schemas",
    "config.sections.documentTypes.stats": "{system} system, {custom} custom",
    "config.sections.schemas.title": "Field schemas",
    "config.sections.schemas.description": "Configure extraction schemas for each document type",
    "config.sections.schemas.stats": "{count} fields configured",
    "config.overview.title": "Configuration overview",
    "config.overview.description": "Summary of the configured elements",
    "config.overview.processes": "Processes",
    "config.overview.rules": "Rules",
    "config.overview.documentTypes": "Document types",
    "config.overview.fields": "Fields",
  },
};

function format(template: string, params?: TranslateParams) {
  if (!params) return template;
  return template.replace(/\{(.*?)\}/g, (_, token) => {
    const value = params[token.trim()];
    return value !== undefined ? String(value) : `{${token}}`;
  });
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<SupportedLanguage>(() => {
    if (typeof window === "undefined") {
      return defaultLanguage;
    }
    const stored = window.localStorage.getItem("lang") as SupportedLanguage | null;
    return stored ?? defaultLanguage;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("lang", lang);
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const t = useCallback(
    (key: string, params?: TranslateParams, fallback?: string) => {
      const template =
        translations[lang]?.[key] ?? translations[defaultLanguage]?.[key] ?? fallback ?? key;
      return format(template, params);
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}

export function useTranslation() {
  const { t } = useLanguage();
  return { t };
}
