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

        prayerEffects: {
            1: "🙏 Trappe traîtresse : Jusqu'à la fin de la mi temps, tout joueur qui termine son mouvement sur une case trappe jette 1d6. Sur un résultat de 1, il est considéré comme poussé dans le public. S'il portait le ballon, il rebondit.",
            2: "🙏 Pote avec l'arbitre : Jusqu'à la fin de la phase, les résultats de contestation sont traités en 2-4 et 5-6 au lieu de 2-5 et 6.",
            3: "🙏 Stylet : Choisissez 1 de vos joueur non solitaire et disponible pour cette phase, il obtient poignard jusqu'à la fin de la phase.",
            4: "🙏 Homme de fer : Choisissez un de vos joueur non solitaire et disponible pour cette phase, il obtient +1AR (max 11) pour la durée du match.",
            5: "🙏 Poings américains : Choisissez 1 de vos joueur non solitaire et disponible pour cette phase, il obtient châtaigne (+1) pour la durée du match.",
            6: "🙏 Mauvaises habitudes : Désignez au hasard 1d3 joueurs adverses non solitaire et disponible pour cette phase, ils obtiennent solitaire (2+) jusqu'à la fin de la phase.",
            7: "🙏 Crampons graisseux : Désignez au hasard 1 joueur adverse disponible pour cette phase, il obtient -1M jusqu'à la fin de la phase.",
            8: "🙏 Statue bénie de Nuffle : Choisissez 1 de vos joueur non solitaire et disponible pour cette phase, il obtient Pro pour la durée du match."
        },

        kickoffEvents: {
            2: "🌪️ Appelez l'arbitre : chaque coach reçoit un pot de vin pour le match.",
            3: "💥 Temps mort : si l'une des 2 équipes est au tour 4,5,6 le curseur est reculé d'une case. Sinon le curseur avance d'1 case.",
            4: "🤩 Défense solide : 1d3+3 joueurs de l'équipe qui engage peuvent être placés différemment mais dans le respect des règles de placement.",
            5: "➡ Coup de pied haut : 1 joueur « démarqué » peut se placer sur la case où va tomber la balle sans tenir compte de son mouvement.",
            6: "🏈 Fan en folie : chaque coach jette 1d6+cherleeders, le meilleur a droit a un jet sur le tableau des prières a Nuffle.",
            7: "🙌 Coaching brillant : chaque coach jette 1d6+assistants, le meilleur a droit à une relance pour la phase (aucun si égalité).",
            8: "📣 Météo capricieuse : refaire le jet de météo ; si le résultat est condition idéale, le ballon ricoche.",
            9: "🚧 Surprise : 1d3+1 joueurs de l'équipe en réception peuvent bouger d'une case.",
            10: "⭐ Blitz : 1d3+1 joueurs « démarqués » de l'équipe qui engage peuvent être activés pour une action de M, l'un d'entre eux peut faire 1 blitz, un autre peut lancer un coéquipier. Ce tour gratuit s'arrête si un joueur chute ou est plaqué.",
            11: "🚨 Arbitre officieux : chaque coach jette 1d6+FP, le coach ayant le plus mauvais résultat désigne 1 joueur des se joueurs, sur le terrain, au hasard (si égalité les deux coachs choisisse au hasard). Sur 2+ avec 1d6, ce joueur est « mis a terre » « sonné » . Sur un 1 il est expulsé.",
            12: "🔥 Invasion de terrain : chaque coach jette 1d6+FP, le plus mauvais désigne 1d3 de ses joueurs, sur le terrain, au hasard (si égalité les deux coachs désignent 1d3 joueurs au hasard) . Ces joueurs sont « mis à terre » « sonnés »."
        },

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