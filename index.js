const Discord = require('discord.js');
const { execSync, exec } = require('child_process');

const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES] });
const token = 'ODkyODMzMzE5MzA4MzgyMzE4.YVSp0w.58SDtd_zXtKy_CppDJqH0QCyBWc';

client.on('ready', () => {
 console.log(`Logged in as ${client.user.tag}!`);
 });

const prefix = '!';
client.on('messageCreate', msg => {
 if (msg.content[0] !== prefix ) {
    // console.log('no prefix');
    return;
 }
 if (!msg.channelId === '810820585490874380' || !msg.channelId === '892835196079046708' || msg.member.user.id === '892833319308382318') {
    // dont listen to other channels
    return;
 }

 const args = msg.content.slice(prefix.length).trim().split(' ');
 const command = args.shift().toLowerCase();

 if(command === 'help') {
    msg.reply(
       "!officialbuild - prints the build number from valheim official repo, stable branch\n" + 
       "!localbuild - prints the build currently installed\n" + 
       "!builds - prints both official and local builds\n" +
       "!info - prints general info about the server\n" + 
       "!status - prints the status of the server (if its up or down)\n" + 
       "!upgrade - upgrades the server if there is an update (special privilege needed)"
       )
 }
 if(command === 'officialbuild') {
    const buildnoOrError = printValheimOfficialBuild();
    msg.reply(buildnoOrError);
 }
 if(command === 'localbuild') {
    const buildnoOrError = printValheimLocalBuild();
    msg.reply(buildnoOrError);
 }
 if(command === 'builds') {
    msg.reply(printBuildNumbers())
 }
 if(command === 'info') {
    const officialBuild = printValheimOfficialBuild()
    const localBuild = printValheimLocalBuild()
    const worldName = execSync('cat /home/steam/worlds.txt')
    const worldNameStr = worldName.toString("utf-8", 0, worldName.length).trim().split(' ').shift();
    const serverName = execSync('perl -n -e \'/\-name "?([^"]+)"? \-port/ && print "$1\n"\' /home/steam/valheimserver/HomeyAndBuilds/start_valheim_HomeyAndBuilds.sh')
    const serverNameStr = serverName.toString("utf-8", 0, serverName.length).trim().split(' ').shift();
    const externalIP = execSync('curl -s ipecho.net/plain;echo')
    const externalIPStr = externalIP.toString("utf-8", 0, externalIP.length).trim().split(' ').shift();
    const port = execSync('perl -n -e \'/\-port "?([^"]+)"? \-nographics/ && print "$1\n"\' /home/steam/valheimserver/HomeyAndBuilds/start_valheim_HomeyAndBuilds.sh')
    const portStr = port.toString("utf-8", 0, port.length).trim().split(' ').shift()
    const displayPublic = execSync('perl -n -e \'/\-public "([0-1])"? \-savedir/ && print "$1\n"\' /home/steam/valheimserver/HomeyAndBuilds/start_valheim_HomeyAndBuilds.sh')
    const displayPublicStr = displayPublic.toString("utf-8", 0, displayPublic.length).trim().split(' ').shift();
    const isPublic = displayPublicStr === '1' ? 'On' : 'Off'
    const status = getValheimServerStatus()
    const substate = getValheimServerSubstate()
    let statusStr = status.charAt(0).toUpperCase() + status.substring(1, status.length) + ' and ' + substate.charAt(0).toUpperCase() + substate.substring(1, substate.length)
    
    const infoEmbed = new Discord.MessageEmbed()
      .setTitle('Server Info')
      .addFields(
         { name: 'Valheim Official Build', value: officialBuild, inline: true },
         { name: 'Local Valheim Install', value: localBuild, inline: true },
      )
      .addFields(
         { name: 'Worldname', value: worldNameStr },
         { name: 'Server name', value: serverNameStr },
         { name: 'Server URL', value: 'valheim.grabbar.se:2457' },
         { name: 'External IP', value: externalIPStr },
         { name: 'Server Port', value: portStr },
         { name: 'Public Listing', value: isPublic },
         { name: 'Server Status', value: statusStr },
      )

   msg.channel.send({ embeds: [infoEmbed] })
 }
 if(command === 'status') {
     const status = getValheimServerStatus()
     const substate = getValheimServerSubstate()
     let statusStr = status.charAt(0).toUpperCase() + status.substring(1, status.length) + ' and ' + substate.charAt(0).toUpperCase() + substate.substring(1, substate.length)
     let statusText = new Discord.MessageEmbed()
     if(status === "active" && substate === "running") {
         statusText = new Discord.MessageEmbed().setDescription(statusStr).setColor('GREEN')
     } else {
        statusText = new Discord.MessageEmbed().setDescription(statusStr).setColor('RED')
     }
     msg.channel.send({ embeds: [statusText] })
 }
 if(command === 'upgrade') {
    if(msg.member.user.id === '126751120054943744') {
      const officialBuild = printValheimOfficialBuild();
      const localBuild = printValheimLocalBuild();
      if(officialBuild === localBuild) {
         msg.reply("Officalbuild: " + officialBuild + "LocalBuild: " + localBuild + "No new updates found")
      } else {
         msg.reply("Update found, Using Thor's Hammer to apply Official Updates!")
         execSync('steamcmd +login anonymous +force_install_dir /home/steam/valheimserver/HomeyAndBuilds +app_update 896660 validate +exit')
         execSync('chown -R steam:steam /home/steam/valheimserver/HomeyAndBuilds')
         msg.reply('Update added, kicking process to Odin for restarting!')
         execSync('systemctl restart valheimserver_HomeyAndBuilds.service')
      }
    } else {
       msg.reply("You do not have permission to do this command.")
    }
 }
});

function getValheimServerStatus() {
   const status = execSync('systemctl is-active valheimserver_HomeyAndBuilds.service')
   const statusStr = status.toString("utf-8", 0, status.length).trim().split(' ').shift().toLowerCase();
   return statusStr;
}

function getValheimServerSubstate() {
   const substate = execSync('systemctl show -p SubState valheimserver_HomeyAndBuilds.service | cut -d\'=\' -f2')
   const stateStr = substate.toString("utf-8", 0, substate.length).trim().split(' ').shift().toLowerCase();
   return stateStr;
}

function printValheimOfficialBuild() {
    const officialBuild = execSync('cat /home/steam/valheimserver/HomeyAndBuilds/officialvalheimbuild')
    return officialBuild.toString("utf-8", 0, officialBuild.length)
}

function printValheimLocalBuild() {
    const localBuild = execSync('grep buildid /home/steam/valheimserver/HomeyAndBuilds/steamapps/appmanifest_896660.acf | cut -d\'"\' -f4')
    return localBuild.toString("utf-8", 0, localBuild.length)
}

function printBuildNumbers() {
   const officialBuild = printValheimOfficialBuild()
   const localBuild = printValheimLocalBuild();
   return 'OfficialBuild: ' + officialBuild + 'LocalBuild: ' + localBuild;
}

client.login(token);