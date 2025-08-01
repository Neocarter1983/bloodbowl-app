// js/app.js
class BloodBowlApp {
    constructor() {
        this.currentTab = 'setup';
        this.matchData = {
            team1: this.createTeamObject(),
            team2: this.createTeamObject(),
            weather: { total: 0, effect: '', rolled: false },
            kickoffEvents: [],
            matchStart: null,
            matchEnd: null
        };

        this.init();
    }

    createTeamObject() {
        return {
            name: '',
            coach: '',
            roster: '',
            vea: 0,
            fans: 1,
            score: 0,
            popularity: 0,
            players: [],
            treasury: 0
        };
    }

    init() {
        console.log('Initializing BloodBowl App...');

        // Charger les données sauvegardées
        this.loadState();

        // Initialiser les événements
        this.setupEventListeners();

        // Charger le premier onglet
        this.loadTab('setup');

        // Démarrer l'auto-save
        this.startAutoSave();
    }

    setupEventListeners() {
        // Gestion des onglets
        document.getElementById('main-tabs').addEventListener('click', (e) => {
            if (e.target.classList.contains('tab')) {
                const tabId = e.target.dataset.tab;
                this.switchTab(tabId);
            }
        });

        // Délégation d'événements pour les inputs
        document.addEventListener('input', Utils.debounce((e) => {
            this.handleInput(e);
        }, 300));

        // Délégation pour les clics
        document.addEventListener('click', (e) => {
            this.handleClick(e);
        });
    }

    switchTab(tabId) {
        // Retirer la classe active de tous les onglets
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Ajouter la classe active au bon onglet
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        // Charger le contenu
        this.loadTab(tabId);

        // Vibration tactile
        Utils.vibrate(10);
    }

    async loadTab(tabId) {
        const content = document.getElementById('main-content');

        // Afficher le loading
        this.showLoading();

        try {
            // Charger le contenu de l'onglet
            const tabContent = await this.getTabContent(tabId);
            content.innerHTML = tabContent;

            // Initialiser les éléments spécifiques à l'onglet
            this.initializeTab(tabId);

            this.currentTab = tabId;

            // Mettre à jour la progression
            this.updateProgress(tabId);

        } catch (error) {
            console.error('Erreur chargement onglet:', error);
            content.innerHTML = '<p class="error">Erreur de chargement</p>';
        } finally {
            this.hideLoading();
        }
    }

    getTabContent(tabId) {
        // Pour l'instant, retourner le HTML directement
        // Plus tard, on pourra charger depuis des fichiers séparés

        switch(tabId) {
            case 'setup':
                return this.getSetupTabHTML();
            case 'prematch':
                return this.getPrematchTabHTML();
            case 'match':
                return this.getMatchTabHTML();
            case 'postmatch':
                return this.getPostmatchTabHTML();
            case 'summary':
                return this.getSummaryTabHTML();
            default:
                return '<p>Onglet non trouvé</p>';
        }
    }

    // === MÉTHODES DE SAUVEGARDE ===

    saveState() {
        const stateToSave = {
            matchData: this.matchData,
            currentTab: this.currentTab,
            saveDate: new Date().toISOString(),
            version: AppConfig.version
        };

        return Utils.storage.set('match_state', stateToSave);
    }

    loadState() {
        const savedState = Utils.storage.get('match_state');

        if (savedState && savedState.matchData) {
            this.matchData = savedState.matchData;
            console.log('État restauré:', savedState.saveDate);
            return true;
        }

        return false;
    }

    startAutoSave() {
        setInterval(() => {
            if (this.hasUnsavedChanges) {
                this.saveState();
                this.hasUnsavedChanges = false;
            }
        }, AppConfig.mobile.autoSaveInterval);
    }

    // === GESTION DES ÉVÉNEMENTS ===

    handleInput(e) {
        const target = e.target;

        // Inputs d'équipe
        if (target.matches('[data-team-field]')) {
            const team = target.dataset.team;
            const field = target.dataset.teamField;
            const value = target.type === 'number' ? parseInt(target.value) || 0 : target.value;

            this.updateTeamData(team, field, value);
        }

        // Inputs de joueur
        if (target.matches('.player-name-input')) {
            const team = target.dataset.team;
            const playerId = target.dataset.player;
            this.updatePlayerName(team, playerId, target.value);
        }

        this.hasUnsavedChanges = true;
    }

