# Protocole expérimental — Étude quiz : validation du reward pédagogique

**Titre de travail :** *Does AI-judged feedback actually teach? A randomized study of RLAIF, expert-in-the-loop, and outcome-based reward signals for automated mathematics feedback.*

**Version :** 1.0 — 16 juillet 2026
**Investigateur principal :** Dogbalou Motognon Wastalas d'Assise
**Plateforme :** STACK-AI-Math-Course (Next.js + Convex + Gemini/OpenAI)
**Statut :** brouillon — à pré-enregistrer (OSF) avant tout recrutement

---

## 1. Contexte et justification

Le pipeline de feedback de la plateforme combine trois signaux de qualité :

1. **RLAIF / Best-of-N** (`convex/grading.ts` → `gradeBestOfN`) : N=3 feedbacks candidats générés à température 0.4 ; un LLM-as-Judge (`convex/judge.ts` → `evaluateEvaluator`, ancré sur vérification CAS et corrections d'experts) attribue à chacun un `judgeConfidence` ; le candidat le plus confiant est délivré à l'étudiant.
2. **Expert-in-the-loop** (`convex/corrections.ts`) : corrections humaines approuvées, réinjectées en few-shot dans le grader et le juge.
3. **Outcome-Based Reward** (`convex/submissions.ts`) : pour chaque soumission, `outcomeReward = masteryBefore(soumission suivante) − masteryBefore(soumission courante)` sur le même sujet ; les feedbacks avec `outcomeReward ≥ 5` alimentent un pool few-shot « pédagogiquement validé » injecté dans `gradeOptimized`.

**Problème :** les signaux 1 et 2 mesurent la *plausibilité* du feedback (un juge le trouve correct et aligné). Ils ne mesurent pas son *efficacité pédagogique*. Le signal 3 repose sur l'hypothèse que le gain de maîtrise observé après un feedback est attribuable, au moins en partie, à ce feedback. Aucune de ces hypothèses n'a été testée expérimentalement.

**Thèse à tester :** le signal de récompense le plus honnête en éducation n'est pas ce qu'une seconde IA pense du feedback, mais si l'étudiant progresse après l'avoir reçu.

## 2. Questions de recherche et hypothèses

- **RQ1.** Le feedback sélectionné par le juge (Best-of-N) produit-il un gain d'apprentissage supérieur au feedback single-pass ?
  **H1 :** gain(B) > gain(A), taille d'effet attendue d ≈ 0.3–0.4.
- **RQ2.** L'ajout d'exemples few-shot validés par l'outcome (pool `outcomeReward ≥ 5`) améliore-t-il le gain par rapport au Best-of-N seul ?
  **H2 :** gain(C) > gain(B).
- **RQ3.** Le `judgeConfidence` prédit-il l'`outcomeReward` ?
  **H3 (hypothèse centrale, directionnelle faible) :** la corrélation est faible (ρ < 0.3) — le juge IA optimise la plausibilité, pas l'apprentissage. *Toute issue est informative* : une corrélation forte validerait le RLAIF comme proxy ; une corrélation faible démontre la nécessité du signal d'outcome.
- **RQ4 (exploratoire).** Les corrections expertes sont-elles mieux alignées sur l'outcome que le juge IA ? (comparer `outcomeReward` des feedbacks corrigés par un expert vs feedbacks validés par le juge seul).

## 3. Design expérimental

### 3.1 Conditions (trois bras)

| Bras | Nom | Implémentation | Ce que reçoit l'étudiant |
|---|---|---|---|
| **A** | Single-pass (contrôle) | `gradeOptimized`, `useBestOfN=false`, contexte outcome-validated **désactivé** | Feedback du grader seul (avec CAS + corrections expertes few-shot, comme avant juin 2026) |
| **B** | RLAIF Best-of-N | `gradeBestOfN` (N=3, sélection par `judgeConfidence`) | Meilleur candidat selon le juge |
| **C** | Best-of-N + Outcome | `gradeBestOfN` **+** pool few-shot `outcomeReward ≥ 5` injecté dans la génération des candidats | Meilleur candidat, généré avec ancrage sur des feedbacks pédagogiquement validés |

Tous les bras conservent : vérification CAS, structure de feedback en trois sections (Answer/Reasoning/Verdict), délimiteurs LaTeX, juge en arrière-plan (pour la journalisation, sans modifier le feedback délivré dans le bras A).

### 3.2 Unité de randomisation : étudiant × sujet (within-subject)

Chaque étudiant travaille **trois sujets** (ex. : *Determinants*, *Eigenvalues*, *Derivative Rules* — à fixer selon le programme de la cohorte). Pour chaque étudiant, les trois conditions sont assignées aux trois sujets par **permutation aléatoire contrebalancée** (carré latin 3×3 sur l'ordre de passage × condition), stratifiée par score au pré-test global (médiane split).

Justification : le design intra-sujet neutralise les différences interindividuelles (le facteur de variance dominant en éducation) et divise l'échantillon requis par ~2 par rapport à un design inter-sujets. Le risque de contamination entre conditions est faible : l'étudiant ne voit jamais deux feedbacks concurrents pour la même soumission.

### 3.3 Deux phases

- **Phase 1 — Bootstrap (bras A et B uniquement, 2 sujets/étudiant).** Le pool `outcomeReward` est actuellement quasi vide. La phase 1 (a) compare A vs B, (b) accumule le signal d'outcome nécessaire au bras C. Critère de sortie : ≥ 15 feedbacks avec `outcomeReward ≥ 5` par sujet cible de la phase 2.
- **Phase 2 — Étude principale (A, B, C, 3 sujets/étudiant).** Le pool outcome-validated est **gelé** au premier jour de la phase 2 (snapshot versionné) pour que le bras C soit stable et reproductible pendant toute la phase.

Les participants de la phase 1 ne participent pas à la phase 2 (cohortes distinctes).

## 4. Participants

- **Population :** étudiants de première/deuxième année universitaire inscrits en algèbre linéaire ou calcul différentiel. Sites : MMUST (Kenya) en priorité — continuité avec le pilote — plus une éventuelle seconde cohorte pour la généralisabilité.
- **Critères d'inclusion :** ≥ 18 ans, inscrit au cours correspondant, consentement éclairé signé, accès à un ordinateur/navigateur.
- **Critères d'exclusion :** participation à la phase 1 (pour la phase 2), participation au pilote qualitatif antérieur avec exposition à la plateforme > 1 session.
- **Taille d'échantillon (phase 2) :** pour une comparaison appariée A–B avec d = 0.4, α = .05 bilatéral, puissance = .80 et corrélation intra-sujet r ≈ .5 : **n ≈ 52 étudiants complets**. Cible de recrutement : **80 étudiants** (attrition attendue 20–25 %). Phase 1 : 40–50 étudiants suffisent (l'objectif principal est l'accumulation du signal).
- **Incitation :** certificat de participation + accès complet à la plateforme après l'étude ; conforme aux règles du comité d'éthique local (pas d'incitation financière conditionnée à la performance).

## 5. Matériel

### 5.1 Quiz pré/post (instrument de mesure)

- **6 items par sujet**, réponses numériques ou expressions symboliques **corrigées exclusivement par CAS** (déterministe). L'instrument de mesure ne doit **jamais** dépendre du grader IA manipulé — sinon la mesure est contaminée par la manipulation.
- Pré-test et post-test **isomorphes** : mêmes squelettes de problèmes, paramètres numériques régénérés (la génération paramétrique de `src/data/topics/` fait exactement cela). Assignation aléatoire de la version (v1/v2) en pré ou post, contrebalancée.
- Durée : 15 min par sujet, sans feedback, sans indice, une tentative par item.
- Pilotage préalable des items sur 10–15 étudiants hors étude : viser une difficulté moyenne de 0.4–0.7 et un index de discrimination > 0.2 (les dashboards difficulté/discrimination de STACKAI Math Educator servent ici).
- **Banque d'items pilotes générée (18 juillet 2026)** : `docs/research/banque-items-pilote.md` (+ `item-bank/item-bank.json`) — 36 items validés CAS (3 sujets × 2 versions isomorphes A/B × 6 items, composition 2/2/2), clés de réponse uniques par forme, génération reproductible par seed (`scripts/generate-item-bank.ts`). Le document inclut la clé de correction et la feuille de calcul des indices p et D.

### 5.2 Session de pratique (l'intervention)

- 30 minutes par sujet, **minimum 6 problèmes soumis** (contrôle du dosage : la session n'est validée qu'à 6 soumissions ; au-delà, libre jusqu'au temps limite).
- Après chaque soumission : feedback selon la condition assignée, temps de lecture minimal imposé de 20 s avant le problème suivant (garantit l'exposition au traitement).
- **Séquence de problèmes à difficulté contrôlée :** pour neutraliser le confondeur « le gain vient de la difficulté du problème suivant », la progression de difficulté est **fixée par un script commun** (2 faciles → 2 moyens → 2 difficiles) identique dans les trois bras, au lieu du moteur de recommandation adaptatif. Le moteur adaptatif est désactivé pendant l'étude.
- Indices et solutions (`permissions.ts`) désactivés pendant l'étude : le feedback est la seule aide.

### 5.3 Rétention (optionnel mais recommandé)

Post-test différé (mêmes items, paramètres régénérés) à **J+7**, 10 min par sujet, pour mesurer la rétention. Analysé en secondaire ; l'attrition attendue y est plus forte.

## 6. Procédure (phase 2, par participant)

| Étape | Durée | Contenu |
|---|---|---|
| 0. Accueil | 15 min | Consentement, création de compte, démographie (année, filière, aisance auto-déclarée), tutoriel plateforme sur un sujet neutre |
| 1. Pré-test | 3 × 15 min | Quiz CAS sur les 3 sujets, ordre contrebalancé |
| 2. Pratique | 3 × 30 min | Une session par sujet, condition assignée par la randomisation ; pauses de 5 min entre sujets |
| 3. Post-test immédiat | 3 × 15 min | Quiz isomorphes |
| 4. Questionnaire | 10 min | Utilité perçue du feedback (échelle de Likert 5 points, 6 items), charge cognitive (NASA-TLX abrégé), commentaire libre |
| 5. Post-test différé | J+7, 3 × 10 min | En ligne, rappel par email (Resend) |

Format recommandé : **deux séances en salle surveillée** (étapes 0–3 sur une demi-journée ou deux jours consécutifs) pour contrôler l'environnement, plus l'étape 5 à distance.

## 7. Variables et mesures

### 7.1 Primaire

- **Gain d'apprentissage normalisé** par étudiant × sujet :
  `g = (post − pré) / (max − pré)` (gain de Hake ; si `pré = max`, exclu de l'analyse du sujet concerné).

### 7.2 Secondaires

- **`outcomeReward` observé** par soumission (échelle native : +10 réponse correcte, +3 partielle, 0 sinon → le reward entre deux soumissions varie de −0 à +10 ; seuil « high-reward » = 5).
- **Exactitude à la tentative suivante** (probabilité qu'une soumission suivant un feedback soit correcte), par condition.
- **Rétention** à J+7 (gain normalisé différé).
- **`judgeConfidence`** de chaque feedback délivré (journalisé dans les trois bras, y compris A où le juge tourne en arrière-plan sans modifier le feedback).
- **Trajectoire de maîtrise** intra-session (pente du `masteryScore` sur les 6+ soumissions).
- Utilité perçue, charge cognitive, temps de lecture du feedback, temps par problème.

### 7.3 Covariables

Score au pré-test, sujet, ordre de passage, filière, aisance auto-déclarée.

### 7.4 Journalisation requise — **IMPLÉMENTÉ (17 juillet 2026)**, voir `convex/experiment.ts`

1. ✅ Table `experimentAssignments` : `{ userId, participantCode, phase, topicName, condition, latinSquareRow, topicOrder, enrolledAt }`. L'enrôlement (`experiment:enrollParticipant`) applique automatiquement le carré latin (cyclage des permutations par ordre d'enrôlement, surchargeable via `latinSquareRow`) et attribue le pseudonyme `P<phase>-NNN`.
2. ✅ Champs `experimentCondition` + `experimentPhase` sur `submissions`, copiés depuis l'assignation au moment de la soumission.
3. ✅ Forçage de condition dans `gradingPipeline.gradeAndSaveSubmission` : si l'utilisateur a une assignation pour ce sujet **et** que sa phase est active (`experimentConfig.activePhase`), la condition écrase le `useBestOfN` du frontend. Hors phase active, la plateforme se comporte normalement.
4. ✅ Snapshots des pools few-shot (`experimentPoolSnapshots`) : `experiment:freezePoolsForPhase` gèle corrections expertes + feedbacks outcome-validated par sujet ; pendant l'étude, `gradeOptimized`, `evaluateEvaluator` (y compris le juge d'arrière-plan du bras A) lisent le snapshot. Un pool jamais gelé renvoie une liste vide — pas de repli silencieux sur les données vivantes.
5. ✅ Journal `experimentGradingLogs` : les 3 candidats Best-of-N et leurs `judgeConfidence` (pas seulement le sélectionné), index sélectionné, latence de grading, modèle, `PROMPT_VERSION` (à incrémenter à chaque modification de prompt).
6. ✅ Export pseudonymisé (`experiment:exportSubmissions`, `experiment:exportGradingLogs`) : identifiants Clerk remplacés par `participantCode`.

**Runbook opérateur** (fonctions internes — CLI ou dashboard Convex uniquement, jamais exposées aux clients) :

```bash
# 1. Au premier jour d'une phase : geler les pools pour les sujets de l'étude
npx convex run experiment:freezePoolsForPhase '{"phase": 2, "topics": ["Determinants", "Eigenvalues & Vectors", "Derivatives"]}'

# 2. Enrôler chaque participant (l'ordre d'enrôlement équilibre le carré latin)
npx convex run experiment:enrollParticipant '{"userId": "<clerk-id>", "phase": 2, "topics": ["Determinants", "Eigenvalues & Vectors", "Derivatives"]}'

# 3. Activer la phase (le forçage de condition ne s'applique que phase active)
npx convex run experiment:setActivePhase '{"phase": 2}'

# 4. Suivi
npx convex run experiment:getExperimentStatus '{}'

# 5. Fin de phase : désactiver, puis exporter
npx convex run experiment:setActivePhase '{"phase": null}'
npx convex run experiment:exportSubmissions '{"phase": 2}' > phase2_submissions.json
npx convex run experiment:exportGradingLogs '{"phase": 2}' > phase2_grading_logs.json
```

⚠️ Les `topics` passés à l'enrôlement et au gel doivent utiliser les **slugs** de sujets — la même convention que `submissions.topicName` (ex. `"determinants"`, `"eigenvalues"`, `"derivatives"`, pas les titres affichés). C'est aussi ce que le CAS direct et le mode quiz attendent.

### 7.5 Mode quiz pré/post — **IMPLÉMENTÉ (17 juillet 2026)**

- **Backend** `convex/studyQuiz.ts` + table `studyQuizAttempts` : au démarrage, le client génère ~42 problèmes candidats **équilibrés par palier** depuis le générateur paramétrique du sujet ; le serveur retient 6 items dont la vérité terrain est calculable par le **CAS direct** (`computeDirectGroundTruth`, jamais le repli LLM) en imposant la **composition fixe 2 faciles / 2 moyens / 2 difficiles** (classificateurs partagés `src/data/difficultyClassifiers.ts`, présentés en ordre croissant de difficulté) — garantit que pré et post ont le même mélange de difficultés. Snapshot avec les vérités terrain (jamais envoyées au client). À la soumission, correction 100 % déterministe (`checkEquivalenceDirect`). Réponse vide ou imparsable = incorrecte (pré-spécifié) ; `casChecked=false` journalisé pour transparence. Une seule tentative par participant × sujet × type ; chronomètre serveur (pre/post 15 min, différé 10 min, grâce 60 s, dépassement flaggé `overTime` sans rejet) ; reprise après déconnexion ; autosauvegarde. Aucun score ni feedback montré à l'étudiant.
- **Frontend** : `/study` (tableau de bord participant — sujets assignés dans l'ordre, sans jamais révéler la condition) et `/study/quiz/[topicId]?type=pre|post|delayed` (écran d'instructions, 6 items, compte à rebours avec soumission automatique à 0:00, confirmation de soumission).
- **Export** : `npx convex run studyQuiz:exportQuizAttempts '{"phase": 2}'` (pseudonymisé par `participantCode`).
- **Tests** : `convex/studyQuiz.test.ts` (bun test) vérifie pour chaque sujet de l'étude que ≥ 6/40 problèmes générés sont corrigeables par CAS direct, que la solution officielle du générateur est notée correcte, et qu'une réponse absurde ne l'est jamais. Sujets validés : `determinants`, `eigenvalues`, `derivatives`.

### 7.6 Contraintes de session de pratique (§5.2) — **IMPLÉMENTÉ (17 juillet 2026)**

- **Sessions** (`convex/studyPractice.ts` + table `studyPracticeSessions`) : 30 min par sujet, minimum 6 soumissions pour terminer (à l'expiration du temps, clôture possible sous le minimum, flaggée `underMinimum` pour la règle d'exclusion §9.4 — le participant n'est jamais bloqué). Reprise après déconnexion. Page `/study/practice/[topicId]`.
- **Ordre protocolaire imposé côté serveur** : pré-quiz soumis → session de pratique débloquée ; session terminée → post-quiz débloqué ; post-quiz soumis → quiz différé débloqué. Le tableau de bord `/study` affiche les trois étapes avec verrous.
- **Séquence de difficulté fixe** (`src/data/studyDifficulty.ts`) : 2 faciles → 2 moyens → 2 difficiles, identique dans les trois bras, obtenue par classification des variantes des générateurs + échantillonnage par rejet ; au-delà de 6, génération libre. Paliers validés par tests (`studyDifficulty.test.ts`) pour `determinants` (2×2 singulière → calcul 3×3 → 3×3 paramétrique), `eigenvalues` (diagonale → triangulaire → symétrique/équation caractéristique), `derivatives` (polynôme → règle de chaîne → produit/quotient).
- **Temps de lecture du feedback** : 20 s imposées avant « Next problem » (côté client).
- **Verrous serveur** (inviolables par l'interface) : indices/solutions désactivés dans `permissions.getPermissions` pour tout participant actif sur son sujet d'étude ; moteur adaptatif coupé dans `recommendations.generatePractice` ; **modèle de grading fixé côté serveur** (`STUDY_MODEL` dans `experiment.ts`, le sélecteur de modèle du client est ignoré) — renforce le gel §10.
- **Export** : `npx convex run studyPractice:exportPracticeSessions '{"phase": 2}'`.

**Gel du système pendant chaque phase :** aucun changement de prompt, de modèle LLM, de seuils, ni approbation de nouvelles corrections expertes influençant les pools. Les corrections expertes continuent d'être *collectées* (pour RQ4) mais n'entrent pas dans les few-shot avant la fin de la phase.

## 8. Randomisation et insu

- Séquence d'assignation générée par script (seed enregistré), stratifiée par médiane du pré-test global, blocs de 6 (les 6 permutations du carré latin).
- **Étudiants :** en insu de la condition (les trois bras produisent des feedbacks visuellement identiques en format).
- **Experts correcteurs :** en insu de la condition lors de la revue des soumissions (l'interface admin masque `experimentCondition` et les métadonnées Best-of-N).
- **Analyste :** analyse primaire réalisée sur données avec conditions codées A'/B'/C' masquées jusqu'au gel de la base et du plan d'analyse.
- L'IP (l'investigateur) n'interagit pas avec les participants pendant les sessions de pratique (surveillant neutre).

## 9. Plan d'analyse statistique

Pré-enregistré sur OSF avant le premier participant de la phase 2. Logiciel : R (lme4, emmeans) ou Python (statsmodels, pingouin). Seuil α = .05, corrections de Holm pour les comparaisons par paires.

### 9.1 H1/H2 — Effet de condition sur le gain

Modèle mixte linéaire :

```
g ~ condition + pré-test_c + sujet + ordre + (1 | étudiant)
```

Contrastes planifiés : B−A (H1), C−B (H2), C−A (secondaire). Tailles d'effet : d appariés avec IC 95 %. Analyse de sensibilité : ANCOVA sur post-test brut avec pré-test en covariable ; modèle bêta si distribution du gain non normale.

### 9.2 H3 — Judge vs outcome

Sur toutes les soumissions non terminales (celles qui ont un `outcomeReward`) :

- Corrélation de Spearman `judgeConfidence` × `outcomeReward`, avec IC bootstrap par grappes (étudiant).
- Modèle mixte : `outcomeReward ~ judgeConfidence + grade + difficulté + (1 | étudiant) + (1 | sujet)` — le coefficient de `judgeConfidence` est le test direct de H3.
- Courbe ROC : `judgeConfidence` comme prédicteur de `outcomeReward ≥ 5` (AUC avec IC).
- Interprétation pré-spécifiée : AUC < 0.6 ou ρ < 0.3 → le juge n'est pas un proxy fiable de l'efficacité pédagogique.

### 9.3 RQ4 — Experts vs juge (exploratoire)

Comparer l'`outcomeReward` moyen des feedbacks (a) modifiés par le juge, (b) corrigés par un expert (hors few-shot pendant la phase), (c) non modifiés.

### 9.4 Exclusions et données manquantes (règles pré-spécifiées)

- Exclusion d'un couple étudiant×sujet si : < 6 soumissions en pratique, pré-test = score max, temps total de pratique < 15 min, ou anomalie technique journalisée (échec API de grading > 2 fois dans la session).
- Étudiant exclu entièrement si ≥ 2 sujets exclus.
- Intention de traiter (toutes les données conservées) en analyse de sensibilité.
- Rétention J+7 : analyse sur cas complets + modèle avec données manquantes MAR (les absents au différé ne sont pas exclus de l'analyse immédiate).

## 10. Menaces à la validité et parades

| Menace | Parade |
|---|---|
| Le gain reflète la difficulté des problèmes, pas le feedback | Séquence de difficulté fixée, identique dans les 3 bras ; moteur adaptatif désactivé |
| L'instrument de mesure dépend du système manipulé | Pré/post corrigés exclusivement par CAS |
| Régression vers la moyenne | Pré-test en covariable ; stratification de la randomisation |
| Dérive du système pendant l'étude | Gel des prompts, modèles et pools few-shot ; versionnage |
| Effet d'ordre / fatigue | Carré latin sur ordre × condition ; pauses ; sessions ≤ 30 min |
| Apprentissage hors plateforme entre pré et post | Post-test immédiat le même jour ; le différé n'est que secondaire |
| Variabilité inter-LLM (non-déterminisme) | Journalisation des candidats et confidences ; température et version de modèle fixées |
| Attrition différentielle | Conditions within-subject (l'attrition retire l'étudiant des 3 bras à la fois) |
| Généralisabilité limitée à un site | Reconnaître en limitation ; seconde cohorte si faisable |

## 11. Éthique et protection des données

- **Approbations requises avant recrutement :** comité d'éthique institutionnel de rattachement du doctorat **et**, pour le site kényan : comité d'éthique du MMUST (IERC) + licence de recherche **NACOSTI** (National Commission for Science, Technology and Innovation — obligatoire pour toute recherche au Kenya, y compris pour un chercheur étranger). Prévoir 6–10 semaines.
- **Consentement éclairé écrit** : objectif (comparaison de types de feedback automatisé), volontariat, retrait sans conséquence sur les notes du cours, mention explicite que le feedback est généré par IA et peut contenir des erreurs.
- **Non-malfaisance :** le bras contrôle (A) reçoit le système standard, pas une absence de feedback — aucun participant n'est désavantagé pédagogiquement. Accès complet à la plateforme (meilleure condition) offert à tous après l'étude.
- **Données :** conformité au **Kenya Data Protection Act 2019** et au RGPD le cas échéant. Pseudonymisation à l'export (identifiants Clerk remplacés par des codes), pas de données de santé, âge/institution stockés séparément des réponses. Conservation : 5 ans sur stockage chiffré institutionnel. Les soumissions transitent par les API Gemini/OpenAI : le consentement le mentionne, et aucun nom n'est inclus dans les prompts.
- **Mineurs :** exclus (≥ 18 ans).

## 12. Calendrier prévisionnel

| Période | Jalon |
|---|---|
| Août 2026 | Instrumentation (§7.4), pilotage des items de quiz, dossiers éthique (IERC + NACOSTI) |
| Sept.–oct. 2026 | Pré-enregistrement OSF ; approbations éthiques |
| Oct.–nov. 2026 | **Phase 1** (bootstrap, 40–50 étudiants, bras A/B) |
| Déc. 2026 | Analyse intermédiaire phase 1 ; gel du pool outcome-validated ; critère de sortie vérifié |
| Janv.–févr. 2027 | **Phase 2** (80 étudiants, 3 bras) + différés J+7 |
| Mars 2027 | Gel de la base, levée de l'insu, analyse |
| Avr.–mai 2027 | Rédaction — cible : IJAIED (journal) ; version courte AIED/EDM si le calendrier des deadlines s'y prête |

## 13. Livrables et critères de succès

- Jeu de données anonymisé + code d'analyse publiés (OSF/GitHub) avec le papier.
- L'étude est concluante pour le papier **quelle que soit l'issue de H1–H3** : c'est la mesure conjointe (gain randomisé + corrélation judge/outcome) qui constitue la contribution, pas la confirmation des hypothèses.
