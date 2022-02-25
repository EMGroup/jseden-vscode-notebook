// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');

let cli = require("./js-eden/js/cli.js");
const { VSymbolList } = require('./symbollist.js');
const {SymbolView} = require('./symbolview.js');
const {EdenScript} = require('./edenscript.js');
const { clearTimeout } = require('timers');


// Eden.Selectors.query = function(s, o, options, cb) {
// 	console.log("Running dummy query");
// 	cb([]);
// }


let jsedenRunning = false;

function startJSEden(){
	console.log("Initialising JSEden");
	cli.CLIEden.Eden.projectPath = vscode.extensions.getExtension("undefined_publisher.construalcode").extensionPath + "/js-eden/";
	cli.CLIEden.startCommandLine();
	cli.CLIEden.eden.root.addGlobal(symbolChanged);
	cli.CLIEden.EdenSymbol = function(){};
	cli.CLIEden.EdenSymbol.prototype.value = function(){};
	global.eden = cli.CLIEden.eden;
	global.Eden = cli.CLIEden.Eden;
	jsedenRunning = true;
	VSymbolList.startWebView();
}

async function exec(str){
	return await cli.CLIEden.eden.exec(str);
}

function getValue(str){
	let value = cli.CLIEden.eden.root.lookup(str).value();
	// console.log("Value of " + str + " is " + value);
	return value;
}

function symbolChanged(sym, kind){
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
	SymbolView.updateSymbol(sym.name,latestValue);
	// VSymbolList.updateSymbolViewer(sym.name,latestValue);
}

function resetFragmentSource(){
	let editor = vscode.window.activeTextEditor;
	let thisFrag = EdenScript.fragments[editor.document.fileName];
	if(typeof thisFrag !== 'undefined'){
		thisFrag.setSource(editor.document.getText());
	}
}
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	jsedenRunning = false;
	SymbolView.activate();

	global.dc = vscode.languages.createDiagnosticCollection('eden');
	
	
	vscode.workspace.onDidChangeTextDocument(function(){
		// if(global.scriptTimeout != undefined){
			clearTimeout(global.scriptTimeout);
			global.scriptTimeout = setTimeout(resetFragmentSource,500);
		// }
	});

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('construalcode.runCode', function () {

		if(!jsedenRunning)
			startJSEden();

		// Display a message box to the user
		// vscode.window.showInformationMessage('Hello World from construalcode!');

		global.EdenSymbol = cli.CLIEden.EdenSymbol;
		
		eden.project = new Eden.Project(undefined, "VSCode Experiment", "", eden);
		eden.project.start();

		
		Eden.Fragment.listenTo("errored", this, function(frag) {
			console.log("Error detetected")
		});
		
		let editor = vscode.window.activeTextEditor;
		// console.log(editor.document.fileName);
		EdenScript.createFragment(editor.document.fileName, function(){
			let thisFrag = EdenScript.fragments[editor.document.fileName];


			thisFrag.setSource(editor.document.getText());
			thisFrag.ast.executeStatement(thisFrag.originast, eden.root.scope, thisFrag);

			remakeErrors(editor.document.fileName,thisFrag.ast.errors);
		});

		remakeErrors();

		});
	context.subscriptions.push(disposable);
	
	disposable = vscode.commands.registerCommand('construalcode.runLine', function () {
		executeSelected();
	});
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() {}

let executeSelected = function() {
	let editor = vscode.window.activeTextEditor;
	let i = editor.selection.start.line;

	let thisFrag = EdenScript.fragments[editor.document.fileName];

	var stat = thisFrag.ast.script.getStatementByLine(i);
	eden.project.ast.executeStatement(stat, eden.root.scope, eden.project);
	eden.root.lookup("jseden_fragment_executed").assign(".id("+stat.id+")", eden.root.scope, EdenSymbol.hciAgent);
}

function makeRealFile(name){

	var script = Eden.AST.parseStatement("action "+name+" {}");
	this.ast.script.appendChild(script);
	script.addIndex();
	//this.ast.scripts[name] = script;
	return script;

}
module.exports = {
	activate,
	deactivate
}


function remakeErrors(filename,errors){

	
	// vscode.window.showInformationMessage('Remaking errors');

	global.dc.clear();
	if(typeof errors == 'undefined' || errors.length == 0)
		return;
	let diagnosticMap = new Map();
	let canonicalFile = vscode.Uri.file(filename).toString();
	
	console.log(errors);
	for(let i = 0; i < errors.length; i++){
		let e = errors[i];
		let range = new vscode.Range(e.line - 1,0,e.line-1,vscode.window.activeTextEditor.document.lineAt(e.line - 1).range.end.character);
		let diagnostics = diagnosticMap.get(canonicalFile);
		if(!diagnostics){diagnostics = [];}
		diagnostics.push(new vscode.Diagnostic(range,e.toString(),vscode.DiagnosticSeverity.Error));
		diagnosticMap.set(canonicalFile,diagnostics);
	}
	diagnosticMap.forEach((diags,file)=>{
		global.dc.set(vscode.Uri.parse(file),diags);
	});

	// console.log(canonicalFile);
	// let range = new vscode.Range(1,1,1,3);
	// let diagnostics = diagnosticMap.get(canonicalFile);
	// if(!diagnostics){diagnostics = [];}
	// diagnostics.push(new vscode.Diagnostic(range,"Test message",vscode.DiagnosticSeverity.Error));
	// diagnosticMap.set(canonicalFile,diagnostics);

	// diagnosticMap.forEach((diags,file)=>{
	// 	dc.set(vscode.Uri.parse(file),diags);
	// });
}

function highlight(){
			// console.log("Setting source to ", editor.document.getText());
		// thisFrag.scratch = true;
		// thisFrag.makeReal(editor.document.fileName);
		// thisFrag.locked = false;
		// thisFrag.setSource(editor.document.getText());

		// const decorationType = vscode.window.createTextEditorDecorationType({
		// 	isWholeLine: true,
		// 	backgroundColor: "#124526",
		// 	fontWeight: "bold",
		// 	rangeBehavior: vscode.DecorationRangeBehavior.ClosedOpen,
		//   });
		// //   console.log(editor);
		//   let selText = editor.document.lineAt(editor.selection.start.line).text;
		//   // let selText = editor.document.getText(editor.selection).valueOf();

		//   editor.setDecorations(decorationType, [
		// 	  new vscode.Range(editor.selection.active, editor.selection.active),
		// 	]);
}