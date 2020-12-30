function main(){
//loads in Discord.js library
const Discord = require("discord.js");
const request = require("request");
var rp = require('request-promise');
const emojiUnicode = require('emoji-unicode');
var svgToPng = require('svg-to-png');
var path = require('path');
const emojiMap = require('./components/emojilib.json');
//my own packege
var mapToArray = require("./components/mapToArray.js");
//helper function outsourcing
var recordFile = require("./components/recordFile.js");
var timeToString = require("./components/timeToString.js");
//this is the client, aka the actual bot
const clientOps = require('./components/clientOps.json');
const client = new Discord.Client(clientOps);
var fs = require('fs-extra');

//----------------------------------------------------------//
//	   Spook Bot v1.8.6  ~~ by ~~  wakfi#6999  u/wakfi		//
//		source code at https://github.com/wakfi/spook		//
//			Open Source Under MIT License (2019)			//
//----------------------------------------------------------//

var d = new Date();
//adds timestamps to log outputs
function fixLogs() 
{
	let origLogFunc = console.log;
	let origErrFunc = console.error;
	console.log = input =>
	{
		d = new Date();
		let ms = d.getMilliseconds();
		if(typeof input === 'string')
		{
			let inArr = input.split(`\n`);
			inArr.map(tex => {origLogFunc(`${d.toLocaleString('en-US',{year:'numeric',month:'numeric',day:'numeric'})} ${d.toLocaleTimeString(undefined,{hour12:false})}:${ms}${ms>99?'  ':ms>9?'   ':'    '}${tex}`)});
		} else {
			origLogFunc(`${d.toLocaleString('en-US',{year:'numeric',month:'numeric',day:'numeric'})} ${d.toLocaleTimeString(undefined,{hour12:false})}:${ms}${ms>99?'  ':ms>9?'   ':'    '}${input}`)
		}
	}
	console.error = input =>
	{
		d = new Date();
		let ms = d.getMilliseconds();
		if(typeof input === 'string')
		{
			let inArr = input.split(`\n`);
			inArr.map(tex => {origErrFunc(`${d.toLocaleString('en-US',{year:'numeric',month:'numeric',day:'numeric'})} ${d.toLocaleTimeString(undefined,{hour12:false})}:${ms}${ms>99?'  ':ms>9?'   ':'    '}${tex}`)});
		} else {
			origErrFunc(`${d.toLocaleString('en-US',{year:'numeric',month:'numeric',day:'numeric'})} ${d.toLocaleTimeString(undefined,{hour12:false})}:${ms}${ms>99?'  ':ms>9?'   ':'    '}${input}`)
		}
	}
}

//this is the file that holds the login info, to keep it seperate from the source code for safety
const config = require("./components/spook_config.json");
const runQuotesPath = "./components/run_quotes.json"
const quoteRunInfo = require(runQuotesPath);

const admins = config.admins;
const quoteTimesAsHours = quoteRunInfo.timesToRunQuotes.timesAsHours;
const runThisHourValuesArray = quoteRunInfo.hasQuotesRunThisHourValues;
const hasQuotesRunThisHourValues = new Map();

let runValueIterator = runThisHourValuesArray[Symbol.iterator]();
quoteTimesAsHours.map(hourTime => hasQuotesRunThisHourValues.set(hourTime,runValueIterator.next().value));

var myGuilds = [];
var myChannels = [];

var currentTime = new Date();
var millisTillTimeForTimeout;
//first thing to execute on successful login
//calcuates the time until 10pm; or if after 10pm, the time til 11pm; or if after 11pm, the time til 12am (midnight); and then sets a timeout for the postFromQuotes function
client.on("ready", async () => {
	//fetch guilds and channels
	 myGuilds.push(await fetchGuild('171829940797440001'));
		 myChannels[0].push(await fetchChannel(client.guilds.array()[myGuilds[0]], '366352588754518017'));
		 myChannels[0].push(await fetchChannel(client.guilds.array()[myGuilds[0]], '569078648607342603'));
	
	fixLogs(); 
	console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
	client.user.setActivity(`Type ${config.prefix}help for help`);
	await calculateTimeUntilNearestTenthMinute();
	setTimeout(setInterval, millisTillTimeForTimeout, checkIfQuoteTime, 600000);
	setTimeout(checkIfQuoteTime, millisTillTimeForTimeout);
});

//[helper function] retrieves up to the last 100 messages from the quotes channel, and then sends one at random to the spooky book
//then calculates time until next desired time and sets timeout for itself again, creating loop via nested timeout
function postFromQuotes()
{
	client.guilds.array()[myGuilds[0]].channels.array()[myChannels[0][1]].fetchMessages({ limit: 100 })
	.then(quotes => {
		let min= 0;
		let max= 99;
		let winner = Math.floor(Math.random() * (+max - +min)) + +min;
		client.guilds.array()[myGuilds[0]].channels.array()[myChannels[0][0]].send(quotes.array()[winner].content);
	}).catch(console.error);
}

//[helper function] sends a specific user (in this case myself) a desired message. Allows simpler debugging
function sendMe(content) {
	client.fetchUser("193160566334947340")
	.then(wakfi => {
		wakfi.send(content).catch(console.error);
	}).catch(console.error);
}

//[helper function] returns the index of a guild (passed by name) in the client.guilds.array()
function fetchGuild(id)
{
	return new Promise((resolve,reject) => {
		for(let arr = client.guilds.array(), i = 0; i < arr.length; i++)
		{
			if(arr[i].id === id)
			{
				myChannels.push([]);
				resolve(i);
			}
		}
		throw `Error: Not a member of guild ${name}`;
	});
}

//[helper function] returns the index of a channel (passed by name) in the guild.channels.array() of a passed in guild object
function fetchChannel(guild,id)
{
	return new Promise((resolve,reject) => {
		for(let arr = guild.channels.array(), i = 0; i < arr.length; i++)
		{
			if(arr[i].id === id)
			{
				resolve(i);
			}
		}
		throw `Error: Channel ${name} not found in ${guild}`;
	});
}

//[helper function] calculates timeout before interval for safe timer
function calculateTimeUntilNearestTenthMinute()
{
	const minuteRoundingFactor = 10;
	return new Promise((resolve,reject) =>
	{
		const secondsToDecimalDivisor = 60;
		const millisecondsToDecimalDivisor = 60000;
		currentTime = new Date();
		const nearestTenthMinute = minuteRoundingFactor*Math.ceil((currentTime.getMinutes()+currentTime.getSeconds()/secondsToDecimalDivisor+currentTime.getMilliseconds()/millisecondsToDecimalDivisor)/minuteRoundingFactor)
		const calculatedDateObjectNearestTenthMinute = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), currentTime.getHours(), nearestTenthMinute, 1, 0);
		currentTime = new Date();
		if((currentTime - calculatedDateObjectNearestTenthMinute) < 0) {
			millisTillTimeForTimeout = calculatedDateObjectNearestTenthMinute - currentTime;
			resolve(millisTillTimeForTimeout);
		} else {
			currentTime = new Date();
			calculateTimeUntilNearestTenthMinute()
			.then(resolve)
			.catch(reject);
		}
	});
}

