import * as vscode from 'vscode';
import { NoteDirectory } from './NoteDirectory';

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('markdown-jottings.newNote', NoteDirectory.newNote);

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
