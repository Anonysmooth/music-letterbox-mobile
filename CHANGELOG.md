# Changelog

## [Unreleased]

---

## [1.7.0] - 2026-02-23

### Ajouté
- Feed "Communauté" sur `HomeScreen` : liste horizontale des albums récents des autres utilisateurs publics (tous statuts, max 10)
- Section "Aimé par" sur `AlbumDetailScreen` : affiche les usernames des utilisateurs ayant mis l'album en favori (ex : "Aimé par alice, bob et 2 autres")
- Toggle de confidentialité sur `ProfileScreen` (section "Confidentialité") : permet de se retirer du feed communautaire
- Nouveau service `communityService.ts` avec deux méthodes utilisant les collection group queries Firestore :
  - `getRecentCommunityAlbums` : index `isPublicFeed ASC + createdAt DESC`
  - `getLikedByInfo` : index `deezerId ASC + status ASC + isPublicFeed ASC`
- Types `CommunityAlbum` et `LikedByInfo` dans `types/index.ts`
- Champs dénormalisés sur chaque document album : `userId`, `username`, `isPublicFeed`
- `authService.updatePrivacy` : met à jour `isPublic` sur le doc user + `isPublicFeed` sur tous ses albums (batch)
- `updatePrivacy` exposé dans `AuthContext`

### Modifié
- `authService.updateProfile` : met à jour en batch le champ `username` sur tous les albums lors d'un changement de pseudo
- `AlbumDetailScreen.loadAlbum` : `getLikedByInfo` appelé quel que soit le chemin de navigation (`fromDeezer` true ou false)
- JSDoc ajoutés sur toutes les méthodes de `authService.ts`

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
