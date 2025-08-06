// =======================================================================================
// SYSTÈME D'ERREURS COMPLET ET CORRIGÉ - Version finale
// À remplacer ENTIÈREMENT dans www/js/error-manager.js
// =======================================================================================

// 1. GESTIONNAIRE D'ERREURS PRINCIPAL
class ErrorManager {
    constructor() {
        this.errors = [];
        this.warningsCount = 0;
        this.errorsCount = 0;
        this.debugMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        this.setupGlobalErrorHandling();
        this.setupStyles();
    }

    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            this.logError('Erreur JavaScript non gérée', {
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                stack: event.error?.stack
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Promise rejetée', {
                reason: event.reason
            });
            event.preventDefault();
        });
    }

    setupStyles() {
        if (document.getElementById('error-manager-styles')) return;

        const style = document.createElement('style');
        style.id = 'error-manager-styles';
        style.textContent = `
            .app-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 20px;
                border-radius: 8px;
                z-index: 10000;
                max-width: 400px;
                min-width: 250px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                animation: slideInNotification 0.3s ease-out;
                cursor: pointer;
                display: flex;
                align-items: flex-start;
                gap: 10px;
            }

            .app-notification.success {
                background: #d4edda;
                color: #155724;
                border-left: 4px solid #28a745;
            }

            .app-notification.error {
                background: #f8d7da;
                color: #721c24;
                border-left: 4px solid #dc3545;
            }

            .app-notification.warning {
                background: #fff3cd;
                color: #856404;
                border-left: 4px solid #ffc107;
            }

            .app-notification.info {
                background: #d1ecf1;
                color: #0c5460;
                border-left: 4px solid #17a2b8;
            }

            .app-notification .icon {
                font-size: 18px;
                flex-shrink: 0;
            }

            .app-notification .content {
                flex: 1;
            }

            .app-notification .close-btn {
                cursor: pointer;
                font-weight: bold;
                opacity: 0.7;
                font-size: 18px;
                flex-shrink: 0;
            }

            .app-notification .close-btn:hover {
                opacity: 1;
            }

            @keyframes slideInNotification {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            @keyframes slideOutNotification {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }

            @media (max-width: 768px) {
                .app-notification {
                    left: 10px;
                    right: 10px;
                    top: 10px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    logError(message, details = {}, level = 'error') {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            level: level,
            message: message,
            details: details
        };

        this.errors.push(errorEntry);

        if (level === 'error') this.errorsCount++;
        if (level === 'warning') this.warningsCount++;

        const consoleMessage = `[${level.toUpperCase()}] ${message}`;

        if (level === 'error') {
            console.error(consoleMessage, details);
        } else if (level === 'warning') {
            console.warn(consoleMessage, details);
        } else {
            console.log(consoleMessage, details);
        }

        if (this.errors.length > 50) {
            this.errors = this.errors.slice(-25);
        }
    }

    showNotification(message, type = 'info', duration = null) {
        const existing = document.querySelector('.app-notification');
        if (existing) {
            existing.remove();
        }

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        if (duration === null) {
            duration = type === 'error' ? 5000 : 3000;
        }

        const notification = document.createElement('div');
        notification.className = `app-notification ${type}`;
        notification.innerHTML = `
            <div class="icon">${icons[type]}</div>
            <div class="content">${message}</div>
            <div class="close-btn">&times;</div>
        `;

        const closeBtn = notification.querySelector('.close-btn');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hideNotification(notification);
        });

        notification.addEventListener('click', () => {
            this.hideNotification(notification);
        });

        document.body.appendChild(notification);

        if (duration > 0) {
            setTimeout(() => {
                this.hideNotification(notification);
            }, duration);
        }

        return notification;
    }

    hideNotification(notification) {
        if (notification && notification.parentNode) {
            notification.style.animation = 'slideOutNotification 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }

    // Méthodes publiques
    error(message, details = {}) {
        this.logError(message, details, 'error');
        this.showNotification(message, 'error');
    }

    warning(message, details = {}) {
        this.logError(message, details, 'warning');
        this.showNotification(message, 'warning');
    }

    info(message, details = {}) {
        this.logError(message, details, 'info');
        this.showNotification(message, 'info');
    }

    success(message, details = {}) {
        this.logError(message, details, 'info');
        this.showNotification(message, 'success');
    }
}

// 2. GESTIONNAIRE DE NAVIGATION
class SafeNavigationManager {
    constructor() {
        // Définir les exigences pour chaque onglet
        this.tabRequirements = {
            'setup': [], // Pas de prérequis pour setup

            'prematch': [
                { path: 'team1.name', name: 'Nom équipe 1', required: true },
                { path: 'team2.name', name: 'Nom équipe 2', required: true },
                { path: 'team1.vea', name: 'VEA équipe 1', required: true, allowZero: true },
                { path: 'team2.vea', name: 'VEA équipe 2', required: true, allowZero: true }
            ],

            'match': [
                { path: 'team1.name', name: 'Nom équipe 1', required: true },
                { path: 'team2.name', name: 'Nom équipe 2', required: true },
                { path: 'team1.popularity', name: 'Popularité équipe 1', required: true, allowZero: true },
                { path: 'team2.popularity', name: 'Popularité équipe 2', required: true, allowZero: true }
            ],

            'postmatch': [
                { path: 'team1.name', name: 'Nom équipe 1', required: true },
                { path: 'team2.name', name: 'Nom équipe 2', required: true }
            ],

            'summary': [
                { path: 'team1.name', name: 'Nom équipe 1', required: true },
                { path: 'team2.name', name: 'Nom équipe 2', required: true }
            ]
        };
    }

    canNavigateTo(tabId, matchData) {
        console.log(`🔍 Validation pour navigation vers: ${tabId}`);

        // Toujours autoriser le retour à setup
        if (tabId === 'setup') {
            console.log('✅ Navigation vers setup toujours autorisée');
            return { canNavigate: true, missing: [] };
        }

        // Vérifier que matchData existe
        if (!matchData) {
            console.error('❌ matchData manquant');
            return {
                canNavigate: false,
                missing: ['Données du match non disponibles']
            };
        }

        const requirements = this.tabRequirements[tabId] || [];
        const missing = [];
        const details = [];

        for (const req of requirements) {
            const keys = req.path.split('.');
            let value = matchData;

            // Navigation sécurisée dans l'objet
            for (const key of keys) {
                if (value && typeof value === 'object') {
                    value = value[key];
                } else {
                    value = undefined;
                    break;
                }
            }

            // Validation selon le type et les règles
            let isEmpty = false;
            let detail = null;

            if (value === undefined || value === null) {
                isEmpty = true;
                detail = `${req.name}: non défini`;
            } else if (typeof value === 'string') {
                if (value.trim() === '') {
                    isEmpty = true;
                    detail = `${req.name}: vide`;
                }
            } else if (typeof value === 'number') {
                // Gérer le cas spécial où 0 est autorisé
                if (req.allowZero) {
                    // 0 est OK, mais NaN ou négatif ne l'est pas
                    if (isNaN(value) || value < 0) {
                        isEmpty = true;
                        detail = `${req.name}: valeur invalide (${value})`;
                    }
                } else {
                    // 0 n'est pas accepté
                    if (isNaN(value) || value <= 0) {
                        isEmpty = true;
                        detail = `${req.name}: doit être supérieur à 0`;
                    }
                }
            }

            if (isEmpty && req.required) {
                missing.push(req.name);
                if (detail) details.push(detail);
            }
        }

        const canNavigate = missing.length === 0;

        console.log(`Validation ${tabId}:`, {
            canNavigate,
            missing,
            details
        });

        return {
            canNavigate: canNavigate,
            missing: missing,
            details: details
        };
    }
}

// 3. GESTIONNAIRE DE SAUVEGARDE CORRIGÉ
class SafeStorageManager {
    constructor() {
        this.storageKey = 'bloodbowl_match_state';
        this.isSaving = false;
        this.lastSaveTime = 0;
        this.minSaveInterval = 500;
    }

    save(data) {
        if (this.isSaving) {
            return true;
        }

        const now = Date.now();
        if (now - this.lastSaveTime < this.minSaveInterval) {
            return true;
        }

        this.isSaving = true;
        this.lastSaveTime = now;

        try {
            if (typeof Storage === 'undefined') {
                console.error('Stockage local non supporté');
                return false;
            }

            const saveData = {
                matchData: data, // Structure corrigée
                saveDate: new Date().toISOString(),
                version: window.AppConfig?.version || '1.0'
            };

            const dataString = JSON.stringify(saveData);
            localStorage.setItem(this.storageKey, dataString);

            if (Math.random() < 0.05) { // Très rare notification
                console.log('💾 Sauvegarde automatique');
            }

            return true;

        } catch (error) {
            console.error('Erreur de sauvegarde:', error);
            return false;
        } finally {
            this.isSaving = false;
        }
    }

    load() {
        try {
            const savedData = localStorage.getItem(this.storageKey);

            if (!savedData) {
                return null;
            }

            const parsedData = JSON.parse(savedData);

            // Vérifier la structure
            if (parsedData.matchData && parsedData.matchData.team1 && parsedData.matchData.team2) {
                console.log('✅ Données restaurées');
                return parsedData.matchData; // Retourner seulement matchData
            } else if (parsedData.team1 && parsedData.team2) {
                // Format ancien - compatibilité
                console.log('✅ Données restaurées (format ancien)');
                return parsedData;
            }

            console.warn('Structure de données non reconnue');
            return null;

        } catch (error) {
            console.error('Erreur de chargement:', error);
            return null;
        }
    }
}

// 4. INITIALISATION COMPLÈTE
function initializeErrorManagement() {
    try {
        // Créer les instances
        window.errorManager = new ErrorManager();
        window.navigationManager = new SafeNavigationManager();
        window.storageManager = new SafeStorageManager();

        // Fonction de navigation sécurisée
        window.secureTabSwitch = function(app, tabId) {
            try {
                const validation = window.navigationManager.canNavigateTo(tabId, app.matchData);

                if (!validation.canNavigate) {
                    const message = `Veuillez renseigner : ${validation.missing.join(', ')}`;
                    window.errorManager.warning(message);
                    return false;
                }

                return true;

            } catch (error) {
                console.error('Erreur navigation:', error);
                return true;
            }
        };

        // Fonction de sauvegarde sécurisée
        window.secureSaveState = function(app) {
            try {
                return window.storageManager.save(app.matchData);
            } catch (error) {
                console.error('Erreur sauvegarde sécurisée:', error);
                return false;
            }
        };

        // Fonction de chargement sécurisée
        window.secureLoadState = function(app) {
            try {
                const data = window.storageManager.load();
                if (data) {
                    app.matchData = { ...app.matchData, ...data };
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Erreur chargement sécurisé:', error);
                return false;
            }
        };

        // Fonction de test
        window.testValidation = function() {
            if (!window.app) {
                console.log('❌ window.app non trouvée');
                return;
            }

            console.log('🧪 Test de validation:');

            const result = window.navigationManager.canNavigateTo('prematch', window.app.matchData);
            console.log('Navigation vers prematch:', result.canNavigate ? '✅ Autorisé' : '❌ Bloqué');

            if (!result.canNavigate) {
                console.log('Manque:', result.missing);
            }

            // Test sauvegarde
            const saveResult = window.storageManager.save(window.app.matchData);
            console.log('Test sauvegarde:', saveResult ? '✅ OK' : '❌ Échec');

            // Test chargement
            const loadResult = window.storageManager.load();
            console.log('Test chargement:', loadResult ? '✅ OK' : '❌ Aucune données');
        };

        console.log('✅ Système d\'erreurs complet initialisé');
        return true;

    } catch (error) {
        console.error('❌ Erreur initialisation système d\'erreurs:', error);
        return false;
    }
}

// Correction de la fonction de navigation
window.secureTabSwitch = function(app, tabId) {
    try {
        console.log(`🔍 Validation navigation: ${app.currentTab} → ${tabId}`);

        // Vérifications de base
        if (!window.navigationManager || !app || !app.matchData) {
            console.log('⚠️ Gestionnaire ou données manquants');
            return true; // Autoriser par défaut si le système n'est pas prêt
        }

        // Permettre toujours le retour vers setup
        if (tabId === 'setup') {
            console.log('✅ Navigation vers setup autorisée');
            return true;
        }

        // Permettre toujours de revenir en arrière
        const tabs = ['setup', 'prematch', 'match', 'postmatch', 'summary'];
        const currentIndex = tabs.indexOf(app.currentTab);
        const targetIndex = tabs.indexOf(tabId);

        if (targetIndex < currentIndex) {
            console.log('✅ Navigation arrière autorisée');
            return true;
        }

        // Validation stricte pour avancer
        const validation = window.navigationManager.canNavigateTo(tabId, app.matchData);

        if (!validation.canNavigate && validation.missing.length > 0) {
            // Construire un message clair
            let message = `Pour accéder à l'onglet "${tabId}", veuillez d'abord renseigner :`;
            validation.missing.forEach(field => {
                message += `\n• ${field}`;
            });

            console.log(`❌ Navigation bloquée: ${validation.missing.join(', ')}`);

            // Afficher le message d'erreur
            if (window.errorManager) {
                window.errorManager.warning(message.replace(/\n/g, '<br>'));
            } else {
                alert(message);
            }

            return false; // BLOQUER LA NAVIGATION
        }

        console.log('✅ Navigation autorisée');
        return true;

    } catch (error) {
        console.error('❌ Erreur dans secureTabSwitch:', error);
        // En cas d'erreur, autoriser la navigation pour ne pas bloquer l'utilisateur
        return true;
    }
};

window.testValidationSystem = function() {
    console.group('🧪 Test du système de validation');

    if (!window.app || !window.navigationManager) {
        console.error('❌ Application ou navigationManager non trouvé');
        console.groupEnd();
        return;
    }

    // Tester avec les données actuelles
    const tabs = ['setup', 'prematch', 'match', 'postmatch', 'summary'];

    console.log('État actuel des données:');
    console.log('- Team1 name:', app.matchData.team1.name || 'VIDE');
    console.log('- Team2 name:', app.matchData.team2.name || 'VIDE');
    console.log('- Team1 VEA:', app.matchData.team1.vea);
    console.log('- Team2 VEA:', app.matchData.team2.vea);
    console.log('- Team1 popularity:', app.matchData.team1.popularity);
    console.log('- Team2 popularity:', app.matchData.team2.popularity);

    console.log('\nTest de navigation vers chaque onglet:');
    tabs.forEach(tab => {
        const result = window.navigationManager.canNavigateTo(tab, app.matchData);
        console.log(`- ${tab}:`, result.canNavigate ? '✅ OK' : `❌ Bloqué (${result.missing.join(', ')})`);
    });

    console.groupEnd();
};


// 4. AMÉLIORER updateTeamData dans app.js pour valider correctement
// (À ajouter/modifier dans app.js)
window.validateAndUpdateTeamData = function(app, teamNumber, field, value) {
    try {
        // S'assurer que l'équipe existe
        if (!app.matchData[`team${teamNumber}`]) {
            console.error(`Équipe ${teamNumber} n'existe pas!`);
            app.matchData[`team${teamNumber}`] = app.createTeamObject();
        }

        let validatedValue = value;
        let isValid = true;
        let errorMessage = null;

        switch(field) {
            case 'name':
                validatedValue = String(value || '').trim();
                // Le nom doit avoir au moins 2 caractères
                if (validatedValue.length > 0 && validatedValue.length < 2) {
                    errorMessage = 'Le nom doit faire au moins 2 caractères';
                    isValid = false;
                }
                break;

            case 'coach':
            case 'roster':
                validatedValue = String(value || '').trim();
                break;

            case 'vea':
                validatedValue = parseInt(value);
                if (isNaN(validatedValue)) {
                    validatedValue = 0;
                }
                // VEA peut être 0 mais pas négatif
                if (validatedValue < 0) {
                    validatedValue = 0;
                    errorMessage = 'La VEA ne peut pas être négative';
                }
                if (validatedValue > 10000000) {
                    validatedValue = 10000000;
                    errorMessage = 'VEA maximum : 10 000 000 PO';
                }
                break;

            case 'fans':
                validatedValue = parseInt(value);
                if (isNaN(validatedValue) || validatedValue < 1) {
                    validatedValue = 1;
                    errorMessage = 'Minimum 1 fan dévoué';
                }
                if (validatedValue > 6) {
                    validatedValue = 6;
                    errorMessage = 'Maximum 6 fans dévoués';
                }
                break;

            case 'popularity':
                validatedValue = parseInt(value) || 0;
                if (validatedValue < 0) {
                    validatedValue = 0;
                }
                break;

            case 'treasury':
                validatedValue = parseInt(value) || 0;
                if (validatedValue < 0) {
                    validatedValue = 0;
                    errorMessage = 'La trésorerie ne peut pas être négative';
                }
                break;

            default:
                validatedValue = value;
        }

        // Appliquer la valeur même si pas complètement valide (pour permettre la saisie)
        app.matchData[`team${teamNumber}`][field] = validatedValue;

        // Afficher un message d'erreur si nécessaire
        if (errorMessage && window.errorManager) {
            window.errorManager.info(errorMessage);
        }

        // Mettre à jour les affichages
        if (field === 'name') {
            app.updateTeamNamesDisplay();
        }

        if (field === 'vea' || field === 'fans') {
            app.updateVEAComparison();
        }

        // Sauvegarde différée
        app.scheduleSave();

        return isValid;

    } catch (error) {
        console.error('Erreur validateAndUpdateTeamData:', error);
        return false;
    }
};



