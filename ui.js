/**
 * ui.js
 * Manages the Terminal User Interface (TUI) using the 'blessed' library.
 */

const blessed = require('blessed');
const bannerText = require('./banner'); // Import the banner

class TUI {
    constructor() {
        // Create a screen object.
        this.screen = blessed.screen({
            smartCSR: true,
            title: 'Discord Bot TUI Monitor',
            fullUnicode: true, // Support for icons
            dockBorders: true,
        });

        // --- Create Layout Boxes ---

        // Box 1: Banner (Top)
        this.bannerBox = blessed.box({
            parent: this.screen,
            top: 0,
            left: 0,
            width: '100%',
            height: '15%', // Adjust height as needed for banner
            content: bannerText,
            tags: true,
            style: {
                fg: 'cyan',
                border: { fg: 'magenta' }
            },
            border: { type: 'line' }
        });

        // Box 2: Main Log Area (Left)
        this.mainLogBox = blessed.log({
            parent: this.screen,
            label: ' {bold}Main Log{/bold} (Scroll: Up/Down Arrows) ',
            tags: true,
            top: '15%',
            left: 0,
            width: '65%', // Adjust width
            height: '85%', // Adjust height
            border: { type: 'line' },
            style: {
                fg: 'white',
                bg: 'black',
                border: { fg: 'blue' },
                scrollbar: { bg: 'blue' }
            },
            scrollable: true,
            alwaysScroll: true,
            scrollbar: {
                ch: ' ',
                track: { bg: 'grey' },
                style: { inverse: true }
            },
            mouse: true, // Enable mouse scrolling if terminal supports it
            keys: true, // Enable key scrolling
        });

        // Box 3: Success Log Area (Top Right)
        this.successLogBox = blessed.log({
            parent: this.screen,
            label: ' {bold}Success Log{/bold} (Scroll: Up/Down Arrows) ',
            tags: true,
            top: '15%',
            left: '65%', // Position next to main log
            width: '35%', // Remaining width
            height: '45%', // Half of the remaining height
            border: { type: 'line' },
            style: {
                fg: 'green',
                bg: 'black',
                border: { fg: 'green' },
                scrollbar: { bg: 'green' }
            },
            scrollable: true,
            alwaysScroll: true,
            scrollbar: {
                ch: ' ',
                track: { bg: 'grey' },
                style: { inverse: true }
            },
            mouse: true,
            keys: true,
        });

        // Box 4: Status / Info Area (Bottom Right)
        this.statusBox = blessed.box({ // Using box for potentially formatted text
            parent: this.screen,
            label: ' {bold}Status & Info{/bold} ',
            tags: true,
            top: '60%', // Below success log (15% + 45%)
            left: '65%',
            width: '35%',
            height: '40%', // Remaining height (100% - 60%)
            border: { type: 'line' },
            style: {
                fg: 'yellow',
                bg: 'black',
                border: { fg: 'yellow' }
            },
            // Make content scrollable if it overflows
            scrollable: true,
            alwaysScroll: true,
             scrollbar: {
                ch: ' ',
                track: { bg: 'grey' },
                style: { inverse: true }
            },
            mouse: true,
            keys: true,
            content: 'Initializing...' // Initial content
        });

        // --- Event Handlers ---

        // Quit on Escape, q, or Control-C.
        this.screen.key(['escape', 'q', 'C-c'], (ch, key) => {
            this.emit('shutdown'); // Emit event for index.js to handle cleanup
            return process.exit(0);
        });

        // Focus rotation (optional, allows cycling through scrollable boxes)
        // this.screen.key(['tab'], (ch, key) => {
        //     this.screen.focusNext();
        // });
        // this.screen.key(['S-tab'], (ch, key) => { // Shift+Tab
        //     this.screen.focusPrevious();
        // });

        // Initial focus
        this.mainLogBox.focus();
    }

    // --- Methods to Update UI ---

    /**
     * Adds a log message to the appropriate log box based on level.
     * @param {string} level - Log level (SUCCESS, ERROR, WARNING, INFO, WAIT, DEBUG).
     * @param {string} message - The log message string (already formatted with timestamp/icon).
     */
    addLog(level, message) {
        // Basic color mapping (can be customized further)
        let coloredMessage = message;
        if (level === 'ERROR') coloredMessage = `{red-fg}${message}{/red-fg}`;
        else if (level === 'WARNING') coloredMessage = `{yellow-fg}${message}{/yellow-fg}`;
        else if (level === 'SUCCESS') coloredMessage = `{green-fg}${message}{/green-fg}`;
        else if (level === 'WAIT') coloredMessage = `{cyan-fg}${message}{/cyan-fg}`;
        else if (level === 'DEBUG') coloredMessage = `{grey-fg}${message}{/grey-fg}`;
        // INFO uses default white

        if (level === 'SUCCESS') {
            this.successLogBox.log(coloredMessage);
        } else {
            this.mainLogBox.log(coloredMessage);
        }
        // No need to explicitly render here, blessed handles it efficiently
        // this.screen.render(); // Avoid rendering on every single log line if possible
    }

