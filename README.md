# Music Letterbox - Application Mobile

Une application mobile style Letterboxd pour la musique, connectée à l'API Deezer.

## Fonctionnalités

- **Authentification** : Inscription et connexion via Firebase Auth (email/mot de passe)
- **Recherche d'albums** : Recherchez des albums via l'API Deezer
- **Exploration par genre** : Parcourez les genres musicaux et découvrez les artistes associés (via Last.fm + Deezer)
- **Collection personnelle** : Ajoutez des albums à votre collection avec trois statuts :
  - Favoris
  - À écouter (Wishlist)
  - Écoutés
- **Notes et critiques** : Notez les albums de 0 à 5 étoiles et écrivez des critiques
- **Statistiques** : Visualisez vos statistiques de collection (artistes préférés, distribution des notes, etc.)
- **Page artiste** : Biographie (Last.fm), tags, statistiques d'écoute et discographie complète
- **Concerts & événements** : Prochains concerts et festivals de l'artiste en France (via Ticketmaster)
- **Feed communautaire** : Découvrez les albums récemment ajoutés par les autres utilisateurs sur l'écran d'accueil
- **Aimé par** : Sur la page d'un album, voyez qui d'autre l'a mis en favori
- **Confidentialité** : Toggle dans le profil pour désactiver sa visibilité dans la communauté
- **Thème sombre** : Interface élégante inspirée de Letterboxd

## Prérequis

- Node.js 18+
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`) pour la génération d'APK
- Android Studio (pour l'émulateur et la génération locale d'APK)
- Un compte Expo (gratuit) pour les builds EAS

## Installation

1. **Cloner et installer les dépendances :**

```bash
cd music-letterbox-mobile
npm install
```

2. **Lancer en mode développement :**

```bash
npm start
# ou
npx expo start
```

3. **Scanner le QR code** avec l'app Expo Go sur votre téléphone, ou appuyez sur `a` pour ouvrir l'émulateur Android.

## Génération d'APK

### Option 1 : Build EAS (Recommandé - Cloud Build)

1. **Connectez-vous à Expo :**
```bash
npx eas login
```

2. **Configurez le projet :**
```bash
npx eas build:configure
```

3. **Générer l'APK :**
```bash
npm run build:apk
# ou directement
npx eas build -p android --profile apk
```

L'APK sera disponible sur votre dashboard Expo une fois le build terminé.

### Option 2 : Build Local avec Android Studio

1. **Générer le projet natif Android :**
```bash
npx expo prebuild --platform android
```

2. **Ouvrir le dossier `android` dans Android Studio**

3. **Dans Android Studio :**
   - Attendez que Gradle sync se termine
   - Allez dans `Build > Build Bundle(s) / APK(s) > Build APK(s)`
   - L'APK sera dans `android/app/build/outputs/apk/release/`

### Option 3 : Build Local via CLI

1. **Générer le projet natif :**
```bash
npx expo prebuild --platform android
```

2. **Compiler l'APK :**
```bash
cd android
./gradlew assembleRelease
```

3. **L'APK se trouve dans :** `android/app/build/outputs/apk/release/app-release.apk`

## Structure du Projet

```
music-letterbox-mobile/
├── App.tsx                 # Point d'entrée
├── app.json               # Configuration Expo
├── eas.json               # Configuration EAS Build
├── package.json           # Dépendances
├── tsconfig.json          # Configuration TypeScript
├── assets/                # Images et icônes
└── src/
    ├── components/        # Composants réutilisables
    │   ├── AlbumCard.tsx
    │   ├── Button.tsx
    │   ├── EmptyState.tsx
    │   ├── Input.tsx
    │   ├── LoadingSpinner.tsx
    │   ├── StarRating.tsx
    │   └── StatusSelector.tsx
    ├── constants/         # Constantes (thème, couleurs)
    │   └── theme.ts
    ├── context/           # Contextes React
    │   ├── AlbumsContext.tsx
    │   └── AuthContext.tsx
    ├── navigation/        # Configuration navigation
    │   └── AppNavigator.tsx
    ├── screens/           # Écrans de l'app
    │   ├── AlbumDetailScreen.tsx
    │   ├── ArtistDetailScreen.tsx
    │   ├── CollectionScreen.tsx
    │   ├── HomeScreen.tsx
    │   ├── LoginScreen.tsx
    │   ├── ProfileScreen.tsx
    │   ├── RegisterScreen.tsx
    │   └── SearchScreen.tsx
    ├── config/            # Configuration
    │   └── apiKeys.ts     # Clés API (Last.fm, Ticketmaster)
    ├── services/          # Services (API, storage)
    │   ├── authService.ts
    │   ├── communityService.ts # Requêtes communautaires (feed, "aimé par")
    │   ├── deezerApi.ts
    │   ├── lastfmApi.ts        # API Last.fm (artistes par genre, bio)
    │   ├── ticketmasterApi.ts  # API Ticketmaster (concerts, festivals)
    │   └── storage.ts
    └── types/             # Types TypeScript
        └── index.ts
