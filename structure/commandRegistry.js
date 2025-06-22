// commandRegistry.js

const commandInfo = new Map();

module.exports = {
	addCommand(name, description) {
		commandInfo.set(name, { name, description });
	},
	getAllCommands() {
		return Array.from(commandInfo.values());
	},
	getCommand(name) {
		return commandInfo.get(name);
	}
};
