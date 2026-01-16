from flask import Flask, render_template, request, jsonify, send_file
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder, StandardScaler
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64
import warnings
import os
warnings.filterwarnings('ignore')

app = Flask(__name__)

app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

class DataProcessor:
    @staticmethod
    def validate_schema(df):
        # Mapping flexible des colonnes
        column_mapping = {
            'id_commande': ['id_commande', 'id commande', 'commande_id', 'commande', 'order_id'],
            'id_client': ['id_client', 'id client', 'client_id', 'client', 'customer_id'],
            'id_produit': ['id_produit', 'id produit', 'produit_id', 'produit', 'product_id'],
            'prix': ['prix', 'price', 'montant', 'amount', 'cout'],
            'catégorie': ['catégorie', 'categorie', 'category', 'type', 'secteur'],
            'note_client': ['note_client', 'note client', 'note', 'rating', 'score', 'evaluation'],
            'retour': ['retour', 'returned', 'is_returned', 'return_status']
        }
        
        errors = []
        found_columns = {}
        
        # Vérifier chaque colonne requise
        for required_col, possible_names in column_mapping.items():
            found = False
            for possible_name in possible_names:
                matching_cols = [col for col in df.columns if col.lower().strip() == possible_name.lower().strip()]
                if matching_cols:
                    found_columns[required_col] = matching_cols[0]
                    found = True
                    break
            
            if not found:
                errors.append(f"Colonne manquante: {required_col} (recherché: {', '.join(possible_names)})")
        
        # Si on a trouvé toutes les colonnes requises, renommer les colonnes
        if len(errors) == 0:
            for standard_name, actual_name in found_columns.items():
                if standard_name != actual_name:
                    df = df.rename(columns={actual_name: standard_name})
            
            # Validation spécifique pour la colonne retour
            if 'retour' in df.columns:
                # Vérifier que la colonne retour ne contient que 0 ou 1
                unique_values = df['retour'].dropna().unique()
                invalid_values = [val for val in unique_values if val not in [0, 1]]
                
                if invalid_values:
                    errors.append(f"La colonne 'retour' doit contenir uniquement 0 ou 1. Valeurs trouvées: {invalid_values}")
                
                # Vérifier qu'il n'y a pas de valeurs manquantes dans retour
                if df['retour'].isnull().any():
                    errors.append("La colonne 'retour' ne peut pas contenir de valeurs manquantes")
        
        return len(errors) == 0, errors, df if len(errors) == 0 else None
    
    @staticmethod
    def clean_and_preprocess_data(df):
        df_clean = df.copy()
        if 'note_client' in df_clean.columns:
            df_clean['note_client'] = df_clean['note_client'].fillna(df_clean['note_client'].mean())
        if 'catégorie' in df_clean.columns:
            mode_cat = df_clean['catégorie'].mode()[0] if not df_clean['catégorie'].mode().empty else 'Inconnue'
            df_clean['catégorie'] = df_clean['catégorie'].fillna(mode_cat)
        
        label_encoders = {}
        if 'catégorie' in df_clean.columns:
            le = LabelEncoder()
            df_clean['catégorie_encoded'] = le.fit_transform(df_clean['catégorie'].astype(str))
            label_encoders['catégorie'] = le
        
        return df_clean, label_encoders

class ModelTrainer:
    @staticmethod
    def train_model(df_clean):
        feature_columns = ['prix', 'note_client', 'catégorie_encoded']
        available_features = [col for col in feature_columns if col in df_clean.columns]
        X = df_clean[available_features]
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        model = LogisticRegression(random_state=42, max_iter=1000)
        
        # La colonne 'retour' est maintenant obligatoire
        y = df_clean['retour']
        model.fit(X_scaled, y)
        has_labels = True
        
        return model, scaler, available_features, has_labels
    
    @staticmethod
    def make_predictions(model, scaler, df_clean, feature_columns):
        X = df_clean[feature_columns]
        X_scaled = scaler.transform(X)
        probas = model.predict_proba(X_scaled)[:, 1]
        predictions = (probas > 0.5).astype(int)
        return probas, predictions

