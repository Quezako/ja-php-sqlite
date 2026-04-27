async function start() {
    try {
        const data = await apiGet('dict_random', { jlpt: '5' });
        const row = data.row;
        if (!row || !row.desc) {
            document.body.innerHTML = '<p>Aucune entrée trouvée.</p>';
            return;
        }

        const lines = String(row.desc).split('\n');
        const answer = lines[0] || '';
        const prompt = lines.slice(1).join('<br />');
        document.body.innerHTML = `${prompt}<br><br><details><summary>Answer:</summary>${answer}</details>`;
    } catch (error) {
        console.error(error);
        document.body.innerHTML = `<p>Erreur: ${error.message}</p>`;
    }
}

document.addEventListener('DOMContentLoaded', start);
