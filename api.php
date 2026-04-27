<?php
header('Content-Type: application/json; charset=utf-8');

function jsonResponse(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function dbPath(string $fileName): string
{
    return __DIR__ . '/../assets/db/' . $fileName;
}

function openDb(string $fileName): PDO
{
    $path = dbPath($fileName);
    if (!is_file($path)) {
        jsonResponse(['ok' => false, 'error' => "DB introuvable: {$fileName}"], 500);
    }

    $pdo = new PDO('sqlite:' . $path, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    return $pdo;
}

function normalizeSearch(string $value): string
{
    $value = mb_strtolower(trim($value), 'UTF-8');

    $map1 = [
        'si' => 'shi',
        'tu' => 'tsu',
        'ti' => 'chi',
        'ty' => 'ch',
        'sy' => 'sh',
        'zi' => 'ji',
        'di' => 'ji',
        'du' => 'zu',
        'zy' => 'j',
        'dy' => 'j',
        'oo' => 'ou',
        'hu' => 'fu',
    ];

    $map2 = [
        'sfu' => 'shu',
        'cfu' => 'chu',
    ];

    $value = strtr($value, $map1);
    $value = strtr($value, $map2);
    return $value;
}

function tagLevel(?string $tags, string $regex): int
{
    if ($tags === null) {
        return 0;
    }
    if (preg_match($regex, $tags, $matches)) {
        return (int)$matches[1];
    }
    return 0;
}

function rowTagValue(array $row): ?string
{
    foreach ($row as $key => $value) {
        if (strcasecmp((string)$key, 'tags') === 0) {
            return $value === null ? null : (string)$value;
        }
    }

    return null;
}

function vocabJlptLevel(?string $tags): int
{
    if ($tags === null || $tags === '') {
        return 0;
    }

    if (preg_match('/JLPT::(?:K\d+::)?N?(\d+)/i', $tags, $matches)) {
        return (int)$matches[1];
    }

    return 0;
}

function grammarSearch(string $q): array
{
    $pdo = openDb('grammar.sqlite');

    $rows = [];

    $hasFts = (bool)$pdo->query("SELECT 1 FROM sqlite_master WHERE type='table' AND name='bunpro_fts' LIMIT 1")->fetchColumn();

    if ($hasFts) {
        $sql = 'SELECT b."order", b.Grammar, b.GramMeaningFR, b.Tags
                FROM bunpro_fts f
                JOIN Bunpro b ON b.rowid = f.rowid
                WHERE bunpro_fts MATCH :match
                GROUP BY b.Grammar
                ORDER BY b."order"
                LIMIT 30';

        try {
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':match', $q . '*', PDO::PARAM_STR);
            $stmt->execute();
            $rows = $stmt->fetchAll();
        } catch (Throwable $e) {
            $rows = [];
        }
    }

    if (!$hasFts || count($rows) === 0) {
        $sql = 'SELECT "order", Grammar, GramMeaningFR, Tags
                FROM Bunpro
                WHERE GramHira LIKE :like
                GROUP BY Grammar
                ORDER BY (CASE WHEN GramHira = :exact THEN 1 WHEN GramHira LIKE :prefix THEN 2 ELSE 3 END), Tags DESC
                LIMIT 30';
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':like', '%' . $q . '%', PDO::PARAM_STR);
        $stmt->bindValue(':exact', $q, PDO::PARAM_STR);
        $stmt->bindValue(':prefix', $q . '%', PDO::PARAM_STR);
        $stmt->execute();
        $rows = $stmt->fetchAll();
    }

    foreach ($rows as &$row) {
        $row['level'] = tagLevel(rowTagValue($row), '/BUNPRO::N?(\d+)/i');
    }

    return $rows;
}

function grammarDetail(int $order): ?array
{
    $pdo = openDb('grammar.sqlite');
    $stmt = $pdo->prepare('SELECT tags, Grammar, GramMeaningFR, GrammarStructureFR, GrammarNuanceFR, Sentence, SentenceFR, SentenceNuanceFR, SupplementalLinksFR, OfflineResourcesFR, GramMeaning, GrammarStructure, GrammarNuance, SentenceEN, SentenceNuance, SupplementalLinks, OfflineResources, SentenceAudio FROM bunpro WHERE "order" = :ord LIMIT 1');
    $stmt->bindValue(':ord', $order, PDO::PARAM_INT);
    $stmt->execute();
    $row = $stmt->fetch();
    return $row ?: null;
}

