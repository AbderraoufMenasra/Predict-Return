# 📦 Application de Prédiction de Retours de Produits

Une application web interactive qui permet d'estimer la probabilité de retour des produits à partir de données de commandes.

## 🎯 Fonctionnalités

- **Upload de fichiers** : Supporte les fichiers Excel (.xlsx) et CSV (.csv)
- **Validation automatique** : Vérification stricte du schéma de données
- **Nettoyage intelligent** : Gestion des valeurs manquantes et encodage des variables
- **Machine Learning** : Modèle LogisticRegression pour les prédictions

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
   L'application sera accessible à l'adresse `http://localhost:5000`

## 📊 Utilisation

1. **Page d'accueil** : Téléchargez votre fichier Excel/CSV
3. **Page Prédictions** : Visualisation des résultats et téléchargement

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

## 🎯 Interprétation des résultats

- **Probabilité > 0.7** : Risque élevé de retour
- **Probabilité 0.3-0.7** : Risque modéré  
- **Probabilité < 0.3** : Faible risque de retour
