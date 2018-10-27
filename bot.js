var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var fs = require('fs');
var scoresTable = [];
var rulesTable = [];
var fileNameScores = 'Scores.txt';
var fileNameRules = 'Rules.txt';

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
    var players = data.toString().split('\n');
    while (players != '') {
        var player = players[0];
        players == players.shift();
        var fields = player.split(' ');
        scoresTable.push(fields);
    }
    data = fs.readFileSync(fileNameRules, 'ascii');
    rulesTable = rulesTable.concat(data.toString().split('\n'));
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
                    if (args.length > 1) {
                        bot.sendMessage({
                            to: channelID,
                            message: ':deleterule: requires a single number.'
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

                // :addscore: player number (adds number points to player's score)
                case 'addscore':
                    if (args.length < 2) {
                        bot.sendMessage({
                            to: channelID,
                            message: ':addscore: requires a player and a number.'
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
                        }
                    }
                break;

                // :scores:
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

                // :rules:
                case 'rules':
                    var string = '';
                    for (var i = 0; i < rulesTable.length; i++) {
                        string += i+1 + '. ' + rulesTable[i] + '\n';
                    }
                    bot.sendMessage({
                        to: channelID,
                        message: 'rules:\n' + string
                    });
                break;

                // :roll: (rolls a d6)
                case 'd6':
                    bot.sendMessage({
                        to: channelID,
                        message: d6().toString()
                    });
                break;
            }
        }
    }
});

function d6() {
    return Math.ceil(Math.random() * 6);
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
    bot.sendMessage({
        to: channelID,
        message: 'Added ' + num + ' points to ' + player + "'s score."
    });
}