// FONCTION POUR VÉRIFIER L'ÉTAT DE VALIDATION EN TEMPS RÉEL
window.checkCurrentValidation = function() {
    if (!window.app || !window.navigationManager) {
        console.error('Application non trouvée');
        return;
    }

    const currentTab = app.currentTab;
    const tabs = ['setup', 'prematch', 'match', 'postmatch', 'summary'];
    const currentIndex = tabs.indexOf(currentTab);

    if (currentIndex < tabs.length - 1) {
        const nextTab = tabs[currentIndex + 1];
        const validation = window.navigationManager.canNavigateTo(nextTab, app.matchData);

        if (validation.canNavigate) {
            console.log(`✅ Prêt pour ${nextTab}`);
        } else {
            console.log(`⚠️ Manque pour ${nextTab}:`, validation.missing.join(', '));
        }

        return validation;
    }

    return { canNavigate: true, missing: [] };
};

// INITIALISATION AMÉLIORÉE
window.initializeValidationSystem = function() {
    console.log('🚀 Initialisation du système de validation...');

    // Créer le gestionnaire de navigation s'il n'existe pas
    if (!window.navigationManager) {
        window.navigationManager = new SafeNavigationManager();
    }

    // S'assurer que secureTabSwitch est bien défini
    if (!window.secureTabSwitch) {
        console.error('❌ secureTabSwitch non défini!');
    }

    console.log('✅ Système de validation prêt');

    // Test immédiat
    window.testValidationSystem();
};

