// /middleware/logger.js
import fs from 'fs';
import path from 'path';

const logDirectory = path.join(__dirname, '../logs');

// Ensure log directory exists
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

const logFile = path.join(logDirectory, 'error.log');

export const logError = (message) => {
  const logMessage = `${new Date().toISOString()} - Error: ${message}\n`;
  fs.appendFile(logFile, logMessage, (err) => {
    if (err) {
      console.error('Failed to write to log file:', err);
    }
  });
};
