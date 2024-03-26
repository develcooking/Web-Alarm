const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const keypress = require('keypress');

const PORT = process.env.PORT || 3000;

let childProcess; // Variable global deklarieren
let savedData = {
    name: null,
    time: null,
    days: null
};


// Funktion zum Speichern der Auswahl
function saveSelection(nameValue, timeValue, daysValue) {
    readSelectedTimeclb((err, data) => {
        if (err) {
            console.error('Fehler beim Lesen der vorhandenen Daten:', err);
            return;
        }

        // Überprüfen, ob ein Wecker mit dem gleichen Namen bereits existiert
        const existingAlarm = data.find(alarm => alarm.NameValue.name === nameValue.name);
        if (existingAlarm) {
            console.log(`Ein Wecker mit dem Namen "${nameValue.name}" existiert bereits.`);
            return;
        }

        // Wenn der Name noch nicht existiert, neuen Wecker hinzufügen
        data.push({ NameValue: nameValue, timeValue: timeValue, daysValue: daysValue });

        const jsonString = JSON.stringify(data, null, 4); // Hier wird ein Einzug von 4 Leerzeichen verwendet
        const filePath = 'selectedTime.json';
        fs.writeFile(filePath, jsonString, (err) => {
            if (err) {
                console.error('Fehler beim Speichern der Daten:', err);
            } else {
                console.log('Daten erfolgreich gespeichert.');
                readSelectedTime(); // Aktualisierte Daten lesen und ausgeben
            }
        });
    });
}

// Funktion zum Löschen eines Weckers
function deleteAlarm(name) {
    readSelectedTimeclb((err, data) => {
        if (err) {
            console.error('Fehler beim Lesen der vorhandenen Daten:', err);
            return;
        }
        
        // Filtern der Wecker, um den zu löschenden Wecker zu finden
        const filteredAlarms = data.filter(alarm => alarm.NameValue.name !== name);

        const jsonString = JSON.stringify(filteredAlarms, null, 4);
        const filePath = 'selectedTime.json';
        fs.writeFile(filePath, jsonString, (err) => {
            if (err) {
                console.error('Fehler beim Speichern der Daten:', err);
            } else {
                console.log(`Wecker mit dem Namen "${name}" erfolgreich gelöscht.`);
            }
        });
    });
}

// Funktion zum Verarbeiten der gespeicherten Daten
function processSavedData() {
    // Überprüfen, ob alle Daten vorhanden sind
    if (savedData.name && savedData.time && savedData.days) {
        // Aufrufen von saveSelection nur, wenn alle Daten vorhanden sind
        saveSelection(savedData.name, savedData.time, savedData.days);
        // Daten zurücksetzen, um für die nächste Anfrage bereit zu sein
        savedData = {
            name: null,
            time: null,
            days: null
        };
    } else {
        // Nicht alle Daten sind verfügbar, daher warten wir auf weitere Anfragen
    }
}

// Funktion zum Lesen der ausgewählten Zeit
function readSelectedTime() {
    const filePath = 'selectedTime.json';
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Fehler beim Lesen der Datei:', err);
        } else {
            const parsedData = JSON.parse(data);
            const formattedData = JSON.stringify(parsedData, null, 4); // Hier wird ein Einzug von 4 Leerzeichen verwendet
            console.log('Inhalt von selectedTime.json:\n', formattedData);
        }
    });
}

// Funktion zum Lesen der ausgewählten Zeit
function readSelectedTimeclb(callback) {
    const filePath = 'selectedTime.json';
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Fehler beim Lesen der Datei:', err);
            callback(err, null);
        } else {
            let parsedData;
            try {
                parsedData = JSON.parse(data);
                if (!Array.isArray(parsedData)) {
                    parsedData = []; // Wenn die Daten kein Array sind, initialisiere sie als leeres Array
                }
            } catch (parseError) {
                console.error('Fehler beim Parsen der Daten:', parseError);
                parsedData = []; // Bei einem Fehler beim Parsen initialisiere die Daten als leeres Array
            }
            callback(null, parsedData);
        }
    });
}



// Funktion zum Lesen der JSON-Datei und Ausführung von Aktionen bei Übereinstimmung
function checkTimeAndPlay() {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();

    // Laden der JSON-Datei mit den ausgewählten Zeiten
    fs.readFile('selectedTime.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Fehler beim Lesen der JSON-Datei:', err);
            return;
        }

        try {
            const selectedTimes = JSON.parse(data);
            // Durchlaufen aller ausgewählten Zeiten und Prüfen auf Übereinstimmung mit der aktuellen Zeit
            selectedTimes.forEach(timeObj => {
                const { timeValue, daysValue } = timeObj;
                const { time } = timeValue;

                // Zeit in Stunde und Minute aufteilen
                const [hour, minute] = time.split(':').map(Number);

                // Prüfen, ob die aktuelle Zeit mit der ausgewählten übereinstimmt und der Wochentag aktiviert ist
                if (currentHour === hour && currentMinute === minute && daysValue[currentTime.toLocaleString('de-DE', { weekday: 'long' })]) {
                    // Wenn Übereinstimmung, rufe playMP3 mit dem entsprechenden Dateinamen auf
                    playMP3(mp3FilePath); // Annahme: Der Dateiname entspricht dem Namen im JSON und hat die Erweiterung .mp3
                }
            });
        } catch (parseError) {
            console.error('Fehler beim Parsen der JSON-Daten:', parseError);
        }
    });
}

