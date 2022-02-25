/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { parseMarkdown, writeCellsToMarkdown, RawNotebookCell } from './markdownParser';

const providerOptions = {
	transientMetadata: {
		runnable: true,
		editable: true,
		custom: true,
	},
	transientOutputs: true
};

export function activate(context: vscode.ExtensionContext) {
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

	  console.log(execution.cell.document.fileName + ":" + execution.cell.index);
	  
	  console.log(execution.cell.document.getText());
	  
	  
	  execution.replaceOutput([
		new vscode.NotebookCellOutput([
		  vscode.NotebookCellOutputItem.text('Dummy output text!')
		])
	  ]);
	  execution.end(true, Date.now());
	}
  }