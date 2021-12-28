import { utimesSync, existsSync, closeSync, openSync, readdir, readdirSync } from 'fs';
import * as path from 'path';
import { join } from 'path';
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

    static createNewNote(noteName: string): string | undefined {
        const dir = vscode.workspace.getConfiguration("markdown-jottings").noteDirectory;
        const dirExists = existsSync(dir);
        if (!dirExists) {
            vscode.window.showWarningMessage(`${dir} doesn't exist`);
            return;
        }

        const newFilename = NoteDirectory.newNoteFilename(noteName, dir);

        NoteDirectory.touchFile(newFilename);
        vscode.window.showTextDocument(vscode.Uri.file(newFilename));
        return newFilename;
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
                .sort((x, y) => {
                    // if x and y both start with a digit
                    if (x.match(/^\d/) && y.match(/^\d/)) {
                        // reverse date order
                        return x < y ? 1 : -1;
                    }
                    // just regular alphabetical
                    return x > y ? 1 : -1;
                })
        );
        return notes;
    }

    static indexToFilepath(index: string): string {
        /* Converts a relative path to an absolute path */
        const dir = vscode.workspace.getConfiguration("markdown-jottings").noteDirectory;
        return join(dir, index);
    }

    static filePathToIndex(filepath: string): string {
        /* Converts the absolute path to a relative path
         */
        const dir = vscode.workspace.getConfiguration("markdown-jottings").noteDirectory;
        return filepath
            .replace(dir, "")
            .replace(/\//g, '');
    }

    static existingNoteDialog() {
        const dir = vscode.workspace.getConfiguration("markdown-jottings").noteDirectory;
        const notes = NoteDirectory.getAllMarkdownNotes();
        const options = notes.map(d => ({
            label: d,
            description: "",
            path: path.join(dir, d),
        }));

        const note = vscode.window.showQuickPick(options).then(note => {
            if (!note) { return; }
            return note;
        });

        return note;
    }

    static async openNote() {
        const note = await NoteDirectory.existingNoteDialog();
        if (!note) { return; }
        vscode.window.showTextDocument(vscode.Uri.file(note.path));
    }

    static isWithinDirectory(filepath: string): boolean {
        const dir = vscode.workspace.getConfiguration("markdown-jottings").noteDirectory;
        const relative = path.relative(filepath, dir);
        return relative.startsWith('..') && !path.isAbsolute(relative);
    }

    static isCurrentlyNote(): boolean {
        if (!vscode.window.activeTextEditor) { return false; }
        if (!NoteDirectory.isWithinDirectory(vscode.window.activeTextEditor.document.uri.fsPath)) { return false; }
        return true;
    }

    static getNoteLabel(noteLabel: string) {
        const placeholder = path.basename(noteLabel).replace(".md", "");
        const options: vscode.InputBoxOptions = {
            prompt: "Label for link",
            placeHolder: placeholder,
        };

        const label = vscode.window.showInputBox(options).then(value => {
            if (!value) { return placeholder; }
            return value;
        });

        return label;
    }

    static createMdLink(filePath: string, label: string): string {
        const fullPath = path.join(".", filePath);
        return `[${label}](${fullPath})`;
    }

    static insertLink(notePath: string, noteLabel: string) {
        const link = NoteDirectory.createMdLink(notePath, noteLabel);
        const editor = vscode.window.activeTextEditor;
        editor?.edit(e => e.insert(editor.selection.active, link));
    }

    static async linkNote() {
        if (!NoteDirectory.isCurrentlyNote()) {
            vscode.window.showErrorMessage("Current document is not a note");
            return;
        }

        const note = await NoteDirectory.existingNoteDialog();

        if (!note) { return; }
        const label = await NoteDirectory.getNoteLabel(note.label);
        NoteDirectory.insertLink(note.label, label)
    }

    static async linkNewNote() {
        if (!NoteDirectory.isCurrentlyNote()) {
            vscode.window.showErrorMessage("Current document is not a note");
            return;
        }
        const noteName = await NoteDirectory.newNotePrompt();

        if (!noteName) { return; }

        const label = await NoteDirectory.getNoteLabel(noteName);

        const noteFilename = NoteDirectory.createNewNote(noteName);
        if (noteFilename) {
            const index = NoteDirectory.filePathToIndex(noteFilename);
            NoteDirectory.insertLink(index, label);
        }
    }
}