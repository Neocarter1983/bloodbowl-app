// js/utils.js
const Utils = {
    // Générateur d'ID unique
    generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    // Random avec min/max
    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Debounce pour performances
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle pour les événements fréquents
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Stockage local avec prefix
    storage: {
        set(key, value) {
            try {
                const prefixedKey = AppConfig.storage.prefix + key;
                localStorage.setItem(prefixedKey, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Storage error:', e);
                return false;
            }
        },

        get(key) {
            try {
                const prefixedKey = AppConfig.storage.prefix + key;
                const item = localStorage.getItem(prefixedKey);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                console.error('Storage error:', e);
                return null;
            }
        },

        remove(key) {
            const prefixedKey = AppConfig.storage.prefix + key;
            localStorage.removeItem(prefixedKey);
        },

        clear() {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(AppConfig.storage.prefix)) {
                    localStorage.removeItem(key);
                }
            });
        }
    },

    // Formatage des nombres
    formatNumber(num) {
        return num.toLocaleString('fr-FR');
    },

    // Vibration (pour feedback tactile)
    vibrate(duration = 50) {
        if (window.navigator && window.navigator.vibrate && AppConfig.mobile.enableHapticFeedback) {
            window.navigator.vibrate(duration);
        }
    },

    // Détection de la plateforme
    getPlatform() {
        if (window.cordova) {
            return window.device ? window.device.platform : 'cordova';
        }

        const userAgent = navigator.userAgent || navigator.vendor || window.opera;

        if (/android/i.test(userAgent)) {
            return 'android';
        }

        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            return 'ios';
        }

        return 'web';
    },

    // Clone profond
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    // Validation
    validate: {
        teamName(name) {
            return name && name.trim().length >= 2 && name.trim().length <= 50;
        },

        vea(value) {
            const num = parseInt(value);
            return !isNaN(num) && num >= 0 && num <= 10000000;
        },

        fans(value) {
            const num = parseInt(value);
            return !isNaN(num) && num >= AppConfig.limits.minFans && num <= AppConfig.limits.maxFans;
        }
    }
};

// Rendre les utils globaux
window.Utils = Utils;