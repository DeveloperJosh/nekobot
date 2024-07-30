const { SlashCommandBuilder } = require('discord.js');
const ServerConfig = require('../models/serverConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setreportchannel')
    .setDescription('Set the channel for receiving reports')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to set for reports')
        .setRequired(true)),
  async execute(interaction) {
    const reportChannel = interaction.options.getChannel('channel');
    const serverId = interaction.guild.id;

    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
        return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    try {
      let config = await ServerConfig.findOne({ serverId });
      if (!config) {
        config = new ServerConfig({ serverId, reportChannelId: reportChannel.id });
      } else {
        config.reportChannelId = reportChannel.id;
      }

      await config.save();
      await interaction.reply(`Report channel set to ${reportChannel.name}`);
    } catch (err) {
      console.error(err);
      await interaction.reply('There was an error setting the report channel.');
    }
  },
};