//[helper function] checks if it is one of the quote times
function checkIfQuoteTime()
{
	currentTime = new Date();
	const minimumResetHour = 2;
	let currentHour = currentTime.getHours();
	if(quoteTimesAsHours.includes(currentHour) && !hasQuotesRunThisHourValues.get(currentHour))
	{
		postFromQuotes();
		hasQuotesRunThisHourValues.set(currentHour,true);
	} else if(currentHour == minimumResetHour) {
		quoteTimesAsHours.map(aTimeAsHour => hasQuotesRunThisHourValues.set(aTimeAsHour,false));
	}
	recordFile({'timesToRunQuotes':quoteRunInfo.timesToRunQuotes,'hasQuotesRunThisHourValues':mapToArray(hasQuotesRunThisHourValues)},runQuotesPath)();
}

// This event triggers when the bot joins a guild.
client.on("guildCreate", guild => {
	console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
	client.user.setActivity(`Type ${config.prefix}help for help`);
});

// this event triggers when the bot is removed from a guild.
client.on("guildDelete", guild => {
	console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
	client.user.setActivity(`Type ${config.prefix}help for help`);
});

//runs when a new user joins the server
client.on("guildMemberAdd", member => {
	member.addRole('176094247219363840', "Welcome to ${member.guild}")
		.catch(console.error);
});

