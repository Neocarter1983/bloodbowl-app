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
            popularityDice: null, // Ajouter cette ligne
            players: [],
            treasury: 0,
            fansUpdateRoll: null,      // Le résultat du dé pour le test de fans
            fansUpdateResult: '',       // Le message de résultat
            soldPlayers: []
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

        // Effet d'ombre au scroll
        window.addEventListener('scroll', () => {
            const stickyWrapper = document.querySelector('.sticky-wrapper');
            if (stickyWrapper && window.scrollY > 50) {
                stickyWrapper.classList.add('scrolled');
            } else if (stickyWrapper) {
                stickyWrapper.classList.remove('scrolled');
            }
        });
    }

    switchTab(tabId) {
        // Nettoyer l'onglet actuel si nécessaire
        if (this.currentTab === 'match') {
            this.cleanupMatchTab();
        }

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

            // Injecter le contenu
            content.innerHTML = tabContent;

            // IMPORTANT : Ajouter la classe active au tab-content
            const tabContentDiv = content.querySelector('.tab-content');
            if (tabContentDiv) {
                tabContentDiv.classList.add('active');
            }

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

                ${this.getScoreDisplay()}
                ${this.getKickoffSection()}
                ${this.getPlayersActionsSection()}

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

                ${this.getMatchGainsSection()}
                ${this.getFansUpdateSection()}
                ${this.getExperienceSection()}
                ${this.getMVPSection()}
                ${this.getPlayerSalesSection()}
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
                <h2 class="section-title">📋 Résumé du Match</h2>

                ${this.getMatchSummaryHeader()}
                ${this.getMatchResultSection()}
                ${this.getMatchStatsSection()}
                ${this.getTeamsSummarySection()}
                ${this.getFinancialSummarySection()}
                ${this.getExportSection()}

                <div class="form-actions">
                    <button class="btn btn-primary" onclick="app.switchTab('postmatch')">⬅️ Retour Après-Match</button>
                    <button class="btn btn-primary" onclick="app.resetMatch()">🔄 Nouveau Match</button>
                </div>
            </div>
        `;
    }

    getMatchSummaryHeader() {
        const matchDate = this.matchData.matchDate || new Date().toLocaleDateString('fr-FR');
        const duration = this.getMatchDuration();

        return `
            <div class="summary-header">
                <div class="summary-header-item">
                    <span class="label">Date du match</span>
                    <span class="value">${matchDate}</span>
                </div>
                <div class="summary-header-item">
                    <span class="label">Durée</span>
                    <span class="value">${duration}</span>
                </div>
                <div class="summary-header-item">
                    <span class="label">Météo</span>
                    <span class="value">${this.matchData.weather.effect ?
                        this.matchData.weather.effect.split(':')[0] : 'Non définie'}</span>
                </div>
            </div>
        `;
    }

    getMatchResultSection() {
        const team1 = this.matchData.team1;
        const team2 = this.matchData.team2;
        const winner = team1.score > team2.score ? team1.name :
                       team2.score > team1.score ? team2.name : null;

        return `
            <div class="match-result-section">
                <h3>🏆 Résultat Final</h3>
                <div class="final-score-display">
                    <div class="team-final-score ${team1.score > team2.score ? 'winner' : ''}">
                        <div class="team-icon">🏠</div>
                        <div class="team-name">${team1.name}</div>
                        <div class="team-score">${team1.score}</div>
                    </div>
                    <div class="vs-separator">VS</div>
                    <div class="team-final-score ${team2.score > team1.score ? 'winner' : ''}">
                        <div class="team-score">${team2.score}</div>
                        <div class="team-name">${team2.name}</div>
                        <div class="team-icon">🚌</div>
                    </div>
                </div>
                ${winner ?
                    `<p class="winner-announcement">🎉 Victoire de ${winner} !</p>` :
                    `<p class="winner-announcement">🤝 Match nul !</p>`}
            </div>
        `;
    }

    getMatchStatsSection() {
        const totalTD = this.matchData.team1.score + this.matchData.team2.score;
        const totalXP = this.calculateTotalMatchXP();
        const kickoffEventsCount = (this.matchData.kickoffEvents || []).length;

        return `
            <div class="match-stats-section">
                <h3>📊 Statistiques du Match</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value">${totalTD}</div>
                        <div class="stat-label">Touchdowns totaux</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${totalXP}</div>
                        <div class="stat-label">XP distribuée</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${kickoffEventsCount}</div>
                        <div class="stat-label">Événements</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${this.countTotalPlayers()}</div>
                        <div class="stat-label">Joueurs totaux</div>
                    </div>
                </div>

                ${this.matchData.mvp && this.matchData.mvp.playerId ? this.getMVPSummary() : ''}
            </div>
        `;
    }

    getTeamsSummarySection() {
        return `
            <div class="teams-summary-section">
                <h3>👥 Résumé des Équipes</h3>
                <div class="teams-comparison">
                    ${this.getTeamSummaryCard(1)}
                    ${this.getTeamSummaryCard(2)}
                </div>
            </div>
        `;
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
                </div>
            </div>
        `;
    }

    getFinancialSummarySection() {
        const team1Gains = this.calculateGains(1);
        const team2Gains = this.calculateGains(2);
        const team1Sales = this.calculateSalesTotal(1);
        const team2Sales = this.calculateSalesTotal(2);

        return `
            <div class="financial-summary-section">
                <h3>💰 Résumé Financier</h3>
                <div class="financial-grid">
                    <div class="financial-item">
                        <h5>${this.matchData.team1.name}</h5>
                        <div class="financial-row">
                            <span>Gains du match</span>
                            <span>+${Utils.formatNumber(team1Gains)} PO</span>
                        </div>
                        ${team1Sales > 0 ? `
                            <div class="financial-row">
                                <span>Ventes de joueurs</span>
                                <span>+${Utils.formatNumber(team1Sales)} PO</span>
                            </div>
                        ` : ''}
                        <div class="financial-row total">
                            <span>Total</span>
                            <span>+${Utils.formatNumber(team1Gains + team1Sales)} PO</span>
                        </div>
                    </div>

                    <div class="financial-item">
                        <h5>${this.matchData.team2.name}</h5>
                        <div class="financial-row">
                            <span>Gains du match</span>
                            <span>+${Utils.formatNumber(team2Gains)} PO</span>
                        </div>
                        ${team2Sales > 0 ? `
                            <div class="financial-row">
                                <span>Ventes de joueurs</span>
                                <span>+${Utils.formatNumber(team2Sales)} PO</span>
                            </div>
                        ` : ''}
                        <div class="financial-row total">
                            <span>Total</span>
                            <span>+${Utils.formatNumber(team2Gains + team2Sales)} PO</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getExportSection() {
        return `
            <div class="export-section">
                <h3>📤 Export & Sauvegarde</h3>
                <div class="export-options">
                    <button class="btn btn-secondary" onclick="app.printSummary()">
                        🖨️ Version imprimable
                    </button>
                    <button class="btn btn-secondary" onclick="app.exportMatchData()">
                        💾 Exporter les données (JSON)
                    </button>
                    <button class="btn btn-secondary" onclick="app.importMatchData()">
                        💾 Importer les données (JSON)
                    </button>
                    <button class="btn btn-secondary" onclick="app.saveMatchState()">
                        ☁️ Sauvegarder localement
                    </button>
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

    // Méthode pour imprimer le résumé
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

        <!-- MVP -->
        ${this.matchData.mvp && this.matchData.mvp.playerId ? (() => {
            const mvpTeam = this.matchData.mvp.team;
            const mvpPlayer = this.matchData[`team${mvpTeam}`].players.find(p => p.id === this.matchData.mvp.playerId);
            return mvpPlayer ? `
            <div class="mvp-display">
                🌟 Joueur du Match : ${mvpPlayer.name} (${this.matchData[`team${mvpTeam}`].name}) - +4 XP Bonus
            </div>` : '';
        })() : ''}

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
            // Réinitialiser toutes les données
            this.matchData = {
                team1: this.createTeamObject(),
                team2: this.createTeamObject(),
                weather: {
                    type: 'classique',  // AJOUT : Type de météo sélectionné
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
                mvp: null
            };

            // Réinitialiser les inducements
            this.initializeInducementsData();

            // Sauvegarder et retourner au début
            this.saveState();
            this.switchTab('setup');
        }
    }

    // === MÉTHODES DE SAUVEGARDE ===

    saveState() {
        try {
            const stateToSave = {
                matchData: this.matchData,
                currentTab: this.currentTab,
                saveDate: new Date().toISOString(),
                version: AppConfig.version
            };

            // Sauvegarde principale
            const saved = Utils.storage.set('match_state', stateToSave);

            // Sauvegarde de secours silencieuse
            if (saved) {
                const backupKey = `match_backup_${new Date().getTime()}`;
                Utils.storage.set(backupKey, stateToSave);

                // Nettoyer les anciennes sauvegardes silencieusement
                this.cleanOldBackups();
            }

            // Ne PAS afficher l'indicateur pour les sauvegardes automatiques
            // this.showSaveIndicator(); // Commenté

            return saved;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            this.showSaveError();
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
            // Essayer de charger la sauvegarde principale
            let savedState = Utils.storage.get('match_state');

            // Si pas de sauvegarde principale, chercher la plus récente des backups
            if (!savedState || !savedState.matchData) {
                console.log('Pas de sauvegarde principale, recherche de backup...');
                savedState = this.loadLatestBackup();
            }

            if (savedState && savedState.matchData) {
                this.matchData = savedState.matchData;

                // S'assurer que les nouvelles propriétés du chrono existent
                if (this.matchData.timerRunning && this.matchData.matchStart && !this.matchData.lastStartTime) {
                    // Si le chrono était en marche mais pas de lastStartTime, utiliser matchStart
                    this.matchData.lastStartTime = this.matchData.matchStart;
                }

                // S'assurer que pausedDuration existe
                if (!this.matchData.hasOwnProperty('pausedDuration')) {
                    this.matchData.pausedDuration = 0;
                }

                // S'assurer que timerRunning existe
                if (!this.matchData.hasOwnProperty('timerRunning')) {
                    this.matchData.timerRunning = false;
                }

                // S'assurer que lastStartTime existe
                if (!this.matchData.hasOwnProperty('lastStartTime')) {
                    this.matchData.lastStartTime = null;
                }

                if (!this.matchData.team1.hasOwnProperty('fansUpdateRoll')) {
                    this.matchData.team1.fansUpdateRoll = null;
                    this.matchData.team1.fansUpdateResult = '';
                }
                if (!this.matchData.team2.hasOwnProperty('fansUpdateRoll')) {
                    this.matchData.team2.fansUpdateRoll = null;
                    this.matchData.team2.fansUpdateResult = '';
                }

                // Migration des anciennes données
                this.migrateOldData();

                // Afficher les informations de récupération
                this.showRecoveryInfo(savedState.saveDate);

                console.log('État restauré:', savedState.saveDate);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            return false;
        }
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
        }, 1000); // Sauvegarde 1 seconde après la fin de la saisie

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
        this.saveState();
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
                            value="${this.matchData.inducements.team1Treasury}"
                            onchange="app.updateInducementBudget(1)">
                        <span>PO</span>
                    </div>

                    <div class="budget-display">
                        <div class="budget-item ${team1PetiteMonnaie > 0 ? 'warning' : ''}">
                            <div class="label">Petite Monnaie</div>
                            <div class="value">${Utils.formatNumber(team1PetiteMonnaie)} PO</div>
                        </div>
                        <div class="budget-item">
                            <div class="label">Budget Total</div>
                            <div class="value" id="team1-total-budget">
                                ${Utils.formatNumber(team1PetiteMonnaie + this.matchData.inducements.team1Treasury)} PO
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
                </div>

                <div class="team-inducements">
                    <h4>🚌 ${this.matchData.team2.name || 'Équipe 2'}</h4>

                    <div class="treasury-input">
                        <label>Trésorerie disponible :</label>
                        <input type="number" id="team2-treasury"
                            placeholder="0" min="0" step="1000"
                            value="${this.matchData.inducements.team2Treasury}"
                            onchange="app.updateInducementBudget(2)">
                        <span>PO</span>
                    </div>

                    <div class="budget-display">
                        <div class="budget-item ${team2PetiteMonnaie > 0 ? 'warning' : ''}">
                            <div class="label">Petite Monnaie</div>
                            <div class="value">${Utils.formatNumber(team2PetiteMonnaie)} PO</div>
                        </div>
                        <div class="budget-item">
                            <div class="label">Budget Total</div>
                            <div class="value" id="team2-total-budget">
                                ${Utils.formatNumber(team2PetiteMonnaie + this.matchData.inducements.team2Treasury)} PO
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

    changeInducementQty(team, inducementName, change) {
        const inducement = AppConfig.gameData.inducements.find(ind => ind.name === inducementName);
        if (!inducement) return;

        const items = this.matchData.inducements[`team${team}Items`];
        const currentQty = items[inducementName] || 0;
        const newQty = Math.max(0, Math.min(inducement.max, currentQty + change));

        // Vérifier le budget
        const totalCost = this.calculateInducementsCost(team, inducementName, newQty);
        const budget = this.getTeamBudget(team);

        if (totalCost <= budget) {
            items[inducementName] = newQty;
            this.updateInducementsDisplay(team);
        }
        this.saveState();
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

    getTeamBudget(team) {
        const petiteMonnaie = team === 1 ?
            this.matchData.inducements.team1PetiteMonnaie :
            this.matchData.inducements.team2PetiteMonnaie;
        const treasury = this.matchData.inducements[`team${team}Treasury`];
        return petiteMonnaie + treasury;
    }

    updateInducementBudget(team) {
        const treasuryInput = document.getElementById(`team${team}-treasury`);
        this.matchData.inducements[`team${team}Treasury`] = parseInt(treasuryInput.value) || 0;
        this.updateInducementsDisplay(team);
    }

    updateInducementsDisplay(team) {
        // Mettre à jour la liste
        const listContainer = document.getElementById(`team${team}-inducements-list`);
        if (listContainer) {
            listContainer.innerHTML = this.getInducementsListHTML(team);
        }

        // Mettre à jour les totaux
        const totalCost = this.calculateInducementsCost(team);
        const budget = this.getTeamBudget(team);
        const remaining = budget - totalCost;

        const totalCostEl = document.getElementById(`team${team}-total-cost`);
        const remainingEl = document.getElementById(`team${team}-remaining-budget`);
        const budgetEl = document.getElementById(`team${team}-total-budget`);

        if (totalCostEl) totalCostEl.textContent = Utils.formatNumber(totalCost);
        if (remainingEl) remainingEl.textContent = Utils.formatNumber(remaining);
        if (budgetEl) budgetEl.textContent = Utils.formatNumber(budget);
    }

    validateInducements() {
        // Sauvegarder les données
        this.saveState();

        // Fermer la modal
        this.closeInducementsModal();

        // Rafraîchir l'affichage de l'onglet
        this.loadTab(this.currentTab);

        // Message de confirmation (optionnel)
        console.log('Coups de pouce validés !');
    }

    getSelectedInducementsDisplay() {
        const team1Inducements = this.getTeamInducementsList(1);
        const team2Inducements = this.getTeamInducementsList(2);

        // Si aucun coup de pouce n'est sélectionné, ne rien afficher
        if (team1Inducements.length === 0 && team2Inducements.length === 0) {
            return '';
        }

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

            const total1 = team1Inducements.reduce((sum, item) => sum + item.totalCost, 0);
            html += `
                        <div class="inducement-summary-total">
                            <span>Total :</span>
                            <span>${Utils.formatNumber(total1)} PO</span>
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

            const total2 = team2Inducements.reduce((sum, item) => sum + item.totalCost, 0);
            html += `
                        <div class="inducement-summary-total">
                            <span>Total :</span>
                            <span>${Utils.formatNumber(total2)} PO</span>
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

    getScoreDisplay() {
        const team1 = this.matchData.team1;
        const team2 = this.matchData.team2;

        return `
            <div class="score-display">
                <h2>⚽ SCORE ACTUEL</h2>
                <div class="score-numbers">
                    <div class="team-score">
                        <div class="score" id="score1">${team1.score}</div>
                        <div class="name">${team1.name || 'Équipe 1'}</div>
                    </div>
                    <div class="vs">VS</div>
                    <div class="team-score">
                        <div class="score" id="score2">${team2.score}</div>
                        <div class="name">${team2.name || 'Équipe 2'}</div>
                    </div>
                </div>
                <div class="score-controls">
                    <button class="dice-btn" onclick="app.addTouchdown(1)">🏈 TD ${team1.name || 'Équipe 1'}</button>
                    <button class="dice-btn" onclick="app.addTouchdown(2)">🏈 TD ${team2.name || 'Équipe 2'}</button>
                    <button class="dice-btn" onclick="app.resetScore()" style="background: #dc3545;">🔄 Reset Score</button>
                </div>
            </div>
        `;
    }

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
                        value="" min="2" max="12" onchange="app.updateKickoffEvent()">
                </div>
                <div id="kickoff-description" class="result-box" style="display: none;"></div>

                ${this.getKickoffHistory()}
            </div>
        `;
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
                    ${events.map((event, index) => `
                        <div class="history-item">
                            <span class="history-number">${index + 1}</span>
                            <span class="history-text">${event}</span>
                            <button class="btn-remove-event"
                                onclick="app.removeKickoffEvent(${index})"
                                title="Supprimer cet événement">
                                ❌
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    removeKickoffEvent(index) {
        if (confirm('Supprimer cet événement de l\'historique ?')) {
            // Supprimer l'événement de la liste
            this.matchData.kickoffEvents.splice(index, 1);

            // Sauvegarder les changements
            this.saveState();

            // Rafraîchir l'affichage
            this.loadTab('match');

            // Feedback tactile
            Utils.vibrate(20);
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
                <td>
                    <input type="checkbox" class="action-checkbox"
                        data-team="${team}"
                        data-player="${player.id}"
                        data-action="reu"
                        data-xp="1"
                        ${player.actions && player.actions.reu ? 'checked' : ''}
                        onchange="app.updatePlayerAction(${team}, '${player.id}', 'reu', this.checked)">
                </td>
                <td>
                    <input type="checkbox" class="action-checkbox"
                        data-team="${team}"
                        data-player="${player.id}"
                        data-action="det"
                        data-xp="1"
                        ${player.actions && player.actions.det ? 'checked' : ''}
                        onchange="app.updatePlayerAction(${team}, '${player.id}', 'det', this.checked)">
                </td>
                <td>
                    <input type="checkbox" class="action-checkbox"
                        data-team="${team}"
                        data-player="${player.id}"
                        data-action="int"
                        data-xp="2"
                        ${player.actions && player.actions.int ? 'checked' : ''}
                        onchange="app.updatePlayerAction(${team}, '${player.id}', 'int', this.checked)">
                </td>
                <td>
                    <input type="checkbox" class="action-checkbox"
                        data-team="${team}"
                        data-player="${player.id}"
                        data-action="elim"
                        data-xp="2"
                        ${player.actions && player.actions.elim ? 'checked' : ''}
                        onchange="app.updatePlayerAction(${team}, '${player.id}', 'elim', this.checked)">
                </td>
                <td>
                    <input type="checkbox" class="action-checkbox"
                        data-team="${team}"
                        data-player="${player.id}"
                        data-action="td"
                        data-xp="3"
                        ${player.actions && player.actions.td ? 'checked' : ''}
                        onchange="app.updatePlayerAction(${team}, '${player.id}', 'td', this.checked)">
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

    // Gestion du score
    addTouchdown(team) {
        this.matchData[`team${team}`].score++;
        document.getElementById(`score${team}`).textContent = this.matchData[`team${team}`].score;
        this.saveState();

        // Vibration pour feedback
        Utils.vibrate(50);
    }

    resetScore() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser le score ?')) {
            this.matchData.team1.score = 0;
            this.matchData.team2.score = 0;
            document.getElementById('score1').textContent = '0';
            document.getElementById('score2').textContent = '0';
            this.saveState();
        }
    }

    // Gestion des événements de coup d'envoi
    rollKickoffEvent() {
        const roll = Utils.getRandomInt(2, 12);
        document.getElementById('kickoff-result').value = roll;
        this.updateKickoffEvent();
        this.saveState();
    }

    updateKickoffEvent() {
        const roll = parseInt(document.getElementById('kickoff-result').value) || 0;

        const kickoffEvents = {
            2: "🌪️ Appelez l'arbitre : chaque coach reçoit un pot de vin pour le match.",
            3: "💥 Temps mort : si l'une des 2 équipes est au tour 4,5,6 le curseur est reculé d'une case. Sinon le curseur avance d'1 case.",
            4: "🤩 Défense solide : 1d3+3 joueurs de l'équipe qui engage peuvent être placés différemment mais dans le respect des règles de placement.",
            5: "➡ Coup de pied haut : 1 joueur « démarqué » peut se placer sur la case où va tomber la balle sans tenir compte de son mouvement.",
            6: "🏈 Fan en folie : chaque coach jette 1d6+cheerleaders, le meilleur a droit a un jet sur le tableau des prières a Nuffle.",
            7: "🙌 Coaching brillant : chaque coach jette 1d6+assistants, le meilleur a droit à une relance pour la phase (aucun si égalité).",
            8: "📣 Météo capricieuse : refaire le jet de météo ; si le résultat est condition idéale, le ballon ricoche.",
            9: "🚧 Surprise : 1d3+1 joueurs de l'équipe en réception peuvent bouger d'une case.",
            10: "⭐ Blitz : 1d3+1 joueurs « démarqués » de l'équipe qui engage peuvent être activés pour une action de M, l'un d'entre eux peut faire 1 blitz, un autre peut lancer un coéquipier. Ce tour gratuit s'arrête si un joueur chute ou est plaqué.",
            11: "🚨 Arbitre officieux : chaque coach jette 1d6+FP, le coach ayant le plus mauvais résultat désigne 1 joueur de ses joueurs, sur le terrain, au hasard (si égalité les deux coachs choisissent au hasard). Sur 2+ avec 1d6, ce joueur est « mis a terre » « sonné ». Sur un 1 il est expulsé.",
            12: "🔥 Invasion de terrain : chaque coach jette 1d6+FP, le plus mauvais désigne 1d3 de ses joueurs, sur le terrain, au hasard (si égalité les deux coachs désignent 1d3 joueurs au hasard). Ces joueurs sont « mis à terre » « sonnés »."
        };

        if (roll >= 2 && roll <= 12) {
            const event = kickoffEvents[roll] || "Événement inconnu.";

            // Ajouter à l'historique
            if (!this.matchData.kickoffEvents) {
                this.matchData.kickoffEvents = [];
            }
            this.matchData.kickoffEvents.push(event);

            // Mettre à jour l'affichage
            const descDiv = document.getElementById('kickoff-description');
            descDiv.style.display = 'block';
            descDiv.className = 'result-box warning';
            descDiv.innerHTML = `<p>Événement du Coup d'Envoi (${roll}) : <strong>${event}</strong></p>`;

            // Rafraîchir l'historique
            this.loadTab('match');

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

    calculatePlayerXP(team, playerId) {
        const player = this.matchData[`team${team}`].players.find(p => p.id === playerId);
        if (!player) return;

        let xp = 0;
        const xpValues = {
            reu: 1,
            det: 1,
            int: 2,
            elim: 2,
            td: 3,
            jdm: 4
        };

        Object.keys(xpValues).forEach(action => {
            if (player.actions && player.actions[action]) {
                xp += xpValues[action];
            }
        });

        player.xp = xp;
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

        return `
            <div class="step-section">
                <div class="step-header">
                    <div class="step-number">8</div>
                    <div class="step-title">Gains du Match</div>
                </div>
                <div class="explanation-box">
                    <p><strong>Formule :</strong> 10 000 PO × (Facteur de Popularité + Touchdowns marqués)</p>
                    <p>Une équipe qui concède ne compte pas son facteur de popularité</p>
                </div>
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="label">${this.matchData.team1.name || 'Équipe 1'}</div>
                        <div class="value">${Utils.formatNumber(team1Gains)} PO</div>
                        <small>Calcul : (${this.matchData.team1.popularity} + ${this.matchData.team1.score}) × 10k</small>
                    </div>
                    <div class="summary-item">
                        <div class="label">${this.matchData.team2.name || 'Équipe 2'}</div>
                        <div class="value">${Utils.formatNumber(team2Gains)} PO</div>
                        <small>Calcul : (${this.matchData.team2.popularity} + ${this.matchData.team2.score}) × 10k</small>
                    </div>
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
                        <span><strong>${this.matchData.team1.name || 'Équipe 1'}</strong> (${this.getMatchResult(1)}) :</span>
                        <button class="dice-btn" onclick="app.rollFansUpdate(1)">🎲 Test Fans</button>
                        <input type="number" class="dice-result" id="fans1-roll"
                            value="${this.matchData.team1.fansUpdateRoll || ''}" min="1" max="6" onchange="app.updateFans(1)">
                        <span id="fans1-result">${this.matchData.team1.fansUpdateResult || ''}</span>
                    </div>
                    <div class="dice-controls">
                        <span><strong>${this.matchData.team2.name || 'Équipe 2'}</strong> (${this.getMatchResult(2)}) :</span>
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
        return `
            <div class="step-section">
                <div class="step-header">
                    <div class="step-number">10</div>
                    <div class="step-title">Calcul de l'Expérience</div>
                </div>
                <div class="explanation-box">
                    <p><strong>Barème XP :</strong> REU/DET (1XP), INT/ELIM (2XP), TD (3XP), JDM (4XP)</p>
                    <p>L'expérience est calculée automatiquement selon les cases cochées pendant le match</p>
                </div>
                <div class="xp-summary-grid">
                    <div class="team-xp-section">
                        <h5>${this.matchData.team1.name || 'Équipe 1'}</h5>
                        ${this.getTeamXPSummary(1)}
                    </div>
                    <div class="team-xp-section">
                        <h5>${this.matchData.team2.name || 'Équipe 2'}</h5>
                        ${this.getTeamXPSummary(2)}
                    </div>
                </div>
            </div>
        `;
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

    getCostlyErrorsSection() {
        return `
            <div class="step-section">
                <div class="step-header">
                    <div class="step-number">13</div>
                    <div class="step-title">Erreurs Coûteuses</div>
                </div>
                <div class="explanation-box">
                    <p><strong>Règle :</strong> Si une équipe a ≥100 000 PO en trésorerie, elle risque des scandales</p>
                    <p><strong>Incident mineur :</strong> -D3×10k PO | <strong>Incident majeur :</strong> Trésorerie ÷ 2</p>
                    <p><strong>Catastrophe :</strong> Ne garde que 2D6×10k PO</p>
                </div>

                <div class="costly-errors-grid">
                    <div class="team-errors-section">
                        <h5>${this.matchData.team1.name || 'Équipe 1'}</h5>
                        <div class="treasury-input">
                            <label>Trésorerie actuelle :</label>
                            <input type="number" id="team1-current-treasury"
                                placeholder="0" min="0" step="1000"
                                value="${this.matchData.team1.treasury || 0}"
                                onchange="app.updateTreasury(1, this.value)">
                            <span>PO</span>
                        </div>
                        ${this.matchData.team1.treasury >= 100000 ? `
                            <div class="dice-controls">
                                <button class="dice-btn" onclick="app.rollCostlyErrors(1)">🎲 Test D6</button>
                                <input type="number" class="dice-result" id="team1-errors-roll"
                                    value="" min="1" max="6" onchange="app.updateCostlyErrors(1)">
                            </div>
                            <div id="team1-errors-result"></div>
                        ` : '<p class="success-text">Trésorerie < 100k PO : Pas de test requis</p>'}
                    </div>

                    <div class="team-errors-section">
                        <h5>${this.matchData.team2.name || 'Équipe 2'}</h5>
                        <div class="treasury-input">
                            <label>Trésorerie actuelle :</label>
                            <input type="number" id="team2-current-treasury"
                                placeholder="0" min="0" step="1000"
                                value="${this.matchData.team2.treasury || 0}"
                                onchange="app.updateTreasury(2, this.value)">
                            <span>PO</span>
                        </div>
                        ${this.matchData.team2.treasury >= 100000 ? `
                            <div class="dice-controls">
                                <button class="dice-btn" onclick="app.rollCostlyErrors(2)">🎲 Test D6</button>
                                <input type="number" class="dice-result" id="team2-errors-roll"
                                    value="" min="1" max="6" onchange="app.updateCostlyErrors(2)">
                            </div>
                            <div id="team2-errors-result"></div>
                        ` : '<p class="success-text">Trésorerie < 100k PO : Pas de test requis</p>'}
                    </div>
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
        // AJOUT : Sauvegarder le résultat du dé
        this.matchData[`team${team}`].fansUpdateRoll = roll;
        this.updateFans(team);
        this.saveState();
    }

    updateFans(team) {
        const roll = parseInt(document.getElementById(`fans${team}-roll`).value) || 0;
        const currentFans = this.matchData[`team${team}`].fans;
        const result = this.getMatchResult(team);

        // AJOUT : Sauvegarder le résultat du dé
        this.matchData[`team${team}`].fansUpdateRoll = roll;

        let message = '';
        let newFans = currentFans;

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

        this.matchData[`team${team}`].fans = newFans;
        // AJOUT : Sauvegarder le message de résultat
        this.matchData[`team${team}`].fansUpdateResult = message;

        document.getElementById(`fans${team}-result`).textContent = message;

        // Afficher le résumé
        const infoDiv = document.getElementById('fans-update-info');
        infoDiv.style.display = 'block';
        infoDiv.className = result === 'Gagnant' ? 'result-box success' : 'result-box warning';
        infoDiv.innerHTML = `<p>Mise à jour des fans terminée</p>`;

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
        const treasury = this.matchData[`team${team}`].treasury;
        const resultDiv = document.getElementById(`team${team}-errors-result`);

        const errorTable = this.getCostlyErrorResult(treasury, roll);

        if (errorTable.type === 'none') {
            resultDiv.innerHTML = '<p class="success-text">✅ Crise évitée !</p>';
        } else if (errorTable.type === 'minor') {
            const loss = Utils.getRandomInt(1, 3) * 10000;
            resultDiv.innerHTML = `<p class="warning-text">⚠️ Incident mineur : -${Utils.formatNumber(loss)} PO</p>`;
        } else if (errorTable.type === 'major') {
            resultDiv.innerHTML = `<p class="danger-text">🔥 Incident majeur : Trésorerie divisée par 2 !</p>`;
        } else if (errorTable.type === 'catastrophe') {
            resultDiv.innerHTML = `<p class="danger-text">💥 Catastrophe ! Ne garde que 2D6×10k PO</p>`;
        }

        this.saveState();
    }

    getCostlyErrorResult(treasury, roll) {
        if (treasury < 100000) return { type: 'none' };

        const table = {
            100000: { 1: 'minor', 2: 'none', 3: 'none', 4: 'none', 5: 'none', 6: 'none' },
            200000: { 1: 'minor', 2: 'minor', 3: 'none', 4: 'none', 5: 'none', 6: 'none' },
            300000: { 1: 'major', 2: 'minor', 3: 'minor', 4: 'none', 5: 'none', 6: 'none' },
            400000: { 1: 'major', 2: 'major', 3: 'minor', 4: 'minor', 5: 'none', 6: 'none' },
            500000: { 1: 'catastrophe', 2: 'major', 3: 'major', 4: 'minor', 5: 'minor', 6: 'none' },
            600000: { 1: 'catastrophe', 2: 'catastrophe', 3: 'major', 4: 'major', 5: 'minor', 6: 'minor' }
        };

        let bracket = 100000;
        if (treasury >= 600000) bracket = 600000;
        else if (treasury >= 500000) bracket = 500000;
        else if (treasury >= 400000) bracket = 400000;
        else if (treasury >= 300000) bracket = 300000;
        else if (treasury >= 200000) bracket = 200000;

        return { type: table[bracket][roll] || 'none' };
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

    getMVPSection() {
        return `
            <div class="step-section">
                <div class="step-header">
                    <div class="step-number">11</div>
                    <div class="step-title">Joueur du Match (JDM)</div>
                </div>
                <div class="explanation-box">
                    <p><strong>Règle :</strong> Un JDM est désigné pour chaque équipe</p>
                    <p>Le joueur sélectionné gagne automatiquement 4 XP bonus</p>
                    <p>Le JDM peut être n'importe quel joueur, même s'il n'est pas dans le tableau des actions</p>
                </div>

                <div class="mvp-selection-grid">
                    <div class="mvp-team-section">
                        <h5>🏠 ${this.matchData.team1.name || 'Équipe 1'}</h5>
                        <div class="mvp-input-group">
                            <label>Nom du JDM :</label>
                            <input type="text"
                                id="team1-mvp-name"
                                class="mvp-name-input"
                                placeholder="Entrez le nom du joueur"
                                value="${this.matchData.team1.mvpName || ''}"
                                onchange="app.updateMVP(1, this.value)">
                        </div>
                        ${this.matchData.team1.mvpName ? `
                            <div class="mvp-display-small">
                                <span class="mvp-icon">🌟</span>
                                <span class="mvp-text">${this.matchData.team1.mvpName} (+4 XP)</span>
                            </div>
                        ` : ''}
                    </div>

                    <div class="mvp-team-section">
                        <h5>🚌 ${this.matchData.team2.name || 'Équipe 2'}</h5>
                        <div class="mvp-input-group">
                            <label>Nom du JDM :</label>
                            <input type="text"
                                id="team2-mvp-name"
                                class="mvp-name-input"
                                placeholder="Entrez le nom du joueur"
                                value="${this.matchData.team2.mvpName || ''}"
                                onchange="app.updateMVP(2, this.value)">
                        </div>
                        ${this.matchData.team2.mvpName ? `
                            <div class="mvp-display-small">
                                <span class="mvp-icon">🌟</span>
                                <span class="mvp-text">${this.matchData.team2.mvpName} (+4 XP)</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    updateMVP(team, name) {
        this.matchData[`team${team}`].mvpName = name.trim();

        // Si le joueur existe dans le tableau, lui attribuer le JDM
        const player = this.matchData[`team${team}`].players.find(p =>
            p.name && p.name.toLowerCase() === name.toLowerCase()
        );

        if (player) {
            // Retirer JDM de tous les autres joueurs de l'équipe
            this.matchData[`team${team}`].players.forEach(p => {
                if (p.actions) p.actions.jdm = false;
            });

            // Attribuer JDM à ce joueur
            if (!player.actions) player.actions = {};
            player.actions.jdm = true;
            this.calculatePlayerXP(team, player.id);
        }

        this.saveState();
    }

    getTeamPlayersOptions(team) {
        const players = this.matchData[`team${team}`].players || [];
        return players
            .filter(p => p.name && p.name.trim() !== '')
            .map(p => `<option value="${p.id}">${p.name}</option>`)
            .join('');
    }

    getMVPDisplay() {
        if (!this.matchData.mvp || !this.matchData.mvp.playerId) {
            return '<p class="help-text">Aucun JDM sélectionné</p>';
        }

        const mvp = this.matchData.mvp;
        const team = mvp.team;
        const player = this.matchData[`team${team}`].players.find(p => p.id === mvp.playerId);

        if (!player) {
            return '<p class="help-text">Aucun JDM sélectionné</p>';
        }

        return `
            <div class="mvp-display">
                <div class="mvp-icon">🌟</div>
                <div class="mvp-info">
                    <h4>Joueur du Match</h4>
                    <p class="mvp-name">${player.name}</p>
                    <p class="mvp-team">${this.matchData[`team${team}`].name}</p>
                    <p class="mvp-bonus">+4 XP bonus accordés</p>
                </div>
            </div>
        `;
    }

    selectRandomMVP() {
        const allPlayers = [];

        // Collecter tous les joueurs éligibles
        [1, 2].forEach(team => {
            const players = this.matchData[`team${team}`].players || [];
            players.forEach(player => {
                if (player.name && player.name.trim() !== '') {
                    allPlayers.push({
                        ...player,
                        team: team
                    });
                }
            });
        });

        if (allPlayers.length === 0) {
            alert('Aucun joueur éligible pour être JDM');
            return;
        }

        // Sélection aléatoire
        const randomIndex = Math.floor(Math.random() * allPlayers.length);
        const mvpPlayer = allPlayers[randomIndex];

        // Enregistrer le MVP
        this.setMVP(mvpPlayer.team, mvpPlayer.id);
    }

    selectManualMVP(team) {
        const select = document.getElementById(`team${team}-mvp-select`);
        const playerId = select.value;

        if (!playerId) return;

        // Réinitialiser l'autre select
        const otherTeam = team === 1 ? 2 : 1;
        document.getElementById(`team${otherTeam}-mvp-select`).value = '';

        this.setMVP(team, playerId);
    }

    setMVP(team, playerId) {
        // Retirer l'ancien JDM s'il existe
        if (this.matchData.mvp && this.matchData.mvp.playerId) {
            const oldTeam = this.matchData.mvp.team;
            const oldPlayer = this.matchData[`team${oldTeam}`].players.find(p => p.id === this.matchData.mvp.playerId);
            if (oldPlayer && oldPlayer.actions) {
                oldPlayer.actions.jdm = false;
                // Recalculer l'XP
                this.calculatePlayerXP(oldTeam, oldPlayer.id);
            }
        }

        // Définir le nouveau JDM
        this.matchData.mvp = {
            team: team,
            playerId: playerId
        };

        // Marquer le joueur comme JDM
        const player = this.matchData[`team${team}`].players.find(p => p.id === playerId);
        if (player) {
            if (!player.actions) player.actions = {};
            player.actions.jdm = true;

            // Recalculer l'XP
            this.calculatePlayerXP(team, playerId);
        }

        // Rafraîchir l'affichage
        document.getElementById('mvp-result').innerHTML = this.getMVPDisplay();

        // Mettre à jour aussi dans l'onglet Match si nécessaire
        const checkbox = document.querySelector(`input[data-player="${playerId}"][data-action="jdm"]`);
        if (checkbox) {
            checkbox.checked = true;
        }

        this.saveState();

        // Animation de célébration
        Utils.vibrate(100);
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

    getScoreDisplay() {
        const team1 = this.matchData.team1;
        const team2 = this.matchData.team2;

        return `
            <div class="score-display">
                <h2>⚽ SCORE ACTUEL</h2>

                <div class="match-timer">
                    <div class="timer-display">
                        <span class="timer-icon">⏱️</span>
                        <span id="match-timer">00:00</span>
                    </div>
                    <div class="timer-controls">
                        <button class="timer-btn ${this.matchData.timerRunning ? 'pause' : 'play'}"
                            onclick="app.toggleTimer()">
                            ${this.matchData.timerRunning ? '⏸️ Pause' : '▶️ Démarrer'}
                        </button>
                        <button class="timer-btn reset" onclick="app.resetTimer()">
                            🔄 Reset
                        </button>
                    </div>
                </div>

                <div class="score-numbers">
                    <div class="team-score">
                        <div class="score" id="score1">${team1.score}</div>
                        <div class="name">${team1.name || 'Équipe 1'}</div>
                    </div>
                    <div class="vs">VS</div>
                    <div class="team-score">
                        <div class="score" id="score2">${team2.score}</div>
                        <div class="name">${team2.name || 'Équipe 2'}</div>
                    </div>
                </div>
                <div class="score-controls">
                    <button class="dice-btn" onclick="app.addTouchdown(1)">🏈 TD ${team1.name || 'Équipe 1'}</button>
                    <button class="dice-btn" onclick="app.addTouchdown(2)">🏈 TD ${team2.name || 'Équipe 2'}</button>
                    <button class="dice-btn" onclick="app.resetScore()" style="background: #dc3545;">🔄 Reset Score</button>
                </div>
            </div>
        `;
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

}

// Rendre l'app accessible globalement pour Cordova
window.BloodBowlApp = BloodBowlApp;