// Auto-initialisation
setTimeout(() => {
    if (!window.navigationManager) {
        window.initializeValidationSystem();
    }
}, 500);

// Pour tester le blocage
window.testNavigation = function() {
    console.group('🧪 Test de navigation');

    if (!window.app) {
        console.log('❌ window.app non trouvé');
        console.groupEnd();
        return;
    }

    // Sauvegarder l'état actuel
    const originalData = {
        team1Name: app.matchData.team1.name,
        team2Name: app.matchData.team2.name,
        team1VEA: app.matchData.team1.vea,
        team2VEA: app.matchData.team2.vea
    };

    console.log('État initial:', originalData);

    // Test 1 : Vider les données
    app.matchData.team1.name = '';
    app.matchData.team2.name = '';
    app.matchData.team1.vea = 0;
    app.matchData.team2.vea = 0;

    console.log('Test avec données vides...');
    const result1 = window.secureTabSwitch(app, 'prematch');
    console.log('Navigation vers prematch avec données vides:', result1 ? '✅ Autorisée' : '❌ Bloquée');

    // Test 2 : Remplir partiellement
    app.matchData.team1.name = 'Test Team';
    app.matchData.team2.name = '';

    console.log('Test avec données partielles...');
    const result2 = window.secureTabSwitch(app, 'prematch');
    console.log('Navigation vers prematch avec données partielles:', result2 ? '✅ Autorisée' : '❌ Bloquée');

    // Restaurer l'état original
    app.matchData.team1.name = originalData.team1Name;
    app.matchData.team2.name = originalData.team2Name;
    app.matchData.team1.vea = originalData.team1VEA;
    app.matchData.team2.vea = originalData.team2VEA;

    console.log('État restauré');
    console.groupEnd();
};

