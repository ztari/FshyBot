/*jshint esversion: 6 */

const request   = require('request');
const Discord   = require('discord.js');
const _         = require('lodash/core');
const fs        = require('fs');
const ytdl      = require('ytdl-core');
const math      = require('mathjs');
const winston   = require('winston');
const config    = require('./config');
const version   = require('./package').version;
const commands  = require('./commands');
const lib       = require('./lib');

winston.configure({
  transports: [
    new (winston.transports.File)({
      filename: 'winston.log',
      timestamp: function () {
        return +new Date()
      }
    })
  ]
});

global.guildsMap = new Map();
global.client    = new Discord.Client();
var timer;

client.login(config.token);

client.on('ready', () => {
  var fileMap = new Map(lib.readFileToMap());//Read from file
  guildsMap = lib.readFileToMap();
  var clientGuilds = client.guilds.keyArray();//Cached Guilds
  for (var i = 0; i < clientGuilds.length; i++) {
    if (!guildsMap.has(clientGuilds[i])) {
      guildsMap.set(clientGuilds[i],{prefix:config.prefix});
    }
  }
  if (!_.isEqual(lib.map_to_object(guildsMap),lib.map_to_object(fileMap))) lib.writeMapToFile(guildsMap);//Write to file if not matching - i.e. new guild prefs
  console.log(`\n\x1b[32m\x1b[1m// ${config.name} Online and listening for input\x1b[0m`);
  // Alternate setGame
  var i = 0;
  timer = client.setInterval(function () {
    switch (i%5) {
      case 4:   client.user.setGame(`on ${client.guilds.size} Guilds for ${client.users.size} Users`);break;
      case 3:   client.user.setGame(`Commands: !help`);                                               break;
      case 2:   client.user.setGame(`@Fshy#0986`);                                                    break;
      case 1:   client.user.setGame(`on arc.moe`);                                                    break;
      case 0:   client.user.setGame(`NieR: Automata™`);                                               break;
    }
    i++;
  },15000);
  // Log Current Stats
  client.setInterval(function () {
    var d = new Date(Date.now());
    console.log(`\n\x1b[32m[${d.getDate()}/${(d.getMonth()+1)}/${d.getFullYear()} | ${d.toLocaleTimeString()}]\x1b[0m Mem: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB | Users: ${client.users.size} | Guilds: ${client.guilds.size}`);
  },300000);
});

client.on('guildCreate', (guild)=>{
  // if (!guildsMap.has(guild.id)) {//Uncomment this to retain preferences after guild removal
    guildsMap.set(guild.id,{prefix:config.prefix});
    lib.writeMapToFile(guildsMap);//Write to file
  // }
  if (guild.defaultChannel.permissionsFor(client.user).has('SEND_MESSAGES')) {//Has write permissions
  guild.defaultChannel.send({embed:new Discord.RichEmbed()
    .setTitle(`// ${client.user.username} is now serving ${guild.name}`)
    .setDescription(`
Thanks for adding me to your server!
Please have a look at my command list using **!help**
or for more detailed information at [GitHub](https://github.com/Fshy/FshyBot) | [arc.moe](http://arc.moe)

Currently running v${version} on a ${process.platform}-${process.arch} platform`)
    .setThumbnail(client.user.displayAvatarURL)
    .setColor(`${guild.me.displayHexColor!=='#000000' ? guild.me.displayHexColor : config.hexColour}`)});
  }
});

client.on('guildMemberAdd', (member) => {
  if (member.guild.defaultChannel.permissionsFor(client.user).has('SEND_MESSAGES')) {//Has write permissions
    member.guild.defaultChannel.send({embed:new Discord.RichEmbed()
      .setDescription(`${member.nickname ? `${member.displayName} (${member.user.username})` : member.user.username} has joined the server.\nPlease welcome them to ${member.guild.name}`)
      .setThumbnail(member.user.displayAvatarURL)
      .setColor(`${member.guild.me.displayHexColor!=='#000000' ? member.guild.me.displayHexColor : config.hexColour}`)});
  }
});

