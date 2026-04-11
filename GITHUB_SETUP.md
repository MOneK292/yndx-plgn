# Быстрая настройка GitHub

## Шаг 1: Подготовка

Убедитесь, что у вас установлен Git:
```bash
git --version
```

Если нет, скачайте с https://git-scm.com/

## Шаг 2: Настройка Git (первый раз)

```bash
git config --global user.name "MOneK292"
git config --global user.email "your-email@example.com"
```

## Шаг 3: Инициализация репозитория

Откройте терминал в папке проекта `D:\Python\plgn\plgn-stat`:

```bash
# Инициализация
git init

# Добавление всех файлов
git add .

# Первый коммит
git commit -m "Initial commit: Yandex Maps Task Manager Extension v1.5.0"

# Подключение к GitHub
git remote add origin https://github.com/MOneK292/yndx-plgn.git

# Отправка кода
git branch -M main
git push -u origin main
```

## Шаг 4: Проверка

Откройте https://github.com/MOneK292/yndx-plgn - код должен появиться!

## Что дальше?

### Обновление кода

```bash
# После изменений
git add .
git commit -m "описание изменений"
git push
```

### Создание релиза

1. Обновите версию в `manifest.json`
2. Обновите `CHANGELOG.md`
3. Выполните:
```bash
git add .
git commit -m "chore: bump version to 1.5.1"
git tag -a v1.5.1 -m "Release v1.5.1"
git push
git push --tags
```
4. Создайте релиз на GitHub: https://github.com/MOneK292/yndx-plgn/releases/new

## Полезные ссылки

- Репозиторий: https://github.com/MOneK292/yndx-plgn
- Подробная инструкция: см. DEPLOY.md
- Вклад в проект: см. CONTRIBUTING.md

## Проблемы?

Если возникли проблемы:
1. Проверьте, что репозиторий создан на GitHub
2. Проверьте права доступа
3. Попробуйте HTTPS вместо SSH
4. Создайте issue на GitHub
