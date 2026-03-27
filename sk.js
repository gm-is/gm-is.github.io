settings.scrollStepSize = 69;
settings.smoothscroll = true;


api.mapkey('F', 'Freedium.cfd' , function() {
    window.open("https://freedium-mirror.cfd/"+encodeURIComponent(window.location), '_self');
});


api.removeSearchAlias('b');
api.removeSearchAlias('w');
api.removeSearchAlias('s');
api.removeSearchAlias('e');
api.addSearchAlias('s', 'scholar', 'https://scholar.google.com/scholar?as_sdt=2007&hl=en&q=', 's')
api.addSearchAlias('w', 'wikipedia', 'https://en.wikipedia.org/wiki/', 's')
api.addSearchAlias('y', 'youtube', 'https://www.youtube.com/results?&sp=CAMSBAgFEAE%253D&search_query=', 's')
api.unmap('.');
api.unmap('[');
api.unmap(']');
api.unmap('c');
api.unmap('o');
api.unmap('U');
api.unmap('\'');


settings.blocklistPattern = /(((calendar|docs|mail).google|trello|duolingo|youtube|udemy|overleaf).com)|(learn.polyu.edu.hk/)/i


api.map('H','S'); // h b -> go one [H]istory [B]ack
api.map('L','D'); // l d -> [L]ets go one history forwar[D]
api.map('J','E'); // jk, er, tab navigation
api.map('K','R'); // jk, er, tab navigation
api.map('yf','ya');
api.map('ymf','yma');
api.Hints.setCharacters("asdfgqwertzxcvb");
api.Hints.style(" \
    font-family: Roboto, sans serif; \
    font-size: 13px; \
    font-weight: 400; \
    border: unset; \
    padding: 2px; \
    color: #ffffff; \
    background: transparent; \
    background-color: #0000ff; \
");
// ffd700 gold
api.Hints.style(" \
    font-family: Roboto, sans serif; \
    font-size: 13px; \
    font-weight: 400; \
    border: unset; \
    padding: 2px; \
    color: #ffffff; \
    background: transparent; \
    background-color: #ff4081 \
    ", "text");
api.Visual.style('marks', 'background: transparent; background-color: #E60000');
// Emerald Green 007d14


api.Visual.style('cursor', 'background: transparent; background-color: #007d14');
// Husky Blue 053c7f
// Imperial Purple 7e2553
// Red: #E60000
// Grey: #333333


settings.theme = `
:root {
    --theme-ace-bg:#282828;
    --theme-ace-bg-accent:#3c3836;
    --theme-ace-fg:#ebdbb2;
    --theme-ace-fg-accent:#7c6f64;
    --theme-ace-cursor:#928374;
    --theme-ace-select:#458588;
}
#sk_editor {
    height: 50% !important;
    background: var(--theme-ace-bg) !important;
}
.ace-chrome .ace_print-margin, .ace_gutter, .ace_gutter-cell, .ace_dialog{
    background: var(--theme-ace-bg-accent) !important;
}
.ace_dialog-bottom{
    border-top: 1px solid var(--theme-ace-bg) !important;
}
.ace-chrome{
    color: var(--theme-ace-fg) !important;
}
.ace_gutter, .ace_dialog {
    color: var(--theme-ace-fg-accent) !important;
}
.ace_cursor{
    color: var(--theme-ace-cursor) !important;
}
.normal-mode .ace_cursor{
    background-color: var(--theme-ace-cursor) !important;
    border: var(--theme-ace-cursor) !important;
}
.ace_marker-layer .ace_selection {
    background: var(--theme-ace-select) !important;
}
.sk_theme {
    font-family: Input Sans Condensed, Charcoal, sans-serif;
    font-size: 11pt;
    background: #24272e;
    color: #abb2bf;
}
.sk_theme tbody {
    color: #fff;
}
.sk_theme input {
    color: #d0d0d0;
}
.sk_theme .url {
    color: #61afef;
}
.sk_theme .annotation {
    color: #56b6c2;
}
.sk_theme .omnibar_highlight {
    color: #528bff;
}
.sk_theme .omnibar_timestamp {
    color: #e5c07b;
}
.sk_theme .omnibar_visitcount {
    color: #98c379;
}
.sk_theme #sk_omnibarSearchResult ul li:nth-child(odd) {
    background: #303030;
}
.sk_theme #sk_omnibarSearchResult ul li.focused {
    background: #3e4452;
}
#sk_status, #sk_find {
    background: #3e4452;
    font-size: 11pt;
}`;