client.on('presenceUpdate', (oldMember, newMember) => {
  if (!oldMember.user.bot) {//Not a Bot User - else null
    if (newMember.presence.game) {//A game status exists - else null
      if (newMember.presence.game.streaming) {//The new game status is a stream - else null
        if (oldMember.presence.game) {//Still playing a game - else now started a game
          if (!oldMember.presence.game.streaming) {//If user was streaming before update do nothing
            if (newMember.guild.defaultChannel.permissionsFor(client.user).has('SEND_MESSAGES')) {//Has write permissions
              newMember.guild.defaultChannel.send({embed:new Discord.RichEmbed()
                .setDescription(`${newMember.nickname ? `${newMember.displayName} (${newMember.user.username})` : newMember.user.username} is now streaming **${newMember.presence.game.name}** at ${newMember.presence.game.url}`)
                .setThumbnail(newMember.user.displayAvatarURL)
                .setColor(`${newMember.guild.me.displayHexColor!=='#000000' ? newMember.guild.me.displayHexColor : config.hexColour}`)});
            }
          }
        }else {
          if (newMember.guild.defaultChannel.permissionsFor(client.user).has('SEND_MESSAGES')) {//Has write permissions
            newMember.guild.defaultChannel.send({embed:new Discord.RichEmbed()
              .setDescription(`${newMember.nickname ? `${newMember.displayName} (${newMember.user.username})` : newMember.user.username} is now streaming **${newMember.presence.game.name}** at ${newMember.presence.game.url}`)
              .setThumbnail(newMember.user.displayAvatarURL)
              .setColor(`${newMember.guild.me.displayHexColor!=='#000000' ? newMember.guild.me.displayHexColor : config.hexColour}`)});
          }
        }
      }
    }
  }
});

client.on('voiceStateUpdate', (oldMember, newMember) => {
  if (oldMember.voiceChannel) {//Was in a voiceChannel
    if (newMember.voiceChannel !== oldMember.voiceChannel) {//If state changed, but channel remains the same i.e. Mute, Deafen
      if (newMember.voiceChannel) {//If moved to a new voiceChannel
        winston.log('info', `${newMember.nickname ? `${newMember.displayName} (${newMember.user.username})` : newMember.user.username} moved from ${oldMember.voiceChannel.name} to ${newMember.voiceChannel.name}`, {guildID: oldMember.guild.id, type: 'voice'});
      }else {
        winston.log('info', `${newMember.nickname ? `${newMember.displayName} (${newMember.user.username})` : newMember.user.username} disconnected from ${oldMember.voiceChannel.name}`, {guildID: oldMember.guild.id, type: 'voice'});
      }
    }
  }else {//Was not in a voiceChannel
    if (newMember.voiceChannel !== oldMember.voiceChannel) {//If connected to a new voiceChannel
      winston.log('info', `${newMember.nickname ? `${newMember.displayName} (${newMember.user.username})` : newMember.user.username} connected to ${newMember.voiceChannel.name}`, {guildID: newMember.guild.id, type: 'voice'});
    }
  }
});

client.on('messageReactionAdd', (messageReaction,user)=>{
  if (user.bot) return;
  if (messageReaction.message.author.id!==client.user.id) return;
  switch (messageReaction.emoji.identifier) {
    case '%E2%8F%AF'://PlayPause
      let vconnec = client.voiceConnections.get(messageReaction.message.guild.defaultChannel.id);
      if (vconnec) {
        let dispatch = vconnec.player.dispatcher;
        if (dispatch){
          if (dispatch.speaking)
            dispatch.pause();
          else
            dispatch.resume();
        }
      }
      break;
    case '%E2%8F%B9'://Stop
      lib.clearQueue(guildsMap,client,messageReaction.message);
      commands.stop(guildsMap,client,messageReaction.message);
      break;
    case '%E2%8F%AD'://Next Track
      commands.stop(guildsMap,client,messageReaction.message);
      break;
    case '%F0%9F%94%81'://Repeat
      commands.repeat(ytdl,winston,guildsMap,client,user,messageReaction.message);
      break;
    case '%E2%9D%8C'://Leave
      commands.leave(guildsMap,client,messageReaction.message);
      break;
  }
});

client.on('messageReactionRemove', (messageReaction,user)=>{
  if (user.bot) return;
  if (messageReaction.message.author.id!==client.user.id) return;
  switch (messageReaction.emoji.identifier) {
    case '%E2%8F%AF'://PlayPause
      let vconnec = client.voiceConnections.get(messageReaction.message.guild.defaultChannel.id);
      if (vconnec) {
        let dispatch = vconnec.player.dispatcher;
        if (dispatch){
          if (dispatch.speaking)
            dispatch.pause();
          else
            dispatch.resume();
        }
      }
      break;
    case '%E2%8F%B9'://Stop
      lib.clearQueue(guildsMap,client,messageReaction.message);
      commands.stop(guildsMap,client,messageReaction.message);
      break;
    case '%E2%8F%AD'://Next Track
      commands.stop(guildsMap,client,messageReaction.message);
      break;
    case '%F0%9F%94%81'://Repeat
      commands.repeat(ytdl,winston,guildsMap,client,user,messageReaction.message);
      break;
    case '%E2%9D%8C'://Leave
      commands.leave(guildsMap,client,messageReaction.message);
      break;
  }
});