@app.route('/')
def index():
    return send_file('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'Aucun fichier fourni'})
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Aucun fichier sélectionné'})
        
        if file.filename.endswith('.xlsx'):
            df = pd.read_excel(file)
        elif file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            return jsonify({'success': False, 'error': 'Format de fichier non supporté. Utilisez .xlsx ou .csv'})
        
        # Afficher les colonnes trouvées pour debug
        print(f"Colonnes trouvées: {list(df.columns)}")
        
        is_valid, errors, df_normalized = DataProcessor.validate_schema(df)
        if not is_valid:
            # Afficher les colonnes disponibles dans le message d'erreur
            available_cols = ', '.join(df.columns.tolist())
            error_msg = f"Erreurs: {'; '.join(errors)}<br><br>Colonnes disponibles: {available_cols}"
            return jsonify({'success': False, 'error': error_msg})
        
        df_clean, label_encoders = DataProcessor.clean_and_preprocess_data(df_normalized)
        
        stats = {
            'Total commandes': int(len(df_normalized)),
            'Valeurs manquantes': int(df_normalized.isnull().sum().sum()),
            'Taux de retour': f"{float(df_normalized['retour'].mean()):.2%}" if 'retour' in df_normalized.columns else 'N/A'
        }
        
        # Convertir les données pour la sérialisation JSON
        def convert_to_serializable(obj):
            if pd.isna(obj):
                return None
            elif hasattr(obj, 'dtype'):
                if obj.dtype in ['int64', 'int32', 'int16', 'int8']:
                    return int(obj)
                elif obj.dtype in ['float64', 'float32']:
                    return float(obj)
                elif obj.dtype == 'bool':
                    return bool(obj)
                else:
                    return str(obj)
            elif isinstance(obj, (np.int64, np.int32, np.int16, np.int8)):
                return int(obj)
            elif isinstance(obj, (np.float64, np.float32)):
                return float(obj)
            elif isinstance(obj, np.bool_):
                return bool(obj)
            elif isinstance(obj, (list, tuple)):
                return [convert_to_serializable(item) for item in obj]
            elif isinstance(obj, dict):
                return {key: convert_to_serializable(value) for key, value in obj.items()}
            else:
                return obj
        
        # Convertir le preview
        preview_data = []
        for _, row in df_normalized.head(10).iterrows():
            row_dict = {}
            for col in df_normalized.columns:
                val = row[col]
                row_dict[col] = convert_to_serializable(val)
            preview_data.append(row_dict)
        
        app.current_analysis = {
            'df_clean': df_clean, 'original_df': df_normalized,
            'label_encoders': label_encoders, 'stats': stats, 'preview': preview_data
        }
        
        return jsonify({'success': True, 'data': {'stats': stats, 'preview': preview_data}})
        
    except Exception as e:
        print(f"Erreur détaillée: {str(e)}")
        return jsonify({'success': False, 'error': f'Erreur: {str(e)}'})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if not hasattr(app, 'current_analysis'):
            return jsonify({'success': False, 'error': 'Aucune donnée analysée'})
        
        df_clean = app.current_analysis['df_clean']
        original_df = app.current_analysis['original_df']
        
        model, scaler, feature_columns, has_labels = ModelTrainer.train_model(df_clean)
        probas, predictions = ModelTrainer.make_predictions(model, scaler, df_clean, feature_columns)
        
        result_df = original_df.copy()
        result_df['probabilite_retour'] = probas
        result_df['prediction_retour'] = predictions
        
        total_orders = len(result_df)
        high_risk = (probas > 0.7).sum()
        medium_risk = ((probas > 0.3) & (probas <= 0.7)).sum()
        low_risk = (probas <= 0.3).sum()
        
        visualizations = []
        plt.style.use('default')
        
        fig, ax = plt.subplots(figsize=(10, 6))
        ax.hist(probas, bins=30, alpha=0.7, color='skyblue', edgecolor='black')
        ax.set_xlabel('Probabilité de retour')
        ax.set_ylabel('Nombre de commandes')
        ax.set_title('Distribution des probabilités de retour')
        ax.grid(True, alpha=0.3)
        
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight')
        img_buffer.seek(0)
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        visualizations.append({'title': 'Distribution des probabilités', 'image': img_base64})
        plt.close()
        
        predictions_data = []
        for i, (idx, row) in enumerate(result_df.iterrows()):
            if i < 20:
                predictions_data.append({
                    'id_commande': int(row['id_commande']) if pd.notna(row['id_commande']) else None,
                    'probability': float(probas[i]),
                    'prediction': int(predictions[i])
                })
        
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            result_df.to_excel(writer, sheet_name='Prédictions', index=False)
            summary_data = {
                'Métrique': ['Total commandes', 'À haut risque', 'À risque moyen', 'À faible risque'],
                'Nombre': [total_orders, high_risk, medium_risk, low_risk],
                'Pourcentage': [100, high_risk/total_orders*100, medium_risk/total_orders*100, low_risk/total_orders*100]
            }
            pd.DataFrame(summary_data).to_excel(writer, sheet_name='Résumé', index=False)
        
        output.seek(0)
        app.current_predictions_file = output
        
        predictions_result = {
            'total_orders': total_orders, 'high_risk': high_risk,
            'high_risk_percent': f"{high_risk/total_orders*100:.1f}",
            'medium_risk': medium_risk, 'medium_risk_percent': f"{medium_risk/total_orders*100:.1f}",
            'low_risk': low_risk, 'low_risk_percent': f"{low_risk/total_orders*100:.1f}",
            'predictions': predictions_data, 'visualizations': visualizations,
            'download_url': '/download'
        }
        
        return jsonify({'success': True, 'data': predictions_result})
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'Erreur: {str(e)}'})

