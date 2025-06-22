// commandRegistry.js

const commandInfo = new Map();

module.exports = {
	addCommand(name, description, category = 'uncategorized') {
		commandInfo.set(name, { name, description, category });
	},

	getAllCommands() {
		return Array.from(commandInfo.values());
	},

	getCommand(name) {
		return commandInfo.get(name);
	}
};
