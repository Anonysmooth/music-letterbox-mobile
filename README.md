# Music Letterbox - Application Mobile

Une application mobile style Letterboxd pour la musique, connectée à l'API Deezer.

## Fonctionnalités

- **Authentification** : Inscription et connexion locale sécurisée
- **Recherche d'albums** : Recherchez des albums via l'API Deezer
- **Collection personnelle** : Ajoutez des albums à votre collection avec trois statuts :
  - Favoris
  - À écouter (Wishlist)
  - Écoutés
- **Notes et critiques** : Notez les albums de 0 à 5 étoiles et écrivez des critiques
- **Statistiques** : Visualisez vos statistiques de collection (artistes préférés, distribution des notes, etc.)
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
    │   ├── CollectionScreen.tsx
    │   ├── HomeScreen.tsx
    │   ├── LoginScreen.tsx
    │   ├── ProfileScreen.tsx
    │   ├── RegisterScreen.tsx
    │   └── SearchScreen.tsx
    ├── services/          # Services (API, storage)
    │   ├── authService.ts
    │   ├── deezerApi.ts
    │   └── storage.ts
    └── types/             # Types TypeScript
        └── index.ts
```

## Technologies Utilisées

- **React Native** avec **Expo**
- **TypeScript**
- **React Navigation** (navigation par onglets et stack)
- **Expo Image** (chargement optimisé des images)
- **Expo SecureStore** (stockage sécurisé des tokens)
- **AsyncStorage** (stockage local des données)
- **API Deezer** (recherche d'albums et métadonnées)

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

## Licence

MIT
