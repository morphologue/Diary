﻿import * as $ from 'jquery';
import * as React from 'react';
import { Entry, NEW_ENTRY_KEY } from './Diary';
import { EntryDialog } from './EntryDialog';
import { AlertDialog } from './AlertDialog';

enum AlertState {
    None, ConfirmCancel, ConfirmDelete
}

interface Props {
    initialEntry?: Entry;
    editable: boolean;
    mobile: boolean;
    onClosed: () => void;
    onEdit: () => void;
    onApply: (new_entry: Entry) => void;
    onDelete: () => void;
}

interface State {
    entry: Entry;
    alertState: AlertState;
}

// Because Bootstrap annoyingly can only display one modal at a time, this component manages a modal which switches its contents between EntryDialog and AlertDialog.
export class EntryModal extends React.PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        // Set our state initially to the Entry in props, or a default if none was provided.
        let entry: Entry;
        if (props.initialEntry)
            entry = props.initialEntry;
        else {
            // Format the current date in the local timezone as YYYY-MM-DD.
            let today = new Date();
            let yyyymmdd = [today.getFullYear(), today.getMonth() + 1, today.getDate()]
                .map(n => n < 10 ? '0' + n : n)
                .join('-');

            entry = {
                key: NEW_ENTRY_KEY,
                title: '',
                date: yyyymmdd,
                location: '',
                body: '',
                textSummary: ''
            };
        }

        this.state = {
            entry: entry,
            alertState: AlertState.None
        }
    }

    render(): JSX.Element {
        return (
            <div ref="modal" className="modal fade">
                {((): JSX.Element => {
                    switch (this.state.alertState) {
                        case AlertState.None:
                            return <EntryDialog entry={this.state.entry} editable={this.props.editable} deletable={!!this.props.initialEntry} mobile={this.props.mobile}
                                changed={this.state.entry !== this.props.initialEntry} onChange={(key, new_value) => this.handlDialogChange(key, new_value)}
                                onCancel={saveable => this.handleDialogCancel(saveable)} onSave={() => this.handleSave()}
                                onSecondary={() => this.handleDialogSecondary()} />;
                        case AlertState.ConfirmCancel:
                            return <AlertDialog message="Do you want to save your changes?" buttons={[
                                {
                                    key: 1,
                                    label: 'Yes',
                                    onClick: () => this.handleSave(),
                                    btnClassSuffix: 'primary'
                                },
                                {
                                    key: 2,
                                    label: 'No',
                                    onClick: () => this.initiateClose(),
                                    btnClassSuffix: 'default'
                                },
                                {
                                    key: 3,
                                    label: 'Cancel',
                                    onClick: () => this.setState({ alertState: AlertState.None }),
                                    btnClassSuffix: 'default'
                                }
                            ]} />;
                        case AlertState.ConfirmDelete:
                            return <AlertDialog message="Are you sure you want to delete the entry?" buttons={[
                                {
                                    key: 4,
                                    label: 'Delete',
                                    onClick: () => this.handleAlertDelete(),
                                    btnClassSuffix: 'danger'
                                },
                                {
                                    key: 5,
                                    label: 'Cancel',
                                    onClick: () => this.setState({ alertState: AlertState.None }),
                                    btnClassSuffix: 'default'
                                }
                            ]} />;
                    }
                })()}
            </div>
        );
    }

    componentDidMount(): void {
        $(this.refs.modal)
            .modal({
                backdrop: 'static',  // Don't close when backdrop clicked.
                keyboard: false      // Don't close when escape pressed.
            })
            .on('hidden.bs.modal', () => this.props.onClosed());
    }

    componentDidUpdate(prev_props: Props, prev_state: State): void {
        if (this.props.mobile && this.state.alertState !== prev_state.alertState)
            $(document).scrollTop(0);
    }

    componentWillUnmount(): void {
        $(this.refs.modal).off('hidden.bs.modal');
    }

    private initiateClose(): void {
        $(this.refs.modal).modal('hide');
    }

    private handlDialogChange(key: keyof Entry, new_value: string): void {
        let entry_clone = $.extend({}, this.state.entry);
        entry_clone[key] = new_value;
        if (key === 'body')
            entry_clone.textSummary = this.sanitiseAndElipsise(entry_clone.body);
        this.setState({ entry: entry_clone });
    }

    private handleDialogCancel(saveable: boolean): void {
        saveable ? this.setState({ alertState: AlertState.ConfirmCancel }) : this.initiateClose();
    }

    private handleDialogSecondary(): void {
        if (this.props.editable)
            // "Delete" was clicked.
            this.setState({ alertState: AlertState.ConfirmDelete });
        else
            // "Edit" was clicked.
            this.props.onEdit();
    }

    // From the "OK" button of EntryDialog or the "Yes" button of AlertDialog
    private handleSave(): void {
        this.props.onApply(this.state.entry);
        this.initiateClose();
    }

    private handleAlertDelete(): void {
        this.props.onDelete();
        this.initiateClose();
    }

    // This mirrors EntryController.SanitiseAndElipsise.
    private sanitiseAndElipsise(body: string): string {
        const MAX_BODY_LENGTH = 200, ELIPSIS = '...';
        let sanitised = $('<div></div>').html(body).text();
        if (!sanitised.trim().length && body.trim().length)
            // Maybe the body is just an image, for example.
            return '[Markup]';
        return (sanitised.length <= MAX_BODY_LENGTH) ? sanitised
            : sanitised.substring(0, MAX_BODY_LENGTH - ELIPSIS.length) + ELIPSIS;
    }
}
