<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,height=device-height,initial-scale=1.0" />
    <base target="_blank">
    <title>Grammar (PHP + SQLite)</title>
    <link rel="stylesheet" href="style.css">
    <script src="app.js" defer></script>
    <script src="grammar-page.js" defer></script>
</head>
<body>
    <input type="text" id="search" style="width:100%;font-size:.5em;" aria-label="search" />

    <table>
        <caption>results</caption>
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
