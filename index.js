const Discord = require('discord.js');
const client = new Discord.Client({ 
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_MEMBERS,
        Discord.Intents.FLAGS.GUILD_PRESENCES,
        Discord.Intents.FLAGS.DIRECT_MESSAGES,
        Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
        Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ]
});

const { prefix, ownerID } = require('./config.json');
const fetch = require('node-fetch');

let welcomeChannelId = null;

client.once('ready', () => {
    console.log('${client.user.tag} est maintenant en ligne!');
});

client.on('guildCreate', async guild => {
    const owner = await client.users.fetch(guild.ownerId);
    try {
        const invite = await guild.channels.cache.first().createInvite({ maxAge: 0 });
        owner.send(`Le bot ${client.user.tag} a rejoint le serveur "${guild.name}".\nPropriétaire : ${owner.tag}\nNombre de membres : ${guild.memberCount}\nInvitation du serveur : ${invite}`);
    } catch (error) {
        console.error('Erreur lors de la création de l\'invitation:', error);
    }
});

client.on('guildDelete', guild => {
    const owner = client.users.cache.get(guild.ownerId);
    owner.send(`Le bot ${client.user.tag} a quitté le serveur ${guild.name}.`);
});

client.on('messageCreate', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'create') {
        // Vérifie que l'utilisateur a envoyé un emoji
        if (!args.length || !args[0].match(/<:[a-zA-Z0-9]+:[0-9]+>/)) {
            return message.channel.send("Merci de spécifier un emoji valide.");
        }

        const emojiName = args[0].split(':')[1];
        const emojiId = args[0].split(':')[2].slice(0, -1);
        
        // Crée l'emoji dans le serveur
        message.guild.emojis.create(`https://cdn.discordapp.com/emojis/${emojiId}.png`, emojiName)
            .then(emoji => message.channel.send(`Emoji ${emoji} créé avec succès!`))
            .catch(error => {
                console.error('Erreur lors de la création de l\'emoji:', error);
                message.channel.send("Une erreur s'est produite lors de la création de l'emoji.");
            });
    } else if (command === 'ban') {
        // Vérifie que l'utilisateur a la permission de bannir des membres
        if (!message.member.hasPermission('BAN_MEMBERS')) {
            return message.channel.send("Vous n'avez pas la permission de bannir des membres.");
        }

        const user = message.mentions.users.first();
        if (user) {
            const member = message.guild.member(user);
            if (member) {
                member.ban({ reason: 'Raison optionnelle' })
                    .then(() => {
                        message.reply(`${user.tag} a été banni avec succès.`);
                    })
                    .catch(error => {
                        console.error('Erreur lors du bannissement:', error);
                        message.channel.send("Une erreur s'est produite lors du bannissement de l'utilisateur.");
                    });
            } else {
                message.channel.send("Cet utilisateur n'est pas sur le serveur.");
            }
        } else {
            message.channel.send("Merci de mentionner l'utilisateur à bannir.");
        }
    } else if (command === 'kick') {
        // Vérifie que l'utilisateur a la permission de kicker des membres
        if (!message.member.hasPermission('KICK_MEMBERS')) {
            return message.channel.send("Vous n'avez pas la permission de kicker des membres.");
        }

        // Vérifie si l'utilisateur mentionne un membre à kicker
        const user = message.mentions.users.first();
        if (!user) {
            return message.channel.send("Merci de mentionner l'utilisateur à kick.");
        }

        const member = message.guild.member(user);
        if (!member) {
            return message.channel.send("Cet utilisateur n'est pas sur le serveur.");
        }

        // Kicke le membre
        member.kick('Raison optionnelle').then(() => {
            message.reply(`${user.tag} a été kické avec succès.`);
        }).catch(err => {
            console.error('Erreur lors du kick:', err);
            message.channel.send("Une erreur s'est produite lors du kick de l'utilisateur.");
        });
    } else if (command === 'setbienvenue') {
        // Vérifie que l'utilisateur a la permission de gérer le serveur
        if (!message.member.hasPermission('MANAGE_GUILD')) {
            return message.channel.send("Vous n'avez pas la permission de gérer le serveur.");
        }

        // Vérifie si le salon a été mentionné
        const channel = message.mentions.channels.first();
        if (!channel) {
            return message.channel.send("Merci de mentionner un salon valide.");
        }

        // Met à jour l'ID du salon de bienvenue
        welcomeChannelId = channel.id;
        message.channel.send(`Le salon de bienvenue a été défini sur ${channel}.`);

    } else if (command === 'disbienvenue') {
        // Vérifie que l'utilisateur a la permission de gérer le serveur
        if (!message.member.hasPermission('MANAGE_GUILD')) {
            return message.channel.send("Vous n'avez pas la permission de gérer le serveur.");
        }

        // Désactive la fonction de bienvenue
        welcomeChannelId = null;
        message.channel.send("La fonction de bienvenue a été désactivée.");
    } else if (command === 'cat') {
        try {
            const response = await fetch('https://api.thecatapi.com/v1/images/search');
            const data = await response.json();
            const imageUrl = data[0].url;
            const embed = new Discord.MessageEmbed()
                .setTitle('Random Cat')
                .setImage(imageUrl)
                .setColor('#0099ff');
            message.channel.send(embed);
        } catch (error) {
            console.error('Error fetching cat image:', error);
            message.channel.send("An error occurred while fetching the cat image.");
        }
    } else if (command === 'dog') {
        try {
            const response = await fetch('https://dog.ceo/api/breeds/image/random');
            const data = await response.json();
            const imageUrl = data.message;
            const embed = new Discord.MessageEmbed()
                .setTitle('Random Dog')
                .setImage(imageUrl)
                .setColor('#0099ff');
            message.channel.send(embed);
        } catch (error) {
            console.error('Error fetching dog image:', error);
            message.channel.send("An error occurred while fetching the dog image.");
        }
    } else if (command === 'help') {
        const embed1 = new Discord.MessageEmbed()
            .setTitle('modération')
            .setDescription(`Commandes de modération`)
            .addField(`${prefix}ban <@utilisateur>`, 'Bannit l\'utilisateur mentionné.')
            .addField(`${prefix}mute <@utilisateur> <durée>`, 'Mute l\'utilisateur pour une durée spécifiée.')
            .addField(`${prefix}kick <@utilisateur>`, 'Kick l\'utilisateur mentionné.')
            .setColor('#00FF00');
        
        const embed2 = new Discord.MessageEmbed()
            .setTitle('gestion')
            .setDescription(`Autres commandes`)
            .addField(`${prefix}create <nom> <emoji>`, 'créer L emojie choisi dans le message')
            .addField(`${prefix}setbienvenue <le salon>`, 'active le message de bienvenue quand quelqun rejoin le serveur')
            .addField(`${prefix}disbienvenue `, 'desactive le message de bienvenue quand quelqun rejoin le serveur')
            .addField(`${prefix}giveaway <prix> <nombre gagnant> <temp> `, 'lance un giveaway')
            .setColor('#00FF00');

        const embed3 = new Discord.MessageEmbed()
            .setTitle('Fun')
            .setDescription(`Fun commands`)
            .addField(`${prefix}cat`, 'Affiche une image aléatoire de chat.')
            .addField(`${prefix}dog`, 'Affiche une image aléatoire de chien.')
            .addField(`${prefix}kissorkill`, 'pour le salon kiss or kill')
            .setColor('#0099ff');

       const embed4 = new Discord.MessageEmbed()
            .setTitle('owner👑')
            .setDescription(`seulement lowner peut faire les commandes`)
            .addField(`${prefix}setstatus <status>`, 'change le status du bot par le mot choisi.')
            .addField(`${prefix}serverlist`, 'Affiche les serveurs que le bot est dedans.')
            .setColor('#0099ff');

        message.channel.send(embed1).then(embedMessage => {
            embedMessage.react('➡️');

            const filter = (reaction, user) => {
                return ['➡️'].includes(reaction.emoji.name) && user.id === message.author.id;
            };
            
            const collector = embedMessage.createReactionCollector(filter, { time: 60000 });

            collector.on('collect', (reaction, user) => {
                switch (reaction.emoji.name) {
                    case '➡️':
                        embedMessage.edit(embed2);
                        break;
                }
            });
        });
        message.channel.send(embed3);        
    } else if (command === 'unban') {
        // Vérifie que l'utilisateur a la permission de débannir des membres
        if (!message.member.hasPermission('BAN_MEMBERS')) {
            return message.channel.send("Vous n'avez pas la permission de débannir des membres.");
        }

        // Vérifie que l'argument est un ID d'utilisateur valide
        const userId = args[0];
        if (!userId) {
            return message.channel.send("Merci de spécifier l'ID de l'utilisateur à débannir.");
        }

        // Débannit l'utilisateur
        message.guild.fetchBans()
            .then(bans => {
                if (bans.size === 0) {
                    return message.channel.send("Aucun utilisateur n'est banni sur ce serveur.");
                }

                const bannedUser = bans.find(ban => ban.user.id === userId);
                if (!bannedUser) {
                    return message.channel.send("Cet utilisateur n'est pas banni sur ce serveur.");
                }

                message.guild.members.unban(bannedUser.user)
                    .then(() => {
                        message.channel.send(`L'utilisateur avec l'ID ${userId} a été débanni avec succès.`);
                    })
                    .catch(error => {
                        console.error('Erreur lors du débannissement:', error);
                        message.channel.send("Une erreur s'est produite lors du débannissement de l'utilisateur.");
                    });
            })
            .catch(error => {
                console.error('Erreur lors de la récupération des bannissements:', error);
                message.channel.send("Une erreur s'est produite lors de la récupération des bannissements.");
            });
    } else if (command === 'kissorkill') {
        if (!message.member.hasPermission('MANAGE_GUILD')) {
            return message.channel.send("Vous n'avez pas la permission de gérer le serveur.");
        }

        // Récupérer une image d'anime aléatoire depuis l'API
        fetch('https://api.waifu.pics/sfw/kiss')
            .then(response => response.json())
            .then(data => {
                const animeImageUrl = data.url;

                // Envoyer l'image dans le salon
                const embed = new Discord.MessageEmbed()
                    .setTitle('Kiss or Kill ?')
                    .setImage(animeImageUrl)
                    .setColor('#0099ff')
                    .setDescription('Réagissez avec 🔪 pour "Kill" ou 💋 pour "Kiss".');

                message.channel.send(embed)
                    .then(sentMessage => {
                        sentMessage.react('🔪')
                            .then(() => sentMessage.react('💋'))
                            .catch(err => console.error('Error reacting:', err));
                    })
                    .catch(err => console.error('Error sending message:', err));
            })
            .catch(error => {
                console.error('Error fetching anime image:', error);
                message.channel.send("Une erreur s'est produite lors de la récupération de l'image d'anime.");
            });
    } else if (command === 'giveaway') {
        if (args.length !== 3) {
            return message.channel.send("Syntaxe incorrecte. Utilisation : `giveaway <prix> <nombre gagnant> <temp>`");
        }

        const prize = args[0];
        const winnersCount = parseInt(args[1]);
        const duration = parseDuration(args[2]);

        if (!winnersCount || winnersCount <= 0) {
            return message.channel.send("Le nombre de gagnants doit être un nombre positif supérieur à zéro.");
        }

        if (!duration || duration <= 0) {
            return message.channel.send("La durée doit être spécifiée en minutes et être un nombre positif supérieur à zéro.");
        }

        const endTime = Date.now() + duration * 60 * 1000;

        const embed = new Discord.MessageEmbed()
            .setTitle(`🎉 Giveaway: ${prize} 🎉`)
            .setDescription(`Réagissez avec ⭐️ pour participer !\nNombre de gagnants : ${winnersCount}\nDurée : ${duration} minutes`)
            .setColor('#FFD700')
            .setFooter(`Temps restant : ${formatTime(duration * 60)}`);

        const sentMessage = await message.channel.send(embed);
        sentMessage.react('⭐️');

        const filter = (reaction, user) => reaction.emoji.name === '⭐️' && !user.bot;
        const collector = sentMessage.createReactionCollector(filter, { time: duration * 60 * 1000 });

        collector.on('end', async collected => {
            const participants = collected.get('⭐️').users.cache.filter(user => !user.bot).map(user => user.id);
            if (participants.length > 0) {
                const winners = [];
                for (let i = 0; i < winnersCount; i++) {
                    const winnerIndex = Math.floor(Math.random() * participants.length);
                    winners.push(client.users.cache.get(participants[winnerIndex]).toString());
                    participants.splice(winnerIndex, 1);
                }
                message.channel.send(`🎉 Les gagnants du giveaway ${prize} sont : ${winners.join(', ')} ! 🎉`);
            } else {
                message.channel.send(`❌ Aucun participant n'a réagi au giveaway "${prize}". ❌`);
            }
        });
    } else if (command === 'setstatus') {
        if (message.author.id !== ownerID) {
            return message.channel.send("Seul le propriétaire du bot peut changer son statut.");
        }

        const status = args.join(' ');
        client.user.setPresence({ activity: { name: status }, status: 'online' });
        message.channel.send(`Le statut du bot a été mis à jour : "${status}"`);
    } else if (command === 'serverlist') {
        if (message.author.id !== ownerID) {
            return message.channel.send("Seul le propriétaire du bot peut voir la liste des serveurs.");
        }

        const serverList = client.guilds.cache.map(guild => `${guild.name} - ${guild.memberCount} membres`);
        message.channel.send(`Liste des serveurs :\n${serverList.join('\n')}`);
    }
});

client.on('guildMemberAdd', member => {
    if (welcomeChannelId) {
        const channel = member.guild.channels.cache.get(welcomeChannelId);
        if (channel) {
            const memberCount = member.guild.memberCount;
            const welcomeMessage = `Bienvenue à ${member}, nous sommes maintenant ${memberCount} dans le serveur !`;
            channel.send(welcomeMessage);
        }
    }
});

client.login(process.env.TOKEN);

function parseDuration(durationString) {
    const regex = /(\d+)\s*(m|min|minute|minutes)/i;
    const matches = durationString.match(regex);
    if (!matches) return null;
    return parseInt(matches[1]);
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m ` : ''}${remainingSeconds}s`;
}
