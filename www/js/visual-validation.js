// =======================================================================================
// SYSTÈME DE VALIDATION VISUELLE DES CHAMPS
// À ajouter dans www/js/visual-validation.js
// =======================================================================================

class VisualValidationSystem {
    constructor() {
        this.validators = {
            // Validateurs pour chaque type de champ
            teamName: (value) => {
                if (!value || value.trim() === '') {
                    return { valid: false, message: 'Nom d\'équipe requis' };
                }
                if (value.trim().length < 2) {
                    return { valid: false, message: 'Minimum 2 caractères' };
                }
                if (value.trim().length > 50) {
                    return { valid: false, message: 'Maximum 50 caractères' };
                }
                return { valid: true, message: 'Nom valide ✓' };
            },

            coach: (value) => {
                if (!value || value.trim() === '') {
                    return { valid: true, message: 'Optionnel' }; // Coach est optionnel
                }
                if (value.trim().length < 2) {
                    return { valid: false, message: 'Minimum 2 caractères' };
                }
                return { valid: true, message: 'Coach valide ✓' };
            },

            vea: (value) => {
                const num = parseInt(value);
                if (isNaN(num)) {
                    return { valid: false, message: 'Nombre requis' };
                }
                if (num < 0) {
                    return { valid: false, message: 'Ne peut pas être négatif' };
                }
                if (num > 10000000) {
                    return { valid: false, message: 'Maximum 10 000 000 PO' };
                }
                if (num === 0) {
                    return { valid: true, message: 'Équipe sans budget ⚠️' };
                }
                return { valid: true, message: `${num.toLocaleString('fr-FR')} PO ✓` };
            },

            fans: (value) => {
                const num = parseInt(value);
                if (isNaN(num)) {
                    return { valid: false, message: 'Nombre requis' };
                }
                if (num < 1) {
                    return { valid: false, message: 'Minimum 1 fan' };
                }
                if (num > 6) {
                    return { valid: false, message: 'Maximum 6 fans' };
                }
                return { valid: true, message: `${num} fan${num > 1 ? 's' : ''} ✓` };
            },

            treasury: (value) => {
                const num = parseInt(value);
                if (isNaN(num)) {
                    return { valid: false, message: 'Nombre requis' };
                }
                if (num < 0) {
                    return { valid: false, message: 'Ne peut pas être négatif' };
                }
                return { valid: true, message: `${num.toLocaleString('fr-FR')} PO ✓` };
            },

            popularity: (value) => {
                const num = parseInt(value);
                if (isNaN(num)) {
                    return { valid: false, message: 'Nombre requis' };
                }
                if (num < 0) {
                    return { valid: false, message: 'Ne peut pas être négatif' };
                }
                return { valid: true, message: `Popularité ${num} ✓` };
            }
        };

        // État de validation global
        this.fieldStates = {};

        // Délai pour la validation (éviter trop de validations pendant la saisie)
        this.validationTimers = {};
    }

    // Initialiser le système sur tous les champs
    initialize() {
        console.log('🎨 Initialisation du système de validation visuelle...');

        // Configuration des champs à valider
        const fieldsConfig = [
            { id: 'team1-name', type: 'teamName', required: true },
            { id: 'team2-name', type: 'teamName', required: true },
            { id: 'team1-coach', type: 'coach', required: false },
            { id: 'team2-coach', type: 'coach', required: false },
            { id: 'team1-vea', type: 'vea', required: true },
            { id: 'team2-vea', type: 'vea', required: true },
            { id: 'team1-fans', type: 'fans', required: true },
            { id: 'team2-fans', type: 'fans', required: true },
            { id: 'team1-treasury', type: 'treasury', required: false },
            { id: 'team2-treasury', type: 'treasury', required: false },
            { id: 'team1-popularity', type: 'popularity', required: false },
            { id: 'team2-popularity', type: 'popularity', required: false }
        ];

        // Attacher les écouteurs
        fieldsConfig.forEach(config => {
            const element = document.getElementById(config.id);
            if (element) {
                this.attachValidation(element, config);
            }
        });

        // Valider immédiatement les champs avec des valeurs
        this.validateAllFields();

        console.log('✅ Système de validation visuelle prêt');
    }

