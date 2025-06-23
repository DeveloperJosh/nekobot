const { SlashCommandBuilder, PermissionFlagsBits, time } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout (mute) a user for a specific duration')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('User to timeout')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration in minutes (max 10080 = 7 days)')
                .setMinValue(1)
                .setMaxValue(10080)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for timeout')
                .setRequired(false)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ content: '❌ You do not have permission to timeout members.', ephemeral: true });
        }

        const user = interaction.options.getUser('target');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.reply({ content: '⚠️ User not found in this server.', ephemeral: true });

        await member.timeout(duration * 60 * 1000, reason).catch(err => {
            return interaction.reply({ content: `❌ Failed to timeout user: ${err.message}`, ephemeral: true });
        });

        return interaction.reply(`⏳ Timed out ${user.tag} for ${duration} minute(s). Reason: ${reason}`);
    }
};