# Вебчат


## Сервисы

- nginx - реверс-прокси и сервер для статики, конфиги в `config/nginx.conf`
- [centrifugo](https://centrifugal.github.io/centrifugo/) - сервер для рассылки сообщений в реальном времени. Конфиги в `config/centrifugo.json`
- k732gram - сервер самого приложения на django-rest-framework
- postgres - БД, данные в docker-разделе, как указано в `docker-compose.yml`

## Как запускать

### Зависимости

Для запуска:
`docker docker-compose python3`

Для сборки статики (собранная лежит в `static`, для простого запуска без редактирования фронтэнда нет нужды в этом):
`nodejs npm` 

### Запуск

```
docker-compose up
xdg-open 'http://localhost/'
```

### Регистрация админа
```
docker-compose run django python manage.py createsuperuser
```

### Сборка статики

Установка утилит для сборки:
`npm i .`

Сборка:
`npm run-script build`

Сборка с автоматической пересборкой при обновлении файлов:
`npm run-script watch`