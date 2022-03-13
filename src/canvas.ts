import * as vscode from 'vscode';
export class Canvas{
    panel:any;
    initialise(){
        this.panel = vscode.window.createWebviewPanel(
            'picture','Canvas',vscode.ViewColumn.Two,{enableScripts:true}
        );
    
        this.panel.webview.html = this.getWebviewContent();
        
        let me = this;
        let colors = ['red','green','blue','yellow'];
        let i = -1;
        let currentColour = -1;
        setInterval(function(){
            console.log("Sending message");
            while(i === currentColour){
                i = Math.floor(Math.random()*colors.length);
            }
            currentColour = i;
            console.log("Sending colour: " + colors[i]);
            me.panel.webview.postMessage({color: colors[i]});
        },1000);
    };
    getWebviewContent(){
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">

            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cat Coding</title>
        </head>
        <script>
            setTimeout(function(){console.log("Ready");},4000);
            window.addEventListener('message', event => {
                const message = event.data;
                document.body.style.backgroundColor = message.color;
            });
        </script>
        <body>
        </body>
        </html>`;
    }
}