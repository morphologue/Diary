import * as $ from 'jquery';
import * as React from 'react';
import { SearchBar } from './SearchBar';
import { EntryTable } from './EntryTable';
import { EntryDialog } from './EntryDialog';

export interface Entry {
    title: string,
    date: string,
    location: string,
    body: string
}

enum DialogState { Closed, View, Edit };

interface State {
    height: number | null,
    dialogState: DialogState,
    selectedEntry?: Entry
}

// This is the top-level component which controls the layout of the app: search bar above entry table.
export class Diary extends React.Component<{}, State> {
    constructor() {
        super();
        this.state = {
            height: null,
            dialogState: DialogState.Closed
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
                        case DialogState.View:
                            return <EntryDialog editable={false} entry={this.state.selectedEntry} onClose={() => this.handleDialogClose()} />
                        case DialogState.Edit:
                            return <EntryDialog editable={true} entry={this.state.selectedEntry} onClose={() => this.handleDialogClose()}/>
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
            dialogState: DialogState.Edit
        });
    }

    private handleDialogClose(): void {
        this.setState({
            dialogState: DialogState.Closed
        });
    }
}
