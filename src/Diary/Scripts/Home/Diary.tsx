import * as $ from 'jquery';
import * as React from 'react';
import { SearchBar } from './SearchBar';
import { EntryTable } from './EntryTable';
import { EntryModal } from './EntryModal';

export interface Entry {
    title: string,
    date: string,
    location: string,
    body: string
}

enum ModalState { Closed, View, Edit };

interface State {
    height: number | null,
    dialogState: ModalState,
    selectedEntry?: Entry
}

// This is the top-level component which controls the layout of the app: search bar above entry table.
export class Diary extends React.Component<{}, State> {
    constructor() {
        super();
        this.state = {
            height: null,
            dialogState: ModalState.Closed
        };
    }

    render(): JSX.Element {
        return (
            <div style={{ marginTop: 20 }} >
                <SearchBar onAddButtonClick={() => this.handleAddButtonClick()} />
                <div ref="stretchableTop" style={{ marginTop: 15 }} />
                <EntryTable height={this.state.height} />
                {((): JSX.Element | undefined => {
                    switch (this.state.dialogState) {
                        case ModalState.View:
                            return <EntryModal editable={false} initialEntry={this.state.selectedEntry} onClosed={() => this.handleDialogClose()} onEdit={() => this.handleDialogEdit()} />
                        case ModalState.Edit:
                            return <EntryModal editable={true} initialEntry={this.state.selectedEntry} onClosed={() => this.handleDialogClose()}
                                onApply={edited => this.handleDialogApply(edited)} onDelete={() => this.handleDialogDelete()} />
                    }
                })()}
            </div>
        );
    }

    componentDidMount(): void {
        $(window).on('resize.Diary', () => this.handleWindowResize());
        this.handleWindowResize();
    }

    componentWillUnmount(): void {
        $(window).off('resize.Diary');
    }

    // Handle window resize events by updating our width and height in state.
    private handleWindowResize(): void {
        let $footer = $("footer");
        this.setState({
            height: $footer.css("display") === "none" ? null : $footer.offset().top - $(this.refs.stretchableTop).offset().top
        });
    }

    private handleAddButtonClick(): void {
        this.setState({
            dialogState: ModalState.Edit,
            selectedEntry: undefined
        });
    }

    private handleDialogClose(): void {
        this.setState({
            dialogState: ModalState.Closed
        });
    }

    private handleDialogEdit(): void {
        this.setState({
            dialogState: ModalState.Edit
        });
    }

    private handleDialogApply(edited: Entry): void {
        this.setState({
            selectedEntry: edited
        });
    }

    private handleDialogDelete(): void {
        this.setState({
            selectedEntry: undefined
        });
    }
}
