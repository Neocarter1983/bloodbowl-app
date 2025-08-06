// =======================================================================================
// FICHIER: www/js/validation-tests.js
// Suite de tests pour le système de validation
// À inclure UNIQUEMENT en développement/debug
// =======================================================================================

window.ValidationTestSuite = {

    // Test 1 : Vérifier que le système est initialisé
    testInitialization() {
        console.group('🧪 Test 1: Initialisation du système');

        const checks = {
            'window.app existe': !!window.app,
            'navigationManager existe': !!window.navigationManager,
            'secureTabSwitch existe': !!window.secureTabSwitch,
            'errorManager existe': !!window.errorManager,
            'matchData existe': !!(window.app && window.app.matchData),
            'team1 existe': !!(window.app && window.app.matchData.team1),
            'team2 existe': !!(window.app && window.app.matchData.team2)
        };

        let allPassed = true;
        for (const [test, result] of Object.entries(checks)) {
            console.log(`${result ? '✅' : '❌'} ${test}`);
            if (!result) allPassed = false;
        }

        console.log(allPassed ? '✅ TOUS LES TESTS PASSÉS' : '❌ CERTAINS TESTS ONT ÉCHOUÉ');
        console.groupEnd();

        return allPassed;
    },

    // Test 2 : Validation avec données vides
    testEmptyData() {
        console.group('🧪 Test 2: Validation avec données vides');

        // Sauvegarder l'état actuel
        const backup = this.backupData();

        // Vider les données
        app.matchData.team1.name = '';
        app.matchData.team2.name = '';
        app.matchData.team1.vea = 0;
        app.matchData.team2.vea = 0;

        // Tester la navigation vers prematch
        const result = window.navigationManager.canNavigateTo('prematch', app.matchData);

        console.log('Données vides:');
        console.log('- Team1 name:', app.matchData.team1.name || 'VIDE');
        console.log('- Team2 name:', app.matchData.team2.name || 'VIDE');
        console.log('- Team1 VEA:', app.matchData.team1.vea);
        console.log('- Team2 VEA:', app.matchData.team2.vea);

        console.log('\nRésultat validation:');
        console.log('- Peut naviguer:', result.canNavigate);
        console.log('- Champs manquants:', result.missing);

        const testPassed = !result.canNavigate && result.missing.includes('Nom équipe 1') && result.missing.includes('Nom équipe 2');

        console.log(testPassed ? '✅ TEST PASSÉ (navigation bloquée comme attendu)' : '❌ TEST ÉCHOUÉ');

        // Restaurer les données
        this.restoreData(backup);
        console.groupEnd();

        return testPassed;
    },

    // Test 3 : Validation avec données partielles
    testPartialData() {
        console.group('🧪 Test 3: Validation avec données partielles');

        const backup = this.backupData();

        // Données partielles
        app.matchData.team1.name = 'Équipe Test';
        app.matchData.team2.name = ''; // Manquant
        app.matchData.team1.vea = 600000;
        app.matchData.team2.vea = 0; // OK car autorisé

        const result = window.navigationManager.canNavigateTo('prematch', app.matchData);

        console.log('Données partielles:');
        console.log('- Team1 name:', app.matchData.team1.name);
        console.log('- Team2 name:', app.matchData.team2.name || 'VIDE');
        console.log('- Team1 VEA:', app.matchData.team1.vea);
        console.log('- Team2 VEA:', app.matchData.team2.vea);

        console.log('\nRésultat validation:');
        console.log('- Peut naviguer:', result.canNavigate);
        console.log('- Champs manquants:', result.missing);

        const testPassed = !result.canNavigate && result.missing.includes('Nom équipe 2');

        console.log(testPassed ? '✅ TEST PASSÉ' : '❌ TEST ÉCHOUÉ');

        this.restoreData(backup);
        console.groupEnd();

        return testPassed;
    },

    // Test 4 : Validation avec données complètes
    testCompleteData() {
        console.group('🧪 Test 4: Validation avec données complètes');

        const backup = this.backupData();

        // Données complètes
        app.matchData.team1.name = 'Les Orcs Verts';
        app.matchData.team2.name = 'Les Nains du Tonnerre';
        app.matchData.team1.vea = 600000;
        app.matchData.team2.vea = 550000;

        const result = window.navigationManager.canNavigateTo('prematch', app.matchData);

        console.log('Données complètes:');
        console.log('- Team1 name:', app.matchData.team1.name);
        console.log('- Team2 name:', app.matchData.team2.name);
        console.log('- Team1 VEA:', app.matchData.team1.vea);
        console.log('- Team2 VEA:', app.matchData.team2.vea);

        console.log('\nRésultat validation:');
        console.log('- Peut naviguer:', result.canNavigate);
        console.log('- Champs manquants:', result.missing);

        const testPassed = result.canNavigate && result.missing.length === 0;

        console.log(testPassed ? '✅ TEST PASSÉ (navigation autorisée)' : '❌ TEST ÉCHOUÉ');

        this.restoreData(backup);
        console.groupEnd();

        return testPassed;
    },

    // Test 5 : VEA à zéro (doit être accepté)
    testZeroVEA() {
        console.group('🧪 Test 5: VEA à zéro');

        const backup = this.backupData();

        app.matchData.team1.name = 'Équipe Sans Budget';
        app.matchData.team2.name = 'Équipe Riche';
        app.matchData.team1.vea = 0; // Doit être accepté
        app.matchData.team2.vea = 1000000;

        const result = window.navigationManager.canNavigateTo('prematch', app.matchData);

        console.log('Test VEA = 0:');
        console.log('- Team1 VEA:', app.matchData.team1.vea);
        console.log('- Team2 VEA:', app.matchData.team2.vea);
        console.log('- Peut naviguer:', result.canNavigate);

        const testPassed = result.canNavigate;

        console.log(testPassed ? '✅ TEST PASSÉ (VEA=0 acceptée)' : '❌ TEST ÉCHOUÉ');

        this.restoreData(backup);
        console.groupEnd();

        return testPassed;
    },

    // Test 6 : Navigation arrière (toujours autorisée)
    testBackwardNavigation() {
        console.group('🧪 Test 6: Navigation arrière');

        // Simuler qu'on est sur l'onglet match
        const originalTab = app.currentTab;
        app.currentTab = 'match';

        // Tester la navigation vers setup (arrière)
        const canGoBack = window.secureTabSwitch(app, 'setup');

        console.log('Navigation de match vers setup:');
        console.log('- Autorisée:', canGoBack);

        const testPassed = canGoBack === true;

        console.log(testPassed ? '✅ TEST PASSÉ (navigation arrière autorisée)' : '❌ TEST ÉCHOUÉ');

        app.currentTab = originalTab;
        console.groupEnd();

        return testPassed;
    },

    // Test 7 : Validation pour l'onglet match
    testMatchTabRequirements() {
        console.group('🧪 Test 7: Validation onglet Match');

        const backup = this.backupData();

        // Données pour prematch OK
        app.matchData.team1.name = 'Équipe 1';
        app.matchData.team2.name = 'Équipe 2';
        app.matchData.team1.vea = 100000;
        app.matchData.team2.vea = 100000;

        // Mais pas de popularité (requise pour match)
        app.matchData.team1.popularity = 0;
        app.matchData.team2.popularity = 0;

        const resultPrematch = window.navigationManager.canNavigateTo('prematch', app.matchData);
        const resultMatch = window.navigationManager.canNavigateTo('match', app.matchData);

        console.log('Navigation vers prematch:', resultPrematch.canNavigate);
        console.log('Navigation vers match:', resultMatch.canNavigate);

        // Maintenant ajouter la popularité
        app.matchData.team1.popularity = 3;
        app.matchData.team2.popularity = 4;

        const resultMatchAfter = window.navigationManager.canNavigateTo('match', app.matchData);
        console.log('Navigation vers match après popularité:', resultMatchAfter.canNavigate);

        const testPassed = resultPrematch.canNavigate && resultMatchAfter.canNavigate;

        console.log(testPassed ? '✅ TEST PASSÉ' : '❌ TEST ÉCHOUÉ');

        this.restoreData(backup);
        console.groupEnd();

        return testPassed;
    },

    // Méthodes utilitaires
    backupData() {
        return {
            team1: { ...app.matchData.team1 },
            team2: { ...app.matchData.team2 }
        };
    },

    restoreData(backup) {
        app.matchData.team1 = backup.team1;
        app.matchData.team2 = backup.team2;
    },

    // Lancer tous les tests
    runAll() {
        console.log('🚀 LANCEMENT DE LA SUITE DE TESTS DE VALIDATION');
        console.log('=' .repeat(50));

        const tests = [
            { name: 'Initialisation', fn: () => this.testInitialization() },
            { name: 'Données vides', fn: () => this.testEmptyData() },
            { name: 'Données partielles', fn: () => this.testPartialData() },
            { name: 'Données complètes', fn: () => this.testCompleteData() },
            { name: 'VEA à zéro', fn: () => this.testZeroVEA() },
            { name: 'Navigation arrière', fn: () => this.testBackwardNavigation() },
            { name: 'Onglet Match', fn: () => this.testMatchTabRequirements() }
        ];

        let passed = 0;
        let failed = 0;

        tests.forEach((test, index) => {
            console.log(`\n📝 Test ${index + 1}/${tests.length}: ${test.name}`);
            try {
                if (test.fn()) {
                    passed++;
                } else {
                    failed++;
                }
            } catch (error) {
                console.error(`❌ Erreur dans le test: ${error.message}`);
                failed++;
            }
        });

        console.log('\n' + '=' .repeat(50));
        console.log('📊 RÉSULTATS FINAUX:');
        console.log(`✅ Tests réussis: ${passed}/${tests.length}`);
        console.log(`❌ Tests échoués: ${failed}/${tests.length}`);

        if (failed === 0) {
            console.log('🎉 TOUS LES TESTS SONT PASSÉS !');
        } else {
            console.log('⚠️ Certains tests ont échoué, vérifiez les logs ci-dessus');
        }

        return { passed, failed, total: tests.length };
    }
};

// Commandes rapides pour la console
console.log('📚 Suite de tests chargée. Commandes disponibles:');
console.log('- ValidationTestSuite.runAll() : Lancer tous les tests');
console.log('- ValidationTestSuite.testInitialization() : Test d\'initialisation');
console.log('- ValidationTestSuite.testEmptyData() : Test données vides');
console.log('- ValidationTestSuite.testCompleteData() : Test données complètes');
console.log('- window.testValidationSystem() : Test rapide du système');
console.log('- window.checkCurrentValidation() : Vérifier l\'état actuel');
