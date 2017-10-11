import * as $ from 'jquery';
import * as React from 'react';
import { SearchBar } from './SearchBar';
import { EntryTable } from './EntryTable';
import { EntryModal } from './EntryModal';

export const NEW_ENTRY_KEY = 0;

export interface Entry {
    key: number,
    title: string,
    date: string,
    location: string,
    body: string
}

enum ModalState { Closed, View, Edit };

interface State {
    tableHeight: number | null;
    modalState: ModalState;
    searchText: string;
    entries: Entry[];
    selectedEntry?: Entry;
    spinning: boolean;
    serverEmpty: boolean;
}

// This is the top-level component which controls the layout of the app: search bar above entry table.
export class Diary extends React.PureComponent<{}, State> {
    private static nextEntryKey = 1;

    constructor() {
        super();
        this.state = {
            tableHeight: null,
            modalState: ModalState.Closed,
            searchText: '',
            entries: [],
            spinning: false,
            serverEmpty: false
        };
    }

    render(): JSX.Element {
        return (
            <div style={{ marginTop: 20 }} >
                <SearchBar searchText={this.state.searchText} onChange={new_search_text => this.handleSearchTextChange(new_search_text)} onAddButtonClick = {() => this.handleAddButtonClick()} />
                <div ref="stretchableTop" style={{ marginTop: 15 }} />
                <EntryTable height={this.state.tableHeight} entries={this.state.entries} onClick={clicked => this.handleEntryTableClick(clicked)}
                    onScrollHungry={() => this.handleEntryTableScrollHungry()} spinning={this.state.spinning} />
                {this.state.modalState !== ModalState.Closed && <EntryModal
                    editable={this.state.modalState === ModalState.Edit}
                    initialEntry={this.state.selectedEntry}
                    onClosed={() => this.handleDialogClosed()}
                    onApply={edited => this.handleDialogApply(edited)}
                    onDelete={() => this.handleDialogDelete()}
                    onEdit={() => this.handleDialogEdit()}
                />}
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

    // Handle window resize events by updating the height of EntryTable in state.
    private handleWindowResize(): void {
        let $footer = $("footer");
        let footer_offset = $footer.offset(), top_offset = $(this.refs.stretchableTop).offset();
        this.setState({
            tableHeight: $footer.css("display") !== "none" && footer_offset && top_offset ? footer_offset.top - top_offset.top : null
        });
    }

    private handleAddButtonClick(): void {
        this.setState({
            modalState: ModalState.Edit,
            selectedEntry: undefined
        });
    }

    private handleDialogClosed(): void {
        this.setState({
            modalState: ModalState.Closed,
        });
    }

    private handleDialogEdit(): void {
        this.setState({
            modalState: ModalState.Edit
        });
    }

    private handleDialogApply(edited: Entry): void {
        edited.key = Diary.nextEntryKey++;
        this.setState({
            entries: this.state.selectedEntry ? this.state.entries.map(e => e === this.state.selectedEntry ? edited : e)
                : [edited, ...this.state.entries]
        });
    }

    private handleDialogDelete(): void {
        this.setState({
            entries: this.state.entries.filter(e => e !== this.state.selectedEntry),
        });
    }

    private handleEntryTableClick(clicked: Entry) {
        this.setState({
            modalState: ModalState.View,
            selectedEntry: clicked
        });
    }

    private handleSearchTextChange(new_search_text: string): void {
        this.setState({ searchText: new_search_text });
    }

    private handleEntryTableScrollHungry(): void {
        if (this.state.serverEmpty || this.state.spinning)
            return;

        this.setState({
            spinning: true
        });
        $.ajax({
            url: '/diary/Entry',
            data: {
                last_id: this.state.entries.length ? this.state.entries[this.state.entries.length - 1].key : undefined,
                search_text: this.state.searchText
            },
            success: (batch: Entry[]) => {
                this.setState({
                    entries: batch.length ? [...this.state.entries, ...batch] : this.state.entries,
                    spinning: false,
                    serverEmpty: !batch.length
                });
            }
        });
    }
}
