// say command
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Make the bot say something')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to say')
                .setRequired(true)),
    async execute(interaction) {

        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({ content: '❌ You do not have permission to kick members.', ephemeral: true });
        }

        const message = interaction.options.getString('message');

        if (!message) {
            return interaction.reply({ content: '❌ Please provide a message to say.', ephemeral: true });
        }

        await interaction.reply({ content: message, ephemeral: false });
    },
};