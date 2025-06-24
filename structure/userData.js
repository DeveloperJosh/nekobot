const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/user.json');

// Make sure the data file exists, create empty JSON if not
function ensureDataFile() {
    if (!fs.existsSync(filePath)) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true }); // ensure folder exists
        fs.writeFileSync(filePath, '{}', 'utf8');
    }
}

function loadData() {
    ensureDataFile();
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        console.error('Failed to read or parse user data file:', err);
        return {}; // fallback to empty
    }
}

function saveData(data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error('Failed to save user data file:', err);
    }
}

function ensureUser(userId) {
    const data = loadData();
    if (!data[userId]) {
        data[userId] = {
            warnings: [],
            balance: 0,
            job: null,
            quests: [],
            lossStreak: 0,
            cooldowns: {},
            equipment: {
                rod: { level: 1, name: 'Basic Rod' },
                bait: { type: 'None', count: 0 },
            },
            buffs: {
                luckBoostExpires: 0,
                energyDrinkExpires: 0,
            },
            inventory: []
        };
        saveData(data);
    } else {
        // Defensive: add missing new properties for older users
        if (!data[userId].equipment) {
            data[userId].equipment = {
                rod: { level: 1, name: 'Basic Rod' },
                bait: { type: 'None', count: 0 },
            };
        }
        if (!data[userId].buffs) {
            data[userId].buffs = {
                luckBoostExpires: 0,
                energyDrinkExpires: 0,
            };
        }
        if (!data[userId].inventory) {
            data[userId].inventory = [];
        }
        saveData(data);
    }
    return data;
}

module.exports = {
    getUser(userId) {
        const data = ensureUser(userId);
        return data[userId];
    },

    saveUser(userId, userData) {
        const data = loadData();
        data[userId] = userData;
        saveData(data);
    },

    addMoney(userId, amount) {
        const data = ensureUser(userId);
        data[userId].balance += amount;
        saveData(data);
    },

    setJob(userId, job) {
        const data = ensureUser(userId);
        data[userId].job = job;
        saveData(data);
    },

    addQuestProgress(userId, questName) {
        const data = ensureUser(userId);
        const user = data[userId];
        const quest = user.quests.find(q => q.name === questName);
        if (quest && !quest.completed) {
            quest.progress += 1;
            if (quest.progress >= 3) {
                quest.completed = true;
            }
            saveData(data);
        }
    },

    addWarning(userId, warning) {
        const data = ensureUser(userId);
        data[userId].warnings.push(warning);
        saveData(data);
    },

    getWarnings(userId) {
        const data = ensureUser(userId);
        return data[userId].warnings;
    },

    getCooldown(userId, key) {
        const data = ensureUser(userId);
        return data[userId].cooldowns[key] || 0;
    },

    updateCooldown(userId, key, value) {
        const data = ensureUser(userId);
        data[userId].cooldowns[key] = value;
        saveData(data);
    },
};
