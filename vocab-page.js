function renderVocabRows(rows) {
    let html = '';

    for (const row of rows) {
        const ruby = toRubyText(row.key || '');
        html += `<tr><td onclick="openDiv('${(row.key || '').replace(/'/g, "\\'")}')"><a>${ruby}</a><br>${row.mean || ''}</td></tr>`;
    }

    document.getElementById('tbody').innerHTML = html;
}

async function dbSearch(search) {
    const tbody = document.getElementById('tbody');
    try {
        const data = await apiGet('vocab_search', { q: search });
        renderVocabRows(data.rows || []);
    } catch (error) {
        console.error(error);
        tbody.innerHTML = `Erreur: ${error.message}`;
    }
}

async function openDiv(key) {
    try {
        const data = await apiGet('vocab_detail', { key });
        if (!data.row) {
            return;
        }

        document.querySelector('.dynamicText').innerHTML = renderDetailTable(data.row);
        document.getElementById('myModal').style.display = 'block';
    } catch (error) {
        console.error(error);
    }
}

window.openDiv = openDiv;

document.addEventListener('DOMContentLoaded', () => {
    modalSetup();

    const searchInput = document.getElementById('search');
    const tbody = document.getElementById('tbody');
    let timer;

    searchInput.addEventListener('input', (event) => {
        clearTimeout(timer);
        const value = event.target.value.trim();
        timer = setTimeout(() => {
            if (value === '') {
                tbody.innerHTML = '';
                return;
            }
            tbody.innerHTML = 'loading...';
            dbSearch(value);
        }, 350);
    });

    searchInput.focus();
});
