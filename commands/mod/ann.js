const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    ComponentType,
    Collection,
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ann')
        .setDescription('Make an announcement')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The announcement message')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('with_buttons')
                .setDescription('Add voting buttons for game night?')
                .setRequired(false)),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '❌ You do not have permission to use this command.',
                ephemeral: true,
            });
        }

        const message = interaction.options.getString('message');
        const withButtons = interaction.options.getBoolean('with_buttons') ?? false;

        const embed = new EmbedBuilder()
            .setTitle('📢 Announcement')
            .setDescription(message)
            .setColor(0x5865F2)
            .setTimestamp()
            .setFooter({ text: `Announcement by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

        if (!withButtons) {
            await interaction.reply({ content: '✅ Announcement sent without buttons!', ephemeral: true });
            await interaction.channel.send({ embeds: [embed] });
            return;
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('vote_overwatch').setLabel('Overwatch').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('vote_mr').setLabel('Marvel Rivals').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('vote_fn').setLabel('Fortnite').setStyle(ButtonStyle.Danger),
        );

        await interaction.reply({ content: '✅ Announcement sent with voting buttons!', ephemeral: true });

        const voteMessage = await interaction.channel.send({ embeds: [embed], components: [row] });

        const votes = new Collection();
        const voteCounts = {
            overwatch: 0,
            mr: 0,
            poker: 0,
        };

        const collector = voteMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 3 * 60 * 60 * 1000, 
        });

        collector.on('collect', async i => {
            const userId = i.user.id;
            const choice = i.customId.replace('vote_', '');
            const previous = votes.get(userId);
            if (previous) voteCounts[previous]--;

            votes.set(userId, choice);
            voteCounts[choice]++;
            console.log(`User ${i.user.tag} voted for ${choice}`);
            await i.reply({ content: `✅ You voted for **${choice.replace('_', ' ')}**.`, ephemeral: true });
        });

        collector.on('end', async () => {
            const resultEmbed = new EmbedBuilder()
                .setTitle('🗳️ Game Night Vote Results')
                .setColor(0x00AE86)
                .setDescription(
                    `✅ Voting has ended!\n\n` +
                    `**Overwatch**: ${voteCounts.overwatch} votes\n` +
                    `**Marvel Rivals**: ${voteCounts.mr} votes\n` +
                    `**Fortnite**: ${voteCounts.poker} votes`
                )
                .setTimestamp();

            await interaction.channel.send({ embeds: [resultEmbed] });

            const disabledRow = new ActionRowBuilder().addComponents(
                row.components.map(button => ButtonBuilder.from(button).setDisabled(true))
            );
            await voteMessage.edit({ components: [disabledRow] });

            console.log('--- Game Night Vote Log ---');
            votes.forEach((vote, userId) => {
                const user = interaction.guild.members.cache.get(userId);
                const tag = user?.user?.tag ?? `Unknown (${userId})`;
            });

            const logChannel = interaction.guild.channels.cache.find(ch => ch.name === 'vote-logs');
            if (logChannel && logChannel.isTextBased()) {
                const voteLog = [...votes.entries()]
                    .map(([userId, vote]) => {
                        const member = interaction.guild.members.cache.get(userId);
                        const tag = member?.user?.tag ?? `Unknown (${userId})`;
                        return `🧑 ${tag} → **${vote}**`;
                    })
                    .join('\n') || 'No one voted.';

                await logChannel.send({
                    content: `📄 **Vote log for: ${message}**\n\n${voteLog}`,
                });
            }
        });
    },
};