```

## Technologies Utilisées

- **React Native** avec **Expo**
- **TypeScript**
- **Firebase Auth** (authentification email/mot de passe)
- **Firebase Firestore** (profil utilisateur + albums liés au compte via `users/{uid}/albums/`)
- **React Navigation** (navigation par onglets et stack)
- **Expo Image** (chargement optimisé des images)
- **API Deezer** (recherche d'albums et métadonnées)
- **API Last.fm** (découverte d'artistes par genre, biographies)
- **API Ticketmaster** (concerts et festivals)

## Configuration des Assets

Avant de builder l'APK, assurez-vous d'avoir les assets suivants dans le dossier `assets/` :
- `icon.png` (1024x1024) - Icône de l'app
- `adaptive-icon.png` (1024x1024) - Icône adaptative Android
- `splash.png` (1284x2778) - Écran de chargement
- `favicon.png` (48x48) - Favicon pour web

Vous pouvez utiliser n'importe quel éditeur d'image pour créer ces assets avec le thème musical de l'app.

## Personnalisation

### Couleurs (src/constants/theme.ts)
- `background`: #14181c (fond principal)
- `accent`: #00e054 (vert - couleur d'accent)
- `orange`: #ff8000 (notes en étoiles)
- `blue`: #40bcf4 (wishlist)

### API Deezer
L'app utilise l'API Deezer publique. Aucune clé API n'est requise pour les requêtes de base (recherche, détails d'albums).

### API Last.fm
L'app utilise l'API Last.fm pour la découverte d'artistes par genre musical et les biographies d'artistes. Une clé API gratuite est nécessaire :

1. Créez un compte API sur [last.fm/api/account/create](https://www.last.fm/api/account/create)
2. Renseignez votre clé dans `src/config/apiKeys.ts`

### API Ticketmaster
L'app utilise l'API Ticketmaster Discovery pour afficher les prochains concerts et festivals des artistes en France. Une clé API gratuite est nécessaire :

1. Créez un compte développeur sur [developer.ticketmaster.com](https://developer.ticketmaster.com/)
2. Renseignez votre Consumer Key dans `src/config/apiKeys.ts`

## Changelog

### v1.7.0 - Fonctionnalités communautaires
- Feed "Communauté" sur l'écran d'accueil : albums récents des autres utilisateurs (tous statuts)
- Section "Aimé par" sur la page album : liste des utilisateurs qui ont mis l'album en favori
- Toggle de confidentialité dans le profil pour opt-out du feed communautaire
- Nouveau service `communityService.ts` (requêtes collection group Firestore)
- Champs dénormalisés sur les albums (`userId`, `username`, `isPublicFeed`) pour les requêtes communautaires
- Mise à jour batch de `isPublicFeed` lors du toggle de confidentialité
- Mise à jour batch de `username` sur tous les albums lors d'un changement de pseudo

### v1.6.0 - Albums liés au compte utilisateur (Firestore)
- Migration du stockage des albums de AsyncStorage vers Firestore (`users/{uid}/albums/`)
- Chaque utilisateur dispose de sa propre collection d'albums isolée
- Suppression automatique des albums lors de la suppression de compte
- Règles de sécurité Firestore mises à jour pour protéger les sous-collections
- Résistance aux valeurs `undefined` lors de l'écriture Firestore

### v1.5.0 - Authentification Firebase
- Intégration Firebase Auth (email/mot de passe)
- Profil utilisateur (`username`, `createdAt`) stocké dans Firestore (`users/{uid}`)
- Remplacement de l'authentification locale (AsyncStorage + hash custom)

### v1.4.0 - Page Artiste & Concerts
- Nouvel écran **ArtistDetailScreen** avec biographie (Last.fm en français), tags, statistiques d'écoute et discographie complète
- Ajout des **prochains concerts et festivals** en France via l'API Ticketmaster Discovery (résolution par attractionId pour inclure les festivals)
- Navigation vers la page artiste depuis le nom de l'artiste dans AlbumDetailScreen (lien souligné)
- Navigation vers la page artiste depuis les cards artistes dans SearchScreen (genres et recherche)
- Nouveau service `ticketmasterApi.ts` et méthode `lastfmApi.getArtistInfo()`
- Quick-add buttons sur les albums depuis la page artiste

### v1.3.0 - Exploration par genre (Last.fm)
- Ajout de l'API Last.fm pour récupérer les artistes par genre musical
- Affichage des genres sous forme de cartes avec images d'artistes représentatifs
- Clic sur un genre → liste des artistes (images Deezer) → albums de l'artiste
- Récupération automatique du genre lors de l'ajout d'un album à la collection
- Nouveau service `lastfmApi.ts` et fichier de configuration `apiKeys.ts`

### v1.2.0 - Genres sur la page Recherche
- Ajout de suggestions de genres sur la page Recherche
- Affichage des artistes par genre via l'API Deezer

### v1.1.0 - Genres sur la page Collection
- Ajout d'un filtre par genre musical sur la page Collection
- Chips de genres avec filtrage dynamique

### v1.0.1 - Corrections
- Correction de la hauteur de l'application (safe area)

### v1.0.0 - Première version
- Recherche d'albums via l'API Deezer
- Collection personnelle avec statuts (favoris, à écouter, écoutés)
- Notes et critiques
- Statistiques de collection
- Authentification locale
- Thème sombre

## Licence

MIT
