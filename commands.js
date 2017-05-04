const request   = require('request');
const Discord   = require('discord.js');
const config    = require('./config.json');
const lib       = require('./lib');

// Methods to export
class Commands {

  help(message) {
    var desc = `
      -- General
      **!help** - Displays all available commands
      **!ping** - Displays response time to server
      **!stats** - Displays bot usage statistics
      **!version** - Checks for updates to the bot

      -- Owner/Admin
      **!update** - Updates to the master branch
      **!setname    [name]** - Sets the username of the bot
      **!setgame    [game]** - Sets the "Playing" text for the bot
      **!setavatar  [image url]** - Sets the avatar of the bot
      **!setstatus  [status]** - Sets the status of the bot

      -- Music
      **!play [title/link]** - Searches and queues the given term/link
      **!stop** - Stops the current song and leaves the channel
      **!pause** - Pauses playback of the current song
      **!resume** - Resumes playback of the current song
      **!leave** - Stops any playback and leaves the channel
      **!stream [url]** - Plays a given audio stream, or file from direct URL
      **!radio** - Displays some available preprogrammed radio streams

      -- Anime/NSFW
      **!smug** - Posts a random smug reaction image
      **!lewd [search term]** - Uploads a random NSFW image of the term
      **!sfw  [search term]** - Uploads a random SFW image of the term
      **!tags [search term]** - Searches Danbooru for related search tags
      **!2B [nsfw]** - Uploads a 2B image, or a NSFW version if supplied

      -- Misc
      **!btc** - Displays current Bitcoin spot price
      **!eth** - Displays current Ethereum spot price
      **!calc [expression]** - Evaluates a given expression
      **!r    [subreddit]** - Uploads a random image from a given subreddit
      **!roll [n] [m]** - Rolls an n-sided die, m times and displays the result

      -- Chatbot
      2B answers her callsign in response to the user
      Eg. 2B How are you? | 2B What's the time?

      For source code and other dank memes check [GitHub](https://github.com/Fshy/FshyBot) | [arc.moe](http://arc.moe)`;
      message.channel.send({embed:new Discord.RichEmbed()
        .setTitle(`Commands:`)
        .setDescription(desc)
        .setImage('http://i.imgur.com/a96NGOY.png')
        .setColor(config.hexColour)});
  }

  ping(client,message){
    message.channel.send(lib.embed(`Response time to discord server: ${Math.round(client.ping)}ms`));
  }

  ver(version,message) {
    request('https://raw.githubusercontent.com/Fshy/FshyBot/master/package.json', function (error, response, body) {
      response = JSON.parse(body);
      if (error!=null) {
        message.channel.send(lib.embed(`ERROR: Could not access repository`));
      }else {
        if (response.version!=version) {
          message.channel.send(lib.embed(`Currently Running v${version}\nNightly Build: v${response.version}\n\n:warning: *Use **!update** to fetch master branch and restart bot | [Changelog](https://github.com/Fshy/FshyBot/commits/master)*`));
        }else {
          message.channel.send(lib.embed(`Currently Running v${version}\nNightly Build: v${response.version}\n\n:white_check_mark: *I'm fully updated to the latest build | [Changelog](https://github.com/Fshy/FshyBot/commits/master)*`));
        }
      }
    });
  }

