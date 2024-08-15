import { useEffect, useState, useRef, useCallback } from 'react';
import Head from 'next/head';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [ws, setWs] = useState(null);
  const [coordinates, setCoordinates] = useState({ x: '', y: '', z: '' });
  const [extraCoordinates, setExtraCoordinates] = useState([]);
  const [mainMessage, setMainMessage] = useState('');
  const [mainDelay, setMainDelay] = useState('');
  const [extraMessages, setExtraMessages] = useState([]);
  const [cfg, setcfg] = useState({ nick: '', ip: '', pass: '', pin: '', admins: '', distance: 'far' });
  const chatWindowRef = useRef(null);
  const wasdButtonsRef = useRef({});
  const [selectedChat, setSelectedChat] = useState('Общий');
  const chatTypes = ['Общий', 'Глобальный', 'Локальный', 'Личный', 'Клановый', 'Дружеский', 'Пати'];
  const buttonRef = useRef({});
  const modal1 = useRef(null);
  const modal2 = useRef(null);
  const modal3 = useRef(null);
  const modal4 = useRef(null);
  const modal5 = useRef(null);
  const bc = useRef(null);
  const [broadcastMessage, setBroadcastMessage] = useState('');

  useEffect(() => {
    const handleMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.action === 'cords') {
        if (buttonRef["2"]) {
            buttonRef["2"].style.backgroundColor = '#821919';
            delete buttonRef["2"]
        }
        handleCloseModal()

      } else if (data.action === 'message') {
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages, `[${data.time}] ${data.message}`];
          if (updatedMessages.length > 300) {
            updatedMessages.shift();
          }
          return updatedMessages;
        });
      } else if (data.action === 'error') {
        handleBroadcastOpen(
            <div className='bc-content'>
                <h2>Ошибка</h2>
                <p>{data.error}</p>
            </div>
        );
      }
    };
    const websocket = new WebSocket(`ws://localhost:8000`);
    const savedCfgString = localStorage.getItem('cfg');
    if (!savedCfgString) {
        handleOpenModal(5);
    }
    setWs(websocket);
    websocket.onmessage = handleMessage;
    websocket.onerror = (error) => {setError(`Ошибка подключения к боту`);};
    return () => {websocket.close();};
  }, []);
  useEffect(() => {
    const coordinatesString = formatCoordinatesString();
    document.getElementById('coordinates-string-input').value = coordinatesString;
  }, [coordinates, extraCoordinates]);
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
    if (modal1.currentCSSZoom) {
        modal1.current.style.display = "none";
    } else if (modal2.currentCSSZoom) {
        modal2.current.style.display = "none";
    } else if (modal3.currentCSSZoom) {
        modal3.current.style.display = "none";
    } else if (modal4.currentCSSZoom) {
        modal4.current.style.display = "none";
    } else if (modal5.currentCSSZoom) {
        modal5.current.style.display = "none";
    } else if (bc.currentCSSZoom) {
        bc.current.style.display = "none";
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim() && ws) {
      const time = new Date().toLocaleTimeString();
      ws.send(JSON.stringify({ action: "message", message: inputValue, time }));
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, `[${time}] Вы: ${inputValue}`];
        if (updatedMessages.length > 300) {
          updatedMessages.shift();
        }
        return updatedMessages;
      });
      setInputValue('');
    }
  };
  const handleAddMessage = () => {
    setExtraMessages([...extraMessages, { id: Date.now(), text: '', delay: '' }]);
  };

  const handleRemoveMessage = (id) => {
    setExtraMessages(extraMessages.filter(msg => msg.id !== id));
  };

  const handleeInputChange = (id, field, value) => {
    setExtraMessages(extraMessages.map(msg => 
        msg.id === id ? { ...msg, [field]: value } : msg
    ));
  };
  const handleSaveMessages = () => {
    handleCloseModal(true);
    const payload = {
        action: 'messages',
        type: 'on',
        mainMessage,
        mainDelay,
        messages: extraMessages
    };
    console.log(payload)
    const hasEmptyMessages = (messagesArray) => {
        return messagesArray.some(msg => msg.text === '' || msg.delay === '');
    };

    if (payload.mainMessage === '' || payload.mainDelay === '' || hasEmptyMessages(payload.messages)) {
        handleBroadcastOpen(
            <div className='bc-content'>
                <h2>Ошибка</h2>
                <p>В отправленных данных есть пустые строки</p>
            </div>
        );
        if (buttonRef["2"]) {
            buttonRef["2"].style.backgroundColor = '#821919';
            delete buttonRef["2"];
        }
    } else {
        if (ws) { ws.send(JSON.stringify(payload)); }
    }
  };
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };
  const handleAddCoordinates = () => {
    setExtraCoordinates([...extraCoordinates, { id: Date.now(), x: '', y: '', z: '' }]);
  };

  const handleRemoveCoordinates = (id) => {
    setExtraCoordinates(extraCoordinates.filter(coord => coord.id !== id));
  };

  const handleInputChange = (id, axis, value) => {
    setExtraCoordinates(extraCoordinates.map(coord => 
        coord.id === id ? { ...coord, [axis]: value } : coord
    ));
  };
  const handleCoordinatesStringChange = (e) => {
    parseCoordinatesString(e.target.value);
  };
  const handleWASDKeyPress = useCallback((event) => {
    const key = event.key.toLowerCase().replace("ц","w").replace("ы","s").replace("ф","a").replace("в","d");
    if (wasdButtonsRef.current[key]) {
        wasdButtonsRef.current[key].click();
    }
  }, []);
  const handleAntiSpace = useCallback((event) => {
    if (event.key === ' ') {
      event.preventDefault();
    }
  }, []);
  const handleOpenModal = (id) => {
    document.addEventListener('keydown', handleAntiSpace);
    if (modal1.current && id == 1) {
        modal1.current.style.display = "block";
        document.addEventListener('keydown', handleWASDKeyPress);
    } else if (modal2.current && id == 2) {
        modal2.current.style.display = "block";
    } else if (modal3.current && id == 3) {
        document.removeEventListener('keydown', handleAntiSpace);
        modal3.current.style.display = "block";
    } else if (modal4.current && id == 4) {
        modal4.current.style.display = "block";
    } else if (modal5.current && id == 5) {
        document.removeEventListener('keydown', handleAntiSpace);
        document.body.style.overflow = 'hidden';
        modal5.current.style.display = "block";
    }
  };
  const handleBroadcastOpen = (text) => {
    setBroadcastMessage(text);
    document.addEventListener('keydown', handleAntiSpace);
    bc.current.style.display = "block";
  }
  const handleBroadcastClose = () => {
    document.removeEventListener('keydown', handleAntiSpace);
    bc.current.style.display = "none";
  }
  const handleCloseModal = (move = false) => {
    document.removeEventListener('keydown', handleAntiSpace);
    if (modal1.current) {
        modal1.current.style.display = "none";
        document.removeEventListener('keydown', handleWASDKeyPress);
        if (buttonRef["1"]) {
            buttonRef["1"].style.backgroundColor = '#821919';
            delete buttonRef["1"]
        }
    } if (modal2.current) {
        modal2.current.style.display = "none";
        if (!move) {
            if (buttonRef["2"]) {
                buttonRef["2"].style.backgroundColor = '#821919';
                delete buttonRef["2"]
            }

        }
    } if (modal3.current) {
        modal3.current.style.display = "none";
        if (!move) { 
            if (buttonRef["5"]) {
                buttonRef["5"].style.backgroundColor = '#821919';
                delete buttonRef["5"]
            }
            if (ws) { ws.send(JSON.stringify({action: 'messages', type: 'off'}))}
        }
    } if (modal4.current) {
        modal4.current.style.display = "none";
    } if (modal5.current) {
        document.body.style.overflow = 'auto';
        modal5.current.style.display = "none";
    }
  };


  const handleButtonClick = (e, index) => {
    if (buttonRef[String(index)]) {
        e.target.style.backgroundColor = '#821919';
        delete buttonRef[String(index)]
        
        if (index === 2) {
            if (ws) {
                const payload = {
                    action: 'cords',
                    type: 'off'
                };
                ws.send(JSON.stringify(payload));
            };
        } else if (index === 3) {
            ws.send(JSON.stringify({action: 'look', type: 'off'}));
        } else if (index === 5) {
            ws.send(JSON.stringify({action: 'messages', type: 'off'}));
        }
    } else {
        e.target.style.backgroundColor = '#468219';
        buttonRef[String(index)] = e.target
        
        if (index === 1) {
            handleOpenModal(1);
        } else if (index === 2) {
            handleOpenModal(2);
        } else if (index === 3) {
            ws.send(JSON.stringify({action: 'look', type: 'on'}));
        } else if (index === 4) {
            if (buttonRef["4"]) {
                buttonRef["4"].style.backgroundColor = '#821919';
                delete buttonRef["4"]
            }
            const savedCfgString = localStorage.getItem('cfg');
            const savedCfg = JSON.parse(savedCfgString);
            try{
                handleBroadcastOpen(
                    <div className='bc-content'>
                        <h2>Запуск бота</h2>
                        <p>Вы успешно запустили бота!</p>
                    </div>
                );
                ws.send(JSON.stringify({ action: 'start', "nick": savedCfg.nick, "ip": savedCfg.ip, "pass": savedCfg.pass, "pin": savedCfg.pin, "distance": savedCfg.distance, "admins": savedCfg.admins }));
            }catch{
                handleBroadcastOpen(
                    <div className='bc-content'>
                        <h2>Ошибка</h2>
                        <p>Веб сервер еще не полностью прогрузился, повторите попытку через 15 секунд!</p>
                    </div>
                );
            }
        } else if (index === 5) {
            handleOpenModal(3);
        } else if (index === 8) {
            if (buttonRef["8"]) {
                buttonRef["8"].style.backgroundColor = '#821919';
                delete buttonRef["8"]
            }
            ws.send(JSON.stringify({ action: 'stop' }));
        } 
    }
  };

  const handleMove = (direction) => {if (ws) {ws.send(JSON.stringify({ action: 'move', direction }));}};
  const handleMainCoordinateChange = (axis, value) => {
    setCoordinates({
        ...coordinates,
        [axis]: value
    });
  };
  const handleMainCfgChange = (axis, value) => {
    setcfg({
      ...cfg,
      [axis]: value
    });
  };
  const handleCoordinatesSubmit = () => {
    handleCloseModal(true);
    const payload = {
        action: 'cords',
        type: 'on',
        array: [
            coordinates,
            ...extraCoordinates
        ]
    };
    const hasEmptyCoordinates = (coordsArray) => {
        return coordsArray.some(coord => coord.x === '' || coord.y === '' || coord.z === '');
    };
    if (payload.array.length === 0 || hasEmptyCoordinates(payload.array)) {
        if (buttonRef["2"]) {
            buttonRef["2"].style.backgroundColor = '#821919';
            delete buttonRef["2"];
        }
    } else {
        if (ws) { ws.send(JSON.stringify(payload)); }
    }
  };
  const handleCfgSubmit = () => {
    if (cfg.nick == "" || cfg.ip == "" || cfg.pass == "" || cfg.distance == "") {
        handleBroadcastOpen(
            <div className='bc-content'>
                <h2>Ошибка</h2>
                <p>Вы не указали все необходимые данные!</p>
            </div>
        );
    } else {
        localStorage.setItem('cfg', JSON.stringify(cfg));
        handleCloseModal()
    }
  };
  const formatCoordinatesString = () => {
    const allCoordinates = [{ ...coordinates }, ...extraCoordinates];
    return allCoordinates.map(coord => `${coord.x},${coord.y},${coord.z}`).join('|');
  };
  const parseCoordinatesString = (coordsString) => {
    const coordsArray = coordsString.split('|').map(coordStr => {
        const [x, y, z] = coordStr.split(',');
        return { x: x || '', y: y || '', z: z || '' };
    });
    setCoordinates(coordsArray[0] || { x: '', y: '', z: '' });
    setExtraCoordinates(coordsArray.slice(1));
  };
  const handleChatChange = (chatType) => {
    setSelectedChat(chatType);
    // Здесь вы можете обновить состояние `messages` в зависимости от выбранного типа чата
    // if (chatType === 'Общий') setMessages([...]); 
  };
  return (
    <div>
      <Head>
        <title>Seven Aspects | TeslaCraft</title>
      </Head>
      <div className="title">
        <h1>Seven Aspects | TeslaCraft</h1>
      </div>
      <div className="main">
        <div className="chat-switchers">
            {chatTypes.map(chatType => (
            <button
                key={chatType}
                onClick={() => handleChatChange(chatType)}
                className={`chat-switcher ${selectedChat === chatType ? 'active' : ''}`}
            >
                {chatType}
            </button>
            ))}
        </div>

        <div className="chat-window" ref={chatWindowRef}>
            {error ? <div>Error: {error}</div> : messages.map((message, index) => (
            <div
                key={index}
                className={`chat-message ${message}`}
                dangerouslySetInnerHTML={{ __html: message }}
            />
            ))}
        </div>
        <div className="input-container">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите сообщение..."
          />
          <button onClick={handleSendMessage}>Отправить</button>
          <button onClick={handleClearChat} className="clear-button">Очистить чат</button>
        </div>
        <div className="buttons-container">
          <button className="action-button" onClick={(e) => handleButtonClick(e, 1)}>Управление ботом</button>
          <button className="action-button" onClick={(e) => handleButtonClick(e, 2)}>Перемещение на кординаты</button>
          <button className="action-button" onClick={(e) => handleButtonClick(e, 3)}>Наблюдение за игроками</button>
          <button className="action-button" onClick={(e) => handleButtonClick(e, 4)}>Подключить бота</button>
          <button className="action-button" onClick={(e) => handleButtonClick(e, 5)}>Автоматические сообщения</button>
          <button className="action-button" onClick={(e) => handleButtonClick(e, 6)}>Кнопка 6</button>
          <button className="action-button" onClick={(e) => handleButtonClick(e, 7)}>Кнопка 7</button>
          <button className="action-button" onClick={(e) => handleButtonClick(e, 8)}>Отключить бота</button>
          <button className="action-button" onClick={(e) => handleButtonClick(e, 9)}>Кнопка 9</button>
          <button className="action-button" onClick={(e) => handleButtonClick(e, 10)}>Кнопка 10</button>
          <button className="action-button" onClick={(e) => handleButtonClick(e, 11)}>Кнопка 11</button>
          <button className="action-button" onClick={(e) => handleButtonClick(e, 12)}>Переключить сервер</button>
        </div>
        <div className="modal" ref={modal1}>
            <div className="modal-content">
                <div className="divclose">
                    <span className="close" onClick={handleCloseModal} role="button" tabIndex="0">&times;</span>
                </div>
                <h2>Управление ботом</h2>
                <div className="wasd-container">
                    <div className="wasd-row">
                        <button className="wasd-button" ref={(el) => (wasdButtonsRef.current.w = el)} onClick={() => handleMove('w')}>W</button>
                    </div>
                    <div className="wasd-row">
                        <button className="wasd-button" ref={(el) => (wasdButtonsRef.current.a = el)} onClick={() => handleMove('a')}>A</button>
                        <button className="wasd-button" ref={(el) => (wasdButtonsRef.current.s = el)} onClick={() => handleMove('s')}>S</button>
                        <button className="wasd-button" ref={(el) => (wasdButtonsRef.current.d = el)} onClick={() => handleMove('d')}>D</button>
                    </div>
                    <div className="wasd-shift">
                        <button className="wasd-button" ref={(el) => (wasdButtonsRef.current.shift = el)} onClick={() => handleMove('shift')}>Shift</button>
                    </div>
                </div>
            </div>
        </div>
        <div id="modal2" className="modal" ref={modal2}>
            <div className="modal-content">
                <div className="divclose">
                    <span className="close" onClick={() => handleCloseModal(false)} role="button">&times;</span>
                </div>
                <div className="coordinates-container">
                    <input
                        id="coordinates-string-input"
                        type="text"
                        placeholder="x1,y1,z1|x2,y2,z2..."
                        value={formatCoordinatesString()}
                        onChange={handleCoordinatesStringChange}
                    />
                </div>
                <div className="coordinates-container">
                    <input
                        type="number"
                        id="x-coordinate"
                        name="x-coordinate"
                        placeholder="X"
                        value={coordinates.x}
                        onChange={(e) => handleMainCoordinateChange('x', e.target.value)}
                    />
                </div>

                <div className="coordinates-container">
                    <input
                        type="number"
                        id="y-coordinate"
                        name="y-coordinate"
                        placeholder="Y"
                        value={coordinates.y}
                        onChange={(e) => handleMainCoordinateChange('y', e.target.value)}
                    />
                </div>

                <div className="coordinates-container">
                    <input
                        type="number"
                        id="z-coordinate"
                        name="z-coordinate"
                        placeholder="Z"
                        value={coordinates.z}
                        onChange={(e) => handleMainCoordinateChange('z', e.target.value)}
                    />
                </div>

                {extraCoordinates.length > 0 ? (
                    extraCoordinates.map((coord, index) => (
                        <div key={coord.id} className="extra-coordinates-container">
                            <label className="coordinates-label">
                                Дополнительные координаты {index + 1}
                                <button 
                                    className="delete" 
                                    onClick={() => handleRemoveCoordinates(coord.id)}
                                >
                                    &times;
                                </button>
                            </label>
                            <input
                                type="number"
                                value={coord.x || ''}
                                onChange={(e) => handleInputChange(coord.id, 'x', e.target.value)}
                                placeholder="X"
                            />
                            <input
                                type="number"
                                value={coord.y || ''}
                                onChange={(e) => handleInputChange(coord.id, 'y', e.target.value)}
                                placeholder="Y"
                            />
                            <input
                                type="number"
                                value={coord.z || ''}
                                onChange={(e) => handleInputChange(coord.id, 'z', e.target.value)}
                                placeholder="Z"
                            />
                        </div>
                    ))
                ) : (
                    <p>Нет дополнительных координат.</p>
                )}

                <button className="cordbutton" onClick={handleCoordinatesSubmit}>Отправить координаты</button>
                <button className="cordbutton" onClick={handleAddCoordinates}>Добавить координаты</button>
            </div>

        </div>
        <div id="modal3" className="modal" ref={modal3}>
            <div className="modal-content">
                <div className="divclose">
                    <span className="close" onClick={() => handleCloseModal(false)} role="button">&times;</span>
                </div>
                <div className="messages-container">
                    <input
                        id="message-input"
                        type="text"
                        placeholder="Введите сообщение"
                        value={mainMessage}
                        onChange={(e) => setMainMessage(e.target.value)}
                    />
                </div>
                <div className="messages-container">
                    <input
                        type="number"
                        id="delay-input"
                        name="delay-input"
                        placeholder="Задержка в секундах"
                        value={mainDelay}
                        onChange={(e) => setMainDelay(e.target.value)}
                    />
                </div>

                {extraMessages.length > 0 ? (
                    extraMessages.map((message, index) => (
                        <div key={message.id} className="extra-messages-container">
                            <label className="messages-label">
                                Дополнительное сообщение {index + 1}
                                <button 
                                    className="delete" 
                                    onClick={() => handleRemoveMessage(message.id)}
                                >
                                    &times;
                                </button>
                            </label>
                            <input
                                type="text"
                                value={message.text || ''}
                                onChange={(e) => handleeInputChange(message.id, 'text', e.target.value)}
                                placeholder="Введите сообщение"
                            />
                            <input
                                type="number"
                                value={message.delay || ''}
                                onChange={(e) => handleeInputChange(message.id, 'delay', e.target.value)}
                                placeholder="Задержка в секундах"
                            />
                        </div>
                    ))
                ) : (
                    <p>Нет дополнительных сообщений.</p>
                )}

                <button className="cordbutton" onClick={handleSaveMessages}>Сохранить сообщения</button>
                <button className="cordbutton" onClick={handleAddMessage}>Добавить сообщение</button>
            </div>
        </div>
        <div id="modal4" className="modal" ref={modal4}>
          <div className="modal-content">
            <div className="divclose">
                <span className="close" onClick={handleCloseModal}>&times;</span>
            </div>
            <h2>Модальное окно</h2>
            <p>Это всплывающее окно с вашим содержимым.</p>
          </div>
        </div>
        <div id="modal5" className="modal" ref={modal5}> 
          <div className="modal-content">
            <h2>Данные бота</h2>
            <div className="coordinates-container">
                <input
                    type="text"
                    id="cfg.nick"
                    name="cfg.nick"
                    placeholder="Никнейм"
                    value={cfg.nick}
                    onChange={(e) => handleMainCfgChange('nick', e.target.value)}
                />
            </div>
            <div className="coordinates-container">
                <input
                    type="text"
                    id="cfg.ip"
                    name="cfg.ip"
                    placeholder="IP адрес сервера"
                    value={cfg.ip}
                    onChange={(e) => handleMainCfgChange('ip', e.target.value)}
                />
            </div>
            <div className="coordinates-container">
                <input
                    type="password"
                    id="cfg.pass"
                    name="cfg.pass"
                    placeholder="Пароль"
                    value={cfg.pass}
                    onChange={(e) => handleMainCfgChange('pass', e.target.value)}
                />
            </div>
            <div className="coordinates-container">
                <input
                    type="password"
                    id="cfg.pin"
                    name="cfg.pin"
                    placeholder="Пин-код (При наличии)"
                    value={cfg.pin}
                    onChange={(e) => handleMainCfgChange('pin', e.target.value)}
                />
            </div>
            <div className="coordinates-container">
                <input
                    type="text"
                    id="cfg.admins"
                    name="cfg.admins"
                    placeholder="Никнеймы админов бота (Ник1, ник2)"
                    value={cfg.admins}
                    onChange={(e) => handleMainCfgChange('admins', e.target.value)}
                />
            </div>
            <div className="coordinates-container">
                <select
                    id="cfg.distance"
                    name="cfg.distance"
                    value={cfg.distance}
                    onChange={(e) => handleMainCfgChange('distance', e.target.value)}
                >
                    <option value="far">Дальность прорисовки: Далеко</option>
                    <option value="normal">Дальность прорисовки: Нормально</option>
                    <option value="short">Дальность прорисовки: Близко</option>
                    <option value="tiny">Дальность прорисовки: Очень близко</option>
                </select>
            </div>
            <button className="cordbutton" onClick={handleCfgSubmit}>Сохранить</button>
          </div>
        </div>
        <div id="bc" className="bc" ref={bc}>
          <div className="bc-content">
            <div className="divclose">
                <span className="close" onClick={handleBroadcastClose}>&times;</span>
            </div>
            {broadcastMessage}
          </div>
        </div>
      </div>
      <style jsx>{`

      `}</style>
    </div>
  );  
}