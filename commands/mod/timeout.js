const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

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
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({
                content: '❌ You do not have permission to timeout members.',
                ephemeral: true
            });
        }

        const user = interaction.options.getUser('target');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            return interaction.reply({
                content: '⚠️ Could not find that user in this server.',
                ephemeral: true
            });
        }

        // Prevent moderating higher roles
        if (interaction.member.roles.highest.position <= member.roles.highest.position) {
            return interaction.reply({
                content: '⚠️ You cannot timeout someone with a higher or equal role.',
                ephemeral: true
            });
        }

        // Check if user is already timed out
        if (member.communicationDisabledUntilTimestamp && member.communicationDisabledUntilTimestamp > Date.now()) {
            return interaction.reply({
                content: '⚠️ This user is already timed out.',
                ephemeral: true
            });
        }

        try {
            await member.timeout(duration * 60 * 1000, reason);
            return interaction.reply({
                content: `⏳ Timed out **${user.tag}** for **${duration} minute(s)**.\n📝 Reason: ${reason}`,
                ephemeral: false
            });
        } catch (err) {
            return interaction.reply({
                content: `❌ Failed to timeout user: ${err.message}`,
                ephemeral: true
            });
        }
    }
};