client.on('message', (message)=>{
  if(message.author.bot) return;

  // Receive DM
  if (message.channel.type===`dm`)
    return commands.chatbot(client,message.content.split(),message);

  // Chatbot
  if (message.content.startsWith(`2B`) || message.content.startsWith(`2b`)){
    console.log(`\x1b[36m[${message.guild}] \x1b[1m${message.author.username}: \x1b[0m${message.content}`);
    return commands.chatbot(client,message.content.split(/\s+/g).slice(1),message);
  }

  // Custom Prefixes
  let guildPrefix = config.prefix;
  if (guildsMap.has(message.guild.id)) guildPrefix = guildsMap.get(message.guild.id).prefix;
  if(!message.content.startsWith(guildPrefix)) return;

  // Command Parsing
  console.log(`\x1b[36m[${message.guild}] \x1b[1m${message.author.username}: \x1b[0m${message.content}`);
  let command = message.content.split(/\s+/g)[0].slice(guildPrefix.length);
  let args    = message.content.split(/\s+/g).slice(1);

  switch (command.toLowerCase()) {

    // TO-DO List
    // TODO Modularize Commands
    // Notes: These commands may not disabled themselves | Require MANAGE_GUILD Perms
    // case 'disable':     return commands.disableCommand(guildDB,guildsMap,guildPrefix,args,message);
    // case 'enable':      return commands.enableCommand(guildDB,guildsMap,guildPrefix,args,message);
    // TODO Apply a SEND_MESSAGES check before attempting output
    // TODO Adjust Embed Colours based on message type (success, error, warning, info)
    // TODO Use createReactionCollector() to generate timed responses/polls
    // TODO Check that [current version < stable version] before allowing !update | Display changelog/commit messages
    // TODO Winston logs implement users @mentions
    // TODO Start logging messages per user
    // TODO Implement controls for stream
    // TODO Localization on a per-guild basis
    // TODO Perform check if guildRecords.json exists on ready
    // TODO Trim paramters using guildPrefix => guildsMap.get(message.guild.id).prefix
    // TODO Process guildsMap as a global variable
    // TODO Catch errors from promises
    // TODO Implement ReactionCollector for upvote/downvote system with images & moderation
    // TODO Instagram lookup by hashtags or location

    // General
    case 'help':        return commands.help(guildPrefix,message);
    case 'ping':        return commands.ping(client,message);
    case 'diag':        return commands.stats(version,client,message);
    case 'version':     return commands.ver(version,guildPrefix,message);
    case 'invite':      return commands.invite(client,message);
    case 'say':         return commands.say(guildPrefix,message);
    case 'logs':        return commands.logs(args,message);

    // Owner Commands
    case 'update':      return commands.update(message);
    case 'broadcast':   return commands.broadcast(client,guildPrefix,args,message);

    // Admin Commands
    case 'setname':     return commands.setName(client,args,message);
    case 'setgame':     return commands.setGame(timer,client,args,message);
    case 'setavatar':   return commands.setAvatar(client,args,message);
    case 'setstatus':   return commands.setStatus(client,guildPrefix,args,message);
    case 'setprefix':   return commands.setprefix(guildsMap,guildPrefix,args,message);

    // Music
    // case 'controls':    return commands.controls(guildsMap,client,message);
    case 'join':        return commands.join(message);
    case 'leave':       return commands.leave(guildsMap,client,message);
    case 'play':        return commands.play(ytdl,winston,guildsMap,client,args,message);
    case 'playlist':    return commands.playlist(ytdl,guildsMap,client,args,message);
    case 'clear':       return commands.clearQueue(guildsMap,client,message);
    case 'stop':        return commands.stop(guildsMap,client,message);
    case 'pause':       return commands.pause(client,message);
    case 'resume':      return commands.resume(client,message);
    case 'stream':      return commands.stream(guildsMap,client,args,message);
    case 'radio':       return commands.radio(guildsMap,args,message);
    case 'np':
    case 'nowplaying':  return commands.nowPlaying(guildsMap,message);

    // PUBG
    case 'pubg':        return commands.pubg(args,message);

    // Web APIs
    case 'r':           return commands.rslash(guildPrefix,message,args);
    case 'crypto':      return commands.coin(args,message);
    case 'insta':       return commands.insta(args,message);

    // Anime/NSFW
    case 'anime':       return commands.anime(args,message);
    case 'sfw':         return commands.danbooru(guildPrefix,args,`s`,message);
    case 'nsfw':
    case 'lewd':        return commands.danbooru(guildPrefix,args,`e`,message);
    case 'tags':        return commands.danbooruTags(args,message);
    case '2b':          return commands.img2B(guildPrefix,args,message);
    case 'smug':        return commands.smug(message);

    // Misc
    case 'calc':        return commands.calc(math,args,message);
    case 'roll':        return commands.roll(args,message);

  }

});
