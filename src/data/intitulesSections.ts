// Intitulés standards des sections, reconnus par les ATS, en français et en anglais
import type { CleSection, LangueCV } from '../types';

export const INTITULES_SECTIONS: Record<LangueCV, Record<CleSection, string>> = {
  fr: {
    accroche: 'Profil',
    experiences: 'Expériences professionnelles',
    formations: 'Formation',
    competences: 'Compétences',
    qualites: 'Savoir-être',
    langues: 'Langues',
    certifications: 'Certifications',
    centresInteret: "Centres d'intérêt",
  },
  en: {
    accroche: 'Profile',
    experiences: 'Professional Experience',
    formations: 'Education',
    competences: 'Skills',
    qualites: 'Soft Skills',
    langues: 'Languages',
    certifications: 'Certifications',
    centresInteret: 'Interests',
  },
};
