const path = require('path');
const {EdenScript} = require('../edenscript.js');
import { SymbolView } from './symbolview'; 
// const {SymbolView} = require("../symbolview.js");
import { exec } from 'child_process';
import * as vscode from 'vscode';
let cli = require("../js-eden/js/cli.js");
import { parseMarkdown, writeCellsToMarkdown, RawNotebookCell } from './markdownParser';

let global: any = {};
let EdenSymbol: any = {};
let jsedenRunning = false;
let mainSymbolView:SymbolView;
declare global{
	var EdenSymbol:any;
}

const providerOptions = {
	transientMetadata: {
		runnable: true,
		editable: true,
		custom: true,
	},
	transientOutputs: true
};

function symbolChanged(sym: any, kind: any){
    var latestValue;
    if(sym.cache.up_to_date){
        latestValue = sym.cache.value;
    }else{
        latestValue = sym.value();
    }
    var outputMessage = "";
    if(sym.definition){
        outputMessage = "[" + sym.getSource() + "]: " + latestValue;
    }else{
        outputMessage = sym.name + ": " + latestValue;
    }
    // console.log(outputMessage);
	if(latestValue === undefined){
		latestValue = "@";
	}
	mainSymbolView.updateSymbol(sym.name,latestValue);
}

function startJSEden(){
	console.log("Initialising JSEden");
	cli.CLIEden.Eden.projectPath = vscode.extensions.getExtension("EMGroup.vscode-eden-notebook")?.extensionPath + "/js-eden/";
	cli.CLIEden.startCommandLine();
	cli.CLIEden.eden.root.addGlobal(symbolChanged);
	cli.CLIEden.EdenSymbol = function(){};
	cli.CLIEden.EdenSymbol.prototype.value = function(){};
	EdenSymbol = cli.CLIEden.EdenSymbol;
	global.eden = cli.CLIEden.eden;
	global.Eden = cli.CLIEden.Eden;
	global.EdenSymbol = global.Eden.EdenSymbol;
	// console.log(global.eden);
	// console.log(global.Eden);
	jsedenRunning = true;
	// VSymbolList.startWebView();
}

function resetFragmentSource(){
	let editor = vscode.window.activeTextEditor;
	if(typeof editor === 'undefined'){return;};
	let thisFrag = EdenScript.fragments[editor.document.fileName];
	if(typeof thisFrag !== 'undefined'){
		thisFrag.setSource(editor.document.getText());
	}
}


export function activate(context: vscode.ExtensionContext) {
	jsedenRunning = false;
	mainSymbolView = new SymbolView();
	mainSymbolView.activate();

	global.dc = vscode.languages.createDiagnosticCollection("eden");

	// vscode.workspace.onDidChangeTextDocument(function(){
	// 	// if(global.scriptTimeout != undefined){
	// 		clearTimeout(global.scriptTimeout);
	// 		global.scriptTimeout = setTimeout(resetFragmentSource,500);
	// 	// }
	// });

	// Eden.Fragment.listenTo("errored",this,function(frag:any){
	// 	console.log("Error detected");
	// });
	
	context.subscriptions.push(vscode.workspace.registerNotebookSerializer('eden-notebook', new MarkdownProvider(), providerOptions));
	context.subscriptions.push(new Controller());


}

// there are globals in workers and nodejs
declare class TextDecoder {
	decode(data: Uint8Array): string;
}
declare class TextEncoder {
	encode(data: string): Uint8Array;
}

class MarkdownProvider implements vscode.NotebookSerializer {

	private readonly decoder = new TextDecoder();
	private readonly encoder = new TextEncoder();

	deserializeNotebook(data: Uint8Array, _token: vscode.CancellationToken): vscode.NotebookData | Thenable<vscode.NotebookData> {
		const content = this.decoder.decode(data);

		const cellRawData = parseMarkdown(content);
		const cells = cellRawData.map(rawToNotebookCellData);

		return {
			cells
		};
	}

	serializeNotebook(data: vscode.NotebookData, _token: vscode.CancellationToken): Uint8Array | Thenable<Uint8Array> {
		const stringOutput = writeCellsToMarkdown(data.cells);
		return this.encoder.encode(stringOutput);
	}
}

