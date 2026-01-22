# Documentation de Maintenance du Fork Reactotron

## Vue d'ensemble

Ce document décrit les modifications apportées au fork `fulll/reactotron` et les procédures de maintenance pour faciliter les montées de version depuis le projet officiel `infinitered/reactotron`.

## Modifications apportées

### 1. Amélioration de la page Network

**Objectif** : Améliorer l'expérience développeur en facilitant la consultation et l'export des requêtes réseau.

#### Affichage amélioré des requêtes réseau

- **Fichier modifié** : [apps/reactotron-app/src/renderer/pages/network/components/NetworkRequestsList.tsx](apps/reactotron-app/src/renderer/pages/network/components/NetworkRequestsList.tsx)
- **Changement** : Le status code HTTP est affiché directement dans la liste avec un code couleur
  - **Vert** : 2xx (succès)
  - **Jaune** : 3xx (redirection)
  - **Orange** : 4xx (erreur client)
  - **Rouge** : 5xx (erreur serveur)
- **Raison** : Identification instantanée des requêtes en erreur sans avoir à ouvrir chaque ligne

#### Affichage brut du JSON (Raw JSON Toggle)

- **Fichier modifié** : [apps/reactotron-app/src/renderer/pages/network/components/NetworkRequestHeader.tsx](apps/reactotron-app/src/renderer/pages/network/components/NetworkRequestHeader.tsx)
- **Changement** : Ajout d'un toggle "Raw" dans l'onglet Response Body permettant d'afficher le JSON brut non formaté
- **Raison** : Facilite le copier-coller du JSON complet sans traitement

#### Boutons de copie rapide

- **Fichier modifié** : [apps/reactotron-app/src/renderer/pages/network/components/NetworkRequestsList.tsx](apps/reactotron-app/src/renderer/pages/network/components/NetworkRequestsList.tsx)
- **Fichier créé** : [apps/reactotron-app/src/renderer/utils/api-helpers.ts](apps/reactotron-app/src/renderer/utils/api-helpers.ts)
- **Changements** :
  - 3 boutons apparaissent au survol d'une requête :
    - **Copy JSON** : Copie la réponse JSON brute
    - **Copy Markdown** : Copie au format Markdown (request + response)
    - **Copy cURL** : Copie la commande cURL équivalente
- **Raison** : Permet d'exporter rapidement les requêtes pour documentation ou reproduction

### 2. Système d'onglets dans la Timeline

**Objectif** : Améliorer drastiquement l'ergonomie en évitant de filtrer manuellement à chaque fois.

**Problème dans Reactotron original** : Pour voir une catégorie spécifique (logs, requêtes réseau, actions Redux), il faut utiliser les filtres textuels à chaque session, ce qui est fastidieux et ralentit fortement le debug.

**Solution apportée** : Ajout d'onglets cliquables dans la Timeline pour basculer instantanément entre les vues.

#### Onglets disponibles

