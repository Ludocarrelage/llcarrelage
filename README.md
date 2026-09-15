# LL Carrelage

Site vitrine de LL Carrelage, artisan carreleur intervenant à Villeneuve-Saint-Denis (77174) et dans un rayon d'environ 30 km.

Le site présente les prestations, la zone d'intervention, des réalisations, une FAQ et deux formulaires préparant une demande WhatsApp. Le formulaire public « Décrivez votre projet » produit un récapitulatif sans prix ; le devis est établi personnellement par LL Carrelage.

## Technologies

- HTML5
- CSS3
- JavaScript vanilla
- Aucun framework, backend ou service payant

## Structure du projet

```text
.
|-- index.html                 Contenu et structure du site
|-- styles.css                Mise en page et responsive
|-- script.js                 Menu, formulaire projet, galerie et WhatsApp
|-- logo-ll-carrelage.jpg     Logo principal
|-- realisations/             Photos des chantiers
|-- map-tiles/                Images locales de la carte d'intervention
|-- _headers                  En-têtes de sécurité pour les hébergeurs compatibles
`-- SECURITE-PUBLICATION.txt  Recommandations avant publication
```

## Modifier le site

1. Modifier les textes et les sections dans `index.html`.
2. Modifier les couleurs, espacements et règles responsive dans `styles.css`.
3. Modifier les questions du formulaire public dans `index.html` et leur récapitulatif dans `script.js`, sans introduire de prix automatique.
4. Ajouter les nouvelles photos optimisées dans `realisations/`, puis ajouter leur balise dans la galerie de `index.html`.
5. Vérifier le site sur ordinateur et téléphone avant chaque publication.

Le site peut être ouvert directement avec `index.html`. Pour un contrôle plus fiable, utiliser Live Server dans Visual Studio Code ou un serveur local équivalent.

## Ajouter un chantier

La galerie utilise des blocs HTML réutilisables, sans bibliothèque supplémentaire. Dupliquer une `figure.realisations-card` dans la grille de `#realisations`, en conservant `role="button"`, `tabindex="0"` et un libellé `aria-label` adapté. Mettre à jour `data-gallery-index` dans l'ordre des photos, `data-gallery-src` pour la grande photo, `data-gallery-caption`, le texte alternatif de l'image et sa légende visible. Conserver des images optimisées, leurs dimensions et le chargement différé. Le JavaScript récupère automatiquement les éléments portant `data-gallery-index` pour la lightbox et son compteur.

Pour un nouveau chantier, ajouter un titre et un court contexte distincts avant ses photos ; ne renseigner la ville, la surface ou les détails techniques que s'ils sont confirmés. Conserver l'ordre avant / après lorsqu'il existe. Si une même réalisation figure aussi sur une page prestation, garder ses photos et légendes cohérentes.

## Contact et mesure

Le bloc « Vous préférez être rappelé ? » ouvre WhatsApp avec une demande de rappel, ou permet d'appeler directement. Les formulaires préparent également un message : le visiteur doit l'envoyer dans WhatsApp pour que LL Carrelage le reçoive. Le formulaire court conserve un lien vers le message préparé si la nouvelle fenêtre est bloquée ; modifier un champ invalide ce lien jusqu'à une nouvelle validation.

La barre Appeler / WhatsApp / Devis apparaît uniquement sur mobile et remplace alors le bouton WhatsApp flottant. Vérifier les huit pages publiques après toute modification de cette barre, notamment le menu, la saisie et le pied de page.

Aucun outil analytics n'est installé. Une mesure ultérieure pourrait distinguer les clics téléphone, WhatsApp et devis, le début du formulaire et la création du récapitulatif, sans transmettre les données saisies. Un clic WhatsApp ne prouve pas l'envoi du message ni la réception d'une demande.

## Publier sur GitHub Pages

1. Envoyer les modifications sur la branche `main`.
2. Ouvrir les paramètres du dépôt GitHub.
3. Aller dans **Pages**.
4. Choisir **Deploy from a branch**.
5. Sélectionner la branche `main` et le dossier `/ (root)`.
6. Enregistrer et attendre la fin du déploiement.

Avant l'envoi :

```bash
git add .
git commit -m "Mise à jour du site"
git push origin main
```

## Points importants

- Ne pas renommer les fichiers utilisés dans `index.html` sans mettre à jour leurs chemins.
- Conserver le numéro WhatsApp au format international `33618855886` dans `script.js`.
- Tester les trois étapes, le récapitulatif sans prix et les liens WhatsApp après toute modification des formulaires. Le simulateur privé dans `simulateur/` est distinct du formulaire public.
- Compresser les nouvelles photos avant publication pour garder un chargement rapide.
