const { SlashCommandBuilder } = require('discord.js');
const { addMoney, getCooldown, updateCooldown, getUser, saveUser } = require('../../structure/userData');

const COOLDOWN_SECONDS = 30;

const winMessages = [
  "🎉 You nailed it! Lucky guess or secret psychic powers?",
  "💰 Boom! Jackpot! You're on fire today!",
  "🔥 Spot on! You should buy a lottery ticket.",
  "👏 Correct! You're a natural at this."
];

const baseLossMessages = [
  "❌ Nope, not this time. Try again!",
  "😢 Wrong guess! Better luck next time.",
  "🤔 Close, but no cigar.",
  "😆 Nope! Don't give up now!"
];

const lossTeases = [
  "Are you even trying? 😅",
  "Maybe numbers aren’t your thing... 🤡",
  "I believe in you... kind of. 🤔",
  "Did you blink and miss it? 😂",
  "Okay, that’s embarrassing now. 😜"
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('guess')
    .setDescription('I will think of a number 1-10. Reply with your guess to win money!'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const now = Math.floor(Date.now() / 1000);
    const lastGuess = getCooldown(userId, 'lastGuess');
    const timePassed = now - lastGuess;

    if (timePassed < COOLDOWN_SECONDS) {
      const timeLeft = COOLDOWN_SECONDS - timePassed;
      return interaction.reply({ content: `⏳ Please wait <t:${now + timeLeft}:R> before guessing again.`, ephemeral: true });
    }

    updateCooldown(userId, 'lastGuess', now);

    await interaction.reply("🎲 I'm thinking of a number between 1 and 10. Reply with your guess within 30 seconds!");

    const filter = m => m.author.id === userId;
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    const number = Math.floor(Math.random() * 10) + 1;

    collector.on('collect', m => {
      const guess = parseInt(m.content, 10);
      if (isNaN(guess) || guess < 1 || guess > 10) {
        return interaction.followUp({ content: '❌ Your guess must be a number between 1 and 10.', ephemeral: true });
      }

      const userData = getUser(userId);

      if (guess === number) {
        userData.lossStreak = 0; // reset streak on win
        saveUser(userId, userData);

        const prize = 200;
        addMoney(userId, prize);

        const winMsg = winMessages[Math.floor(Math.random() * winMessages.length)];
        interaction.followUp(`🎉 You guessed **${number}** and WON **$${prize}**! ${winMsg}`);

      } else {
        userData.lossStreak = (userData.lossStreak || 0) + 1;
        saveUser(userId, userData);

        const baseMsg = baseLossMessages[Math.floor(Math.random() * baseLossMessages.length)];
        const teaseMsg = userData.lossStreak > 2 ? lossTeases[Math.min(userData.lossStreak - 3, lossTeases.length -1)] : '';

        interaction.followUp(`❌ Nope! The number was **${number}**. ${baseMsg} ${teaseMsg}`);
      }
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.followUp({ content: "⏰ You didn't reply in time! Try again later.", ephemeral: true });
      }
    });
  }
};
