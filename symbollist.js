const vscode = require('vscode');

(function(){


let VSymbolList = {};
VSymbolList.knownSymbols = {};
let panel;
let refreshing = false;

let webPreamble = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Symbol List</title>
</head>
<body>`;

let updateTimeout = 40;

VSymbolList.startWebView = function(){
    panel = vscode.window.createWebviewPanel('myob1','My Observables1',vscode.ViewColumn.Two,{});
    // Set initial content
    VSymbolList.updateWebview();
}

VSymbolList.updateWebview = function(){
    panel.webview.html = VSymbolList.getWebviewContent();
}

VSymbolList.updateSymbolViewer = function (name,value){
    VSymbolList.knownSymbols[name] = value;
    if(refreshing)
        return;
    refreshing = true;
    setTimeout(function(){
        console.log("Refreshing value");
        panel.webview.html = VSymbolList.getWebviewContent();
        refreshing = false;
    },updateTimeout);
}

VSymbolList.getWebviewContent = function(){
    let output = webPreamble;

    for(s in VSymbolList.knownSymbols){
        output += `<p><b>${s}</b>: ${VSymbolList.knownSymbols[s]}</p>`;
    }

    output += "</body></html>";
        return output;
}
  module.exports = {VSymbolList}
})();