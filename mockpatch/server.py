from uuid import UUID, uuid4

from fastapi import FastAPI, WebSocketDisconnect, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from fastapi.websockets import WebSocket

application = FastAPI()
application.mount(
    "/static", StaticFiles(directory="static"), name="static"
)


@application.get("/", response_class=RedirectResponse)
async def root():
    return "/static/index.html"


@application.get("/api/1.0/survey/{subject}")
async def survey(subject: UUID):
    return {
        "survey": {
            "uuid": str(subject),
            "name": "Опрос для слушателей курса «Основы программирования на Python»",
            "description": "Уважаемые участники курса «Основы программирования на Python»! Приглашаем вас принять участие в кратком анонимном опросе, цель которого — лучше понять ваши образовательные потребности, уровень подготовки и ожидания от курса. Ваши ответы помогут адаптировать программу обучения, оптимизировать подачу материала и внести изменения, которые сделают курс максимально полезным именно для вас. Опрос займет не более 5 минут, но его результаты станут ценным источником информации для улучшения структуры лекций, практических заданий и дополнительных ресурсов. Ваше мнение важно — оно позволит создать более персонализированный и эффективный образовательный опыт, а также укрепить обратную связь между слушателями и преподавателями. Благодарим за вклад в развитие курса!"
        },
        "questions": [
            {
                "uuid": str(uuid4()),
                "name": "Оцените уровень Вашей подготовки в программировании на Python.",
                "answers": [
                    {
                        "uuid": str(uuid4()),
                        "name": "Высокий",
                    },
                    {
                        "uuid": str(uuid4()),
                        "name": "Средний",
                    },
                    {
                        "uuid": str(uuid4()),
                        "name": "Начальный",
                    },
                    {
                        "uuid": str(uuid4()),
                        "name": "Нулевой",
                    },
                ]
            },
            {
                "uuid": str(uuid4()),
                "name": "Был ли у Вас опыт обучения программированию на Python до начала прохождения курса?",
                "answers": [
                    {
                        "uuid": str(uuid4()),
                        "name": "Нет, опыт обучения отсутствовал",
                    },
                    {
                        "uuid": str(uuid4()),
                        "name": "Да, я изучал статьи и литературу, проходил онлайн-курсы",
                    },
                    {
                        "uuid": str(uuid4()),
                        "name": "Да, я посещал очные учебные курсы",
                    },
                    {
                        "uuid": str(uuid4()),
                        "name": "Да, у меня есть дипломы/сертификаты образовательных программ",
                    },
                ]
            },
            {
                "uuid": str(uuid4()),
                "name": "Был ли у Вас опыт работы с применением программирования на Python?",
                "answers": [
                    {
                        "uuid": str(uuid4()),
                        "name": "Нет, не было",
                    },
                    {
                        "uuid": str(uuid4()),
                        "name": "Да, был непродолжительный опыт",
                    },
                    {
                        "uuid": str(uuid4()),
                        "name": "Да, был продолжительный опыт",
                    },
                ]
            },
        ]
    }


@application.post("/api/1.0/survey/{subject}")
async def survey(subject: UUID, request: Request):
    data = await request.json()

    return {
        "status": "ok",
        "uuid": str(subject),
        "data": data
    }


# @application.websocket("/api/1.0/support/{subject}/ws")
# async def support(subject: UUID, websocket: WebSocket):
#     await websocket.accept()

#     while True:
#         try:
#             data = await websocket.receive_text()
#             await websocket.send_text(f"Ваш запрос: {data!r} в тематике с UUID: {subject!r}.")

#         except WebSocketDisconnect:
#             break

from random import uniform
from asyncio import sleep
from json import loads

@application.websocket("/api/1.0/support/{subject}/ws")
async def support(subject: UUID, websocket: WebSocket):
    await websocket.accept()

    while True:
        try:
            _data = await websocket.receive_text()
            data = loads(_data)

            for word in '''Задачи

                            1. Сделать проект
                            2. **Написать** документацию
                            3. Проверить **код**

                            Вот пример кода:

                            ```javascript
                            function add(a, b) {
                                return a + b;
                            }```
                            #Главный заголовок
                            ##Второстепенный заголовок
                            ###Ещё один заголовок
                            Это **жирный** текст и это *курсив*.
                            1. Первая задача
                            2. Вторая задача
                            3. Третья задача
                            - Купите хлеб
                            - Сходите в магазин
                            - Позвоните другу
                            ![Описание изображения](https://avatars.mds.yandex.net/i?id=86ba9954145e8a162f198379e1c29a50df09310a-4888009-images-thumbs&n=13)
                            [Перейти на сайт](https://learn.javascript.ru)
                            Вот пример кода: `console.log("Hello, world!");`'''.split():
                await websocket.send_text(word)
                await sleep(uniform(0, .3))

        except WebSocketDisconnect:
            break




#"Операционная система восьмого поколения предлагает усовершенствованный механизм управления ресурсами обеспечения быстрого выполнения задач и высокой отзывчивости ОС, основанной на безопасности, надежности и инновациях. Новый современный интерфейс Astra Linux стал более интуитивным и удобным, что упрощает пользователям взаимодействие с системой."