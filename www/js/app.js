// js/app.js

// Vérification de la disponibilité d'AppConfig
if (typeof AppConfig === 'undefined') {
    console.error('AppConfig non défini ! Chargement avec config par défaut...');
    window.AppConfig = {
        gameData: {
            teamRosters: [
                "Alliance du Vieux Monde",
                "Amazones",
                "Bas-Fonds",
                "Elfes Noirs",
                "Gobelins",
                "Humains",
                "Nains",
                "Noblesse Impériale",
                "Nordiques",
                "Nurgle",
                "Ogres",
                "Orcs",
                "Orques Noirs",
                "Skavens",
                "Snotlings",
                "Elus du Chaos",
                "Elfes Sylvains",
                "Halflings",
                "Gnomes",
                "Hauts Elfes",
                "Hommes-Lézards",
                "Démons de Khorne",
                "Horreurs Nécromantiques",
                "Morts-vivants",
                "Nain du Chaos",
                "Renégats du Chaos",
                "Rois des Tombes de Khemri",
                "Slanns",
                "Union Elfique",
                "Vampires"
            ],
            inducements: [
                {
                    name: "Cheerleaders intérimaires",
                    cost: 30000,
                    max: 2,
                    description: "S'ajoutent aux cheerleaders pour le match"
                },
                {
                    name: "Coachs assistants à temps partiels",
                    cost: 30000,
                    max: 1,
                    description: "S'ajoutent aux coachs assistants pour le match"
                },
                {
                    name: "Entraînements supplémentaires",
                    cost: 100000,
                    max: 6,
                    description: "1 relance d'équipe supplémentaire à chaque mi-temps"
                },
                {
                    name: "Apothicaire ambulant",
                    cost: 100000,
                    max: 2,
                    description: "Vous louez les services d'un apothicaire"
                }
            ],
            weatherEffects: {
                2: "🌡️ Chaleur Accablante",
                3: "☀️ Très ensoleillé",
                4: "⛅ Conditions idéales",
                5: "⛅ Conditions idéales",
                6: "⛅ Conditions idéales",
                7: "⛅ Conditions idéales",
                8: "⛅ Conditions idéales",
                9: "⛅ Conditions idéales",
                10: "⛅ Conditions idéales",
                11: "⚡ Pluie Battante",
                12: "❄️ Blizzard"
            }
        },
        limits: {
            minFans: 1,
            maxFans: 6
        },
        mobile: {
            autoSaveInterval: 30000
        },
        storage: {
            prefix: 'bloodbowl_',
            keys: {
                matchState: 'match_state',
                settings: 'settings',
                teams: 'teams'
            }
        },
        version: '1.0.0'
    };
}

class BloodBowlApp {
    constructor() {
        this.currentTab = 'setup';

        this.matchData = {
            team1: this.createTeamObject(),
            team2: this.createTeamObject(),
            timerRunning: false,
            pausedDuration: 0,
            lastStartTime: null,
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

        // Initialiser les items pour chaque inducement
        if (AppConfig && AppConfig.gameData && AppConfig.gameData.inducements) {
            AppConfig.gameData.inducements.forEach(inducement => {
                if (!this.matchData.inducements.team1Items[inducement.name]) {
                    this.matchData.inducements.team1Items[inducement.name] = 0;
                }
                if (!this.matchData.inducements.team2Items[inducement.name]) {
                    this.matchData.inducements.team2Items[inducement.name] = 0;
                }
            });
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
            popularityDice: null,
            players: [],
            treasury: 0,
            fansUpdateRoll: null,
            fansUpdateResult: '',
            soldPlayers: [],
            mvpName: '' // Ajout pour éviter les undefined
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

        // NOUVEAU : Initialiser le système d'erreurs
        if (window.initializeErrorManagement) {
            window.initializeErrorManagement();
        }

        // Charger les données sauvegardées
        this.loadState();

        this.syncAllTreasuries();

        // Initialiser les événements
        this.setupEventListeners();

        // Initialiser la trésorerie
        this.initializeTreasuries();

        // Charger le premier onglet
        this.loadTab('setup');

        // Démarrer l'auto-save
        this.startAutoSave();

        setTimeout(() => {
            this.initVisualValidation();
        }, 200);
    }

    setupEventListeners() {
        console.log('🔧 Configuration des événements...');

        // Gestion des onglets avec validation STRICTE
        const tabsContainer = document.getElementById('main-tabs');
        if (tabsContainer) {
            tabsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('tab')) {
                    e.preventDefault(); // Empêcher le comportement par défaut
                    e.stopPropagation(); // Empêcher la propagation

                    const tabId = e.target.dataset.tab;
                    console.log(`👆 Clic sur onglet: ${tabId}`);

                    // Appeler switchTab qui gère la validation
                    const success = this.switchTab(tabId);

                    if (!success) {
                        console.log(`🚫 Navigation vers ${tabId} échouée - maintien sur ${this.currentTab}`);

                        // Forcer la remise en place de l'onglet actuel après un délai
                        setTimeout(() => {
                            this.ensureCurrentTabSelected();
                        }, 100);
                    }
                }
            });

            console.log('✅ Gestionnaire d\'onglets configuré');
        } else {
            console.error('❌ Container des onglets introuvable');
        }

        // Délégation d'événements pour les inputs
        document.addEventListener('input', Utils.debounce((e) => {
            this.handleInput(e);
        }, 300));

        // Délégation pour les clics
        document.addEventListener('click', (e) => {
            this.handleClick(e);
        });

        // Effet d'ombre au scroll
        window.addEventListener('scroll', () => {
            const stickyWrapper = document.querySelector('.sticky-wrapper');
            if (stickyWrapper && window.scrollY > 50) {
                stickyWrapper.classList.add('scrolled');
            } else if (stickyWrapper) {
                stickyWrapper.classList.remove('scrolled');
            }
        });

