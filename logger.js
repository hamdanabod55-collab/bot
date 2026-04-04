// logger.js
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'bot_log.json');

// Initialize log file
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, JSON.stringify([], null, 2));
}

function logAction(type, telegramId, data = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type,
    telegramId,
    ...data
  };

  try {
    const currentLogs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    currentLogs.push(logEntry);
    fs.writeFileSync(LOG_FILE, JSON.stringify(currentLogs, null, 2));
    console.log(`[LOG] ${type} | User: ${telegramId}`);
  } catch (err) {
    console.error('Error writing to log file', err);
  }
}

module.exports = { logAction };