// Funktion alle 30 Sekunden ausführen
setInterval(checkTimeAndPlay, 60 * 1000);




function playMP3(filePath) {
    // Überprüfen, ob die Datei existiert
    if (!fs.existsSync(filePath)) {
        console.error('Die angegebene Datei existiert nicht.');
        return;
    }

    // Befehl zum Abspielen der Datei mit ffplay
    const command = `ffplay -nodisp -autoexit "${filePath}" > /dev/null 2>&1`;

    // Ausführen des Befehls
    const childProcess = exec(command/*, (error, stdout, stderr) => {
        if (error) {
            console.error('Error:', error);
            return;
        }
        console.log('stdout:', stdout);
        console.error('stderr:', stderr);
    }*/);

    // Eventuell können Sie noch eine Fehlerbehandlung hinzufügen
  /*  childProcess.on('error', (error) => {
        console.error('Error executing command:', error);
    });*/
}


// Aufruf der Funktion mit dem Pfad zur MP3-Datei
//const mp3FilePath = './sounds/Grioten_HIGH_4LERT.mp3';
const mp3FilePath = './sounds/alarm-clock.mp3';

// Funktion zum Überprüfen und Beenden des Prozesses
function überprüfeUndBeendeProzess(prozessName) {
    exec(`pgrep -x ${prozessName}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Fehler beim Überprüfen des Prozesses: ${error}`);
            return;
        }
        if (stdout.trim() !== '') {
            console.log(`Der Prozess ${prozessName} läuft. Beenden...`);
            exec(`pkill -SIGTERM -x ${prozessName}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Fehler beim Beenden des Prozesses: ${error}`);
                    return;
                }
                console.log(`Prozess ${prozessName} wurde erfolgreich beendet.`);
            });
        } else {
            console.log(`Der Prozess ${prozessName} läuft nicht.`);
        }
    });
}



keypress(process.stdin);
process.stdin.on('keypress', function (ch, key) {
    if (key && key.name === 'space') {
        console.log('Leertaste gedrückt.');
        überprüfeUndBeendeProzess('ffplay');
    }
});
process.stdin.resume();
process.stdin.setRawMode(true);
// Tastatur-Eingaben aktivieren

// Server erstellen
http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/savedays') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const daysValue = JSON.parse(body);
            savedData.days = daysValue; // Zwischengespeicherte Daten aktualisieren
            processSavedData(); // Prozess starten
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Daten erfolgreich gespeichert.');
        });
    } else if (req.method === 'POST' && req.url === '/saveTime') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const timeValue = JSON.parse(body);
            savedData.time = timeValue; // Zwischengespeicherte Daten aktualisieren
            processSavedData(); // Prozess starten
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Daten erfolgreich gespeichert.');
        });
    } else if (req.method === 'POST' && req.url === '/saveName') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const nameValue = JSON.parse(body);
            savedData.name = nameValue; // Zwischengespeicherte Daten aktualisieren
            processSavedData(); // Prozess starten
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Daten erfolgreich gespeichert.');
        });
    } else if (req.method === 'GET' && req.url === '/selectedTime') {
        readSelectedTimeclb((err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data));
            }
        });
    } else if (req.method === 'POST' && req.url === '/deleteAlarm') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const { name } = JSON.parse(body);
            deleteAlarm(name); // Funktion zum Löschen des Weckers aufrufen
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(`Wecker mit dem Namen "${name}" erfolgreich gelöscht.`);
        });
    } else {
        let filePath = '.' + req.url;
        if (filePath === './') {
            filePath = './index.html';
        }
        const extname = String(path.extname(filePath)).toLowerCase();
        const contentType = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpg',
            '.gif': 'image/gif',
            '.wav': 'audio/wav',
            '.mp4': 'video/mp4',
            '.woff': 'application/font-woff',
            '.ttf': 'application/font-ttf',
            '.eot': 'application/vnd.ms-fontobject',
            '.otf': 'application/font-otf',
            '.svg': 'application/image/svg+xml'
        }[extname] || 'application/octet-stream';

        fs.readFile(filePath, (err, content) => {
            if (err) {
                if (err.code == 'ENOENT') {
                    res.writeHead(404);
                    res.end('File not found');
                } else {
                    res.writeHead(500);
                    res.end('Sorry, check with the site admin for error: ' + err.code);
                }
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    }
}).listen(PORT);

console.log(`Server running at http://localhost:${PORT}/`);
