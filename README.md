# ja-php-sqlite

Version PHP + SQLite des pages présentes dans `ja-js-sqlite`.

## Pages

- `index.php`
- `japanese.php`
- `grammar.php`
- `vocab.php`
- `dict-game.php`
- `kanji.php?kanji=日`

## API

Endpoint unique: `api.php?action=...`

Actions disponibles:

- `grammar_search&q=...`
- `grammar_detail&order=...`
- `vocab_search&q=...`
- `vocab_detail&key=...`
- `japanese_search&q=...`
- `japanese_detail&type=gramm&order=...`
- `japanese_detail&type=voc&key=...`
- `dict_random&jlpt=5`

## Lancement local (exemple)

```bash
cd "/d/Dev/10-japanese/ja-php-sqlite"
php -S localhost:8080
```

Puis ouvrir:

- `http://localhost:8080/index.php`

## Dépendances

- PHP avec extension `pdo_sqlite`
- Bases SQLite disponibles dans `../assets/db/`
