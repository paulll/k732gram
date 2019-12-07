# Вебчат


## Сервисы

- nginx - реверс-прокси и сервер для статики, конфиги в `config/nginx.conf`
- [centrifugo](https://centrifugal.github.io/centrifugo/) - сервер для рассылки сообщений в реальном времени. Конфиги в `config/centrifugo.json`
- k732gram - сервер самого приложения на django-rest-framework
- postgres - БД, данные в docker-разделе, как указано в `docker-compose.yml`

## Как запускать

### Зависимости

Для запуска требуется:
`docker docker-compose python3`

Для сборки статики так же потребуется:
`nodejs npm` 

### Запуск

```
docker-compose up
xdg-open 'http://localhost/'
```

### Сборка статики

Установка утилит для сборки:
`npm i .`

Сборка:
`parcel build -d static views/im.pug`

Сборка с автоматической пересборкой при обновлении файлов:
`parcel build -d static views/im.pug`

### Todo
 - [ ] объединить вью для добавления чата и редактирования списка участников
 - [ ] сортировка чатов по последнему сообщению
 - [ ] счетчики непрочитанных сообщений
 - [ ] адаптивное скрытие панели чатов, по аналогии как это сделано в telegram-desktop
