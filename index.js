const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();
const token = process.env.TOKEN;

const { addCommand } = require('./structure/commandRegistry.js');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent
	]
});
client.commands = new Collection();

function loadCommandFiles(dir, base = 'commands') {
	const files = fs.readdirSync(dir);

	for (const file of files) {
		const filePath = path.join(dir, file);
		const stats = fs.statSync(filePath);

		if (stats.isDirectory()) {
			loadCommandFiles(filePath, base);
		} else if (file.endsWith('.js')) {
			const command = require(filePath);
			if ('data' in command && 'execute' in command) {
				client.commands.set(command.data.name, command);

				const relative = path.relative(path.join(__dirname, base), filePath);
				const parts = relative.split(path.sep);
				const category = parts.length > 1 ? parts[0] : 'uncategorized';

				addCommand(command.data.name, command.data.description, category);
			} else {
				console.log(`[WARNING] The command at ${filePath} is missing "data" or "execute".`);
			}
		}
	}
}

const commandsPath = path.join(__dirname, 'commands');
loadCommandFiles(commandsPath);

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

require('./req.js');
client.login(token);
