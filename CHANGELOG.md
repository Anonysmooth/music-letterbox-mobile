# Changelog

## [Unreleased]

### Ajouté
- Intégration Firebase (Auth + Firestore)
- Configuration Firebase dans `src/config/firebase.ts`

### Modifié
- Authentification migrée de AsyncStorage/hash local vers Firebase Auth (email/mot de passe)
- Profil utilisateur (`username`, `createdAt`) stocké dans Firestore (collection `users/{uid}`)
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
- Collection personnelle avec trois statuts : Favoris, À écouter, Écoutés
- Notes (0-5 étoiles) et critiques
- Statistiques de collection
- Interface thème sombre inspirée de Letterboxd
