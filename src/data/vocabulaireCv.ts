// ============================================================================
//  Vocabulaire courant des CV : sert à redécouper les mots collés des grands
//  titres Canva écrits lettre par lettre (« Ressourceshumainesenalternance »
//  -> « Ressources humaines en alternance »). On peut l'enrichir librement.
// ============================================================================
export const VOCABULAIRE_CV = `
a au aux avec de des du en et la le les l d un une pour par sur chez dans ou
alternance alternant alternante apprentissage apprenti apprentie contrat stage stagiaire stages
recherche recherchant recherchons cherche poste emploi cdi cdd interim job
licence pro professionnelle professionnel master mastere bachelor bts but dut bac baccalaureat
mba msc diplome diplomee ecole universite lycee formation formations etudiant etudiante
gestion paie ressources humaines rh sirh hris moa amoa adp administration personnel
comptabilite comptable comptables controle controleur controleuse audit auditeur auditrice
finance financier financiere financiers financieres analyste analyse analyses assistant assistante
consultant consultante conseil conseiller conseillere charge chargee affaires junior senior
responsable manager chef projet projets marketing commercial commerciale communication
juridique droit fiscal fiscalite tresorerie banque assurance credit risques risque marches
international internationale entreprise entreprises cabinet groupe societe
experience experiences professionnelles profil personnel personnelle personnalite traits
competences competence centres centre interet interets loisirs langues langue langages
informatique informatiques logiciels logiciel outils qualites atouts contact coordonnees
certifications certification references projets activites benevolat engagements
rythme jours semaines semaine mois annee ans
`.split(/\s+/).filter(Boolean);
