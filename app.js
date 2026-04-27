function toRubyText(value) {
    return `<ruby>${String(value || '').replace(/\[/g, '<rt>').replace(/\]/g, '</rt>')}</ruby>`;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function apiGet(action, params = {}) {
    const query = new URLSearchParams({ action, ...params });
    const response = await fetch(`api.php?${query.toString()}`, { cache: 'no-store' });
    const data = await response.json();

    if (!response.ok || !data.ok) {
        throw new Error(data.error || `Erreur API: ${response.status}`);
    }

    return data;
}

function rewriteAssetMediaPaths(value) {
    return String(value).replace(
        /src=(['"])(?!https?:|data:|\/|\.\.\/assets\/img\/)([^'"]+)\1/g,
        'src=$1../assets/img/$2$1'
    );
}

function formatValue(key, value) {
    if (value == null) {
        return '';
    }

    let rendered = String(value);

    if (key === 'Sentence' || key === 'Grammar' || key === 'key' || key === 'voc_furi' || key === 'voc_sentence_ja' || key === 'kanji_only') {
        rendered = rendered
            .split(' ')
            .map((part) => toRubyText(part))
            .join('')
            .replace(/{{c1::/g, '<span style="color:red">')
            .replace(/}}/g, '</span>');
    }

    if (key === 'SentenceAudio' || key === 'voc_sentence_audio') {
        rendered = rendered
            .replace(/\[sound:/g, '<audio controls><source src="../assets/img/')
            .replace(/\]/g, '" /></audio>');
    }

    if (key === 'voc_image' || key === 'voc_sentence_img') {
        rendered = rewriteAssetMediaPaths(rendered);
    }

    return rewriteAssetMediaPaths(rendered);
}

function modalSetup() {
    const modal = document.getElementById('myModal');
    const closeButton = document.querySelector('.close');

    if (!modal || !closeButton) {
        return;
    }

    closeButton.onclick = () => {
        modal.style.display = 'none';
    };

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            modal.style.display = 'none';
        }
    });
}

function renderDetailTable(row, className = '') {
    let html = '';

    for (const [key, value] of Object.entries(row || {})) {
        if (value == null || value === '') {
            continue;
        }

        html += `<tr class="${className}"><td><b>${escapeHtml(key)} :<br></b>${formatValue(key, value)}</td></tr>`;
    }

    return `<table>${html}</table>`;
}
