const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const marriageFile = path.join(__dirname, '..', 'data', 'marriages.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('divorce')
        .setDescription('Divorce your partner'),

    async execute(interaction) {
        const user = interaction.user;

        let marriages = [];
        try {
            const rawData = fs.readFileSync(marriageFile, 'utf8');
            marriages = JSON.parse(rawData);
        } catch (e) {
            console.warn('Could not read marriages file, continuing with empty list.');
        }

        const marriageIndex = marriages.findIndex(
            m => m.proposerId === user.id || m.accepterId === user.id
        );

        if (marriageIndex === -1) {
            const notMarriedEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('💔 Not Married')
                .setDescription('You’re not married to anyone right now.')
                .setFooter({ text: 'Use /marry to change that...' });

            return interaction.reply({ embeds: [notMarriedEmbed], ephemeral: true });
        }

        const marriage = marriages[marriageIndex];
        const partnerId = marriage.proposerId === user.id ? marriage.accepterId : marriage.proposerId;

        const confirmEmbed = new EmbedBuilder()
            .setColor(0xff8800)
            .setTitle('⚖️ Divorce Confirmation')
            .setDescription(`Are you sure you want to **divorce <@${partnerId}>**?\n\nThis action cannot be undone.`)
            .setFooter({ text: 'You have 15 seconds to decide.' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('divorce_confirm')
                .setLabel('💔 Confirm Divorce')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('divorce_cancel')
                .setLabel('❌ Cancel')
                .setStyle(ButtonStyle.Secondary)
        );

        const reply = await interaction.reply({
            embeds: [confirmEmbed],
            components: [row],
            fetchReply: true,
            ephemeral: true
        });

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 15_000
        });

        collector.on('collect', async i => {
            if (i.user.id !== user.id) {
                return i.reply({ content: '❌ You can’t interfere in someone else’s heartbreak.', ephemeral: true });
            }

            if (i.customId === 'divorce_confirm') {
                marriages.splice(marriageIndex, 1);
                fs.writeFileSync(marriageFile, JSON.stringify(marriages, null, 2));

                const divorcedEmbed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('💔 Divorce Complete')
                    .setDescription(`<@${user.id}> has officially divorced <@${partnerId}>.`)
                    .setFooter({ text: 'Hope it was mutual...' });

                await i.update({
                    embeds: [divorcedEmbed],
                    components: []
                });
            } else if (i.customId === 'divorce_cancel') {
                const cancelledEmbed = new EmbedBuilder()
                    .setColor(0x00ff99)
                    .setTitle('❤️ Divorce Cancelled')
                    .setDescription(`Phew! <@${user.id}> decided to stay with <@${partnerId}> after all.`)
                    .setFooter({ text: 'Love wins... for now.' });

                await i.update({
                    embeds: [cancelledEmbed],
                    components: []
                });
            }

            collector.stop();
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                const timeoutEmbed = new EmbedBuilder()
                    .setColor(0x999999)
                    .setTitle('⌛ Divorce Timed Out')
                    .setDescription('No response received. Divorce was not processed.')
                    .setFooter({ text: 'Maybe that’s for the best?' });

                interaction.editReply({
                    embeds: [timeoutEmbed],
                    components: []
                });
            }
        });
    }
};
