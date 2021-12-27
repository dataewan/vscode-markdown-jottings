import * as vscode from 'vscode';
import { link, readFileSync } from 'fs';

import { NoteDirectory } from './NoteDirectory';


enum LinkType {
    Markdown,
    Other,
}

class Link {
    href: string;
    title: string;
    lineNumber: number | null;
    linkType: LinkType;
    constructor(href: string, title: string, type: LinkType) {
        this.href = href;
        this.title = title;
        this.lineNumber = null;
        this.linkType = type;
    }
}

export class MarkdownParser {

    static backlinkDialog(indexes: string[]) {
        const options = indexes.map(d => ({
            label: d,
            description: "",
            path: NoteDirectory.indexToFilepath(d)
        }));

        const note = vscode.window.showQuickPick(options).then(note => {
            if (!note) { return; }
            return note.path;
        });

        return note;
    }

    static async getBacklinks() {
        if (!NoteDirectory.isCurrentlyNote()) {
            vscode.window.showErrorMessage("The file you have open needs to be a note");
            return;
        }

        const path = vscode.window.activeTextEditor?.document.uri.fsPath;
        if (!path) { return; };
        const indexesThatLink = MarkdownParser.getFilesThatBacklink(path);
        const fileToOpen = await MarkdownParser.backlinkDialog(indexesThatLink);

        if (fileToOpen) {
            vscode.window.showTextDocument(vscode.Uri.file(fileToOpen));
        }

    }


    static indexInLink(index: string, link: Link): boolean {
        return link.href === index;
    }

    static doesBacklink(path: string, links: Link[]): boolean {
        if (links.length === 0) {
            return false;
        }
        const index = NoteDirectory.filePathToIndex(path);
        const linkMatches = links
            .map(d => MarkdownParser.indexInLink(index, d))
            .filter(d => d === true);

        return linkMatches.length > 0;
    }

    static getFilesThatBacklink(path: string): string[] {
        let filesBacklinking: string[] = [];
        const otherMDFiles = NoteDirectory.getAllMarkdownNotes();
        for (const otherFileIndex in otherMDFiles) {
            const otherPath = otherMDFiles[otherFileIndex];
            const links = MarkdownParser.extractLinks(NoteDirectory.indexToFilepath(otherPath));
            if (MarkdownParser.doesBacklink(path, links)) {
                filesBacklinking.push(otherPath);
            }
        }

        return filesBacklinking;
    }

    static getTargetFromText(text: string): string {
        return text.replace(/[()]/g, '')
            .replace(/^\.\//, '')
            .trim();
    }

    static getLinkType(href: string): LinkType {
        if (href.endsWith("\.md")) {
            return LinkType.Markdown;
        }
        return LinkType.Other;
    }

    static getLinksFromText(text: string): Link[] {
        let links: Link[] = [];
        var result;
        const regexMdLinks = /\[([^\[]+)\](\(.*\))/gm;
        while ((result = regexMdLinks.exec(text)) !== null) {
            const title = result[1];
            const href = MarkdownParser.getTargetFromText(result[2]);
            const linkType = MarkdownParser.getLinkType(href);
            links.push(new Link(href, title, linkType));
        }
        return links;
    }

    static extractLinks(path: string): Link[] {
        const text = readFileSync(path).toString();
        const links = MarkdownParser.getLinksFromText(text)
            .filter(d => d.linkType === LinkType.Markdown);

        return links;
    }
}