  stats(version,client,message){
    message.channel.send({embed:new Discord.RichEmbed()
      .setTitle(`2B | FshyBot Statistics:`)
      .setDescription(`Currently serving **${client.users.size}** user${client.users.size>1 ? 's':''} on **${client.guilds.size}** guild${client.guilds.size>1 ? 's':''}`)
      .addField(`Ping`,`${Math.round(client.ping)}ms`,true)
      .addField(`Uptime`,`${parseInt(client.uptime/86400000)}:${parseInt(client.uptime/3600000)%24}:${parseInt(client.uptime/60000)%60}:${parseInt(client.uptime/1000)%60}`,true)
      .addField(`Build`,`v${version}`,true)
      .addField(`Memory Usage`,`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,true)
      .addField(`Platform`,`${process.platform}`,true)
      .addField(`Architecture`,`${process.arch}`,true)
      .setColor(config.hexColour)});
  }

  coin(currency,message) {
    request(`https://min-api.cryptocompare.com/data/price?fsym=${currency}&tsyms=USD`, function (error, response, body) {
      response = JSON.parse(body);
      if (error!=null) {
        message.channel.send(lib.embed(`ERROR: Could not access cryptocompare API`));
      }else {
        message.channel.send(lib.embed(`Current ${currency} Price: $${response.USD.toFixed(2)}`));
      }
    });
  }

  roll(args,message) {
    var res = 0;
    var sides = 6;
    var num = 1;
    var n;
    if (args[0]) {
      var sides = args[0];
      if (args[1]) {
        var num = args[1];
      }
    }
    var output = `Rolled a ${sides}-sided die ${num} times:\n`;
    for (var i = 0; i < num; i++) {
      n = Math.floor(Math.random() * sides) + 1;
      output += `[${n}] `;
      res += n;
    }
    output += "= "+res;
    message.channel.send(lib.embed(output));
  }

  danbooru(args,rating,amount,message) {
    var tag = args.join('_');
    if ((tag.toLowerCase().match(/kanna/g) && rating==='e') || (tag.toLowerCase().match(/kamui/g) && rating==='e'))
      return message.channel.send(lib.embed(`Don't lewd the dragon loli`));
    request(`http://danbooru.donmai.us/posts.json?tags=*${tag}*+rating%3A${rating}+limit%3A${amount}`, function (error, response, body) {
      body = JSON.parse(body);
      if (error!=null) {
        message.channel.send(lib.embed(`ERROR: Could not access Danbooru API`));
      }else {
        var random = Math.floor(Math.random() * body.length);//Picks one randomly to post
        if (body[random]) {
          message.channel.send({embed:new Discord.RichEmbed()
            .setImage(`http://danbooru.donmai.us${body[random].file_url}`)
            .setDescription(`[Source](${body[random].source})`)
            .setColor(config.hexColour)});
        }else {
          message.channel.send(lib.embed(`ERROR: Could not find any posts matching ${tag}\nTry using the ${config.prefix}tags [search term] command to narrow down the search`));
        }
      }
    });
  }

  danbooruTags(args,message) {
    var tag = args.join('_');
    request(`http://danbooru.donmai.us/tags/autocomplete.json?search[name_matches]=*${tag}*`, function (e, r, b) {
      var suggestions = '';
      b = JSON.parse(b);
      if (b[0]!=null) {
        suggestions += 'Related tags:\n\n';
        for (var i = 0; i < b.length; i++) {
          suggestions += b[i].name;
          suggestions += '\n';
        }
      }else {
        suggestions = `No tags found for ${tag}`;
      }
      message.channel.send(lib.embed(suggestions));
    });
  }

  rslash(reddit,message,args) {
    if (args[0]) {
      reddit.getSubreddit(args[0]).getHot().then(function (data) {
        if (data) {
          var urls = [];
          for (var i = 0; i < 10; i++) { //Top 10 sorted by Hot
            if ((/\.(jpe?g|png|gif|bmp)$/i).test(data[i].url)) { //If matches image file push to array
              urls.push(data[i]);
            }
          }
          if (urls.length!=0) {
            var random = Math.floor(Math.random() * urls.length);//Picks one randomly to post
            message.channel.send({embed:new Discord.RichEmbed()
            .setImage(urls[random].url)
            .setDescription(`${urls[random].title}\n[Source](http://reddit.com${urls[random].permalink})`)
            .setColor(config.hexColour)});
          }else {
            message.channel.send(lib.embed(`Sorry, no images could be found on r/${args[0]}`));
          }
        }else {
          message.channel.send(lib.embed(`ERROR: Could not retrieve subreddit data`));
        }
      });
    }else {
      message.channel.send(lib.embed(`ERROR: No subreddit specified | Use !r [subreddit]`));
    }
  }

  img2B(args,message){
    if(args[0]==='nsfw')
      this.danbooru([`yorha_no._2_type_b`],`e`,100,message);
    else
      this.danbooru([`yorha_no._2_type_b`],`s`,100,message);
  }

  setName(client,args,message){
    if (lib.checkRole(message)) {
      if (args[0]) {
        var name = args.join(' ');
        client.user.setUsername(name).then(message.channel.send(lib.embed(`Name successfully updated!`)));
      }else {
        message.channel.send(lib.embed(`ERROR: Specify a string to change username to`));
      }
    }else {
      message.channel.send(lib.embed(`ERROR: Insufficient permissions to perform that command`));
    }
  }

  setGame(client,args,message){
    if (lib.checkRole(message)) {
      if (args[0]) {
        var game = args.join(' ');
        client.user.setGame(game).then(message.channel.send(lib.embed(`Game successfully updated!`)));
      }else {
        client.user.setGame(null).then(message.channel.send(lib.embed(`Game successfully cleared!`)));
      }
    }else {
      message.channel.send(lib.embed(`ERROR: Insufficient permissions to perform that command`));
    }
  }

  setStatus(client,args,message){
    if (lib.checkRole(message)) {
      if (args[0]==='online' || args[0]==='idle' || args[0]==='invisible' || args[0]==='dnd') {
        client.user.setStatus(args[0]).then(message.channel.send(lib.embed(`Status successfully updated!`)));
      }else {
        message.channel.send(lib.embed(`ERROR: Incorrect syntax | Use !setstatus [status]\nStatuses: online, idle, invisible, dnd`));
      }
    }else {
      message.channel.send(lib.embed(`ERROR: Insufficient permissions to perform that command`));
    }
  }

  setAvatar(client,args,message){
    if (lib.checkRole(message)) {
      if ((/\.(jpe?g|png|gif|bmp)$/i).test(args[0])) {
        client.user.setAvatar(args[0]).then(message.channel.send(lib.embed(`Avatar successfully updated!`)));
      }else {
        message.channel.send(lib.embed(`ERROR: That's not an image filetype I recognize | Try: .jpg .png .gif .bmp`));
      }
    }else {
      message.channel.send(lib.embed(`ERROR: Insufficient permissions to perform that command`));
    }
  }

  getGbp(userDB,message){
    userDB.once("value", (data) => {
      var users = data.val();
      if (users) {
        var keys = Object.keys(users);
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          if (users[key].id===message.author.id) {
            message.channel.send(lib.embed(`:moneybag: ${message.author.username}'s Balance: ${users[key].gbp} GBP`));
            return;
          }
        }
      }
      userDB.push({id: message.author.id,gbp: 1000});
      message.channel.send(lib.embed(`Registered new user ${message.author.username} with 1000 GBP`));
    });
  }

