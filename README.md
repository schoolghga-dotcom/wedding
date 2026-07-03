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
6. Скопировать Web app URL.
7. В `script.js` вставить URL в `sheetApiUrl`.

Если меняется пароль админки, стоит поменять его и в `adminPassword`, и в
`sheetApiToken` внутри `script.js`, и в `ADMIN_TOKEN` внутри Apps Script.
