// Variables globales
let uploadedFile = null;
let analysisData = null;
let predictionsData = null;

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Gestion de la navigation
    setupNavigation();
    
    // Gestion de l'upload de fichiers
    setupFileUpload();
    
    // Gestion du drag & drop
    setupDragAndDrop();
    
    // Gestion des modales
    setupModals();
}

// Configuration de la navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('data-page');
            showPage(targetPage);
        });
    });
}

// Affichage d'une page spécifique
function showPage(pageName) {
    // Masquer toutes les pages
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Afficher la page demandée
    const targetPage = document.getElementById(pageName);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Mettre à jour la navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageName) {
            link.classList.add('active');
        }
    });
    
    // Actions spécifiques selon la page
    if (pageName === 'predictions') {
        checkDataAndShowPredictions();
    }
}

// Configuration de l'upload de fichiers
function setupFileUpload() {
    const fileInput = document.getElementById('fileInput');
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            handleFileUpload(file);
        }
    });
}

// Configuration du drag & drop
function setupDragAndDrop() {
    const uploadArea = document.getElementById('uploadArea');
    
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
    
    // Clic sur la zone d'upload
    uploadArea.addEventListener('click', function(e) {
        if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
            document.getElementById('fileInput').click();
        }
    });
}

// Gestion de l'upload de fichier
function handleFileUpload(file) {
    // Vérification du type de fichier
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'application/csv'];
    const validExtensions = ['.xlsx', '.csv'];
    
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
        showMessage('error', 'Type de fichier invalide. Veuillez uploader un fichier .xlsx ou .csv');
        return;
    }
    
    uploadedFile = file;
    
    // Affichage des informations du fichier
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    
    fileName.textContent = file.name;
    fileInfo.style.display = 'block';
    
    // Masquer la zone d'upload
    document.getElementById('uploadArea').style.display = 'none';
    
    showMessage('success', `Fichier "${file.name}" téléchargé avec succès !`);
    
    // Lancer l'analyse automatiquement
    setTimeout(() => {
        performAnalysisOnHomePage();
    }, 1000);
}

// Suppression du fichier uploadé
function removeFile() {
    uploadedFile = null;
    analysisData = null;
    predictionsData = null;
    
    // Masquer les informations du fichier
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('uploadArea').style.display = 'block';
    
    // Masquer les résultats d'analyse sur la page d'accueil
    const homeAnalysisResults = document.getElementById('homeAnalysisResults');
    if (homeAnalysisResults) {
        homeAnalysisResults.style.display = 'none';
    }
    
    // Réinitialiser l'input
    document.getElementById('fileInput').value = '';
    
    showMessage('info', 'Fichier supprimé');
}

// Effectuer l'analyse sur la page d'accueil
async function performAnalysisOnHomePage() {
    showLoading(true);
    
    try {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        
        const response = await fetch('/analyze', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            analysisData = result.data;
            displayAnalysisResultsOnHomePage();
            showMessage('success', 'Analyse terminée avec succès !');
        } else {
            showMessage('error', result.error || 'Erreur lors de l\'analyse');
        }
    } catch (error) {
        showMessage('error', 'Erreur de connexion au serveur');
        console.error('Error:', error);
    } finally {
        showLoading(false);
    }
}

