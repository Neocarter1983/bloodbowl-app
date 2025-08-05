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
        this.tabRequirements = {
            'setup': [],
            'prematch': [
                { path: 'team1.name', name: 'Nom équipe 1', required: true },
                { path: 'team2.name', name: 'Nom équipe 2', required: true },
                { path: 'team1.vea', name: 'VEA équipe 1', required: true, min: 0 },
                { path: 'team2.vea', name: 'VEA équipe 2', required: true, min: 0 }
            ],
            'match': [
                { path: 'team1.name', name: 'Nom équipe 1', required: true },
                { path: 'team2.name', name: 'Nom équipe 2', required: true }
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
        const requirements = this.tabRequirements[tabId] || [];
        const missing = [];

        for (const req of requirements) {
            const keys = req.path.split('.');
            let value = matchData;

            for (const key of keys) {
                value = value?.[key];
            }

            const isEmpty = value === undefined ||
                           value === null ||
                           (typeof value === 'string' && value.trim() === '') ||
                           (typeof value === 'number' && (isNaN(value) || value < 0));

            if (isEmpty && req.required) {
                missing.push(req.name);
            }
        }

        return {
            canNavigate: missing.length === 0,
            missing: missing
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
        if (!window.navigationManager || !app || !app.matchData) {
            console.log('Gestionnaire ou données manquants, navigation autorisée');
            return true;
        }

        const validation = window.navigationManager.canNavigateTo(tabId, app.matchData);

        if (!validation.canNavigate && validation.missing.length > 0) {
            const message = `Pour accéder à cet onglet, veuillez renseigner : ${validation.missing.join(', ')}`;

            if (window.errorManager) {
                window.errorManager.warning(message);
            } else {
                console.warn(message);
                alert(message);
            }

            return false;
        }

        return true;

    } catch (error) {
        console.error('Erreur secureTabSwitch:', error);
        return true;
    }
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