// js/app.js
class BloodBowlApp {
    constructor() {
        this.currentTab = 'setup';
        this.matchData = {
            team1: this.createTeamObject(),
            team2: this.createTeamObject(),
            weather: {
                total: 0,
                effect: '',
                rolled: false,
                dice1: null,
                dice2: null
            },
            kickoffEvents: [],
            matchStart: null,
            matchEnd: null,
            coinFlip: '',
            prayer: {
                effect: '',
                rolled: false,
                dice: null
            },
            inducements: {
                team1Items: {},
                team2Items: {},
                team1PetiteMonnaie: 0,
                team2PetiteMonnaie: 0,
                team1Treasury: 0,
                team2Treasury: 0
            }
        };

        // Initialiser les inducements
        this.initializeInducementsData();

        this.init();
    }

    initializeInducementsData() {
        if (!this.matchData.inducements) {
            this.matchData.inducements = {
                team1Items: {},
                team2Items: {},
                team1PetiteMonnaie: 0,
                team2PetiteMonnaie: 0,
                team1Treasury: 0,
                team2Treasury: 0
            };
        }

        // S'assurer que les items sont initialisés
        if (!this.matchData.inducements.team1Items) {
            this.matchData.inducements.team1Items = {};
        }
        if (!this.matchData.inducements.team2Items) {
            this.matchData.inducements.team2Items = {};
        }
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
            popularityDice: null, // Ajouter cette ligne
            players: [],
            treasury: 0
        };
    }

    // Méthode pour réinitialiser complètement l'application
    resetApp() {
        if (confirm('Voulez-vous effacer toutes les données et recommencer ? Cette action est irréversible.')) {
            // Effacer le localStorage
            Utils.storage.remove('match_state');

            // Réinitialiser matchData
            this.matchData = {
                team1: this.createTeamObject(),
                team2: this.createTeamObject(),
                weather: {
                    total: 0,
                    effect: '',
                    rolled: false,
                    dice1: null,
                    dice2: null
                },
                kickoffEvents: [],
                matchStart: null,
                matchEnd: null,
                coinFlip: '',
                prayer: {
                    effect: '',
                    rolled: false,
                    dice: null
                },
                inducements: {
                    team1Items: {},
                    team2Items: {},
                    team1PetiteMonnaie: 0,
                    team2PetiteMonnaie: 0,
                    team1Treasury: 0,
                    team2Treasury: 0
                }
            };

            // Recharger l'onglet actuel
            this.loadTab('setup');

            alert('Application réinitialisée avec succès !');
        }
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

    // Modification temporaire de la méthode loadTab pour voir où ça bloque :
//    async loadTab(tabId) {
//        console.log('Loading tab:', tabId);
//        const content = document.getElementById('main-content');
//
//        // Afficher le loading
//        this.showLoading();
//
//        try {
//            // Charger le contenu de l'onglet
//            console.log('Getting tab content...');
//            const tabContent = await this.getTabContent(tabId);
//            console.log('Tab content length:', tabContent.length);
//
//            content.innerHTML = tabContent;
//
//            // Initialiser les éléments spécifiques à l'onglet
//            console.log('Initializing tab...');
//            this.initializeTab(tabId);
//
//            this.currentTab = tabId;
//
//            // Mettre à jour la progression
//            this.updateProgress(tabId);
//
//            console.log('Tab loaded successfully');
//
//        } catch (error) {
//            console.error('Erreur chargement onglet:', error);
//            console.error('Stack trace:', error.stack);
//            content.innerHTML = '<p class="error">Erreur de chargement: ' + error.message + '</p>';
//        } finally {
//            this.hideLoading();
//        }
//    }

    async loadTab(tabId) {
        console.log('Loading tab:', tabId);
        const content = document.getElementById('main-content');

        // Afficher le loading
        this.showLoading();

        try {
            // Charger le contenu de l'onglet
            console.log('Getting tab content...');
            const tabContent = await this.getTabContent(tabId);
            console.log('Tab content length:', tabContent.length);

            // DEBUG: Afficher les 500 premiers caractères
            console.log('First 500 chars:', tabContent.substring(0, 500));

            // DEBUG: Vérifier s'il y a des erreurs évidentes
            if (tabContent.includes('undefined')) {
                console.warn('Le HTML contient "undefined"');
            }

            content.innerHTML = tabContent;

            // Initialiser les éléments spécifiques à l'onglet
            console.log('Initializing tab...');
            this.initializeTab(tabId);

            this.currentTab = tabId;

            // Mettre à jour la progression
            this.updateProgress(tabId);

            console.log('Tab loaded successfully');

        } catch (error) {
            console.error('Erreur chargement onglet:', error);
            console.error('Stack trace:', error.stack);
            content.innerHTML = '<p class="error">Erreur de chargement: ' + error.message + '</p>';
        } finally {
            this.hideLoading();
        }
    }

    getTabContent(tabId) {
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

    // Méthodes temporaires pour les onglets non implémentés
    getMatchTabHTML() {
        return `
            <div class="tab-content" id="match">
                <h2 class="section-title">🎮 Match</h2>
                <p>Cet onglet sera implémenté prochainement.</p>
            </div>
        `;
    }

    getPostmatchTabHTML() {
        return `
            <div class="tab-content" id="postmatch">
                <h2 class="section-title">📊 Après-Match</h2>
                <p>Cet onglet sera implémenté prochainement.</p>
            </div>
        `;
    }

    getSummaryTabHTML() {
        return `
            <div class="tab-content" id="summary">
                <h2 class="section-title">📋 Résumé</h2>
                <p>Cet onglet sera implémenté prochainement.</p>
            </div>
        `;
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

            // Migration des anciennes données
            this.migrateOldData();

            console.log('État restauré:', savedState.saveDate);
            return true;
        }

        return false;
    }

    // Nouvelle méthode pour migrer les anciennes données
    migrateOldData() {
        // S'assurer que inducements existe
        if (!this.matchData.inducements) {
            this.matchData.inducements = {
                team1Items: {},
                team2Items: {},
                team1PetiteMonnaie: 0,
                team2PetiteMonnaie: 0,
                team1Treasury: 0,
                team2Treasury: 0
            };
        }

        // S'assurer que weather a toutes ses propriétés
        if (!this.matchData.weather) {
            this.matchData.weather = {
                total: 0,
                effect: '',
                rolled: false,
                dice1: null,
                dice2: null
            };
        } else {
            if (this.matchData.weather.dice1 === undefined) {
                this.matchData.weather.dice1 = null;
            }
            if (this.matchData.weather.dice2 === undefined) {
                this.matchData.weather.dice2 = null;
            }
        }

        // S'assurer que prayer existe
        if (!this.matchData.prayer) {
            this.matchData.prayer = {
                effect: '',
                rolled: false,
                dice: null
            };
        }

        // S'assurer que coinFlip existe
        if (!this.matchData.coinFlip) {
            this.matchData.coinFlip = '';
        }

        // S'assurer que chaque équipe a popularityDice
        if (this.matchData.team1 && this.matchData.team1.popularityDice === undefined) {
            this.matchData.team1.popularityDice = null;
        }
        if (this.matchData.team2 && this.matchData.team2.popularityDice === undefined) {
            this.matchData.team2.popularityDice = null;
        }
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

    getPrematchTabHTML() {
        let html = `
            <div class="tab-content" id="prematch">
                <h2 class="section-title">⚡ Séquence d'Avant-Match</h2>

                <div class="explanation-box">
                    <h4>🎯 Déroulement de l'avant-match (dans l'ordre)</h4>
                    <p><strong>1.</strong> Déterminez le facteur de popularité (fans)</p>
                    <p><strong>2.</strong> Tirez la météo qui affectera le match</p>
                    <p><strong>3.</strong> Calculez la petite monnaie et les coups de pouce</p>
                    <p><strong>4.</strong> L'outsider peut invoquer Nuffle</p>
                    <p><strong>5.</strong> Déterminez qui engage en premier</p>
                </div>
        `;

        try {
            html += this.getPopularitySection();
        } catch (e) {
            console.error('Erreur dans getPopularitySection:', e);
            html += '<div class="error">Erreur section popularité</div>';
        }

        try {
            html += this.getWeatherSection();
        } catch (e) {
            console.error('Erreur dans getWeatherSection:', e);
            html += '<div class="error">Erreur section météo</div>';
        }

        try {
            html += this.getPetiteMonnaieSection();
        } catch (e) {
            console.error('Erreur dans getPetiteMonnaieSection:', e);
            html += '<div class="error">Erreur section petite monnaie</div>';
        }

        try {
            html += this.getPrayerSection();
        } catch (e) {
            console.error('Erreur dans getPrayerSection:', e);
            html += '<div class="error">Erreur section prière</div>';
        }

        try {
            html += this.getCoinFlipSection();
        } catch (e) {
            console.error('Erreur dans getCoinFlipSection:', e);
            html += '<div class="error">Erreur section pile ou face</div>';
        }

        html += `
                <div style="text-align: center; margin-top: 20px;">
                    <button class="btn btn-primary" onclick="app.switchTab('setup')">⬅️ Retour Configuration</button>
                    <button class="btn btn-primary" onclick="app.switchTab('match')">➡️ Commencer le Match</button>
                </div>
            </div>
        `;

        return html;
    }

//    // version simplifiée de getPrematchTabHTML pour tester
//    getPrematchTabHTML() {
//        return `
//            <div class="tab-content active" id="prematch">
//                <h2 class="section-title">⚡ Séquence d'Avant-Match</h2>
//
//                <div class="explanation-box">
//                    <h4>🎯 Déroulement de l'avant-match (dans l'ordre)</h4>
//                    <p><strong>1.</strong> Déterminez le facteur de popularité (fans)</p>
//                    <p><strong>2.</strong> Tirez la météo qui affectera le match</p>
//                </div>
//
//                <div class="step-section">
//                    <div class="step-header">
//                        <div class="step-number">1</div>
//                        <div class="step-title">Test de fonctionnement</div>
//                    </div>
//                    <p>Si vous voyez ce texte, l'onglet se charge correctement.</p>
//                </div>
//            </div>
//        `;
//    }

    getPopularitySection() {
        const team1 = this.matchData.team1 || {};
        const team2 = this.matchData.team2 || {};

        return `
            <div class="step-section">
                <div class="step-header">
                    <div class="step-number">1</div>
                    <div class="step-title">Facteur de Popularité</div>
                </div>
                <div class="explanation-box">
                    <p><strong>Règle :</strong> Chaque coach lance 1D3 et ajoute ses fans dévoués</p>
                    <p>Ce facteur détermine les gains à la fin du match et peut influencer certains événements</p>
                </div>
                <div class="dice-controls">
                    <span><strong>${team1.name || 'Équipe 1'}</strong> :</span>
                    <button class="dice-btn" data-dice-type="popularity" data-team="1">🎲 Lancer D3</button>
                    <input type="number" class="dice-result" id="team1-pop-dice"
                        value="${team1.popularityDice || ''}" min="1" max="3"
                        data-team="1" data-field="popularityDice">
                    <span>+ ${team1.fans || 1} fans =</span>
                    <input type="number" class="dice-result" id="team1-pop-total"
                        value="${team1.popularity || ''}" readonly>
                </div>
                <div class="dice-controls">
                    <span><strong>${team2.name || 'Équipe 2'}</strong> :</span>
                    <button class="dice-btn" data-dice-type="popularity" data-team="2">🎲 Lancer D3</button>
                    <input type="number" class="dice-result" id="team2-pop-dice"
                        value="${team2.popularityDice || ''}" min="1" max="3"
                        data-team="2" data-field="popularityDice">
                    <span>+ ${team2.fans || 1} fans =</span>
                    <input type="number" class="dice-result" id="team2-pop-total"
                        value="${team2.popularity || ''}" readonly>
                </div>
                <div id="popularity-result" class="result-box" style="${(team1.popularity && team2.popularity) ? '' : 'display: none;'}">
                    ${this.getPopularityResultText()}
                </div>
            </div>
        `;
    }

    getWeatherSection() {
        const weather = this.matchData.weather;

        return `
            <div class="step-section">
                <div class="step-header">
                    <div class="step-number">2</div>
                    <div class="step-title">Météo</div>
                </div>
                <div class="explanation-box">
                    <p><strong>Règle :</strong> Chaque coach lance 1D6, on additionne les résultats (2-12)</p>
                    <p>La météo peut affecter les passes, la course, les tests d'armure, etc.</p>
                </div>
                <div class="dice-controls">
                    <span><strong>${this.matchData.team1.name || 'Équipe 1'}</strong> :</span>
                    <button class="dice-btn" data-dice-type="weather" data-team="1">🎲 Lancer D6</button>
                    <input type="number" class="dice-result" id="weather1-result"
                        value="${weather.dice1 || ''}" min="1" max="6"
                        data-field="weatherDice1">
                    <span><strong>${this.matchData.team2.name || 'Équipe 2'}</strong> :</span>
                    <button class="dice-btn" data-dice-type="weather" data-team="2">🎲 Lancer D6</button>
                    <input type="number" class="dice-result" id="weather2-result"
                        value="${weather.dice2 || ''}" min="1" max="6"
                        data-field="weatherDice2">
                    <span><strong>Total :</strong></span>
                    <input type="number" class="dice-result" id="weather-total"
                        value="${weather.total || ''}" readonly>
                </div>
                <div id="weather-description" class="result-box" style="${weather.effect ? '' : 'display: none;'}">
                    ${weather.effect ? `<p>Météo actuelle (${weather.total}) : <strong>${weather.effect}</strong></p>` : ''}
                </div>
            </div>
        `;
    }

    getPetiteMonnaieSection() {
        const team1Vea = this.matchData.team1.vea;
        const team2Vea = this.matchData.team2.vea;
        const { team1PetiteMonnaie, team2PetiteMonnaie } = this.calculatePetiteMonnaie();

        return `
            <div class="step-section">
                <div class="step-header">
                    <div class="step-number">3</div>
                    <div class="step-title">Petite Monnaie & Coups de Pouce</div>
                </div>

                <div class="explanation-box">
                    <p><strong>Règle :</strong> L'équipe avec la VEA la plus faible reçoit la différence en "petite monnaie"</p>
                    <p>Cette petite monnaie ne peut être utilisée QUE pour acheter des coups de pouce pour ce match</p>
                    <p>Les deux équipes peuvent aussi dépenser de leur trésorerie pour acheter des coups de pouce</p>
                </div>

                <div id="petite-monnaie-calculation" class="result-box">
                    ${this.getPetiteMonnaieText()}
                </div>

                <div class="budget-display">
                    <div class="budget-item ${team1PetiteMonnaie > 0 ? 'warning' : ''}">
                        <div class="value">${Utils.formatNumber(team1PetiteMonnaie)} PO</div>
                        <div class="label">Petite Monnaie<br>${this.matchData.team1.name || 'Équipe 1'}</div>
                    </div>
                    <div class="budget-item ${team2PetiteMonnaie > 0 ? 'warning' : ''}">
                        <div class="value">${Utils.formatNumber(team2PetiteMonnaie)} PO</div>
                        <div class="label">Petite Monnaie<br>${this.matchData.team2.name || 'Équipe 2'}</div>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 15px;">
                    <button class="btn btn-secondary" onclick="app.showInducementsModal()">
                        💰 Gérer les Coups de Pouce
                    </button>
                </div>
            </div>
        `;
    }

    getPrayerSection() {
        const prayer = this.matchData.prayer || { effect: '', rolled: false, dice: null };
        const prayerCount = this.calculatePrayerCount();

        return `
            <div class="step-section">
                <div class="step-header">
                    <div class="step-number">4</div>
                    <div class="step-title">Prières à Nuffle</div>
                </div>
                <div class="explanation-box">
                    <p><strong>Règle :</strong> L'outsider (équipe avec VEA la plus faible) peut prier Nuffle</p>
                    <p>1 prière par tranche de 50 000 PO d'écart entre les VEA</p>
                    <p>Les effets durent généralement jusqu'à la fin de la phase (mi-temps ou TD)</p>
                </div>
                <div class="dice-controls">
                    <button class="dice-btn" data-dice-type="prayer"
                        ${prayerCount > 0 ? '' : 'disabled'}>
                        🙏 Prière à Nuffle (D8)
                    </button>
                    <input type="number" class="dice-result" id="prayer-result"
                        value="${prayer.dice || ''}" min="1" max="8"
                        data-field="prayerDice">
                </div>
                <div id="prayer-description" class="result-box" style="${prayer.effect ? '' : 'display: none;'}">
                    ${prayer.effect ? `<p>Résultat de la Prière (${prayer.dice}) : <strong>${prayer.effect}</strong></p>` : ''}
                </div>
                <div id="prayer-info" class="help-text">
                    ${this.getPrayerInfoText()}
                </div>
            </div>
        `;
    }

    getCoinFlipSection() {
        const coinFlip = this.matchData.coinFlip;

        return `
            <div class="step-section">
                <div class="step-header">
                    <div class="step-number">5</div>
                    <div class="step-title">Pile ou Face</div>
                </div>
                <div class="explanation-box">
                    <p><strong>Règle :</strong> Déterminez qui engage (lance le ballon) et qui reçoit</p>
                    <p>Le gagnant du tirage choisit d'engager ou de recevoir pour la première mi-temps</p>
                </div>
                <div class="dice-controls">
                    <button class="dice-btn" data-dice-type="coin">🪙 Pile ou Face</button>
                    <input type="text" class="dice-result" id="coin-result"
                        value="${coinFlip}" readonly
                        data-field="coinFlip">
                </div>
                <div id="coin-description" class="result-box" style="${coinFlip ? '' : 'display: none;'}">
                    ${coinFlip ? `<p>Résultat du tirage au sort : <strong>${coinFlip}</strong> !</p>
                    <p>Le coach qui a gagné le tirage choisit d'engager ou de recevoir.</p>` : ''}
                </div>
            </div>
        `;
    }

    // Méthodes de calcul
    calculatePetiteMonnaie() {
        const team1Vea = this.matchData.team1.vea;
        const team2Vea = this.matchData.team2.vea;
        let team1PetiteMonnaie = 0;
        let team2PetiteMonnaie = 0;

        if (team1Vea > team2Vea) {
            team2PetiteMonnaie = team1Vea - team2Vea;
        } else if (team2Vea > team1Vea) {
            team1PetiteMonnaie = team2Vea - team1Vea;
        }

        this.matchData.inducements.team1PetiteMonnaie = team1PetiteMonnaie;
        this.matchData.inducements.team2PetiteMonnaie = team2PetiteMonnaie;

        return { team1PetiteMonnaie, team2PetiteMonnaie };
    }

    calculatePrayerCount() {
        const diff = Math.abs(this.matchData.team1.vea - this.matchData.team2.vea);
        return Math.floor(diff / 50000);
    }

    getPopularityResultText() {
        const team1Pop = this.matchData.team1.popularity;
        const team2Pop = this.matchData.team2.popularity;

        if (team1Pop && team2Pop) {
            return `<p>Facteur de Popularité Final : <strong>${this.matchData.team1.name} ${team1Pop}</strong> vs <strong>${this.matchData.team2.name} ${team2Pop}</strong></p>`;
        }
        return '<p>Lancez les dés de popularité pour les deux équipes.</p>';
    }

    getPetiteMonnaieText() {
        const team1Vea = this.matchData.team1.vea;
        const team2Vea = this.matchData.team2.vea;

        if (team1Vea === 0 || team2Vea === 0) {
            return '<p>⚠️ Renseignez d\'abord les VEA dans l\'onglet Configuration</p>';
        }

        const { team1PetiteMonnaie, team2PetiteMonnaie } = this.calculatePetiteMonnaie();

        if (team1PetiteMonnaie > 0) {
            return `<p>${this.matchData.team1.name} reçoit <strong>${Utils.formatNumber(team1PetiteMonnaie)} PO</strong> de petite monnaie. Utilisez-la pour acheter des coups de pouce !</p>`;
        } else if (team2PetiteMonnaie > 0) {
            return `<p>${this.matchData.team2.name} reçoit <strong>${Utils.formatNumber(team2PetiteMonnaie)} PO</strong> de petite monnaie. Utilisez-la pour acheter des coups de pouce !</p>`;
        } else {
            return '<p>Pas de petite monnaie. Les VEA sont égales.</p>';
        }
    }

    getPrayerInfoText() {
        const prayerCount = this.calculatePrayerCount();

        if (prayerCount === 0) {
            return 'Les VEA sont égales ou trop proches, pas de prière à Nuffle.';
        }

        const outsider = this.matchData.team1.vea < this.matchData.team2.vea ?
            this.matchData.team1.name : this.matchData.team2.name;

        return `${outsider} peut faire ${prayerCount} prière(s) à Nuffle.`;
    }

    // Gestion des dés
    handleDiceRoll(target) {
        const diceType = target.dataset.diceType;
        const team = target.dataset.team;

        switch(diceType) {
            case 'popularity':
                this.rollPopularityDice(team);
                break;
            case 'weather':
                this.rollWeatherDice(team);
                break;
            case 'prayer':
                this.rollPrayerDice();
                break;
            case 'coin':
                this.flipCoin();
                break;
        }
    }

    rollPopularityDice(team) {
        const roll = Utils.getRandomInt(1, 3);
        const teamKey = `team${team}`;

        this.matchData[teamKey].popularityDice = roll;
        this.matchData[teamKey].popularity = roll + this.matchData[teamKey].fans;

        // Mettre à jour l'affichage
        document.getElementById(`team${team}-pop-dice`).value = roll;
        document.getElementById(`team${team}-pop-total`).value = this.matchData[teamKey].popularity;

        // Afficher le résultat si les deux équipes ont lancé
        if (this.matchData.team1.popularity && this.matchData.team2.popularity) {
            const resultDiv = document.getElementById('popularity-result');
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = this.getPopularityResultText();
            resultDiv.className = 'result-box success';
        }
    }

    rollWeatherDice(team) {
        const roll = Utils.getRandomInt(1, 6);

        if (team === '1') {
            this.matchData.weather.dice1 = roll;
            document.getElementById('weather1-result').value = roll;
        } else {
            this.matchData.weather.dice2 = roll;
            document.getElementById('weather2-result').value = roll;
        }

        // Calculer le total si les deux dés sont lancés
        if (this.matchData.weather.dice1 && this.matchData.weather.dice2) {
            const total = this.matchData.weather.dice1 + this.matchData.weather.dice2;
            this.matchData.weather.total = total;
            this.matchData.weather.effect = AppConfig.gameData.weatherEffects[total] || "Effet météo inconnu.";
            this.matchData.weather.rolled = true;

            document.getElementById('weather-total').value = total;
            const descDiv = document.getElementById('weather-description');
            descDiv.style.display = 'block';
            descDiv.className = 'result-box success';
            descDiv.innerHTML = `<p>Météo actuelle (${total}) : <strong>${this.matchData.weather.effect}</strong></p>`;
        }
    }

    rollPrayerDice() {
        const roll = Utils.getRandomInt(1, 8);
        this.matchData.prayer.dice = roll;

        // Récupérer l'effet depuis la config
        const prayerEffects = {
            1: "🙏 Trappe traîtresse : Jusqu'à la fin de la mi temps, tout joueur qui termine son mouvement sur une case trappe jette 1d6. Sur un résultat de 1, il est considéré comme poussé dans le public. S'il portait le ballon, il rebondit.",
            2: "🙏 Pote avec l'arbitre : Jusqu'à la fin de la phase, les résultats de contestation sont traités en 2-4 et 5-6 au lieu de 2-5 et 6.",
            3: "🙏 Stylet : Choisissez 1 de vos joueur non solitaire et disponible pour cette phase, il obtient poignard jusqu'à la fin de la phase.",
            4: "🙏 Homme de fer : Choisissez un de vos joueur non solitaire et disponible pour cette phase, il obtient +1AR (max 11) pour la durée du match.",
            5: "🙏 Poings américains : Choisissez 1 de vos joueur non solitaire et disponible pour cette phase, il obtient châtaigne (+1) pour la durée du match.",
            6: "🙏 Mauvaises habitudes : Désignez au hasard 1d3 joueurs adverses non solitaire et disponible pour cette phase, ils obtiennent solitaire (2+) jusqu'à la fin de la phase.",
            7: "🙏 Crampons graisseux : Désignez au hasard 1 joueur adverse disponible pour cette phase, il obtient -1M jusqu'à la fin de la phase.",
            8: "🙏 Statue bénie de Nuffle : Choisissez 1 de vos joueur non solitaire et disponible pour cette phase, il obtient Pro pour la durée du match."
        };

        this.matchData.prayer.effect = prayerEffects[roll] || "Effet de prière inconnu.";
        this.matchData.prayer.rolled = true;

        document.getElementById('prayer-result').value = roll;
        const descDiv = document.getElementById('prayer-description');
        descDiv.style.display = 'block';
        descDiv.className = 'result-box success';
        descDiv.innerHTML = `<p>Résultat de la Prière (${roll}) : <strong>${this.matchData.prayer.effect}</strong></p>`;
    }

    flipCoin() {
        const outcomes = ['Pile', 'Face'];
        const result = outcomes[Utils.getRandomInt(0, 1)];
        this.matchData.coinFlip = result;

        document.getElementById('coin-result').value = result;
        const descDiv = document.getElementById('coin-description');
        descDiv.style.display = 'block';
        descDiv.className = 'result-box success';
        descDiv.innerHTML = `<p>Résultat du tirage au sort : <strong>${result}</strong> !</p>
                            <p>Le coach qui a gagné le tirage choisit d'engager ou de recevoir.</p>`;
    }

    // Initialisation de l'onglet
    initializePrematchTab() {
        // Écouter les changements manuels des inputs
        const popDice1 = document.getElementById('team1-pop-dice');
        const popDice2 = document.getElementById('team2-pop-dice');

        if (popDice1) {
            popDice1.addEventListener('input', (e) => {
                const value = parseInt(e.target.value) || 0;
                if (value >= 1 && value <= 3) {
                    this.matchData.team1.popularityDice = value;
                    this.matchData.team1.popularity = value + this.matchData.team1.fans;
                    document.getElementById('team1-pop-total').value = this.matchData.team1.popularity;
                    this.updatePopularityResult();
                }
            });
        }

        if (popDice2) {
            popDice2.addEventListener('input', (e) => {
                const value = parseInt(e.target.value) || 0;
                if (value >= 1 && value <= 3) {
                    this.matchData.team2.popularityDice = value;
                    this.matchData.team2.popularity = value + this.matchData.team2.fans;
                    document.getElementById('team2-pop-total').value = this.matchData.team2.popularity;
                    this.updatePopularityResult();
                }
            });
        }

        // Idem pour la météo
        const weather1 = document.getElementById('weather1-result');
        const weather2 = document.getElementById('weather2-result');

        if (weather1) {
            weather1.addEventListener('input', (e) => {
                const value = parseInt(e.target.value) || 0;
                if (value >= 1 && value <= 6) {
                    this.matchData.weather.dice1 = value;
                    this.updateWeatherResult();
                }
            });
        }

        if (weather2) {
            weather2.addEventListener('input', (e) => {
                const value = parseInt(e.target.value) || 0;
                if (value >= 1 && value <= 6) {
                    this.matchData.weather.dice2 = value;
                    this.updateWeatherResult();
                }
            });
        }
    }

    updatePopularityResult() {
        if (this.matchData.team1.popularity && this.matchData.team2.popularity) {
            const resultDiv = document.getElementById('popularity-result');
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = this.getPopularityResultText();
            resultDiv.className = 'result-box success';
        }
    }

    updateWeatherResult() {
        if (this.matchData.weather.dice1 && this.matchData.weather.dice2) {
            const total = this.matchData.weather.dice1 + this.matchData.weather.dice2;
            this.matchData.weather.total = total;
            this.matchData.weather.effect = AppConfig.gameData.weatherEffects[total] || "Effet météo inconnu.";
            this.matchData.weather.rolled = true;

            document.getElementById('weather-total').value = total;
            const descDiv = document.getElementById('weather-description');
            descDiv.style.display = 'block';
            descDiv.className = 'result-box success';
            descDiv.innerHTML = `<p>Météo actuelle (${total}) : <strong>${this.matchData.weather.effect}</strong></p>`;
        }
    }

    // Placeholder pour la modal des coups de pouce
    showInducementsModal() {
        alert('La gestion des coups de pouce sera implémentée dans la prochaine étape !');
    }

}

// Rendre l'app accessible globalement pour Cordova
window.BloodBowlApp = BloodBowlApp;
