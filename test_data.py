import pandas as pd
import numpy as np
import random

# Créer des données d'exemple avec les bonnes colonnes
np.random.seed(42)
n_orders = 50

data = {
    'id_commande': range(1, n_orders + 1),
    'id_client': np.random.randint(1, 50, n_orders),
    'id_produit': np.random.randint(1, 20, n_orders),
    'prix': np.random.uniform(10, 500, n_orders).round(2),
    'catégorie': np.random.choice(['Électronique', 'Vêtements', 'Maison', 'Sports', 'Livres'], n_orders),
    'note_client': np.random.uniform(1, 5, n_orders).round(1),
    'retour': np.random.choice([0, 1], n_orders, p=[0.8, 0.2])
}

df = pd.DataFrame(data)
df.to_excel('test_file.xlsx', index=False)
print('Fichier test_file.xlsx créé avec succès')
print('Colonnes:', list(df.columns))
print(df.head())
