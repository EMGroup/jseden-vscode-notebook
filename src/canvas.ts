import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { memoryUsage } from 'process';
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

        // this.getWebview().postMessage({color: "white"});
        // setInterval(function(){
        //     while(i === currentColour){
        //         i = Math.floor(Math.random()*colors.length);
        //     }
        //     currentColour = i;
        //     me.panel.webview.postMessage({color: colors[i]});
        // },1000);
    };

    getWebview(){
        return this.panel.webview;
    };

    getWebviewContent(){
        let p:string = vscode.extensions.getExtension("EMGroup.vscode-eden-notebook")?.extensionPath || "";
        if(p === ""){return;} 
        const filePath: vscode.Uri = vscode.Uri.file(path.join(p,'src','canvas','canvas.html'));
        return fs.readFileSync(filePath.fsPath,'utf8');
    }
}