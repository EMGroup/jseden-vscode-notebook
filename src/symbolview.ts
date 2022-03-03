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

	obsList:TreeItem;

	private _onDidChangeTreeData: EventEmitter<TreeItem | undefined> = new EventEmitter<TreeItem | undefined>();

  	readonly onDidChangeTreeData: Event<TreeItem | undefined> = this._onDidChangeTreeData.event;

	constructor(){
		this.obs = [];
		this.funcs = [];
		this.obsList = 			new TreeItem(
			'Observables', '', this.obs);
		this.data = [
			this.obsList,
			new TreeItem(
				'Functions', '', this.funcs)
		  ];
	}

	updateSymbol(n:string,v:string){
		let prevVal:string = '@';
		let symObject:TreeItem = this.obsDict[n];
		if(typeof this.obsDict[n] !== 'undefined'){
			prevVal = symObject.value || '';
		}
		if(prevVal !== v){
			this.obsDict[n] = new TreeItem(n,v);
			// this.obs.push(new TreeItem(n + " is " + v));

			this.obsList.children = [];

			for(const [key, value] of Object.entries(this.obsDict)){
				this.obsList.children.push(value as TreeItem);
			}
			this.refresh();
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
  
	constructor(name:string,value: string, children?: TreeItem[]) {
	  super(
		  `${name} = ${value}`,
		  children === undefined ? vscode.TreeItemCollapsibleState.None :
								   vscode.TreeItemCollapsibleState.Expanded);
	  this.children = children;
	  this.name = name;
	  this.value = value;
	}
  }