import { SelectedWord } from '@cpt/interfaces/auto-complete-input';
import {
    Component, OnInit, ViewChild, Input, OnChanges, SimpleChanges, Output, EventEmitter,
    HostListener,
    ViewChildren,
    QueryList,
    ElementRef,
    AfterViewInit
} from '@angular/core';
import { ForecastVariableTreeNode } from '@cpt/interfaces/forecast-variable';
import { CompletedWordComponent } from './completedword.component';

interface KeyValuePair {
    id: String;
    title: String;
}

@Component({
    selector: 'autocomplete-input',
    templateUrl: './autocomplete.input.component.html',
    styleUrls: ['./autocomplete.input.component.css']
})




export class AutocompleteInputComponent implements OnInit, AfterViewInit, OnChanges {
    @Input('variable-name') variableName: String;

    @Input('variables') variables: ForecastVariableTreeNode[] = Array<ForecastVariableTreeNode>();
    // stores the elemental positioning of the input (insertion) cursor
    @Input('insertion-index') insertionIndex = 0;
    // this is the list of displayed expression terms (constants, operators, and identifiers)
    @Input('completedWords') completedWords: SelectedWord[] = new Array<SelectedWord>();
    @Input('constantInput') inputValue = '';
    @Input('isDistributionExpression') isDistributionExpression = false;
    @Input('sheetId') sheetId: string;

    @Output('expressionChanged') expressionChange = new EventEmitter();
    @Output('widthChanged') widthChanged = new EventEmitter(true);
    @Output('equalsDeleted') equalsDeleted = new EventEmitter();
    @Output('flashInvalid') flashInvalid = new EventEmitter();

    @ViewChild('input', { static: false }) input: any;
    @ViewChild('invisibleDiv', { static: false }) invisibleDiv: any;
    @ViewChild('suggestedVar', { static: false }) suggestedVar: any;
    @ViewChildren(CompletedWordComponent) completedWordComponents: QueryList<CompletedWordComponent>;

    mathOperators = [
        '*', '+', '/', '%', '-', '^', '(', ')'
    ];
    expression: String[] = Array<String>();
    suggestions: any = [];

    // holds all completedWords to be displayed *before* the input cursor
    preInsertionCompletedWords: SelectedWord[] = new Array<SelectedWord>();
    // holds all completedWords to be displayed *after* the input cursor
    postInsertionCompletedWords: SelectedWord[] = new Array<SelectedWord>();

    isError = false;
    hoveringSuggestion = false;

    inputWidth = 30;

    hoveredSuggestion: any = {};

    constructor(private elementRef: ElementRef) {
        if (this.completedWords === undefined) {
            this.completedWords = Array<SelectedWord>();

            this.preInsertionCompletedWords = Array<SelectedWord>();
            this.postInsertionCompletedWords = Array<SelectedWord>();

            this.insertionIndex = 0;

        }
    }

    ngOnInit() {
        if (this.inputValue !== '') {
            this.input.nativeElement.value = this.inputValue;
            this.resizeInputField();
        }
    }

    /**
     * Auto focuses on the input field
     */
    ngAfterViewInit() {
        if (!this.isDistributionExpression) {
            this.focus();
        }
        this.getTotalWidth();
        this.completedWordComponents.changes.subscribe((changes: any) => {
            this.getTotalWidth();
        });
    }

