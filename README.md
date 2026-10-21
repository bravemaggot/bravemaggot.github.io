# Портфолио bravemaggot — живой индекс

Обновлено: 2026-10-21. Статусы: 🟢 живое и проверенное · 🟡 построено, ждёт токен/тест

## Лендинг
- 🟢 https://bravemaggot.github.io — «Забираю рутину в ботов за 1–2 недели», аудитория: заказчики автоматизации. Пересобран с нуля по системе landing-page-design (Manrope, тёмная палитра, tagline-reveal, ambient-фон, count-up). Запушен и проверен живым (коммиты до 8b46b17). В ссылках плейсхолдеры `*_BOT_PLACEHOLDER` — заменить при получении юзернеймов ботов.

## n8n-сервисы (локальный n8n 2.43.4, Tailscale)
| Сервис | Workflow id | Статус | Что делает |
|---|---|---|---|
| Парсер TG-каналов | d4kkVX59SOUCfWYl | 🟡 активен, живой тест не пройден | Подписки на публичные каналы (/add /list /now /remove), AI-дайджест новых постов по расписанию (t.me/s парсинг + OpenRouter) |
| Приёмная заказов | pINzXMMWsysTHGKa | 🟡 задеплоен, не активирован (ждёт токен) | Клиенты пишут боту → AI структурирует бриф → карточка владельцу, очередь /orders /take /done /reject |

Артефакты: `~/Work/workflows/v3/` (build_parser.py, parser.json, build_orders.py, orders.json).
Дата-таблицы: tg_channels (7ASD9juyPenGn95T), orders (rw3UAeFRH7LT7Yv0), orders_config (t3mKcx8ojGwi72Nx).

## Код-боты (grammY + OpenRouter, локальный systemd)
| Бот | Папка | Статус | Что делает |
|---|---|---|---|
| Адвокат дьявола | ~/Work/bot-devils-advocate | 🟡 код готов, ждёт токен | Стресс-тест решения: разбор → атака/защита/вердикт (inline-кнопки) |
| Собеседатор | ~/Work/bot-interviewer | 🟡 код готов, ждёт токен | Тренировочное собеседование: 6 ролей, 5 вопросов, разбор с оценкой |

## Удалено по решению пользователя
- Воркфлоу «Игра» (RPG-бот) — бэкап: ~/Work/workflows/backup-game-2026-10-21.json

## Ждёт от пользователя
1. Тест парсера: @BraveMaggot_Bot → /start, /add durov 1, /now durov
2. 4 токена ботов от @BotFather
3. OpenRouter API-ключ (для код-ботов)
4. Ок на git push лендинга
