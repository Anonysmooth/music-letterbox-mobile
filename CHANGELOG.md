# Changelog

## [Unreleased]

---

## [1.6.0] - 2026-02-22

### Ajouté
- Stockage des albums par utilisateur dans Firestore (`users/{uid}/albums/{albumId}`)
- Suppression automatique de tous les albums lors de la suppression de compte (`authService.deleteAccount`)
- Helper `stripUndefined` dans `storage.ts` pour éviter les erreurs Firestore sur les champs optionnels à `undefined`
- Commentaires JSDoc sur toutes les méthodes de `storage.ts`

### Modifié
- `storage.ts` entièrement réécrit : AsyncStorage remplacé par Firestore
  - `getAlbums()` : query ordonnée par `createdAt` desc
  - `getAlbumsByStatus()` : query Firestore directe avec `where` + `orderBy`
  - `getAlbumByDeezerId()` / `updateAlbumByDeezerId()` : query Firestore directe avec `where`
- `AlbumsContext.tsx` : dépendance `isAuthenticated` → `user?.id` pour recharger la collection au changement d'utilisateur
- Règles de sécurité Firestore mises à jour pour couvrir la sous-collection `albums`

### Supprimé
- Dépendance à `AsyncStorage` pour le stockage des albums

---

## [1.5.0] - 2026-02-20

### Ajouté
- Intégration Firebase Auth (email/mot de passe)
- Intégration Firebase Firestore pour le profil utilisateur (`users/{uid}` : `username`, `createdAt`)
- Configuration Firebase dans `src/config/firebase.ts`
- `authService.ts` : service d'authentification complet (register, login, logout, updateProfile, changePassword, deleteAccount)
- `AuthContext.tsx` : contexte React exposant l'état d'authentification et les actions

### Modifié
- Authentification migrée de AsyncStorage/hash local vers Firebase Auth
- Dépendance `firebase ^12.9.0` ajoutée
- `react` épinglé à `19.1.4` pour compatibilité avec `react-native-renderer`

### Supprimé
- Stockage local des utilisateurs (AsyncStorage + hash custom)
- Dépendance `expo-secure-store` du flux d'authentification

---

## [1.0.0] - 2026-02-17

### Ajouté
- Première version de l'application
- Recherche d'albums via l'API Deezer
- Exploration par genre via Last.fm + Deezer (cartes de genres avec images)
- Page artiste avec biographie (Last.fm), tags, statistiques et discographie
- Prochains concerts et festivals en France via l'API Ticketmaster
- Collection personnelle avec trois statuts : Favoris, À écouter, Écoutés
- Notes (0-5 étoiles) et critiques textuelles
- Statistiques de collection (artistes préférés, genres, distribution des notes)
- Liens vers les plateformes de streaming et sites e-commerce depuis la page album
- Interface thème sombre inspirée de Letterboxd