  addGbp(userDB,guild){
    guild.fetchMembers().then(function (data) {
      var onlineUsers = [];
      for(var u of data.presences.keys()){
        onlineUsers.push(u);
      }
      userDB.once("value", (data) => {
        var users = data.val();
        if (users) {
          var keys = Object.keys(users);
          for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (onlineUsers.includes(users[key].id)) {
              var gbp = users[key].gbp + 1;
              userDB.child(key).update({"gbp": gbp});
            }
          }
        }
      });
    });
  }

  betGbp(userDB,args,message){
    var wager = Number.parseInt(args[0]);
    if (wager>0) {
      var roll = Math.floor(Math.random() * 100) + 1;
      userDB.once("value", (data) => {
        var users = data.val();
        if (users) {
          var keys = Object.keys(users);
          for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (users[key].id===message.author.id) {
              if (users[key].gbp<wager) {
                message.channel.send(lib.embed(`ERROR: Insufficient Funds | Your Balance: ${users[key].gbp}`));
              }else {
                if (roll<50) {
                  userDB.child(key).update({"gbp": users[key].gbp - wager});
                  message.channel.send(lib.embed(`:anger: Sorry, You Rolled ${roll}/100 | New Balance: ${users[key].gbp-wager}`));
                }else {
                  userDB.child(key).update({"gbp": users[key].gbp + wager});
                  message.channel.send(lib.embed(`:dollar: Congrats! You Rolled ${roll}/100 | New Balance: ${users[key].gbp+wager}`));
                }
              }
              return;
            }
          }
        }
        userDB.push({id: message.author.id,gbp: 1000});
        message.channel.send(lib.embed(`Registered new user ${message.author.username} with 1000 GBP, try placing your wager again`));
      });
    }else {
      message.channel.send(lib.embed(`ERROR: Specify an amount to wager using !bet [amount]`));
    }
  }

  displayShop(userDB,message){
    var bal = 0;
    userDB.once("value", (data) => {
      var users = data.val();
      if (users) {
        var keys = Object.keys(users);
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          if (users[key].id===message.author.id) {
            bal = users[key].gbp;
          }
        }
      }
      message.channel.send({embed:new Discord.RichEmbed()
        .setTitle(`Points Shop | :moneybag: Balance: ${bal} GBP`)
        .setImage(`http://i.imgur.com/5tk87o1.png`)
        .setDescription(`Facilitates the purchasing of server perks`)
        .addField(`:gay_pride_flag: Custom Name Colour - 5000 GBP`,
          `!buy name [#hex colour code]`)
        .addField(`:thinking: Custom Emoji Slot - 7500 GBP`,
          `!buy emoji [image link]`)
        .setColor(config.hexColour)
        .setFooter(`Disclaimer: Purchases may be revoked at Admin discretion`)});
    });
  }

  calc(math,args,message){
    var expr = args.join(' ');
    if (args[0]) {
      try {
        message.channel.send(lib.embed(`${expr} = ${math.eval(expr)}`));
      } catch (e) {
        message.channel.send(lib.embed(`ERROR: ${e.message}`));
      }
    }else {
      message.channel.send(lib.embed(`ERROR: Enter an expression to evaluate`));
    }
  }

  update(message){
    if (this.checkOwner(message)) {
      message.channel.send(lib.embed(`Updating...`));
      lib.series([
        'git fetch',
        'git reset --hard origin/master',
        'npm install',
        'pm2 restart all'
      ], function(err){
        if (err) {
          console.log(err.message);
        }
      });
    }else {
      message.channel.send(lib.embed(`ERROR: Insufficient permissions to perform that command`));
    }
  }

  chatbot(args,message){
    var expr = args.join(' ');
    request({url:`https://jeannie.p.mashape.com/api?input=${expr}`,headers: {'X-Mashape-Key': config.mashape.jeannie,'Accept': 'application/json'}}, function (error, response, body) {
      if (error!=null) {
        message.channel.send(lib.embed(`ERROR: Could not access Jeannie API`));
      }else {
        response = JSON.parse(body);
        message.channel.send(lib.embed(response.output[0].actions.say.text));
      }
    });
  }

  play(ytdl,client,args,message){
    const voiceChannel = message.member.voiceChannel;
    if (!voiceChannel) {
      message.channel.send(lib.embed(`ERROR: Please join a voice channel first`));
    }else {
      let regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      let match = args[0].match(regExp);
      if (match) {
        request(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${match[2]}&key=${config.youtube.apiKey}`, function (error, response, body) {
          if (error!=null) {
            message.channel.send(lib.embed(`ERROR: Could not access YouTube API`));
          }else {
            response = JSON.parse(body);
            let res = response.items[0];
            let stream = ytdl(match[2], {
              filter : 'audioonly'
            });
            let vconnec = client.voiceConnections.get(message.guild.defaultChannel.id);
            if (vconnec) {
              let dispatch = vconnec.player.dispatcher;
              dispatch.end();
            }
            voiceChannel.join().then(connnection => {
              const dispatcher = connnection.playStream(stream, {passes:2});
              message.channel.send({embed:new Discord.RichEmbed()
                .setDescription(`:headphones: Now Playing: ${res.snippet.title}`)
                .setThumbnail(res.snippet.thumbnails.default.url)
                .setColor(config.hexColour)});
              dispatcher.on('end', () => {
                voiceChannel.leave();
              });
            });
          }
        });

      }else {
        let expr = args.join('+');
        request(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${expr}&type=video&videoCategoryId=10&key=${config.youtube.apiKey}`, function (error, response, body) {
          if (error!=null) {
            message.channel.send(lib.embed(`ERROR: Could not access YouTube API`));
          }else {
            response = JSON.parse(body);
            let res = response.items[0];
            let stream = ytdl(res.id.videoId, {
              filter : 'audioonly'
            });
            let vconnec = client.voiceConnections.get(message.guild.defaultChannel.id);
            if (vconnec) {
              let dispatch = vconnec.player.dispatcher;
              dispatch.end();
            }
            voiceChannel.join().then(connnection => {
              const dispatcher = connnection.playStream(stream, {passes:2});
              message.channel.send({embed:new Discord.RichEmbed()
                .setDescription(`:headphones: Now Playing: ${res.snippet.title}`)
                .setThumbnail(res.snippet.thumbnails.default.url)
                .setColor(config.hexColour)});
              dispatcher.on('end', () => {
                voiceChannel.leave();
              });
            });
          }
        });
      }
    }
  }

  stream(client,args,message){
    const voiceChannel = message.member.voiceChannel;
    if (!voiceChannel) {
      message.channel.send(lib.embed(`ERROR: Please join a voice channel first`));
    }else {
      if (args[0]) {
        let vconnec = client.voiceConnections.get(message.guild.defaultChannel.id);
        if (vconnec) {
          let dispatch = vconnec.player.dispatcher;
          dispatch.end();
        }
        if (args[0].startsWith('https')) {
          require('https').get(args[0], (res) => {
            voiceChannel.join().then(connnection => {
              connnection.playStream(res, {passes:2});
            });
          });
        }else {
          require('http').get(args[0], (res) => {
            voiceChannel.join().then(connnection => {
              connnection.playStream(res, {passes:2});
            });
          });
        }
      }else {
        message.channel.send(lib.embed(`ERROR: Please specify the stream url as a parameter`));
      }
    }
  }

  stop(client,message){
    let vconnec = client.voiceConnections.get(message.guild.defaultChannel.id);
    if (vconnec) {
      let dispatch = vconnec.player.dispatcher;
      dispatch.end();
      message.channel.send(lib.embed(`:mute: ${message.author.username} Stopped Playback`));
      vconnec.channel.leave();
    }
  }

  leave(client,message){
    let vconnec = client.voiceConnections.get(message.guild.defaultChannel.id);
    if (vconnec) {
      let dispatch = vconnec.player.dispatcher;
      dispatch.end();
      vconnec.channel.leave();
    }
  }

  pause(client,message){
    let vconnec = client.voiceConnections.get(message.guild.defaultChannel.id);
    if (vconnec) {
      let dispatch = vconnec.player.dispatcher;
      dispatch.pause();
      message.channel.send(lib.embed(`:speaker: ${message.author.username} Paused Playback`));
    }
  }

  resume(client,message){
    let vconnec = client.voiceConnections.get(message.guild.defaultChannel.id);
    if (vconnec) {
      let dispatch = vconnec.player.dispatcher;
      dispatch.resume();
      message.channel.send(lib.embed(`:loud_sound: ${message.author.username} Resumed Playback`));
    }
  }

  radio(client,args,message){
    if (args[0]) {
      var choice = parseInt(args[0])-1;
      if (choice<config.radio.length) {
        this.stream(client,[config.radio[choice].url],message);
        message.channel.send({embed:new Discord.RichEmbed()
          .setDescription(`:headphones: Now Streaming: ${config.radio[choice].title}`)
          .setThumbnail(config.radio[choice].thumb)
          .setColor(config.hexColour)});
      }else {
        message.channel.send(lib.embed(`ERROR: Selection does not exist`));
      }
    }else {
      var desc = [];
      for (var i = 0; i < config.radio.length; i++) {
        if (i===0) {
          desc.push({name:'Command',        value:`!radio ${i+1}`,            inline:true});
          desc.push({name:'Radio Station',  value:`${config.radio[i].title}`, inline:true});
          desc.push({name:'Genre',          value:`${config.radio[i].genre}`, inline:true});
        }else {
          desc.push({name:'­', value:`!radio ${i+1}`,             inline:true});
          desc.push({name:'­', value:`${config.radio[i].title}`,  inline:true});
          desc.push({name:'­', value:`${config.radio[i].genre}`,  inline:true});
        }
      }
      message.channel.send({embed:{title: `:radio: Programmed Stations:`, description:'\n', fields: desc, color: 15514833}});
    }
  }

  fivem(message){
    const server = require('fivereborn-query');
    server.query(config.fiveM.ip, 30120, (err, data) => {
      if (!err) {
        message.channel.send(lib.embed(`:white_check_mark: Server is Online\nHostname: ${data.hostname}\nIP Address: ${config.fiveM.ip}\nPort: 30120\nConnected: ${data.clients}/${data.maxclients}`));
      } else {
        message.channel.send(lib.embed(`ERROR: Server is currently offline`));
      }
    })
  }

  smug(message){
    request(`http://arc.moe/smug`, function (error, response, body) {
      body = JSON.parse(body);
      if (error!=null) {
        message.channel.send(lib.embed('ERROR: Could not access arc.moe resource'));
      }else {
        var random = Math.floor(Math.random() * body.length);//Picks one randomly to post
        if (body[random]) {
          message.channel.send({embed:new Discord.RichEmbed()
            .setImage(`${body[random]}`)
            .setColor(config.hexColour)});
        }else {
          message.channel.send(lib.embed(`ERROR: Could not find the image requested`));
        }
      }
    });
  }

}

module.exports = new Commands();
