// js/cordova-init.js
const CordovaApp = {
    // Initialisation
    initialize() {
        this.bindEvents();
    },

    // Bind des événements Cordova
    bindEvents() {
        if (window.cordova) {
            document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
            document.addEventListener('pause', this.onPause.bind(this), false);
            document.addEventListener('resume', this.onResume.bind(this), false);
            document.addEventListener('backbutton', this.onBackButton.bind(this), false);
        } else {
            // Mode navigateur
            document.addEventListener('DOMContentLoaded', this.onDeviceReady.bind(this), false);
        }
    },

    // Appareil prêt
    onDeviceReady() {
        console.log('Device ready');

        // Configuration de la StatusBar (si plugin installé)
        if (window.StatusBar) {
            StatusBar.styleDefault();
            StatusBar.backgroundColorByHexString('#1a5f3f');
        }

        // Désactiver le bounce sur iOS
        if (window.device && window.device.platform === 'iOS') {
            document.body.addEventListener('touchmove', function(e) {
                if (!e.target.closest('.scrollable')) {
                    e.preventDefault();
                }
            }, { passive: false });
        }

        // Initialiser l'app principale
        this.initializeApp();
    },

    // Pause de l'app
    onPause() {
        // Sauvegarder l'état
        if (window.app && window.app.saveState) {
            window.app.saveState();
        }
    },

    // Reprise de l'app
    onResume() {
        // Recharger si nécessaire
        if (window.app && window.app.refresh) {
            window.app.refresh();
        }
    },

    // Bouton retour Android
    onBackButton(e) {
        e.preventDefault();

        // Logique de navigation
        if (window.app && window.app.canGoBack && window.app.canGoBack()) {
            window.app.goBack();
        } else {
            // Confirmation de sortie
            if (navigator.notification) {
                navigator.notification.confirm(
                    'Voulez-vous quitter l\'application ?',
                    function(buttonIndex) {
                        if (buttonIndex === 1) {
                            navigator.app.exitApp();
                        }
                    },
                    'Quitter',
                    ['Oui', 'Non']
                );
            } else {
                if (confirm('Voulez-vous quitter l\'application ?')) {
                    navigator.app.exitApp();
                }
            }
        }
    },

    // Initialiser l'app principale
    initializeApp() {
        // Votre logique d'initialisation
        console.log('Initializing Blood Bowl App');

        // Détecter les capacités
        this.detectCapabilities();

        // Lancer l'app
        if (window.BloodBowlApp) {
            window.app = new BloodBowlApp();
        }
    },

    // Détecter les capacités de l'appareil
    detectCapabilities() {
        const capabilities = {
            touch: 'ontouchstart' in window,
            offline: 'onLine' in navigator,
            storage: 'localStorage' in window,
            cordova: !!window.cordova,
            platform: window.device ? window.device.platform : 'browser'
        };

        // Ajouter des classes au body
        document.body.classList.add(capabilities.touch ? 'touch' : 'no-touch');
        document.body.classList.add(capabilities.cordova ? 'cordova' : 'browser');

        window.appCapabilities = capabilities;
    }
};

// Initialiser
CordovaApp.initialize();