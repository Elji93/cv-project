// Ce que la zone d'impression (#print-root) doit contenir : le CV actif ou une lettre
import { create } from 'zustand';

export const useImpression = create<{ lettreId: string | null }>(() => ({ lettreId: null }));
