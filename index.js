const fs = require('fs');
const Discord = require('discord.js');
const { prefix, token } = require('./config.json');

const client = new Discord.Client();
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const cooldowns = new Discord.Collection();

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('guildMemberAdd', (member) => {

  var author = member;

  var players = arrayToMap(JSON.parse(fs.readFileSync('playerPreferences.json', 'utf8')));

  players.set(author.id, {
    WC: true,
    MW: true,
    EC: true
  });

  fs.writeFileSync('playerPreferences.json', mapToJSON(players));

  console.log(`${author.displayName} joined, added them to the json.`);

})

client.on('message', message => {
  
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) return;

  if (command.args && (args.length < command.usage.split(' ').length)) {
    let reply = `You didn't provide enough arguments, ${message.author}!`;

    if (command.usage) {
      reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
    }

    return message.channel.send(reply);
  }

  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Discord.Collection());
  }
  
  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 0) * 1000;
  
  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
    }
  }

  timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

	try {
		command.execute(message, args);
	} catch (error) {
		console.error(error);
		message.channel.send("There was an error executing that command" + `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``);
	}

});

client.login(token);

function arrayToMap(input) {

  var map = new Map();

  for (i = 0; i < input.length; i++) {

      map.set(input[i][0], input[i][1]);

  }

  return map;

}

function mapToJSON(map) {

  var base = [];

  var keys = Array.from(map.keys());

  for (i = 0; i < keys.length; i++) {

      base.push([
          keys[i],
          map.get(keys[i])
      ]);

  }

  return JSON.stringify(base, null, 4);

}