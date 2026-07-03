https://schoolghga-dotcom.github.io/wedding/

## Анкета через Google Sheet

Сайт умеет сохранять ответы гостей в Google Таблицу через Google Apps Script.
Пока `sheetApiUrl` в `script.js` пустой, анкета работает в старом локальном
режиме через `localStorage`.

### Как подключить таблицу

1. Создать Google Таблицу для ответов.
2. Открыть `Расширения` -> `Apps Script`.
3. Вставить в Apps Script код из `google-apps-script.gs`.
4. Нажать `Deploy` -> `New deployment` -> `Web app`.
5. Выбрать:
   - Execute as: `Me`
   - Who has access: `Anyone`
6. Нажать `Deploy` и скопировать Web app URL. Нужна ссылка, которая
   заканчивается на `/exec`, а не тестовая ссылка `/dev`.
7. В `script.js` вставить URL между кавычками в `sheetApiUrl`.
8. Если меняли код Apps Script после деплоя, открыть `Deploy` ->
   `Manage deployments` -> `Edit` и выбрать `New version`.
9. После публикации сайта открыть админ-панель. Если `sheetApiUrl` пустой,
   админка покажет, что ответы сохраняются только в текущем браузере.

Быстрая проверка Apps Script: открыть в браузере такую ссылку, заменив URL и
токен на свои:

```text
WEB_APP_URL?action=ping&token=admin2026&callback=test
```

Если подключение работает, страница покажет `test({"ok":true});`.

Если меняется пароль админки, стоит поменять его и в `adminPassword`, и в
`sheetApiToken` внутри `script.js`, и в `ADMIN_TOKEN` внутри Apps Script.