        console.log('✅ Tous les événements configurés');
    }

    switchTab(tabId) {
        console.log(`🔄 Tentative navigation: ${this.currentTab} → ${tabId}`);

        try {
            // VALIDATION EN PREMIER
            if (window.secureTabSwitch) {
                const canSwitch = window.secureTabSwitch(this, tabId);
                if (!canSwitch) {
                    console.log(`❌ Navigation vers ${tabId} REFUSÉE`);

                    // Animation de refus sur l'onglet
                    const targetTab = document.querySelector(`[data-tab="${tabId}"]`);
                    if (targetTab) {
                        targetTab.classList.add('tab-blocked');
                        setTimeout(() => {
                            targetTab.classList.remove('tab-blocked');
                        }, 500);
                    }

                    // S'assurer que l'onglet actuel reste sélectionné
                    this.ensureCurrentTabSelected();

                    return false;
                }
            }

            console.log(`✅ Navigation vers ${tabId} AUTORISÉE`);

            // Nettoyer l'onglet actuel si nécessaire
            if (this.currentTab === 'match') {
                this.cleanupMatchTab();
            }

            // Changer d'onglet visuellement
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });

            const targetTab = document.querySelector(`[data-tab="${tabId}"]`);
            if (targetTab) {
                targetTab.classList.add('active');
            }

            // Charger le contenu
            this.loadTab(tabId);

            // Mettre à jour l'état
            this.currentTab = tabId;
            this.updateProgress(tabId);

            // NOUVEAU: Scroll vers le haut de la page
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Alternative pour mobile si le smooth scroll ne fonctionne pas
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;

            // Vibration tactile
            if (window.Utils && Utils.vibrate) {
                Utils.vibrate(10);
            }

            return true;

        } catch (error) {
            console.error('❌ Erreur dans switchTab:', error);
            this.ensureCurrentTabSelected();
            return false;
        }
    }

    getScoreDisplay() {
        // Calculer automatiquement les scores basés sur les TD dans le tableau
        this.updateTeamScore(1);
        this.updateTeamScore(2);

        return `
            <div class="step-section">
                <div class="step-header">
                    <div class="step-number">6</div>
                    <div class="step-title">Score du Match</div>
                </div>
                <div class="explanation-box">
                    <p>💡 <strong>Le score se met à jour automatiquement</strong> quand vous cochez "TD" dans le tableau des joueurs</p>
                </div>
                <div class="score-display">
                    <div class="team-score-card">
                        <div class="team-icon">🏠</div>
                        <h3>${this.matchData.team1.name || 'Équipe 1'}</h3>
                        <div class="score-value" id="score1">${this.matchData.team1.score || 0}</div>
                        <div class="score-label">TD</div>
                    </div>

                    <div class="vs-separator">
                        <span class="vs-text">VS</span>
                        <div class="match-status">
                            ${this.getMatchStatusText()}
                        </div>
                    </div>

                    <div class="team-score-card">
                        <div class="team-icon">🚌</div>
                        <h3>${this.matchData.team2.name || 'Équipe 2'}</h3>
                        <div class="score-value" id="score2">${this.matchData.team2.score || 0}</div>
                        <div class="score-label">TD</div>
                    </div>
                </div>
            </div>
        `;
    }

    getMatchStatusText() {
        const score1 = this.matchData.team1.score || 0;
        const score2 = this.matchData.team2.score || 0;

        if (score1 > score2) {
            return `<span style="color: #28a745;">🏆 ${this.matchData.team1.name} mène</span>`;
        } else if (score2 > score1) {
            return `<span style="color: #28a745;">🏆 ${this.matchData.team2.name} mène</span>`;
        } else {
            return `<span style="color: #6c757d;">🤝 Égalité</span>`;
        }
    }

    ensureCurrentTabSelected() {
        console.log(`🔧 Maintien de l'onglet actuel: ${this.currentTab}`);

        // Retirer toutes les classes active
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remettre l'onglet actuel en actif
        const currentTab = document.querySelector(`[data-tab="${this.currentTab}"]`);
        if (currentTab) {
            currentTab.classList.add('active');
            console.log(`✅ Onglet ${this.currentTab} remis en surbrillance`);
        } else {
            console.error(`❌ Impossible de trouver l'onglet actuel: ${this.currentTab}`);
        }
    }

    async loadTab(tabId) {
        console.log(`📄 Chargement du contenu pour: ${tabId}`);

        // Vérification de sécurité supplémentaire
        if (tabId !== this.currentTab && window.secureTabSwitch) {
            const canLoad = window.secureTabSwitch(this, tabId);
            if (!canLoad) {
                console.log(`❌ Chargement de ${tabId} refusé par la validation`);
                return;
            }
        }

        const content = document.getElementById('main-content');
        if (!content) {
            console.error('❌ Container de contenu introuvable');
            return;
        }

        // Afficher le loading
        this.showLoading();

        try {
            console.log(`🔄 Génération du contenu pour: ${tabId}`);

            // Charger le contenu de l'onglet
            const tabContent = await this.getTabContent(tabId);

            content.innerHTML = tabContent;

            // IMPORTANT : Ajouter la classe active au tab-content
            const tabContentDiv = content.querySelector('.tab-content');
            if (tabContentDiv) {
                tabContentDiv.classList.add('active');
            }

            // Initialiser les éléments spécifiques à l'onglet
            this.initializeTab(tabId);

            // NOUVEAU : Réinitialiser la validation visuelle pour l'onglet setup
            if (tabId === 'setup') {
                setTimeout(() => {
                    if (window.visualValidation) {
                        window.visualValidation.initialize();
                    }
                }, 100);
            }

            // Mettre à jour la progression
            this.updateProgress(tabId);

            console.log(`✅ Contenu ${tabId} chargé avec succès`);

        } catch (error) {
            console.error(`❌ Erreur chargement onglet ${tabId}:`, error);
            content.innerHTML = `<div class="tab-content active"><p class="error">Erreur de chargement: ${error.message}</p></div>`;
        } finally {
            this.hideLoading();
        }
    }

    async getTabContent(tabId) {
        console.log(`📄 Génération du contenu pour: ${tabId}`);

        let html = '';

        switch(tabId) {
            case 'setup':
                // Utiliser getSetupTabHTML si elle existe, sinon générer directement
                if (this.getSetupTabHTML) {
                    html = this.getSetupTabHTML();
                } else {
                    // Version de secours si getSetupTabHTML n'existe pas
                    html = `
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
                                <button class="btn btn-primary btn-next-tab"
                                        onclick="app.switchTab('prematch')">
                                    ➡️ Passer à l'Avant-Match
                                </button>
                            </div>
                        </div>
                    `;
                }
                break;

            case 'prematch':
                html = this.getPrematchTabHTML ? this.getPrematchTabHTML() : '<div class="tab-content">Avant-Match</div>';
                break;

            case 'match':
                html = this.getMatchTabHTML ? this.getMatchTabHTML() : '<div class="tab-content">Match</div>';
                break;

            case 'postmatch':
                html = this.getPostmatchTabHTML ? this.getPostmatchTabHTML() : '<div class="tab-content">Après-Match</div>';
                break;

            case 'summary':
                html = this.getSummaryTabHTML ? this.getSummaryTabHTML() : '<div class="tab-content">Résumé</div>';
                break;

            default:
                html = '<div class="tab-content active"><p>Onglet non reconnu</p></div>';
        }

        return html;
    }

    getMatchTabHTML() {
        return `
            <div class="tab-content active" id="match">
                <h2 class="section-title">🎮 Déroulement du Match</h2>

                <div class="explanation-box">
                    <h4>🏈 Comment ça marche</h4>
                    <p><strong>1.</strong> Un match = 2 mi-temps de 6 tours chacune</p>
                    <p><strong>2.</strong> À chaque coup d'envoi, lancez l'événement</p>
                    <p><strong>3.</strong> Notez les actions des joueurs au fur et à mesure</p>
                    <p><strong>4.</strong> Cliquez sur "TD" quand une équipe marque</p>
                </div>

                ${this.getDiceInfoBox()}
                ${this.getScoreDisplay()}
                ${this.getKickoffSection()}
                ${this.getPlayersActionsSection()}
                ${this.getMVPReminderSection()}

                <div class="form-actions">
                    <button class="btn btn-primary" onclick="app.switchTab('prematch')">⬅️ Retour Avant-Match</button>
                    <button class="btn btn-primary" onclick="app.switchTab('postmatch')">➡️ Terminer le Match</button>
                </div>
            </div>
        `;
    }

    getPostmatchTabHTML() {
        return `
            <div class="tab-content active" id="postmatch">
                <h2 class="section-title">📊 Séquence d'Après-Match</h2>

                <div class="explanation-box">
                    <h4>💰 Ce qui se passe après le match</h4>
                    <p><strong>1.</strong> Calcul automatique des gains selon les touchdowns et la popularité</p>
                    <p><strong>2.</strong> Test de fans : le gagnant peut en gagner, le perdant peut en perdre</p>
                    <p><strong>3.</strong> Calcul de l'expérience des joueurs selon leurs actions</p>
                    <p><strong>4.</strong> Tests de transfert pour les joueurs expérimentés</p>
                    <p><strong>5.</strong> Gestion des erreurs coûteuses si trop de trésorerie</p>
                </div>

                ${this.getDiceInfoBox()}
                ${this.getMatchGainsSection()}
                ${this.getFansUpdateSection()}
                ${this.getExperienceSection()}
                ${this.getPlayerSalesSection()}
                ${this.getPlayerPurchasesSection()}
                ${this.getCostlyErrorsSection()}

                <div class="form-actions">
                    <button class="btn btn-primary" onclick="app.switchTab('match')">⬅️ Retour au Match</button>
                    <button class="btn btn-primary" onclick="app.switchTab('summary')">➡️ Voir le Résumé</button>
                </div>
            </div>
        `;
    }

    getSummaryTabHTML() {
        return `
            <div class="tab-content active" id="summary">
                <h2 class="section-title">📋 Résumé Complet du Match</h2>

                ${this.getGeneralInfoSection()}
                ${this.getInitialSetupSection()}
                ${this.getPrematchSummarySection()}
                ${this.getMatchFlowSection()}
                ${this.getPlayerPerformanceSection()}
                ${this.getPostmatchEventsSection()}
                ${this.getComprehensiveFinancialSection()}
                ${this.getExportOptionsSection()}

                <div class="form-actions">
                    <button class="btn btn-primary" onclick="app.switchTab('postmatch')">⬅️ Retour Après-Match</button>
                    <button class="btn btn-success" onclick="app.printSummary()">🖨️ Imprimer</button>
                    <button class="btn btn-primary" onclick="app.resetMatch()">🔄 Nouveau Match</button>
                </div>
            </div>
        `;
    }

    // 1. Section Informations Générales
    getGeneralInfoSection() {
        const matchDate = this.matchData.matchDate || new Date().toLocaleDateString('fr-FR');
        const duration = this.getMatchDuration();

        return `
            <div class="summary-section">
                <h3>📅 Informations Générales</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Date du match</span>
                        <span class="info-value">${matchDate}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Durée</span>
                        <span class="info-value">${duration}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Météo</span>
                        <span class="info-value">${this.getWeatherSummary()}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // 2. Section Configuration Initiale
    getInitialSetupSection() {
        const team1 = this.matchData.team1;
        const team2 = this.matchData.team2;

        return `
            <div class="summary-section">
                <h3>⚙️ Configuration Initiale</h3>
                <div class="teams-comparison-grid">
                    <div class="team-setup-card">
                        <div class="team-header home">
                            <span class="team-icon">🏠</span>
                            <h4>${team1.name || 'Équipe 1'}</h4>
                        </div>
                        <div class="team-info">
                            <div class="info-row">
                                <span>Coach</span>
                                <span>${team1.coach || 'Non défini'}</span>
                            </div>
                            <div class="info-row">
                                <span>Roster</span>
                                <span>${team1.roster || 'Non défini'}</span>
                            </div>
                            <div class="info-row">
                                <span>VEA</span>
                                <span>${Utils.formatNumber(team1.vea || 0)} PO</span>
                            </div>
                            <div class="info-row">
                                <span>Trésorerie initiale</span>
                                <span>${Utils.formatNumber(team1.treasury || 0)} PO</span>
                            </div>
                            <div class="info-row">
                                <span>Fans dévoués (début)</span>
                                <span>${team1.fans || 1}</span>  <!-- ✅ FANS INITIAUX -->
                            </div>
                        </div>
                    </div>

                    <div class="team-setup-card">
                        <div class="team-header visitor">
                            <span class="team-icon">🚌</span>
                            <h4>${team2.name || 'Équipe 2'}</h4>
                        </div>
                        <div class="team-info">
                            <div class="info-row">
                                <span>Coach</span>
                                <span>${team2.coach || 'Non défini'}</span>
                            </div>
                            <div class="info-row">
                                <span>Roster</span>
                                <span>${team2.roster || 'Non défini'}</span>
                            </div>
                            <div class="info-row">
                                <span>VEA</span>
                                <span>${Utils.formatNumber(team2.vea || 0)} PO</span>
                            </div>
                            <div class="info-row">
                                <span>Trésorerie initiale</span>
                                <span>${Utils.formatNumber(team2.treasury || 0)} PO</span>
                            </div>
                            <div class="info-row">
                                <span>Fans dévoués (début)</span>
                                <span>${team2.fans || 1}</span>  <!-- ✅ FANS INITIAUX -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 3. Section Avant-Match
    getPrematchSummarySection() {
        const team1 = this.matchData.team1;
        const team2 = this.matchData.team2;

        return `
            <div class="summary-section">
                <h3>⚡ Séquence d'Avant-Match</h3>

                <div class="prematch-grid">
                    <!-- Popularité -->
                    <div class="prematch-item">
                        <h5>👥 Facteur de Popularité</h5>
                        <div class="prematch-result">
                            <div class="team-pop">
                                <span>${team1.name}</span>
                                <span class="pop-value">${team1.popularity || 0}</span>
                            </div>
                            <div class="team-pop">
                                <span>${team2.name}</span>
                                <span class="pop-value">${team2.popularity || 0}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Coups de pouce -->
                    ${this.getInducementsSummary()}

                    <!-- Prières -->
                    ${this.getPrayersSummary()}

                    <!-- Pile ou Face -->
                    <div class="prematch-item">
                        <h5>🪙 Pile ou Face</h5>
                        <div class="prematch-result">
                            ${this.getCoinFlipSummary()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 4. Section Déroulement du Match
    getMatchFlowSection() {
        const team1 = this.matchData.team1;
        const team2 = this.matchData.team2;
        const winner = team1.score > team2.score ? team1.name :
                       team2.score > team1.score ? team2.name : null;

        return `
            <div class="summary-section">
                <h3>🏈 Déroulement du Match</h3>

                <!-- Score Final -->
                <div class="final-score-box">
                    <div class="team-final-score ${team1.score > team2.score ? 'winner' : ''}">
                        <span class="team-name">${team1.name}</span>
                        <span class="score-big">${team1.score || 0}</span>
                    </div>
                    <div class="vs-divider">-</div>
                    <div class="team-final-score ${team2.score > team1.score ? 'winner' : ''}">
                        <span class="score-big">${team2.score || 0}</span>
                        <span class="team-name">${team2.name}</span>
                    </div>
                </div>
                ${winner ?
                    `<p class="winner-text">🏆 Victoire de <strong>${winner}</strong> !</p>` :
                    `<p class="winner-text">🤝 Match nul !</p>`
                }

                <!-- Événements de coup d'envoi -->
                ${this.getKickoffEventsSummary()}

                <!-- Statistiques du match -->
                ${this.getMatchStatsSummary()}
            </div>
        `;
    }

    // 5. Section Performance des Joueurs
    getPlayerPerformanceSection() {
        const team1Players = this.getPlayersWithActions(1);
        const team2Players = this.getPlayersWithActions(2);

        return `
            <div class="summary-section">
                <h3>⭐ Performance des Joueurs</h3>

                <div class="players-performance-grid">
                    ${this.getTeamPlayersSummary(1, team1Players)}
                    ${this.getTeamPlayersSummary(2, team2Players)}
                </div>

                ${this.getMVPsSummary()}
            </div>
        `;
    }

    // 6. Section Événements d'Après-Match
    getPostmatchEventsSection() {
        const team1 = this.matchData.team1;
        const team2 = this.matchData.team2;

        // CORRECTION : Utiliser les bonnes propriétés
        const team1InitialFans = team1.fans || 1;  // Fans initiaux (configuration)
        const team2InitialFans = team2.fans || 1;  // Fans initiaux (configuration)
        const team1FinalFans = team1.finalFans !== undefined ? team1.finalFans : team1InitialFans;
        const team2FinalFans = team2.finalFans !== undefined ? team2.finalFans : team2InitialFans;

        return `
            <div class="summary-section">
                <h3>📊 Événements d'Après-Match</h3>

                <div class="postmatch-grid">
                    <!-- Évolution des fans -->
                    <div class="postmatch-item">
                        <h5>👥 Évolution des Fans Dévoués</h5>
                        <div class="fans-evolution">
                            <div class="team-fans">
                                <span>${team1.name}</span>
                                <span>${team1InitialFans} → ${team1FinalFans}</span>
                                ${this.getFansChangeIndicator(team1InitialFans, team1FinalFans)}
                            </div>
                            <div class="team-fans">
                                <span>${team2.name}</span>
                                <span>${team2InitialFans} → ${team2FinalFans}</span>
                                ${this.getFansChangeIndicator(team2InitialFans, team2FinalFans)}
                            </div>
                        </div>
                        ${this.getFansUpdateDetails()}
                    </div>

                    <!-- Transferts de joueurs -->
                    ${this.getTransfersSummary()}

                    <!-- Erreurs coûteuses -->
                    ${this.getCostlyErrorsSummary()}
                </div>
            </div>
        `;
    }

    // 7. Section Bilan Financier Complet
    getComprehensiveFinancialSection() {
        const team1Treasury = this.calculateFinalTreasury(1);
        const team2Treasury = this.calculateFinalTreasury(2);

        // Calculer les totaux
        const totalGains = team1Treasury.gains + team2Treasury.gains;
        const totalSales = team1Treasury.playerSales + team2Treasury.playerSales;
        const totalPurchases = team1Treasury.newPlayerPurchases + team2Treasury.newPlayerPurchases;
        const totalTransactions = totalSales + totalPurchases;

        return `
            <div class="summary-section financial-section">
                <h3>💰 Bilan Financier Détaillé</h3>

                <div class="financial-comparison">
                    ${this.getTeamFinancialBreakdown(1, team1Treasury)}
                    ${this.getTeamFinancialBreakdown(2, team2Treasury)}
                </div>

                <div class="financial-summary-bar">
                    <div class="summary-item">
                        <span class="summary-label">Total des gains</span>
                        <span class="summary-value positive">+${Utils.formatNumber(totalGains)} PO</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Total des transactions</span>
                        <span class="summary-value">${Utils.formatNumber(totalTransactions)} PO</span>
                    </div>
                </div>
            </div>
        `;
    }

    // 8. Section Options d'Export
    getExportOptionsSection() {
        return `
            <div class="summary-section export-section">
                <h3>📤 Options d'Export et Sauvegarde</h3>

                <div class="export-grid">
                    <button class="export-btn" onclick="app.printSummary()">
                        <span class="export-icon">🖨️</span>
                        <span>Version Imprimable</span>
                        <small>Format optimisé pour l'impression</small>
                    </button>

                    <button class="export-btn" onclick="app.exportAsJSON()">
                        <span class="export-icon">💾</span>
                        <span>Exporter JSON</span>
                        <small>Données complètes du match</small>
                    </button>

                    <button class="export-btn" onclick="app.exportAsPDF()">
                        <span class="export-icon">📄</span>
                        <span>Générer PDF</span>
                        <small>Document officiel du match</small>
                    </button>

                    <button class="export-btn" onclick="app.shareMatch()">
                        <span class="export-icon">📱</span>
                        <span>Partager</span>
                        <small>Envoyer le résumé</small>
                    </button>
                </div>
            </div>
        `;
    }

    // ===== MÉTHODES AUXILIAIRES =====

    getWeatherSummary() {
        if (this.matchData.weather && this.matchData.weather.effect) {
            const weather = this.matchData.weather;
            const weatherTable = AppConfig.gameData.weatherTables[weather.type];
            return `${weatherTable.icon} ${weather.effect.split(':')[0]}`;
        }
        return 'Non définie';
    }

    getInducementsSummary() {
        const inducements = this.matchData.inducements || {};

        // Collecter les coups de pouce achetés pour chaque équipe
        const team1Inducements = [];
        const team2Inducements = [];

        // Parcourir les items de l'équipe 1
        if (inducements.team1Items) {
            Object.keys(inducements.team1Items).forEach(itemName => {
                const quantity = inducements.team1Items[itemName];
                if (quantity > 0) {
                    // Trouver le coût de cet item dans la config
                    const itemConfig = AppConfig.gameData.inducements.find(i => i.name === itemName);
                    if (itemConfig) {
                        team1Inducements.push({
                            name: itemName,
                            quantity: quantity,
                            cost: itemConfig.cost * quantity
                        });
                    }
                }
            });
        }

        // Parcourir les items de l'équipe 2
        if (inducements.team2Items) {
            Object.keys(inducements.team2Items).forEach(itemName => {
                const quantity = inducements.team2Items[itemName];
                if (quantity > 0) {
                    const itemConfig = AppConfig.gameData.inducements.find(i => i.name === itemName);
                    if (itemConfig) {
                        team2Inducements.push({
                            name: itemName,
                            quantity: quantity,
                            cost: itemConfig.cost * quantity
                        });
                    }
                }
            });
        }

        const hasInducements = team1Inducements.length > 0 || team2Inducements.length > 0;

        if (!hasInducements) {
            return `
                <div class="prematch-item">
                    <h5>💰 Coups de Pouce</h5>
                    <div class="prematch-result">
                        <p class="no-data">Aucun coup de pouce utilisé</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="prematch-item">
                <h5>💰 Coups de Pouce</h5>
                <div class="inducements-summary">
                    ${team1Inducements.length > 0 ? `
                        <div class="team-inducements">
                            <strong>${this.matchData.team1.name}</strong>
                            <ul>
                                ${team1Inducements.map(item =>
                                    `<li>${item.quantity}x ${item.name} (${Utils.formatNumber(item.cost)} PO)</li>`
                                ).join('')}
                            </ul>
                            <div class="inducements-total">
                                Total: ${Utils.formatNumber(team1Inducements.reduce((sum, i) => sum + i.cost, 0))} PO
                            </div>
                        </div>
                    ` : ''}
                    ${team2Inducements.length > 0 ? `
                        <div class="team-inducements">
                            <strong>${this.matchData.team2.name}</strong>
                            <ul>
                                ${team2Inducements.map(item =>
                                    `<li>${item.quantity}x ${item.name} (${Utils.formatNumber(item.cost)} PO)</li>`
                                ).join('')}
                            </ul>
                            <div class="inducements-total">
                                Total: ${Utils.formatNumber(team2Inducements.reduce((sum, i) => sum + i.cost, 0))} PO
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getPrayersSummary() {
        const prayer = this.matchData.prayer || {};

        // Vérifier si une prière a été effectuée
        if (!prayer.dice || !prayer.effect) {
            return `
                <div class="prematch-item">
                    <h5>🙏 Prières à Nuffle</h5>
                    <div class="prematch-result">
                        <p class="no-data">Aucune prière effectuée</p>
                    </div>
                </div>
            `;
        }

        // Déterminer qui a prié (l'équipe avec la VEA la plus faible après coups de pouce)
        const team1AdjustedVEA = this.calculateAdjustedVEA(1);
        const team2AdjustedVEA = this.calculateAdjustedVEA(2);
        const prayingTeam = team1AdjustedVEA < team2AdjustedVEA ?
            this.matchData.team1.name :
            this.matchData.team2.name;

        return `
            <div class="prematch-item">
                <h5>🙏 Prières à Nuffle</h5>
                <div class="prayers-summary">
                    <div class="prayer-result">
                        <strong>${prayingTeam}</strong>
                        <span>Résultat du D8 : ${prayer.dice}</span>
                        <p class="prayer-effect">${prayer.effect}</p>
                    </div>
                </div>
            </div>
        `;
    }

    getCoinFlipSummary() {
        const coinFlip = this.matchData.coinFlip;

        if (!coinFlip || coinFlip === '') {
            return '<p class="no-data">Pile ou face non effectué</p>';
        }

        // Essayer de récupérer qui a gagné et son choix si ces infos sont stockées
        // Sinon juste afficher le résultat
        return `
            <div class="coin-flip-result">
                <p><strong>Résultat :</strong> ${coinFlip}</p>
                <p class="coin-flip-note">Le gagnant choisit d'engager ou de recevoir</p>
            </div>
        `;
    }

    getKickoffEventsSummary() {
        const events = this.matchData.kickoffEvents || [];

        if (events.length === 0) {
            return `
                <div class="kickoff-events">
                    <h5>🎲 Événements de Coup d'Envoi</h5>
                    <p class="no-data">Aucun événement enregistré</p>
                </div>
            `;
        }

        return `
            <div class="kickoff-events">
                <h5>🎲 Événements de Coup d'Envoi (${events.length})</h5>
                <ul class="events-list">
                    ${events.map((event, index) => {
                        // Support pour l'ancien format (string) et le nouveau format (objet)
                        const roll = event.roll || '';
                        const text = event.text || event;

                        return `<li><strong>${roll ? `[${roll}]` : `#${index + 1}`}</strong> ${text}</li>`;
                    }).join('')}
                </ul>
            </div>
        `;
    }

    getMatchStatsSummary() {
        const stats = this.calculateMatchStats();

        return `
            <div class="match-stats-grid">
                <div class="stat-card">
                    <span class="stat-icon">🏈</span>
                    <span class="stat-value">${stats.totalTouchdowns}</span>
                    <span class="stat-label">Touchdowns</span>
                </div>
                <div class="stat-card">
                    <span class="stat-icon">💀</span>
                    <span class="stat-value">${stats.totalEliminations}</span>
                    <span class="stat-label">Éliminations</span>
                </div>
                <div class="stat-card">
                    <span class="stat-icon">🎯</span>
                    <span class="stat-value">${stats.totalPasses}</span>
                    <span class="stat-label">Passes/Lancers</span>
                </div>
                <div class="stat-card">
                    <span class="stat-icon">🛡️</span>
                    <span class="stat-value">${stats.totalInterceptions}</span>
                    <span class="stat-label">Interceptions</span>
                </div>
            </div>
        `;
    }

    getPlayersWithActions(team) {
        const players = this.matchData[`team${team}`].players || [];
        return players.filter(p => {
            return p.name && p.actions && (
                p.actions.reu > 0 || p.actions.det > 0 ||
                p.actions.int > 0 || p.actions.elim > 0 ||
                p.actions.td > 0 || p.actions.jdm
            );
        });
    }

    getTeamPlayersSummary(team, players) {
        const teamName = this.matchData[`team${team}`].name || `Équipe ${team}`;

        if (players.length === 0) {
            return `
                <div class="team-players-summary">
                    <h5>${teamName}</h5>
                    <p class="no-data">Aucune action enregistrée</p>
                </div>
            `;
        }

        // Trier par XP décroissant
        players.sort((a, b) => (b.xp || 0) - (a.xp || 0));

        return `
            <div class="team-players-summary">
                <h5>${teamName}</h5>
                <table class="players-summary-table">
                    <thead>
                        <tr>
                            <th>Joueur</th>
                            <th>Actions</th>
                            <th>XP</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${players.map(player => `
                            <tr ${player.actions.jdm ? 'class="is-mvp"' : ''}>
                                <td>
                                    ${player.name}
                                    ${player.actions.jdm ? '<span class="mvp-badge">JDM</span>' : ''}
                                </td>
                                <td class="actions-cell">
                                    ${this.getPlayerActionsSummary(player.actions)}
                                </td>
                                <td class="xp-cell">${player.xp || 0}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    getPlayerActionsSummary(actions) {
        const summary = [];
        if (actions.td > 0) summary.push(`${actions.td} TD`);
        if (actions.elim > 0) summary.push(`${actions.elim} ELIM`);
        if (actions.int > 0) summary.push(`${actions.int} INT`);
        if (actions.reu > 0) summary.push(`${actions.reu} REU`);
        if (actions.det > 0) summary.push(`${actions.det} DET`);
        return summary.join(', ') || '-';
    }

    getMVPsSummary() {
        const mvps = [];

        [1, 2].forEach(team => {
            const players = this.matchData[`team${team}`].players || [];
            const mvp = players.find(p => p.actions && p.actions.jdm);
            if (mvp) {
                mvps.push({
                    name: mvp.name,
                    team: this.matchData[`team${team}`].name,
                    xp: mvp.xp || 0
                });
            }
        });

        if (mvps.length === 0) {
            return '';
        }

        return `
            <div class="mvps-summary">
                <h5>🌟 Joueurs du Match</h5>
                <div class="mvps-grid">
                    ${mvps.map(mvp => `
                        <div class="mvp-card">
                            <div class="mvp-icon">🏆</div>
                            <div class="mvp-info">
                                <strong>${mvp.name}</strong>
                                <span>${mvp.team}</span>
                                <span class="mvp-xp">${mvp.xp} XP au total</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    getFansChangeIndicator(initialFans, finalFans) {
        const change = finalFans - initialFans;

        if (change > 0) {
            return `<span class="change positive">+${change}</span>`;
        } else if (change < 0) {
            return `<span class="change negative">${change}</span>`;
        }
        return `<span class="change neutral">=</span>`;
    }

    getFansUpdateDetails() {
        const team1Result = this.matchData.team1.fansUpdateResult;
        const team2Result = this.matchData.team2.fansUpdateResult;

        if (!team1Result && !team2Result) {
            return '';
        }

        return `
            <div class="fans-update-details">
                ${team1Result ? `
                    <div class="fans-detail">
                        <small>${this.matchData.team1.name}: ${team1Result}</small>
                    </div>
                ` : ''}
                ${team2Result ? `
                    <div class="fans-detail">
                        <small>${this.matchData.team2.name}: ${team2Result}</small>
                    </div>
                ` : ''}
            </div>
        `;
    }

    getTransfersSummary() {
        const team1Sold = this.matchData.team1.soldPlayers || [];
        const team2Sold = this.matchData.team2.soldPlayers || [];
        const hasTransfers = team1Sold.length > 0 || team2Sold.length > 0;

        if (!hasTransfers) {
            return `
                <div class="postmatch-item">
                    <h5>💼 Transferts de Joueurs</h5>
                    <div class="transfers-summary">
                        <p class="no-data">Aucun transfert effectué</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="postmatch-item">
                <h5>💼 Transferts de Joueurs</h5>
                <div class="transfers-summary">
                    ${team1Sold.length > 0 ? `
                        <div class="team-transfers">
                            <strong>${this.matchData.team1.name}</strong>
                            <ul>
                                ${team1Sold.map(sale =>
                                    `<li>${sale.name} vendu pour ${Utils.formatNumber(sale.value)} PO</li>`
                                ).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${team2Sold.length > 0 ? `
                        <div class="team-transfers">
                            <strong>${this.matchData.team2.name}</strong>
                            <ul>
                                ${team2Sold.map(sale =>
                                    `<li>${sale.name} vendu pour ${Utils.formatNumber(sale.value)} PO</li>`
                                ).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getCostlyErrorsSummary() {
        const team1Error = this.matchData.team1.costlyError || {};
        const team2Error = this.matchData.team2.costlyError || {};
        const hasErrors = team1Error.type || team2Error.type;

        if (!hasErrors) {
            return `
                <div class="postmatch-item">
                    <h5>⚠️ Erreurs Coûteuses</h5>
                    <div class="errors-summary">
                        <p class="no-data">Aucune erreur coûteuse</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="postmatch-item">
                <h5>⚠️ Erreurs Coûteuses</h5>
                <div class="errors-summary">
                    ${team1Error.type ? `
                        <div class="team-error ${team1Error.type}">
                            <strong>${this.matchData.team1.name}</strong>
                            <span>${this.getErrorDescription(team1Error)}</span>
                        </div>
                    ` : ''}
                    ${team2Error.type ? `
                        <div class="team-error ${team2Error.type}">
                            <strong>${this.matchData.team2.name}</strong>
                            <span>${this.getErrorDescription(team2Error)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getErrorDescription(error) {
        if (!error || !error.type || error.type === 'none') {
            return 'Aucune erreur';
        }

        let description = '';

        // Ajouter le jet de D6 si disponible
        if (error.roll) {
            description += `(D6=${error.roll}) `;
        }

        switch(error.type) {
            case 'minor':
                if (error.d3Roll) {
                    description += `Incident mineur (D3=${error.d3Roll}, -${Utils.formatNumber(error.amount || 0)} PO)`;
                } else {
                    description += `Incident mineur (-${Utils.formatNumber(error.amount || 0)} PO)`;
                }
                break;
            case 'major':
                description += 'Incident majeur (trésorerie divisée par 2)';
                break;
            case 'catastrophe':
                if (error.d6Rolls) {
                    const total = error.d6Rolls[0] + error.d6Rolls[1];
                    description += `Catastrophe (2D6=${total}, conserve ${Utils.formatNumber(error.kept || 0)} PO)`;
                } else {
                    description += 'Catastrophe (conservation de 2D6 kPO seulement)';
                }
                break;
            default:
                description += 'Erreur inconnue';
        }

        return description;
    }

    getTeamFinancialBreakdown(team, treasury) {
        const teamName = this.matchData[`team${team}`].name || `Équipe ${team}`;
        const purchasedPlayers = this.matchData[`team${team}`].purchasedPlayers || [];

        return `
            <div class="financial-breakdown">
                <h5>${teamName}</h5>

                <div class="financial-lines">
                    <div class="financial-line">
                        <span>Trésorerie initiale</span>
                        <span class="amount">${Utils.formatNumber(treasury.baseTreasury)} PO</span>
                    </div>

                    <div class="financial-line positive">
                        <span>+ Gains du match</span>
                        <span class="amount">+${Utils.formatNumber(treasury.gains)} PO</span>
                    </div>

                    ${treasury.playerSales > 0 ? `
                        <div class="financial-line positive">
                            <span>+ Ventes de joueurs</span>
                            <span class="amount">+${Utils.formatNumber(treasury.playerSales)} PO</span>
                        </div>
                    ` : ''}

                    ${treasury.treasurySpentOnInducements > 0 ? `
                        <div class="financial-line negative">
                            <span>- Coups de pouce</span>
                            <span class="amount">-${Utils.formatNumber(treasury.treasurySpentOnInducements)} PO</span>
                        </div>
                    ` : ''}

                    ${treasury.newPlayerPurchases > 0 ? `
                        <div class="financial-line negative">
                            <span>- Achats de joueurs (${purchasedPlayers.length})</span>
                            <span class="amount">-${Utils.formatNumber(treasury.newPlayerPurchases)} PO</span>
                        </div>
                        ${purchasedPlayers.length > 0 ? `
                            <div class="purchased-players-detail">
                                ${purchasedPlayers.map(p => `
                                    <div class="purchased-player-line">
                                        <span>• ${p.name || 'Sans nom'} (${p.position || 'Sans poste'})</span>
                                        <span>${Utils.formatNumber(p.cost)} PO</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    ` : ''}

                    ${treasury.costlyErrorLoss > 0 ? `
                        <div class="financial-line negative error">
                            <span>- Erreur coûteuse ${this.getErrorTypeLabel(team)}</span>
                            <span class="amount">-${Utils.formatNumber(treasury.costlyErrorLoss)} PO</span>
                        </div>
                    ` : ''}

                    <div class="financial-line total">
                        <span>Trésorerie finale</span>
                        <span class="amount ${treasury.finalTreasury < 0 ? 'negative' : ''}">
                            ${Utils.formatNumber(treasury.finalTreasury)} PO
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    getErrorTypeLabel(team) {
        const error = this.matchData[`team${team}`].costlyError || {};
        switch(error.type) {
            case 'minor':
                return '(Incident mineur)';
            case 'major':
                return '(Incident majeur)';
            case 'catastrophe':
                return '(Catastrophe)';
            default:
                return '';
        }
    }

    getCostlyErrorImpact(team) {
        const error = this.matchData[`team${team}`].costlyError || {};

        if (!error.type || error.type === 'none') {
            return '';
        }

        return `
            <div class="financial-line negative error">
                <span>- Erreur coûteuse</span>
                <span class="amount">${this.getErrorDescription(error)}</span>
            </div>
        `;
    }

    calculateMatchStats() {
        let stats = {
            totalTouchdowns: 0,
            totalEliminations: 0,
            totalPasses: 0,
            totalInterceptions: 0
        };

        [1, 2].forEach(team => {
            const players = this.matchData[`team${team}`].players || [];
            players.forEach(player => {
                if (player.actions) {
                    stats.totalTouchdowns += player.actions.td || 0;
                    stats.totalEliminations += player.actions.elim || 0;
                    stats.totalPasses += player.actions.reu || 0;
                    stats.totalInterceptions += player.actions.int || 0;
                }
            });
        });

        return stats;
    }

    getMatchDuration() {
        if (this.matchData.matchStart && this.matchData.matchEnd) {
            const start = new Date(this.matchData.matchStart);
            const end = new Date(this.matchData.matchEnd);
            const diff = end - start;

            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);

            if (hours > 0) {
                return `${hours}h ${minutes}min`;
            }
            return `${minutes} minutes`;
        }
        return 'Non enregistrée';
    }

    // Méthode pour exporter en JSON
    exportAsJSON() {
        const dataStr = JSON.stringify(this.matchData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `match_${Date.now()}.json`;
        link.click();
    }

    // Méthode pour exporter en PDF (basique)
    exportAsPDF() {
        alert('Utilisez Ctrl+P (ou Cmd+P sur Mac) et sélectionnez "Enregistrer en PDF"');
    }

    // Méthode pour partager
    shareMatch() {
        if (navigator.share) {
            const summary = `Match: ${this.matchData.team1.name} vs ${this.matchData.team2.name}\n` +
                           `Score: ${this.matchData.team1.score} - ${this.matchData.team2.score}`;
            navigator.share({
                title: 'Résumé du match',
                text: summary
            });
        } else {
            alert('Le partage n\'est pas disponible sur ce navigateur');
        }
    }

    getMatchStatsSection() {
        const team1Players = this.matchData.team1.players || [];
        const team2Players = this.matchData.team2.players || [];

        // Calculer les statistiques totales
        let stats = {
            team1: { td: 0, elim: 0, int: 0, reu: 0, det: 0 },
            team2: { td: 0, elim: 0, int: 0, reu: 0, det: 0 }
        };

        team1Players.forEach(p => {
            if (p.actions) {
                stats.team1.td += p.actions.td || 0;
                stats.team1.elim += p.actions.elim || 0;
                stats.team1.int += p.actions.int || 0;
                stats.team1.reu += p.actions.reu || 0;
                stats.team1.det += p.actions.det || 0;
            }
        });

        team2Players.forEach(p => {
            if (p.actions) {
                stats.team2.td += p.actions.td || 0;
                stats.team2.elim += p.actions.elim || 0;
                stats.team2.int += p.actions.int || 0;
                stats.team2.reu += p.actions.reu || 0;
                stats.team2.det += p.actions.det || 0;
            }
        });

        // Trouver les meilleurs joueurs
        const topScorers = this.getTopScorers();
        const topEliminator = this.getTopEliminator();

        return `
            <div class="match-stats-section">
                <h3>📊 Statistiques du Match</h3>

                <div class="stats-comparison">
                    <div class="stat-row">
                        <span class="stat-label">${this.matchData.team1.name || 'Équipe 1'}</span>
                        <span class="stat-name">Touchdowns</span>
                        <span class="stat-value">${stats.team1.td} - ${stats.team2.td}</span>
                        <span class="stat-label">${this.matchData.team2.name || 'Équipe 2'}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">${stats.team1.elim}</span>
                        <span class="stat-name">Éliminations</span>
                        <span class="stat-value">vs</span>
                        <span class="stat-label">${stats.team2.elim}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">${stats.team1.int}</span>
                        <span class="stat-name">Interceptions</span>
                        <span class="stat-value">vs</span>
                        <span class="stat-label">${stats.team2.int}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">${stats.team1.reu}</span>
                        <span class="stat-name">Passes réussies</span>
                        <span class="stat-value">vs</span>
                        <span class="stat-label">${stats.team2.reu}</span>
                    </div>
                </div>

                <div class="top-performers">
                    <h4>🏆 Meilleurs Joueurs</h4>
                    ${topScorers.length > 0 ? `
                        <div class="performer-item">
                            <strong>Meilleur(s) marqueur(s) :</strong>
                            ${topScorers.map(p => `${p.name} (${p.td} TD)`).join(', ')}
                        </div>
                    ` : ''}
                    ${topEliminator ? `
                        <div class="performer-item">
                            <strong>Plus violent :</strong>
                            ${topEliminator.name} (${topEliminator.elim} éliminations)
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

// === AMÉLIORATION DE L'AFFICHAGE DANS L'ONGLET APRÈS-MATCH ===

    getExperienceSection() {
        const team1Players = this.matchData.team1.players || [];
        const team2Players = this.matchData.team2.players || [];

        // Calculer les totaux XP
        let team1TotalXP = 0;
        let team2TotalXP = 0;

        team1Players.forEach(p => {
            team1TotalXP += this.calculatePlayerXP(1, p.id);
        });

        team2Players.forEach(p => {
            team2TotalXP += this.calculatePlayerXP(2, p.id);
        });

        return `
            <div class="step-section">
                <div class="step-header">
                    <div class="step-number">3</div>
                    <div class="step-title">Expérience des Joueurs</div>
                </div>
                <div class="explanation-box">
                    <p><strong>Calcul automatique de l'XP basé sur les actions du match</strong></p>
                    <p>REU/DET = 1 XP | INT/ELIM = 2 XP | TD = 3 XP | JDM = 4 XP</p>
                </div>

                <!-- Équipe 1 -->
                <div class="team-experience-section">
                    <h4>🏠 ${this.matchData.team1.name || 'Équipe 1'}</h4>
                    ${this.getTeamExperienceTable(1, team1Players)}
                    <div class="team-xp-total">
                        Total XP équipe : ${team1TotalXP} XP
                    </div>
                </div>

                <!-- Équipe 2 -->
                <div class="team-experience-section" style="margin-top: 20px;">
                    <h4>🚌 ${this.matchData.team2.name || 'Équipe 2'}</h4>
                    ${this.getTeamExperienceTable(2, team2Players)}
                    <div class="team-xp-total">
                        Total XP équipe : ${team2TotalXP} XP
                    </div>
                </div>
            </div>
        `;
    }

    getTeamExperienceTable(team, players) {
        if (players.length === 0) {
            return '<p style="text-align: center; color: #666;">Aucun joueur dans cette équipe</p>';
        }

        // Filtrer uniquement les joueurs qui ont fait des actions
        const activePlayers = players.filter(p => {
            const actions = p.actions || {};
            return actions.reu > 0 || actions.det > 0 || actions.int > 0 ||
                   actions.elim > 0 || actions.td > 0 || actions.jdm;
        });

        if (activePlayers.length === 0) {
            return '<p style="text-align: center; color: #666;">Aucun joueur n\'a réalisé d\'action durant ce match</p>';
        }

        let html = `
            <table class="experience-summary-table">
                <thead>
                    <tr>
                        <th class="player-name">Joueur</th>
                        <th>REU</th>
                        <th>DET</th>
                        <th>INT</th>
                        <th>ELIM</th>
                        <th>TD</th>
                        <th>JDM</th>
                        <th class="xp-total">Total XP</th>
                    </tr>
                </thead>
                <tbody>
        `;

        activePlayers.forEach(player => {
            const actions = player.actions || {};
            const xp = this.calculatePlayerXP(team, player.id);

            html += `
                <tr>
                    <td class="player-name">${player.name || 'Joueur sans nom'}</td>
                    <td>${actions.reu > 0 ? actions.reu : '-'}</td>
                    <td>${actions.det > 0 ? actions.det : '-'}</td>
                    <td>${actions.int > 0 ? actions.int : '-'}</td>
                    <td>${actions.elim > 0 ? actions.elim : '-'}</td>
                    <td>${actions.td > 0 ? `<strong>${actions.td}</strong>` : '-'}</td>
                    <td>${actions.jdm ? '⭐' : '-'}</td>
                    <td class="xp-total">${xp} XP</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        return html;
    }

// === AMÉLIORATION DU RÉSUMÉ DES STATISTIQUES ===

    getTopScorers() {
        const allPlayers = [
            ...this.matchData.team1.players.map(p => ({...p, team: 1})),
            ...this.matchData.team2.players.map(p => ({...p, team: 2}))
        ];

        let maxTD = 0;
        allPlayers.forEach(p => {
            if (p.actions && p.actions.td > maxTD) {
                maxTD = p.actions.td;
            }
        });

        if (maxTD === 0) return [];

        return allPlayers.filter(p => p.actions && p.actions.td === maxTD)
                        .map(p => ({
                            name: p.name || 'Joueur sans nom',
                            td: p.actions.td,
                            team: p.team
                        }));
    }

    getTopEliminator() {
        const allPlayers = [
            ...this.matchData.team1.players.map(p => ({...p, team: 1})),
            ...this.matchData.team2.players.map(p => ({...p, team: 2}))
        ];

        let topPlayer = null;
        let maxElim = 0;

        allPlayers.forEach(p => {
            if (p.actions && p.actions.elim > maxElim) {
                maxElim = p.actions.elim;
                topPlayer = {
                    name: p.name || 'Joueur sans nom',
                    elim: p.actions.elim,
                    team: p.team
                };
            }
        });

        return topPlayer;
    }

    getTeamSummaryCard(team) {
        const teamData = this.matchData[`team${team}`];
        const gains = this.calculateGains(team);
        const topScorer = this.getTeamTopScorer(team);
        const totalXP = this.calculateTeamTotalXP(team);

        return `
            <div class="team-summary-card">
                <div class="team-summary-header">
                    <h4>${team === 1 ? '🏠' : '🚌'} ${teamData.name}</h4>
                    <span class="team-roster">${teamData.roster || 'Non défini'}</span>
                </div>

                <div class="team-summary-content">
                    <div class="summary-row">
                        <span>Coach</span>
                        <span>${teamData.coach || 'Non défini'}</span>
                    </div>
                    <div class="summary-row">
                        <span>VEA</span>
                        <span>${Utils.formatNumber(teamData.vea)} PO</span>
                    </div>
                    <div class="summary-row">
                        <span>Popularité</span>
                        <span>${teamData.popularity}</span>
                    </div>
                    <div class="summary-row">
                        <span>Fans dévoués</span>
                        <span>${teamData.fans}</span>
                    </div>
                    <div class="summary-row highlight">
                        <span>Gains du match</span>
                        <span>${Utils.formatNumber(gains)} PO</span>
                    </div>
                    <div class="summary-row">
                        <span>XP totale</span>
                        <span>${totalXP} XP</span>
                    </div>
                    ${topScorer ? `
                        <div class="summary-row">
                            <span>Meilleur marqueur</span>
                            <span>${topScorer.name} (${topScorer.xp} XP)</span>
                        </div>
                    ` : ''}
                    ${teamData.mvpName ? `
                        <div class="summary-row">
                            <span>JDM</span>
                            <span>${teamData.mvpName} (+4 XP)</span>
                        </div>
                    ` : ''}
                    ${teamData.soldPlayers && teamData.soldPlayers.length > 0 ? `
                        <div class="summary-row-expanded">
                            <span>Joueurs vendus (${teamData.soldPlayers.length})</span>
                            <div class="sold-players-list">
                                ${teamData.soldPlayers.map(p => `
                                    <div class="sold-player-summary">
                                        ${p.name || 'Sans nom'} - ${Utils.formatNumber(p.value)} PO
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    ${teamData.purchasedPlayers && teamData.purchasedPlayers.length > 0 ? `
                        <div class="summary-row-expanded">
                            <span>Joueurs achetés (${teamData.purchasedPlayers.length})</span>
                            <div class="purchased-players-list">
                                ${teamData.purchasedPlayers.map(p => `
                                    <div class="purchased-player-summary">
                                        ${p.name || 'Sans nom'} (${p.position || 'Sans poste'}) - ${Utils.formatNumber(p.cost)} PO
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Méthodes auxiliaires pour le résumé
    getMatchDuration() {
        if (!this.matchData.matchStart) {
            return 'Non démarrée';
        }

        // Utiliser le temps écoulé actuel
        const totalSeconds = this.getElapsedTime();
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}min`;
        } else if (minutes > 0) {
            return `${minutes}min ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    }

    calculateTotalMatchXP() {
        return this.calculateTeamTotalXP(1) + this.calculateTeamTotalXP(2);
    }

    calculateTeamTotalXP(team) {
        const players = this.matchData[`team${team}`].players || [];
        return players.reduce((total, player) => total + (player.xp || 0), 0);
    }

    countTotalPlayers() {
        const team1Players = (this.matchData.team1.players || []).filter(p => p.name).length;
        const team2Players = (this.matchData.team2.players || []).filter(p => p.name).length;
        return team1Players + team2Players;
    }

    getTeamTopScorer(team) {
        const players = this.matchData[`team${team}`].players || [];
        return players
            .filter(p => p.name && p.xp > 0)
            .sort((a, b) => b.xp - a.xp)[0] || null;
    }

    calculateSalesTotal(team) {
        const soldPlayers = this.matchData[`team${team}`].soldPlayers || [];
        return soldPlayers.reduce((total, player) => total + (player.value || 0), 0);
    }

    getMVPSummary() {
        if (!this.matchData.mvp || !this.matchData.mvp.playerId) return '';

        const team = this.matchData.mvp.team;
        const player = this.matchData[`team${team}`].players.find(p => p.id === this.matchData.mvp.playerId);

        if (!player) return '';

        return `
            <div class="mvp-summary">
                <div class="mvp-title">🌟 Joueur du Match</div>
                <div class="mvp-details">
                    <span class="mvp-player-name">${player.name}</span>
                    <span class="mvp-team-name">(${this.matchData[`team${team}`].name})</span>
                </div>
            </div>
        `;
    }

    // Nouvelle méthode pour générer le contenu imprimable
    printSummary() {
        // Créer une nouvelle fenêtre pour l'impression
        const printWindow = window.open('', '_blank', 'width=800,height=600');

        // Générer le contenu HTML formaté
        const printContent = this.generatePrintableContent();

        // Écrire le contenu dans la nouvelle fenêtre
        printWindow.document.write(printContent);
        printWindow.document.close();

        // Lancer l'impression après un court délai
        setTimeout(() => {
            printWindow.print();
            // Fermer la fenêtre après l'impression
            printWindow.onafterprint = () => {
                printWindow.close();
            };
        }, 500);
    }

    // Nouvelle méthode pour générer le contenu imprimable
    generatePrintableContent() {
        const team1 = this.matchData.team1;
        const team2 = this.matchData.team2;
        const winner = team1.score > team2.score ? team1.name :
                       team2.score > team1.score ? team2.name : null;

        return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <title>Match ${team1.name} vs ${team2.name}</title>
        <style>
            @page {
                size: A4;
                margin: 20mm;
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: Arial, sans-serif;
                font-size: 12pt;
                line-height: 1.5;
                color: #333;
            }

            .header {
                text-align: center;
                border-bottom: 3px solid #1a5f3f;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }

            .header h1 {
                color: #1a5f3f;
                font-size: 24pt;
                margin-bottom: 10px;
            }

            .header p {
                color: #666;
                font-size: 14pt;
            }

            .section {
                margin-bottom: 30px;
                page-break-inside: avoid;
            }

            .section h2 {
                color: #1a5f3f;
                font-size: 16pt;
                margin-bottom: 15px;
                padding-bottom: 5px;
                border-bottom: 2px solid #1a5f3f;
            }

            .score-display {
                text-align: center;
                margin: 30px 0;
                padding: 20px;
                border: 3px solid #1a5f3f;
                border-radius: 10px;
                background: #f8f9fa;
            }

            .score-display .teams {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 50px;
                font-size: 20pt;
                font-weight: bold;
            }

            .winner {
                color: #28a745;
            }

            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin: 20px 0;
            }

            .info-box {
                border: 1px solid #ddd;
                padding: 15px;
                border-radius: 5px;
                background: #f8f9fa;
            }

            .info-box h3 {
                color: #1a5f3f;
                font-size: 14pt;
                margin-bottom: 10px;
            }

            .info-item {
                display: flex;
                justify-content: space-between;
                padding: 5px 0;
                border-bottom: 1px dotted #ccc;
            }

            .info-item:last-child {
                border-bottom: none;
            }

            .players-table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
                font-size: 11pt;
            }

            .players-table th,
            .players-table td {
                border: 1px solid #333;
                padding: 8px;
                text-align: center;
            }

            .players-table th {
                background: #1a5f3f;
                color: white;
                font-weight: bold;
            }

            .players-table tr:nth-child(even) {
                background: #f8f9fa;
            }

            .mvp-display {
                text-align: center;
                padding: 15px;
                background: #ffd700;
                border: 2px solid #f0c800;
                border-radius: 10px;
                margin: 20px 0;
                font-size: 14pt;
                font-weight: bold;
            }

            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #ccc;
                text-align: center;
                color: #666;
                font-size: 10pt;
            }

            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🏈 Ligue des Rava'Jeux</h1>
            <p>Feuille de Match - Blood Bowl Sevens</p>
            <p>${new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        <!-- Score Final -->
        <div class="section">
            <h2>🏆 Résultat Final</h2>
            <div class="score-display">
                <div class="teams">
                    <div class="${team1.score > team2.score ? 'winner' : ''}">
                        ${team1.name}: ${team1.score}
                    </div>
                    <div>VS</div>
                    <div class="${team2.score > team1.score ? 'winner' : ''}">
                        ${team2.name}: ${team2.score}
                    </div>
                </div>
                ${winner ? `<p style="margin-top: 15px; color: #28a745;">Victoire de ${winner} !</p>` :
                          `<p style="margin-top: 15px;">Match nul !</p>`}
            </div>
        </div>

        <!-- Informations du Match -->
        <div class="section">
            <h2>📊 Informations du Match</h2>
            <div class="info-grid">
                <div class="info-box">
                    <h3>Configuration</h3>
                    <div class="info-item">
                        <span>Durée</span>
                        <span>${this.getMatchDuration()}</span>
                    </div>
                    <div class="info-item">
                        <span>Météo</span>
                        <span>${this.matchData.weather.effect ? (() => {
                            const weatherTable = AppConfig.gameData.weatherTables[this.matchData.weather.type || 'classique'];
                            return `${weatherTable.icon} ${weatherTable.name} : ${this.matchData.weather.effect.split(':')[0]}`;
                        })() : 'Non définie'}</span>
                    </div>
                    ${this.matchData.coinFlip ? `
                    <div class="info-item">
                        <span>Pile ou Face</span>
                        <span>${this.matchData.coinFlip}</span>
                    </div>` : ''}
                </div>

                <div class="info-box">
                    <h3>Statistiques</h3>
                    <div class="info-item">
                        <span>Total Touchdowns</span>
                        <span>${team1.score + team2.score}</span>
                    </div>
                    <div class="info-item">
                        <span>Total XP distribuée</span>
                        <span>${this.calculateTotalMatchXP()}</span>
                    </div>
                    <div class="info-item">
                        <span>Nombre de joueurs</span>
                        <span>${this.countTotalPlayers()}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- MVP / Joueurs du Match -->
        ${(() => {
            const mvps = [];

            // Système 1 : Chercher via mvpName dans chaque équipe
            [1, 2].forEach(teamNum => {
                const teamData = this.matchData[`team${teamNum}`];
                if (teamData.mvpName) {
                    // Trouver le joueur correspondant pour obtenir son XP
                    const player = teamData.players.find(p =>
                        p.name && p.name.toLowerCase() === teamData.mvpName.toLowerCase()
                    );
                    mvps.push({
                        name: teamData.mvpName,
                        team: teamData.name,
                        xp: player ? player.xp : '4' // Si joueur non trouvé, au moins 4 XP du bonus
                    });
                }
            });

            // Système 2 : Si pas de mvpName, chercher via mvp.playerId
            if (mvps.length === 0 && this.matchData.mvp && this.matchData.mvp.playerId) {
                const mvpTeam = this.matchData.mvp.team;
                const mvpPlayer = this.matchData[`team${mvpTeam}`].players.find(p => p.id === this.matchData.mvp.playerId);
                if (mvpPlayer) {
                    mvps.push({
                        name: mvpPlayer.name,
                        team: this.matchData[`team${mvpTeam}`].name,
                        xp: mvpPlayer.xp || 0
                    });
                }
            }

            // Système 3 : Chercher les joueurs avec actions.jdm
            if (mvps.length === 0) {
                [1, 2].forEach(teamNum => {
                    const teamPlayers = this.matchData[`team${teamNum}`].players || [];
                    teamPlayers.forEach(player => {
                        if (player.actions && player.actions.jdm && player.name) {
                            mvps.push({
                                name: player.name,
                                team: this.matchData[`team${teamNum}`].name,
                                xp: player.xp || 0
                            });
                        }
                    });
                });
            }

            // Afficher les JDM s'il y en a
            if (mvps.length > 0) {
                return `
                <div class="mvp-display">
                    <div style="text-align: center; font-size: 16pt; margin-bottom: 10px;">
                        🌟 Joueur${mvps.length > 1 ? 's' : ''} du Match 🌟
                    </div>
                    ${mvps.map(mvp => `
                        <div style="text-align: center; margin: 5px 0;">
                            <strong>${mvp.name}</strong> (${mvp.team}) - ${mvp.xp} XP total
                        </div>
                    `).join('')}
                    <div style="text-align: center; font-size: 10pt; color: #666; margin-top: 5px;">
                        (incluant le bonus de +4 XP)
                    </div>
                </div>`;
            }
            return '';
        })()}

        <!-- Détails des Équipes -->
        <div class="section">
            <h2>👥 Détails des Équipes</h2>
            ${this.generatePrintableTeamDetails(1)}
            <div style="height: 30px;"></div>
            ${this.generatePrintableTeamDetails(2)}
        </div>

        <!-- Résumé Financier -->
        <div class="section">
            <h2>💰 Résumé Financier</h2>
            <div class="info-grid">
                ${this.generatePrintableFinancialSummary(1)}
                ${this.generatePrintableFinancialSummary(2)}
            </div>
        </div>

        <div class="footer">
            <p>Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
            <p>Blood Bowl Sevens - Ligue des Rava'Jeux</p>
        </div>
    </body>
    </html>`;
    }

    // Méthode auxiliaire pour les détails d'équipe
    generatePrintableTeamDetails(team) {
        const teamData = this.matchData[`team${team}`];
        const players = teamData.players.filter(p => p.name);

        return `
            <div class="info-box">
                <h3>${teamData.name}</h3>
                <div class="info-item">
                    <span>Coach</span>
                    <span>${teamData.coach || 'Non spécifié'}</span>
                </div>
                <div class="info-item">
                    <span>Roster</span>
                    <span>${teamData.roster || 'Non spécifié'}</span>
                </div>
                <div class="info-item">
                    <span>VEA</span>
                    <span>${Utils.formatNumber(teamData.vea)} PO</span>
                </div>
                <div class="info-item">
                    <span>Fans Dévoués</span>
                    <span>${teamData.fans}</span>
                </div>

                ${players.length > 0 ? `
                <h4 style="margin-top: 15px; color: #1a5f3f;">Joueurs (${players.length})</h4>
                <table class="players-table">
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>REU</th>
                            <th>DET</th>
                            <th>INT</th>
                            <th>ELIM</th>
                            <th>TD</th>
                            <th>JDM</th>
                            <th>XP Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${players.map(player => `
                        <tr>
                            <td style="text-align: left;">${player.name}</td>
                            <td>${player.actions.reu ? '✓' : ''}</td>
                            <td>${player.actions.det ? '✓' : ''}</td>
                            <td>${player.actions.int ? '✓' : ''}</td>
                            <td>${player.actions.elim ? '✓' : ''}</td>
                            <td>${player.actions.td ? '✓' : ''}</td>
                            <td>${player.actions.jdm ? '✓' : ''}</td>
                            <td><strong>${player.xp}</strong></td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : '<p style="margin-top: 10px; color: #666;">Aucun joueur enregistré</p>'}
            </div>
        `;
    }

    // Méthode auxiliaire pour le résumé financier
    generatePrintableFinancialSummary(team) {
        const teamData = this.matchData[`team${team}`];
        const gains = this.calculateGains(team);
        const sales = this.calculateSalesTotal(team);
        const soldPlayers = teamData.soldPlayers || [];

        return `
            <div class="info-box">
                <h3>${teamData.name}</h3>
                <div class="info-item">
                    <span>Gains du match</span>
                    <span>+${Utils.formatNumber(gains)} PO</span>
                </div>
                ${sales > 0 ? `
                <div class="info-item">
                    <span>Ventes de joueurs</span>
                    <span>+${Utils.formatNumber(sales)} PO</span>
                </div>
                ${soldPlayers.length > 0 ? `
                <div style="margin-left: 20px; margin-top: 5px; font-size: 10pt; color: #666;">
                    ${soldPlayers.map(p => `
                        <div style="padding: 2px 0;">
                            • ${p.name || 'Sans nom'} : ${Utils.formatNumber(p.value)} PO
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                ` : ''}
                <div class="info-item" style="font-weight: bold; color: #1a5f3f; margin-top: 10px;">
                    <span>Total</span>
                    <span>+${Utils.formatNumber(gains + sales)} PO</span>
                </div>
            </div>
        `;
    }

    // Méthode pour exporter les données
    exportMatchData() {
        const dataStr = JSON.stringify(this.matchData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `match_${this.matchData.team1.name}_vs_${this.matchData.team2.name}_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Méthode pour réinitialiser le match
    resetMatch() {
        if (confirm('Êtes-vous sûr de vouloir commencer un nouveau match ? Toutes les données actuelles seront perdues.')) {
            console.log('🔄 Réinitialisation complète du match...');

            // Arrêter le chronomètre s'il tourne
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }

            // Créer une nouvelle structure de données complètement vierge
            this.matchData = {
                team1: this.createTeamObject(),
                team2: this.createTeamObject(),
                timerRunning: false,
                pausedDuration: 0,
                lastStartTime: null,
                weather: {
                    type: 'classique', // Ajout du type par défaut
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
                },
                mvp: null,
                matchDate: null
            };

            // Réinitialiser COMPLÈTEMENT les inducements
            this.initializeInducementsData();

            // IMPORTANT : Effacer le localStorage
            Utils.storage.remove('match_state');

            // Effacer aussi les éventuelles sauvegardes de backup
            this.cleanAllBackups();

            // Désactiver temporairement la validation stricte
            const originalSecureTabSwitch = window.secureTabSwitch;
            window.secureTabSwitch = () => true;

            // Forcer le retour à l'onglet setup
            this.currentTab = 'setup'; // Forcer l'état avant switchTab
            this.switchTab('setup');

            // Réactiver la validation après un délai
            setTimeout(() => {
                window.secureTabSwitch = originalSecureTabSwitch;
                console.log('✅ Validation réactivée');
            }, 200);

            // Sauvegarder l'état vierge
            this.saveState();

            // Réinitialiser la validation visuelle
            if (window.visualValidation) {
                window.visualValidation.reset();

                // Réinitialiser après un court délai
                setTimeout(() => {
                    if (window.visualValidation) {
                        window.visualValidation.initialize();
                    }
                }, 200);
            }

            console.log('✅ Match complètement réinitialisé');

            // Notification de succès
            if (window.errorManager) {
                window.errorManager.success('Nouveau match créé ! Toutes les données ont été effacées.');
            }
        }
    }

    // NOUVELLE MÉTHODE pour nettoyer TOUS les backups
    cleanAllBackups() {
        try {
            const prefix = AppConfig.storage.prefix;
            const keysToRemove = [];

            // Identifier toutes les clés liées à l'application
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    keysToRemove.push(key);
                }
            }

            // Supprimer toutes les clés identifiées
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                console.log(`🗑️ Suppression: ${key}`);
            });

            console.log(`✅ ${keysToRemove.length} entrées supprimées du localStorage`);
        } catch (error) {
            console.error('Erreur lors du nettoyage des backups:', error);
        }
    }

    // === MÉTHODES DE SAUVEGARDE ===

    saveState() {
        try {
            // Essayer d'abord la méthode sécurisée
            if (window.secureSaveState) {
                const success = window.secureSaveState(this);
                if (success) {
                    return true;
                }
                console.warn('Sauvegarde sécurisée échouée, tentative fallback');
            }

            // Fallback sur Utils.storage
            const stateToSave = {
                matchData: this.matchData,
                currentTab: this.currentTab,
                saveDate: new Date().toISOString()
            };

            const saved = Utils.storage.set('match_state', stateToSave);

            if (saved && Math.random() < 0.1) {
                console.log('💾 Sauvegarde fallback réussie');
            }

            return saved;

        } catch (error) {
            console.error('Erreur sauvegarde complète:', error);
            return false;
        }
    }

    cleanOldBackups() {
        try {
            const prefix = AppConfig.storage.prefix + 'match_backup_';
            const backups = [];

            // Récupérer toutes les sauvegardes
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    const timestamp = parseInt(key.replace(prefix, ''));
                    backups.push({ key, timestamp });
                }
            }

            // Trier par date (plus récent en premier)
            backups.sort((a, b) => b.timestamp - a.timestamp);

            // Supprimer toutes sauf les 5 plus récentes
            if (backups.length > 5) {
                backups.slice(5).forEach(backup => {
                    localStorage.removeItem(backup.key);
                });
            }
        } catch (error) {
            console.error('Erreur lors du nettoyage des backups:', error);
        }
    }

    showSaveError() {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'save-error-notification';
        errorDiv.innerHTML = `
            <div class="save-error-content">
                <span>⚠️ Erreur de sauvegarde ! Les données pourraient être perdues.</span>
                <button onclick="app.tryManualSave()">Réessayer</button>
            </div>
        `;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    tryManualSave() {
        const saved = this.saveState();
        if (saved) {
            alert('Sauvegarde réussie !');
        } else {
            alert('Échec de la sauvegarde. Essayez d\'exporter vos données.');
        }
    }

    loadState() {
        try {
            console.log('📂 Tentative de chargement des données...');

            // Essayer le système sécurisé d'abord
            if (window.secureLoadState) {
                const success = window.secureLoadState(this);
                if (success) {
                    console.log('✅ Chargement sécurisé réussi');
                    // Vérifier l'intégrité des données chargées
                    this.validateLoadedData();
                    return true;
                }
            }

            // Fallback sur Utils.storage
            let savedState = Utils.storage.get('match_state');

            if (savedState) {
                // Vérifier que les données sont valides
                if (this.isValidSavedState(savedState)) {
                    if (savedState.matchData) {
                        this.matchData = { ...this.matchData, ...savedState.matchData };
                    } else {
                        // Format ancien
                        this.matchData = { ...this.matchData, ...savedState };
                    }

                    console.log('✅ Données restaurées avec succès');
                    this.validateLoadedData();
                    return true;
                } else {
                    console.warn('⚠️ Données sauvegardées corrompues, réinitialisation...');
                    // Nettoyer les données corrompues
                    Utils.storage.remove('match_state');
                    return false;
                }
            }

            console.log('ℹ️ Aucune sauvegarde trouvée');
            return false;

        } catch (error) {
            console.error('❌ Erreur critique lors du chargement:', error);
            // En cas d'erreur, nettoyer et repartir sur une base saine
            Utils.storage.remove('match_state');
            return false;
        }
    }

    // NOUVELLE MÉTHODE pour valider l'état sauvegardé
    isValidSavedState(state) {
        try {
            // Vérifications de base
            if (!state || typeof state !== 'object') return false;

            // Vérifier la structure selon le format
            if (state.matchData) {
                // Nouveau format
                return state.matchData.team1 && state.matchData.team2;
            } else {
                // Ancien format
                return state.team1 && state.team2;
            }
        } catch (error) {
            console.error('Erreur validation état:', error);
            return false;
        }
    }

    // NOUVELLE MÉTHODE pour valider et corriger les données chargées
    validateLoadedData() {
        console.log('🔍 Validation des données chargées...');

        // S'assurer que toutes les propriétés existent
        if (!this.matchData.team1) this.matchData.team1 = this.createTeamObject();
        if (!this.matchData.team2) this.matchData.team2 = this.createTeamObject();

        // Valider chaque équipe
        ['team1', 'team2'].forEach(team => {
            const teamData = this.matchData[team];

            // S'assurer que toutes les propriétés de base existent
            if (teamData.name === undefined) teamData.name = '';
            if (teamData.coach === undefined) teamData.coach = '';
            if (teamData.roster === undefined) teamData.roster = '';
            if (teamData.vea === undefined || teamData.vea === null) teamData.vea = 0;
            if (teamData.fans === undefined || teamData.fans < 1) teamData.fans = 1;
            if (teamData.score === undefined) teamData.score = 0;
            if (teamData.popularity === undefined) teamData.popularity = 0;
            if (teamData.popularityDice === undefined) teamData.popularityDice = null;
            if (teamData.treasury === undefined) teamData.treasury = 0;
            if (teamData.fansUpdateRoll === undefined) teamData.fansUpdateRoll = null;
            if (teamData.fansUpdateResult === undefined) teamData.fansUpdateResult = '';
            if (teamData.mvpName === undefined) teamData.mvpName = '';

            // S'assurer que les tableaux sont des tableaux
            if (!Array.isArray(teamData.players)) teamData.players = [];
            if (!Array.isArray(teamData.soldPlayers)) teamData.soldPlayers = [];

            // Valider chaque joueur
            teamData.players.forEach(player => {
                if (!player.id) player.id = `player-${team}-${Date.now()}-${Math.random()}`;
                if (player.name === undefined) player.name = '';
                if (player.xp === undefined) player.xp = 0;
                if (!player.actions) {
                    player.actions = { reu: false, det: false, int: false, elim: false, td: false, jdm: false };
                }
            });
        });

        // Valider la météo
        if (!this.matchData.weather) {
            this.matchData.weather = {
                type: 'classique',
                total: 0,
                effect: '',
                rolled: false,
                dice1: null,
                dice2: null
            };
        } else {
            if (this.matchData.weather.type === undefined) this.matchData.weather.type = 'classique';
            if (this.matchData.weather.dice1 === undefined) this.matchData.weather.dice1 = null;
            if (this.matchData.weather.dice2 === undefined) this.matchData.weather.dice2 = null;
        }

        // Valider les autres propriétés
        if (!this.matchData.kickoffEvents) this.matchData.kickoffEvents = [];
        if (!this.matchData.prayer) {
            this.matchData.prayer = { effect: '', rolled: false, dice: null };
        }
        if (this.matchData.coinFlip === undefined) this.matchData.coinFlip = '';

        // Valider les inducements
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

        // Valider le chronomètre
        if (this.matchData.timerRunning === undefined) this.matchData.timerRunning = false;
        if (this.matchData.pausedDuration === undefined) this.matchData.pausedDuration = 0;
        if (this.matchData.lastStartTime === undefined) this.matchData.lastStartTime = null;

        console.log('✅ Données validées et corrigées si nécessaire');
    }

    loadLatestBackup() {
        try {
            const prefix = AppConfig.storage.prefix + 'match_backup_';
            let latestBackup = null;
            let latestTimestamp = 0;

            // Parcourir toutes les clés pour trouver la sauvegarde la plus récente
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    const timestamp = parseInt(key.replace(prefix, ''));
                    if (timestamp > latestTimestamp) {
                        const data = localStorage.getItem(key);
                        if (data) {
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed && parsed.matchData) {
                                    latestBackup = parsed;
                                    latestTimestamp = timestamp;
                                }
                            } catch (e) {
                                console.error('Erreur parsing backup:', e);
                            }
                        }
                    }
                }
            }

            return latestBackup;
        } catch (error) {
            console.error('Erreur lors de la récupération du backup:', error);
            return null;
        }
    }

    showRecoveryInfo(saveDate) {
        if (!this.hasMatchData()) return;

        // Afficher seulement si les données sont vraiment anciennes (plus de 5 minutes)
        const date = new Date(saveDate);
        const minutesAgo = Math.floor((new Date() - date) / 60000);

        if (minutesAgo < 5) return; // Ne rien afficher si moins de 5 minutes

        const recoveryDiv = document.createElement('div');
        recoveryDiv.className = 'recovery-notification subtle';
        recoveryDiv.innerHTML = `
            <div class="recovery-content">
                <span>✓ Données restaurées</span>
            </div>
        `;
        document.body.appendChild(recoveryDiv);

        setTimeout(() => {
            if (recoveryDiv.parentElement) {
                recoveryDiv.remove();
            }
        }, 2000); // Réduit à 2 secondes
    }

    manualSave() {
        this.showingSaveIndicator = true;
        const saved = this.saveState();
        this.showingSaveIndicator = false;

        if (saved) {
            this.showSaveIndicator();
        }
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        if (seconds < 60) return `${seconds} secondes`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} heures`;
        return `${Math.floor(seconds / 86400)} jours`;
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
        // Sauvegarde immédiate au démarrage
        this.saveState();

        // Sauvegarde automatique silencieuse toutes les 30 secondes
        this.autoSaveInterval = setInterval(() => {
            this.saveState();
            // Retirer le console.log pour moins de bruit
        }, 30000); // Revenir à 30 secondes

        // Sauvegarde lors de certains événements critiques
        this.setupCriticalSaveEvents();
    }

    setupCriticalSaveEvents() {
        // Sauvegarde avant de quitter la page
        window.addEventListener('beforeunload', (e) => {
            this.saveState();

            // Avertir seulement si match en cours avec des scores
            if (this.matchData.team1.score > 0 || this.matchData.team2.score > 0) {
                e.preventDefault();
                e.returnValue = 'Match en cours';
                return e.returnValue;
            }
        });

        // Autres événements restent silencieux
        window.addEventListener('blur', () => {
            this.saveState();
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveState();
            }
        });

        window.addEventListener('pagehide', () => {
            this.saveState();
        });
    }

    hasMatchData() {
        // Vérifier si des données importantes sont présentes
        return (
            this.matchData.team1.name ||
            this.matchData.team2.name ||
            this.matchData.team1.score > 0 ||
            this.matchData.team2.score > 0 ||
            (this.matchData.team1.players && this.matchData.team1.players.length > 0) ||
            (this.matchData.team2.players && this.matchData.team2.players.length > 0)
        );
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

        // Sauvegarde différée pour éviter trop d'appels
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        this.saveTimeout = setTimeout(() => {
            this.saveState();
        }, 1000); // Augmenté à 1 seconde

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
        const validation = this.validateForPrematch();

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
                    <button class="btn btn-primary btn-next-tab ${validation.canNavigate ? '' : 'disabled'}"
                            onclick="app.switchTab('prematch')"
                            ${validation.canNavigate ? '' : 'disabled'}>
                        ➡️ Passer à l'Avant-Match
                    </button>
                </div>
            </div>
        `;
    }

    // Méthode de validation pour l'onglet setup
    validateForPrematch() {
        if (!window.navigationManager) {
            return { show: false, canNavigate: true, missing: [] };
        }

        const validation = window.navigationManager.canNavigateTo('prematch', this.matchData);

        return {
            show: true,
            canNavigate: validation.canNavigate,
            missing: validation.missing
        };
    }

    // méthode pour générer les options de roster
    getRosterOptions(selectedRoster) {
        const rosters = [
            'Humains', 'Orcs', 'Nains', 'Elfes', 'Elfes Noirs', 'Skavens',
            'Chaos', 'Morts-Vivants', 'Necromantiques', 'Nordiques', 'Amazones',
            'Halflings', 'Gobelins', 'Ogres', 'Vampires', 'Khemri', 'Lizardmen',
            'Bretonniens', 'Noblesse Impériale', 'Bas-Fonds', 'Snotlings',
            'Autre'
        ];

        return rosters.map(roster =>
            `<option value="${roster}" ${selectedRoster === roster ? 'selected' : ''}>${roster}</option>`
        ).join('');
    }

    getTeamCardHTML(teamNumber, type, icon) {
        const team = this.matchData[`team${teamNumber}`];

        // Utiliser la structure HTML existante mais avec les wrappers pour la validation
        return `
            <div class="team-card">
                <div class="team-header">
                    <h3>${icon} Équipe ${type}</h3>
                </div>

                <div class="form-group has-validation">
                    <label for="team${teamNumber}-name">Nom de l'équipe <span class="required-star">*</span></label>
                    <div class="input-wrapper">
                        <input type="text"
                               id="team${teamNumber}-name"
                               class="form-control"
                               value="${team.name || ''}"
                               onchange="app.updateTeamData(${teamNumber}, 'name', this.value)"
                               placeholder="Ex: Les Orcs Verts"
                               maxlength="50">
                        <span class="field-validation-icon"></span>
                    </div>
                    <div class="field-feedback"></div>
                </div>

                <div class="form-group">
                    <label for="team${teamNumber}-coach">Coach</label>
                    <div class="input-wrapper">
                        <input type="text"
                               id="team${teamNumber}-coach"
                               class="form-control"
                               value="${team.coach || ''}"
                               onchange="app.updateTeamData(${teamNumber}, 'coach', this.value)"
                               placeholder="Nom du coach (optionnel)">
                        <span class="field-validation-icon"></span>
                    </div>
                    <div class="field-feedback"></div>
                </div>

                <div class="form-group">
                    <label for="team${teamNumber}-roster">Roster</label>
                    <select id="team${teamNumber}-roster"
                            class="form-control"
                            onchange="app.updateTeamData(${teamNumber}, 'roster', this.value)">
                        <option value="">-- Sélectionner --</option>
                        ${this.getRosterOptions(team.roster)}
                    </select>
                </div>

                <div class="form-group has-validation">
                    <label for="team${teamNumber}-vea">VEA (PO) <span class="required-star">*</span></label>
                    <div class="input-wrapper">
                        <input type="number"
                               id="team${teamNumber}-vea"
                               class="form-control"
                               value="${team.vea || 0}"
                               onchange="app.updateTeamData(${teamNumber}, 'vea', this.value)"
                               min="0"
                               max="10000000"
                               step="10000"
                               placeholder="600000">
                        <span class="field-validation-icon"></span>
                    </div>
                    <div class="field-feedback"></div>
                </div>

                <div class="form-group has-validation">
                    <label for="team${teamNumber}-fans">Fans dévoués <span class="required-star">*</span></label>
                    <div class="input-wrapper">
                        <input type="number"
                               id="team${teamNumber}-fans"
                               class="form-control"
                               value="${team.fans || 1}"
                               onchange="app.updateTeamData(${teamNumber}, 'fans', this.value)"
                               min="1"
                               max="6"
                               placeholder="1">
                        <span class="field-validation-icon"></span>
                    </div>
                    <div class="field-feedback"></div>
                </div>

                <div class="form-group">
                    <label for="team${teamNumber}-treasury">Trésorerie (PO)</label>
                    <div class="input-wrapper">
                        <input type="number"
                               id="team${teamNumber}-treasury"
                               class="form-control"
                               value="${team.treasury || 0}"
                               onchange="app.updateTeamData(${teamNumber}, 'treasury', this.value)"
                               min="0"
                               step="10000"
                               placeholder="0">
                        <span class="field-validation-icon"></span>
                    </div>
                    <div class="field-feedback"></div>
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
            case 'match':
                this.initializeMatchTab();
                break;
            case 'postmatch':
                this.initializePostmatchTab();
                break;
            case 'summary':
                this.initializeSummaryTab();
                break;
        }
    }

    initializeSetupTab() {
        // Mettre à jour l'affichage de la comparaison VEA
        this.updateVEAComparison();

        // Vérifier et afficher l'état de validation
        this.updateValidationDisplay();

        // Ajouter des écouteurs pour la validation en temps réel
        this.setupRealtimeValidation();
    }

    // Validation en temps réel
    setupRealtimeValidation() {
        // Écouter les changements sur les champs critiques
        const criticalFields = [
            'team1-name', 'team2-name',
            'team1-vea', 'team2-vea'
        ];

        criticalFields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.addEventListener('input', () => {
                    setTimeout(() => this.updateValidationDisplay(), 100);
                });
            }
        });
    }

    // Méthode pour mettre à jour l'affichage de validation
    updateValidationDisplay() {
        if (!window.navigationManager) return;

        const validation = window.navigationManager.canNavigateTo('prematch', this.matchData);

        // Mettre à jour le bouton
        const nextButton = document.querySelector('.btn-next-tab');
        if (nextButton) {
            if (validation.canNavigate) {
                nextButton.classList.remove('disabled');
                nextButton.removeAttribute('disabled');
                nextButton.style.opacity = '1';
                nextButton.style.cursor = 'pointer';
            } else {
                nextButton.classList.add('disabled');
                nextButton.setAttribute('disabled', 'disabled');
                nextButton.style.opacity = '0.5';
                nextButton.style.cursor = 'not-allowed';
            }
        }
    }

    updateTeamData(teamNumber, field, value) {
        try {
            // Utiliser la fonction de validation si elle existe
            if (window.validateAndUpdateTeamData) {
                return window.validateAndUpdateTeamData(this, teamNumber, field, value);
            }

            // Fallback sur l'ancienne méthode
            console.log(`Mise à jour équipe ${teamNumber}, champ ${field}:`, value);

            // S'assurer que l'équipe existe
            if (!this.matchData[`team${teamNumber}`]) {
                this.matchData[`team${teamNumber}`] = this.createTeamObject();
            }

            let validatedValue = value;

            switch(field) {
                case 'name':
                case 'coach':
                case 'roster':
                    validatedValue = String(value || '').trim();
                    break;

                case 'vea':
                    validatedValue = parseInt(value);
                    if (isNaN(validatedValue)) validatedValue = 0;
                    if (validatedValue < 0) validatedValue = 0;
                    if (validatedValue > 10000000) validatedValue = 10000000;
                    break;

                case 'fans':
                    validatedValue = parseInt(value);
                    if (isNaN(validatedValue) || validatedValue < 1) validatedValue = 1;
                    if (validatedValue > 6) validatedValue = 6;
                    break;

                case 'popularity':
                    validatedValue = parseInt(value) || 0;
                    if (validatedValue < 0) validatedValue = 0;
                    break;

                case 'treasury':
                    validatedValue = parseInt(value) || 0;
                    if (validatedValue < 0) validatedValue = 0;

                    // Synchroniser avec les inducements
                    if (!this.matchData.inducements[`team${teamNumber}Treasury`] ||
                        this.matchData.inducements[`team${teamNumber}Treasury`] === 0) {
                        this.matchData.inducements[`team${teamNumber}Treasury`] = validatedValue;
                    }

                    break;

                default:
                    validatedValue = value;
            }

            // Appliquer la valeur
            this.matchData[`team${teamNumber}`][field] = validatedValue;

            // NOUVEAU : Déclencher la validation visuelle
            if (window.visualValidation) {
                const elementId = `team${teamNumber}-${field}`;
                const element = document.getElementById(elementId);
                if (element) {
                    const config = this.getFieldConfig(field);
                    window.visualValidation.validateField(element, config);
                }
            }

            // [GARDER LE RESTE DU CODE EXISTANT]

            // Mettre à jour les affichages
            if (field === 'name') {
                this.updateTeamNamesDisplay();
            }

            if (field === 'vea' || field === 'fans') {
                this.updateVEAComparison();
            }

            // Sauvegarde différée
            this.scheduleSave();

            return true;

        } catch (error) {
            console.error('Erreur updateTeamData:', error);
            return false;
        }
    }

    // NOUVELLE MÉTHODE : Synchroniser toutes les trésoreries
    syncAllTreasuries() {
        // S'assurer que les trésoreries des inducements sont synchronisées
        [1, 2].forEach(team => {
            const configTreasury = parseInt(this.matchData[`team${team}`].treasury) || 0;

            // Si la trésorerie des inducements n'est pas définie, la synchroniser
            if (!this.matchData.inducements[`team${team}Treasury`]) {
                this.matchData.inducements[`team${team}Treasury`] = configTreasury;
                console.log(`🔄 Synchronisation trésorerie équipe ${team}: ${configTreasury} PO`);
            }
        });
    }

    // Nouvelle méthode pour mettre à jour l'état de navigation
    updateNavigationState() {
        // Vérifier si on peut passer à l'onglet suivant
        if (!window.checkCurrentValidation) return;

        const validation = window.checkCurrentValidation();

        // Mettre à jour visuellement les boutons de navigation
        const nextButtons = document.querySelectorAll('.btn-next-tab');
        nextButtons.forEach(btn => {
            if (validation.canNavigate) {
                btn.classList.remove('disabled');
                btn.removeAttribute('title');
            } else {
                btn.classList.add('disabled');
                btn.setAttribute('title', `Remplir: ${validation.missing.join(', ')}`);
            }
        });
    }

    scheduleSave() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        this.saveTimeout = setTimeout(() => {
            this.saveState();
        }, 1000);
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
            <div class="tab-content active" id="prematch">
                <h2 class="section-title">⚡ Séquence d'Avant-Match</h2>

            <div class="explanation-box">
                <h4>🎯 Déroulement de l'avant-match (dans l'ordre)</h4>
                <p><strong>1.</strong> Déterminez le facteur de popularité (fans)</p>
                <p><strong>2.</strong> Tirez la météo qui affectera le match</p>
                <p><strong>3.</strong> Calculez la petite monnaie et les coups de pouce</p>
                <p><strong>4.</strong> L'outsider peut invoquer Nuffle</p>
                <p><strong>5.</strong> Déterminez qui engage en premier</p>
            </div>

            ${this.getDiceInfoBox()}
        `;

        try {
            html += this.getPopularitySection();
        } catch (e) {
            console.error('Erreur dans getPopularitySection:', e);
            html += '<div class="error">Erreur section popularité: ' + e.message + '</div>';
        }

        try {
            html += this.getWeatherSection();
        } catch (e) {
            console.error('Erreur dans getWeatherSection:', e);
            html += '<div class="error">Erreur section météo: ' + e.message + '</div>';
        }

        try {
            html += this.getPetiteMonnaieSection();
        } catch (e) {
            console.error('Erreur dans getPetiteMonnaieSection:', e);
            html += '<div class="error">Erreur section petite monnaie: ' + e.message + '</div>';
        }

        try {
            html += this.getPrayerSection();
        } catch (e) {
            console.error('Erreur dans getPrayerSection:', e);
            html += '<div class="error">Erreur section prière: ' + e.message + '</div>';
        }

        try {
            html += this.getCoinFlipSection();
        } catch (e) {
            console.error('Erreur dans getCoinFlipSection:', e);
            html += '<div class="error">Erreur section pile ou face: ' + e.message + '</div>';
        }

        html += `
            <div class="form-actions">
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

                <!-- NOUVEAU : Sélecteur de type de météo -->
                <div class="weather-type-selector">
                    <label for="weather-type-select"><strong>Type de météo :</strong></label>
                    <select id="weather-type-select" class="weather-select" onchange="app.changeWeatherType(this.value)">
                        ${Object.keys(AppConfig.gameData.weatherTables).map(key => `
                            <option value="${key}" ${weather.type === key ? 'selected' : ''}>
                                ${AppConfig.gameData.weatherTables[key].icon} ${AppConfig.gameData.weatherTables[key].name}
                            </option>
                        `).join('')}
                    </select>
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

                ${this.getSelectedInducementsDisplay()}

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

        // Calculer les VEA ajustées
        const team1AdjustedVEA = this.calculateAdjustedVEA(1);
        const team2AdjustedVEA = this.calculateAdjustedVEA(2);

        // Calculer le nombre de prières basé sur les VEA ajustées
        const prayerCount = this.calculatePrayerCount();

        // Déterminer qui est l'outsider (équipe avec VEA ajustée la plus faible)
        const outsiderTeam = team1AdjustedVEA < team2AdjustedVEA ? this.matchData.team1.name :
                             team2AdjustedVEA < team1AdjustedVEA ? this.matchData.team2.name : null;

        // Calculer les coûts des coups de pouce pour l'affichage
        const team1InducementsCost = this.calculateInducementsCost(1);
        const team2InducementsCost = this.calculateInducementsCost(2);

        // Calculer la différence de VEA pour l'affichage
        const veaDifference = Math.abs(team1AdjustedVEA - team2AdjustedVEA);

        // Déterminer le message d'état approprié
        let statusMessage = '';
        if (team1AdjustedVEA === team2AdjustedVEA) {
            statusMessage = '<p style="color: #dc3545; font-weight: bold; margin-top: 10px;">⚠️ Aucune équipe ne peut prier (VEA ajustées identiques)</p>';
        } else if (prayerCount === 0) {
            statusMessage = `<p style="color: #ffc107; font-weight: bold; margin-top: 10px;">⚠️ ${outsiderTeam} est l'outsider mais ne peut pas prier (écart de ${Utils.formatNumber(veaDifference)} PO, minimum 50 000 PO requis)</p>`;
        } else {
            statusMessage = `<p style="color: #28a745; font-weight: bold; margin-top: 10px;">✅ ${outsiderTeam} peut prier (${prayerCount} prière${prayerCount > 1 ? 's' : ''})</p>`;
        }

        // Déterminer si le bouton doit être activé
        const canPray = prayerCount > 0;

        return `
            <div class="step-section">
                <div class="step-header">
                    <div class="step-number">4</div>
                    <div class="step-title">Prières à Nuffle</div>
                </div>
                <div class="explanation-box">
                    <p><strong>Règle :</strong> Après l'achat des coups de pouce, on recalcule les VEA</p>
                    <p>L'outsider (équipe avec VEA recalculée la plus faible) peut prier Nuffle</p>
                    <p>1 prière par tranche de 50 000 PO d'écart entre les VEA recalculées</p>

                    <!-- Affichage des VEA ajustées -->
                    <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                        <p style="margin: 5px 0;"><strong>VEA après coups de pouce :</strong></p>
                        <p style="margin: 5px 0;">
                            ${this.matchData.team1.name || 'Équipe 1'} :
                            ${Utils.formatNumber(this.matchData.team1.vea)} PO
                            ${team1InducementsCost > 0 ? ` + ${Utils.formatNumber(team1InducementsCost)} PO (coups de pouce)` : ''}
                            = <strong>${Utils.formatNumber(team1AdjustedVEA)} PO</strong>
                        </p>
                        <p style="margin: 5px 0;">
                            ${this.matchData.team2.name || 'Équipe 2'} :
                            ${Utils.formatNumber(this.matchData.team2.vea)} PO
                            ${team2InducementsCost > 0 ? ` + ${Utils.formatNumber(team2InducementsCost)} PO (coups de pouce)` : ''}
                            = <strong>${Utils.formatNumber(team2AdjustedVEA)} PO</strong>
                        </p>
                    </div>

                    ${statusMessage}
                </div>
                <div class="dice-controls">
                    <button class="dice-btn" data-dice-type="prayer"
                        ${canPray ? '' : 'disabled'}
                        ${!canPray ? 'title="Pas assez d\'écart de VEA pour prier (minimum 50 000 PO)"' : ''}>
                        🙏 Prière à Nuffle (D8) ${!canPray ? '(Non disponible)' : ''}
                    </button>
                    <input type="number" class="dice-result" id="prayer-result"
                        value="${prayer.dice || ''}" min="1" max="8"
                        data-field="prayerDice"
                        ${!canPray ? 'disabled' : ''}>
                </div>
                <div id="prayer-description" class="result-box" style="${prayer.effect ? '' : 'display: none;'}">
                    ${prayer.effect ? `<p>Effet de la prière (${prayer.dice}) : <strong>${prayer.effect}</strong></p>` : ''}
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
        // Utiliser les VEA ajustées (après achat des coups de pouce)
        const team1AdjustedVEA = this.calculateAdjustedVEA(1);
        const team2AdjustedVEA = this.calculateAdjustedVEA(2);

        const diff = Math.abs(team1AdjustedVEA - team2AdjustedVEA);
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
        const team1AdjustedVEA = this.calculateAdjustedVEA(1);
        const team2AdjustedVEA = this.calculateAdjustedVEA(2);
        const veaDifference = Math.abs(team1AdjustedVEA - team2AdjustedVEA);

        // Cas où les VEA sont identiques
        if (team1AdjustedVEA === team2AdjustedVEA) {
            return 'Les VEA ajustées sont identiques, pas de prière à Nuffle.';
        }

        const outsider = team1AdjustedVEA < team2AdjustedVEA ?
            this.matchData.team1.name : this.matchData.team2.name;

        // Cas où il y a un outsider mais pas assez d'écart
        if (prayerCount === 0) {
            return `${outsider} est l'outsider mais ne peut pas prier (écart de ${Utils.formatNumber(veaDifference)} PO, minimum 50 000 PO requis).`;
        }

        // Cas normal où l'outsider peut prier
        return `${outsider} peut faire ${prayerCount} prière${prayerCount > 1 ? 's' : ''} à Nuffle.`;
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
        this.saveState();
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

            // Utiliser la table de météo sélectionnée
            const weatherTable = AppConfig.gameData.weatherTables[this.matchData.weather.type];
            this.matchData.weather.effect = weatherTable.effects[total] || "Effet météo inconnu.";
            this.matchData.weather.rolled = true;

            document.getElementById('weather-total').value = total;
            const descDiv = document.getElementById('weather-description');
            descDiv.style.display = 'block';
            descDiv.className = 'result-box success';
            descDiv.innerHTML = `
                <p>
                    <span style="font-size: 1.2em;">${weatherTable.icon}</span>
                    Météo ${weatherTable.name} (${total}) :
                    <strong>${this.matchData.weather.effect}</strong>
                </p>
            `;
        }
        this.saveState();
    }

    rollPrayerDice() {
        const roll = Utils.getRandomInt(1, 8);
        this.matchData.prayer.dice = roll;

        // Utiliser la config au lieu de définir localement
        this.matchData.prayer.effect = AppConfig.gameData.prayerEffects[roll] || "Effet de prière inconnu.";
        this.matchData.prayer.rolled = true;

        const prResult = document.getElementById('prayer-result');
        if (prResult) {
            prResult.value = roll;
        }

        const descDiv = document.getElementById('prayer-description');
        if (descDiv) {
            descDiv.style.display = 'block';
            descDiv.className = 'result-box success';
            descDiv.innerHTML = `<p>Résultat de la Prière (${roll}) : <strong>${this.matchData.prayer.effect}</strong></p>`;
        }
        this.saveState();
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

        this.saveState();
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

    initializeMatchTab() {
        // Restaurer l'état du chrono si nécessaire
        if (this.matchData.timerRunning) {
            // S'assurer que lastStartTime est défini
            if (!this.matchData.lastStartTime) {
                this.matchData.lastStartTime = new Date();
            }
            this.startTimerInterval();
        } else if (this.matchData.matchStart) {
            // Afficher le temps écoulé même si le chrono est en pause
            this.updateTimerDisplay();
        }

        console.log('Match tab initialized');
    }

    cleanupMatchTab() {
        // Arrêter l'intervalle du chrono lors du changement d'onglet
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
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

            // Utiliser la table de météo sélectionnée
            const weatherTable = AppConfig.gameData.weatherTables[this.matchData.weather.type];
            this.matchData.weather.effect = weatherTable.effects[total] || "Effet météo inconnu.";
            this.matchData.weather.rolled = true;

            document.getElementById('weather-total').value = total;
            const descDiv = document.getElementById('weather-description');
            descDiv.style.display = 'block';
            descDiv.className = 'result-box success';
            descDiv.innerHTML = `
                <p>
                    <span style="font-size: 1.2em;">${weatherTable.icon}</span>
                    Météo ${weatherTable.name} (${total}) :
                    <strong>${this.matchData.weather.effect}</strong>
                </p>
            `;

            this.saveState();
        }
    }

    showInducementsModal() {
        // Créer le HTML de la modal
        const modalHTML = `
        this.syncTreasuries();
            <div id="inducements-modal" class="modal" style="display: block;">
                <div class="modal-content" style="max-width: 900px;">
                    <div class="modal-header">
                        <h2>💰 Gestion des Coups de Pouce</h2>
                        <span class="close" onclick="app.closeInducementsModal()">&times;</span>
                    </div>

                    <div class="modal-body">
                        ${this.getInducementsModalContent()}
                    </div>

                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="app.validateInducements()">
                            ✅ Valider les Coups de Pouce
                        </button>
                        <button class="btn btn-secondary" onclick="app.closeInducementsModal()">
                            ❌ Annuler
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Ajouter la modal au DOM
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
    }

    closeInducementsModal() {
        const modal = document.getElementById('inducements-modal');
        if (modal && modal.parentElement) {
            modal.parentElement.remove();
        }
    }

    getInducementsModalContent() {
        const { team1PetiteMonnaie, team2PetiteMonnaie } = this.calculatePetiteMonnaie();

        return `
            <div class="inducement-selection">
                <div class="team-inducements">
                    <h4>🏠 ${this.matchData.team1.name || 'Équipe 1'}</h4>

                    <div class="treasury-input">
                        <label>Trésorerie disponible :</label>
                        <input type="number" id="team1-treasury"
                            placeholder="0" min="0" step="1000"
                            value="${this.matchData.inducements.team1Treasury || this.matchData.team1.treasury || 0}"
                            onchange="app.updateInducementBudget(1)">
                        <span>PO</span>
                    </div>

                    <div class="budget-display-separated">
                        <div class="budget-item ${team1PetiteMonnaie > 0 ? 'warning' : 'neutral'}">
                            <div class="label">💰 Petite Monnaie (prioritaire)</div>
                            <div class="value">${Utils.formatNumber(team1PetiteMonnaie)} PO</div>
                            <div class="remaining" id="team1-remaining-petite">
                                Restant : ${Utils.formatNumber(team1PetiteMonnaie)} PO
                            </div>
                        </div>
                        <div class="budget-item">
                            <div class="label">🏦 Trésorerie (après petite monnaie)</div>
                            <div class="value" id="team1-treasury-display">
                                ${Utils.formatNumber(this.matchData.inducements.team1Treasury || this.matchData.team1.treasury || 0)} PO
                            </div>
                            <div class="remaining" id="team1-remaining-treasury">
                                Restant : ${Utils.formatNumber(this.matchData.inducements.team1Treasury || this.matchData.team1.treasury || 0)} PO
                            </div>
                        </div>
                    </div>

                    <div id="team1-inducements-list">
                        ${this.getInducementsListHTML(1)}
                    </div>

                    <div class="inducement-total">
                        <div>Total dépensé : <span id="team1-total-cost">0</span> PO</div>
                        <div>Budget restant : <span id="team1-remaining-budget">
                            ${Utils.formatNumber(team1PetiteMonnaie + this.matchData.inducements.team1Treasury)}
                        </span> PO</div>
                    </div>

                    <div id="team1-spending-summary"></div>

                </div>

                <div class="team-inducements">
                    <h4>🚌 ${this.matchData.team2.name || 'Équipe 2'}</h4>

                    <div class="treasury-input">
                        <label>Trésorerie disponible :</label>
                        <input type="number" id="team2-treasury"
                            placeholder="0" min="0" step="1000"
                            value="${this.matchData.inducements.team2Treasury || this.matchData.team2.treasury || 0}"
                            onchange="app.updateInducementBudget(2)">
                        <span>PO</span>
                    </div>

                    <div class="budget-display-separated">
                        <div class="budget-item ${team2PetiteMonnaie > 0 ? 'warning' : 'neutral'}">
                            <div class="label">💰 Petite Monnaie (prioritaire)</div>
                            <div class="value">${Utils.formatNumber(team2PetiteMonnaie)} PO</div>
                            <div class="remaining" id="team2-remaining-petite">
                                Restant : ${Utils.formatNumber(team2PetiteMonnaie)} PO
                            </div>
                        </div>
                        <div class="budget-item">
                            <div class="label">🏦 Trésorerie (après petite monnaie)</div>
                            <div class="value" id="team2-treasury-display">
                                ${Utils.formatNumber(this.matchData.inducements.team2Treasury || this.matchData.team2.treasury || 0)} PO
                            </div>
                            <div class="remaining" id="team2-remaining-treasury">
                                Restant : ${Utils.formatNumber(this.matchData.inducements.team2Treasury || this.matchData.team2.treasury || 0)} PO
                            </div>
                        </div>
                    </div>

                    <div id="team2-inducements-list">
                        ${this.getInducementsListHTML(2)}
                    </div>

                    <div class="inducement-total">
                        <div>Total dépensé : <span id="team2-total-cost">0</span> PO</div>
                        <div>Budget restant : <span id="team2-remaining-budget">
                            ${Utils.formatNumber(team2PetiteMonnaie + this.matchData.inducements.team2Treasury)}
                        </span> PO</div>
                    </div>

                    <div id="team2-spending-summary"></div>

                </div>
            </div>
        `;
    }

    getInducementsListHTML(team) {
        const inducements = AppConfig.gameData.inducements;
        let html = '';

        inducements.forEach((inducement, index) => {
            const currentQty = this.matchData.inducements[`team${team}Items`][inducement.name] || 0;

            html += `
                <div class="inducement-item">
                    <div class="inducement-info">
                        <div class="inducement-name">${inducement.name}</div>
                        <div class="inducement-cost">${Utils.formatNumber(inducement.cost)} PO (max ${inducement.max})</div>
                    </div>
                    <div class="inducement-controls">
                        <button class="qty-btn" onclick="app.changeInducementQty(${team}, '${inducement.name}', -1)">-</button>
                        <div class="qty-display">${currentQty}</div>
                        <button class="qty-btn" onclick="app.changeInducementQty(${team}, '${inducement.name}', 1)">+</button>
                    </div>
                </div>
            `;
        });

        return html;
    }

    showBudgetError(team, totalCost, budget) {
        const remaining = budget - totalCost;
        const teamName = this.matchData[`team${team}`].name || `Équipe ${team}`;

        // Affichage temporaire d'une erreur
        const errorDiv = document.createElement('div');
        errorDiv.className = 'budget-error';
        errorDiv.innerHTML = `
            <div style="background: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; margin: 10px 0;">
                ⚠️ ${teamName} : Budget insuffisant !<br>
                Coût: ${Utils.formatNumber(totalCost)} PO<br>
                Budget: ${Utils.formatNumber(budget)} PO<br>
                Manque: ${Utils.formatNumber(-remaining)} PO
            </div>
        `;

        const container = document.getElementById(`team${team}-spending-summary`);
        if (container) {
            container.appendChild(errorDiv);
            setTimeout(() => errorDiv.remove(), 3000); // Supprime après 3 secondes
        }
    }

    changeInducementQty(team, inducementName, change) {
        const inducement = AppConfig.gameData.inducements.find(ind => ind.name === inducementName);
        if (!inducement) return;

        const items = this.matchData.inducements[`team${team}Items`];
        const currentQty = items[inducementName] || 0;
        const newQty = Math.max(0, Math.min(inducement.max, currentQty + change));

        // Vérifier le budget AVANT le changement
        const totalCostAfterChange = this.calculateInducementsCost(team, inducementName, newQty);
        const budget = this.getTeamBudget(team);

        console.log(`🛒 Team ${team}: Coût total: ${totalCostAfterChange}, Budget: ${budget}`);

        if (totalCostAfterChange <= budget) {
            items[inducementName] = newQty;
            this.updateInducementsDisplay(team);
            this.saveState(); // ← CORRECTION: seulement si l'achat réussit
        } else {
            console.log(`❌ Budget insuffisant pour l'équipe ${team}`);
            // Optionnel : Afficher un message à l'utilisateur
            this.showBudgetError(team, totalCostAfterChange, budget);
        }
    }

    // NOUVELLE FONCTION : Synchroniser les trésoreries au moment d'ouvrir la modal
    syncTreasuries() {
        if (!this.matchData.inducements.team1Treasury && this.matchData.team1.treasury) {
            this.matchData.inducements.team1Treasury = this.matchData.team1.treasury;
        }
        if (!this.matchData.inducements.team2Treasury && this.matchData.team2.treasury) {
            this.matchData.inducements.team2Treasury = this.matchData.team2.treasury;
        }
    }

    calculateInducementsCost(team, excludeName = null, overrideQty = null) {
        const items = this.matchData.inducements[`team${team}Items`];
        let total = 0;

        AppConfig.gameData.inducements.forEach(inducement => {
            let qty = items[inducement.name] || 0;
            if (inducement.name === excludeName && overrideQty !== null) {
                qty = overrideQty;
            }
            total += inducement.cost * qty;
        });

        return total;
    }

    calculateAdjustedVEA(team) {
        const baseVEA = this.matchData[`team${team}`].vea || 0;
        const inducements = this.matchData.inducements || {};
        const teamItems = inducements[`team${team}Items`] || {};

        let inducementsCost = 0;
        Object.keys(teamItems).forEach(itemName => {
            const quantity = teamItems[itemName] || 0;
            if (quantity > 0) {
                const itemConfig = AppConfig.gameData.inducements.find(i => i.name === itemName);
                if (itemConfig) {
                    inducementsCost += itemConfig.cost * quantity;
                }
            }
        });

        return baseVEA + inducementsCost;
    }

    getTeamBudget(team) {
        const petiteMonnaie = team === 1 ?
            this.matchData.inducements.team1PetiteMonnaie :
            this.matchData.inducements.team2PetiteMonnaie;

        // CORRECTION : Récupérer la trésorerie correctement
        let treasury = this.matchData.inducements[`team${team}Treasury`];

        // Si pas encore définie, prendre depuis la configuration
        if (!treasury) {
            treasury = this.matchData[`team${team}`].treasury || 0;
            this.matchData.inducements[`team${team}Treasury`] = treasury;
        }

        console.log(`💰 Team ${team} - Petite monnaie: ${petiteMonnaie}, Trésorerie: ${treasury}`);
        return petiteMonnaie + treasury;
    }

    // NOUVELLE FONCTION : Calculer les dépenses par priorité
    calculateInducementSpending(team) {
        const totalCost = this.calculateInducementsCost(team);
        const petiteMonnaie = team === 1 ?
            this.matchData.inducements.team1PetiteMonnaie :
            this.matchData.inducements.team2PetiteMonnaie;
        const treasury = this.matchData.inducements[`team${team}Treasury`] || 0;

        // Logique de priorité : d'abord petite monnaie, puis trésorerie
        const spentFromPetiteMonnaie = Math.min(totalCost, petiteMonnaie);
        const spentFromTreasury = Math.max(0, totalCost - petiteMonnaie);

        const remainingPetiteMonnaie = Math.max(0, petiteMonnaie - spentFromPetiteMonnaie);
        const remainingTreasury = Math.max(0, treasury - spentFromTreasury);

        // Debug pour vérifier les calculs
        console.log(`📊 Équipe ${team} - Calcul des dépenses:`);
        console.log(`   Total à payer: ${totalCost} PO`);
        console.log(`   Petite monnaie disponible: ${petiteMonnaie} PO`);
        console.log(`   Trésorerie disponible: ${treasury} PO`);
        console.log(`   → Petite monnaie utilisée: ${spentFromPetiteMonnaie} PO`);
        console.log(`   → Trésorerie utilisée: ${spentFromTreasury} PO`);
        console.log(`   → Petite monnaie restante: ${remainingPetiteMonnaie} PO`);
        console.log(`   → Trésorerie restante: ${remainingTreasury} PO`);

        return {
            totalCost,
            spentFromPetiteMonnaie,
            spentFromTreasury,
            remainingPetiteMonnaie,
            remainingTreasury,
            canAfford: totalCost <= (petiteMonnaie + treasury)
        };
    }

//    updateInducementBudget(team) {
//        const treasuryInput = document.getElementById(`team${team}-treasury`);
//        this.matchData.inducements[`team${team}Treasury`] = parseInt(treasuryInput.value) || 0;
//        this.updateInducementsDisplay(team);
//    }

    updateInducementBudget(team) {
        const treasuryInput = document.getElementById(`team${team}-treasury`);
        const newValue = parseInt(treasuryInput.value) || 0;
        this.matchData.inducements[`team${team}Treasury`] = newValue;

        console.log(`🏦 Équipe ${team} trésorerie mise à jour: ${newValue}`);

        this.updateInducementsDisplay(team);
    }

    updateInducementsDisplay(team) {
        // Mettre à jour la liste
        const listContainer = document.getElementById(`team${team}-inducements-list`);
        if (listContainer) {
            listContainer.innerHTML = this.getInducementsListHTML(team);
        }

        // Utiliser la logique de priorité
        const spending = this.calculateInducementSpending(team);

        // Mettre à jour les affichages séparés - Petite monnaie
        const petiteRemainingEl = document.getElementById(`team${team}-remaining-petite`);
        if (petiteRemainingEl) {
            petiteRemainingEl.innerHTML = `Restant : ${Utils.formatNumber(spending.remainingPetiteMonnaie)} PO`;
            // Ajouter une classe CSS pour indiquer si tout est utilisé
            if (spending.remainingPetiteMonnaie === 0 && spending.spentFromPetiteMonnaie > 0) {
                petiteRemainingEl.className = 'remaining used';
            } else if (spending.spentFromPetiteMonnaie > 0) {
                petiteRemainingEl.className = 'remaining partial';
            } else {
                petiteRemainingEl.className = 'remaining';
            }
        }

        // Mettre à jour les affichages séparés - Trésorerie
        const treasuryRemainingEl = document.getElementById(`team${team}-remaining-treasury`);
        if (treasuryRemainingEl) {
            treasuryRemainingEl.innerHTML = `Restant : ${Utils.formatNumber(spending.remainingTreasury)} PO`;
            // Ajouter une classe CSS pour indiquer si la trésorerie est utilisée
            if (spending.spentFromTreasury > 0) {
                treasuryRemainingEl.className = 'remaining partial';
            } else {
                treasuryRemainingEl.className = 'remaining';
            }
        }

        // Mettre à jour le coût total
        const totalCostEl = document.getElementById(`team${team}-total-cost`);
        if (totalCostEl) {
            totalCostEl.textContent = Utils.formatNumber(spending.totalCost);
        }

        // Afficher un résumé détaillé des dépenses - PARTIE CORRIGÉE
        const summaryEl = document.getElementById(`team${team}-spending-summary`);
        if (summaryEl) {
            let summaryHTML = '<div class="spending-breakdown">';

            // Toujours afficher les deux lignes pour la clarté
            summaryHTML += `<div class="spend-line">Petite monnaie utilisée : ${Utils.formatNumber(spending.spentFromPetiteMonnaie)} PO</div>`;
            summaryHTML += `<div class="spend-line">Trésorerie utilisée : ${Utils.formatNumber(spending.spentFromTreasury)} PO</div>`;

            // Avertissement si petite monnaie non utilisée
            if (spending.remainingPetiteMonnaie > 0) {
                summaryHTML += `<div class="spend-warning">⚠️ ${Utils.formatNumber(spending.remainingPetiteMonnaie)} PO de petite monnaie non utilisée seront perdues !</div>`;
            }

            // Avertissement si budget insuffisant
            if (!spending.canAfford) {
                summaryHTML += '<div class="spend-error">❌ Budget insuffisant !</div>';
            }

            summaryHTML += '</div>';
            summaryEl.innerHTML = summaryHTML;
        }

        // Mettre à jour le budget restant total
        const remainingBudgetEl = document.getElementById(`team${team}-remaining-budget`);
        if (remainingBudgetEl) {
            const totalRemaining = spending.remainingPetiteMonnaie + spending.remainingTreasury;
            remainingBudgetEl.textContent = Utils.formatNumber(totalRemaining);
        }
    }

    validateInducements() {
        // NOUVEAU : Calculer et sauvegarder la trésorerie dépensée pour chaque équipe
        const team1Spending = this.calculateInducementSpending(1);
        const team2Spending = this.calculateInducementSpending(2);

        // Sauvegarder la trésorerie dépensée
        this.matchData.team1.treasurySpentOnInducements = team1Spending.spentFromTreasury;
        this.matchData.team2.treasurySpentOnInducements = team2Spending.spentFromTreasury;

        console.log('💰 Trésorerie dépensée sauvegardée:');
        console.log(`   Équipe 1: ${team1Spending.spentFromTreasury} PO`);
        console.log(`   Équipe 2: ${team2Spending.spentFromTreasury} PO`);

        // Sauvegarder les données
        this.saveState();

        // Fermer la modal
        this.closeInducementsModal();

        // Rafraîchir l'affichage de l'onglet
        this.loadTab(this.currentTab);

        // Message de confirmation
        console.log('✅ Coups de pouce validés et trésorerie dépensée enregistrée !');
    }

    getSelectedInducementsDisplay() {
        const team1Inducements = this.getTeamInducementsList(1);
        const team2Inducements = this.getTeamInducementsList(2);

        // Si aucun coup de pouce n'est sélectionné, ne rien afficher
        if (team1Inducements.length === 0 && team2Inducements.length === 0) {
            return '';
        }

        // Calculer les dépenses détaillées pour chaque équipe
        const team1Spending = this.calculateInducementSpending(1);
        const team2Spending = this.calculateInducementSpending(2);

        let html = '<div class="selected-inducements-display">';

        // Équipe 1
        if (team1Inducements.length > 0) {
            html += `
                <div class="team-selected-inducements">
                    <h5>🏠 ${this.matchData.team1.name || 'Équipe 1'}</h5>
                    <div class="inducements-summary">
            `;

            team1Inducements.forEach(item => {
                html += `
                    <div class="inducement-summary-item">
                        <span class="inducement-summary-name">${item.name}</span>
                        <span class="inducement-summary-qty">x${item.qty}</span>
                        <span class="inducement-summary-cost">${Utils.formatNumber(item.totalCost)} PO</span>
                    </div>
                `;
            });

            // Afficher le total et la décomposition
            html += `
                        <div class="inducement-summary-total">
                            <span>Total dépensé :</span>
                            <span>${Utils.formatNumber(team1Spending.totalCost)} PO</span>
                        </div>
                        <div class="inducement-summary-breakdown">
                            <div class="breakdown-line">
                                <span>💰 Petite monnaie utilisée :</span>
                                <span>${Utils.formatNumber(team1Spending.spentFromPetiteMonnaie)} PO</span>
                            </div>
                            <div class="breakdown-line">
                                <span>🏦 Trésorerie utilisée :</span>
                                <span>${Utils.formatNumber(team1Spending.spentFromTreasury)} PO</span>
                            </div>
            `;

            // NOUVEAU : Ajouter la trésorerie restante
            html += `
                            <div class="breakdown-line treasury-remaining">
                                <span>💎 Trésorerie restante :</span>
                                <span class="${team1Spending.remainingTreasury === 0 ? 'zero-treasury' : ''}">
                                    ${Utils.formatNumber(team1Spending.remainingTreasury)} PO
                                </span>
                            </div>
            `;

            // Avertissement si petite monnaie perdue
            if (team1Spending.remainingPetiteMonnaie > 0) {
                html += `
                            <div class="petite-monnaie-warning">
                                ⚠️ ${Utils.formatNumber(team1Spending.remainingPetiteMonnaie)} PO de petite monnaie non utilisée (perdue)
                            </div>
                `;
            }

            html += `
                        </div>
                    </div>
                </div>
            `;
        }

        // Équipe 2
        if (team2Inducements.length > 0) {
            html += `
                <div class="team-selected-inducements">
                    <h5>🚌 ${this.matchData.team2.name || 'Équipe 2'}</h5>
                    <div class="inducements-summary">
            `;

            team2Inducements.forEach(item => {
                html += `
                    <div class="inducement-summary-item">
                        <span class="inducement-summary-name">${item.name}</span>
                        <span class="inducement-summary-qty">x${item.qty}</span>
                        <span class="inducement-summary-cost">${Utils.formatNumber(item.totalCost)} PO</span>
                    </div>
                `;
            });

            // Afficher le total et la décomposition
            html += `
                        <div class="inducement-summary-total">
                            <span>Total dépensé :</span>
                            <span>${Utils.formatNumber(team2Spending.totalCost)} PO</span>
                        </div>
                        <div class="inducement-summary-breakdown">
                            <div class="breakdown-line">
                                <span>💰 Petite monnaie utilisée :</span>
                                <span>${Utils.formatNumber(team2Spending.spentFromPetiteMonnaie)} PO</span>
                            </div>
                            <div class="breakdown-line">
                                <span>🏦 Trésorerie utilisée :</span>
                                <span>${Utils.formatNumber(team2Spending.spentFromTreasury)} PO</span>
                            </div>
            `;

            // NOUVEAU : Ajouter la trésorerie restante
            html += `
                            <div class="breakdown-line treasury-remaining">
                                <span>💎 Trésorerie restante :</span>
                                <span class="${team2Spending.remainingTreasury === 0 ? 'zero-treasury' : ''}">
                                    ${Utils.formatNumber(team2Spending.remainingTreasury)} PO
                                </span>
                            </div>
            `;

            // Avertissement si petite monnaie perdue
            if (team2Spending.remainingPetiteMonnaie > 0) {
                html += `
                            <div class="petite-monnaie-warning">
                                ⚠️ ${Utils.formatNumber(team2Spending.remainingPetiteMonnaie)} PO de petite monnaie non utilisée (perdue)
                            </div>
                `;
            }

            html += `
                        </div>
                    </div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    getTeamInducementsList(team) {
        const items = this.matchData.inducements[`team${team}Items`];
        const list = [];

        if (items) {
            Object.keys(items).forEach(name => {
                if (items[name] > 0) {
                    const inducement = AppConfig.gameData.inducements.find(ind => ind.name === name);
                    if (inducement) {
                        list.push({
                            name: name,
                            qty: items[name],
                            cost: inducement.cost,
                            totalCost: inducement.cost * items[name]
                        });
                    }
                }
            });
        }

        return list;
    }

    getKickoffSection() {
        return `
            <div class="step-section">
                <div class="step-header">
                    <div class="step-number">6</div>
                    <div class="step-title">Événements du Coup d'Envoi</div>
                </div>
                <div class="explanation-box">
                    <p><strong>Règle :</strong> À chaque coup d'envoi (début de match, après un TD), lancez 2D6</p>
                    <p>L'événement peut donner des bonus, permettre des actions spéciales, ou modifier le jeu</p>
                </div>
                <div class="dice-controls">
                    <button class="dice-btn" data-dice-type="kickoff" onclick="app.rollKickoffEvent()">
                        🎲 Lancer 2D6 pour l'Événement
                    </button>
                    <input type="number" class="dice-result" id="kickoff-result"
                        value="" min="2" max="12"
                        onchange="app.updateKickoffEvent()">
                </div>
                <div id="kickoff-description" class="result-box" style="display: none;"></div>

                ${this.getKickoffHistory()}
            </div>
        `;
    }

    rollKickoffEvent() {
        const roll = Utils.getRandomInt(2, 12);
        const resultInput = document.getElementById('kickoff-result');

        if (resultInput) {
            // Animation visuelle du dé
            resultInput.style.backgroundColor = '#fffacd';
            resultInput.value = roll;

            // Déclencher manuellement l'événement onchange
            this.updateKickoffEvent();

            // Remettre la couleur normale après l'animation
            setTimeout(() => {
                resultInput.style.backgroundColor = '';
            }, 500);
        }

        // Feedback tactile
        Utils.vibrate(50);
    }

// === CORRECTIONS POUR www/js/app.js ===

// 1. REMPLACER la méthode getKickoffSection() par cette version corrigée :

    getKickoffSection() {
        const kickoffEvents = this.matchData.kickoffEvents || [];

        return `
            <div class="step-section">
                <div class="step-header">
                    <div class="step-number">6</div>
                    <div class="step-title">Événements du Coup d'Envoi</div>
                </div>
                <div class="explanation-box">
                    <p><strong>Règle :</strong> À chaque coup d'envoi (début de match, après un TD), lancez 2D6</p>
                    <p>L'événement peut donner des bonus, permettre des actions spéciales, ou modifier le jeu</p>
                </div>
                <div class="dice-controls">
                    <button class="dice-btn" data-dice-type="kickoff" onclick="app.rollKickoffEvent()">
                        🎲 Lancer 2D6 pour l'Événement
                    </button>
                    <input type="number" class="dice-result" id="kickoff-result"
                        value="" min="2" max="12"
                        onchange="app.updateKickoffEvent()">
                </div>
                <div id="kickoff-description" class="result-box" style="display: none;"></div>

                ${this.getKickoffHistory()}
            </div>
        `;
    }

    updateKickoffEvent() {
        const roll = parseInt(document.getElementById('kickoff-result').value) || 0;

        const kickoffEvents = {
            2: "🌪️ Appelez l'arbitre : chaque coach reçoit un pot de vin pour le match.",
            3: "⏱️ Temps mort : si le pion de l'équipe qui engage indique le tour 4,5 ou 6 (6,7 ou 8 au Blood Bowl à 11), les 2 coachs reculent leur pion de tour d'une case. Sinon, les 2 coachs avancent leur pion d'une case.",
            4: "🛡️ Défense solide : 1d3+3 joueurs de l'équipe qui engage peuvent être retirés et replacés à des emplacements différents en suivant les règles de positionnement habituelles.",
            5: "⬆️ Coup de pied haut : 1 joueur « démarqué » peut se placer sur la case où va tomber la balle.",
            6: "👥 Fan en folie : chaque coach jette 1d6+cheerleaders. Le coach avec le résultat le plus élevé gagne un jet sur le tableau de prières à Nuffle. En cas d'égalité, il n'y a pas de jet de prières.",
            7: "🎯 Coaching brillant : chaque coach jette 1d6+assistants. Le coach avec le résultat le plus élevé gagne une relance d'équipe supplémentaire pour la phase à venir. Si non utilisée, elle est perdue. En cas d'égalité, aucun coach ne gagne de relance.",
            8: "🌤️ Météo capricieuse : effectuez un nouveau jet sur le tableau de météo. Si le résultat donne 'Conditions idéales', le ballon ricoche avant d'atterrir.",
            9: "⚡ Surprise : 1d3+3 joueurs de l'équipe en réception peuvent bouger d'une case dans n'importe quelle direction.",
            10: "💥 Blitz : 1d3+3 joueurs « démarqués » de l'équipe qui engage peuvent être activés pour faire une action de mouvement. 1 joueur peut faire un Blitz et 1 joueur peut lancer un coéquipier. Si un joueur chute ou est plaqué, aucun autre joueur ne peut être activé et le blitz prend fin.",
            11: "🎭 Arbitre officieux : chaque coach jette 1d6+FP. Le coach qui obtient le plus bas résultat désigne au hasard un de ses joueurs parmi ceux qui sont sur le terrain. Jetez 1D6. Sur 2+, le joueur désigné est mis à terre et sonné. Sur 1, le joueur est expulsé. En cas d'égalité, les 2 coachs désignent un joueur.",
            12: "🔥 Invasion de terrain : chaque coach jette 1d6+FP. Le coach qui obtient le plus bas résultat désigne au hasard D3 joueurs de son équipe qui sont sur le terrain. Tous les joueurs désignés sont mis à terre et sonnés. En cas d'égalité, les 2 coachs désignent D3 joueurs."
        };

        if (roll >= 2 && roll <= 12) {
            const eventText = kickoffEvents[roll] || "Événement inconnu.";

            // Créer l'objet événement avec le jet et le texte
            const eventObj = {
                roll: roll,
                text: eventText,
                timestamp: Date.now()
            };

            // Ajouter à l'historique
            if (!this.matchData.kickoffEvents) {
                this.matchData.kickoffEvents = [];
            }
            this.matchData.kickoffEvents.push(eventObj);

            // Mettre à jour l'affichage de la description
            const descDiv = document.getElementById('kickoff-description');
            if (descDiv) {
                descDiv.style.display = 'block';
                descDiv.className = 'result-box warning';
                descDiv.innerHTML = `<p><strong>Résultat (${roll}):</strong> ${eventText}</p>`;
            }

            // Mettre à jour UNIQUEMENT l'historique sans recharger tout l'onglet
            const historyContainer = document.querySelector('.kickoff-history');
            if (historyContainer) {
                historyContainer.outerHTML = this.getKickoffHistory();
            }

            this.saveState();
        }
    }

    rollKickoffEvent() {
        const roll = Utils.getRandomInt(2, 12);
        const resultInput = document.getElementById('kickoff-result');

        if (resultInput) {
            // Animation visuelle du dé
            resultInput.classList.add('dice-rolling');
            resultInput.value = roll;

            // Déclencher manuellement l'événement onchange
            this.updateKickoffEvent();

            // Retirer l'animation après 500ms
            setTimeout(() => {
                resultInput.classList.remove('dice-rolling');
            }, 500);
        }

        // Feedback tactile
        Utils.vibrate(50);
    }

    getKickoffHistory() {
        const events = this.matchData.kickoffEvents || [];

        if (events.length === 0) {
            return '';
        }

        return `
            <div class="kickoff-history">
                <h5>📜 Historique des événements</h5>
                <div class="history-list">
                    ${events.map((event, index) => {
                        // Support pour l'ancien format (string) et le nouveau format (objet)
                        const roll = event.roll || '';
                        const text = event.text || event;

                        return `
                            <div class="history-item" data-index="${index}">
                                <span class="history-order">#${index + 1}</span>
                                <span class="history-roll">${roll ? `🎲 ${roll}` : ''}</span>
                                <span class="history-text">${text}</span>
                                <div class="history-actions">
                                    <button class="btn-edit-event"
                                        onclick="app.editKickoffEvent(${index})"
                                        title="Modifier cet événement">
                                        ✏️
                                    </button>
                                    <button class="btn-remove-event"
                                        onclick="app.removeKickoffEvent(${index})"
                                        title="Supprimer cet événement">
                                        ❌
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="history-summary">
                    <small>Total: ${events.length} événement${events.length > 1 ? 's' : ''}</small>
                </div>
            </div>
        `;
    }

    removeKickoffEvent(index) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet événement de l\'historique ?')) {
            // Supprimer l'événement de la liste
            this.matchData.kickoffEvents.splice(index, 1);

            // Sauvegarder les changements
            this.saveState();

            // Mettre à jour l'historique
            const historyContainer = document.querySelector('.kickoff-history');
            if (historyContainer) {
                if (this.matchData.kickoffEvents.length === 0) {
                    // Si plus d'événements, retirer tout le conteneur
                    historyContainer.remove();
                } else {
                    // Sinon, mettre à jour le contenu
                    historyContainer.outerHTML = this.getKickoffHistory();
                }
            }

            // Feedback
            Utils.showNotification('Événement supprimé', 'success');
            Utils.vibrate(20);
        }
    }

    editKickoffEvent(index) {
        const events = this.matchData.kickoffEvents || [];
        if (index >= 0 && index < events.length) {
            const currentEvent = events[index];
            const currentRoll = currentEvent.roll || '';

            // Demander le nouveau jet
            const newRoll = prompt(`Modifier l'événement #${index + 1}\nEntrez le nouveau résultat du jet (2-12) :`, currentRoll);

            if (newRoll !== null && newRoll !== '') {
                const roll = parseInt(newRoll);

                if (roll >= 2 && roll <= 12) {
                    const kickoffEventsMap = {
                        2: "🌪️ Appelez l'arbitre : chaque coach reçoit un pot de vin pour le match.",
                        3: "⏱️ Temps mort : si le pion de l'équipe qui engage indique le tour 4,5 ou 6 (6,7 ou 8 au Blood Bowl à 11), les 2 coachs reculent leur pion de tour d'une case. Sinon, les 2 coachs avancent leur pion d'une case.",
                        4: "🛡️ Défense solide : 1d3+3 joueurs de l'équipe qui engage peuvent être retirés et replacés à des emplacements différents en suivant les règles de positionnement habituelles.",
                        5: "⬆️ Coup de pied haut : 1 joueur « démarqué » peut se placer sur la case où va tomber la balle.",
                        6: "👥 Fan en folie : chaque coach jette 1d6+cheerleaders. Le coach avec le résultat le plus élevé gagne un jet sur le tableau de prières à Nuffle. En cas d'égalité, il n'y a pas de jet de prières.",
                        7: "🎯 Coaching brillant : chaque coach jette 1d6+assistants. Le coach avec le résultat le plus élevé gagne une relance d'équipe supplémentaire pour la phase à venir. Si non utilisée, elle est perdue. En cas d'égalité, aucun coach ne gagne de relance.",
                        8: "🌤️ Météo capricieuse : effectuez un nouveau jet sur le tableau de météo. Si le résultat donne 'Conditions idéales', le ballon ricoche avant d'atterrir.",
                        9: "⚡ Surprise : 1d3+3 joueurs de l'équipe en réception peuvent bouger d'une case dans n'importe quelle direction.",
                        10: "💥 Blitz : 1d3+3 joueurs « démarqués » de l'équipe qui engage peuvent être activés pour faire une action de mouvement. 1 joueur peut faire un Blitz et 1 joueur peut lancer un coéquipier. Si un joueur chute ou est plaqué, aucun autre joueur ne peut être activé et le blitz prend fin.",
                        11: "🎭 Arbitre officieux : chaque coach jette 1d6+FP. Le coach qui obtient le plus bas résultat désigne au hasard un de ses joueurs parmi ceux qui sont sur le terrain. Jetez 1D6. Sur 2+, le joueur désigné est mis à terre et sonné. Sur 1, le joueur est expulsé. En cas d'égalité, les 2 coachs désignent un joueur.",
                        12: "🔥 Invasion de terrain : chaque coach jette 1d6+FP. Le coach qui obtient le plus bas résultat désigne au hasard D3 joueurs de son équipe qui sont sur le terrain. Tous les joueurs désignés sont mis à terre et sonnés. En cas d'égalité, les 2 coachs désignent D3 joueurs."
                    };

                    // Mettre à jour l'événement
                    events[index] = {
                        roll: roll,
                        text: kickoffEventsMap[roll] || "Événement inconnu.",
                        timestamp: currentEvent.timestamp || Date.now()
                    };

                    // Sauvegarder
                    this.saveState();

                    // Mettre à jour l'affichage
                    const historyContainer = document.querySelector('.kickoff-history');
                    if (historyContainer) {
                        historyContainer.outerHTML = this.getKickoffHistory();
                    }

                    // Feedback
                    Utils.showNotification('Événement modifié', 'success');
                    Utils.vibrate(20);
                } else {
                    alert('Veuillez entrer un nombre entre 2 et 12');
                }
            }
        }
    }

    clearKickoffHistory() {
        if (this.matchData.kickoffEvents && this.matchData.kickoffEvents.length > 0) {
            if (confirm(`Êtes-vous sûr de vouloir effacer tout l'historique ?\n${this.matchData.kickoffEvents.length} événement(s) seront supprimés.`)) {
                this.matchData.kickoffEvents = [];
                this.saveState();

                // Retirer l'historique de l'affichage
                const historyContainer = document.querySelector('.kickoff-history');
                if (historyContainer) {
                    historyContainer.remove();
                }

                // Réinitialiser le champ de résultat
                const resultInput = document.getElementById('kickoff-result');
                if (resultInput) {
                    resultInput.value = '';
                }

                // Cacher la description
                const descDiv = document.getElementById('kickoff-description');
                if (descDiv) {
                    descDiv.style.display = 'none';
                }

                Utils.showNotification('Historique effacé', 'info');
                Utils.vibrate(20);
            }
        } else {
            Utils.showNotification('Aucun événement à effacer', 'info');
        }
    }

    getPlayersActionsSection() {
        return `
            <div class="step-section">
                <div class="step-header">
                    <div class="step-number">7</div>
                    <div class="step-title">Actions des Joueurs</div>
                </div>
                <div class="explanation-box">
                    <p><strong>Important :</strong> Cochez les cases au fur et à mesure que vos joueurs réalisent des actions</p>
                    <p><strong>REU :</strong> Passe ou Lancer précis (1 XP) | <strong>DET :</strong> Détournement (1 XP)</p>
                    <p><strong>INT :</strong> Interception (2 XP) | <strong>ELIM :</strong> Élimination (2 XP)</p>
                    <p><strong>TD :</strong> Touchdown (3 XP) | <strong>JDM :</strong> Joueur du Match (4 XP)</p>
                </div>

                <div class="players-tabs">
                    <div class="players-tab-buttons">
                        <button class="players-tab-btn active" onclick="app.showPlayersTab(1)">
                            🏠 ${this.matchData.team1.name || 'Équipe 1'}
                        </button>
                        <button class="players-tab-btn" onclick="app.showPlayersTab(2)">
                            🚌 ${this.matchData.team2.name || 'Équipe 2'}
                        </button>
                    </div>

                    <div class="players-tab-content">
                        <div id="players-team-1" class="team-players-panel active">
                            ${this.getTeamPlayersTable(1)}
                        </div>
                        <div id="players-team-2" class="team-players-panel">
                            ${this.getTeamPlayersTable(2)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getMVPReminderSection() {
        return `
            <div class="step-section">
                <div class="step-header">
                    <div class="step-number">8</div>
                    <div class="step-title">Joueur du Match (JDM)</div>
                </div>
                <div class="explanation-box">
                    <h4>🌟 Rappel Important</h4>
                    <p><strong>À la fin du match :</strong> Tirez au hasard un JDM pour chaque équipe</p>
                    <p><strong>Comment faire :</strong></p>
                    <ol style="margin: 10px 0; padding-left: 20px;">
                        <li>Si le joueur n'est pas déjà dans le tableau, ajoutez-le avec le bouton "➕ Ajouter"</li>
                        <li>Cochez la case JDM pour le joueur tiré (4 XP bonus)</li>
                        <li>Un seul JDM par équipe (cocher une case décoche automatiquement l'autre)</li>
                    </ol>
                    <p style="margin-top: 10px;"><em>💡 Note : Les morts, mercenaires et champions ne peuvent pas être JDM</em></p>
                </div>
            </div>
        `;
    }

    getTeamPlayersTable(team) {
        const teamData = this.matchData[`team${team}`];
        const players = teamData.players || [];

        return `
            <div class="team-players-section">
                <h4 style="color: var(--primary-color); margin-bottom: 15px;">
                    ${team === 1 ? '🏠' : '🚌'} ${teamData.name || `Équipe ${team}`}
                    <button class="add-player-btn" onclick="app.addPlayer(${team})">➕ Ajouter Joueur</button>
                </h4>
                <div class="table-wrapper">
                    <table class="player-table">
                        <thead>
                            <tr>
                                <th class="tooltip" data-tooltip="Nom du joueur">Joueur</th>
                                <th class="tooltip" data-tooltip="Passe/Lancer précis (1XP)">REU</th>
                                <th class="tooltip" data-tooltip="Détournement (1XP)">DET</th>
                                <th class="tooltip" data-tooltip="Interception (2XP)">INT</th>
                                <th class="tooltip" data-tooltip="Élimination (2XP)">ELIM</th>
                                <th class="tooltip" data-tooltip="Touchdown (3XP)">TD</th>
                                <th class="tooltip" data-tooltip="Joueur du Match (4XP)">JDM</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="team${team}-players">
                            ${players.map(player => this.getPlayerRowHTML(team, player)).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    getPlayerRowHTML(team, player) {
        // S'assurer que les actions existent avec des valeurs par défaut
        if (!player.actions) {
            player.actions = {
                reu: 0,
                det: 0,
                int: 0,
                elim: 0,
                td: 0,
                jdm: false
            };
        }

        return `
            <tr data-player-id="${player.id}">
                <td>
                    <input type="text" class="player-name-input"
                        placeholder="Nom du joueur"
                        value="${player.name || ''}"
                        data-team="${team}"
                        data-player="${player.id}"
                        onchange="app.updatePlayerName(${team}, '${player.id}', this.value)">
                </td>
                <td class="action-counter-cell">
                    <div class="action-counter">
                        <button class="counter-btn minus" onclick="app.changePlayerAction(${team}, '${player.id}', 'reu', -1)">-</button>
                        <span class="counter-value" id="reu-${team}-${player.id}">${player.actions.reu || 0}</span>
                        <button class="counter-btn plus" onclick="app.changePlayerAction(${team}, '${player.id}', 'reu', 1)">+</button>
                    </div>
                </td>
                <td class="action-counter-cell">
                    <div class="action-counter">
                        <button class="counter-btn minus" onclick="app.changePlayerAction(${team}, '${player.id}', 'det', -1)">-</button>
                        <span class="counter-value" id="det-${team}-${player.id}">${player.actions.det || 0}</span>
                        <button class="counter-btn plus" onclick="app.changePlayerAction(${team}, '${player.id}', 'det', 1)">+</button>
                    </div>
                </td>
                <td class="action-counter-cell">
                    <div class="action-counter">
                        <button class="counter-btn minus" onclick="app.changePlayerAction(${team}, '${player.id}', 'int', -1)">-</button>
                        <span class="counter-value" id="int-${team}-${player.id}">${player.actions.int || 0}</span>
                        <button class="counter-btn plus" onclick="app.changePlayerAction(${team}, '${player.id}', 'int', 1)">+</button>
                    </div>
                </td>
                <td class="action-counter-cell">
                    <div class="action-counter">
                        <button class="counter-btn minus" onclick="app.changePlayerAction(${team}, '${player.id}', 'elim', -1)">-</button>
                        <span class="counter-value" id="elim-${team}-${player.id}">${player.actions.elim || 0}</span>
                        <button class="counter-btn plus" onclick="app.changePlayerAction(${team}, '${player.id}', 'elim', 1)">+</button>
                    </div>
                </td>
                <td class="action-counter-cell">
                    <div class="action-counter td-counter">
                        <button class="counter-btn minus" onclick="app.changePlayerAction(${team}, '${player.id}', 'td', -1)">-</button>
                        <span class="counter-value" id="td-${team}-${player.id}">${player.actions.td || 0}</span>
                        <button class="counter-btn plus" onclick="app.changePlayerAction(${team}, '${player.id}', 'td', 1)">+</button>
                    </div>
                </td>
                <td>
                    <input type="checkbox" class="action-checkbox"
                        data-team="${team}"
                        data-player="${player.id}"
                        data-action="jdm"
                        data-xp="4"
                        ${player.actions && player.actions.jdm ? 'checked' : ''}
                        onchange="app.updatePlayerAction(${team}, '${player.id}', 'jdm', this.checked)">
                </td>
                <td>
                    <button class="btn-remove-player" onclick="app.removePlayer(${team}, '${player.id}')">❌</button>
                </td>
            </tr>
        `;
    }

    updateKickoffEvent() {
        const roll = parseInt(document.getElementById('kickoff-result').value) || 0;

        const kickoffEvents = {
            2: "🌪️ Appelez l'arbitre : chaque coach reçoit un pot de vin pour le match.",
            3: "⏱️ Temps mort : si le pion de l'équipe qui engage indique le tour 4,5 ou 6 (6,7 ou 8 au Blood Bowl à 11), les 2 coachs reculent leur pion de tour d'une case. Sinon, les 2 coachs avancent leur pion d'une case.",
            4: "🛡️ Défense solide : 1d3+3 joueurs de l'équipe qui engage peuvent être retirés et replacés à des emplacements différents en suivant les règles de positionnement habituelles.",
            5: "⬆️ Coup de pied haut : 1 joueur « démarqué » peut se placer sur la case où va tomber la balle.",
            6: "👥 Fan en folie : chaque coach jette 1d6+cheerleaders. Le coach avec le résultat le plus élevé gagne un jet sur le tableau de prières à Nuffle. En cas d'égalité, il n'y a pas de jet de prières.",
            7: "🎯 Coaching brillant : chaque coach jette 1d6+assistants. Le coach avec le résultat le plus élevé gagne une relance d'équipe supplémentaire pour la phase à venir. Si non utilisée, elle est perdue. En cas d'égalité, aucun coach ne gagne de relance.",
            8: "🌤️ Météo capricieuse : effectuez un nouveau jet sur le tableau de météo. Si le résultat donne 'Conditions idéales', le ballon ricoche avant d'atterrir.",
            9: "⚡ Surprise : 1d3+3 joueurs de l'équipe en réception peuvent bouger d'une case dans n'importe quelle direction.",
            10: "💥 Blitz : 1d3+3 joueurs « démarqués » de l'équipe qui engage peuvent être activés pour faire une action de mouvement. 1 joueur peut faire un Blitz et 1 joueur peut lancer un coéquipier. Si un joueur chute ou est plaqué, aucun autre joueur ne peut être activé et le blitz prend fin.",
            11: "🎭 Arbitre officieux : chaque coach jette 1d6+FP. Le coach qui obtient le plus bas résultat désigne au hasard un de ses joueurs parmi ceux qui sont sur le terrain. Jetez 1D6. Sur 2+, le joueur désigné est mis à terre et sonné. Sur 1, le joueur est expulsé. En cas d'égalité, les 2 coachs désignent un joueur.",
            12: "🔥 Invasion de terrain : chaque coach jette 1d6+FP. Le coach qui obtient le plus bas résultat désigne au hasard D3 joueurs de son équipe qui sont sur le terrain. Tous les joueurs désignés sont mis à terre et sonnés. En cas d'égalité, les 2 coachs désignent D3 joueurs."
        };

        if (roll >= 2 && roll <= 12) {
            const eventText = kickoffEvents[roll] || "Événement inconnu.";

            // Créer l'objet événement avec le jet et le texte
            const eventObj = {
                roll: roll,
                text: eventText,
                timestamp: Date.now()
            };

            // Ajouter à l'historique
            if (!this.matchData.kickoffEvents) {
                this.matchData.kickoffEvents = [];
            }
            this.matchData.kickoffEvents.push(eventObj);

            // Mettre à jour l'affichage de la description
            const descDiv = document.getElementById('kickoff-description');
            if (descDiv) {
                descDiv.style.display = 'block';
                descDiv.className = 'result-box warning';
                descDiv.innerHTML = `<p><strong>Résultat (${roll}):</strong> ${eventText}</p>`;
            }

            // CORRECTION : Vérifier si l'historique existe déjà
            const historyContainer = document.querySelector('.kickoff-history');
            if (historyContainer) {
                // Si l'historique existe, le mettre à jour
                historyContainer.outerHTML = this.getKickoffHistory();
            } else {
                // Si l'historique n'existe pas, l'ajouter après la description
                const kickoffSection = descDiv.closest('.step-section');
                if (kickoffSection) {
                    const historyHTML = this.getKickoffHistory();
                    kickoffSection.insertAdjacentHTML('beforeend', historyHTML);
                }
            }

            this.saveState();
        }
    }

    // Gestion des joueurs
    addPlayer(team) {
        const playerId = `player-${team}-${Date.now()}`;
        const player = {
            id: playerId,
            name: '',
            xp: 0,
            actions: { reu: false, det: false, int: false, elim: false, td: false, jdm: false }
        };

        if (!this.matchData[`team${team}`].players) {
            this.matchData[`team${team}`].players = [];
        }

        this.matchData[`team${team}`].players.push(player);

        // Ajouter la ligne dans le tableau
        const tbody = document.getElementById(`team${team}-players`);
        if (tbody) {
            const row = document.createElement('tr');
            row.innerHTML = this.getPlayerRowHTML(team, player);
            tbody.appendChild(row);
        }

        this.saveState();
    }

    removePlayer(team, playerId) {
        if (confirm('Supprimer ce joueur ?')) {
            const players = this.matchData[`team${team}`].players;
            const index = players.findIndex(p => p.id === playerId);

            if (index > -1) {
                players.splice(index, 1);

                // Retirer de l'affichage
                const row = document.querySelector(`tr[data-player-id="${playerId}"]`);
                if (row) {
                    row.remove();
                }

                this.saveState();
            }
        }
    }

    updatePlayerName(team, playerId, name) {
        const player = this.matchData[`team${team}`].players.find(p => p.id === playerId);
        if (player) {
            player.name = name.trim();
            this.saveState();
        }
    }

    updatePlayerAction(team, playerId, action, checked) {
        const player = this.matchData[`team${team}`].players.find(p => p.id === playerId);
        if (player) {
            if (!player.actions) {
                player.actions = {};
            }
            player.actions[action] = checked;

            // Recalculer l'XP du joueur
            this.calculatePlayerXP(team, playerId);

            this.saveState();
        }
    }

    changePlayerAction(team, playerId, action, change) {
        const player = this.matchData[`team${team}`].players.find(p => p.id === playerId);
        if (!player) return;

        if (!player.actions) {
            player.actions = {
                reu: 0,
                det: 0,
                int: 0,
                elim: 0,
                td: 0,
                jdm: false
            };
        }

        // Augmenter ou diminuer le compteur (minimum 0)
        const currentValue = player.actions[action] || 0;
        const newValue = Math.max(0, currentValue + change);
        player.actions[action] = newValue;

        // Mettre à jour l'affichage
        const counterElement = document.getElementById(`${action}-${team}-${playerId}`);
        if (counterElement) {
            counterElement.textContent = newValue;
        }

        // Si c'est un TD, mettre à jour le score automatiquement
        if (action === 'td') {
            this.updateTeamScore(team);
        }

        // Recalculer l'XP total du joueur
        this.calculatePlayerXP(team, playerId);

        // Sauvegarder
        this.saveState();

        // Feedback tactile
        Utils.vibrate(10);
    }

    updateTeamScore(team) {
        const players = this.matchData[`team${team}`].players || [];
        let totalTDs = 0;

        players.forEach(player => {
            if (player.actions && player.actions.td) {
                totalTDs += player.actions.td;
            }
        });

        this.matchData[`team${team}`].score = totalTDs;

        // Mettre à jour l'affichage du score
        const scoreElement = document.getElementById(`score${team}`);
        if (scoreElement) {
            scoreElement.textContent = totalTDs;
        }
    }

    calculatePlayerXP(team, playerId) {
        const player = this.matchData[`team${team}`].players.find(p => p.id === playerId);
        if (!player || !player.actions) return 0;

        let totalXP = 0;

        // Calculer l'XP basé sur les compteurs
        totalXP += (player.actions.reu || 0) * 1;   // REU = 1 XP chacun
        totalXP += (player.actions.det || 0) * 1;   // DET = 1 XP chacun
        totalXP += (player.actions.int || 0) * 2;   // INT = 2 XP chacun
        totalXP += (player.actions.elim || 0) * 2;  // ELIM = 2 XP chacun
        totalXP += (player.actions.td || 0) * 3;    // TD = 3 XP chacun
        totalXP += player.actions.jdm ? 4 : 0;      // JDM = 4 XP (unique)

        player.xp = totalXP;
        return totalXP;
    }

    showPlayersTab(team) {
        // Retirer la classe active de tous les boutons et panneaux
        document.querySelectorAll('.players-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.team-players-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        // Activer le bon bouton et panneau
        const buttons = document.querySelectorAll('.players-tab-btn');
        const panels = document.querySelectorAll('.team-players-panel');

        if (buttons[team - 1]) buttons[team - 1].classList.add('active');
        if (panels[team - 1]) panels[team - 1].classList.add('active');
    }

    calculateTeamXP(team) {
        const players = this.matchData[`team${team}`].players || [];
        let totalXP = 0;

        players.forEach(player => {
            if (player.xp) {
                totalXP += player.xp;
            }
        });

        return totalXP;
    }

    getMatchGainsSection() {
        const team1Gains = this.calculateGains(1);
        const team2Gains = this.calculateGains(2);

        // Récupérer le facteur de popularité calculé en avant-match
        const team1Popularity = this.matchData.team1.popularity || 0;
        const team2Popularity = this.matchData.team2.popularity || 0;
        const team1Touchdowns = this.matchData.team1.score || 0;
        const team2Touchdowns = this.matchData.team2.score || 0;

        return `
            <div class="step-section">
                <div class="step-header">
                    <div class="step-number">8</div>
                    <div class="step-title">Gains du Match</div>
                </div>
                <div class="explanation-box">
                    <p><strong>Formule :</strong> 10 000 PO × (Facteur de Popularité + Touchdowns marqués)</p>
                    <p>Le Facteur de Popularité a été calculé en avant-match (D3 + fans dévoués)</p>
                    <p>Une équipe qui concède ne compte pas son facteur de popularité</p>
                </div>
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="label">${this.matchData.team1.name || 'Équipe 1'}</div>
                        <div class="value">${Utils.formatNumber(team1Gains)} PO</div>
                        <div class="gains-calculation">
                            <small>
                                Facteur de Popularité : ${team1Popularity}<br>
                                + Touchdowns marqués : ${team1Touchdowns}<br>
                                = Total : ${team1Popularity + team1Touchdowns}<br>
                                × 10 000 PO = <strong>${Utils.formatNumber(team1Gains)} PO</strong>
                            </small>
                        </div>
                    </div>
                    <div class="summary-item">
                        <div class="label">${this.matchData.team2.name || 'Équipe 2'}</div>
                        <div class="value">${Utils.formatNumber(team2Gains)} PO</div>
                        <div class="gains-calculation">
                            <small>
                                Facteur de Popularité : ${team2Popularity}<br>
                                + Touchdowns marqués : ${team2Touchdowns}<br>
                                = Total : ${team2Popularity + team2Touchdowns}<br>
                                × 10 000 PO = <strong>${Utils.formatNumber(team2Gains)} PO</strong>
                            </small>
                        </div>
                    </div>
                </div>
                <div class="help-text">
                    📝 Rappel : Le Facteur de Popularité (${team1Popularity} et ${team2Popularity}) a été déterminé en avant-match par D3 + fans dévoués
                </div>
            </div>
        `;
    }

    getFansUpdateSection() {
        return `
            <div class="step-section">
                <div class="step-header">
                    <div class="step-number">9</div>
                    <div class="step-title">Mise à Jour des Fans Dévoués</div>
                </div>
                <div class="explanation-box">
                    <p><strong>Gagnant :</strong> Lance 1D6. Si ≥ fans actuels → gagne 1D3 fans</p>
                    <p><strong>Perdant :</strong> Lance 1D6. Si ≤ fans actuels → perd 1D3 fans</p>
                    <p><strong>Match nul :</strong> Pas de changement</p>
                </div>
                <div class="fans-update-controls">
                    <div class="dice-controls">
                        <span><strong>${this.matchData.team1.name || 'Équipe 1'}</strong>
                        (${this.getMatchResult(1)}) - Fans actuels: ${this.matchData.team1.fans} :</span>
                        <button class="dice-btn" onclick="app.rollFansUpdate(1)">🎲 Test Fans</button>
                        <input type="number" class="dice-result" id="fans1-roll"
                            value="${this.matchData.team1.fansUpdateRoll || ''}" min="1" max="6" onchange="app.updateFans(1)">
                        <span id="fans1-result">${this.matchData.team1.fansUpdateResult || ''}</span>
                    </div>
                    <div class="dice-controls">
                        <span><strong>${this.matchData.team2.name || 'Équipe 2'}</strong>
                        (${this.getMatchResult(2)}) - Fans actuels: ${this.matchData.team2.fans} :</span>
                        <button class="dice-btn" onclick="app.rollFansUpdate(2)">🎲 Test Fans</button>
                        <input type="number" class="dice-result" id="fans2-roll"
                            value="${this.matchData.team2.fansUpdateRoll || ''}" min="1" max="6" onchange="app.updateFans(2)">
                        <span id="fans2-result">${this.matchData.team2.fansUpdateResult || ''}</span>
                    </div>
                </div>
                <div id="fans-update-info" class="result-box" style="${(this.matchData.team1.fansUpdateRoll || this.matchData.team2.fansUpdateRoll) ? '' : 'display: none;'}">
                    <p>Mise à jour des fans terminée</p>
                </div>
            </div>
        `;
    }

    getExperienceSection() {
        const team1Players = this.matchData.team1.players || [];
        const team2Players = this.matchData.team2.players || [];

        // Calculer les totaux XP
        let team1TotalXP = 0;
        let team2TotalXP = 0;

        team1Players.forEach(p => {
            team1TotalXP += this.calculatePlayerXP(1, p.id);
        });

        team2Players.forEach(p => {
            team2TotalXP += this.calculatePlayerXP(2, p.id);
        });

        return `
            <div class="step-section">
                <div class="step-header">
                    <div class="step-number">3</div>
                    <div class="step-title">Expérience des Joueurs</div>
                </div>
                <div class="explanation-box">
                    <p><strong>Calcul automatique de l'XP basé sur les actions du match</strong></p>
                    <p>REU/DET = 1 XP | INT/ELIM = 2 XP | TD = 3 XP | JDM = 4 XP</p>
                </div>

                <!-- Équipe 1 -->
                <div class="team-experience-section">
                    <h4>🏠 ${this.matchData.team1.name || 'Équipe 1'}</h4>
                    ${this.getTeamExperienceTable(1, team1Players)}
                    <div class="team-xp-total">
                        Total XP équipe : ${team1TotalXP} XP
                    </div>
                </div>

                <!-- Équipe 2 -->
                <div class="team-experience-section" style="margin-top: 20px;">
                    <h4>🚌 ${this.matchData.team2.name || 'Équipe 2'}</h4>
                    ${this.getTeamExperienceTable(2, team2Players)}
                    <div class="team-xp-total">
                        Total XP équipe : ${team2TotalXP} XP
                    </div>
                </div>
            </div>
        `;
    }

    getTeamExperienceTable(team, players) {
        if (players.length === 0) {
            return '<p style="text-align: center; color: #666;">Aucun joueur dans cette équipe</p>';
        }

        // Filtrer uniquement les joueurs qui ont fait des actions
        const activePlayers = players.filter(p => {
            const actions = p.actions || {};
            return actions.reu > 0 || actions.det > 0 || actions.int > 0 ||
                   actions.elim > 0 || actions.td > 0 || actions.jdm;
        });

        if (activePlayers.length === 0) {
            return '<p style="text-align: center; color: #666;">Aucun joueur n\'a réalisé d\'action durant ce match</p>';
        }

        let html = `
            <table class="experience-summary-table">
                <thead>
                    <tr>
                        <th class="player-name">Joueur</th>
                        <th>REU</th>
                        <th>DET</th>
                        <th>INT</th>
                        <th>ELIM</th>
                        <th>TD</th>
                        <th>JDM</th>
                        <th class="xp-total">Total XP</th>
                    </tr>
                </thead>
                <tbody>
        `;

        activePlayers.forEach(player => {
            const actions = player.actions || {};
            const xp = this.calculatePlayerXP(team, player.id);

            html += `
                <tr>
                    <td class="player-name">${player.name || 'Joueur sans nom'}</td>
                    <td>${actions.reu > 0 ? actions.reu : '-'}</td>
                    <td>${actions.det > 0 ? actions.det : '-'}</td>
                    <td>${actions.int > 0 ? actions.int : '-'}</td>
                    <td>${actions.elim > 0 ? actions.elim : '-'}</td>
                    <td>${actions.td > 0 ? `<strong>${actions.td}</strong>` : '-'}</td>
                    <td>${actions.jdm ? '⭐' : '-'}</td>
                    <td class="xp-total">${xp} XP</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        return html;
    }

    getPlayerSalesSection() {
        return `
            <div class="step-section">
                <div class="step-header">
                    <div class="step-number">12</div>
                    <div class="step-title">Vente de Joueurs</div>
                </div>
                <div class="explanation-box">
                    <p><strong>Règle :</strong> Les coachs professionnels peuvent racheter vos joueurs selon leur rang</p>
                    <p><strong>Test :</strong> Expérimenté (6), Vétéran (5), Future Star (4), Star (3), Super Star (2), Légende (automatique)</p>
                    <p>Une équipe avec 4+ staff (assistants+pom-pom) a une relance pour garder le joueur</p>
                </div>

                <div class="player-sales-grid">
                    <div class="team-sales-section">
                        <h5>🏠 ${this.matchData.team1.name || 'Équipe 1'}</h5>
                        <div id="team1-sales-list" class="sales-list">
                            ${this.getTeamSalesList(1)}
                        </div>
                        <button class="btn btn-secondary" onclick="app.addSoldPlayer(1)">
                            ➕ Ajouter un joueur vendu
                        </button>
                    </div>

                    <div class="team-sales-section">
                        <h5>🚌 ${this.matchData.team2.name || 'Équipe 2'}</h5>
                        <div id="team2-sales-list" class="sales-list">
                            ${this.getTeamSalesList(2)}
                        </div>
                        <button class="btn btn-secondary" onclick="app.addSoldPlayer(2)">
                            ➕ Ajouter un joueur vendu
                        </button>
                    </div>
                </div>

                <div class="help-text">
                    📝 Faites vos jets de dés selon le rang de vos joueurs, puis notez ceux qui ont été vendus ci-dessus
                </div>
            </div>
        `;
    }

    getPlayerPurchasesSection() {
        // Calculer le budget disponible pour chaque équipe
        const team1Budget = this.calculateAvailableBudget(1);
        const team2Budget = this.calculateAvailableBudget(2);

        // Récupérer les montants de trésorerie dépensée
        let team1TreasurySpent = this.matchData.team1.treasurySpentOnInducements || 0;
        let team2TreasurySpent = this.matchData.team2.treasurySpentOnInducements || 0;

        // Si pas encore définis, calculer
        if (team1TreasurySpent === 0 && this.hasInducements(1)) {
            const spending = this.calculateInducementSpending(1);
            team1TreasurySpent = spending.spentFromTreasury;
        }
        if (team2TreasurySpent === 0 && this.hasInducements(2)) {
            const spending = this.calculateInducementSpending(2);
            team2TreasurySpent = spending.spentFromTreasury;
        }

        return `
            <div class="step-section">
                <div class="step-header">
                    <div class="step-number">13</div>
                    <div class="step-title">Achat de Joueurs</div>
                </div>
                <div class="explanation-box">
                    <p><strong>Règle :</strong> Les coachs peuvent dépenser leur trésorerie pour acheter de nouveaux joueurs</p>
                    <p><strong>Important :</strong> Le coût sera déduit de la trésorerie finale</p>
                    <p>Notez le nom, le poste et le coût de chaque nouveau joueur acheté</p>
                </div>

                <div class="player-purchases-grid">
                    <div class="team-purchases-section">
                        <h5>🏠 ${this.matchData.team1.name || 'Équipe 1'}</h5>

                        <!-- Affichage du budget disponible -->
                        <div class="budget-display">
                            <div class="budget-available">
                                <span class="budget-label">💰 Budget disponible :</span>
                                <span class="budget-amount ${team1Budget < 0 ? 'negative' : ''}">${Utils.formatNumber(team1Budget)} PO</span>
                            </div>
                            <div class="budget-breakdown">
                                <small>Trésorerie initiale (${Utils.formatNumber(this.matchData.team1.treasury || 0)})
                                + Gains (${Utils.formatNumber(this.calculateGains(1))})
                                + Ventes (${Utils.formatNumber(this.getPlayerSalesTotal(1))})
                                ${team1TreasurySpent > 0 ? `- Coups de pouce (${Utils.formatNumber(team1TreasurySpent)})` : ''}</small>
                            </div>
                        </div>

                        <div id="team1-purchases-list" class="purchases-list">
                            ${this.getTeamPurchasesList(1)}
                        </div>
                        <button class="btn btn-secondary" onclick="app.addPurchasedPlayer(1)">
                            ➕ Ajouter un joueur acheté
                        </button>
                    </div>

                    <div class="team-purchases-section">
                        <h5>🚌 ${this.matchData.team2.name || 'Équipe 2'}</h5>

                        <!-- Affichage du budget disponible -->
                        <div class="budget-display">
                            <div class="budget-available">
                                <span class="budget-label">💰 Budget disponible :</span>
                                <span class="budget-amount ${team2Budget < 0 ? 'negative' : ''}">${Utils.formatNumber(team2Budget)} PO</span>
                            </div>
                            <div class="budget-breakdown">
                                <small>Trésorerie initiale (${Utils.formatNumber(this.matchData.team2.treasury || 0)})
                                + Gains (${Utils.formatNumber(this.calculateGains(2))})
                                + Ventes (${Utils.formatNumber(this.getPlayerSalesTotal(2))})
                                ${team2TreasurySpent > 0 ? `- Coups de pouce (${Utils.formatNumber(team2TreasurySpent)})` : ''}</small>
                            </div>
                        </div>

                        <div id="team2-purchases-list" class="purchases-list">
                            ${this.getTeamPurchasesList(2)}
                        </div>
                        <button class="btn btn-secondary" onclick="app.addPurchasedPlayer(2)">
                            ➕ Ajouter un joueur acheté
                        </button>
                    </div>
                </div>

                <div class="help-text">
                    💡 Les achats de joueurs seront automatiquement déduits de votre trésorerie dans la section Erreurs Coûteuses
                </div>
            </div>
        `;
    }

    calculateAvailableBudget(team) {
        const baseTreasury = this.matchData[`team${team}`].treasury || 0;
        const gains = this.calculateGains(team);
        const playerSales = this.getPlayerSalesTotal(team);

        // Récupérer la trésorerie dépensée pour les coups de pouce
        let treasurySpentOnInducements = this.matchData[`team${team}`].treasurySpentOnInducements || 0;

        // Si pas encore définie mais qu'il y a des coups de pouce, calculer
        if (treasurySpentOnInducements === 0 && this.hasInducements(team)) {
            const spending = this.calculateInducementSpending(team);
            treasurySpentOnInducements = spending.spentFromTreasury;
            // Optionnel : sauvegarder pour éviter de recalculer
            this.matchData[`team${team}`].treasurySpentOnInducements = treasurySpentOnInducements;
        }

        // Budget disponible = trésorerie + gains + ventes - coups de pouce
        const availableBudget = baseTreasury + gains + playerSales - treasurySpentOnInducements;

        return availableBudget;
    }

    hasInducements(team) {
        const items = this.matchData.inducements[`team${team}Items`];
        if (!items) return false;

        for (let key in items) {
            if (items[key] > 0) return true;
        }
        return false;
    }

    getTeamPurchasesList(team) {
        if (!this.matchData[`team${team}`].purchasedPlayers) {
            this.matchData[`team${team}`].purchasedPlayers = [];
        }

        const purchasedPlayers = this.matchData[`team${team}`].purchasedPlayers;

        if (purchasedPlayers.length === 0) {
            return '<p class="help-text">Aucun joueur acheté</p>';
        }

        return purchasedPlayers.map((player, index) => `
            <div class="purchased-player-item">
                <input type="text" class="purchased-player-input purchased-player-name"
                    value="${player.name}"
                    placeholder="Nom du joueur"
                    onchange="app.updatePurchasedPlayer(${team}, ${index}, 'name', this.value)">
                <input type="text" class="purchased-player-input purchased-player-position"
                    value="${player.position}"
                    placeholder="Poste"
                    onchange="app.updatePurchasedPlayer(${team}, ${index}, 'position', this.value)">
                <input type="number" class="purchased-player-value"
                    value="${player.cost || 0}"
                    placeholder="Coût"
                    min="0" step="10000"
                    onchange="app.updatePurchasedPlayer(${team}, ${index}, 'cost', this.value)">
                <span>PO</span>
                <button class="btn-remove-player" onclick="app.removePurchasedPlayer(${team}, ${index})">❌</button>
            </div>
        `).join('');
    }

    addPurchasedPlayer(team) {
        if (!this.matchData[`team${team}`].purchasedPlayers) {
            this.matchData[`team${team}`].purchasedPlayers = [];
        }

        this.matchData[`team${team}`].purchasedPlayers.push({
            name: '',
            position: '',
            cost: 0
        });

        this.loadTab('postmatch');
        this.saveState();
    }

    updatePurchasedPlayer(team, index, field, value) {
        if (field === 'cost') {
            const newCost = parseInt(value) || 0;
            const availableBudget = this.calculateAvailableBudget(team);
            const totalPurchases = this.getPlayerPurchasesTotal(team);
            const previousCost = this.matchData[`team${team}`].purchasedPlayers[index].cost || 0;
            const newTotalPurchases = totalPurchases - previousCost + newCost;

            // Vérifier si le nouveau total dépasse le budget
            if (newTotalPurchases > availableBudget) {
                // Afficher un avertissement
                const remainingBudget = availableBudget - (totalPurchases - previousCost);
                alert(`⚠️ Budget insuffisant !\n\nBudget restant : ${Utils.formatNumber(remainingBudget)} PO\nCoût saisi : ${Utils.formatNumber(newCost)} PO\n\nVeuillez saisir un montant inférieur ou vendre des joueurs pour augmenter votre budget.`);

                // Optionnel : remettre l'ancienne valeur
                document.querySelector(`#team${team}-purchases-list input[type="number"]`).value = previousCost;
                return;
            }

            this.matchData[`team${team}`].purchasedPlayers[index][field] = newCost;
        } else {
            this.matchData[`team${team}`].purchasedPlayers[index][field] = value;
        }

        // Recharger la section pour mettre à jour le budget restant
        this.loadTab('postmatch');
        this.saveState();
    }

    removePurchasedPlayer(team, index) {
        this.matchData[`team${team}`].purchasedPlayers.splice(index, 1);
        this.loadTab('postmatch');
        this.saveState();
    }

    // MÉTHODE POUR CALCULER LE TOTAL DES ACHATS
    getPlayerPurchasesTotal(team) {
        const purchasedPlayers = this.matchData[`team${team}`].purchasedPlayers || [];
        let total = 0;

        purchasedPlayers.forEach(purchase => {
            total += parseInt(purchase.cost) || 0;
        });

        return total;
    }

    getCostlyErrorsSection() {
        // Calculer les trésoreries finales pour les deux équipes
        const team1Treasury = this.calculateFinalTreasury(1);
        const team2Treasury = this.calculateFinalTreasury(2);

        return `
            <div class="step-section">
                <div class="step-header">
                    <div class="step-number">6</div>
                    <div class="step-title">Erreurs Coûteuses</div>
                </div>
                <div class="explanation-box">
                    <p><strong>Règle :</strong> Si une équipe a ≥100 000 PO en trésorerie finale, elle risque des scandales</p>
                    <p><strong>Incident mineur :</strong> -D3×10k PO | <strong>Incident majeur :</strong> Trésorerie ÷ 2</p>
                    <p><strong>Catastrophe :</strong> Ne garde que 2D6×10k PO</p>
                </div>

                <div class="costly-errors-grid">
                    ${this.getTeamCostlyErrorSection(1, team1Treasury)}
                    ${this.getTeamCostlyErrorSection(2, team2Treasury)}
                </div>
            </div>
        `;
    }

    // Méthodes de calcul
    calculateGains(team) {
        const popularity = this.matchData[`team${team}`].popularity || 0;
        const touchdowns = this.matchData[`team${team}`].score || 0;
        return 10000 * (popularity + touchdowns);
    }

    getMatchResult(team) {
        const team1Score = this.matchData.team1.score;
        const team2Score = this.matchData.team2.score;

        if (team1Score > team2Score) {
            return team === 1 ? 'Gagnant' : 'Perdant';
        } else if (team2Score > team1Score) {
            return team === 2 ? 'Gagnant' : 'Perdant';
        } else {
            return 'Match nul';
        }
    }

    getTeamXPSummary(team) {
        const players = this.matchData[`team${team}`].players || [];

        if (players.length === 0) {
            return '<p class="help-text">Aucun joueur ajouté dans l\'onglet Match</p>';
        }

        let html = '<div class="xp-list">';
        let totalXP = 0;

        players.forEach(player => {
            if (player.name || player.xp > 0) {
                html += `
                    <div class="xp-player-item">
                        <span class="player-name">${player.name || 'Joueur sans nom'}</span>
                        <span class="player-xp">${player.xp || 0} XP</span>
                    </div>
                `;
                totalXP += player.xp || 0;
            }
        });

        html += `
            <div class="xp-total-item">
                <span>Total équipe</span>
                <span>${totalXP} XP</span>
            </div>
        </div>`;

        return html;
    }

    // Gestion des ventes de joueurs
    getTeamSalesList(team) {
        if (!this.matchData[`team${team}`].soldPlayers) {
            this.matchData[`team${team}`].soldPlayers = [];
        }

        const soldPlayers = this.matchData[`team${team}`].soldPlayers;

        if (soldPlayers.length === 0) {
            return '<p class="help-text">Aucun joueur vendu</p>';
        }

        return soldPlayers.map((player, index) => `
            <div class="sold-player-item">
                <input type="text" class="sold-player-input"
                    value="${player.name}"
                    placeholder="Nom du joueur vendu"
                    onchange="app.updateSoldPlayer(${team}, ${index}, this.value)">
                <input type="number" class="sold-player-value"
                    value="${player.value || 0}"
                    placeholder="Valeur"
                    min="0" step="10000"
                    onchange="app.updateSoldPlayerValue(${team}, ${index}, this.value)">
                <span>PO</span>
                <button class="btn-remove-player" onclick="app.removeSoldPlayer(${team}, ${index})">❌</button>
            </div>
        `).join('');
    }

    addSoldPlayer(team) {
        if (!this.matchData[`team${team}`].soldPlayers) {
            this.matchData[`team${team}`].soldPlayers = [];
        }

        this.matchData[`team${team}`].soldPlayers.push({
            name: '',
            value: 0
        });

        this.loadTab('postmatch');
        this.saveState();
    }

    updateSoldPlayer(team, index, name) {
        this.matchData[`team${team}`].soldPlayers[index].name = name;
        this.saveState();
    }

    updateSoldPlayerValue(team, index, value) {
        this.matchData[`team${team}`].soldPlayers[index].value = parseInt(value) || 0;
        this.saveState();
    }

    removeSoldPlayer(team, index) {
        this.matchData[`team${team}`].soldPlayers.splice(index, 1);
        this.loadTab('postmatch');
        this.saveState();
    }

    // Gestion des fans
    rollFansUpdate(team) {
        const roll = Utils.getRandomInt(1, 6);
        document.getElementById(`fans${team}-roll`).value = roll;
        // Sauvegarder le résultat du dé
        this.matchData[`team${team}`].fansUpdateRoll = roll;
        this.updateFans(team);
        this.saveState();
    }

    updateFans(team) {
        const roll = parseInt(document.getElementById(`fans${team}-roll`).value) || 0;
        const result = this.getMatchResult(team);

        // IMPORTANT : Utiliser les fans INITIAUX (depuis configuration)
        // Ne PAS modifier this.matchData[`team${team}`].fans !
        const currentFans = this.matchData[`team${team}`].fans || 1;

        // Sauvegarder les fans initiaux la première fois (pour référence)
        if (this.matchData[`team${team}`].initialFans === undefined) {
            this.matchData[`team${team}`].initialFans = currentFans;
        }

        // Sauvegarder le résultat du dé
        this.matchData[`team${team}`].fansUpdateRoll = roll;

        let message = '';
        let newFans = currentFans; // Commencer avec les fans initiaux

        if (result === 'Match nul') {
            message = 'Match nul : pas de changement';
        } else if (result === 'Gagnant') {
            if (roll >= currentFans) {
                const gain = Utils.getRandomInt(1, 3);
                newFans = Math.min(6, currentFans + gain);
                message = `Gagne ${gain} fan(s) ! (${currentFans} → ${newFans})`;
            } else {
                message = `Pas de gain (jet ${roll} < ${currentFans} fans actuels)`;
            }
        } else { // Perdant
            if (roll <= currentFans) {
                const loss = Utils.getRandomInt(1, 3);
                newFans = Math.max(1, currentFans - loss);
                message = `Perd ${loss} fan(s) ! (${currentFans} → ${newFans})`;
            } else {
                message = `Pas de perte (jet ${roll} > ${currentFans} fans actuels)`;
            }
        }

        // IMPORTANT : Sauvegarder dans une propriété SÉPARÉE
        // Ne PAS écraser this.matchData[`team${team}`].fans !
        this.matchData[`team${team}`].finalFans = newFans;
        this.matchData[`team${team}`].fansUpdateResult = message;

        document.getElementById(`fans${team}-result`).textContent = message;

        // Afficher le résumé
        const infoDiv = document.getElementById('fans-update-info');
        if (infoDiv) {
            infoDiv.style.display = 'block';
            infoDiv.className = result === 'Gagnant' ? 'result-box success' : 'result-box warning';
        }

        this.saveState();
    }

    // Gestion de la trésorerie et erreurs coûteuses
    updateTreasury(team, value) {
        this.matchData[`team${team}`].treasury = parseInt(value) || 0;
        this.loadTab('postmatch'); // Rafraîchir pour afficher/masquer le test
        this.saveState();
    }

    rollCostlyErrors(team) {
        const roll = Utils.getRandomInt(1, 6);
        document.getElementById(`team${team}-errors-roll`).value = roll;
        this.updateCostlyErrors(team);
        this.saveState();
    }

    updateCostlyErrors(team) {
        const roll = parseInt(document.getElementById(`team${team}-errors-roll`).value) || 0;
        const treasury = this.calculateFinalTreasury(team).finalTreasury;  // Utiliser la trésorerie avant erreurs
        const resultDiv = document.getElementById(`team${team}-errors-result`);

        const errorTable = this.getCostlyErrorResult(treasury, roll);

        // Initialiser l'objet erreur
        if (!this.matchData[`team${team}`].costlyError) {
            this.matchData[`team${team}`].costlyError = {};
        }

        if (errorTable.type === 'none') {
            resultDiv.innerHTML = '<p class="success-text">✅ Crise évitée !</p>';
            this.matchData[`team${team}`].costlyError = { type: 'none' };
        } else if (errorTable.type === 'minor') {
            const d3Roll = Utils.getRandomInt(1, 3);
            const loss = d3Roll * 10000;
            resultDiv.innerHTML = `
                <p class="warning-text">
                    ⚠️ Incident mineur !<br>
                    Jet D3 = ${d3Roll}<br>
                    Perte : ${Utils.formatNumber(loss)} PO
                </p>
            `;
            this.matchData[`team${team}`].costlyError = {
                type: 'minor',
                amount: loss,
                d3Roll: d3Roll
            };
        } else if (errorTable.type === 'major') {
            const newTreasury = Math.floor(treasury / 2);
            const loss = treasury - newTreasury;
            resultDiv.innerHTML = `
                <p class="danger-text">
                    🔥 Incident majeur !<br>
                    Trésorerie divisée par 2<br>
                    Perte : ${Utils.formatNumber(loss)} PO
                </p>
            `;
            this.matchData[`team${team}`].costlyError = {
                type: 'major'
            };
        } else if (errorTable.type === 'catastrophe') {
            const d6Roll1 = Utils.getRandomInt(1, 6);
            const d6Roll2 = Utils.getRandomInt(1, 6);
            const kept = (d6Roll1 + d6Roll2) * 10000;
            const loss = Math.max(0, treasury - kept);
            resultDiv.innerHTML = `
                <p class="danger-text">
                    💥 CATASTROPHE !<br>
                    Jets 2D6 = ${d6Roll1} + ${d6Roll2} = ${d6Roll1 + d6Roll2}<br>
                    Montant conservé : ${Utils.formatNumber(kept)} PO<br>
                    Perte : ${Utils.formatNumber(loss)} PO
                </p>
            `;
            this.matchData[`team${team}`].costlyError = {
                type: 'catastrophe',
                kept: kept,
                d6Rolls: [d6Roll1, d6Roll2]
            };
        }

        this.saveState();
    }

    getCostlyErrorResult(treasury, roll) {
        if (treasury < 100000) return { type: 'none' };

        const table = {
            100000: [1, 2, 2, 2, 2, 2],  // 1: incident mineur, reste: crise évitée
            200000: [1, 1, 2, 2, 2, 2],  // 1-2: incident mineur, reste: crise évitée
            300000: [3, 1, 1, 2, 2, 2],  // 1: incident majeur, 2-3: incident mineur, reste: crise évitée
            400000: [3, 3, 1, 1, 2, 2],  // 1-2: incident majeur, 3-4: incident mineur, reste: crise évitée
            500000: [4, 3, 3, 1, 1, 2],  // 1: catastrophe, 2-3: incident majeur, 4-5: incident mineur, 6: crise évitée
            600000: [4, 4, 3, 3, 1, 1]   // 1-2: catastrophe, 3-4: incident majeur, 5-6: incident mineur
        };

        // Déterminer la tranche de trésorerie
        let bracket;
        if (treasury >= 600000) bracket = 600000;
        else if (treasury >= 500000) bracket = 500000;
        else if (treasury >= 400000) bracket = 400000;
        else if (treasury >= 300000) bracket = 300000;
        else if (treasury >= 200000) bracket = 200000;
        else bracket = 100000;

        const result = table[bracket][roll - 1];

        const types = {
            1: 'minor',
            2: 'none',
            3: 'major',
            4: 'catastrophe'
        };

        return { type: types[result] || 'none' };
    }

    initializePostmatchTab() {
        // Recalculer l'XP si nécessaire
        this.matchData.team1.players.forEach(player => {
            this.calculatePlayerXP(1, player.id);
        });
        this.matchData.team2.players.forEach(player => {
            this.calculatePlayerXP(2, player.id);
        });

        console.log('Post-match tab initialized');
    }

    initializeSummaryTab() {
        // Mettre à jour la date du match si elle n'existe pas
        if (!this.matchData.matchDate) {
            this.matchData.matchDate = new Date().toLocaleDateString('fr-FR');
        }

        // Calculer la durée si le match est terminé
        if (this.matchData.matchStart && !this.matchData.matchEnd) {
            this.matchData.matchEnd = new Date();
        }

        console.log('Summary tab initialized');
    }

    showSaveIndicator() {
        // Ne pas afficher d'indicateur pour les sauvegardes automatiques
        // Seulement en cas de sauvegarde manuelle ou d'action importante
        if (!this.showingSaveIndicator) {
            return;
        }

        const oldIndicator = document.getElementById('save-indicator');
        if (oldIndicator) oldIndicator.remove();

        const indicator = document.createElement('div');
        indicator.id = 'save-indicator';
        indicator.className = 'save-indicator';
        indicator.innerHTML = '✓';
        document.body.appendChild(indicator);

        setTimeout(() => {
            if (indicator.parentElement) {
                indicator.remove();
            }
        }, 1000);
    }

    // Gestion du chronomètre
    toggleTimer() {
        if (!this.matchData.timerRunning) {
            // Démarrer le chrono
            if (!this.matchData.matchStart) {
                this.matchData.matchStart = new Date();
                this.matchData.pausedDuration = 0;
            }
            this.matchData.timerRunning = true;
            this.matchData.lastStartTime = new Date();
            this.startTimerInterval();
        } else {
            // Mettre en pause
            this.matchData.timerRunning = false;

            // Calculer et ajouter le temps écoulé depuis le dernier démarrage
            const now = new Date();
            const lastStart = new Date(this.matchData.lastStartTime);
            const additionalTime = Math.floor((now - lastStart) / 1000);
            this.matchData.pausedDuration = (this.matchData.pausedDuration || 0) + additionalTime;

            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
        }

        // Mettre à jour le bouton
        this.updateTimerButton();
        this.saveState();
    }

    resetTimer() {
        if (confirm('Réinitialiser le chronomètre ?')) {
            this.matchData.matchStart = null;
            this.matchData.lastStartTime = null;
            this.matchData.timerRunning = false;
            this.matchData.pausedDuration = 0;

            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }

            document.getElementById('match-timer').textContent = '00:00';
            this.updateTimerButton();
            this.saveState();
        }
    }

    startTimerInterval() {
        this.timerInterval = setInterval(() => {
            this.updateTimerDisplay();
        }, 1000);

        // Mise à jour immédiate
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const elapsed = this.getElapsedTime();
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;

        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        const timerElement = document.getElementById('match-timer');
        if (timerElement) {
            timerElement.textContent = display;
        }
    }

    getElapsedTime() {
        if (!this.matchData.matchStart) return 0;

        if (this.matchData.timerRunning) {
            // Si le chrono tourne, calculer le temps depuis le dernier démarrage
            const now = new Date();
            const lastStart = new Date(this.matchData.lastStartTime || this.matchData.matchStart);
            const currentSessionTime = Math.floor((now - lastStart) / 1000);
            return (this.matchData.pausedDuration || 0) + currentSessionTime;
        } else {
            // Si en pause, retourner seulement le temps accumulé
            return this.matchData.pausedDuration || 0;
        }
    }

    updateTimerButton() {
        const button = document.querySelector('.timer-btn.play, .timer-btn.pause');
        if (button) {
            if (this.matchData.timerRunning) {
                button.className = 'timer-btn pause';
                button.innerHTML = '⏸️ Pause';
            } else {
                button.className = 'timer-btn play';
                button.innerHTML = '▶️ Démarrer';
            }
        }
    }

    saveMatchState() {
        // Forcer l'affichage de l'indicateur de sauvegarde pour cette action manuelle
        this.showingSaveIndicator = true;

        // Effectuer la sauvegarde
        const saved = this.saveState();

        // Réinitialiser le flag
        this.showingSaveIndicator = false;

        if (saved) {
            // Afficher l'indicateur de succès
            this.showSaveIndicator();

            // Message de confirmation
            const confirmDiv = document.createElement('div');
            confirmDiv.className = 'save-confirmation';
            confirmDiv.innerHTML = `
                <div class="save-confirmation-content">
                    <span>✅ Match sauvegardé localement avec succès !</span>
                </div>
            `;
            confirmDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 1002;
                background: rgba(40, 167, 69, 0.95);
                color: white;
                padding: 20px 30px;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                font-size: 16px;
                animation: fadeInOut 2s ease;
            `;

            document.body.appendChild(confirmDiv);

            setTimeout(() => {
                if (confirmDiv.parentElement) {
                    confirmDiv.remove();
                }
            }, 2000);
        } else {
            // En cas d'échec
            alert('Erreur lors de la sauvegarde. Essayez d\'exporter vos données en JSON.');
        }
    }

    // Méthode pour changer le type de météo
    changeWeatherType(type) {
        this.matchData.weather.type = type;

        // Si des dés ont déjà été lancés, recalculer l'effet
        if (this.matchData.weather.dice1 && this.matchData.weather.dice2) {
            this.updateWeatherResult();
        }

        this.saveState();
    }

    // Méthode pour importer des données depuis un fichier JSON
    importMatchData(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Vérifier que c'est un fichier JSON
        if (!file.name.endsWith('.json')) {
            alert('Veuillez sélectionner un fichier JSON valide.');
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);

                // Valider la structure des données
                if (!this.validateImportedData(importedData)) {
                    alert('Le fichier JSON ne contient pas des données de match valides.');
                    return;
                }

                // Demander confirmation
                const confirmMessage = importedData.team1 && importedData.team2 ?
                    `Voulez-vous charger le match "${importedData.team1.name || 'Équipe 1'}" vs "${importedData.team2.name || 'Équipe 2'}" ?\n\nCela remplacera toutes les données actuelles.` :
                    'Voulez-vous charger ce match ?\n\nCela remplacera toutes les données actuelles.';

                if (!confirm(confirmMessage)) {
                    return;
                }

                // Charger les données
                this.loadImportedData(importedData);

                // Notification de succès
                this.showImportSuccess();

            } catch (error) {
                console.error('Erreur lors de l\'import:', error);
                alert('Erreur lors de la lecture du fichier. Assurez-vous qu\'il s\'agit d\'un fichier JSON valide.');
            }
        };

        reader.onerror = () => {
            alert('Erreur lors de la lecture du fichier.');
        };

        // Lire le fichier
        reader.readAsText(file);

        // Réinitialiser l'input pour permettre de réimporter le même fichier
        event.target.value = '';
    }

    // Valider la structure des données importées
    validateImportedData(data) {
        // Vérifications de base
        if (!data || typeof data !== 'object') return false;

        // Vérifier les propriétés essentielles
        const requiredProps = ['team1', 'team2'];
        for (const prop of requiredProps) {
            if (!data.hasOwnProperty(prop)) return false;
        }

        // Vérifier la structure des équipes
        if (!data.team1 || typeof data.team1 !== 'object') return false;
        if (!data.team2 || typeof data.team2 !== 'object') return false;

        return true;
    }

    // Charger les données importées
    loadImportedData(importedData) {
        // Migrer les anciennes structures si nécessaire
        const migratedData = this.migrateImportedData(importedData);

        // Remplacer les données actuelles
        this.matchData = { ...this.matchData, ...migratedData };

        // S'assurer que toutes les propriétés nécessaires existent
        this.ensureDataIntegrity();

        // Sauvegarder
        this.saveState();

        // Recharger l'onglet actuel pour afficher les nouvelles données
        this.loadTab(this.currentTab);
    }

    // Migrer les données anciennes vers le nouveau format
    migrateImportedData(data) {
        const migrated = { ...data };

        // Migration du chronomètre
        if (!migrated.hasOwnProperty('timerRunning')) {
            migrated.timerRunning = false;
        }
        if (!migrated.hasOwnProperty('pausedDuration')) {
            migrated.pausedDuration = 0;
        }
        if (!migrated.hasOwnProperty('lastStartTime')) {
            migrated.lastStartTime = null;
        }

        // Migration de la météo
        if (migrated.weather && !migrated.weather.hasOwnProperty('type')) {
            migrated.weather.type = 'classique';
        }

        // Migration des fans update
        ['team1', 'team2'].forEach(team => {
            if (migrated[team]) {
                if (!migrated[team].hasOwnProperty('fansUpdateRoll')) {
                    migrated[team].fansUpdateRoll = null;
                }
                if (!migrated[team].hasOwnProperty('fansUpdateResult')) {
                    migrated[team].fansUpdateResult = '';
                }
                if (!migrated[team].hasOwnProperty('soldPlayers')) {
                    migrated[team].soldPlayers = [];
                }
            }
        });

        // Migration des inducements
        if (!migrated.inducements) {
            migrated.inducements = {
                team1Items: {},
                team2Items: {},
                team1PetiteMonnaie: 0,
                team2PetiteMonnaie: 0,
                team1Treasury: 0,
                team2Treasury: 0
            };
        }

        return migrated;
    }

    // S'assurer que toutes les propriétés nécessaires existent
    ensureDataIntegrity() {
        // Vérifier chaque équipe
        ['team1', 'team2'].forEach(team => {
            if (!this.matchData[team]) {
                this.matchData[team] = this.createTeamObject();
            }

            // S'assurer que les tableaux existent
            if (!Array.isArray(this.matchData[team].players)) {
                this.matchData[team].players = [];
            }
            if (!Array.isArray(this.matchData[team].soldPlayers)) {
                this.matchData[team].soldPlayers = [];
            }
        });

        // Vérifier la météo
        if (!this.matchData.weather) {
            this.matchData.weather = {
                type: 'classique',
                total: 0,
                effect: '',
                rolled: false,
                dice1: null,
                dice2: null
            };
        }

        // Vérifier les autres propriétés
        if (!this.matchData.kickoffEvents) {
            this.matchData.kickoffEvents = [];
        }
    }

    // Afficher le succès de l'import
    showImportSuccess() {
        const successDiv = document.createElement('div');
        successDiv.className = 'import-success-notification';
        successDiv.innerHTML = `
            <div class="import-success-content">
                <span>✅ Match importé avec succès !</span>
            </div>
        `;
        successDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1002;
            background: rgba(40, 167, 69, 0.95);
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            font-size: 16px;
            animation: fadeInOut 3s ease;
        `;

        document.body.appendChild(successDiv);

        setTimeout(() => {
            if (successDiv.parentElement) {
                successDiv.remove();
            }
        }, 3000);
    }

    initVisualValidation() {
        console.log('🎨 Activation de la validation visuelle...');

        // S'assurer que le système est chargé
        if (!window.visualValidation) {
            console.warn('⚠️ Système de validation visuelle non chargé');
            return;
        }

        // Réinitialiser et configurer
        window.visualValidation.reset();
        window.visualValidation.initialize();

        // Écouter les changements de validation
        window.addEventListener('validationUpdate', (e) => {
            console.log('📊 Mise à jour validation:', e.detail);

            // Mettre à jour l'interface si nécessaire
            if (this.currentTab === 'setup') {
                this.updateNavigationState();
            }
        });

        console.log('✅ Validation visuelle activée');
    }

    getFieldConfig(field) {
        const configs = {
            'name': { type: 'teamName', required: true },
            'coach': { type: 'coach', required: false },
            'vea': { type: 'vea', required: true },
            'fans': { type: 'fans', required: true },
            'treasury': { type: 'treasury', required: false },
            'popularity': { type: 'popularity', required: false }
        };

        return configs[field] || { type: field, required: false };
    }

    // Fonction utilitaire pour la boîte d'information des dés
    getDiceInfoBox() {
        return `
            <div class="dice-info-box">
                <div class="info-icon">🎲</div>
                <div class="info-text">
                    <strong>Info :</strong> Tous les tirages automatiques peuvent être réalisés <strong>manuellement</strong> par les joueurs.
                    Vous pouvez cliquer sur les boutons de dés ou saisir directement les résultats dans les champs.
                </div>
            </div>
        `;
    }

    calculateFinalTreasury(team) {
        // Trésorerie de base (depuis l'onglet Configuration)
        const baseTreasury = this.matchData[`team${team}`].treasury || 0;

        // Gains du match
        const gains = this.calculateGains(team);

        // Ventes de joueurs
        const playerSales = this.getPlayerSalesTotal(team);

        // CORRECTION: Récupérer le montant DÉPENSÉ en coups de pouce (pas la trésorerie totale)
        const treasurySpentOnInducements = this.matchData[`team${team}`].treasurySpentOnInducements || 0;

        // Achats de nouveaux joueurs
        const newPlayerPurchases = this.getPlayerPurchasesTotal(team);

        // Calculer la trésorerie AVANT les erreurs coûteuses
        const treasuryBeforeErrors = baseTreasury + gains + playerSales - treasurySpentOnInducements - newPlayerPurchases;

        // Prendre en compte les erreurs coûteuses
        let costlyErrorLoss = 0;
        const costlyError = this.matchData[`team${team}`].costlyError || {};

        if (costlyError.type && costlyError.type !== 'none') {
            if (costlyError.type === 'minor' && costlyError.amount) {
                costlyErrorLoss = costlyError.amount;
            } else if (costlyError.type === 'major') {
                costlyErrorLoss = Math.floor(treasuryBeforeErrors / 2);
            } else if (costlyError.type === 'catastrophe' && costlyError.kept) {
                costlyErrorLoss = Math.max(0, treasuryBeforeErrors - costlyError.kept);
            }
        }

        // Calculer le total final APRÈS les erreurs coûteuses
        const finalTreasury = treasuryBeforeErrors - costlyErrorLoss;

        console.log(`Calcul trésorerie ${this.matchData[`team${team}`].name}:`);
        console.log(`   Trésorerie initiale: ${Utils.formatNumber(baseTreasury)} PO`);
        console.log(`   + Gains du match: ${Utils.formatNumber(gains)} PO`);
        console.log(`   + Ventes de joueurs: ${Utils.formatNumber(playerSales)} PO`);
        console.log(`   - Coups de pouce (trésorerie): ${Utils.formatNumber(treasurySpentOnInducements)} PO`);
        console.log(`   - Achats de joueurs: ${Utils.formatNumber(newPlayerPurchases)} PO`);
        console.log(`   = Sous-total: ${Utils.formatNumber(treasuryBeforeErrors)} PO`);
        console.log(`   - Erreurs coûteuses: ${Utils.formatNumber(costlyErrorLoss)} PO`);
        console.log(`   = TOTAL FINAL: ${Utils.formatNumber(finalTreasury)} PO`);

        return {
            baseTreasury,
            gains,
            playerSales,
            treasurySpentOnInducements,
            newPlayerPurchases,
            costlyErrorLoss,
            finalTreasury
        };
    }

    getPlayerSalesTotal(team) {
        const soldPlayers = this.matchData[`team${team}`].soldPlayers || [];
        let total = 0;

        soldPlayers.forEach(sale => {
            total += parseInt(sale.value) || 0;
        });

        return total;
    }

    getTeamCostlyErrorSection(team, treasuryCalc) {
        const teamName = this.matchData[`team${team}`].name || `Équipe ${team}`;

        // IMPORTANT : Calculer la trésorerie SANS les erreurs coûteuses
        const treasuryBeforeErrors = treasuryCalc.baseTreasury +
                                      treasuryCalc.gains +
                                      treasuryCalc.playerSales -
                                      treasuryCalc.treasurySpentOnInducements -
                                      treasuryCalc.newPlayerPurchases;

        // Récupérer les données d'erreur existantes
        const existingError = this.matchData[`team${team}`].costlyError || {};
        const existingRoll = existingError.roll || '';

        // Sauvegarder la trésorerie AVANT erreurs pour les calculs futurs
        this.matchData[`team${team}`].calculatedFinalTreasury = treasuryBeforeErrors;

        return `
            <div class="team-errors-section">
                <h5>${teamName}</h5>

                <!-- Détail du calcul de la trésorerie AVANT erreurs coûteuses -->
                <div class="treasury-calculation">
                    <div class="calc-line">
                        <span class="calc-label">Trésorerie (onglet Configuration) :</span>
                        <span class="calc-value">${Utils.formatNumber(treasuryCalc.baseTreasury)} PO</span>
                    </div>
                    <div class="calc-line positive">
                        <span class="calc-label">+ Gains du match :</span>
                        <span class="calc-value">+${Utils.formatNumber(treasuryCalc.gains)} PO</span>
                    </div>
                    ${treasuryCalc.playerSales > 0 ? `
                    <div class="calc-line positive">
                        <span class="calc-label">+ Ventes de joueurs :</span>
                        <span class="calc-value">+${Utils.formatNumber(treasuryCalc.playerSales)} PO</span>
                    </div>
                    ` : ''}
                    ${treasuryCalc.treasurySpentOnInducements > 0 ? `
                    <div class="calc-line negative">
                        <span class="calc-label">- Coups de pouce (trésorerie) :</span>
                        <span class="calc-value">-${Utils.formatNumber(treasuryCalc.treasurySpentOnInducements)} PO</span>
                    </div>
                    ` : ''}
                    ${treasuryCalc.newPlayerPurchases > 0 ? `
                    <div class="calc-line negative">
                        <span class="calc-label">- Achats de joueurs :</span>
                        <span class="calc-value">-${Utils.formatNumber(treasuryCalc.newPlayerPurchases)} PO</span>
                    </div>
                    ` : ''}
                    <div class="calc-line total">
                        <span class="calc-label">= Trésorerie (avant erreurs) :</span>
                        <span class="calc-value ${treasuryBeforeErrors < 0 ? 'negative' : ''}">${Utils.formatNumber(treasuryBeforeErrors)} PO</span>
                    </div>
                </div>

                <!-- Test d'erreurs coûteuses si nécessaire -->
                ${treasuryBeforeErrors >= 100000 ? `
                    <div class="error-test-zone">
                        <div class="alert alert-warning">
                            ⚠️ Trésorerie ≥ 100k PO : Test requis !
                        </div>
                        <div class="dice-controls">
                            <button class="dice-btn" onclick="app.rollCostlyErrorsWithFinalTreasury(${team})">
                                🎲 Test D6
                            </button>
                            <input type="number" class="dice-result" id="team${team}-errors-roll"
                                value="${existingRoll}" min="1" max="6"
                                onchange="app.updateCostlyErrorsWithFinalTreasury(${team})">
                        </div>
                        <div id="team${team}-errors-result">
                            ${this.getCostlyErrorResultDisplay(team)}
                        </div>
                    </div>
                ` : `
                    <div class="no-test-required">
                        <p class="success-text">✅ Trésorerie < 100k PO : Pas de test requis</p>
                    </div>
                `}
            </div>
        `;
    }

    rollCostlyErrorsWithFinalTreasury(team) {
        const roll = Utils.getRandomInt(1, 6);
        document.getElementById(`team${team}-errors-roll`).value = roll;
        this.updateCostlyErrorsWithFinalTreasury(team);
        this.saveState();
    }

    updateCostlyErrorsWithFinalTreasury(team) {
        const roll = parseInt(document.getElementById(`team${team}-errors-roll`).value) || 0;
        // IMPORTANT: Utiliser la trésorerie AVANT les erreurs coûteuses
        const treasuryBeforeErrors = this.matchData[`team${team}`].calculatedFinalTreasury || 0;
        const resultDiv = document.getElementById(`team${team}-errors-result`);

        if (!roll || roll < 1 || roll > 6) {
            resultDiv.innerHTML = '';
            // Réinitialiser les erreurs si pas de jet valide
            this.matchData[`team${team}`].costlyError = { type: 'none', roll: 0 };
            this.saveState();
            return;
        }

        const errorTable = this.getCostlyErrorResult(treasuryBeforeErrors, roll);

        if (errorTable.type === 'none') {
            resultDiv.innerHTML = '<p class="success-text">✅ Crise évitée !</p>';
            this.matchData[`team${team}`].costlyError = {
                type: 'none',
                roll: roll
            };
        } else if (errorTable.type === 'minor') {
            const d3Roll = Utils.getRandomInt(1, 3);
            const loss = d3Roll * 10000;
            resultDiv.innerHTML = `
                <p class="warning-text">
                    ⚠️ Incident mineur !<br>
                    Jet D6 = ${roll}<br>
                    Jet D3 = ${d3Roll}<br>
                    Perte : ${Utils.formatNumber(loss)} PO<br>
                    Nouvelle trésorerie : ${Utils.formatNumber(Math.max(0, treasuryBeforeErrors - loss))} PO
                </p>
            `;
            this.matchData[`team${team}`].costlyError = {
                type: 'minor',
                amount: loss,
                roll: roll,
                d3Roll: d3Roll
            };
        } else if (errorTable.type === 'major') {
            const loss = Math.floor(treasuryBeforeErrors / 2);
            const newTreasury = treasuryBeforeErrors - loss;
            resultDiv.innerHTML = `
                <p class="danger-text">
                    🔥 Incident majeur !<br>
                    Jet D6 = ${roll}<br>
                    Trésorerie divisée par 2<br>
                    Perte : ${Utils.formatNumber(loss)} PO<br>
                    Nouvelle trésorerie : ${Utils.formatNumber(newTreasury)} PO
                </p>
            `;
            this.matchData[`team${team}`].costlyError = {
                type: 'major',
                roll: roll
            };
        } else if (errorTable.type === 'catastrophe') {
            const d6Roll1 = Utils.getRandomInt(1, 6);
            const d6Roll2 = Utils.getRandomInt(1, 6);
            const kept = (d6Roll1 + d6Roll2) * 10000;
            const loss = Math.max(0, treasuryBeforeErrors - kept);
            resultDiv.innerHTML = `
                <p class="danger-text">
                    💥 CATASTROPHE !<br>
                    Jet D6 = ${roll}<br>
                    Jets 2D6 = ${d6Roll1} + ${d6Roll2} = ${d6Roll1 + d6Roll2}<br>
                    Montant conservé : ${Utils.formatNumber(kept)} PO<br>
                    Perte : ${Utils.formatNumber(loss)} PO<br>
                    Nouvelle trésorerie : ${Utils.formatNumber(Math.min(treasuryBeforeErrors, kept))} PO
                </p>
            `;
            this.matchData[`team${team}`].costlyError = {
                type: 'catastrophe',
                kept: kept,
                roll: roll,
                d6Rolls: [d6Roll1, d6Roll2]
            };
        }

        // Forcer le recalcul de la trésorerie finale et rafraîchir l'affichage
        this.saveState();
        this.loadTab('postmatch');
    }

    getCostlyErrorResultDisplay(team) {
        const error = this.matchData[`team${team}`].costlyError || {};
        const treasuryBeforeErrors = this.matchData[`team${team}`].calculatedFinalTreasury || 0;

        if (!error.type || !error.roll) {
            return '';
        }

        if (error.type === 'none') {
            return '<p class="success-text">✅ Crise évitée !</p>';
        } else if (error.type === 'minor') {
            const loss = error.amount || 0;
            return `
                <p class="warning-text">
                    ⚠️ Incident mineur !<br>
                    Jet D6 = ${error.roll}<br>
                    Jet D3 = ${error.d3Roll || '?'}<br>
                    Perte : ${Utils.formatNumber(loss)} PO<br>
                    Nouvelle trésorerie : ${Utils.formatNumber(Math.max(0, treasuryBeforeErrors - loss))} PO
                </p>
            `;
        } else if (error.type === 'major') {
            const loss = Math.floor(treasuryBeforeErrors / 2);
            const newTreasury = treasuryBeforeErrors - loss;
            return `
                <p class="danger-text">
                    🔥 Incident majeur !<br>
                    Jet D6 = ${error.roll}<br>
                    Trésorerie divisée par 2<br>
                    Perte : ${Utils.formatNumber(loss)} PO<br>
                    Nouvelle trésorerie : ${Utils.formatNumber(newTreasury)} PO
                </p>
            `;
        } else if (error.type === 'catastrophe') {
            const kept = error.kept || 0;
            const loss = Math.max(0, treasuryBeforeErrors - kept);
            return `
                <p class="danger-text">
                    💥 CATASTROPHE !<br>
                    Jet D6 = ${error.roll}<br>
                    Jets 2D6 = ${error.d6Rolls ? error.d6Rolls.join(' + ') : '?'} = ${error.d6Rolls ? error.d6Rolls[0] + error.d6Rolls[1] : '?'}<br>
                    Montant conservé : ${Utils.formatNumber(kept)} PO<br>
                    Perte : ${Utils.formatNumber(loss)} PO<br>
                    Nouvelle trésorerie : ${Utils.formatNumber(Math.min(treasuryBeforeErrors, kept))} PO
                </p>
            `;
        }

        return '';
    }

    initializeTreasuries() {
        // Appelé au début du match ou lors du chargement
        if (!this.matchData.team1.initialTreasury) {
            this.matchData.team1.initialTreasury = this.matchData.team1.treasury || 0;
        }
        if (!this.matchData.team2.initialTreasury) {
            this.matchData.team2.initialTreasury = this.matchData.team2.treasury || 0;
        }
    }

}

// Rendre l'app accessible globalement pour Cordova
window.BloodBowlApp = BloodBowlApp;
