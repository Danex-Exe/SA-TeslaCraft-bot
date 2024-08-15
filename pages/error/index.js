import Head from 'next/head';

export default function Chat() {
  return (
    <div>
      <Head>
        <title>NeuroBot | Error</title>
      </Head>
      <div class="menu">
          <h1>NeuroBot</h1>
          <div class="links">
              <a href="/labirint">Лабиринт</a>
              <a href="/chat">Чат</a>
              <a href="/list">Список игроков</a>
          </div>
      </div>
      <div class="main">
        <h2 class="error">Страница не найденна!</h2>
      </div>
    </div>
  );
}