const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { addWarning } = require('../../structure/userData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user you want to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(true)
        ),

    async execute(interaction) {
        const issuer = interaction.user;
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason');

        // Permission check
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: '❌ You do not have permission to warn members.', ephemeral: true });
        }

        if (target.id === issuer.id) {
            return interaction.reply({ content: '❌ You cannot warn yourself.', ephemeral: true });
        }

        if (target.bot) {
            return interaction.reply({ content: '❌ You cannot warn bots.', ephemeral: true });
        }

        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (!member) {
            return interaction.reply({ content: '❌ This user is not in the server.', ephemeral: true });
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const warning = {
            reason,
            issuedBy: issuer.id,
            timestamp
        };

        try {
            addWarning(target.id, warning);
        } catch (err) {
            console.error('❌ Failed to save warning data:', err);
            return interaction.reply({ content: '⚠️ Warning failed to save.', ephemeral: true });
        }

        // Embed to send in DMs
        const warningEmbed = new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('⚠️ You have been warned')
            .setDescription(`You received a warning from **${issuer.tag}**`)
            .addFields(
                { name: 'Reason', value: reason },
                { name: 'Time', value: `<t:${timestamp}:F>` }
            )
            .setFooter({ text: 'Warning System' })
            .setTimestamp();

        let dmSuccess = true;
        try {
            await target.send({ embeds: [warningEmbed] });
        } catch (err) {
            dmSuccess = false;
            console.warn(`❌ Could not DM ${target.tag}:`, err);
        }

        const publicNotice = `⚠️ <@${target.id}> has been warned for: *${reason}* at <t:${timestamp}:f>`;

        if (!dmSuccess) {
            await interaction.channel.send({ content: publicNotice });
            return interaction.reply({
                content: '✅ Warning logged, but the user has DMs disabled.',
                ephemeral: true
            });
        }

        return interaction.reply({
            content: `✅ Successfully warned **${target.tag}** and sent them a DM.`,
            ephemeral: true
        });
    }
};
