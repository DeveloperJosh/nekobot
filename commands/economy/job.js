const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setJob, getUser } = require('../../structure/userData');

const jobs = ['Chef', 'Hunter', 'Thief', 'Fisher'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('job')
    .setDescription('Get assigned a random job'),

  async execute(interaction) {

    const userId = interaction.user.id;
    const user = getUser(userId);

    if (user.job) {
        return interaction.reply(`You already have a job: **${user.job}**. Use /work to start earning money.`);
    }

    const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
    setJob(interaction.user.id, randomJob);
    await interaction.reply(`🎉 You got assigned the job: **${randomJob}**! Use /work to start earning money.`, {
        ephemeral: true
    });
  }
};