const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const Report = require('../models/report');
const ServerConfig = require('../models/serverConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Report an issue or bug')
        .addStringOption(option => 
            option.setName('title')
                .setDescription('The title of your report')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('description')
                .setDescription('A detailed description of the issue')
                .setRequired(true))
        // image
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('An image to help explain the issue')
                .setRequired(false)),
    async execute(interaction) {
        const reportTitle = interaction.options.getString('title');
        const reportDescription = interaction.options.getString('description');
        const user = interaction.user;

        // gen a code for the report so the user and staff can reference it later
        const bug_id = Math.random().toString(36).substring(7);

        // Save the report to the database
        const report = new Report({
            userId: user.id,
            username: user.username,
            code: bug_id,
            reportTitle,
            reportDescription,
        });

        await report.save();

        // Get the report channel from the database
        const serverId = interaction.guild.id;
        const config = await ServerConfig.findOne({ serverId });
        const channel = interaction.guild.channels.cache.get(config.reportChannelId);

        if (!channel) {
            return interaction.reply({ content: 'Report channel not set.', ephemeral: true });
        }

        const image = interaction.options.getAttachment('image');
        if (image) {
            const imageEmbed = new EmbedBuilder()
                .setTitle(`Image for Report #${bug_id}`)
                .setImage(image.url)
                .setColor('#FF0000');

            await channel.send({ embeds: [imageEmbed] });
        } 
        const embed = new EmbedBuilder()
            .setTitle('New Report')
            .setDescription(`**Reported by:** ${user}\n**Title:** ${reportTitle}\n**Description:** ${reportDescription}`)
            .setFooter({ text: `Report Code: #${bug_id}` })
            .setColor('#FF0000')
            .setTimestamp();

        await channel.send({ embeds: [embed] });

        await interaction.reply({ content: `Thank you for your report!, Your report code is #${bug_id}`, ephemeral: true });
    },
};
