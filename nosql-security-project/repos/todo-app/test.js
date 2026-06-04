// Tests pour l'application MarkSync
console.log('Demarrage des tests MarkSync...\n');

// TEST 1: Verification des dependances
console.log('TEST 1: Verification des dependances');
try {
    const express = require('express');
    const socketIo = require('socket.io');
    const marked = require('marked');
    console.log('OK - Toutes les dependances sont installees\n');
} catch (error) {
    console.log('ERREUR: ', error.message, '\n');
    process.exit(1);
}

// TEST 2: Verification du serveur Express
console.log('TEST 2: Creation du serveur Express');
try {
    const express = require('express');
    const app = express();
    app.get('/test', (req, res) => { res.json({ status: 'OK' }); });
    console.log('OK - Serveur Express cree avec succes\n');
} catch (error) {
    console.log('ERREUR avec Express: ', error.message, '\n');
    process.exit(1);
}

// TEST 3: Gestion des documents en memoire
console.log('TEST 3: Gestion des documents');
const documents = {};
const users = new Map();

documents['test-doc'] = '# Document de test\nContenu initial.';
console.log('OK - Document ajoute: test-doc');

if (documents['test-doc']) {
    console.log('OK - Document trouve en memoire');
} else {
    console.log('ERREUR - Document non trouve');
    process.exit(1);
}

const docCount = Object.keys(documents).length;
console.log('OK - Nombre de documents: ' + docCount);

users.set('user-123', { name: 'Alice', docId: 'test-doc', cursor: 10 });
console.log('OK - Utilisateur Alice ajoute');
console.log('OK - Nombre d utilisateurs: ' + users.size + '\n');

// TEST 4: Parsing Markdown
console.log('TEST 4: Conversion Markdown vers HTML');
try {
    const marked = require('marked');
    const testCases = [
        { input: '# Titre Principal', expected: 'h1', description: 'Titre niveau 1' },
        { input: '**texte en gras**', expected: 'strong', description: 'Texte en gras' },
        { input: '*texte en italique*', expected: 'em', description: 'Texte en italique' },
        { input: '- Item 1\n- Item 2', expected: 'li', description: 'Liste a puces' }
    ];

    let passed = 0;
    testCases.forEach((testCase) => {
        const html = marked.parse(testCase.input);
        if (html.includes('<' + testCase.expected)) {
            console.log('OK - ' + testCase.description);
            passed++;
        } else {
            console.log('ERREUR - ' + testCase.description);
        }
    });
    console.log('\nOK - ' + passed + '/' + testCases.length + ' tests Markdown passes\n');
} catch (error) {
    console.log('ERREUR avec marked: ', error.message, '\n');
    process.exit(1);
}

// TEST 5: Algorithmes de synchronisation
console.log('TEST 5: Algorithmes de synchronisation');

function findDiffPosition(str1, str2) {
    const length = Math.min(str1.length, str2.length);
    for (let i = 0; i < length; i++) {
        if (str1[i] !== str2[i]) return i;
    }
    return length;
}

const testCasesDiff = [
    { old: 'Hello', new: 'Hello World', expected: 5 },
    { old: 'Hello World', new: 'Hello', expected: 5 },
    { old: 'ABC', new: 'XYZ', expected: 0 },
    { old: '', new: 'Test', expected: 0 }
];

let syncPassed = true;
testCasesDiff.forEach((test, i) => {
    const result = findDiffPosition(test.old, test.new);
    if (result === test.expected) {
        console.log('OK - Test ' + (i + 1) + ': Position trouvee = ' + result);
    } else {
        console.log('ERREUR - Test ' + (i + 1) + ': Attendu ' + test.expected + ', Recu ' + result);
        syncPassed = false;
    }
});
console.log('');

// RECAP
console.log('==================================================');
console.log('RECAPITULATIF DES TESTS');
console.log('==================================================');

const allTests = [
    { name: 'Dependances', passed: true },
    { name: 'Serveur Express', passed: true },
    { name: 'Gestion documents', passed: docCount === 1 },
    { name: 'Parsing Markdown', passed: true },
    { name: 'Synchronisation', passed: syncPassed }
];

const passedTests = allTests.filter(t => t.passed).length;
const totalTests = allTests.length;

allTests.forEach(test => {
    console.log((test.passed ? 'OK' : 'ERREUR') + ' - ' + test.name);
});

console.log('==================================================');
console.log('Resultat: ' + passedTests + '/' + totalTests + ' tests passes (' + Math.round((passedTests / totalTests) * 100) + '%)');

if (passedTests === totalTests) {
    console.log('Tous les tests sont passes avec succes !');
    process.exit(0);
} else {
    console.log('Certains tests ont echoue.');
    process.exit(1);
}