    handleClick(e) {
        const target = e.target;

        // Checkboxes d'actions
        if (target.matches('.action-checkbox')) {
            const team = target.dataset.team;
            const playerId = target.dataset.player;
            const action = target.dataset.action;

            this.updatePlayerAction(team, playerId, action, target.checked);
            Utils.vibrate(10);
        }

        // Boutons d'ajout de joueur
        if (target.matches('.add-player-btn')) {
            const team = target.dataset.team;
            this.addPlayer(team);
            Utils.vibrate(20);
        }

        // Boutons de dés
        if (target.matches('.dice-btn')) {
            this.handleDiceRoll(target);
            Utils.vibrate(30);
        }
    }

    // === MÉTHODES UTILITAIRES ===

    showLoading() {
        document.getElementById('loading').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    updateProgress(tabId) {
        const tabs = ['setup', 'prematch', 'match', 'postmatch', 'summary'];
        const currentIndex = tabs.indexOf(tabId);

        const progressHTML = tabs.map((tab, index) => {
            let className = 'progress-step';
            if (index < currentIndex) className += ' completed';
            if (index === currentIndex) className += ' current';

            return `<div class="${className}">${index + 1}</div>`;
        }).join('');

        document.getElementById('progress-indicator').innerHTML = progressHTML;
    }

    // === MÉTHODES POUR L'APPLICATION CORDOVA ===

    canGoBack() {
        const tabs = ['setup', 'prematch', 'match', 'postmatch', 'summary'];
        const currentIndex = tabs.indexOf(this.currentTab);
        return currentIndex > 0;
    }

    goBack() {
        const tabs = ['setup', 'prematch', 'match', 'postmatch', 'summary'];
        const currentIndex = tabs.indexOf(this.currentTab);

        if (currentIndex > 0) {
            this.switchTab(tabs[currentIndex - 1]);
        }
    }

    refresh() {
        this.loadTab(this.currentTab);
    }

    getSetupTabHTML() {
        return `
            <div class="tab-content active" id="setup">
                <h2 class="section-title">🏟️ Configuration du Match</h2>

                <div class="explanation-box">
                    <h4>📝 À faire avant de commencer</h4>
                    <p><strong>1.</strong> Renseignez les informations des deux équipes</p>
                    <p><strong>2.</strong> La VEA (Valeur d'Équipe Actuelle) sert à calculer la petite monnaie</p>
                    <p><strong>3.</strong> Chaque équipe commence avec 1 fan dévoué minimum</p>
                    <p><strong>4.</strong> Une fois terminé, passez à l'onglet "Avant-Match"</p>
                </div>

                <div class="teams-setup">
                    ${this.getTeamCardHTML(1, 'Domicile', '🏠')}
                    ${this.getTeamCardHTML(2, 'Visiteur', '🚌')}
                </div>

                <div id="vea-comparison" class="result-box" style="display: none;"></div>

                <div class="form-actions">
                    <button class="btn btn-primary" onclick="app.switchTab('prematch')">
                        ➡️ Passer à l'Avant-Match
                    </button>
                </div>
            </div>
        `;
    }

    getTeamCardHTML(teamNumber, type, icon) {
        const team = this.matchData[`team${teamNumber}`];

        return `
            <div class="team-card">
                <h3>${icon} Équipe ${type}</h3>

                <div class="form-group">
                    <label>Nom de l'équipe *</label>
                    <input type="text"
                        id="team${teamNumber}-name"
                        data-team="${teamNumber}"
                        data-team-field="name"
                        placeholder="Ex: ${teamNumber === 1 ? 'Les Orcs Verts' : 'Les Nains du Tonnerre'}"
                        value="${team.name}">
                    <div class="help-text">Ce nom apparaîtra partout dans l'application</div>
                </div>

                <div class="form-group">
                    <label>Type d'équipe (Roster)</label>
                    <select id="team${teamNumber}-roster"
                        data-team="${teamNumber}"
                        data-team-field="roster"
                        value="${team.roster}">
                        <option value="">-- Choisir --</option>
                        ${AppConfig.gameData.teamRosters.map(roster =>
                            `<option value="${roster}" ${team.roster === roster ? 'selected' : ''}>${roster}</option>`
                        ).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label>Nom du Coach</label>
                    <input type="text"
                        id="team${teamNumber}-coach"
                        data-team="${teamNumber}"
                        data-team-field="coach"
                        placeholder="${teamNumber === 1 ? 'Votre nom' : 'Nom de l\'adversaire'}"
                        value="${team.coach}">
                </div>

                <div class="form-group">
                    <label class="tooltip" data-tooltip="Valeur totale de votre équipe moins les joueurs qui ratent le match">
                        VEA (Valeur d'Équipe Actuelle) *
                    </label>
                    <input type="number"
                        id="team${teamNumber}-vea"
                        data-team="${teamNumber}"
                        data-team-field="vea"
                        placeholder="600000"
                        min="0"
                        step="1000"
                        value="${team.vea || ''}">
                    <div class="help-text">En PO. Exemple: 600000 pour une équipe de départ</div>
                </div>

                <div class="form-group">
                    <label class="tooltip" data-tooltip="Entre 1 et 6 fans dévoués">Fans Dévoués</label>
                    <input type="number"
                        id="team${teamNumber}-fans"
                        data-team="${teamNumber}"
                        data-team-field="fans"
                        value="${team.fans}"
                        min="${AppConfig.limits.minFans}"
                        max="${AppConfig.limits.maxFans}">
                    <div class="help-text">Chaque équipe commence avec 1 fan, peut en gagner jusqu'à 6</div>
                </div>
            </div>
        `;
    }

    initializeTab(tabId) {
        switch(tabId) {
            case 'setup':
                this.initializeSetupTab();
                break;
            case 'prematch':
                this.initializePrematchTab();
                break;
            // ... autres onglets
        }
    }

    initializeSetupTab() {
        // Mettre à jour l'affichage de la comparaison VEA
        this.updateVEAComparison();
    }

    updateTeamData(teamNumber, field, value) {
        // Validation selon le champ
        let isValid = true;
        let validatedValue = value;

        switch(field) {
            case 'name':
                isValid = Utils.validate.teamName(value);
                break;
            case 'vea':
                isValid = Utils.validate.vea(value);
                validatedValue = parseInt(value) || 0;
                break;
            case 'fans':
                isValid = Utils.validate.fans(value);
                validatedValue = parseInt(value) || 1;
                break;
        }

        if (isValid) {
            this.matchData[`team${teamNumber}`][field] = validatedValue;

            // Mettre à jour les affichages dépendants
            if (field === 'name') {
                this.updateTeamNamesDisplay();
            }

            if (field === 'vea' || field === 'fans') {
                this.updateVEAComparison();
            }
        }
    }

    updateVEAComparison() {
        const team1Vea = this.matchData.team1.vea;
        const team2Vea = this.matchData.team2.vea;
        const comparisonDiv = document.getElementById('vea-comparison');

        if (!comparisonDiv) return;

        if (team1Vea === 0 || team2Vea === 0) {
            comparisonDiv.style.display = 'none';
            return;
        }

        comparisonDiv.style.display = 'block';

        let comparisonText = '';
        let className = 'result-box ';

        if (team1Vea > team2Vea) {
            const diff = team1Vea - team2Vea;
            comparisonText = `${this.matchData.team2.name || 'Équipe 2'} est l'outsider avec ${Utils.formatNumber(diff)} PO de moins.`;
            className += 'warning';
        } else if (team2Vea > team1Vea) {
            const diff = team2Vea - team1Vea;
            comparisonText = `${this.matchData.team1.name || 'Équipe 1'} est l'outsider avec ${Utils.formatNumber(diff)} PO de moins.`;
            className += 'warning';
        } else {
            comparisonText = `Les deux équipes ont une VEA égale. Pas d'outsider.`;
            className += 'success';
        }

        comparisonDiv.className = className;
        comparisonDiv.innerHTML = `<p>${comparisonText}</p>`;
    }

    updateTeamNamesDisplay() {
        // Cette fonction sera utilisée pour mettre à jour tous les endroits où les noms apparaissent
        // Pour l'instant, on ne fait rien car on n'a que l'onglet Setup
    }

}

// Rendre l'app accessible globalement pour Cordova
window.BloodBowlApp = BloodBowlApp;
