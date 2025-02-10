# import asyncio
# import websockets

# async def handler(websocket):
#     while True:
#         try:
#             message = await websocket.recv()
#             print('Message from client:', message)
#             response = f"{message}"
#             await websocket.send(response)
#         except Exception as e:
#             print(f"Error: {e}")
#             break

# async def main():
#     async with websockets.serve(handler, "localhost", 8001):  # сервер на порту 8001
#         await asyncio.Future()  # сервер работает бесконечно

# if __name__ == "__main__":
#     asyncio.run(main())


import asyncio
import websockets
import random

responses = [
    "Привет! Чем могу помочь?",
    "Здравствуйте! Какой у вас вопрос?",
    "Доброго дня! Как я могу помочь?",
    "Как я могу помочь вам сегодня?",
    "Вас приветствует чат-бот. Задайте вопрос!",
    "Что вас интересует?",
    "Ваш вопрос важен для нас!",
    "Я вас слушаю!"
]

async def handler(websocket):
    while True:
        try:
            message = await websocket.recv()
            msg = responses[random.randint(0,7)]
            print('Message from client:', msg)
            response = f"{msg}"
            await websocket.send(response)
        except Exception as e:
            print(f"Error: {e}")
            break

async def main():
    async with websockets.serve(handler, "localhost", 8001):  
        await asyncio.Future() 

if __name__ == "__main__":
    asyncio.run(main())

