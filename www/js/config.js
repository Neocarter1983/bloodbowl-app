// js/config.js
const AppConfig = {
    // Version
    version: '1.0.0',

    // Configuration de stockage
    storage: {
        prefix: 'bloodbowl_',
        keys: {
            matchState: 'match_state',
            settings: 'settings',
            teams: 'teams'
        }
    },

    // Configuration des limites
    limits: {
        maxPlayers: 11,
        minPlayers: 7,
        maxFans: 6,
        minFans: 1,
        startingBudget: 600000,
        maxRerolls: 6,
        maxAssistants: 3,
        maxCheerleaders: 6
    },

    // Données du jeu (déplacer depuis le HTML)
    gameData: {
        weatherEffects: {
            2: "🌡️ Chaleur Accablante : À la fin de la Phase, 1D3 joueurs tirés au sort dans chaque équipe et se trouvant sur le terrain sont placés en Réserves et ratent la prochaine Phase",
            3: "☀️ Très ensoleillé : -1 aux tests de Capacité de Passe",
            4: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
            5: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
            6: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
            7: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
            8: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
            9: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
            10: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
            11: "⚡ Pluie Battante : -1 aux jets d'AG pour Réceptionner, Ramasser le ballon, ou Interférer avec une passe",
            12: "❄️ Blizzard : -1 aux tests pour « Foncer » sur 1 case supp. Seules les passes Rapides ou Courtes sont possibles"
        },

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
        ]
    },

    // Configuration mobile
    mobile: {
        enableSwipeNavigation: true,
        enablePullToRefresh: false,
        enableHapticFeedback: true,
        autoSaveInterval: 30000 // 30 secondes
    },

    // URLs et endpoints
    api: {
        baseUrl: '', // Pour future API
        timeout: 10000
    }
};

// Rendre la config globale
window.AppConfig = AppConfig;