    focus() {
        this.input.nativeElement.focus();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['completedWords']) {
            this.preInsertionCompletedWords = Array.from(this.completedWords);
            this.insertionIndex = this.preInsertionCompletedWords.length;
        }
    }

    expressionChanged() {
        this.expressionChange.emit();
    }

    onDelete(index) {
        this.completedWords.splice(index, 1);
        this.expressionChanged();
        this.recalculateExpressionInsertionLists();
    }

    // this function intercepts mouse click events on expression terms
    // and repositions the insertion area directly in front of the
    // term that received the click event
    //
    // focus is also activated as the user will want to type something
    // after clicking
    onClick(index) {
        if (this.insertionIndex === index) {
            this.insertionIndex = index + 1;
        } else {
            this.insertionIndex = index;
        }
        this.recalculateExpressionInsertionLists();
        this.input.nativeElement.focus();
    }

    onHover() {
        this.hoveringSuggestion = true;
    }

    outHover() {
        this.hoveringSuggestion = false;
    }

    onFocus() {
        if (this.inputValue !== '') {
            this.suggestions = Array<KeyValuePair>();
            const suggestionVarList = this.variables.filter(excludeBr => excludeBr.content.variableType !== 'BREAKDOWN');
            suggestionVarList.forEach(element => {
                if (this.inputValue.length > 0) {
                    const enteredString = this.inputValue.toLowerCase().trim().replace(/[^0-9a-zA-Z_]/, '');
                    if (enteredString !== '') {
                        if (element.content.title !== this.variableName && element.content.title.toLowerCase().indexOf(enteredString) !== -1) {
                            this.suggestions.push(element);
                        }
                    }
                }
            });
        }
    }

    removeSuggestions() {
        this.hoveredSuggestion = {};
        this.suggestions = [];
    }

    // insert a newly-entered expression term at the desired index within the completedWord list
    insertCompletedWord(completedWord) {
        this.completedWords.splice(this.insertionIndex, 0, completedWord);

        this.expressionChanged();

        this.insertionIndex += 1;
        this.recalculateExpressionInsertionLists();
    }

    onKeyup(event) {
        this.suggestions = Array<KeyValuePair>();
        const inputVal = this.input.nativeElement.value.trim();
        const suggestionVarList = this.variables.filter(excludeBr => excludeBr.content.variableType !== 'BREAKDOWN');
        suggestionVarList.forEach(element => {
            if (event.target.value.length > 0) {
                const enteredString = event.target.value.toLowerCase().trim().replace(/[^0-9a-zA-Z_]/, '');
                if (enteredString !== '') {
                    if (element.content.title !== this.variableName && element.content.title.toLowerCase().indexOf(enteredString) !== -1) {
                        this.suggestions.push(element);
                    }
                }
            }
        });

        this.mathOperators.forEach(element => {
            if (event.target.value.length > 0) {
                if (event.target.value.toLowerCase().indexOf(element.toLowerCase()) !== -1 && this.input.nativeElement.value.trim().length > 1) {
                    if (this.suggestions.length > 0 && isNaN(parseFloat(inputVal))) {
                        this.suggestions.sort(function(a, b) {
                            // Use toUpperCase() to ignore character casing
                            const titleA = a.title.toUpperCase();
                            const titleB = b.title.toUpperCase();

                            let comparison = 0;
                            if (titleA > titleB) {
                                comparison = 1;
                            } else if (titleA < titleB) {
                                comparison = -1;
                            }
                            return comparison;
                        });
                        this.selectWord(this.suggestions[0]);
                    }
                    if (!isNaN(parseFloat(inputVal))) {
                        this.onSpacePressed();
                    }
                }
                if (element.toLowerCase().indexOf(event.target.value.toLowerCase()) !== -1) {

                    this.insertCompletedWord({
                        title: element,
                        type: 'operator',
                        id: ''
                    });

                    this.input.nativeElement.value = '';
                    this.inputValue = '';
                }
            }
        });

        if (isNaN(inputVal)) {
            if (this.suggestions.length === 1) {
                if (inputVal === this.suggestions[0].content.title) {
                    this.selectWord(this.suggestions[0]);
                    this.suggestions = [];
                }
            }
        }

        if (event.code === 'Space') {
            if (this.suggestions.length > 0 && isNaN(inputVal)) {
                this.suggestions.sort(function(a, b) {
                    // Use toUpperCase() to ignore character casing
                    const titleA = a.content.title.toUpperCase();
                    const titleB = b.content.title.toUpperCase();

                    let comparison = 0;
                    if (titleA > titleB) {
                        comparison = 1;
                    } else if (titleA < titleB) {
                        comparison = -1;
                    }
                    return comparison;
                });
                this.selectWord(this.suggestions[0]);
            }
            if (this.input.nativeElement.value.trim().length !== 0) {
                this.onSpacePressed();
            }
        }
    }

    /**
     * changes the width of the input field to match the width of the content within the input field
     */
    resizeInputField() {
        this.invisibleDiv.nativeElement.innerText = this.input.nativeElement.value;
        if (this.isDistributionExpression) {
            this.inputWidth = this.invisibleDiv.nativeElement.clientWidth + 30;
        } else {
            this.inputWidth = this.invisibleDiv.nativeElement.clientWidth + 5;
        }
        // setTimeout 0 to ensure the totalWidth is calculated after the dom updates.
        setTimeout(() => { this.getTotalWidth(); }, 0);

    }

    onSpacePressed(shouldFocus = true) {
        const value = parseFloat(this.input.nativeElement.value.trim());
        if (!isNaN(value)) {
            if (this.completedWords === undefined) {
                this.completedWords = new Array<SelectedWord>();
            }

            this.insertCompletedWord({
                title: parseFloat(this.input.nativeElement.value.trim()).toString(),
                type: 'const',
                id: ''
            });

            this.clearInput(shouldFocus);
        }
    }


    // based on the current value of this.insertionIndex,
    // populate the pre-insertion and post-insertion expression word lists.
    // this is so the insertion (input) area is draw at the desired
    // element position
    recalculateExpressionInsertionLists() {
        let i = 0;

        this.preInsertionCompletedWords = Array.from(this.completedWords);
        this.postInsertionCompletedWords = [];

        const wordTransferCount: number = this.completedWords.length - this.insertionIndex;
        for (i = 0; i < wordTransferCount; i++) {
            this.postInsertionCompletedWords.unshift(this.preInsertionCompletedWords.pop());
        }
    }

    // process keyboard events
    onKeydown(event) {
        this.isError = false;
        if (event.code === 'Enter' || event.code === 'NumpadEnter') {
            if (Object.keys(this.hoveredSuggestion).length !== 0) {
                event.stopPropagation();
                this.insertCompletedWord({
                    title: this.hoveredSuggestion.content.title,
                    type: 'variable',
                    id: this.hoveredSuggestion.id
                });
            } else {
                if (this.inputValue !== '' && !isNaN(Number(this.inputValue))) {
                    this.insertCompletedWord({
                        title: parseFloat(this.inputValue),
                        type: 'const',
                        id: ''
                    });
                }
            }
            this.clearInput(true);
        } else if (event.code === 'Backspace') {
            // if the user hits the 'Backspace' key, delete
            // the word in front of the insertion cursor
            if (this.insertionIndex === 0) {
                if (this.inputValue === '') {
                    if (this.completedWords.length === 0 || (this.completedWords.length === 1 && this.completedWords[0].type === 'const')) {
                        event.preventDefault();
                        event.stopPropagation();
                        this.equalsDeleted.emit();
                    } else {
                        this.flashInvalid.emit();
                    }
                }
            } else if (this.input.nativeElement.value.length === 0) {
                if (this.insertionIndex > 0) {
                    this.completedWords.splice(this.insertionIndex - 1, 1);

                    this.insertionIndex -= 1;
                }
                this.recalculateExpressionInsertionLists();
                this.expressionChanged();
            }
        } else if (event.code === 'ArrowLeft') {
            // if the user hits the left arrow key, move the insertion cursor
            // one unit to the left
            event.stopPropagation();
            if (this.input.nativeElement.value.length === 0) {
                if (this.preInsertionCompletedWords.length > 0) {
                    this.insertionIndex -= 1;
                    this.recalculateExpressionInsertionLists();
                }
            }
        } else if (event.code === 'ArrowRight') {
            // if the user hits the right arrow key, move the insertion cursor
            // one unit to the right
            event.stopPropagation();
            if (this.input.nativeElement.value.length === 0) {
                if (this.postInsertionCompletedWords.length > 0) {
                    this.insertionIndex += 1;
                    this.recalculateExpressionInsertionLists();
                }
            }
        } else if (event.code === 'ArrowDown') {
            event.preventDefault();
            event.stopPropagation();
            if (this.suggestions.length !== 0) {
                if (Object.keys(this.hoveredSuggestion).length === 0) {
                    this.hoveredSuggestion = this.suggestions[0];
                } else {
                    const index = this.suggestions.findIndex(x => x === this.hoveredSuggestion);
                    if (this.suggestions[index + 1]) {
                        this.hoveredSuggestion = this.suggestions[index + 1];
                    }
                }
            }
        } else if (event.code === 'ArrowUp') {
            event.preventDefault();
            event.stopPropagation();
            if (this.suggestions.length !== 0) {
                const index = this.suggestions.findIndex(x => x === this.hoveredSuggestion);
                if (this.suggestions[index - 1]) {
                    this.hoveredSuggestion = this.suggestions[index - 1];
                }
            }
        } else if (event.code === 'Home') {
            // if the user hits the 'Home' key, move the insertion cursor to
            // the beginning of the expression
            this.insertionIndex = 0;
            this.recalculateExpressionInsertionLists();
        } else if (event.code === 'End') {
            // if the user hits the 'End' key, move the insertion cursor to
            // the end of the expression
            this.insertionIndex = this.completedWords.length;
            this.recalculateExpressionInsertionLists();
        } else if (event.code === 'Delete') {
            // if the user hits the 'Delete' key, delete the completed
            // word directly in front of the insertion cursor
            if (this.input.nativeElement.value.length === 0) {

                if (this.postInsertionCompletedWords.length > 0) {
                    this.completedWords.splice(this.insertionIndex, 1);

                    this.recalculateExpressionInsertionLists();
                }
            }
            this.expressionChanged();
        }
    }

    onSuggestionHover(suggestion) {
        this.hoveredSuggestion = suggestion;
    }

    clearInput(shouldFocus = true) {
        this.inputWidth = 30;
        this.input.nativeElement.value = '';
        this.inputValue = '';
        this.suggestions.splice(0, this.suggestions.length);
        this.hoveredSuggestion = {};
        if (shouldFocus) {
            this.input.nativeElement.focus();
        }
    }

    selectWord(word) {
        if (this.completedWords === undefined) {
            this.completedWords = Array<SelectedWord>();
        }
        this.hoveringSuggestion = false;

        this.insertCompletedWord({
            title: word.content.title,
            type: 'variable',
            id: word.id
        });

        this.clearInput();
        this.removeSuggestions();
    }


    getInput() {
        let expression = '';
        this.completedWords.forEach(word => {
            if (word.type === 'variable') {
                expression += `EXP_${word.id} `;
            } else {
                expression += `${word.title} `;
            }
        });

        return expression;
    }

    /**
     * Calculates the width of the entire expression including the input field
     */
    getTotalWidth() {
        this.widthChanged.emit(this.elementRef.nativeElement.offsetWidth);
    }


    @HostListener('document:click', ['$event', '$event.target'])
    clickOutside(event: MouseEvent, targetElement: HTMLElement): void {
        if (!targetElement) {
            return;
        }

        const clickedInside = targetElement.closest('#auto-complete');

        if (!clickedInside) {
            this.removeSuggestions();
        }
    }

    /**
     * Adds the input value to the completed words array
     */
    addInputValue() {
        if (this.inputValue !== '' && !isNaN(Number(this.inputValue))) {
            this.insertCompletedWord({
                title: parseFloat(this.inputValue),
                type: 'const',
                id: ''
            });

            this.clearInput(true);
        }
    }
}