// Fonction de debug
window.debugApp = function() {
    console.group('🔍 Debug Application');

    if (window.app) {
        console.log('✅ window.app existe');
        console.log('Données équipe 1:', {
            name: window.app.matchData?.team1?.name || 'vide',
            vea: window.app.matchData?.team1?.vea || 'vide'
        });
        console.log('Données équipe 2:', {
            name: window.app.matchData?.team2?.name || 'vide',
            vea: window.app.matchData?.team2?.vea || 'vide'
        });
    } else {
        console.log('❌ window.app manquant');
    }

    console.log('ErrorManager:', window.errorManager ? '✅' : '❌');
    console.log('NavigationManager:', window.navigationManager ? '✅' : '❌');
    console.log('StorageManager:', window.storageManager ? '✅' : '❌');

    if (window.app && window.navigationManager) {
        const testResult = window.navigationManager.canNavigateTo('prematch', window.app.matchData);
        console.log('Test navigation vers prematch:', testResult);
    }

    console.groupEnd();
};

// FONCTION DE TEST pour vérifier l'état de l'application
window.debugAppState = function() {
    console.group('🔍 État complet de l\'application');

    if (!window.app) {
        console.error('❌ window.app n\'existe pas!');
        console.groupEnd();
        return;
    }

    console.log('Onglet actuel:', app.currentTab);
    console.log('Données équipe 1:', {
        name: app.matchData.team1.name || 'VIDE',
        vea: app.matchData.team1.vea,
        fans: app.matchData.team1.fans,
        players: app.matchData.team1.players.length
    });
    console.log('Données équipe 2:', {
        name: app.matchData.team2.name || 'VIDE',
        vea: app.matchData.team2.vea,
        fans: app.matchData.team2.fans,
        players: app.matchData.team2.players.length
    });
    console.log('Météo:', app.matchData.weather);
    console.log('Chronomètre:', {
        running: app.matchData.timerRunning,
        pausedDuration: app.matchData.pausedDuration
    });
    console.log('LocalStorage keys:', Object.keys(localStorage).filter(k => k.startsWith('bloodbowl_')));

    console.groupEnd();
};