//runs when a user leaves the server
client.on("guildMemberRemove", member => {
	member.guild.channels.array()[myChannels[0][0]].send(`${member} has left ${member.guild}`)
	.catch(err=>{console.error(`Error sending a message:\n\t${typeof err==='string'?err.split('\n').join('\n\t'):err}`)});
});

//this event triggers when a message is sent in a channel the bot has access to
client.on("message", async message => {
	
	const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
	const command = args.shift();
	
	//									So actually i'm kinda mixed on this now, theres not other options, theres not ".hasEmoji()" method. 11/4/19: how about promises and .map?
	//here is where the hugemojis are handled. Honestly, this is a very unclean way of handling this as its just !bot and @client and i'd like to come back to this at some point
	if(message.isMentioned(client.user)) 
	{	
		const discordAssetUri = `https://cdn.discordapp.com/emojis/`;
		const twemojiDomain = `https://github.com/twitter/twemoji/blob/master/assets/svg/`;
		const unicodeDomain = `https://unicode.org/emoji/charts/full-emoji-list.html`;
		let argv = message.content.trim().split(/ +/g);
		for(messageElement of argv)
		{
			if(messageElement.includes(`>`) && messageElement.includes(`:`))
			{
				const splitEmoji = messageElement.split(`:`);
				const fileType = splitEmoji.shift() === `<a` ? `.gif` : `.png`;
				const emojiName = splitEmoji.shift();
				const emojiSnowflake = splitEmoji.shift().split(`>`)[0];
				const emojiImageUrl = `${discordAssetUri}${emojiSnowflake}${fileType}`;
				message.channel.send({files: 
					[{attachment: emojiImageUrl,
					name: `${emojiName}${fileType}`}]
				})
				.catch(err=>{console.error(`Error sending a message:\n\t${typeof err==='string'?err.split('\n').join('\n\t'):err}`)});
			} else if(!messageElement.includes(`>`)) {
				const emojiToVerify = messageElement;
				const emojiInUnicode = emojiUnicode(emojiToVerify).split(' ').join('-');
				const svgDomain = `${twemojiDomain}${emojiInUnicode}.svg`;
				let githubResponseA = null;
				try {
					githubResponseA = await rp(svgDomain);
				} catch(err) {
					try {
						const svgSecondDomain = `${twemojiDomain}${emojiInUnicode.slice(0,emojiInUnicode.lastIndexOf('-'))}.svg`;
						githubResponseA = await rp(svgSecondDomain);
					} catch(moreErr) {
						if(!JSON.stringify(moreErr).includes(`<!DOCTYPE html>`)) 
							console.error(moreErr);
					}
				}
				githubResponseA && rp(githubResponseA.split(`<iframe class="render-viewer " src="`)[1].split('"')[0])
				.then(async githubResponseB =>
				{
					const emojiName = emojiMap[messageElement] ? emojiMap[messageElement][0] : emojiInUnicode;
					const picFolder = `file_dump`;
					const emojiSvg = await rp(githubResponseB.split('data-image  = "')[1].split('"')[0]);
					await fs.outputFile(`./${picFolder}/${emojiInUnicode}.svg`,emojiSvg);
					await svgToPng.convert(path.join(__dirname,picFolder,`${emojiInUnicode}.svg`),path.join(__dirname,picFolder),{defaultWidth:722,defaultHeight:722},{type:"image/png"});
					await message.channel.send({files: 
						[{attachment: `./${picFolder}/${emojiInUnicode}.png`,
						name: `${emojiName}.png`}]
					}).catch(err=>{console.error(`Error sending a message:\n\t${typeof err==='string'?err.split('\n').join('\n\t'):err}`)});
					await fs.remove(`./${picFolder}/${emojiInUnicode}.svg`)
					.catch(err => {
						console.error(err)
					});
					await fs.remove(`./${picFolder}/${emojiInUnicode}.png`)
					.catch(err => {
						console.error(err)
					});
				});
				if(githubResponseA)
				{
					return;
				}
			}
		}
	}
	
	//pre-restriction easter eggs
	if(!message.author.bot && message.content.toLowerCase().includes("kappa")) {
		console.log(`kappa clappa`);
		message.channel.send({files:
			[{attachment: "http://backgroundcheckall.com/wp-content/uploads/2017/12/kappa-no-background-5.png",
			name: "kappa-clappa.png"
			}]
		})
		.catch(err=>{console.error(`Error sending a message:`);console.error(err);});
	}
	
	if(message.author.bot) return;
	
	
	
	if(message.content.indexOf(config.prefix) !== 0) return;
	
	
	console.log("processing " + command + " command");
	
	// commands from users using prefix go below here
	let commandLUT = {
		//Emergency Kill switch, added after channel spam so that i would have a way other than ssh to stop it
		"kill": async function() {
			if(!(message.author.id == 193160566334947340 || message.author.id == 171821076375011338 || message.author.id == 366410782461788160)) {
				return null;
			} else {
				process.exit(1);
			}
		},
		
		// Calculates ping between sending a message and editing it, giving a nice round-trip latency.
		// The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
		"ping": async function() {
			const m = await message.channel.send("Ping?");
			m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
		},
		//sends a quote at random from the quote channel to the spooky book, except on demand instead of timed
		"quote": async function() {
			if(!(admins.includes(message.author.id) || message.author.id == 193160566334947340)) {
				return null;
			} else {
				client.guilds.array()[myGuilds[0]].channels.array()[myChannels[0][1]].fetchMessages({ limit: 100 })
				.then(quotes => {
					let min= 0;
					let max= 99;
					let winner = Math.floor(Math.random() * (+max - +min)) + +min;
					message.channel.send(quotes.array()[winner].content);
				}).catch(console.error);
			}
		},
		
		//gives the bot the appearance of speaking by deleting the command message and stealing the content. Will evevntually streamline for remote control (from terminal or dm)
		"say": async function() {
			const sayMessage = args.join(" ");
			message.delete().catch(O_o=>{console.error(O_o)});
			if(!(admins.includes(message.author.id) || message.author.id == 193160566334947340)) {
				return null;
			} else {
				message.channel.send(sayMessage).catch(err=>{});
			}
		},
		
		//allows user to send message from anywhere to spooky book via spook bot
		"sendto": async function() {
			const sayMessage = args.join(" ");
			message.delete().catch(O_o=>{});
			if(!message.author.id == 193160566334947340) {
				return null;
			} else {
				client.guilds.array()[myGuilds[0]].channels.array()[myChannels[0][0]].send(sayMessage).catch(err=>{});
			}
		},
		
		"command": async function(){commandLUT["help"]()},
		"commands": async function(){commandLUT["help"]()},
		"?": async function(){commandLUT["help"]()},
		"help": async function() {
			let comms = new Discord.RichEmbed()
				.setTitle(`Command Help`)
				.setAuthor(client.user.username, client.user.avatarURL)
				.setDescription(`Please contact @wakfi#6999 with additional questions`)
				.setColor(0xFF00FF)
				.setFooter(`/commands, /command, /?`, `https://cdn.discordapp.com/attachments/641092120593170454/662410304256344065/SniffBot.png`)
				.setTimestamp(new Date())
				.addField(`${config.prefix}updog`,`Provides a random picture of a dog from a database of over 10,000`)
				.addField(`${config.prefix}panda`,`Responds with everyone's favorite panda smash gif`)
				.addField(`${config.prefix}brode`,`The glorious Ben Brode`)
				.addField(`${config.prefix}ping`,`Provides the current client latency`)
				.addField(`${config.prefix}uptime`,`States how long the bot has been online and connected to Discord continuously, since the most recent interuption`)
				.addField(`The quote thing`,`Delivers a randomly chosen quote from #quotes every night at 10, 11, and 12. For the nostalgia`);
			if(admins.includes(message.author.id))
			{
				comms
				.addBlankField()
				.addField(`Special Commands`,`For Admin Privileges.`)
				.addField(`${config.prefix}kill`,`Emergency Shutoff. Should restart on its own`)
				.addField(`${config.prefix}say <message>`,`Make the bot say something so that it looks like it's talking. This won't work right now because the bot needs to be able to delete messages for this, and it doesn't have the permissions for that. Can be changed if you want`)
				.addField(`${config.prefix}quote`,`Trigger the quote thing, except not at the specific times but like whenever you want, still randomly picked`)
				.addField(`${config.prefix}purge <2-99>`,`Will delete the most recent 2-99 messages in the channel that you execute this command in. Good for cleaning up spam`)
				.addField(`${config.prefix}poll <question>`,`Follow the prompts after that. I can provide a general blueprint of the syntax for all of the prompts if wanted`)
			}
			message.author.send(comms);	
		},
		
		//emote commands##
		
		//updog best floofer
		"updog": async function() {
			rp('https://dog.ceo/api/breeds/image/random')
			.then(response => {
				let dogJson = response.split(`"`);
				if(dogJson[7] === `success`)
				{
					message.channel.send({files: 
						[{attachment: dogJson[3].split(/\\/g).join(''),
						name: "floofer.png"
						}]
					})
					.catch(err=>{console.error(`Error sending a message:`);console.error(err);});
				} else {
					console.error(`Recieved ${response.status} from dog.ceo, sent OG updog instead`);
					message.channel.send({files: 
						[{attachment: "https://cdn.discordapp.com/attachments/366352588754518017/641096893442555914/IMG_6658-1500-circle.png",
						name: "floofer.png"
						}]
					})
					.catch(err=>{console.error(`Error sending a message:`);console.error(err);});
				}
			})
			.catch(err=>{
				console.error(`Error getting a floofer`);
				console.error(err);
				message.channel.send({files: 
					[{attachment: "https://cdn.discordapp.com/attachments/366352588754518017/641096893442555914/IMG_6658-1500-circle.png",
					name: "floofer.png"
					}]
				})
				.catch(err=>{console.error(`Error sending a message:`);console.error(err);});
			});
		},
		
		"panda": async function() {
			message.channel.send({files: 
				[{attachment: "https://cdn.discordapp.com/attachments/366352588754518017/641885589838495785/panda.gif",
				name: "panda.gif"
				}]
			})
			.catch(err=>{console.error(`Error sending a message:`);console.error(err);});
		},
		
		"brode": async function() {
			message.channel.send({files: 
				[{attachment: "https://cdn.discordapp.com/attachments/366352588754518017/646246806392668170/300px-Ben_Brode_-_official_Nov_2014.png",
				name: "Ben_Brode.png"
				}]
			})
			.catch(err=>{console.error(`Error sending a message:`);console.error(err);});
		},
		
		//end emote commands##
		
		//utilizes a bulk message deltion feature available to bots, able to do up to 100 messages at once, minimum 3. Adjusted to erase command message as well
		"purge": async function() {
			if(!(admins.includes(message.author.id) || message.author.id == 193160566334947340))
				return message.author.send(`Sorry, you don't have permissions to use this!`);
			// This command removes all messages from all users in the channel, up to 100
			
			// get the delete count, as an actual number.
			const deleteCount = parseInt(args[0], 10) + 1;
			
			// Ooooh nice, combined conditions. <3
			if(!deleteCount || deleteCount < 2 || deleteCount > 100)
				return message.reply(`Please provide a number between 2 and 99 (inclusive) for the number of messages to delete`);
			
			// So we get our messages, and delete them. Simple enough, right?
			const fetched = await message.channel.fetchMessages({count: deleteCount});
			message.channel.bulkDelete(deleteCount)
			.catch(error => message.reply(`Couldn't delete messages because of: ${error}`));
		},
		
		//responds with the current time connected to the discord server in hh:mm:ss format. If hour exceeds 99, will adjust to triple digit, etc
		"uptime": async function() {
			function pad(n, z) {
				z = z || 2;
				return ('00' + n).slice(-z);
			}
			let s = client.uptime;
			let ms = s % 1000;
			s = (s - ms) / 1000;
			let secs = s % 60;
			s = (s - secs) / 60;
			let mins = s % 60;
			let hrs = (s - mins) / 60;
			let p = Math.floor(Math.log10(hrs)) + 1;
			if(Math.log10(hrs) < 2) {
				p = false;
			}
			message.channel.send("I have been running for " + pad(hrs, p) + ':' + pad(mins) + ':' + pad(secs)).catch(err=>{});
		},
		
		//responds with the current time connected to the discord server in hh:mm:ss format. If hour exceeds 99, will adjust to triple digit, etc
		"status": async function() {
			if(!(message.author.id == 193160566334947340 || message.author.id == 171821076375011338)) {
				return null;
			} else {
				client.user.setActivity(args.join(" "));
			}
		},
		
		"poll": async function() {
			let duration = 7200000; //default duration is 2 hours
			let targetChan = myChannels[0][0]; //defualt target channel is the general chat channel
			if(!message.member.hasPermission('MANAGE_ROLES_OR_PERMISSIONS', false, true, true))
				return message.author.send(`Sorry, you don't have permissions to use this!`); //verify permission
			
			if(message.mentions.channels.size > 0) //optional target channel specicification other than sniff-discussion
			{
				targetChan = await fetchChannel(client.guilds.array()[snzone], message.mentions.channels.first().id);
				args.splice(args.indexOf(message.mentions.channels.first().name),1);
			}
			const question = args.join(" "); //create const question. removed at this point are [!] [poll] ... <targetChan>, so all thats left is the question
			message.reply(`How many response options? (${config.prefix}amount #)`); //request amount of options to wait for, using prefix to specialize message
			message.channel.awaitMessages(m => m.content.startsWith(config.prefix) && m.content.replace(`${config.prefix}option`, '') !== '' && m.author === message.author, {maxMatches: 1, time: 90000, errors: ['time'] })
			.then(total => { //this is the message waiter, which is the primary driver of this function. it is only waiting for the author of this poll (but others can be running at the same time for other authors)
				let response = total.array()[0];
				const ammount = response.content.slice(config.prefix.length).trim().split(/ +/g);
				ammount.shift().toLowerCase();
				const responseCount = parseInt(ammount[0], 10); //create a usable number
				//const responseCount = +ammount[0];
				if(!responseCount || responseCount < 2 || responseCount > 8)
					return message.reply(`Number from 2-8 must be provided. Poll request terminated.`); //followed a strict-build design, if the syntax is wrong at any point it terminates, so that it doesn't send
				message.reply(`Specify options in individual messages (${config.prefix}option <option>)`); //would like to rewrite with savable promises eventually, so that polls can be saved, edited, sent later, etc
				let buttons = [];
				message.channel.awaitMessages(n => n.content.startsWith(`${config.prefix}option `)  && n.author === message.author, {maxMatches: responseCount, time: 300000, errors: ['time'] })
				.then(options => { //another user input, another message waiter
					message.channel.send(`*Poll by ${message.member.displayName}*`) //we have the input we need, now its time to start generating the embed
					.then(poll => { //an easy way to use an embed is to send a message and then swap the embed in with an edit
						let header =  `**Question: ${question}${!question.includes('?')?'?':''}**`; //this is the line I was writing when I learned the ternary operator, and I adore it
						let answers = `Choices:`;
						for(let i = 0; i < options.size; i++) //writes out the choices into ${answers} by appending them one by one
						{
							const pre = options.array()[i].content.trim().split(/ +/g);
							pre.shift();
							if(buttons.includes(pre[0]))
								return message.reply(`Emojis given as vote buttons must be unique`);
							buttons.push(pre.shift());
							const post = pre.join(" ");
							answers += `\n\t${buttons[buttons.length-1]} ${post}`;
						}
						let foot = `\nVote by reacting with the corresponding emoji!`;
						const edit = new Discord.RichEmbed() //generates the actual RichEmbed object
							.setTitle(poll.content) //title is the text of the message we are going to edit this into
							.setAuthor(message.member.displayName, message.author.avatarURL) //author is the poll authors name and avatar, to show who wrote it
							.setColor(0xFF00FF) //my signiture FF00FF pink
							.setFooter(foot, client.user.avatarURL) //footer is the voting instruction and Sniff Bot's avatar
							.setTimestamp(new Date()) //timestamp for posterity
							.addField(header, answers); //adds the actual poll to the embed. added fields are (key, value) with the key treated as a header/title, so i used the question as the 'key' and the options as the 'value'
						poll.edit("", edit); //edits the embed into the message so that the user can see the results
						message.reply(`Is this correct? (${config.prefix}y or ${config.prefix}n)\nWarning: Once confirmed poll must be manually cancelled with ${config.prefix}endpoll`);
						message.channel.awaitMessages(mn => mn.content.startsWith(config.prefix) && mn.author === message.author, {maxMatches: 1, time: 90000, errors: ['time'] })
						.then(conf => { //awaits confirmation. this is the final chance to cancel, because if they say yes then supposedly this is what they want
							if(conf.array()[0].content.slice(config.prefix.length).trim() === "y")
							{//on yes
								message.reply(`How long (minutes) should the poll remain open? (${config.prefix}time #) (default = 120)`); //default time 2 hours, can be any time >= 1 minute. i suppose 0 wouldn't throw any errors but that would be pretty useless
								message.channel.awaitMessages(mno => mno.content.startsWith(config.prefix) && mno.author === message.author, {maxMatches: 1, time: 40000, errors: ['time'] })
								.then(async dur => { //hey look i actually understood async for the first time ever here
									const life = dur.array()[0].content.slice(config.prefix.length).trim().split(/ +/g);
									life.shift().toLowerCase();
									let input = parseInt(life[0], 10); //create int from time input
									if(!isNaN(input)) //check if there was a time given, else it stays default
										duration = input * 60000;
									let filename = `${__dirname}/poll_results/pollresult_${message.id}`; //initalize filename
									let pollMsg = await message.channel.guild.channels.array()[targetChan].send(edit) //send copy of poll message to targetChan
									.then(pinner => pinner.pin()) //pins poll to channel
									.catch(e => {console.error(e)});
									let cleanResults = [0];
									try{
										for(let myI = 0; myI < buttons.length; myI++) 
										{
											await pollMsg.react((buttons[myI].includes(`>`) ?
																	message.guild.emojis.get(buttons[myI].substring(buttons[myI].lastIndexOf(`:`)+1,buttons[myI].length-1)) :
																	buttons[myI]
																));
											cleanResults.push(1);
										}
									} catch(err) {
										console.error(`Error adding poll buttons\n\t${err}`);
										
									}
									const filter = (r,a) => {
										if(a.id == client.user.id) return false;
										let testButtons = [];
										buttons.forEach(button => {
											testButtons.push(
												(button.includes(`>`) ?
													button.substring(button.lastIndexOf(`:`)+1,button.length-1) :
													button
												));
										});
										return testButtons.includes((r.emoji.id || r.emoji.name));
									} //create filter for message collector
									const collector = new PollCollector(pollMsg, filter, {time: duration}); //initialize reaction collector with filter and specified duration
									const endCollector = message.channel.guild.channels.array()[targetChan].createMessageCollector(m => m.author === message.author && m.content === `${config.prefix}endpoll`, {time: duration}); //initialize message collector with filter and specified duration
									//let logMsg = await message.channel.guild.channels.array()[auditlog].send(`Created poll "${question}" for ${message.author}`); //log poll creation
									setTimeout(recordFile({'question' : question, 'authorName' : message.author.username, 'authorId' : message.author.id, 'pollMsg' : pollMsg.id, 'responseCount' : responseCount, 'cleanResults' : cleanResults, 'answers' : answers, 'totalVotes' : collector.collected.size, 'voters' : collector.collected.users, 'complete' : false}, `${filename}.json`), 100);
									console.log(`started poll timeout = ${duration/60000}`);
									endCollector.on('collect', p => { //event handler for message collector, allows realtime updating of results and output file (and poll stop)
										collector.stop();
										endCollector.stop();
									});
									collector.on('collect', p => {
										if(!buttons.includes(p.reaction.emoji.name))
										{
											cleanResults[0]++;
										}
										for(indexLocation = 0; indexLocation < buttons.length; indexLocation++) {
											cleanResults[indexLocation+1] = pollMsg.reactions.array().find(reac => `${(reac.emoji.id || reac.emoji.name)}` == 
												(buttons[indexLocation].includes(`>`) ?
													buttons[indexLocation].substring(buttons[indexLocation].lastIndexOf(`:`)+1,buttons[indexLocation].length-1) :
													buttons[indexLocation]
												))
											.count;
										}
										setTimeout(recordFile({'question' : question, 'authorName' : message.author.username, 'authorId' : message.author.id, 'pollMsg' : pollMsg.id, 'responseCount' : responseCount, 'cleanResults' : cleanResults, 'answers' : answers, 'totalVotes' : collector.collected.size, 'voters' : collector.collected.users, 'complete' : false}, `${filename}.json`), 100);
									});
									collector.on('end', collected => { //event emitted at the end of duration, or if author sends !endpoll command
										//logMsg.edit(`${logMsg.content}\n\t**${(new Date()).toLocaleTimeString('en-US')}:** Poll Completed`); //update auditlog message
										console.log(`Poll complete`);
										let toSendTitle = `__Results for poll: ${question}${!question.includes('?')?'?':''}__`; //begin constructing result version of poll
										let toSend = ``;
										for(let j = 1; j <= responseCount; j++) //final result of options
										{
											const rPre = options.array()[j-1].content.trim().split(/ +/g);
											rPre.shift();
											const rPost = rPre.join(" ");
											toSend += `\nVotes for option "${rPost}": ${cleanResults[j]-1}`;
										}
										toSend += `\n\tTotal Votes: ${collected.size}`;
										endBed = new Discord.RichEmbed() //result embed
											.setTitle(edit.title)
											.setAuthor(message.member.displayName, message.author.avatarURL)
											.setColor(0xFF00FF)
											.setFooter(`Powered by Sniff Bot`, client.user.avatarURL)
											.setTimestamp(new Date())
											.addField(toSendTitle, toSend);
										message.author.send(endBed); //DM a copy of results to the author
										pollMsg.edit("", endBed); //swap the results in for the poll (also removes the vote instructions from the bottom)
										pollMsg.unpin(); //unpins, as it is no longer an active poll
										setTimeout(recordFile({'question' : question, 'authorName' : message.author.username, 'authorId' : message.author.id, 'pollMsg' : pollMsg.id, 'responseCount' : responseCount, 'cleanResults' : cleanResults, 'toSend' : toSend, 'totalVotes' : collected.size, 'voters' : collected.users, 'complete' : true}, `${filename}.json`), 100);
										//records final results in file, including completion status. currently not used
									});
								})
								.catch(e => console.log(e));
							} else if(conf.array()[0].content.slice(config.prefix.length).trim() === "n") { //on no
								message.reply(`Poll terminated`);
								poll.delete(); //delete poll embed message
								return;
							} else {
								message.reply(`Response was not y or n, poll terminated`); //on neither, interpret no
								poll.delete(); //delete poll embed message
								return;
							}
						})
						.catch(e => {message.reply(`Your poll request has timed out (max response time: 40 seconds)`);poll.delete();return;}); //delete poll message due to no answer, interpret no
					})
					.catch(err=>{console.error(`Error sending poll message:\n\t${typeof err==='string'?err.split('\n').join('\n\t'):err}`)}); //catch any errors for sending the poll message ##TODO (?) come up with error handling for this; i have not seen message sends fail that I am aware of
				})
				.catch(e => {message.reply(`Your poll request has timed out (max response time: 300 seconds)`); return}); //catch any errors, primarily timeout on awaitMessage
			})
			.catch(e => {message.reply(`Your poll request has timed out (max response time: 90 seconds)`); return;}); //catch any errors, primarily timeout on awaitMessage
		},
		
		//the reason we check the permission with the nested if statement instead of with a single compound condition is efficiency,
		//since the command is accurate, there's no need to have it keep checking other commands, so we can just have it return null
		"wakfi": async function() {
			if(!message.author.id == 193160566334947340) {
				return null;
			} else {
				sendMe('does nothing rn');
			}
		}
	}
	
	let execute = commandLUT[command] || async function(){}
	execute();
});

//executes the function to log the client into discord
client.login(config.token);
}

main();