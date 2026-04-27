function renderGrammarRows(rows) {
    let html = '';

    for (const row of rows) {
        const ruby = toRubyText(row.Grammar || '');
        html += `<tr><td onclick="openDiv('${row.order}')"><a>${ruby}</a><br>${row.GramMeaningFR || ''}</td></tr>`;
    }

    document.getElementById('tbody').innerHTML = html;
}

async function dbSearch(search) {
    const table = document.getElementById('tbody');
    try {
        const data = await apiGet('grammar_search', { q: search });
        renderGrammarRows(data.rows || []);
    } catch (error) {
        console.error(error);
        table.innerHTML = `Erreur: ${error.message}`;
    }
}

async function openDiv(orderValue) {
    try {
        const data = await apiGet('grammar_detail', { order: Number(orderValue) });
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
        }, 400);
    });

    searchInput.focus();
});
