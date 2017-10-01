import * as React from 'react';
import { Entry } from './Diary';
import { DatePicker } from './DatePicker';
import TinyMCE = require('react-mce');
import moment = require('moment');

// Make TinyMCE work with Webpack, ergh :(
import 'tinymce/tinymce';
import 'tinymce/themes/modern';
declare let require: any;
require.context(
    'file-loader?name=[path][name].[ext]&context=node_modules/tinymce!tinymce/skins',
    true,
    /.*/
);

interface Props {
    entry: Entry;
    editable: boolean;
    deletable: boolean;
    changed: boolean;
    onChange: (key: keyof Entry, new_value: string) => void;
    onCancel: (saveable: boolean) => void;
    onSave: () => void;
    onSecondary: () => void;  // Clicked "Edit" in view mode or "Delete" in edit mode
}

// This component presents a view of the given 'entry'. If 'editable' is true and anything is changed, onChange will fire.
export class EntryDialog extends React.PureComponent<Props> {
    render(): JSX.Element {
        return (
            <div className="modal-dialog" style={{
                width: '80%',
                minWidth: 400
            }}>
                <div ref="content" className="modal-content">
                    <div className="modal-header">
                        <div className={`form-group${this.props.entry.title ? "" : " has-error"}`}>
                            <button type="button" className="close" style={{ float: 'right' }} onClick={() => this.onCancel()}>&times;</button>
                            <span style={{
                                display: 'block',
                                overflow: 'hidden',
                                paddingRight: 15
                            }}>
                                {
                                    this.props.editable ?
                                        <input type="text" className="form-control" placeholder="Title" value={this.props.entry.title}
                                            style={{ width: '100%' }} onChange={e => this.props.onChange('title', e.currentTarget.value)} />
                                        : <h4 className="modal-title">{this.props.entry.title}</h4>
                                }
                            </span>
                        </div>
                    </div>
                    <div className="modal-body">
                        <div className={`form-group${this.isDateValid() ? "" : " has-error"}`}>
                            <label>Date&nbsp;</label>
                            {
                                this.props.editable ?
                                    <DatePicker date={this.props.entry.date} className="form-control" onChange={new_date => this.props.onChange('date', new_date)} />
                                    : <div className="form-control">{this.props.entry.date}</div>
                            }
                        </div>
                        <div className="form-group">
                            <label>Location</label>
                            {
                                this.props.editable ?
                                    <input type="text" className="form-control" value={this.props.entry.location}
                                        onChange={e => this.props.onChange('location', e.currentTarget.value)} />
                                    : <div className="form-control">{this.props.entry.location}</div>
                            }
                        </div>
                        <div className="form-group">
                            <label>Entry</label>
                            {
                                this.props.editable ?
                                    <TinyMCE content={this.props.entry.body} config={{
                                        height: '20em'
                                    }} onKeyup={(e, editor) => this.props.onChange('body', editor.getContent())} />
                                    : <div className="form-control" dangerouslySetInnerHTML={{ __html: this.props.entry.body }} style={{
                                        height: '20em'
                                    }} />
                            }
                        </div>
                    </div>
                    {
                        this.props.editable ?
                            <div className="modal-footer">
                                <button type="button" className="btn btn-default" onClick={() => this.onCancel()}>Cancel</button>
                                <button type="button" className="btn btn-primary" disabled={!this.isEntryValid() || !this.props.changed}
                                    onClick={() => this.props.onSave()}>OK</button>
                                {this.props.deletable && <button type="button" className="btn btn-danger" onClick={() => this.props.onSecondary()}>Delete</button>}
                            </div>
                            : <div className="modal-footer">
                                <button type="button" className="btn btn-default" onClick={() => this.onCancel()}>Close</button>
                                <button type="button" className="btn btn-primary" onClick={() => this.props.onSecondary()}>Edit</button>
                            </div>
                    }
                </div>
            </div>
        );
    }

    private onCancel(): void {
        this.props.onCancel(this.props.changed && this.isEntryValid());
    }

    private isEntryValid(): boolean {
        return !!this.props.entry.title && this.isDateValid();
    }

    private isDateValid(): boolean {
        return moment(this.props.entry.date, "YYYY-MM-DD", true).isValid();
    }
}
