const vscode = require('vscode');

let SymbolView = {};

SymbolView.activate = function(){
	console.log("Activating symbol view");
	SymbolView.dataprovider = new TreeDataProvider();
	vscode.window.registerTreeDataProvider('symbolView', this.dataprovider);
}

SymbolView.updateSymbol = function(n, v){
	this.dataprovider.updateSymbol(n,v);
};


class TreeDataProvider{

	constructor(){
		this.data = [];
		this.knownSymbols = {};
		this._onDidChangeTreeData = new vscode.EventEmitter();
		this.onDidChangeTreeData = this._onDidChangeTreeData.event;
	}

	updateSymbol(n, v){
		this.knownSymbols[n] = n + " = " + v.toString();		
		this.refresh();
	}

	getTreeItem(element){
		// console.log("getTreeItem",element);
		return element;
	}

	getChildren(e){
		console.log("Getting child", e);
		if(e === undefined){
			this.data = [];

			for(const [key, value] of Object.entries(this.knownSymbols)){
				this.data.push(new vscode.TreeItem(value));
			}

			return this.data;
		}
		return e.children;
	}

	refresh(){
		// var l = "a" + Math.round(new Date()/1000);
		// this.data = [new vscode.TreeItem(l)];
		this._onDidChangeTreeData.fire();
	}

}

console.log(SymbolView);
module.exports = {SymbolView};