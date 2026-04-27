<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,height=device-height,initial-scale=1.0" />
    <base target="_blank">
    <title>Japanese (PHP + SQLite)</title>
    <link rel="stylesheet" href="style.css">
    <script src="app.js" defer></script>
    <script src="japanese-page.js" defer></script>
</head>
<body>
    <input type="search" id="search" style="width:100%;font-size:.5em;" aria-label="search" />

    <table id="options">
        <caption>options</caption>
        <tbody>
            <tr>
                <th>
                    <button id="toggle_gramm" onClick="toggleTr('gramm');">gramm</button>
                    <button id="toggle_voc" onClick="toggleTr('voc');">voc</button>
                    <button id="toggle_N5" onClick="toggleTr('N5');">N5</button>
                    <button id="toggle_N4" onClick="toggleTr('N4');">N4</button>
                    <button id="toggle_N3" onClick="toggleTr('N3');">N3</button>
                    <button id="toggle_N2" onClick="toggleTr('N2');">N2</button>
                    <button id="toggle_N1" onClick="toggleTr('N1');">N1</button>
                    <button id="toggle_N0" onClick="toggleTr('N0');">N0</button>
                </th>
            </tr>
        </tbody>
    </table>

    <table id="list">
        <caption>list</caption>
        <tbody id="tbody"></tbody>
    </table>

    <div id="myModal" class="modal">
        <div class="modal-content">
            <span class="dynamicText"></span>
            <span class="close">&times;</span>
        </div>
    </div>
</body>
</html>
