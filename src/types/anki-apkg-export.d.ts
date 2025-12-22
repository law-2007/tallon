declare module 'anki-apkg-export' {
    export default class AnkiExport {
        constructor(deckName: string);
        addMedia(name: string, data: any): void;
        addCard(front: string, back: string, tags?: any): void;
        save(): Promise<any>;
    }
}
