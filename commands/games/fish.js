const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, saveUser } = require('../../structure/userData');
const BASE_OUTCOMES = require('../../structure/fishingOutcomes.json');

const COOLDOWN_KEY = 'fish';
const BASE_COOLDOWN = 30000;

const getRarityLabel = (value) => {
  if (value >= 1000) return 'Legendary 💫';
  if (value >= 500) return 'Epic ✨';
  if (value >= 200) return 'Rare ⭐';
  if (value >= 100) return 'Uncommon 🔼';
  if (value >= 10) return 'Common 🔽';
  return 'Junk 🗑️';
};

const getRarityColor = (value) => {
  if (value >= 1000) return '#ff00ff';
  if (value >= 500) return '#9b59b6';
  if (value >= 200) return '#3498db';
  if (value >= 100) return '#2ecc71';
  if (value >= 10) return '#f1c40f';
  return '#95a5a6';
};

const createXPBar = (xp, needed, length = 20) => {
  const percent = xp / needed;
  const filled = Math.round(length * percent);
  return '▰'.repeat(filled) + '▱'.repeat(length - filled);
};

const getCooldownTime = (userData) => {
  const now = Date.now();
  if (userData.buffs?.energyDrinkExpires && userData.buffs.energyDrinkExpires > now) {
    return 0;
  }
  return BASE_COOLDOWN;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fish')
    .setDescription('Go fishing for some coin'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const userData = getUser(userId);
    const now = Date.now();

    const cooldownTime = getCooldownTime(userData);
    const lastFish = userData.cooldowns?.[COOLDOWN_KEY] || 0;
    const nextAvailableTime = lastFish + cooldownTime;

    if (cooldownTime > 0 && now < nextAvailableTime) {
      const timeLeft = Math.ceil((nextAvailableTime - now) / 1000);
      return interaction.reply({
        content: `🕒 You're tired from fishing! Try again in **${timeLeft}** seconds.`,
        ephemeral: true
      });
    }

    if (!userData.equipment?.bait || userData.equipment.bait.count <= 0) {
      return interaction.reply("❌ You need bait to fish! Buy some from the shop.");
    }

    userData.equipment.bait.count--;
    if (userData.equipment.bait.count <= 0) {
      userData.equipment.bait.count = 0;
      userData.equipment.bait.type = 'None';
    }

    if (cooldownTime > 0) {
      userData.cooldowns = userData.cooldowns || {};
      userData.cooldowns[COOLDOWN_KEY] = now;
    }

    const rodLevel = userData.equipment?.rod?.level || 1;
    const luckBoostActive = userData.buffs?.luckBoostExpires > now;

    const adjustedOutcomes = BASE_OUTCOMES.map(item => {
      let chance = item.baseChance;
      if (rodLevel >= 2 && item.value > 100) {
        chance *= (rodLevel === 2) ? 1.2 : 1.4;
      }
      if (luckBoostActive) {
        if (item.value >= 200) chance *= 1.7;
        else if (item.value >= 100) chance *= 1.3;
        else if (item.value < 10) chance *= 0.5;
      }
      return { ...item, adjustedChance: chance };
    });

    const totalChance = adjustedOutcomes.reduce((sum, i) => sum + i.adjustedChance, 0);
    let roll = Math.random() * totalChance;
    let accumulator = 0;
    let catchResult;
    for (const item of adjustedOutcomes) {
      accumulator += item.adjustedChance;
      if (roll <= accumulator) {
        catchResult = item;
        break;
      }
    }

    let fishingXP = 5;
    if (catchResult.value >= 1000) fishingXP = 50;
    else if (catchResult.value >= 500) fishingXP = 30;
    else if (catchResult.value >= 200) fishingXP = 20;
    else if (catchResult.value >= 100) fishingXP = 12;
    else if (catchResult.value >= 10) fishingXP = 7;

    const skill = userData.skills.fishing;
    skill.xp += fishingXP;
    const xpNeeded = skill.level * 100;
    if (skill.xp >= xpNeeded) {
      skill.xp -= xpNeeded;
      skill.level++;
    }

    userData.inventory = userData.inventory || [];
    userData.inventory.push({
      name: catchResult.text,
      value: catchResult.value,
      rarity: getRarityLabel(catchResult.value)
    });

    userData.balance = (userData.balance || 0) + catchResult.value;

    saveUser(userId, userData);

    const rarityLabel = getRarityLabel(catchResult.value);
    const rarityColor = getRarityColor(catchResult.value);
    const actualCatchChance = (catchResult.adjustedChance / totalChance) * 100;
    const xpBar = createXPBar(skill.xp, xpNeeded);

    const valueDescription = catchResult.value === 0 ? "nothing (junk item)" : `**$${catchResult.value.toLocaleString()}**`;

    const embed = new EmbedBuilder()
      .setTitle(`🎣 You caught ${catchResult.text}!`)
      .setDescription(`You earned ${valueDescription}`)
      .addFields(
        { name: 'Rarity', value: rarityLabel, inline: true },
        { name: 'Catch Chance', value: `${actualCatchChance.toFixed(2)}%`, inline: true },
        { name: 'Bait Left', value: `${userData.equipment.bait.count}x ${userData.equipment.bait.type}`, inline: true },
        { name: `Fishing XP +${fishingXP}`, value: `Level ${skill.level}\n${xpBar} (${skill.xp}/${xpNeeded})`, inline: false }
      )
      .setColor(rarityColor)
      .setFooter({ text: 'Keep fishing to level up!' });

    return interaction.reply({ embeds: [embed] });
  }
};