function vocabSearch(string $q): array
{
    $pdo = openDb('vocab.sqlite');
    $stmt = $pdo->prepare('SELECT key, mean, "order", Tags
                           FROM Quezako
                           WHERE version LIKE :like
                           ORDER BY (CASE WHEN version = :exact THEN 1 WHEN version LIKE :prefix THEN 2 ELSE 3 END), "order"
                           LIMIT 30');
    $stmt->bindValue(':like', '%' . $q . '%', PDO::PARAM_STR);
    $stmt->bindValue(':exact', $q, PDO::PARAM_STR);
    $stmt->bindValue(':prefix', $q . '%', PDO::PARAM_STR);
    $stmt->execute();
    $rows = $stmt->fetchAll();

    foreach ($rows as &$row) {
        $row['level'] = vocabJlptLevel(rowTagValue($row));
    }

    return $rows;
}

function vocabDetail(string $key): ?array
{
    $pdo = openDb('vocab.sqlite');
    $plainKey = preg_replace('/\[[^\]]+\]/u', '', $key) ?? $key;

    $stmt = $pdo->prepare('SELECT Tags, key, yomi, mean, voc_image, en_mean, voc_notes_personal, kanji_mnemo_personal, read_mnemo_personal, voc_sentence_ja, voc_sentence_fr, voc_sentence_img, chmn_mean, fr_components2, voc_alts, fr_mean_mnemo_wani, fr_compo_wani_name, fr_story_wani_mean, fr_mean_mnemo_wani2, fr_mean_mnemo_wani3, en_reading_info, en_reading_mnemonic, en_reading_mnemonic2, fr_chmn_mnemo, en_chmn_mnemo, kun_pre, kun_post, voc_furi, kanji_only, onyomi, kunyomi, kb_img, fr_kb_desc, jkm, en_jkm_headline, en_jkm_subtitle, fr_story, fr_component, fr_koohii_story_1, fr_koohii_story_2, fr_koohii_3, fr_story_rtk, fr_memrise_hint, fr_story_rtk_comment, fr_components3, compo_wani, fr_word, stroke_order, fr_notes, fr_voc_notes, en_heisigcomment, chmn_simple, chmn_lookalike, chmn_ref, kd_used_in_kanjis, primitive_of, usually_kana, version, "order", voc_mp3, voc_sentence_audio
                           FROM Quezako
                                    WHERE key = :key
                                        OR key LIKE :annotatedKey
                                        OR key LIKE :startsWithKey
                                        OR kanji_only = :plainKey
                           ORDER BY
                              CASE
                                  WHEN key = :key THEN 1
                                             WHEN key LIKE :annotatedKey THEN 2
                                             WHEN key LIKE :startsWithKey THEN 3
                                             WHEN kanji_only = :plainKey THEN 4
                                  ELSE 9
                              END,
                                        rowid
                           LIMIT 1');
    $stmt->bindValue(':key', $key, PDO::PARAM_STR);
    $stmt->bindValue(':plainKey', $plainKey, PDO::PARAM_STR);
    $stmt->bindValue(':annotatedKey', $plainKey . '[%', PDO::PARAM_STR);
    $stmt->bindValue(':startsWithKey', $plainKey . '%', PDO::PARAM_STR);
    $stmt->execute();
    $row = $stmt->fetch();
    return $row ?: null;
}

function japaneseSearch(string $q): array
{
    $normalized = normalizeSearch($q);

    return [
        'query' => $normalized,
        'grammar' => grammarSearch($normalized),
        'vocab' => vocabSearch($normalized),
    ];
}

function dictRandom(string $jlpt): ?array
{
    $pdo = openDb('dict.sqlite');
    $stmt = $pdo->prepare('SELECT * FROM dict WHERE tags LIKE :tag ORDER BY RANDOM() LIMIT 1');
    $stmt->bindValue(':tag', '%JLPT::' . $jlpt . '%', PDO::PARAM_STR);
    $stmt->execute();
    $row = $stmt->fetch();
    return $row ?: null;
}

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'grammar_search': {
            $q = trim((string)($_GET['q'] ?? ''));
            jsonResponse(['ok' => true, 'rows' => $q === '' ? [] : grammarSearch($q)]);
            break;
        }
        case 'grammar_detail': {
            $id = (int)($_GET['order'] ?? 0);
            jsonResponse(['ok' => true, 'row' => $id > 0 ? grammarDetail($id) : null]);
            break;
        }
        case 'vocab_search': {
            $q = trim((string)($_GET['q'] ?? ''));
            jsonResponse(['ok' => true, 'rows' => $q === '' ? [] : vocabSearch($q)]);
            break;
        }
        case 'vocab_detail': {
            $key = trim((string)($_GET['key'] ?? ''));
            jsonResponse(['ok' => true, 'row' => $key === '' ? null : vocabDetail($key)]);
            break;
        }
        case 'japanese_search': {
            $q = trim((string)($_GET['q'] ?? ''));
            jsonResponse(['ok' => true] + japaneseSearch($q));
            break;
        }
        case 'japanese_detail': {
            $type = trim((string)($_GET['type'] ?? ''));
            if ($type === 'gramm') {
                $order = (int)($_GET['order'] ?? 0);
                jsonResponse(['ok' => true, 'row' => $order > 0 ? grammarDetail($order) : null]);
                break;
            }
            if ($type === 'voc') {
                $key = trim((string)($_GET['key'] ?? ''));
                jsonResponse(['ok' => true, 'row' => $key === '' ? null : vocabDetail($key)]);
                break;
            }
            jsonResponse(['ok' => false, 'error' => 'Type invalide'], 400);
            break;
        }
        case 'dict_random': {
            $jlpt = preg_replace('/[^0-9]/', '', (string)($_GET['jlpt'] ?? '5'));
            if ($jlpt === '') {
                $jlpt = '5';
            }
            jsonResponse(['ok' => true, 'row' => dictRandom($jlpt)]);
            break;
        }
        default:
            jsonResponse(['ok' => false, 'error' => 'Action inconnue'], 400);
    }
} catch (Throwable $e) {
    jsonResponse(['ok' => false, 'error' => $e->getMessage()], 500);
}
