async function loadKanjiPage() {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('kanji');

    if (!key) {
        document.querySelector('body').innerHTML = '<p>Ajoute `?kanji=日` dans l’URL.</p>';
        return;
    }

    try {
        const [frontTpl, backTpl, data] = await Promise.all([
            fetch('front.tpl', { cache: 'no-store' }).then((response) => response.text()),
            fetch('back.tpl', { cache: 'no-store' }).then((response) => response.text()),
            apiGet('vocab_detail', { key })
        ]);

        if (!data.row) {
            document.querySelector('body').innerHTML = `<p>Aucun résultat pour ${escapeHtml(key)}</p>`;
            return;
        }

        const result = data.row;

        let template = backTpl.replace(/{{FrontSide}}/g, frontTpl);
        template = template.replace(/(edit):/g, '');
        template = template.replace(/(hint):/g, '');

        template = template.replace(/{{#([^}]+)}}([\s\S]*?){{\/\1}}/g, (full, fieldName, content) => {
            return result[fieldName] ? content : '';
        });

        template = template.replace(/{{\^([^}]+)}}([\s\S]*?){{\/\1}}/g, (full, fieldName, content) => {
            return result[fieldName] ? '' : content;
        });

        template = template.replace(/{{([^}]+)}}/g, (full, token) => {
            let value = result[token] ?? '';

            token.replace(/(kanji|kana|furigana):(.+)/g, (subFull, mode, fieldName) => {
                const source = result[fieldName] || '';

                if (mode === 'kanji') {
                    value = source.replace(/\[.+\]/g, '');
                } else if (mode === 'kana') {
                    value = source.replace(/.+\[(.+)\]/g, '$1');
                } else if (mode === 'furigana') {
                    value = source.replace(/([^ >\[]+)\[([^\]]+)\]/g, '<ruby>$1<rt>$2</rt></ruby>');
                }

                return '';
            });

            value = String(value).replace(
                /\[sound:([^\]]+)\]/g,
                '<audio hidden id="player$1" controls src="../assets/img/$1"></audio><div class="player" onclick="player=document.getElementById(\'player$1\'); if(player.paused){player.play()} else {player.pause(); player.currentTime = 0}"></div>'
            );

            return value;
        });

        template = rewriteAssetMediaPaths(template);

        document.querySelector('body').innerHTML = template;
    } catch (error) {
        console.error(error);
        document.querySelector('body').innerHTML = `<p>Erreur: ${escapeHtml(error.message)}</p>`;
    }
}

document.addEventListener('DOMContentLoaded', loadKanjiPage);
