---
description: Просьба записать русский документ. Ожидаем, что Claude откроет скил pishi-prosto и напишет файл простым языком. Нужен грант Write, поэтому запускай с --allow-tools Write.
expected_outcome: Файл onboarding.md записан, скил pishi-prosto был вызван, текст идёт законченными предложениями без канцелярита.
tags: [ru, document, write]
max_turns: 15
timeout_seconds: 400
allowed_tools: [Read, Write, Skill]
---

Напиши файл onboarding.md: инструкция для нового сотрудника, как в первый день получить доступ к почте, репозиторию и трекеру задач. Придумай разумные шаги сам, объём на одну страницу.
