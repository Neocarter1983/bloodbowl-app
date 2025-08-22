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

        weatherTables: {
            classique: {
                name: "Météo Classique",
                icon: "🌤️",
                effects: {
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
                }
            },
            printaniere: {
                name: "Météo Printanière",
                icon: "🌸",
                effects: {
                    2: "🌱 Rosée du Matin : -1 aux jets de dés pour « Foncer ». -1 pour Ramasser",
                    3: "🌷 Floraison : Pas d’Expulsion sur Agression",
                    4: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    5: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    6: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    7: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    8: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    9: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    10: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    11: "🍂 Brumes Matinales : M = 6 cases max, « Foncer » possible. Seules les passes Rapides ou Courtes sont possibles",
                    12: "🌪️ Grand Vent : Avant d’utiliser 1 Relance, jetez 1D6. Sur 1, elle ne peut pas être utilisée"
                }
            },
            estivale: {
                name: "Météo Estivale",
                icon: "☀️",
                effects: {
                    2: "🔥 Chaleur Accablante : 1D3 joueurs désigné au hasard dans chaque équipe et présents sur le terrain lors de la précédente phase restent en Réserves",
                    3: "🌞 Astrogranite en Fusion : La capacité pour « Foncer » est réduite d’1 case",
                    4: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    5: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    6: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    7: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    8: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    9: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    10: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    11: "🌞 Lumière Aveuglante : Seules les passes Rapides ou Courtes sont possibles. -1 aux tests de CP",
                    12: "🌨️ Mousson : -1 pour Réceptionner, Interférer avec une passe et Ramasser. Balle Ricoche sur 4 au lieu de 3"
                }
            },
            automnale: {
                name: "Météo Automnale",
                icon: "🍁",
                effects: {
                    2: "🍂 Terrain Envahi de Feuilles : -1 aux jets d’AR si le joueur « Chute » ou « est Plaqué »",
                    3: "🍂 Fraîcheur Automnale : -1 aux jets pour sortir du Box des KO",
                    4: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    5: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    6: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    7: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    8: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    9: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    10: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    11: "🌨️ Pluie battante : -1 pour Réceptionner, Interférer avec une passe et Ramasser",
                    12: "🌪️ Vent fort : Direction du vent avec 1D8. 1-2 : vers En-but équipe qui engage ; 3-4 : vers En-but équipe en réception ; 5-6 : vers touche à gauche de l’équipe qui engage ; 7-8 vers touche à droite de l’équipe qui engage. Aux Coups d’Envoi, la balle dévie selon le Gabarit de Renvoi avec le 3-4 dans la direction du vent et sur 1D8 cases (au lieu d’1D6)"
                }
            },
            hivernale: {
                name: "Météo Hivernale",
                icon: "❄️",
                effects: {
                    2: "🧊 Vent Froid : -1 aux tests de CP. -1 aux jets pour sortir du Box des KO",
                    3: "🍂 Gel : +1 aux jets d’AR si le joueur « Chute » ou « est Plaqué »",
                    4: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    5: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    6: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    7: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    8: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    9: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    10: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    11: "🌨️ Neige : -1F lors des actions de Blitz",
                    12: "🌨️ Blizzard : -1 aux tests pour « Foncer » sur 1 case supp. Seules les passes Rapides ou Courtes sont possibles"
                }
            },
            souterraine: {
                name: "Météo Souterraine",
                icon: "⛏️",
                effects: {
                    2: "🏈 Infiltration du Dessous : -1 Mouvement",
                    3: "🏈 Ambiance Lugubre : -1 aux Passes Longues et Longues Bombes. -1 aux tests pour « Foncer » après la 1e case",
                    4: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    5: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    6: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    7: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    8: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    9: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    10: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    11: "🏈 Geysers : Si « Chute » ou « Plaqué », jetez 1D6. Sur 1, le joueur est traité comme s’il avait subi un Lancer Mauvais lors d’une procédure de Lancer un Coéquipier",
                    12: "🏈 Activité Sismique : À la fin de chaque tour d’équipe, jetez 1D6+(nbre de joueur ayant F5 ou +). Si un 6+ est obtenu, refaite 1 jet d’1D6 pour chaque coach, celui ayant le plus faible résultat (les 2 en cas d’égalité) voit 1 de ses joueurs sur le terrain, désigné aléatoirement, être « Plaqué » (AR + Blessure)"
                }
            },
            foret_primordiale: {
                name: "Météo Forêt Primordiale",
                icon: "🌳",
                effects: {
                    2: "🏈 Loués Soient les Dieux du Soleil : +1 aux jets d’AR lors des chutes sur « Foncer » + les conditions de la ligne 3",
                    3: "🏈 Vague de Chaleur : -1 aux tests pour « Foncer » sur 1 case supp. -1 aux jets pour sortir du Box des KO",
                    4: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    5: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    6: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    7: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    8: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    9: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    10: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    11: "🏈 Averse de Jungle : -1 pour Réceptionner, Interférer avec une passe et Ramasser",
                    12: "🏈 Mousson Tropicale : -1 case pour « Foncer ». Seules les passes Rapides ou Courtes sont possibles"
                }
            },
            cimetiere: {
                name: "Météo de Cimetière",
                icon: "💀",
                effects: {
                    2: "🏈 Autochtones en Colère : Chaque coach jette 1D6. Celui ayant le plus petit résultat (les 2 si égalité) sélectionne au hasard 1 de ses joueurs sur le terrain qui rejoint la Réserves jusqu’à la fin du match ou si la Météo change. Effet cumulatif en cas de changement météo",
                    3: "🏈 Brouillard : -1 case pour « Foncer ». Seules les passes Rapides ou Courtes sont possibles. Pas d’Expulsion lors des Agressions",
                    4: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    5: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    6: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    7: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    8: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    9: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    10: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    11: "🏈 Pluie Battante : -1 pour Réceptionner, Interférer avec une passe et Ramasser",
                    12: "⛈️ Foudre : À la fin de chaque tour d’équipe, jetez 1D6. Sur 1, sélectionnez au hasard un joueur de l’équipe active, il est « Plaqué » et subit un jet d’AR avec modificateur de +1 au jet d’AR ou de Blessure (au choix après résultat du dé)"
                }
            },
            terres_gastes: {
                name: "Météo de Terres Gastes",
                icon: "🏜️",
                effects: {
                    2: "🏈 Secousses : À la fin de chaque tour d’équipe, jetez 1D6 pour chaque joueur Debout de l’équipe active. Sur 1, il est « Mis à Terre »",
                    3: "🏈 Pluie Battante : -1 pour Réceptionner, Interférer avec une passe et Ramasser",
                    4: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    5: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    6: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    7: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    8: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    9: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    10: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    11: "🌋 Bombes de Lave : Tous les joueurs ont « Cerveau Lent »",
                    12: "💨 Vent fort : Direction du vent avec 1D8. 1-2 : vers En-but équipe qui engage ; 3-4 : vers En-but équipe en réception ; 5-6 : vers touche à gauche de l’équipe qui engage ; 7-8 vers touche à droite de l’équipe qui engage. Aux Coups d’Envoi, la balle dévie selon le Gabarit de Renvoi avec le 3-4 dans la direction du vent et sur 1D8 cases (au lieu d’1D6)"
                }
            },
            montagnarde: {
                name: "Météo Montagnarde",
                icon: "⛰️",
                effects: {
                    2: "💨 Vent Violent : Pas de Coup d’Envoi, la balle est donnée à 1 joueur de l’équipe à la Réception, au choix de son coach. Aucune action de Passe ou de Lancer de Coéquipier n’est possible",
                    3: "🏈 Très Ensoleillé : -1 aux tests de CP",
                    4: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    5: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    6: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    7: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    8: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    9: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    10: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    11: "🏈 Blizzard : -1 aux tests pour « Foncer » sur 1 case supp. Seules les passes Rapides ou Courtes sont possibles",
                    12: "🏈 Tempête de Glace : -1 aux tests pour « Foncer » sur 1 case supp. -1M"
                }
            },
            cotiere: {
                name: "Météo Côtière",
                icon: "🌊",
                effects: {
                    2: "💨 Vent Violent : Pas de Coup d’Envoi, la balle est donnée à 1 joueur de l’équipe à la Réception, au choix de son coach. Aucune action de Passe ou de Lancer de Coéquipier n’est possible",
                    3: "💨 Vent fort : Direction du vent avec 1D8. 1-2 : vers En-but équipe qui engage ; 3-4 : vers En-but équipe en réception ; 5-6 : vers touche à gauche de l’équipe qui engage ; 7-8 vers touche à droite de l’équipe qui engage. Aux Coups d’Envoi, la balle dévie selon le Gabarit de Renvoi avec le 3-4 dans la direction du vent et sur 1D8 cases (au lieu d’1D6)",
                    4: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    5: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    6: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    7: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    8: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    9: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    10: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    11: "🏈 Pluie Torrentielle : -1 pour Réceptionner, Interférer avec une passe et Ramasser. Seules les passes Rapides ou Courtes sont possibles. -1M. À la fin de la Phase, juste après avoir fait le test de retour des KO, refaite un jet de Météo",
                    12: "🏈 Blizzard : -1 aux tests pour « Foncer » sur 1 case supp. Seules les passes Rapides ou Courtes sont possibles"
                }
            },
            terrain_desertique: {
                name: "Météo de Terrain Désertique",
                icon: "🌵",
                effects: {
                    2: "🏈 Chaleur Accablante : 1D3 joueurs désigné au hasard dans chaque équipe et présents sur le terrain lors de la précédente phase restent en Réserves",
                    3: "🏈 Très Ensoleillé : -1 aux tests de CP",
                    4: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    5: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    6: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    7: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    8: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    9: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    10: "⛅ Conditions idéales : temps idéal pour le Blood Bowl",
                    11: "💨 Vent fort : Direction du vent avec 1D8. 1-2 : vers En-but équipe qui engage ; 3-4 : vers En-but équipe en réception ; 5-6 : vers touche à gauche de l’équipe qui engage ; 7-8 vers touche à droite de l’équipe qui engage. Aux Coups d’Envoi, la balle dévie selon le Gabarit de Renvoi avec le 3-4 dans la direction du vent et sur 1D8 cases (au lieu d’1D6)",
                    12: "🏈 Tempête de Sable : Aucune action de Passe ou de Lancer de Coéquipier n’est possible. Pas de possibilité de « Foncer ». Pas d’Expulsion lors des Agressions"
                }
            }
        },

        weatherEffects: null,

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
                description: "S'ajoutent aux cheerleaders pour le match (peuvent dépasser les 6 max autorisées)"
            },
            {
                name: "Coachs assistants à temps partiels",
                cost: 30000,
                max: 1,
                description: "S'ajoutent aux coachs assistants pour le match (peuvent dépasser les 3 max)"
            },
            {
                name: "Mage météo",
                cost: 30000,
                max: 1,
                description: "1/match, fait 1 jet de Météo avec modificateur de + ou - 1 ou 2 au choix, au début d'un de vos tours d'équipe pour appliquer le résultat jusqu'à la fin du prochain tour adverse (ou fin de Phase si avant)."
            },
            {
                name: "Mascotte",
                cost: 30000,
                max: 1,
                description: "+1 Relance utilisable après un test de 5+ avec 1D6"
            },
            {
                name: "Bouteilles de gnôle",
                cost: 40000,
                max: 3,
                description: "Juste avant les Coups d'Envoi, 1D3 Minus de votre équipe, présent sur le terrain et choisi au hasard reçoit Intrépide, Frénésie et Gros Débile (4+) pour la durée de la Phase. (Accessible pour les équipes tiers 3)"
            },
            {
                name: "Fûts de Bloodweiser",
                cost: 50000,
                max: 2,
                description: "+1 x nombre de Fût pour rentrer sur le terrain après un KO"
            },
            {
                name: "Mesures désespérées",
                cost: 50000,
                max: 3,
                description: "1 tirage de mesure désespérée à utiliser 1 fois par match. (la mesure reste cachée de l'adversaire)"
            },
            {
                name: "Nurgling cabriolants",
                cost: 60000,
                max: 3,
                description: "Au début du match, l'équipe reçoit +1D3FP et +1 Cheerleaders par Nurgling acheté (favoris de chaos universel, coût/2 favoris de Nurgle)"
            },
            {
                name: "Débutants déchaînés",
                cost: 100000,
                max: 1,
                description: "Bonus de 1D3+1 Journaliers additionnels à ceux enrôlés gratuitement pour le match et même au-delà de 11 joueurs. Autorisé que pour « Linemen à Vil Prix »"
            },
            {
                name: "Entraînements supplémentaires",
                cost: 100000,
                max: 6,
                description: "1 relance d'équipe supplémentaire à chaque mi-temps"
            },
            {
                name: "Pots de vin",
                cost: 100000,
                max: 3,
                description: "sur 2+ le joueur n'est pas expulsé après une agression (le coach ne doit pas être expulsé pour le faire) Coût /2 pour « chantage et corruption »"
            },
            {
                name: "Apothicaire ambulant",
                cost: 100000,
                max: 2,
                description: "Vous louez les services d'un apothicaire (si la liste le permet)"
            },
            {
                name: "Assistant funéraire",
                cost: 100000,
                max: 1,
                description: "Soutien au nécromancien qui permet de relancer une fois par match un jet de régénération. Autorisé que pour « spot sylvanien »"
            },
            {
                name: "Médecin de la peste",
                cost: 100000,
                max: 1,
                description: "Pour relancer un jet de régénération une fois dans le match ou transformé un KO en « sonné ». Autorisé que pour « favoris de Nurgle »"
            },
            {
                name: "Arbitre partial",
                cost: 120000,
                max: 1,
                description: "Si un double n'est pas obtenu sur le jet d'AR ou de Blessure lors d'une Agression par le coach adverse, jetez 1D6. Sur 5+, le joueur subit une Expulsion. Lorsque vous Contester, ajoutez +1 au jet de dé. (80K PO pour équipe chantage et corruption)"
            },
            {
                name: "Chef cuistot halfling",
                cost: 300000,
                max: 1,
                description: "Au moment du coup d'envoi de chaque mi-temps, offre une relance de mi-temps et vole une relance à l'adversaire pour chaque 4+ sur 3D6. Coût/3 pour « coupe du dé à coudre halfling »"
            },
        ],

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
