const { SlashCommandBuilder } = require('discord.js');
const { setJob, getUser } = require('../../structure/userData');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quit')
    .setDescription('Quit your current job and get a new one'),

  async execute(interaction) {

    const userId = interaction.user.id;
    const user = getUser(userId);

    if (!user.job) {
      return interaction.reply('You don\'t have a job yet. Use /setjob to get one.');
    }
    const previousJob = user.job;
    setJob(userId, null); 
    await interaction.reply({ content: `You quit your workplace by killing them all.`, ephemeral: true })
  }
};