    // Attacher la validation à un champ
    attachValidation(element, config) {
        // Créer le conteneur de feedback s'il n'existe pas
        this.createFeedbackContainer(element, config);

        // Validation pendant la saisie (avec délai)
        element.addEventListener('input', (e) => {
            // Annuler le timer précédent
            if (this.validationTimers[element.id]) {
                clearTimeout(this.validationTimers[element.id]);
            }

            // Validation immédiate pour feedback rapide
            this.updateFieldAppearance(element, 'typing');

            // Validation complète après un délai
            this.validationTimers[element.id] = setTimeout(() => {
                this.validateField(element, config);
            }, 500); // Délai de 500ms après la fin de la saisie
        });

        // Validation à la perte de focus
        element.addEventListener('blur', () => {
            // Annuler le timer si actif
            if (this.validationTimers[element.id]) {
                clearTimeout(this.validationTimers[element.id]);
            }
            this.validateField(element, config);
        });

        // Validation au focus (pour montrer l'aide)
        element.addEventListener('focus', () => {
            this.showFieldHelp(element, config);
        });
    }

    // Créer le conteneur de feedback pour un champ
    createFeedbackContainer(element, config) {
        // Vérifier si le conteneur existe déjà
        let container = element.parentElement.querySelector('.field-feedback');
        if (!container) {
            container = document.createElement('div');
            container.className = 'field-feedback';
            element.parentElement.appendChild(container);
        }

        // Ajouter l'icône de validation
        let icon = element.parentElement.querySelector('.field-validation-icon');
        if (!icon) {
            icon = document.createElement('span');
            icon.className = 'field-validation-icon';
            element.parentElement.style.position = 'relative';
            element.parentElement.appendChild(icon);
        }

        // Marquer les champs requis
        if (config.required) {
            const label = element.parentElement.parentElement.querySelector('label');
            if (label && !label.classList.contains('required')) {
                label.classList.add('required');
            }
        }
    }

    // Valider un champ
    validateField(element, config) {
        const value = element.value;
        const validator = this.validators[config.type];

        if (!validator) {
            console.warn(`Pas de validateur pour le type: ${config.type}`);
            return;
        }

        const result = validator(value);

        // Stocker l'état
        this.fieldStates[element.id] = result;

        // Mettre à jour l'apparence
        this.updateFieldAppearance(element, result.valid ? 'valid' : 'invalid');

        // Mettre à jour le message de feedback
        this.updateFeedbackMessage(element, result.message, result.valid);

        // Mettre à jour l'icône
        this.updateValidationIcon(element, result.valid);

        // Déclencher une mise à jour globale
        this.updateGlobalValidation();

        return result.valid;
    }

    // Mettre à jour l'apparence d'un champ
    updateFieldAppearance(element, state) {
        // Retirer toutes les classes d'état
        element.classList.remove('field-valid', 'field-invalid', 'field-typing', 'field-warning');

        // Ajouter la classe appropriée
        switch(state) {
            case 'valid':
                element.classList.add('field-valid');
                break;
            case 'invalid':
                element.classList.add('field-invalid');
                break;
            case 'typing':
                element.classList.add('field-typing');
                break;
            case 'warning':
                element.classList.add('field-warning');
                break;
        }
    }

    // Mettre à jour le message de feedback
    updateFeedbackMessage(element, message, isValid) {
        const container = element.parentElement.querySelector('.field-feedback');
        if (container) {
            container.textContent = message;
            container.className = `field-feedback ${isValid ? 'feedback-valid' : 'feedback-invalid'}`;
            container.style.display = message ? 'block' : 'none';
        }
    }

    // Mettre à jour l'icône de validation
    updateValidationIcon(element, isValid) {
        const icon = element.parentElement.querySelector('.field-validation-icon');
        if (icon) {
            if (element.value.trim() === '') {
                icon.innerHTML = '';
                icon.className = 'field-validation-icon';
            } else if (isValid) {
                icon.innerHTML = '✓';
                icon.className = 'field-validation-icon icon-valid';
            } else {
                icon.innerHTML = '✗';
                icon.className = 'field-validation-icon icon-invalid';
            }
        }
    }