- **Fichier modifié** : [apps/reactotron-app/src/renderer/pages/timeline/index.tsx](apps/reactotron-app/src/renderer/pages/timeline/index.tsx)
- **Fichier créé** : [apps/reactotron-app/src/renderer/pages/timeline/NetworkView.tsx](apps/reactotron-app/src/renderer/pages/timeline/NetworkView.tsx)
- **Changements** :
  - **All** : Vue complète de tous les événements (comportement d'origine)
  - **Logs** : Filtre automatiquement sur `CommandType.Log` avec checkboxes pour debug/warn/error
  - **Network** : Filtre sur `CommandType.ApiResponse` + interface dédiée avec liste et détails
  - **Actions** : Filtre sur `CommandType.StateActionComplete` (actions Redux/MST)
- **Raison** : Gain de temps massif, plus besoin de retaper les filtres, navigation ultra rapide entre catégories

## Astuces d'utilisation

### Navigation rapide dans Timeline

**Utilisation des onglets** :

- Cliquez sur **Logs** pour voir uniquement les logs avec filtrage par niveau (debug/warn/error)
- Cliquez sur **Network** pour accéder à l'interface réseau complète (liste + détails)
- Cliquez sur **Actions** pour suivre les actions Redux/MST uniquement
- Revenez sur **All** pour la vue complète

**Avantage par rapport à l'original** : Dans Reactotron de base, il faut saisir manuellement des filtres comme `type:api.response` ou `type:log` à chaque session. Les onglets rendent cette navigation instantanée et persistante.

## Configuration Git

Le fork est configuré avec deux remotes :

```bash
origin    git@github.com:fulll/reactotron.git        # Fork pour pousser les modifications
upstream  git@github.com:infinitered/reactotron.git  # Projet officiel pour synchronisation
```

## Procédure de mise à jour depuis upstream

### 1. Synchroniser avec le projet officiel

```bash
# Récupérer les dernières modifications du projet officiel
git fetch upstream

# Se placer sur la branche master
git checkout master

# Fusionner les modifications upstream
git merge upstream/master
```

### 2. Résoudre les conflits potentiels

Les fichiers modifiés susceptibles de générer des conflits :

- `apps/reactotron-app/src/renderer/pages/timeline/index.tsx`
- `apps/reactotron-app/src/renderer/components/SideBar/Sidebar.tsx`

**Stratégie de résolution** :

1. Pour les conflits dans les fichiers Timeline/Sidebar : **conserver nos modifications** (elles sont additives)
2. Pour les nouveaux fichiers upstream : les accepter tels quels
3. Tester l'application après la fusion

### 3. Vérifier les modifications

```bash
# Compiler et lancer en mode dev
yarn workspace reactotron-app start

# Vérifier que :
# - Le toggle Raw JSON fonctionne dans Timeline > Network
# - Les boutons Copy (JSON, Markdown, cURL) sont présents au survol
# - Le bouton Network n'apparaît pas dans la sidebar
```

### 4. Pousser vers le fork

```bash
# Pousser les modifications
git push origin master
```

## Build et distribution

### Build local pour macOS

```bash
# Build universel (Intel + Apple Silicon)
BUILD_TARGET=macos yarn workspace reactotron-app build:release
```

Les fichiers générés se trouvent dans :

- `apps/reactotron-app/dist/mac-arm64/Reactotron.app` (Apple Silicon)
- `apps/reactotron-app/dist/mac/Reactotron.app` (Intel)
- `apps/reactotron-app/dist/Reactotron-{version}-mac-arm64.dmg`
- `apps/reactotron-app/dist/Reactotron-{version}-mac-x64.dmg`

### Retirer la protection macOS

Sur les machines de l'équipe, après installation :

```bash
xattr -cr /Applications/Reactotron.app
```

Ou directement sur le fichier .app avant distribution :

```bash
xattr -cr apps/reactotron-app/dist/mac-arm64/Reactotron.app
```

## Checklist de maintenance

- [ ] Synchroniser avec upstream (`git fetch upstream && git merge upstream/master`)
- [ ] Résoudre les conflits en privilégiant nos modifications sur les fichiers Timeline
- [ ] Tester l'application en mode dev (`yarn workspace reactotron-app start`)
- [ ] Vérifier les 3 fonctionnalités clés :
  - [ ] Présence des onglet d'accès rapide dans la Timeline
  - [ ] Onglet network avec toutes ces améliorations
  - [ ] Toggle Raw JSON dans Timeline > Network
  - [ ] Boutons Copy au survol des requêtes
- [ ] Builder l'application (`BUILD_TARGET=macos yarn workspace reactotron-app build:release`)
- [ ] Faire une Release => Distribuer les DMGs en fichiers joints

## Points d'attention

1. **Ne pas modifier les package.json** : Garder les références à `infinitered/reactotron` car c'est un fork
2. **Commits séparés** : Garder nos modifications dans des commits distincts pour faciliter le cherry-pick si nécessaire
3. **Documentation** : Mettre à jour ce document si de nouvelles modifications sont apportées

## Contacts

Pour toute question sur le fork ou les modifications, contacter l'équipe mobile Fulll.
