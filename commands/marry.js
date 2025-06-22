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

const marriageFile = path.join(__dirname, '..', 'marriages.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('marry')
        .setDescription('Marry someone')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('User to propose to')
                .setRequired(true)),

    async execute(interaction) {
        const user = interaction.user;
        const target = interaction.options.getUser('target');

        if (!target) {
            return interaction.reply({ content: '❌ User not found. Please mention a valid user.', ephemeral: true });
        } else if (user.id === target.id) {
            return interaction.reply({ content: '❌ That\'s just sad.', ephemeral: true });
        } else if (target.bot) {
            return interaction.reply({ content: '❌ I will not marry you!', ephemeral: true });
        }

        let marriages = [];
        try {
            const rawData = fs.readFileSync(marriageFile, 'utf8');
            marriages = JSON.parse(rawData);
        } catch (e) {
            console.warn('Could not read marriages file, continuing with empty list.');
        }

        const isUserMarried = marriages.some(m => m.proposerId === user.id || m.accepterId === user.id);
        const isTargetMarried = marriages.some(m => m.proposerId === target.id || m.accepterId === target.id);

        if (isUserMarried) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle('💔 Already Married')
                        .setDescription('You are already married! You can’t marry again.')
                ],
                ephemeral: true
            });
        }

        if (isTargetMarried) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle('💔 They’re Taken')
                        .setDescription('That user is already married!')
                ],
                ephemeral: true
            });
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('merry_yes')
                .setLabel('💍 Yes')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('merry_no')
                .setLabel('❌ No')
                .setStyle(ButtonStyle.Danger)
        );

        const proposalEmbed = new EmbedBuilder()
            .setColor(0xff66cc)
            .setTitle('💘 A Marriage Proposal!')
            .setDescription(`<@${user.id}> is proposing to <@${target.id}>!\n\n<@${target.id}>, will you say **yes** or **no**?`)
            .setFooter({ text: 'You have 15 seconds to decide!' });

        const reply = await interaction.reply({
            content: `<@${target.id}>`, 
            embeds: [proposalEmbed],
            components: [row],
            fetchReply: true
        });

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 15_000
        });

        collector.on('collect', async i => {
            if (i.user.id !== target.id) {
                return i.reply({ content: '❌ You are not the one being proposed to!', ephemeral: true });
            }

            if (i.customId === 'merry_yes') {
                const timestamp = Math.floor(Date.now() / 1000);
                const newMarriage = {
                    proposerId: user.id,
                    accepterId: target.id,
                    timestamp
                };

                marriages.push(newMarriage);
                fs.writeFileSync(marriageFile, JSON.stringify(marriages, null, 2));

                const yesEmbed = new EmbedBuilder()
                    .setColor(0x66ff66)
                    .setTitle('💖 They Said YES!')
                    .setDescription(`<@${target.id}> accepted <@${user.id}>'s proposal!\n\n**Married at**: <t:${timestamp}:F> 💍`);

                await i.update({
                    content: '',
                    embeds: [yesEmbed],
                    components: []
                });
            } else if (i.customId === 'merry_no') {
                const noEmbed = new EmbedBuilder()
                    .setColor(0xff3333)
                    .setTitle('💔 Rejected')
                    .setDescription(`<@${target.id}> said **NO**... sorry <@${user.id}>.`);

                await i.update({
                    content: '',
                    embeds: [noEmbed],
                    components: []
                });
            }

            collector.stop();
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                const timeoutEmbed = new EmbedBuilder()
                    .setColor(0x999999)
                    .setTitle('⌛ No Response')
                    .setDescription(`<@${target.id}> didn’t respond in time... maybe they got cold feet?`);

                interaction.editReply({
                    content: '',
                    embeds: [timeoutEmbed],
                    components: []
                });
            }
        });
    }
};
