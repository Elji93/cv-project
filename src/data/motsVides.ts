// Mots vides (français et anglais) : ignorés quand on cherche les mots-clés d'une offre
export const MOTS_VIDES = new Set(`
a ability about above across afin after again against ainsi all alors also alternance am an
and annee annees any apres are as at atout au aussi autre autres aux avant avec
avoir bac+5 be because been before being below between bien bon bonne both but by c
can candidat candidate capacite capacites car cdd cdi ce cela celle celui ces cet cette ceux
chaque chez client clients comme comment company competences connaissance connaissances could d dans date de debut
depuis des descriptif description did do does doing donc dont down du during each elle elles
en encore entre entreprise equipe est et etait etc ete etre eux excellent excellente experience experiences
f/h faire fait faut few for formation fort forte france from further good group groupe h/f
had has have having he her here hers him his how i ici idealement ideally if
il ils in intern internship into is issu issue it its itself j jamais je job
join just knowledge l la le les leur leurs level london londres lors lui m m/f
ma main mais may me meme mes might mission missions moi moins mois mon month months
more most must my n ne ni nice niveau no nor nos not notre nous now
of off offre on once only ont opportunite opportunity or other ou our ours out over
own par paris parmi pas pendant per peu peut plus plusieurs poste pour pourquoi preferred principales
profil puis qu qualifications quand que quel quelle quelles quels qui rejoignez rejoindre required requis responsabilites
responsibilities role s sa same sans se sein selon sera seront ses seulement shall she should
si skills so societe soit some son sont souhaite souhaitee sous stage stagiaire start strong such
sur t ta tant te team tes than that the their theirs them then there these
they this those through to toi ton too tous tout toute toutes travail travaillerez tres tu
type un under une until up vers very via vos votre vous was we were what
when where which while who whom why will with within work would y year years you
your yours
`.split(/\s+/).filter(Boolean));