// Afficher les résultats de l'analyse sur la page d'accueil
function displayAnalysisResultsOnHomePage() {
    // Créer ou mettre à jour la section des résultats sur la page d'accueil
    let homeAnalysisResults = document.getElementById('homeAnalysisResults');
    
    if (!homeAnalysisResults) {
        homeAnalysisResults = document.createElement('div');
        homeAnalysisResults.id = 'homeAnalysisResults';
        homeAnalysisResults.className = 'home-analysis-results';
        
        // Insérer après la section d'upload
        const uploadSection = document.querySelector('.upload-section');
        uploadSection.parentNode.insertBefore(homeAnalysisResults, uploadSection.nextSibling);
    }
    
    let html = `
        <div class="success-box">
            <h3><i class="fas fa-check-circle"></i> Analyse terminée</h3>
            <p>Le fichier a été validé et traité avec succès.</p>
        </div>
        
        <div class="data-section">
            <h3><i class="fas fa-table"></i> Aperçu des données (10 premières lignes sur ${analysisData.stats['Total commandes']} au total)</h3>
            <div class="data-table">
                <table>
                    <thead>
                        <tr>
    `;
    
    // Définir l'ordre des colonnes souhaité avec leurs en-têtes
    const columnOrder = [
        {key: 'id_commande', label: 'id_commande'},
        {key: 'id_client', label: 'id_client'},
        {key: 'id_produit', label: 'id_produit'},
        {key: 'catégorie', label: 'catégorie'},
        {key: 'prix', label: 'prix (€)'},
        {key: 'note_client', label: 'note_client (/5)'},
        {key: 'retour', label: 'retour (0 ou 1)'}
    ];
    
    // Récupérer toutes les colonnes uniques depuis les données de preview
    const allColumns = new Set();
    const previewData = analysisData.preview || [];
    
    previewData.forEach(row => {
        Object.keys(row).forEach(col => allColumns.add(col));
    });
    
    // Filtrer pour n'afficher que les colonnes dans l'ordre spécifié
    const columnsArray = columnOrder.filter(col => allColumns.has(col.key));
    
    // Afficher les colonnes dans l'ordre spécifié
    columnsArray.forEach(col => {
        html += `<th>${col.label}</th>`;
    });
    
    html += `
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    // Afficher les 10 premières lignes avec toutes les colonnes
    previewData.slice(0, 10).forEach(row => {
        html += `<tr>`;
        columnsArray.forEach(colObj => {
            let value = row[colObj.key] !== undefined ? row[colObj.key] : '';
            
            // Ajouter les unités de mesure (sauf pour note_client où l'unité est déjà dans l'en-tête)
            if (colObj.key === 'prix' && value !== '') {
                value = `${value} €`;
            }
            // note_client n'a pas d'unité ajoutée ici, juste dans l'en-tête
            
            html += `<td>${value}</td>`;
        });
        html += `</tr>`;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
            <div class="table-info">
                <p><i class="fas fa-info-circle"></i> Affichage des 10 premières lignes sur ${analysisData.stats['Total commandes']} lignes au total</p>
            </div>
        </div>
        
        <div class="stats-section">
            <h3><i class="fas fa-chart-bar"></i> Statistiques descriptives</h3>
            <div class="metrics-grid">
    `;
    
    // Afficher les métriques
    const stats = analysisData.stats || {};
    Object.entries(stats).forEach(([key, value]) => {
        html += `
            <div class="metric-card">
                <h3>${value}</h3>
                <p>${key}</p>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
        
        <div class="action-section">
            <button class="btn btn-primary" onclick="showPage('predictions')">
                <i class="fas fa-arrow-right"></i> Estimer la probabilité de retour d'un produit
            </button>
        </div>
    `;
    
    homeAnalysisResults.innerHTML = html;
    homeAnalysisResults.style.display = 'block';
    
    // Faire défiler jusqu'aux résultats
    homeAnalysisResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Vérification des données et affichage des prédictions
function checkDataAndShowPredictions() {
    const predictionsPrompt = document.getElementById('predictionsPrompt');
    const predictionsContent = document.getElementById('predictionsContent');
    const singlePredictionForm = document.getElementById('singlePredictionForm');
    
    if (!analysisData) {
        predictionsPrompt.style.display = 'block';
        predictionsContent.style.display = 'none';
        singlePredictionForm.style.display = 'none';
    } else {
        predictionsPrompt.style.display = 'none';
        singlePredictionForm.style.display = 'block';
        
        if (!predictionsData) {
            // Afficher les prédictions batch si disponible
            if (app.current_analysis && app.current_analysis.original_df) {
                performPredictions();
            }
        } else {
            displayPredictionResults();
        }
    }
}

// Prédire un produit individuel
async function predictSingleProduct() {
    showLoading(true);
    
    try {
        // Récupérer les valeurs du formulaire
        const categorie = document.getElementById('categorie').value;
        const prix = parseFloat(document.getElementById('prix').value);
        const note_client = document.getElementById('note_client').value ? 
            parseFloat(document.getElementById('note_client').value) : null;
        
        // Validation
        if (!categorie || isNaN(prix)) {
            showMessage('error', 'Veuillez remplir tous les champs obligatoires');
            showLoading(false);
            return;
        }
        
        const response = await fetch('/predict_single', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                categorie: categorie,
                prix: prix,
                note_client: note_client
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            displaySinglePredictionResult(result.data);
            showMessage('success', 'Prédiction effectuée avec succès !');
        } else {
            showMessage('error', result.error || 'Erreur lors de la prédiction');
        }
    } catch (error) {
        showMessage('error', 'Erreur de connexion au serveur');
        console.error('Error:', error);
    } finally {
        showLoading(false);
    }
}

// Afficher le résultat de prédiction individuelle
function displaySinglePredictionResult(data) {
    const resultDiv = document.getElementById('singlePredictionResult');
    const probabilityValue = document.getElementById('probabilityValue');
    const probabilityText = document.getElementById('probabilityText');
    const riskLevel = document.getElementById('riskLevel');
    const predictionText = document.getElementById('predictionText');
    
    // Mettre à jour les valeurs
    const probability = data.probability * 100;
    probabilityValue.textContent = `${probability.toFixed(1)}%`;
    probabilityText.textContent = `${probability.toFixed(1)}%`;
    
    // Déterminer le niveau de risque
    let riskClass, riskLabel;
    if (probability > 70) {
        riskClass = 'risk-high';
        riskLabel = 'Élevé';
    } else if (probability > 30) {
        riskClass = 'risk-medium';
        riskLabel = 'Modéré';
    } else {
        riskClass = 'risk-low';
        riskLabel = 'Faible';
    }
    
    riskLevel.textContent = riskLabel;
    riskLevel.className = `risk-badge ${riskClass}`;
    
    // Prédiction
    predictionText.textContent = data.prediction === 1 ? 'Retour probable' : 'Retour improbable';
    
    // Mettre à jour le cercle de probabilité
    const probabilityCircle = document.querySelector('.probability-circle');
    const angle = (probability / 100) * 360;
    probabilityCircle.style.setProperty('--probability-angle', `${angle}deg`);
    
    // Afficher le résultat
    resultDiv.style.display = 'block';
    
    // Faire défiler jusqu'au résultat
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Effectuer les prédictions
async function performPredictions() {
    showLoading(true);
    
    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: analysisData
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            predictionsData = result.data;
            displayPredictionResults();
            showMessage('success', 'Prédictions générées avec succès !');
        } else {
            showMessage('error', result.error || 'Erreur lors des prédictions');
        }
    } catch (error) {
        showMessage('error', 'Erreur de connexion au serveur');
        console.error('Error:', error);
    } finally {
        showLoading(false);
    }
}

// Afficher les résultats des prédictions
function displayPredictionResults() {
    const predictionsContent = document.getElementById('predictionsContent');
    
    let html = `
        <div class="metrics-section">
            <h3><i class="fas fa-chart-line"></i> Métriques principales</h3>
            <div class="metrics-grid">
                <div class="metric-card">
                    <h3>${predictionsData.total_orders || 0}</h3>
                    <p>Total commandes</p>
                </div>
                <div class="metric-card">
                    <h3>${predictionsData.high_risk || 0}</h3>
                    <p>À haut risque (${predictionsData.high_risk_percent || 0}%)</p>
                </div>
                <div class="metric-card">
                    <h3>${predictionsData.medium_risk || 0}</h3>
                    <p>À risque moyen (${predictionsData.medium_risk_percent || 0}%)</p>
                </div>
                <div class="metric-card">
                    <h3>${predictionsData.low_risk || 0}</h3>
                    <p>À faible risque (${predictionsData.low_risk_percent || 0}%)</p>
                </div>
            </div>
        </div>
        
        <div class="predictions-table-section">
            <h3><i class="fas fa-table"></i> Tableau des prédictions</h3>
            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>id_commande</th>
                            <th>id_client</th>
                            <th>id_produit</th>
                            <th>catégorie</th>
                            <th>prix</th>
                            <th>poids</th>
                            <th>taille</th>
                            <th>note_client</th>
                            <th>retour</th>
                            <th>Probabilité de retour</th>
                            <th>Prédiction</th>
                            <th>Niveau de risque</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    // Afficher les 20 premières prédictions
    const predictions = predictionsData.predictions || [];
    predictions.slice(0, 20).forEach(pred => {
        const riskLevel = getRiskLevel(pred.probability);
        const riskClass = getRiskClass(pred.probability);
        
        html += `
            <tr>
                <td>${pred.id_commande || ''}</td>
                <td>${(pred.probability * 100).toFixed(1)}%</td>
                <td>${pred.prediction === 1 ? 'Oui' : 'Non'}</td>
                <td><span class="risk-badge ${riskClass}">${riskLevel}</span></td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="visualizations-section">
            <h3><i class="fas fa-chart-bar"></i> Visualisations</h3>
            <div class="visualization-grid">
    `;
    
    // Afficher les graphiques
    const visualizations = predictionsData.visualizations || [];
    visualizations.forEach(viz => {
        html += `
            <div class="visualization-container">
                <h4>${viz.title}</h4>
                <img src="data:image/png;base64,${viz.image}" alt="${viz.title}">
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
        
        <div class="download-section">
            <h3><i class="fas fa-download"></i> Téléchargement des résultats</h3>
            <button class="btn btn-success" onclick="downloadResults()">
                <i class="fas fa-file-excel"></i> Télécharger les prédictions (Excel)
            </button>
        </div>
        
        <div class="interpretation-section">
            <h3><i class="fas fa-info-circle"></i> Interprétation des résultats</h3>
            <div class="info-box">
                <h4>Comment interpréter les prédictions ?</h4>
                <ul>
                    <li><strong>Probabilité de retour</strong>: Valeur entre 0 et 1 indiquant la likelihood de retour</li>
                    <li><strong>> 70%</strong>: Risque élevé - attention particulière recommandée</li>
                    <li><strong>30% - 70%</strong>: Risque modéré - surveillance conseillée</li>
                    <li><strong>< 30%</strong>: Faible risque - probabilité minimale de retour</li>
                </ul>
            </div>
        </div>
    `;
    
    predictionsContent.innerHTML = html;
}

// Obtenir le niveau de risque
function getRiskLevel(probability) {
    if (probability > 0.7) return 'Élevé';
    if (probability > 0.3) return 'Modéré';
    return 'Faible';
}

// Obtenir la classe CSS pour le risque
function getRiskClass(probability) {
    if (probability > 0.7) return 'risk-high';
    if (probability > 0.3) return 'risk-medium';
    return 'risk-low';
}

// Télécharger les résultats
function downloadResults() {
    if (!predictionsData) {
        showMessage('error', 'Aucune donnée à télécharger');
        return;
    }
    
    // Créer un lien temporaire pour le téléchargement
    const link = document.createElement('a');
    link.href = predictionsData.download_url || '/download';
    link.download = 'predictions_retours.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showMessage('success', 'Téléchargement commencé');
}

// Configuration des modales
function setupModals() {
    const modal = document.getElementById('messageModal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.addEventListener('click', closeModal);
    
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Afficher un message dans une modal
function showMessage(type, message) {
    const modal = document.getElementById('messageModal');
    const modalMessage = document.getElementById('modalMessage');
    
    // Définir la classe selon le type
    modalMessage.className = `message-${type}`;
    
    // Créer le contenu du message
    let icon = '';
    switch(type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        default:
            icon = '<i class="fas fa-info-circle"></i>';
    }
    
    modalMessage.innerHTML = `
        <div class="message-content">
            ${icon}
            <p>${message}</p>
        </div>
    `;
    
    modal.style.display = 'block';
    
    // Fermeture automatique après 3 secondes pour les messages de succès
    if (type === 'success') {
        setTimeout(closeModal, 3000);
    }
}

// Fermer la modal
function closeModal() {
    document.getElementById('messageModal').style.display = 'none';
}

// Afficher/masquer le spinner de chargement
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    spinner.style.display = show ? 'flex' : 'none';
}

// Utilitaires
function formatNumber(num) {
    return new Intl.NumberFormat('fr-FR').format(num);
}

function formatPercent(num) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(num);
}
/*
// Gestion des erreurs globales
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showMessage('error', 'Une erreur inattendue est survenue');
});
*/
// Gestion des erreurs de promesses non gérées
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showMessage('error', 'Une erreur de connexion est survenue');
});
