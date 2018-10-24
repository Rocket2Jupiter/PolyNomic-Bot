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
    var rulesTable = data.toString().split('\n');
});
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`

    // I have an idea for a new way to enter command messages - Spencer
    // taking the form of :command: ‘stuff’ 
    /* if(message.indexOf(':') != -1)
       while(message.indexOf(':') != -1){
    */
    // we can’t use that, discord already uses that for emoji’s - Ryan
    // I’ll use *command* for now instead.
    // you should use indexOf, that way it can be found anywhere on the line -Spencer

    if (message.substring(0, 1) == ':') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
        if (cmd.slice(-1) == ':') {
            args = args.splice(1);
            cmd = cmd.substring(0, cmd.length - 1);
            switch(cmd) {

                // :addrule: (adds a rule to the rules list)
                case 'addrule'
                    rulesTable.push(args.join(' '));
                    fs.appendFile(fileRulesList, args.join(' ') + '\n', 
                        function(err){
                            if(err) logger.info(err);
                            else logger.info('Rules list updated successfully.');
                    });
                    bot.sendMessage({
                        to: channelID,
                        message: 'Added rule "' + args.join(' ') + '" to the list of rules.'
                    });
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
                        logger.info(userArray.join(' ') + '/n');
                        fs.appendFile(fileNameScores, userArray.join(' ') + '\n', function(err) {
                            if (err) {
                                logger.info(err);
                            }
                            else {
                                logger.info('Data successfully added to file.');
                            }
                        });
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
                            scoresTable[i][2] = Number(scoresTable[i][2]) + Number(args[1]);
                            logger.info('insert file edit here.');
                            bot.sendMessage({
                                to: channelID,
                                message: 'Added ' + args[1] + ' points to ' + args[0] + "'s score."
                            });
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
                    var temp = rulesTable;
                    bot.sendMessage({
                        to: channelID,
                        message: 'rules:\n' + temp.join('\n');
                    });
                break;

                // :roll: (rolls a d6)
                case 'roll':
                    var num = Math.ceil(Math.random() * 6);
                    bot.sendMessage({
                        to: channelID,
                        message: num.toString()
                    });
                break;
            }
        }
    }
});


