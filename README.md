# Mecanoo — Frontend

Application mobile du projet Mecanoo, plateforme de mise en relation entre automobilistes et garagistes indépendants.

## Stack technique

- **Framework** : React Native + Expo
- **Langage** : TypeScript
- **Navigation** : React Navigation
- **Stockage sécurisé** : expo-secure-store (tokens JWT)
- **Déploiement web** : Expo Web + Nginx
- **CI/CD** : GitHub Actions + Docker + K3s

## Installation

### Prérequis

- Node.js >= 18
- Expo Go (iOS / Android) pour le développement mobile

### Démarrage

```bash
git clone [url-repo-frontend]
cd [repo-frontend]
npm install
npx expo start
```


## Déploiement

Le frontend est exporté en version web statique avec npx expo export --platform web, buildé dans une image Docker multi-stage (Node.js pour le build, Nginx pour le serving) et déployé sur le même VPS que le backend avec K3s.

Le pipeline CI/CD GitHub Actions se déclenche à chaque push sur main et exécute dans l'ordre :
1. Checkout du repository
2. Connexion au GitHub Container Registry
3. Configuration de Docker Buildx
4. Build et push de l'image Docker
5. Copie des manifests Kubernetes sur le VPS
6. Déploiement sur K3s