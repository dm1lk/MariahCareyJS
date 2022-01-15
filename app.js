require(`dotenv`).config();
const {createAudioResource, createAudioPlayer, joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus} = require(`@discordjs/voice`);
const {Client, Intents} = require(`discord.js`);
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES],
});
const songPath = `./song.ogg`;
client.once(`ready`, async () => {
  // Uncomment Code to Deploy.
/*   const {
    SlashCommandBuilder,
    ContextMenuCommandBuilder,
  } = require(`@discordjs/builders`);
  const {REST} = require('@discordjs/rest');
  const {Routes} = require('discord-api-types/v9');
  const rest = new REST({version: '9'}).setToken(process.env.token);
  await rest.put(
      Routes.applicationCommands(
          client.user.id,
      ),
      {body: [
        new SlashCommandBuilder().setName(`play`).setDescription(`Start the festive tunes 🎶`).addBooleanOption((option) => option.setName(`loop`).setDescription(`Would you like to loop the song?`)).addUserOption((option) => option.setName(`member`).setDescription(`Who's VC would you like me to join?`)),
        new SlashCommandBuilder().setName(`stop`).setDescription(`Stop the festive tunes 🥲`),
        new ContextMenuCommandBuilder().setName(`join`).setType(2),
      ]},
  ).then( console.log(`[PROCESS] Registered (/) commands globally.`)); */
  client.user.setActivity('Mariah Carey - All I Want for Christmas Is You', {type: 'LISTENING'});
  console.log(`[PROCESS] Mariah Carey is ready.`);
});

client.on(`interactionCreate`, async (interaction) => {
  if (!interaction.guild) return interaction.reply({embeds: [{description: `🛑 Unforunately, I cannot execute commands outside of a guild.`, color: `ff0000 `}]});
  const user = interaction.options.getUser(`member`);
  let member;
  if (!user) member = await interaction.guild.members.fetch(interaction.user.id);
  else member = await interaction.guild.members.fetch(user.id);
  const loop = interaction.options.getBoolean(`loop`) || false;
  if (interaction.commandName == `play`) {
    if (member.voice.channel == null) {
      if (user) {
        return interaction.reply({embeds: [{description: `🛑 This member is not currently in a voice channel!`, color: `ff0000 `}], ephemeral: true});
      }
      return interaction.reply({embeds: [{description: `🛑 Please join a voice channel first!`, color: `ff0000 `}], ephemeral: true});
    }
    try {
      console.log(`[GUILD/${interaction.guild.id}] Connecting to VC "${member.voice.channel.name}"...`);
      connection = await joinVoiceChannel({
        channelId: member.voice.channel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });
      console.log(`[GUILD/${interaction.guild.id}] Connected to VC "${member.voice.channel.name}"!`);
      connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
        console.log(`[GUILD/${interaction.guild.id}] Lost connection to VC "${member.voice.channel.name}", attempting to reconnect...`);
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
        } catch (error) {
          console.log(`[GUILD/${interaction.guild.id}] Cannot resume connection to VC "${member.voice.channel.name}", stopping player!`);
          console.log(`[GUILD/${interaction.guild.id}] Stopped playing (connection lost) in VC "${member.voice.channel.name}"!`);
          connection.destroy();
        }
      });
      const audioPlayer = createAudioPlayer();
      connection.subscribe(audioPlayer) && audioPlayer.play(createAudioResource(songPath));
      interaction.reply({embeds: [{description: `✅ Started Playing in ${member.voice.channel.name}!`, color: `00FF00 `}], ephemeral: true});
      console.log(`[GUILD/${interaction.guild.id}] Started playing in VC "${member.voice.channel.name}!"`);
      if (loop) {
        audioPlayer.on('stateChange', (oldState, newState) => {
          if (newState.status == `idle`) {
            audioPlayer.play(createAudioResource(songPath));
          }
        });
        connection.on(VoiceConnectionStatus.Disconnected, async () => {
          try {
            connection = await joinVoiceChannel({
              channelId: member.voice.channel.id,
              guildId: interaction.guild.id,
              adapterCreator: interaction.guild.voiceAdapterCreator,
            });
            connection.subscribe(audioPlayer);
          } catch (error) {
            console.log(`[PROCESS] ${error}`);
          }
        });
      }
    } catch (error) {
      interaction.reply({embeds: [{description: `🛑 An internal error occured! [${error}]`, color: `ff0000 `}], ephemeral: true});
    };
  } else if (interaction.commandName == `stop`) {
    if (member.voice.channel == null) return interaction.reply({embeds: [{description: `🛑 You aren't in a voice channel!`, color: `ff0000 `}], ephemeral: true});
    const connection = await getVoiceConnection(interaction.guild.id);
    if (connection) {
      if (member.voice.channel.id == connection.joinConfig.channelId) {
        connection.destroy();
        interaction.reply({embeds: [{description: `✅ Stopped Playing in ${member.voice.channel.name}!`, color: `00FF00 `}], ephemeral: true});
        console.log(`[GUILD/${interaction.guild.id}] Stopped playing (requested) in VC "${member.voice.channel.name}"!`);
      } else {
        interaction.reply({embeds: [{description: `🛑 I'm not connected to your voice channel!`, color: `ff0000 `}], ephemeral: true});
      };
    } else {
      interaction.reply({embeds: [{description: `🛑 I'm not connected to a voice channel in this guild!`, color: `ff0000 `}], ephemeral: true});
    };
  };
});

client.login(process.env.token);
