// store.js
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

const defaultState = {
  users: {},
  videos: [],
  processedTransactions: []
};

// Auto-initialize if not exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(defaultState, null, 2));
}

let state = null;

function loadState() {
  if (!state) {
    try {
      const p = fs.readFileSync(DATA_FILE, 'utf8');
      state = JSON.parse(p);
    } catch (err) {
      console.error('Error reading data.json. Using memory state.', err);
      state = JSON.parse(JSON.stringify(defaultState));
    }
  }
  return state;
}

function saveState() {
  if (state) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
  }
}

// User ops
function getUser(telegramId) {
  state = loadState();
  if (!state.users[telegramId]) {
    state.users[telegramId] = {
      username: '',
      balance: 0,
      videosReceived: [],
      lastPaymentHash: null,
      createdAt: new Date().toISOString()
    };
    saveState();
  }
  return state.users[telegramId];
}

function updateUser(telegramId, data) {
  state = loadState();
  if (state.users[telegramId]) {
    Object.assign(state.users[telegramId], data);
    saveState();
  }
}

// Video ops
function addVideo(fileId) {
  state = loadState();
  if (!state.videos.includes(fileId)) {
    state.videos.push(fileId);
    saveState();
    return true;
  }
  return false;
}

function getUnseenVideoForUser(telegramId) {
  state = loadState();
  const user = getUser(telegramId);
  const availableVideo = state.videos.find(v => !user.videosReceived.includes(v));
  return availableVideo;
}

// Tx ops
function getProcessedTransactions() {
  return loadState().processedTransactions;
}

function addProcessedTransaction(hash) {
  state = loadState();
  if (!state.processedTransactions.includes(hash)) {
    state.processedTransactions.push(hash);
    saveState();
  }
}

module.exports = {
  loadState,
  saveState,
  getUser,
  updateUser,
  addVideo,
  getUnseenVideoForUser,
  getProcessedTransactions,
  addProcessedTransaction
};
