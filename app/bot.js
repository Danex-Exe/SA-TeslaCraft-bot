// modules
const WebSocket = require('ws');
const mineflayer = require('mineflayer');
const vec3 = require('vec3');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

// data
let stopMoving = false;
let bot = null;
let admins = [];
const wss = new WebSocket.Server({ port: 8000});
const defaultLookPosition = {x: 324, y: 83, z: 0};
let watchPlayersEnabled = false;
let isMovingMultiple = false;
let messageIntervals = [];
const donates = {
  'Рядовой': '&7[Рядовой]|&f',
  'Ефрейтор': '&f[Ефрейтор]|&f',
  'Мл._Сержант': '&f[Младший сержант]|&f',
  'Сержант': '&f[Сержант]|&f',
  'Ст._Сержант': '&f[&nСтарший сержант&r&r&f]|&f',
  'Прапорщик': '&1[&nПрапорщик&r&r&1]|&f',
  'Ст._Прапорщик': '&3[&nСтарший прапорщик&r&r&3]|&1',
  'Лейтенант': '&5[&nЛейтенант&r&r&5]|&3',
  'Ст._Лейтенант': '&4[&nСтарший лейтенант&r&r&4]|&5',
  'Капитан': '&9[&nКапитан&r&r&9]|&4',
  'Майор': '&d[&nМайор&r&r&d]|&9',
  'Подполковник': '&e[&nПодполковник&r&r&e]|&d',
  'Полковник': '&a[&nПолковник&r&r&a]|&e',
  'Генерал': '&6[&nГенерал&r]|&a',
  'Маршал': '&b[&nМаршал&r]|&6',
  'Император': '&c[&nИмператор&r]|&b'
}