    // Afficher l'aide contextuelle
    showFieldHelp(element, config) {
        const container = element.parentElement.querySelector('.field-feedback');
        if (container && (!element.value || element.value.trim() === '')) {
            let helpMessage = '';

            switch(config.type) {
                case 'teamName':
                    helpMessage = 'Entrez le nom de l\'équipe (2-50 caractères)';
                    break;
                case 'coach':
                    helpMessage = 'Nom du coach (optionnel)';
                    break;
                case 'vea':
                    helpMessage = 'Valeur d\'Équipe Actuelle en PO';
                    break;
                case 'fans':
                    helpMessage = 'Nombre de fans dévoués (1-6)';
                    break;
                case 'treasury':
                    helpMessage = 'Trésorerie de l\'équipe en PO';
                    break;
                case 'popularity':
                    helpMessage = 'Niveau de popularité';
                    break;
            }

            if (helpMessage) {
                container.textContent = helpMessage;
                container.className = 'field-feedback feedback-help';
                container.style.display = 'block';
            }
        }
    }

    // Valider tous les champs
    validateAllFields() {
        const fieldsConfig = [
            { id: 'team1-name', type: 'teamName', required: true },
            { id: 'team2-name', type: 'teamName', required: true },
            { id: 'team1-vea', type: 'vea', required: true },
            { id: 'team2-vea', type: 'vea', required: true },
            { id: 'team1-fans', type: 'fans', required: true },
            { id: 'team2-fans', type: 'fans', required: true }
        ];

        let allValid = true;

        fieldsConfig.forEach(config => {
            const element = document.getElementById(config.id);
            if (element) {
                const isValid = this.validateField(element, config);
                if (config.required && !isValid) {
                    allValid = false;
                }
            }
        });

        return allValid;
    }

    // Mise à jour de la validation globale
    updateGlobalValidation() {
        // Vérifier si tous les champs requis sont valides
        const requiredFields = ['team1-name', 'team2-name', 'team1-vea', 'team2-vea'];
        let allValid = true;
        let missingFields = [];

        requiredFields.forEach(fieldId => {
            const state = this.fieldStates[fieldId];
            if (!state || !state.valid) {
                allValid = false;
                const element = document.getElementById(fieldId);
                if (element && (!element.value || element.value.trim() === '')) {
                    missingFields.push(fieldId);
                }
            }
        });

        // Mettre à jour les boutons de navigation
        this.updateNavigationButtons(allValid);

        // Déclencher un événement personnalisé
        window.dispatchEvent(new CustomEvent('validationUpdate', {
            detail: { valid: allValid, missing: missingFields }
        }));
    }

    // Mettre à jour les boutons de navigation
    updateNavigationButtons(isValid) {
        const nextButtons = document.querySelectorAll('.btn-next-tab');

        nextButtons.forEach(button => {
            if (isValid) {
                button.classList.remove('disabled');
                button.removeAttribute('disabled');
                button.classList.add('btn-validated');
            } else {
                button.classList.add('disabled');
                button.setAttribute('disabled', 'disabled');
                button.classList.remove('btn-validated');
            }
        });
    }

    // Obtenir un résumé de la validation
    getValidationSummary() {
        const summary = {
            valid: true,
            fields: {},
            missing: []
        };

        for (const [fieldId, state] of Object.entries(this.fieldStates)) {
            summary.fields[fieldId] = state;
            if (!state.valid) {
                summary.valid = false;
                summary.missing.push(fieldId);
            }
        }

        return summary;
    }

    // Réinitialiser la validation
    reset() {
        this.fieldStates = {};

        // Nettoyer tous les champs
        document.querySelectorAll('.field-valid, .field-invalid').forEach(el => {
            el.classList.remove('field-valid', 'field-invalid');
        });

        document.querySelectorAll('.field-feedback').forEach(el => {
            el.style.display = 'none';
        });

        document.querySelectorAll('.field-validation-icon').forEach(el => {
            el.innerHTML = '';
        });

        const statusElement = document.querySelector('.global-validation-status');
        if (statusElement) {
            statusElement.remove();
        }
    }
}

// Créer l'instance globale
window.visualValidation = new VisualValidationSystem();

// Auto-initialisation après le chargement du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => window.visualValidation.initialize(), 100);
    });
} else {
    setTimeout(() => window.visualValidation.initialize(), 100);
}

// Fonction utilitaire pour réinitialiser la validation visuelle
window.resetVisualValidation = function() {
    if (window.visualValidation) {
        window.visualValidation.reset();
        setTimeout(() => window.visualValidation.initialize(), 100);
    }
};

console.log('🎨 Système de validation visuelle chargé');
