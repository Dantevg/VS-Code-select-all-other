import * as vscode from 'vscode'

/**
 * Finds all occurrences of a substring within a given string and returns their start indices.
 *
 * @param text The string to search in.
 * @param search The substring to search for.
 * @returns An array of start indices where the substring occurs within the text.
 * 
 * @example findAll('hello world from here', 'he') // [0, 17]
 */
function findAll(text: string, search: string): number[] {
	const indices = []
	let index = text.indexOf(search)
	while (index !== -1) {
		indices.push(index)
		index = text.indexOf(search, index + 1)
	}
	return indices
}

/**
 * Converts an array of start indices into an array of {@link vscode.Selection} objects.
 *
 * @param editor The text editor containing the document.
 * @param indices An array of starting indices.
 * @param length The length of each selection.
 * @returns An array of {@link vscode.Selection} objects corresponding to the given indices and length.
 */
const indicesToSelections = (editor: vscode.TextEditor, indices: number[], length: number) =>
	indices.map(i => {
		const start = editor.document.positionAt(i)
		return new vscode.Selection(start, start.translate(0, length))
	})

/**
 * Retrieves the current selection in the given text editor.
 *
 * @param editor The text editor from which to get the selection.
 * @returns A tuple of:
 *   - the selected range or the word range at the cursor position if the selection is empty
 *   - whether the selection was empty
 */
const getSelection = (editor: vscode.TextEditor): [vscode.Range | undefined, boolean] =>
	(editor.selection.isEmpty)
		? [editor.document.getWordRangeAtPosition(editor.selection.start), true]
		: [editor.selection, false]

/**
 * Selects all occurrences of the currently selected text in the active editor,
 * excluding the original selection. If the original selection is empty, only
 * whole word occurrences will be selected.
 */
function selectAllOther() {
	const editor = vscode.window.activeTextEditor
	if (!editor) return

	const [selection, wholeWords] = getSelection(editor)
	if (!selection) return

	const selectedText = editor.document.getText(selection)
	const indices = findAll(editor.document.getText(), selectedText)

	// Remove the original selection from the list of selections
	indices.splice(indices.indexOf(editor.document.offsetAt(selection.start)), 1)

	const selections = indicesToSelections(editor, indices, selectedText.length)

	if (wholeWords) {
		// Remove non-whole-word selections if the original selection was a whole word
		const wholeWordSelections = selections.filter(s =>
			editor.document.getWordRangeAtPosition(s.start)?.isEqual(s))
		editor.selections = wholeWordSelections
	} else {
		editor.selections = selections
	}
}

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('select-all-other.select', selectAllOther))
}

export function deactivate() { }
