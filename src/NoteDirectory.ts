import { utimesSync, existsSync, closeSync, openSync, readdir, readdirSync } from 'fs';
import { join } from 'path';
import path = require('path');
import * as vscode from 'vscode';

export class NoteDirectory {
    static newNotePrompt() {
        return vscode.window.showInputBox({
            prompt: "Enter the title for the new note",
            value: ''
        });
    }

    static newNoteFilename(noteName: string, dir: string): string {
        const dt = new Date().toISOString().split('.')[0].replace(/[^\d]/gi, '').slice(0, -2);
        return path.join(dir, `${dt}-${noteName}.md`);
    }

    static touchFile(fullPath: string) {
        const time = new Date();
        try {
            utimesSync(fullPath, time, time);
        } catch (err) {
            closeSync(openSync(fullPath, 'w'));
        }
    }

    static createNewNote(noteName: string) {
        const dir = vscode.workspace.getConfiguration("markdown-jottings").noteDirectory;
        const dirExists = existsSync(dir);
        if (!dirExists) {
            vscode.window.showWarningMessage(`${dir} doesn't exist`);
            return;
        }

        const newFilename = NoteDirectory.newNoteFilename(noteName, dir);

        NoteDirectory.touchFile(newFilename);
        vscode.window.showTextDocument(vscode.Uri.file(newFilename));
    }

    static newNote(context: vscode.ExtensionContext) {
        const prompt = NoteDirectory.newNotePrompt();
        prompt.then(
            (noteName) => {
                if (noteName === null || !noteName) { return false; }
                NoteDirectory.createNewNote(noteName);
            }
        );
    }


    static getAllMarkdownNotes(): string[] {
        const dir = vscode.workspace.getConfiguration("markdown-jottings").noteDirectory;
        const notes = (
            readdirSync(dir)
                .filter(d => d.endsWith(".md"))
        );
        return notes;
    }

    static existingNoteDialog() {
        const notes = NoteDirectory.getAllMarkdownNotes();
        const options = notes.map(d => ({
            label: d,
            description: ""
        }));

        const note = vscode.window.showQuickPick(options).then(note => {
            if (!note) { return; }
            return note;
        });

        return note;
    }

    static async openNote() {
        const noteName = await NoteDirectory.existingNoteDialog();
        if (!noteName) { return; }
        const dir = vscode.workspace.getConfiguration("markdown-jottings").noteDirectory;
        const fullPath = join(dir, noteName.label);
        vscode.window.showTextDocument(vscode.Uri.file(fullPath));
    }

}