// functions
function serversend(data) {wss.clients.forEach(client => {if (client.readyState === WebSocket.OPEN) {client.send(JSON.stringify(data));} else {console.log('Ошибка при подключении к серверу')}});}
function moveToMultipleCoordinates(coordsArray) {
  stopMoving = false;
  isMovingMultiple = true;
  let currentIndex = 0;

  function moveToNextGoal() {
    if (stopMoving || !isMovingMultiple) {
      setStopMoving(true);
      return;
    }
    if (coordsArray.length === 0) {
      setStopMoving(true);
      return;
    }
    if (currentIndex < 0 || currentIndex >= coordsArray.length) {
      setStopMoving(true);
      return;
    }
    const { x, y, z } = coordsArray[currentIndex];
    const goal = new goals.GoalBlock(x, y, z);
    bot.pathfinder.setGoal(goal);
    bot.once('goal_reached', () => {
      currentIndex = (currentIndex + 1) % coordsArray.length;
      if (!stopMoving && isMovingMultiple) {
        setTimeout(moveToNextGoal, 0);
      }
    });
  }
  moveToNextGoal();
}
function moveToCoordinates(x, y, z) {
  stopMoving = false;
  isMovingMultiple = false;
  const defaultMovements = new Movements(bot, require('minecraft-data')(bot.version));
  const targetPosition = new goals.GoalBlock(x, y, z);
  bot.pathfinder.setMovements(defaultMovements);
  bot.pathfinder.setGoal(targetPosition);
  bot.once('goal_reached', () => {
    serversend({ action: 'cords' });
  });
}
function setStopMoving(value) {
  stopMoving = value;
  if (stopMoving) {
    try {
      bot.pathfinder.stop();
    } catch (error) {}
  }
}
function moveBot(direction) {
  const directions = {
    w: 'forward',
    ц: 'forward',
    a: 'left',
    ф: 'left',
    s: 'back',
    ы: 'back',
    d: 'right',
    в: 'right',
    shift: 'sneak'
  };
  const action = directions[direction];
  if (action) {
    bot.setControlState(action, true);
    setTimeout(() => bot.setControlState(action, false), 500);
  }
}
function getClosestPlayer() {
  let closestPlayer = null;
  let closestDistance = 10;
  for (const playerName in bot.players) {
    if (playerName === bot.username || admins.includes(playerName)) continue;
    const playerEntity = bot.players[playerName].entity;
    if (!playerEntity) continue;
    const distance = bot.entity.position.distanceTo(playerEntity.position);
    if (distance < closestDistance) {
      closestPlayer = playerEntity;
      closestDistance = distance;
    }
  }
  return closestPlayer;
}
function lookAtEntity(entity) {
  const pos = entity.position.offset(0, entity.height, 0);
  bot.lookAt(pos);
}
function lookAtPoint(point) {
  const position = vec3(point.x, point.y, point.z);
  bot.lookAt(position);
}
function automessages(data) {
  stop_automessages();
  if (data.mainMessage && data.mainDelay) {
    const mainInterval = setInterval(() => {
      bot.chat(data.mainMessage);
    }, parseInt(data.mainDelay) * 1000);
    messageIntervals.push(mainInterval);
  }
  data.messages.forEach(message => {
    if (message.text && message.delay) {
      const messageInterval = setInterval(() => {
        bot.chat(message.text);
      }, parseInt(message.delay) * 1000)
      messageIntervals.push(messageInterval);
    }
  });
}
function stop_automessages() {
  messageIntervals.forEach(interval => clearInterval(interval));
  messageIntervals = [];
}
function getspan(message) {
  const codes = {
    '&4': '<span style="color: #be0000;">',
    '&c': '<span style="color: #fc5656;">',
    '&6': '<span style="color: #d9a334;">',
    '&e': '<span style="color: #fefe3f;">',
    '&2': '<span style="color: #00be00;">',
    '&a': '<span style="color: #3ffe3f;">',
    '&b': '<span style="color: #3ffefe;">',
    '&3': '<span style="color: #00bebe;">',
    '&1': '<span style="color: #0000be;">',
    '&9': '<span style="color: #3f3ffe;">',
    '&d': '<span style="color: #fe3ffe;">',
    '&5': '<span style="color: #be00be;">',
    '&f': '<span style="color: #ffffff;">',
    '&7': '<span style="color: #bebebe;">',
    '&8': '<span style="color: #3f3f3f;">',
    '&0': '<span style="color: #000000;">',
    '&r': '</span>',
    '&l': '<span style="font-weight: bold;">',
    '&o': '<span style="font-style: italic;">',
    '&n': '<span style="text-decoration: underline;">',
    '&m': '<span style="text-decoration: line-through;">'
  };
  let formattedMessage = message.replace(/&[0-9a-fk-or]/g, match => codes[match] || match);
  formattedMessage += '</span>'.repeat((formattedMessage.match(/<span/g) || []).length - (formattedMessage.match(/<\/span>/g) || []).length);
  return formattedMessage;
}
function raise(nick) {
  const player = bot.players[nick]?.entity;
  if (!player) {
    console.log(`Игрок ${nick} не найден.`);
    return;
  }
  if (player) {
    bot.activateEntity(player);
  }
}
function replaceColorCodes(message) {
  return message.replace(1, '').replace(2, '').replace(3, '').replace(4, '').replace(5, '').replace(6, '').replace(7, '').replace(8, '').replace(9, '').replace(0, '').replace(a, '').replace(e, '').replace(o, '').replace(d, '').replace(f, '').replace(k, '').replace(l, '').replace(c, '').replace(b, '').replace(m, '').replace(n, '')
}
function answer(author, message, message_type) {
  if (message_type == 'privateother') {
    bot.chat(`/m ${author} ${replaceColorCodes(message)}`)
  } else if (message_type == 'friendnotify') {
    bot.chat(`/fr n &b${author}&f, ${message}`)
  } else if (message_type == 'local') {
    bot.chat(`&b${author}&f, ${message}`)
  } else if (message_type == 'global') {
    bot.chat(`/m ${author} ${replaceColorCodes(message)}`)
  } else if (message_type == 'clan') {
    bot.chat(`/cc &b${author}&f, ${message}`)
  } else if (message_type == 'partychat') {
    bot.chat(`/pc &b${author}&f, ${message}`)
  }
}
function checkcommand(author, message, message_type) {
  if (author == bot_nick || message_type == 'privateme' || message_type == 'server' || message_type == 'other') return;
  if (message.split(" ")[0].split()[0] == "/") {
    message = message.split(" ")[0].split().slice(1).join(" ")
    if (message.split(" ")[0] == "raise") {
      if (admins.includes(author)) {
        if (message.split(' ').length == 2) {
          raise(message.split(' ')[1])
          answer(author, `вы успешно заставили бота поднять игрока &a${message.split(' ')[1]}`, message_type)
        } else if (message.split(' ').length == 1) {
          raise(author)
          answer(author, `вы успешно заставили бота поднять себя`, message_type)
        }
      }
    } else if (message.split(" ")[0] == "send") {
      if (admins.includes(author)) {
        if (message.split(' ').length > 1) {
          bot.chat(message.split(" ").slice(1).join(' '))
          answer(author, `вы успешно заставили бота написать сообщение в чат`, message_type)
        }
      }
    } else if (message.split(" ")[0] == "send!") {
      if (admins.includes(author)) {
        if (message.split(' ').length > 1) {
          bot.chat('!'+message.split(" ").slice(1).join(' '))
          answer(author, `вы успешно заставили бота написать сообщение в глобальный чат`, message_type)
        }
      }
    }
  } else {
    if (message_type == 'privateother') {
      bot.chat(`/m ${author} Привет, я бот Seven Aspects. Ты ввел неверную команду!`)
    }
  }
}
function checkmessage(message) {
  let mes = message.split(" ");
  let author = '', finish_message = '', clan = '', message_type = 'other', donate = '', prefix = mes[0].replace('[', '').replace(']', '');
  let hasGlobalPrefix = false;
  if (prefix === "Гл") {
    hasGlobalPrefix = true;
    mes.shift();
    prefix = mes[0].replace('[', '').replace(']', '');
  }
  if (mes[0] === "[Я" && mes[1] === "->") {
    author = mes[2].replace(']', '');
    finish_message = mes.slice(3).join(" ");
    message_type = 'privateme';
    donate = 'None';
    clan = 'None';
  } else if (mes[2] === "Мне]" && mes[1] === "->") {
    author = mes[0].replace('[', '');
    finish_message = mes.slice(3).join(" ");
    message_type = 'privateother';
    donate = 'None';
    clan = 'None';
  } else if (prefix === "Друзьям") {
    author = mes[1].replace(':', '');
    finish_message = mes.slice(2).join(" ");
    message_type = 'friendnotify';
    donate = 'None';
    clan = 'None';
  } else if (prefix === "Друзья") {
    if (mes[2] == 'лучший') {
      author = mes[4];
      finish_message = 'best';
    } else {
      author = mes[3];
      finish_message = 'basic';
    }
    message_type = 'friend';
    donate = 'None';
    clan = 'None';
  } else if (prefix === "TeslaCraft") {
    author = 'None';
    finish_message = message;
    message_type = 'server';
    donate = 'None';
    clan = 'None';
  } else if (prefix === "Пати-чат") {
    author = mes[1].replace(':', '');
    finish_message = mes.slice(2).join(" ");
    message_type = 'partychat';
    donate = 'None';
    clan = 'None';
  } else if (prefix === "Пати") {
    author = 'None';
    finish_message = mes.slice(1).join(" ");
    message_type = 'party';
    donate = 'None';
    clan = 'None';
  } else if (prefix === 'Не' && mes[1] === 'в') {
    const donatePrefix = mes[2].replace('клане[', '').replace(']', '');
    if (donates[donatePrefix]) {
      message_type = 'local';
      clan = 'None';
      finish_message = mes.slice(4).join(' ');
      author = mes[3].replace(':', '');
      donate = donatePrefix;
    }
  } else if (donates[prefix] && mes[1].includes(':')) {
    message_type = hasGlobalPrefix ? 'global' : 'local';
    clan = 'None';
    finish_message = mes.slice(2).join(' ');
    author = mes[1].replace(':', '');
    donate = prefix;
  } else {
    for (let i = 0; i < 6; i++) {
      if (mes[i]?.includes(']') && donates[mes[i + 1]?.replace('[', '').replace(']', '')]) {
        message_type = hasGlobalPrefix ? 'global' : 'local';
        clan = mes.slice(0, i + 1).join(' ');
        finish_message = mes.slice(i + 3).join(' ');
        author = mes[i + 2]?.replace(':', '');
        donate = mes[i + 1]?.replace('[', '').replace(']', '');
        break;
      } else if (mes[i]?.includes(']') && mes[i + 1]?.split('').slice(-1).join() == ':') {
        message_type = 'clan';
        clan = mes.slice(0, i + 1).join(' ');
        finish_message = mes.slice(i + 2).join(' ');
        author = mes[i + 1]?.replace(':', '');
        donate = 'None';
        break;
      }
    }
  }
  checkcommand(author, finish_message, message_type)
  if (message_type === 'other') {
    finish_message = message;
    clan = 'None';
    author = 'None';
    donate = 'None';
  }
  return {
    message_type,
    finish_message,
    author,
    donate,
    clan: clan.replace('[', '&c[&f').replace(']', '&c]')
  };
}
function messagetohtml(message) {
  let data = checkmessage(message.replace('Мл. Сержант', 'Мл._Сержант').replace('Ст. Сержант', 'Ст._Сержант').replace('Ст. Прапорщик', 'Ст._пПрапорщик').replace('Ст. Лейтенант', 'Ст._Лейтенант'))
  if (data.message_type == 'other') {
    return data.finish_message
  } else if (data.message_type == 'privateme') {
    return getspan(`&6[&cЯ &r-&gt; &a${data.author}&6] &f${data.finish_message}`)
  } else if (data.message_type == 'privateother') {
    return getspan(`&6[&a${data.author} &r-&gt; &cМне&6] &f${data.finish_message}`)
  } else if (data.message_type == 'local') {
    if (data.clan == 'None') {
      return getspan(`${donates[data.donate].split("|")[0]} ${donates[data.donate].split("|")[1]}${data.author}&6: &f${data.finish_message}`)
    } else {
      return getspan(`${data.clan} ${donates[data.donate].split("|")[0]} ${donates[data.donate].split("|")[1]}${data.author}&6: &f${data.finish_message}`)
    }
  } else if (data.message_type == 'global') {
    if (data.clan == 'None') {
      return getspan(`&6[&bГл&6] ${donates[data.donate].split("|")[0]} ${donates[data.donate].split("|")[1]}${data.author}&6: &f${data.finish_message}`)
    } else {
      return getspan(`&6[&bГл&6] ${data.clan} ${donates[data.donate].split("|")[0]} ${donates[data.donate].split("|")[1]}${data.author}&6: &f${data.finish_message}`)
    }
  } else if (data.message_type == 'clan') {
    return getspan(`&6&l[&r&f${data.clan.replace('&c[', '').replace('&c]', '')}&6&l]&r &a${data.author}&6: &f${data.finish_message}`)
  } else if (data.message_type == 'friend') {
    if (data.finish_message == 'basic') {
      return getspan(`&6[&aДрузья&6] &bВаш друг &a${data.author}&b зашёл на сервер!`)
    } else {
      return getspan(`&6[&aДрузья&6] &b&lВаш лучший друг &a&l${data.author}&b зашёл на сервер!`)
    }
  } else if (data.message_type == 'partychat') {
    return getspan(`&6[&aПати-чат&r] &6${data.author}&a: &b${data.finish_message}`)
  } else if (data.message_type == 'party') {
    return getspan(`&6[&aПати&6] &a${data.finish_message}`)
  } else if (data.message_type == 'friendnotify') {
    return getspan(`&6&l[&r&aДрузьям&6&l] &b&l${data.author}&r&r&r&6: &f${data.finish_message}`)
  } else if (data.message_type == 'server') {
    return getspan(`&6[&eTesla&aCraft&6] &e${data.finish_message.replace('[TeslaCraft]', '')}`)
  }
}

