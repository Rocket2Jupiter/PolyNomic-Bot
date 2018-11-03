var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var fs = require('fs');
var scoresTable = [];
var rulesTable = [];
var nrs = 0;
var turn = -1;
var storeTable = [];
var itemsTable = [];
var fileNameScores = 'Scores.txt';
var fileNameRules = 'Rules.txt';
var fileNameNRS = 'NRS.txt';
var fileNameTurn = 'Turn.txt';
var fileNameStore = 'Store.txt';
var fileNameItems = 'Items.txt';

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');

    var data = fs.readFileSync(fileNameScores, 'ascii');
    var players = [];
    players = players.concat(data.toString().split('\n'));
    while (players != '') {
        var player = players[0];
        players.shift();
        var fields = player.split(' ');
        scoresTable.push(fields);
    }
    data = fs.readFileSync(fileNameRules, 'ascii');
    rulesTable = rulesTable.concat(data.toString().split('\n'));
    nrs = fs.readFileSync(fileNameNRS, 'ascii');
    turn = fs.readFileSync(fileNameTurn, 'ascii');
    data = fs.readFileSync(fileNameStore, 'ascii');
    var items = [];
    items = items.concat(data.toString().split('\n'));
    while (items != '') {
        var item = items[0];
        items.shift();
        var fields = item.split(' ');
        storeTable.push(fields);
    }
    data = fs.readFileSync(fileNameItems, 'ascii');
    players = [];
    players = players.concat(data.toString().split('\n'));
    while (players != '') {
        var player = players[0];
        players.shift();
        var fields = player.split(' ');
        itemsTable.push(fields);
    }
});
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`

    if (message.substring(0, 1) == ':') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
        if (cmd.slice(-1) == ':') {
            args = args.splice(1);
            cmd = cmd.substring(0, cmd.length - 1);
            switch(cmd) {

                // :addrule: string (adds a rule string to the rules list)
                case 'addrule':
                    rulesTable.push(args.join(' '));
                    writeRules();
                    bot.sendMessage({
                        to: channelID,
                        message: 'Added rule "' + args.join(' ') + '" to the list of rules.'
                    });
                break;
                    
                // :deleterule: number (delets rule number number from the rules list)
                case 'deleterule':
                    if (args.length != 1) {
                        bot.sendMessage({
                            to: channelID,
                            message: 'deleterule requires a single number.'
                        });
                    }
                    else {
                        if (rulesTable.length < args[0]) {
                            bot.sendMessage({
                                to: channelID,
                                message: 'There is no rule ' + args[0] + '.'
                            });
                        }
                        else {
                            var string = rulesTable.splice(args[0] - 1, 1);
                            writeRules();
                            bot.sendMessage({
                                to: channelID,
                                message: 'Removed rule "' + string + '" from the list of rules.'
                            });
                        }
                    }
                break;
 
                // :join: (adds you to the game with a score of 0)
                case 'join':
                    var inGame = false;
                    for (var i = 0; i < scoresTable.length; i++) {
                        if (scoresTable[i][0] == userID) {
                            inGame = true;
                            break;
                        }
                    }
                    var message;
                    if (!inGame) {
                        var userArray = [userID, user, 0, 'citizen'];
                        scoresTable.push(userArray);
                        writeScores();
                        itemsTable.push([user]);
                        writeItems();
                        message = {
                            to: channelID,
                            message: user + ' has joined the game.'
                        }
                    }
                    else {
                        message = {
                            to: channelID,
                            message: user + ' is already in the game.'
                        }
                    }
                    bot.sendMessage(message);
                break;
                    
                // :quit: (removes you from the game)
                case 'quit':
                    var inGame = false;
                    var i = 0;
                    while (i < scoresTable.length) {
                        if (scoresTable[i][0] == userID) {
                            inGame = true;
                            break;
                        }
                        i++;
                    }
                    if (inGame) {
                        scoresTable.splice(i, 1);
                        writeScores();
                        itemsTable.splice(i, 1);
                        writeItems();
                        message = {
                            to: channelID,
                            message: user + ' has left the game.'
                        }
                    }
                    else {
                        message = {
                            to: channelID,
                            message: user + ' is not in the game.'
                        }
                    }
                    bot.sendMessage(message);
                break;
                    
                // :name: name (changes the name that the bot recognizes you by)
                case 'name':
                    var validPlayer = false;
                    var i = 0;
                    while (i < scoresTable.length) {
                        if (scoresTable[i][0] == userID) {
                            validPlayer = true;
                            break;
                        }
                        i++;
                    }
                    if (!validPlayer) {
                        bot.sendMessage({
                            to: channelID,
                            message: 'You are not in the game.'
                        });
                    }
                    else {
                        scoresTable[i][1] = args.join(' ');
                        bot.sendMessage({
                            to: channelID,
                            message: "Your name has been changed to " + scoresTable[i][1] + '.'
                        });
                    }
                break;

                // :addscore: player number (adds number points to player's score)
                case 'addscore':
                    if (args.length != 2 || isNaN(args[1])) {
                        bot.sendMessage({
                            to: channelID,
                            message: 'addscore requires a player and a number.'
                        });
                    }
                    else {
                        var validPlayer = false;
                        for (var i = 0; i < scoresTable.length; i++) {
                            if (scoresTable[i][1] == args[0]) {
                                validPlayer = true;
                                break;
                            }
                        }
                        if (!validPlayer) {
                            bot.sendMessage({
                                to: channelID,
                                message: args[0] + ' is not a player.'
                            });
                        }
                        else {
                            addScore(args[0], args[1]);
                            bot.sendMessage({
                                to: channelID,
                                message: 'Added ' + args[1] + ' points to ' + args[0] + "'s score."
                            });
                        }
                    }
                break;
                    
                // :position: player position (sets the player player's position to position)
                case 'position':
                    if (args.length != 2) {
                        bot.sendMessage({
                            to: channelID,
                            message: 'position requires a player and a position.'
                        });
                    }
                    else {
                        var validPlayer = false;
                        for (var i = 0; i < scoresTable.length; i++) {
                            if (scoresTable[i][1] == args[0]) {
                                validPlayer = true;
                                break;
                            }
                        }
                        if (!validPlayer) {
                            bot.sendMessage({
                                to: channelID,
                                message: args[0] + ' is not a player.'
                            });
                        }
                        else {
                            var i = 0;
                            while (i < scoresTable.length) {
                                if (scoresTable[i][1] == args[0]) {
                                    break;
                                }
                                i++;
                            }
                            scoresTable[i][3] = args[1];
                            writeScores();
                            bot.sendMessage({
                                to: channelID,
                                message: 'changed ' + args[0] + "'s position to " + args[1] + '.'
                            });
                        }
                    }
                break;
                    
                // :tax: player number (takes number points from the player player, and adds them to the nrs)
                case 'tax':
                    if (args.length != 2 || isNaN(args[1])) {
                        bot.sendMessage({
                            to: channelID,
                            message: 'tax requires a player and a number.'
                        });
                    }
                    else {
                        var validPlayer = false;
                        for (var i = 0; i < scoresTable.length; i++) {
                            if (scoresTable[i][1] == args[0]) {
                                validPlayer = true;
                                break;
                            }
                        }
                        if (!validPlayer) {
                            bot.sendMessage({
                                to: channelID,
                                message: args[0] + ' is not a player.'
                            });
                        }
                        else {
                            addScore(args[0], -args[1]);
                            writeScores();
                            nrs = Number(nrs) + Number(args[1]);
                            writeNRS();
                            bot.sendMessage({
                                to: channelID,
                                message: args[1] + ' points added to the NRS from ' + args[0] + "'s score."
                            });
                        }
                    }
                break;
                    
                // :pass: (passes the turn to the next player)
                case 'pass':
                    if (turn == -1) {
                        turn++;
                        writeTurn();
                        bot.sendMessage({
                            to: channelID,
                            message: 'It is now ' + scoresTable[turn][1] + "'s turn."
                        });
                    }
                    else {
                        if (scoresTable[turn][0] != userID) {
                            bot.sendMessage({
                                to: channelID,
                                message: 'It is not your turn!'
                            });
                        }
                        else {
                            turn++;
                            if (turn == scoresTable.length) {
                                turn = -1;
                                writeTurn();
                                bot.sendMessage({
                                    to: channelID,
                                    message: "The round is over, and it's time to vote!"
                                });
                            }
                            else {
                                writeTurn();
                                bot.sendMessage({
                                    to: channelID,
                                    message: 'It is now ' + scoresTable[turn][1] + "'s turn."
                                });
                            }
                        }
                    }
                break;
                    
                // :additem: name price stock (adds a new item with name name, price price, and stock stock)
                case 'additem':
                    if (args.length != 3 || isNaN(args[1]) || isNaN(args[2])) {
                        bot.sendMessage({
                            to: channelID,
                            message: 'additem requires a name, a price, and a stock.'
                        });
                    }
                    else {
                        var itemArray = [args[0], args[1], args[2]];
                        storeTable.push(itemArray);
                        writeStore();
                        bot.sendMessage({
                            to: channelID,
                            message: 'Item ' + args[0] + ' added to the store.'
                        });
                    }
                break;
                    
                // :deleteitem: name (removes all items with name name from all players, and deletes the item from the store)
                case 'deleteitem':
                    if (args.length != 1) {
                        bot.sendMessage({
                            to: channelID,
                            message: 'deleteitem requires a name.'
                        });
                    }
                    else {
                        var validItem = false;
                        var i = 0;
                        while (i < storeTable.length) {
                            if (storeTable[i][0] == args[0]) {
                                validItem = true;
                                break;
                            }
                            i++;
                        }
                        if (!validItem) {
                            bot.sendMessage({
                                to: channelID,
                                message: args[0] + ' is not an item.'
                            });
                        }
                        else {
                            storeTable.splice(i, 1);
                            writeStore();
                            for (var j = 0; j < itemsTable.length; j++) {
                                var validItem = false;
                                var k = 1;
                                while (k < itemsTable[j].length) {
                                    if (itemsTable[j][k] == args[0]) {
                                        validItem = true;
                                        break;
                                    }
                                    k++;
                                }
                                if (validItem) {
                                    itemsTable[j].splice(k, 1);
                                    bot.sendMessage({
                                        to: channelID,
                                        message: 'removed item ' + args[1] + ' from ' + args[0] + "'s inventory."
                                    });
                                }
                            }
                            writeItems();
                            bot.sendMessage({
                                to: channelID,
                                message: 'Removed item ' + args[0] + ' from the game.'
                            });
                        }
                    }
                break;
                    
                // :giveitem: player item (gives player player item item)
                case 'giveitem':
                    if (args.length != 2) {
                        bot.sendMessage({
                            to: channelID,
                            message: 'giveitem requires a player and an item.'
                        });
                    }
                    else {
                        var validPlayer = false;
                        var i = 0;
                        while (i < scoresTable.length) {
                            if (scoresTable[i][1] == args[0]) {
                                validPlayer = true;
                                break;
                            }
                            i++;
                        }
                        if (!validPlayer) {
                            bot.sendMessage({
                                to: channelID,
                                message: args[0] + ' is not a player.'
                            });
                        }
                        else {
                            var validItem = false;
                            for (var j = 0; j < storeTable.length; j++) {
                                if (storeTable[j][0] == args[1]) {
                                    validItem = true;
                                    break;
                                }
                            }
                            if (!validItem) {
                                bot.sendMessage({
                                    to: channelID,
                                    message: args[1] + ' is not an item.'
                                });
                            }
                            else {
                                itemsTable[i].push(args[1]);
                                writeItems();
                                bot.sendMessage({
                                    to: channelID,
                                    message: 'gave a ' + args[1] + ' to ' + args[0]
                                });
                            }
                        }
                    }
                break;
                    
                // :removeitem: player item (removes item item from player player's inventory)
                case 'removeitem':
                    if (args.length != 2) {
                        bot.sendMessage({
                            to: channelID,
                            message: 'removeitem requires a player and an item.'
                        });
                    }
                    else {
                        var validPlayer = false;
                        var i = 0;
                        while (i < scoresTable.length) {
                            if (scoresTable[i][1] == args[0]) {
                                validPlayer = true;
                                break;
                            }
                            i++;
                        }
                        if (!validPlayer) {
                            bot.sendMessage({
                                to: channelID,
                                message: args[0] + ' is not a player.'
                            });
                        }
                        else {
                            var validItem = false;
                            var j = 1;
                            while (j < itemsTable[i].length) {
                                if (itemsTable[i][j] == args[1]) {
                                    validItem = true;
                                    break;
                                }
                                j++;
                            }
                            if (!validItem) {
                                bot.sendMessage({
                                    to: channelID,
                                    message: args[0] + ' does not own a(n) ' + args[1] + '.'
                                });
                            }
                            else {
                                itemsTable[i].splice(j, 1);
                                writeItems();
                                bot.sendMessage({
                                    to: channelID,
                                    message: 'removed item ' + args[1] + ' from ' + args[0] + "'s inventory."
                                });
                            }
                        }
                    }
                break;
                    
                // :addstock: item number (adds number to item item's stock)
                case 'addstock':
                    if (args.length != 2 || isNaN(args[1])) {
                        bot.sendMessage({
                            to: channelID,
                            message: 'addscore requires an item and a number.'
                        });
                    }
                    else {
                        var validItem = false;
                        for (var i = 0; i < storeTable.length; i++) {
                            if (storeTable[i][0] == args[0]) {
                                validPlayer = true;
                                break;
                            }
                        }
                        if (!validItem) {
                            bot.sendMessage({
                                to: channelID,
                                message: args[0] + ' is not a(n) item.'
                            });
                        }
                        else {
                            addStock(args[0], args[1]);
                            bot.sendMessage({
                                to: channelID,
                                message: 'Added ' + args[1] + ' ' + args[0] + 's to the store.'
                            });
                        }
                    }
                break;

                // :scores: (displays the current scores, and positions)
                case 'scores':
                    var strings = [];
                    for(var i = 0; i < scoresTable.length; i++) {
                        var temp = scoresTable[i].splice(1);
                        scoresTable[i] = scoresTable[i].concat(temp);
                        strings[i] = temp.join(' ');
                    }
                    var string = strings.join('\n');
                    bot.sendMessage({
                        to: channelID,
                        message: 'scores:\n' + string
                    });
                break;

                // :rules: (displays the list of rules)
                case 'rules':
                    rules(channelID);
                break;
                    
                // :nrs: (displays the NRS's current balance)
                case 'nrs':
                    bot.sendMessage({
                        to: channelID,
                        message: 'NRS:\n' + nrs
                    });
                break;
                    
                // :turn: (displays the current turn)
                case 'turn':
                    if (turn == -1) {
                        bot.sendMessage({
                            to: channelID,
                            message: 'It is currently election time!'
                        });
                    }
                    else {
                        bot.sendMessage({
                            to: channelID,
                            message: 'It is currently ' + scoresTable[turn][1] + "'s turn."
                        });
                    }
                break;
                    
                // :store: (displays the current item list, prices, and stock)
                case 'store':
                    var strings = [];
                    for(var i = 0; i < storeTable.length; i++) {
                        strings[i] = storeTable[i].join(' | ');
                    }
                    var string = strings.join('\n');
                    bot.sendMessage({
                        to: channelID,
                        message: 'store: name | price | stock\n' + string
                    });
                break;
                    
                // :items: (displays each player's item inventory)
                case 'items':
                    var strings = [];
                    for(var i = 0; i < itemsTable.length; i++) {
                        strings[i] = itemsTable[i].join(' ');
                    }
                    var string = strings.join('\n');
                    bot.sendMessage({
                        to: channelID,
                        message: 'items:\n' + string
                    });
                break;

                // :roll: (rolls a d6)
                case 'd6':
                    bot.sendMessage({
                        to: channelID,
                        message: d6().toString()
                    });
                break;
                    
                case 'pillow':
                    if (args.length == 1) {
                        var validPlayer = false;
                        for (var i = 0; i < scoresTable.length; i++) {
                            if (scoresTable[i][1] == args[0]) {
                                validPlayer = true;
                                break;
                            }
                        }
                        if (validPlayer) {
                            bot.sendMessage({
                                to: channelID,
                                message: '*thwack*'
                            });
                        }
                    }
                break;
                
            }
        }
    }
});

function d6() {
    return Math.ceil(Math.random() * 6);
}

async function rules(channelID) {
    var strings = ['rules:\n'];
    var count = 0;
    for (var i = 0; i < rulesTable.length; i++) {
        var rule = i+1 + '. ' + rulesTable[i] + '\n';
        if (strings[count].length + rule.length > 2000) {
            count++;
            strings[count] = '';
        }
        strings[count] += rule;
    }
    for (var i = 0; i < strings.length; i++) {
        await bot.sendMessage({
            to: channelID,
            message: strings[i]
        });
        await sleep(100);
    }
}

function sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
}

function writeScores() {
    var strings = [];
    for (var i = 0; i < scoresTable.length; i++) {
        strings.push(scoresTable[i].join(' '));
    }
    fs.writeFile(fileNameScores, strings.join('\n'), function(err) {
        if (err) logger.info(err);
        else logger.info('Data successfully added to file.');
    });
}

function writeRules() {
    fs.writeFile(fileNameRules, rulesTable.join('\n'), function(err) {
        if (err) logger.info(err);
        else logger.info('Data successfully added to file.');
    });
}

function writeNRS() {
    fs.writeFile(fileNameNRS, nrs, function(err) {
        if (err) logger.info(err);
        else logger.info('Data successfully added to file.');
    });
}

function writeTurn() {
    fs.writeFile(fileNameTurn, turn, function(err) {
        if (err) logger.info(err);
        else logger.info('Data successfully added to file.');
    });
}

function writeStore() {
    var strings = [];
    for (var i = 0; i < storeTable.length; i++) {
        strings.push(storeTable[i].join(' '));
    }
    fs.writeFile(fileNameStore, strings.join('\n'), function(err) {
        if (err) logger.info(err);
        else logger.info('Data successfully added to file.');
    });
}

function writeItems() {
    var strings = [];
    for (var i = 0; i < itemsTable.length; i++) {
        strings.push(itemsTable[i].join(' '));
    }
    fs.writeFile(fileNameItems, strings.join('\n'), function(err) {
        if (err) logger.info(err);
        else logger.info('Data successfully added to file.');
    });
}

function addScore(player, num) {
    var i = 0;
    while (i < scoresTable.length) {
        if (scoresTable[i][1] == player) {
            break;
        }
        i++;
    }
    scoresTable[i][2] = Number(scoresTable[i][2]) + Number(num);
    writeScores();
}

function addStock(item, num) {
    var i = 0;
    while (i < storeTable.length) {
        if (storeTable[i][0] == item) {
            break;
        }
        i++;
    }
    storeTable[i][2] = Number(storeTable[i][2]) + Number(num);
    writeStore();
}
