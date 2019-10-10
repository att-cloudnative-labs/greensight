import { UndoRedoObject } from '../interfaces/undo-redo-object';

/**
 * A generic undo/redo manager
 * Past versions of an object are
 */
export class UndoRedoManager {
    history: UndoRedoObject[];
    currentState: number;

    constructor() {
        this.history = new Array<any>();
        this.currentState = -1;
    }

    /**
     * Adds a new state to the history array. Whenever a new state is pushed, the array is sliced so that
     * any states that are stored ahead of the cuurent state are removed.
     * @param newState the type of operation that was made and the object before and after the change
     */
    pushState(newState: UndoRedoObject) {
        this.history = this.history.slice(0, this.currentState + 1);
        this.history.push(newState);
        this.currentState++;
    }


    /**
     * Returns the state that is postitioned at the currentState.
     */
    undo(): UndoRedoObject {
        if (this.currentState < 0) {
            return null;
        } else {
            const prevState = this.history[this.currentState];
            this.currentState--;
            return prevState;
        }
    }

    /**
     * Returns the state that is positioned one index ahead of the current state
     */
    redo(): UndoRedoObject {
        if (this.currentState >= this.history.length - 1) {
            return null;
        } else {
            this.currentState++;
            const futureState = this.history[this.currentState];
            return futureState;
        }
    }
}