function create(host, bot_nick, distance, pin, pass) {
  bot = mineflayer.createBot({ host: host, username: bot_nick, viewDistance: distance, connectTimeout: 180000 });
  bot.loadPlugin(pathfinder);
  
  bot.once('spawn', () => {});

  bot.on('physicTick', () => {
    if (!watchPlayersEnabled) return;

    const nearbyPlayer = getClosestPlayer();
    if (nearbyPlayer) {
      lookAtEntity(nearbyPlayer);
    } else {
      lookAtPoint(defaultLookPosition);
    }
  });

  bot.on('message', (jsonMsg) => {
    let message = jsonMsg.toString();
    if (message === undefined || message.trim() === '') return;

    if (message.includes('Вы попали в лимбо, перейти в лобби можно стандартными командами')) {
      serversend({ action: 'message', "message": `[${bot_nick}] подключился к серверу лимбо`});
      bot.chat('/mm');
    } else if (message.includes('Нужно авторизоваться. Напишите в чат Ваш пароль')) {
      serversend({ action: 'message', "message": `[${bot_nick}] Ввел пароль`});
      bot.chat(pass);
    } else if (message.includes('Напишите в чат Ваш пин-пароль (5 цифр)')) {
      serversend({ action: 'message', "message": `[${bot_nick}] Ввел пин-код`});
      bot.chat(pin);
    }
    serversend({ action: 'message', "message": messagetohtml(message.replace('Младший сержант', 'Младший_сержант').replace('Старший сержант', 'Старший_сержант').replace('Старший прапорщик', 'Старший_прапорщик').replace('Старший лейтенант', 'Старший_лейтенант')), time: new Date().toLocaleTimeString() });
  });

  bot.on('error', err => {
    serversend({ action: 'error', 'error': `Произошла ошибка: ${err}` });
  });

  bot.on('end', (reason) => {
    serversend({ action: 'error', 'error': `Бот был отключен от сервера по причине: ${reason}` });
  });

  bot.on('kicked', (reason, loggedIn) => {
    if (loggedIn) {
      serversend({ action: 'error', 'error': `Бот был кикнут с сервера по причине: ${reason}` });
    } else {
      serversend({ action: 'error', 'error': `Бот был кикнут при попытке подключения к серверу, по причине: ${reason}` });
    }
  });
}

