#!/bin/bash

echo "========================================"
echo "  Быстрое развертывание на GitHub"
echo "========================================"
echo ""

echo "[1/5] Инициализация Git..."
git init
if [ $? -ne 0 ]; then
    echo "ОШИБКА: Git не установлен"
    echo "Установите Git: https://git-scm.com/"
    exit 1
fi

echo "[2/5] Добавление файлов..."
git add .

echo "[3/5] Создание коммита..."
git commit -m "Initial commit: Yandex Maps Task Manager Extension v1.5.0"

echo "[4/5] Подключение к GitHub..."
git remote add origin https://github.com/MOneK292/yndx-plgn.git

echo "[5/5] Отправка кода на GitHub..."
git branch -M main
git push -u origin main

if [ $? -ne 0 ]; then
    echo ""
    echo "ОШИБКА: Не удалось отправить код на GitHub"
    echo "Возможные причины:"
    echo "- Репозиторий не создан на GitHub"
    echo "- Нет прав доступа"
    echo "- Проблемы с аутентификацией"
    echo ""
    echo "Попробуйте выполнить команды вручную:"
    echo "  git remote add origin https://github.com/MOneK292/yndx-plgn.git"
    echo "  git push -u origin main"
    exit 1
fi

echo ""
echo "========================================"
echo "  ✓ Успешно развернуто на GitHub!"
echo "========================================"
echo ""
echo "Откройте: https://github.com/MOneK292/yndx-plgn"
echo ""
