// command for dming users 
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dm')
        .setDescription('Send a direct message to a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('User to send a DM to')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Message to send')
                .setRequired(true)),
    async execute(interaction) {
        // Check if the user has permission to use this command
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ content: '❌ You do not have permission to ban members.', ephemeral: true });
        }
        const target = interaction.options.getUser('target');
        const message = interaction.options.getString('message');

        if (!target) {
            return interaction.reply({ content: '❌ User not found. Please mention a valid user.', ephemeral: true });
        }

        if (target.bot) {
            return interaction.reply({ content: '❌ You cannot send DMs to bots.', ephemeral: true });
        }

        try {
            await target.send(`You have received a DM from ${interaction.user.tag}:\n\n${message}`);
            return interaction.reply({ content: `✅ Successfully sent a DM to ${target.tag}.`, ephemeral: true });
        } catch (error) {
            console.error('Error sending DM:', error);
            return interaction.reply({ content: '❌ Failed to send DM. The user may have DMs disabled or is not accepting messages from this server.', ephemeral: true });
        }

    }
};