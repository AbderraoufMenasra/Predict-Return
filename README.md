# 📦 Application de Prédiction de Retours de Produits

Une application web interactive développée avec Streamlit pour prédire la probabilité de retour des produits à partir de données de commandes.

## 🎯 Fonctionnalités

- **Upload de fichiers** : Supporte les fichiers Excel (.xlsx) et CSV (.csv)
- **Validation automatique** : Vérification stricte du schéma de données
- **Nettoyage intelligent** : Gestion des valeurs manquantes et encodage des variables
- **Machine Learning** : Modèle LogisticRegression pour les prédictions
- **Visualisations** : Histogrammes, heatmap de corrélations, courbe ROC
- **Export des résultats** : Téléchargement des prédictions en Excel

## 📋 Schéma de données requis

Le fichier doit contenir exactement les colonnes suivantes :

| Colonne | Type | Description |
|---------|------|-------------|
| `id_commande` | entier | Identifiant unique de la commande |
| `id_client` | entier | Identifiant du client |
| `id_produit` | entier | Identifiant du produit |
| `prix` | décimal | Prix du produit |
| `catégorie` | texte | Catégorie du produit |
| `note_client` | décimal | Note client (peut être vide) |
| `retour` | entier | 1 si retourné, 0 sinon (obligatoire) |

## 🚀 Installation et Lancement

1. **Installer les dépendances** :
   ```bash
   pip install -r requirements.txt
   ```

2. **Lancer l'application** :
   ```bash
   streamlit run app.py
   ```

3. **Ouvrir votre navigateur** :
   L'application sera accessible à l'adresse `http://localhost:8501`

## 📊 Utilisation

1. **Page d'accueil** : Téléchargez votre fichier Excel/CSV
2. **Page Analyse** : Validation et prétraitement automatique des données
3. **Page Prédictions** : Visualisation des résultats et téléchargement

## 🎨 Interface

L'application dispose de trois pages principales :
- **🏠 Accueil** : Explications et upload de fichiers
- **📊 Analyse** : Validation des données et entraînement du modèle
- **📈 Prédictions** : Résultats, graphiques et export

## 📈 Visualisations disponibles

- Distribution des probabilités de retour
- Matrice de corrélation des variables
- Courbe ROC (si les vrais labels sont disponibles)

## 🔧 Technologies utilisées

- **Frontend** : Streamlit, HTML, CSS
- **Backend** : Python
- **Machine Learning** : scikit-learn
- **Data Processing** : Pandas, NumPy
- **Visualisation** : Matplotlib, Seaborn

## 📝 Notes importantes

- L'application gère automatiquement les valeurs manquantes
- Le modèle fonctionne avec ou sans la colonne `retour` (mode supervisé/non supervisé)
- Les prédictions sont exportées avec les probabilités et classifications binaires
- Interface responsive et intuitive avec des messages d'erreur clairs

## 🎯 Interprétation des résultats

- **Probabilité > 0.7** : Risque élevé de retour
- **Probabilité 0.3-0.7** : Risque modéré  
- **Probabilité < 0.3** : Faible risque de retour