export function rawToNotebookCellData(data: RawNotebookCell): vscode.NotebookCellData {
	return <vscode.NotebookCellData>{
		kind: data.kind,
		languageId: data.language,
		metadata: { leadingWhitespace: data.leadingWhitespace, trailingWhitespace: data.trailingWhitespace, indentation: data.indentation },
		outputs: [],
		value: data.content
	};
}



  class Controller {
	readonly controllerId = 'eden-controller-id';
	readonly notebookType = 'eden-notebook';
	readonly label = 'Eden Notebook';
	readonly supportedLanguages = ["eden"];
  
	readonly dispose = function(){

	};
	private readonly _controller: vscode.NotebookController;
	private _executionOrder = 0;
  
	constructor() {
	  this._controller = vscode.notebooks.createNotebookController(
		this.controllerId,
		this.notebookType,
		this.label
	  );
  
	  this._controller.supportedLanguages = this.supportedLanguages;
	  this._controller.supportsExecutionOrder = true;
	  this._controller.executeHandler = this._execute.bind(this);
	}
  
	private _execute(
	  cells: vscode.NotebookCell[],
	  _notebook: vscode.NotebookDocument,
	  _controller: vscode.NotebookController
	): void {
	  for (let cell of cells) {
		this._doExecution(cell);
	  }
	}
  

	private async _doExecution(cell: vscode.NotebookCell): Promise<void> {
	  const execution = this._controller.createNotebookCellExecution(cell);
	//   console.dir(execution);
	  execution.executionOrder = ++this._executionOrder;
	  execution.start(Date.now()); // Keep track of elapsed time to execute cell.
  
	  /* Do some execution here; not implemented */
	  let Eden = global.Eden;
	  let eden = global.eden;
	  let editor = vscode.window.activeTextEditor;

	  if(!jsedenRunning){
		startJSEden();
		global.EdenSymbol = cli.CLIEden.EdenSymbol;
	  
		global.eden.project = new global.Eden.Project(undefined,"VSCode Notebook","",global.eden);
		global.eden.project.start();
	
		global.Eden.Fragment.listenTo("errored",this,function(frag: any){
			// console.log("Error");
			// console.dir(frag);
		});
	  }

	  let selector = execution.cell.document.fileName + ":" + execution.cell.index;

	  EdenScript.createFragment(selector, function(){
		let thisFrag = EdenScript.fragments[selector];
		thisFrag.setSource(execution.cell.document.getText());
		thisFrag.ast.executeStatement(thisFrag.originast,global.eden.root.scope,thisFrag);
		remakeErrors(execution.cell.document.fileName,thisFrag.ast.errors);
	  });	  
	  
	  execution.replaceOutput([
		new vscode.NotebookCellOutput([
		  vscode.NotebookCellOutputItem.text('Dummy output text!')
		])
	  ]);
	  execution.end(true, Date.now());
	}
  }

  function remakeErrors(filename:any,errors:any){
	global.dc.clear();
	if(typeof errors === 'undefined' || errors.length === 0){
		return;
	}
	let diagnosticMap = new Map();
	let canonicalFile = vscode.Uri.file(filename).toString();
	
	console.log(errors);
	if(typeof vscode.window.activeTextEditor === 'undefined'){return;}
	for(let i = 0; i < errors.length; i++){
		let e = errors[i];
		let range = new vscode.Range(e.line - 1,0,e.line-1,vscode.window.activeTextEditor.document.lineAt(e.line - 1).range.end.character);
		// let range = new vscode.Range(e.line,0,e.line,2);
		let diagnostics = diagnosticMap.get(canonicalFile);
		if(!diagnostics){diagnostics = [];}
		diagnostics.push(new vscode.Diagnostic(range,e.toString(),vscode.DiagnosticSeverity.Error));
		diagnosticMap.set(canonicalFile,diagnostics);
	}
	diagnosticMap.forEach((diags,file)=>{
		global.dc.set(vscode.Uri.parse(file),diags);
	});
}