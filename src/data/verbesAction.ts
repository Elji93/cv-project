// Verbes d'action en début de puce (formes sans accents), français et anglais.
// L'analyseur reconnaît aussi automatiquement les participes passés (« Audité », « Réalisée ») et le passé anglais (« -ed »).
export const VERBES_ACTION_FR = `
accompagne ameliore analyse assure audite augmente automatise concu conduit conseille construit controle coordonne cree
deploye developpe dirige elabore encadre etabli evalue fiabilise forme genere gere identifie integre lance
livre mene mis en place modelise negocie optimise parametre participe pilote prepare presente produit realise recette
recrute redige reduit saisi structure supervise teste traite verifie
administre configure installe migre securise virtualise maintenu depanne diagnostique resolu documente cable durci
detecte investigue remedie sensibilise programme code refactorise conteneurise scripte
vendu conclu accueilli entretenu fourni obtenu atteint servi reussi promu prospecte fidelise anime enseigne approvisionne planifie
organise soigne fabrique assemble repare inspecte chiffre dessine facture expedie
`.split(/\s+/).filter(Boolean);

export const VERBES_ACTION_EN = `
achieved analysed analyzed assisted automated built conducted configured controlled coordinated created delivered deployed designed
developed directed drafted ensured executed handled implemented improved increased integrated launched led managed modeled
modelled negotiated optimised optimized performed prepared processed recruited reduced reviewed spearheaded streamlined structured supervised
supported tested trained valued verified
administered installed migrated secured troubleshot resolved monitored hardened investigated remediated scripted
virtualized virtualised maintained documented upgraded patched coded programmed containerized refactored
sold taught won grew drove wrote ran made kept oversaw met brought sought
`.split(/\s+/).filter(Boolean);
