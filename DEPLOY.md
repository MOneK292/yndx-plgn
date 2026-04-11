# Инструкция по развертыванию в GitHub

## Первоначальная настройка

### 1. Инициализация Git репозитория

```bash
# Перейдите в папку проекта
cd D:\Python\plgn\plgn-stat

# Инициализируйте Git (если еще не сделано)
git init

# Добавьте все файлы
git add .

# Создайте первый коммит
git commit -m "Initial commit: Yandex Maps Task Manager Extension v1.4.5"
```

### 2. Подключение к GitHub

```bash
# Добавьте удаленный репозиторий
git remote add origin https://github.com/MOneK292/yndx-plgn.git

# Проверьте подключение
git remote -v

# Отправьте код на GitHub
git branch -M main
git push -u origin main
```

## Обновление кода

### Внесение изменений

```bash
# Проверьте статус
git status

# Добавьте измененные файлы
git add .

# Или добавьте конкретные файлы
git add manifest.json popup.js

# Создайте коммит с описанием
git commit -m "feat: добавлена новая функция X"

# Отправьте на GitHub
git push
```

### Типы коммитов

- `feat:` - новая функция
- `fix:` - исправление ошибки
- `perf:` - улучшение производительности
- `docs:` - изменения в документации
- `style:` - форматирование кода
- `refactor:` - рефакторинг
- `test:` - добавление тестов
- `chore:` - обновление зависимостей, конфигурации

## Создание релиза

### 1. Обновите версию

Отредактируйте `manifest.json`:
```json
{
  "version": "1.5.0"
}
```

### 2. Обновите CHANGELOG.md

Добавьте описание изменений в новой версии.

### 3. Создайте коммит и тег

```bash
# Коммит с версией
git add manifest.json CHANGELOG.md
git commit -m "chore: bump version to 1.5.0"

# Создайте тег
git tag -a v1.5.0 -m "Release v1.5.0"

# Отправьте на GitHub
git push
git push --tags
```

### 4. Создайте релиз на GitHub

1. Перейдите на https://github.com/MOneK292/yndx-plgn/releases
2. Нажмите "Create a new release"
3. Выберите тег v1.5.0
4. Заполните описание релиза
5. Прикрепите .zip архив с расширением (опционально)
6. Нажмите "Publish release"

## Создание архива для распространения

```bash
# Создайте архив без служебных файлов
zip -r yndx-plgn-v1.4.5.zip . -x "*.git*" "*.vscode*" "node_modules/*" "*.md" ".env*"
```

Или вручную:
1. Скопируйте папку проекта
2. Удалите: `.git`, `.vscode`, `.gitignore`, `*.md` файлы
3. Создайте .zip архив

## Полезные команды Git

```bash
# Просмотр истории
git log --oneline

# Откат последнего коммита (не отправленного)
git reset --soft HEAD~1

# Просмотр изменений
git diff

# Создание новой ветки
git checkout -b feature/new-feature

# Переключение между ветками
git checkout main

# Слияние ветки
git merge feature/new-feature

# Удаление ветки
git branch -d feature/new-feature
```

## Работа с .gitignore

Файл `.gitignore` уже настроен и исключает:
- Системные файлы (.DS_Store, Thumbs.db)
- IDE файлы (.vscode, .idea)
- Логи и временные файлы
- Файлы сборки
- Приватные ключи (.pem)

## Безопасность

⚠️ **НИКОГДА не коммитьте:**
- Приватные ключи (.pem файлы)
- Токены доступа
- Пароли
- Персональные данные

Если случайно закоммитили чувствительные данные:
```bash
# Удалите файл из истории
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/file" \
  --prune-empty --tag-name-filter cat -- --all

# Принудительно отправьте изменения
git push origin --force --all
```

## Проблемы и решения

### Конфликты при push

```bash
# Получите последние изменения
git pull --rebase origin main

# Разрешите конфликты вручную
# Затем продолжите
git rebase --continue

# Отправьте изменения
git push
```

### Отмена изменений

```bash
# Отменить изменения в файле (не закоммиченные)
git checkout -- filename

# Отменить все изменения
git reset --hard HEAD

# Отменить последний коммит (сохранив изменения)
git reset --soft HEAD~1
```

## Настройка GitHub Actions (опционально)

Создайте `.github/workflows/test.yml` для автоматического тестирования:

```yaml
name: Test Extension

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Validate manifest
        run: |
          if ! jq empty manifest.json; then
            echo "Invalid manifest.json"
            exit 1
          fi
```

## Дополнительные ресурсы

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Chrome Extension Publishing](https://developer.chrome.com/docs/webstore/publish/)