// FONCTION pour forcer un nettoyage complet
window.forceCleanReset = function() {
    if (!window.app) {
        console.error('Application non trouvée');
        return;
    }

    console.log('🧹 Nettoyage forcé en cours...');

    // Arrêter tous les intervalles
    if (app.timerInterval) clearInterval(app.timerInterval);
    if (app.autoSaveInterval) clearInterval(app.autoSaveInterval);

    // Nettoyer TOUT le localStorage de l'app
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('bloodbowl')) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Réinitialiser l'app
    app.matchData = {
        team1: app.createTeamObject(),
        team2: app.createTeamObject(),
        weather: { type: 'classique', total: 0, effect: '', rolled: false, dice1: null, dice2: null },
        kickoffEvents: [],
        matchStart: null,
        matchEnd: null,
        coinFlip: '',
        prayer: { effect: '', rolled: false, dice: null },
        inducements: {
            team1Items: {},
            team2Items: {},
            team1PetiteMonnaie: 0,
            team2PetiteMonnaie: 0,
            team1Treasury: 0,
            team2Treasury: 0
        },
        timerRunning: false,
        pausedDuration: 0,
        lastStartTime: null,
        mvp: null
    };

    // Réinitialiser les inducements
    app.initializeInducementsData();

    // Forcer le retour à setup
    app.currentTab = 'setup';
    app.loadTab('setup');

    console.log('✅ Nettoyage forcé terminé');
    alert('Application réinitialisée complètement !');
};

