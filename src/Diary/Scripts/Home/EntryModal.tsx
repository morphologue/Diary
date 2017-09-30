﻿import * as $ from 'jquery';
import * as React from 'react';
import { Entry } from './Diary';
import { EntryDialog } from './EntryDialog';
import { AlertDialog } from './AlertDialog';

enum AlertState {
    None, ConfirmClose, ConfirmDelete
}

interface Props {
    initialEntry?: Entry;
    editable: boolean;
    onClosed: () => void;
    onEdit?: () => void;
    onApply?: (new_entry: Entry) => void;
    onDelete?: () => void;
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
                title: '',
                date: yyyymmdd,
                location: '',
                body: ''
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
                            return <EntryDialog entry={this.state.entry} editable={this.props.editable} deletable={!!this.props.initialEntry}
                                onChange={(key, new_value) => this.handlDialogChange(key, new_value)} onClose={() => this.handleDialogClose()}
                                onSecondary={() => this.handleDialogSecondary()} />;
                        case AlertState.ConfirmClose:
                            return <AlertDialog message="Do you want to save your changes?" buttons={[
                                {
                                    label: 'Yes',
                                    onClick: () => this.handleAlertSave(),
                                    btnClassSuffix: 'primary'
                                },
                                {
                                    label: 'No',
                                    onClick: () => this.initiateClose(),
                                    btnClassSuffix: 'default'
                                },
                                {
                                    label: 'Cancel',
                                    onClick: () => this.setState({ alertState: AlertState.None }),
                                    btnClassSuffix: 'default'
                                }
                            ]} />;
                        case AlertState.ConfirmDelete:
                            return <AlertDialog message="Are you sure you want to delete the entry?" buttons={[
                                {
                                    label: 'Delete',
                                    onClick: () => this.handleAlertDelete(),
                                    btnClassSuffix: 'danger'
                                },
                                {
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

    componentWillUnmount(): void {
        $(this.refs.modal).off('hidden.bs.modal');
    }

    private initiateClose(): void {
        $(this.refs.modal).modal('hide');
    }

    private handlDialogChange(key: keyof Entry, new_value: string): void {
        let entry_clone = $.extend({}, this.state.entry);
        entry_clone[key] = new_value;
        this.setState({ entry: entry_clone });
    }

    private handleDialogClose(): void {
        if (this.state.entry === this.props.initialEntry)
            // No changes: can close immediately
            this.initiateClose();
        else
            // Something has changed.
            this.setState({ alertState: AlertState.ConfirmClose });
    }

    private handleDialogSecondary(): void {
        if (this.props.editable)
            // "Delete" was clicked.
            this.setState({ alertState: AlertState.ConfirmDelete });
        else if (this.props.onEdit)
            // "Edit" was clicked.
            this.props.onEdit();
    }

    private handleAlertSave(): void {
        this.props.onApply && this.props.onApply(this.state.entry);
        this.initiateClose();
    }

    private handleAlertDelete(): void {
        this.props.onDelete && this.props.onDelete();
        this.initiateClose();
    }
}