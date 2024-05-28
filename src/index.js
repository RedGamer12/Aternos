const express = require('express');
const HTTP = require('http');

const app = express();
const port = 5500;

app.get("/", (req, res) => {
    res.send("Bot is alive");
});

const server = HTTP.createServer(app);

const startServer = () => {
    server.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
};

const Mineflayer = require('mineflayer');
const CONFIG = require("../config.json");

let loop;
let bot;

const disconnect = () => {
    clearInterval(loop);
    if (bot) {
        bot.quit();
        bot.end();
    }
};

const sleep = function(ms) {
    return new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}

// Hàm getRandom
const getRandom = function(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
};

const reconnect = async () => {
    console.log(`Trying to reconnect in ${CONFIG.action.retryDelay / 1000} seconds...\n`);
    disconnect();
    await sleep(CONFIG.action.retryDelay);
    createBot();
};

const createBot = () => {
    bot = Mineflayer.createBot({
        host: CONFIG.client.host,
        port: +CONFIG.client.port,
        username: CONFIG.client.username
    });

    bot.once('error', error => {
        console.error(`AFKBot got an error: ${error}`);
    });

    bot.once('kicked', rawResponse => {
        console.error(`\n\nAFKbot is disconnected: ${rawResponse}`);
        reconnect();
    });

    bot.once('end', () => {
        reconnect();
    });

    bot.once('spawn', () => {
        const changePos = async () => {
            const lastAction = getRandom(CONFIG.action.commands);
            const halfChance = Math.random() < 0.5; // 50% chance to sprint

            console.debug(`${lastAction}${halfChance ? " with sprinting" : ''}`);

            bot.setControlState('sprint', halfChance);
            bot.setControlState(lastAction, true); // starts the selected random action

            await sleep(CONFIG.action.holdDuration);
            bot.clearControlStates();
        };

        const changeView = async () => {
            const yaw = (Math.random() * Math.PI) - (0.5 * Math.PI);
            const pitch = (Math.random() * Math.PI) - (0.5 * Math.PI);
            
            await bot.look(yaw, pitch, false);
        };
        
        loop = setInterval(() => {
            changeView();
            changePos();
        }, CONFIG.action.holdDuration);
    });

    bot.once('login', () => {
        console.log(`AFKBot logged in ${bot.username}\n\n`);
    });
};

startServer()
createBot()