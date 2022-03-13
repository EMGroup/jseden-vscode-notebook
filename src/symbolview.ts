import * as vscode from 'vscode';
import { EventEmitter, Event } from 'vscode';

export class SymbolView{
	dataprovider:TreeDataProvider;
	constructor(){
		this.dataprovider = new TreeDataProvider();
	}
	activate(){
		this.dataprovider = new TreeDataProvider();
		vscode.window.createTreeView("symbolView",{treeDataProvider:this.dataprovider});
	}

	updateSymbol(n:string,v:string){
		this.dataprovider.updateSymbol(n,v);
	}
}

class TreeDataProvider implements vscode.TreeDataProvider<TreeItem>{
	data:TreeItem[];
	obs:TreeItem[];
	funcs:TreeItem[];
	obsDict: any = {};
	funcDict: any = {};

	obsList:TreeItem;
	funcList:TreeItem;

	private _onDidChangeTreeData: EventEmitter<TreeItem | undefined> = new EventEmitter<TreeItem | undefined>();

  	readonly onDidChangeTreeData: Event<TreeItem | undefined> = this._onDidChangeTreeData.event;

	constructor(){
		this.obs = [];
		this.funcs = [];
		this.obsList = TreeItem.makeTreeItem(
			'Observables', '',"heading", undefined, this.obs);
		this.funcList = TreeItem.makeTreeItem(
			'Functions', '', "heading", undefined, this.funcs);
		this.data = [
			this.obsList,
			this.funcList
		  ];
	}

	updateSymbol(sym:any,v:string){
		let n = sym.name;
		let prevVal:string = '@';
		if(categorize(sym) === "obs"){
			let symObject:TreeItem = this.obsDict[n];
			if(typeof this.obsDict[n] !== 'undefined'){
				prevVal = symObject.value || '';
			}
			if(prevVal !== v){
				this.obsDict[n] = TreeItem.makeTreeItem(n,v,sym.definition ? "def" : "obs",sym.getSource());
				this.obsList.children = [];
				for(const [key, value] of Object.entries(this.obsDict)){
					this.obsList.children.push(value as TreeItem);
				}
				this.refresh();
			}
			return;
		}
		if(categorize(sym) === "func"){
			let symObject:TreeItem = this.funcDict[n];
			if(typeof this.funcDict[n] !== 'undefined'){
				prevVal = symObject.value || '';
			}
			if(prevVal !== v){
				this.funcDict[n] = TreeItem.makeTreeItem(n,v,"func",sym.getSource());
				this.funcList.children = [];
				for(const [key, value] of Object.entries(this.funcDict)){
					this.funcList.children.push(value as TreeItem);
				}
				this.refresh();
			}
			return;
		}
	}

	refresh(){
		this._onDidChangeTreeData.fire(undefined);		
	}

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}

	getChildren(element?: TreeItem): vscode.ProviderResult<TreeItem[]> {
		if(element === undefined){
			return this.data;
		}
		return element.children;
	}
}

class TreeItem extends vscode.TreeItem {
	children: TreeItem[]|undefined;
	name: string;
	value: string;
	type:string;
  
	constructor(name:string, value:string, type: string, label:string,tooltip:vscode.MarkdownString, children?: TreeItem[]) {
	  super(
		  {label:label},
		  children === undefined ? vscode.TreeItemCollapsibleState.None :
								   vscode.TreeItemCollapsibleState.Expanded);
	  this.tooltip = tooltip;
	  
	  this.children = children;
	  this.name = name;
	  this.value = value;
	  this.type = type;
	}
	iconPath = vscode.ThemeIcon.File;

	public static makeTreeItem(name:string,value:string,type:string,definition?:string,children?: TreeItem[]):TreeItem{		
		let label = name;
		if(type === "obs" || type === "func"){
		  label += " = " + value;
		}else if(type === "def"){
			label += " is " + value;
		}
		let tooltip = new vscode.MarkdownString("**" + definition + "**");
		return new TreeItem(name,value,type,label,tooltip,children);
	}
}

function categorize(symbol:any):string{
	var symbolType = "obs";
	// Does the symbol have a definition
	if (!symbol.definition) {
		if (typeof(symbol.cache.value) === "function") {
			if (/\breturn\s+([^\/;]|(\/[^*\/]))/.test(symbol.cache.value.toString())) {
				symbolType = "func";
			} else {
				symbolType = "agent";
			}
		} else {
			symbolType = "obs";
		}
	} else {
		// Find out what kind of definition it is (proc, func or plain)
		var definition = symbol.getSource();
		if (/^proc\s/.test(definition)) {
			symbolType = "agent";
		} else if (/^func\s/.test(definition)) {
			symbolType = "func";
		} else {
			//Dependency
			if (typeof(symbol.cache.value) === "function") {
				if (/\breturn\s+([^\/;]|(\/[^*\/]))/.test(symbol.cache.value.toString())) {
					symbolType = "func";
				} else {
					symbolType = "agent";
				}
			} else {
				symbolType = "obs";
			}
		}
	}
	return symbolType;
}