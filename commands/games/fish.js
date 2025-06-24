const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, saveUser } = require('../../structure/userData');

const COOLDOWN_KEY = 'fish';
const BASE_COOLDOWN = 30000;

const BASE_OUTCOMES = [
    // Junk items (value 0-10)
    { text: 'boot 🥾', value: 0, baseChance: 25 },
    { text: 'old tire 🛞', value: 0, baseChance: 15 },
    { text: 'soggy newspaper 📰', value: 5, baseChance: 10 },
    { text: 'rusty can 🥫', value: 2, baseChance: 8 },
    { text: 'used condom', value: 1, baseChance: 5 },

    // Common items (value 10-100)
    { text: 'goldfish 🐟', value: 50, baseChance: 18 },
    { text: 'guppy 🐠', value: 30, baseChance: 10 },
    { text: 'small trout 🐡', value: 60, baseChance: 12 },
    { text: 'catfish 🐈‍⬛', value: 25, baseChance: 9 },

    // Uncommon items (value 100-200)
    { text: 'big salmon 🐠', value: 100, baseChance: 10 },
    { text: 'rare trout 🐡', value: 200, baseChance: 8 },
    { text: 'crab 🦀', value: 120, baseChance: 6 },

    // Rare items (value 200-500)
    { text: 'mysterious sea shell 🐚', value: 150, baseChance: 5 },
    { text: 'shiny pearl 🦪', value: 250, baseChance: 3 },
    { text: 'lost pirate coin 🪙', value: 400, baseChance: 2 },
    { text: 'ancient treasure chest 💰', value: 300, baseChance: 2 },
    { text: 'glowing jellyfish 🌟', value: 275, baseChance: 1.5 },
    { text: 'beautiful starfish 🌟', value: 350, baseChance: 1.2 },
    { text: 'lobster 🦞', value: 175, baseChance: 1.3 },
    { text: 'magical fish 🐠✨', value: 500, baseChance: 1.2 },

    // Epic items (value 500-1000)
    { text: 'golden trident 🔱', value: 750, baseChance: 1 },
    { text: 'Kraken\'s eyeball 👁️', value: 800, baseChance: 0.9 },

    // Legendary items (value 1000+)
    { text: 'mythical mermaid scale 🧜‍♀️', value: 1000, baseChance: 0.4 },
    { text: 'Poseidon\'s lost crown 👑', value: 1200, baseChance: 0.6 }
];

const getRarityLabel = (value) => {
    if (value >= 1000) return 'Legendary 💫';
    if (value >= 500) return 'Epic ✨';
    if (value >= 200) return 'Rare ⭐';
    if (value >= 100) return 'Uncommon 🔼';
    if (value >= 10) return 'Common 🔽';
    return 'Junk 🗑️';
};

const getRarityColor = (value) => {
    if (value >= 1000) return '#ff00ff'; // Legendary - Violet
    if (value >= 500) return '#9b59b6';   // Epic - Purple
    if (value >= 200) return '#3498db';   // Rare - Blue
    if (value >= 100) return '#2ecc71';   // Uncommon - Green
    if (value >= 10) return '#f1c40f';   // Common - Yellow
    return '#95a5a6';                    // Junk - Gray
};

function getCooldownTime(userData) {
    const now = Date.now();
    if (userData.buffs?.energyDrinkExpires && userData.buffs.energyDrinkExpires > now) {
        // No cooldown if buff active
        return 0;
    }
    return BASE_COOLDOWN;
}

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
            console.log(`  On cooldown, time left: ${timeLeft}s`);
            return interaction.reply({
                content: `🕒 You're tired from fishing! Try again in **${timeLeft}** seconds.`,
                ephemeral: true
            });
        }
        console.log('  Allowed to fish now!');

        if (!userData.equipment?.bait || userData.equipment.bait.count <= 0) {
            return interaction.reply("❌ You need bait to fish! Buy some from the shop.");
        }

        userData.equipment.bait.count--;
        if (userData.equipment.bait.count === 0) {
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
                if (item.value >= 200) {
                    chance *= 1.7;  // big boost for rare+
                } else if (item.value >= 100) {
                    chance *= 1.3;  // moderate boost for uncommon
                } else if (item.value < 10) {
                    chance *= 0.5;  // reduce junk chance by half
                } else {
                    chance *= 1.0;  // reduction for common
                }
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

        userData.inventory = userData.inventory || [];
        userData.inventory.push({
            name: catchResult.text,
            value: catchResult.value,
            rarity: getRarityLabel(catchResult.value)
        });

        userData.balance = (userData.balance || 0) + catchResult.value;

        saveUser(userId, userData);

        const actualCatchChance = (catchResult.adjustedChance / totalChance) * 100;

        const rarityLabel = getRarityLabel(catchResult.value);
        const rarityColor = getRarityColor(catchResult.value);

        let valueDescription = `**$${catchResult.value.toLocaleString()}**`;
        if (catchResult.value === 0) {
            valueDescription = "nothing (junk item)";
        }

        const embed = new EmbedBuilder()
            .setTitle(`🎣 You caught ${catchResult.text}!`)
            .setDescription(`You earned ${valueDescription}`)
            .addFields(
                { name: 'Rarity', value: rarityLabel, inline: true },
                { name: 'Catch Chance', value: `${actualCatchChance.toFixed(2)}%`, inline: true },
                { name: 'Bait Left', value: `${userData.equipment.bait.count}x ${userData.equipment.bait.type}`, inline: true }
            )
            .setColor(rarityColor)
            .setFooter({ text: 'Higher value = rarer catch!' });

        return interaction.reply({ embeds: [embed] });
    }
};
