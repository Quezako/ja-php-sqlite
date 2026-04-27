function extractLevelClass(value) {
    const level = Number(value || 0);
    return Number.isFinite(level) ? `N${level}` : 'N0';
}

function sanitizeKey(value) {
    return String(value || '').replace(/'/g, "\\'");
}

function renderJapaneseRows(grammarRows, vocabRows) {
    let html = '';

    for (const row of grammarRows) {
        const levelClass = extractLevelClass(row.level);
        const ruby = toRubyText(row.Grammar || '');
        html += `<tr class="gramm ${levelClass}"><td onclick="openDiv('gramm', '${row.order}', '')"><span class="tag_${levelClass}">${levelClass}</span><a>${ruby}</a><br>${row.GramMeaningFR || ''}</td></tr>`;
    }

    for (const row of vocabRows) {
        const levelClass = extractLevelClass(row.level);
        const ruby = toRubyText(row.key || '');
        html += `<tr class="voc ${levelClass}"><td onclick="openDiv('voc', '0', '${sanitizeKey(row.key)}')"><span class="tag_${levelClass}">${levelClass}</span><a>${ruby}</a><br>${row.mean || ''}</td></tr>`;
    }

    document.getElementById('tbody').innerHTML = html;
}

async function dbSearch(search) {
    try {
        const data = await apiGet('japanese_search', { q: search });
        renderJapaneseRows(data.grammar || [], data.vocab || []);
    } catch (error) {
        console.error(error);
        document.getElementById('tbody').innerHTML = `Erreur: ${error.message}`;
    }
}

function buildWordLinks(row) {
    const kanjiKey = row.kanji_only || row.key || '';
    const kanaKey = row.yomi || '';

    let links = '';
    links += `Sound: <a href='https://assets.languagepod101.com/dictionary/japanese/audiomp3.php?kanji=${encodeURIComponent(kanjiKey)}&kana=${encodeURIComponent(kanaKey)}'>Pod101</a> `;
    links += `<a href='https://forvo.com/word/${encodeURIComponent(kanjiKey)}/#ja'>Forvo</a> `;
    links += `<a href='https://jisho.org/search/${encodeURIComponent(kanjiKey + ' ' + kanaKey)}'>Jisho</a>`;
    return `<tr class="voc"><td>${links}</td></tr>`;
}

async function openDiv(type, orderValue, key) {
    try {
        let data;
        if (type === 'gramm') {
            data = await apiGet('japanese_detail', { type, order: Number(orderValue) });
        } else {
            data = await apiGet('japanese_detail', { type, key });
        }

        if (!data.row) {
            return;
        }

        let html = renderDetailTable(data.row, type);
        if (type === 'voc') {
            html = html.replace('</table>', `${buildWordLinks(data.row)}</table>`);
        }

        document.querySelector('.dynamicText').innerHTML = html;
        document.getElementById('myModal').style.display = 'block';
    } catch (error) {
        console.error(error);
    }
}

window.openDiv = openDiv;
window.toggleTr = toggleTr;

function isButtonActive(button) {
    return !button.classList.contains('is-off');
}

function setButtonState(button, active) {
    button.classList.toggle('is-on', active);
    button.classList.toggle('is-off', !active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
}

function applyFilters() {
    document.querySelectorAll('tr').forEach((row) => {
        row.style.display = 'table-row';
    });

    document.querySelectorAll('#options button').forEach((button) => {
        if (isButtonActive(button)) {
            return;
        }

        const targetClass = button.textContent.trim();
        document.querySelectorAll(`tr.${targetClass}`).forEach((row) => {
            row.style.display = 'none';
        });
    });
}

function toggleTr(target) {
    const button = document.getElementById(`toggle_${target}`);
    if (!button) {
        return;
    }

    setButtonState(button, !isButtonActive(button));
    applyFilters();
}

document.addEventListener('DOMContentLoaded', () => {
    modalSetup();

    const searchInput = document.getElementById('search');
    const tbody = document.getElementById('tbody');
    let timer;

    document.querySelectorAll('#options button').forEach((button) => {
        setButtonState(button, true);
    });

    searchInput.addEventListener('input', (event) => {
        clearTimeout(timer);

        const element = event.target;
        const start = element.selectionStart;
        const end = element.selectionEnd;
        element.value = element.value.toLowerCase();
        element.setSelectionRange(start, end);

        const value = element.value.trim();
        timer = setTimeout(() => {
            if (value === '') {
                tbody.innerHTML = '';
                return;
            }
            tbody.innerHTML = 'loading...';
            dbSearch(value).then(() => {
                applyFilters();
            });
        }, 450);
    });

    searchInput.focus();
});