    /**
     * Updates the content of the Status box.
     * @param {object} statusData - Object containing data from botLogic (botInfos, channelDetails, etc.).
     */
    updateStatus(statusData) {
        const {
            botInfos, channelDetails, discordTokens, googleApiKeys, channelIds,
            rateLimitedKeys, isRunning
        } = statusData;

        let statusContent = `{bold}Overall Status:{/} ${isRunning ? '{green-fg}Running{/green-fg}' : '{red-fg}Stopped{/red-fg}'}\n\n`;

        statusContent += `{bold}Discord Tokens (${Object.keys(botInfos).length}/${discordTokens.length} loaded):{/}\n`;
        discordTokens.forEach((token, index) => {
            const info = Object.values(botInfos).find(bInfo => bInfo.tokenRef === token); // Need to associate token back if not key
             const maskedToken = `${token.substring(0, 5)}...${token.substring(token.length - 4)}`;
             if (info) {
                 statusContent += `  Token ${index + 1}: ${maskedToken} ({green-fg}${info.fullUsername}{/green-fg})\n`;
             } else {
                  // Find if the original token exists even if botInfo failed
                  const originalToken = discordTokens.find(dt => dt === token);
                  if(originalToken) {
                     statusContent += `  Token ${index + 1}: ${maskedToken} ({red-fg}Failed to Load{/red-fg})\n`;
                  }
                  // Else: Token might not be in the original list if dynamically changed (unlikely here)
             }
        });
         // Add a fallback if botInfos hasn't populated yet but tokens exist
         if (Object.keys(botInfos).length === 0 && discordTokens.length > 0) {
            discordTokens.forEach((token, index) => {
                 const maskedToken = `${token.substring(0, 5)}...${token.substring(token.length - 4)}`;
                 statusContent += `  Token ${index + 1}: ${maskedToken} ({yellow-fg}Loading...{/yellow-fg})\n`;
            });
         }


        statusContent += `\n{bold}Google API Keys (${googleApiKeys.length} loaded):{/}\n`;
        googleApiKeys.forEach((key, index) => {
            const maskedKey = `${key.substring(0, 5)}...${key.substring(key.length - 4)}`;
            const expiry = rateLimitedKeys ? rateLimitedKeys.get(key) : null; // Check if map exists
            if (expiry) {
                const remaining = Math.max(0, Math.ceil((expiry - Date.now()) / 1000 / 60));
                statusContent += `  API Key ${index + 1}: ${maskedKey} ({red-fg}Rate Limited - ${remaining}m left{/red-fg})\n`;
            } else {
                statusContent += `  API Key ${index + 1}: ${maskedKey} ({green-fg}Active{/green-fg})\n`;
            }
        });
        if (googleApiKeys.length === 0) statusContent += "  (Not Configured)\n";


        statusContent += `\n{bold}Monitored Channels (${Object.keys(channelDetails).length}/${channelIds.length}):{/}\n`;
         channelIds.forEach((id, index) => {
             const details = channelDetails[id];
             if (details) {
                 statusContent += `  ${index + 1}. ${id}\n     Name: ${details.name}\n     Server: ${details.guild_name}\n     Slow Mode: ${details.slowModeDelay}s\n`;
             } else {
                 // Check if it's still initializing vs failed
                 statusContent += `  ${index + 1}. ${id} ({yellow-fg}Initializing...{/yellow-fg})\n`;
                 // We need a way to distinguish between "initializing" and "failed to initialize"
                 // This might require more state from botLogic.
             }
         });
         if (channelIds.length === 0) statusContent += "  (Not Configured)\n";


        this.statusBox.setContent(statusContent);
        this.screen.render(); // Render after significant status update
    }

    /**
     * Renders the screen. Call this initially and after major updates if needed.
     */
    render() {
        this.screen.render();
    }

    // Allow external components (like index.js) to listen for UI events (e.g., shutdown)
    on(event, listener) {
        this.screen.on(event, listener);
    }
    emit(event, ...args) {
        this.screen.emit(event, ...args);
    }
}

module.exports = TUI;
