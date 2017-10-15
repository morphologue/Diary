import * as $ from 'jquery';
import * as React from 'react';
import { SearchBar } from './SearchBar';
import { EntryTable } from './EntryTable';
import { EntryModal } from './EntryModal';

export const NEW_ENTRY_KEY = 0;
const SERVER_URL = '/diary/Entry';

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
    ajaxInProgress: JQueryXHR | null;
    serverEmpty: boolean;
}

interface ServerBatch {
    entries: Entry[];
    serverEmpty: boolean;
}

interface ServerPutResponse {
    value: {
        key: number;
    };
}

// This is the top-level component which controls the layout of the app: search bar above entry table.
export class Diary extends React.PureComponent<{}, State> {
    private searchTextCheckerTimeout: number | undefined;
    private searchTextSentToServer: string | undefined;

    constructor() {
        super();
        this.state = {
            tableHeight: null,
            modalState: ModalState.Closed,
            searchText: '',
            entries: [],
            serverEmpty: false,
            ajaxInProgress: null
        };
    }

    render(): JSX.Element {
        return (
            <div style={{ marginTop: 20 }} >
                <SearchBar searchText={this.state.searchText} onChange={new_search_text => this.handleSearchTextChange(new_search_text)} disabled={!!this.state.ajaxInProgress}
                    onAddButtonClick={() => this.handleAddButtonClick()} />
                <div ref="stretchableTop" style={{ marginTop: 15 }} />
                <EntryTable height={this.state.tableHeight} entries={this.state.entries} onClick={clicked => this.handleEntryTableClick(clicked)}
                    onScrollHungry={() => this.handleEntryTableScrollHungry()} spinning={!!this.state.ajaxInProgress} />
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
        this.cancelInProgress();
        let a: JQuery.AjaxSettings;
        this.setState({
            ajaxInProgress: $.ajax({
                url: SERVER_URL + (this.state.selectedEntry ? `?id=${this.state.selectedEntry.key}` : ''),
                contentType: 'application/json',
                method: 'PUT',
                data: JSON.stringify({
                    Title: edited.title,
                    Date: edited.date,
                    Location: edited.location,
                    Body: edited.body
                }),
                success: (response: ServerPutResponse) => {
                    // Make a new entry array of entries, inserting or updating the edited entry.
                    let new_entries: Entry[];
                    if (this.state.selectedEntry) {
                        let selected_key = this.state.selectedEntry.key;
                        new_entries = this.state.entries.map(e => e.key === selected_key ? edited : e);
                    } else {
                        edited.key = response.value.key;  // The server will have sent us the ID when creating the new entry.
                        new_entries = [edited, ...this.state.entries];
                    }

                    // Sort the entries by date descending then key descending
                    new_entries.sort((a: Entry, b: Entry) => {
                        if (a.date > b.date)
                            return -1;
                        if (a.date < b.date)
                            return 1;
                        if (a.key > b.key)
                            return -1;
                        if (a.key < b.key)
                            return 1;
                        throw `Duplicate key ${a.key} detected`;
                    });

                    this.setState({
                        entries: new_entries,
                        ajaxInProgress: null
                    });
                }
            })
        });
    }

    private handleDialogDelete(): void {
        if (!this.state.selectedEntry)
            return;
        let selected_key = this.state.selectedEntry.key;
        this.cancelInProgress();
        this.setState({
            ajaxInProgress: $.ajax({
                url: SERVER_URL + `?id=${selected_key}`,
                method: 'DELETE',
                success: () => {
                    this.setState({
                        entries: this.state.entries.filter(e => e.key !== selected_key),
                        ajaxInProgress: null
                    });
                }
            })
        });
    }

    private handleEntryTableClick(clicked: Entry) {
        this.setState({
            modalState: ModalState.View,
            selectedEntry: clicked
        });
    }

    private handleSearchTextChange(new_search_text: string): void {
        let search_text_checker = () => {
            if (this.searchTextSentToServer === this.state.searchText) {
                // Nothing has changed since the last AJAX load, so we're done.
                this.searchTextCheckerTimeout = undefined;
                return;
            }

            if (this.state.ajaxInProgress) {
                // A request is still in progress, so reschedule the timeout.
                this.searchTextCheckerTimeout = window.setTimeout(search_text_checker, 500);
                return;
            }

            // There's no request outstanding, so we're free to refresh.
            this.loadBatch(true);
            this.searchTextCheckerTimeout = undefined;
        };

        if (this.state.ajaxInProgress) {
            // A request is in progress so we won't interrupt it. But we WILL check again in 500ms (if there is not already a timeout set).
            this.setState({ searchText: new_search_text });
            this.searchTextCheckerTimeout || (this.searchTextCheckerTimeout = window.setTimeout(search_text_checker, 500));
            return;
        }

        // There is no request in progress, so send one.
        this.loadBatch(true, new_search_text);
    }

    private handleEntryTableScrollHungry(): void {
        if (this.state.serverEmpty || this.state.ajaxInProgress)
            return;
        this.loadBatch(false);
    }

    private loadBatch(reset_entries: boolean, new_search_text?: string): void {
        this.searchTextSentToServer = new_search_text !== undefined ? new_search_text : this.state.searchText;
        this.setState({
            entries: reset_entries ? [] : this.state.entries,
            searchText: this.searchTextSentToServer,
            ajaxInProgress: $.ajax({
                url: SERVER_URL,
                data: {
                    last_id: (reset_entries || !this.state.entries.length) ? undefined : this.state.entries[this.state.entries.length - 1].key,
                    search_text: this.searchTextSentToServer
                },
                success: (batch: ServerBatch) => {
                    this.setState({
                        entries: [...this.state.entries, ...batch.entries],
                        serverEmpty: batch.serverEmpty,
                        ajaxInProgress: null
                    });
                }
            })
        });
    }

    private cancelInProgress(): void {
        if (this.state.ajaxInProgress) {
            console.log("WARNING: Cancelled outstanding AJAX request.");
            this.state.ajaxInProgress.abort();
            this.setState({ ajaxInProgress: null });
        }
    }
}
