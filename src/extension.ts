import * as vscode from 'vscode';
import { NoteDirectory } from './NoteDirectory';

export function activate(context: vscode.ExtensionContext) {
	let openNoteDisposable = vscode.commands.registerCommand('markdown-jottings.openNote', NoteDirectory.openNote);
	context.subscriptions.push(openNoteDisposable);

	let newNoteDisposable = vscode.commands.registerCommand('markdown-jottings.newNote', NoteDirectory.newNote);
	context.subscriptions.push(newNoteDisposable);

	let linkNoteDisposable = vscode.commands.registerCommand('markdown-jottings.linkNote', NoteDirectory.linkNote);
	context.subscriptions.push(linkNoteDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