window.testNavigationDetailed = function() {
    console.group('🧪 Test détaillé de navigation');

    if (!window.app) {
        console.log('❌ window.app non trouvé');
        console.groupEnd();
        return;
    }

    console.log('Onglet actuel:', app.currentTab);
    console.log('Données actuelles:', {
        team1: { name: app.matchData.team1.name, vea: app.matchData.team1.vea },
        team2: { name: app.matchData.team2.name, vea: app.matchData.team2.vea }
    });

    // Test 1 : Vider complètement
    console.log('\n--- Test 1: Données vides ---');
    const backup = {
        team1Name: app.matchData.team1.name,
        team2Name: app.matchData.team2.name,
        team1VEA: app.matchData.team1.vea,
        team2VEA: app.matchData.team2.vea
    };

    app.matchData.team1.name = '';
    app.matchData.team2.name = '';
    app.matchData.team1.vea = 0;
    app.matchData.team2.vea = 0;

    console.log('Tentative de navigation vers prematch...');
    const result = app.switchTab('prematch');
    console.log('Résultat:', result ? 'AUTORISÉ ❌' : 'BLOQUÉ ✅');
    console.log('Onglet actuel après tentative:', app.currentTab);

    // Restaurer
    app.matchData.team1.name = backup.team1Name;
    app.matchData.team2.name = backup.team2Name;
    app.matchData.team1.vea = backup.team1VEA;
    app.matchData.team2.vea = backup.team2VEA;

    console.log('Données restaurées');
    console.groupEnd();
};

// Export des classes
window.ErrorManager = ErrorManager;
window.SafeNavigationManager = SafeNavigationManager;
window.SafeStorageManager = SafeStorageManager;
window.initializeErrorManagement = initializeErrorManagement;

// Auto-initialisation après un délai
setTimeout(() => {
    if (window.initializeErrorManagement) {
        window.initializeErrorManagement();
    }
}, 100);