// webserver
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
      try {
          const data = JSON.parse(message);
          if (data.action === 'move') {
            moveBot(data.direction);
          } else if (data.action === 'cords' && data.type === 'on') {
            if (data.array.length == 1) {moveToCoordinates(data.array[0].x, data.array[0].y, data.array[0].z)} else {moveToMultipleCoordinates(data.array);}
          } else if (data.action === 'cords' && data.type === 'off') {
            setStopMoving(true);
          } else if (data.action === 'start') {
            host = data.ip
            bot_nick = data.nick
            distance = data.distance
            pin = data.pin
            password = data.pass
            admins = data.admins.split(', ')
            try{create(host, bot_nick, distance, pin, password)}catch{serversend({action: 'error', 'error': 'Произошла ошибка при запуске бота!'})}
          } else if (data.action === 'stop') {
            try{bot.end("Выключение")}catch{serversend({action: 'error', 'error': 'Произошла ошибка при выключении бота!'})}
          } else if (data.action === 'look' && data.type === 'on') {
            watchPlayersEnabled = true;
          } else if (data.action === 'look' && data.type === 'off') {
            watchPlayersEnabled = false;
            lookAtPoint(defaultLookPosition);
          } else if (data.action === 'messages' && data.type == 'on') {
            automessages({"mainMessage": data.mainMessage, "mainDelay": data.mainDelay, "messages": data.messages})
          } else if (data.action === 'messages' && data.type == 'off') {
            stop_automessages()
          } else if (data.action === 'message' && data.message) {
            bot.chat(data.message);
          } 
      } catch (error) {
          console.error('Ошибка:', error);
      }
  });
});