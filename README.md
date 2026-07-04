# LL Carrelage

Site vitrine de LL Carrelage, artisan carreleur intervenant principalement en Isère et dans le Rhône.

Le site présente les prestations, la zone d'intervention, des réalisations, une FAQ, un formulaire de contact WhatsApp et un calculateur de devis indicatif.

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
|-- script.js                 Menu, calculateur, galerie et WhatsApp
|-- logo-ll-carrelage.jpg     Logo principal
|-- realisations/             Photos des chantiers
|-- map-tiles/                Images locales de la carte d'intervention
|-- _headers                  En-têtes de sécurité pour les hébergeurs compatibles
`-- SECURITE-PUBLICATION.txt  Recommandations avant publication
```

## Modifier le site

1. Modifier les textes et les sections dans `index.html`.
2. Modifier les couleurs, espacements et règles responsive dans `styles.css`.
3. Modifier les tarifs du calculateur dans `calculatorBaseRates` et `calculatorAdjustments`, dans `script.js`.
4. Ajouter les nouvelles photos optimisées dans `realisations/`, puis ajouter leur balise dans la galerie de `index.html`.
5. Vérifier le site sur ordinateur et téléphone avant chaque publication.

Le site peut être ouvert directement avec `index.html`. Pour un contrôle plus fiable, utiliser Live Server dans Visual Studio Code ou un serveur local équivalent.

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
- Tester le calculateur après toute modification de tarif ou de champ.
- Compresser les nouvelles photos avant publication pour garder un chargement rapide.