@app.route('/predict_single', methods=['POST'])
def predict_single():
    try:
        if not hasattr(app, 'current_analysis'):
            return jsonify({'success': False, 'error': 'Aucune donnée analysée'})
        
        data = request.get_json()
        
        # Validation des données
        required_fields = ['categorie', 'prix']
        for field in required_fields:
            if field not in data or data[field] is None:
                return jsonify({'success': False, 'error': f'Champ manquant: {field}'})
        
        # Récupérer les données du formulaire
        categorie = data['categorie']
        prix = float(data['prix'])
        note_client = data.get('note_client')
        
        # Récupérer le modèle et les encodeurs entraînés
        df_clean = app.current_analysis['df_clean']
        label_encoders = app.current_analysis['label_encoders']
        
        # Créer un DataFrame avec les données du produit
        product_data = {
            'prix': [prix],
            'note_client': [note_client] if note_client is not None else [df_clean['note_client'].mean()],
            'catégorie': [categorie]
        }
        
        product_df = pd.DataFrame(product_data)
        
        # Encoder la catégorie
        if 'catégorie' in label_encoders:
            le = label_encoders['catégorie']
            try:
                product_df['catégorie_encoded'] = le.transform(product_df['catégorie'])
            except ValueError:
                # Si la catégorie n'existe pas, utiliser la catégorie la plus fréquente
                most_common = df_clean['catégorie'].mode()[0] if not df_clean['catégorie'].mode().empty else 'Inconnue'
                product_df['catégorie_encoded'] = le.transform([most_common])
        else:
            product_df['catégorie_encoded'] = 0
        
        # Remplir la note client si vide
        if pd.isna(product_df['note_client'].iloc[0]):
            product_df['note_client'] = df_clean['note_client'].mean()
        
        # Récupérer le modèle et le scaler
        model, scaler, feature_columns, _ = ModelTrainer.train_model(df_clean)
        
        # Faire la prédiction
        probas, predictions = ModelTrainer.make_predictions(model, scaler, product_df, feature_columns)
        
        result = {
            'probability': float(probas[0]),
            'prediction': int(predictions[0]),
            'input_data': {
                'categorie': categorie,
                'prix': prix,
                'note_client': note_client
            }
        }
        
        return jsonify({'success': True, 'data': result})
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'Erreur: {str(e)}'})

@app.route('/download')
def download():
    try:
        if not hasattr(app, 'current_predictions_file'):
            return "Aucun fichier disponible", 404
        output = app.current_predictions_file
        output.seek(0)
        return send_file(output, as_attachment=True, 
                         download_name='predictions_retours.xlsx')
    except Exception as e:
        return f"Erreur: {str(e)}", 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)