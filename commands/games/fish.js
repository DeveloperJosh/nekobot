const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, saveUser } = require('../../structure/userData');

const COOLDOWN_KEY = 'fish';
const BASE_COOLDOWN = 30000; // 30 seconds base cooldown

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
    { text: 'magical fish 🐠✨', value: 500, baseChance: 1 },
    
    // Epic items (value 500-1000)
    { text: 'golden trident 🔱', value: 750, baseChance: 0.5 },
    { text: 'Kraken\'s eyeball 👁️', value: 1000, baseChance: 0.2 },
    
    // Legendary items (value 1000+)
    { text: 'mythical mermaid scale 🧜‍♀️', value: 800, baseChance: 0.1 },
    { text: 'Poseidon\'s lost crown 👑', value: 1200, baseChance: 0.05 }
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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fish')
        .setDescription('Go fishing for some coin'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const userData = getUser(userId);
        const now = Date.now();

        const lastFish = userData.cooldowns?.[COOLDOWN_KEY] || 0;
        let cooldownTime = BASE_COOLDOWN;

        // Energy drink buff reduces cooldown by 30%
        if (userData.buffs?.energyDrinkExpires > now) {
            cooldownTime *= 0.7;
        }

        if (now < lastFish + cooldownTime) {
            const timeLeft = Math.ceil((lastFish + cooldownTime - now) / 1000);
            return interaction.reply({
                content: `🕒 You're tired from fishing! Try again in **${timeLeft}** seconds.`,
                ephemeral: true
            });
        }

        if (!userData.equipment?.bait || userData.equipment.bait.count <= 0) {
            return interaction.reply("❌ You need bait to fish! Buy some from the shop.");
        }

        userData.equipment.bait.count--;
        if (userData.equipment.bait.count === 0) {
            userData.equipment.bait.type = 'None';
        }

        userData.cooldowns = userData.cooldowns || {};
        userData.cooldowns[COOLDOWN_KEY] = now;

        const rodLevel = userData.equipment?.rod?.level || 1;
        const luckBoostActive = userData.buffs?.luckBoostExpires > now;

        const adjustedOutcomes = BASE_OUTCOMES.map(item => {
            let chance = item.baseChance;

            if (rodLevel >= 2 && item.value > 100) {
                chance *= (rodLevel === 2) ? 1.2 : 1.4;
            }

            if (luckBoostActive && item.value > 100) {
                chance *= 1.5;
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