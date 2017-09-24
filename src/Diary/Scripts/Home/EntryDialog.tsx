import * as $ from 'jquery';
import * as React from 'react';
import TinyMCE = require('react-mce');
import { Entry } from './Diary';

// Make TinyMCE work with Webpack, ergh :(
import 'tinymce/tinymce';
import 'tinymce/themes/modern';
declare let require: any;
require.context(
    'file-loader?name=[path][name].[ext]&context=node_modules/tinymce!tinymce/skins',
    true,
    /.*/
);

function copyOrDefault(entry: Entry | null): Entry {
    if (entry)
        return {
            title: entry.title,
            date: entry.date,
            location: entry.location,
            body: entry.body
        };

    // Format the current date in the local timezone as YYYY-MM-DD.
    let today = new Date();
    let yyyymmdd = [today.getFullYear(), today.getMonth() + 1, today.getDate()]
        .map(n => n < 10 ? '0' + n : n)
        .join('-');

    return {
        title: '',
        date: yyyymmdd,
        location: '',
        body: ''
    };
}

interface ViewProps {
    entry: Entry | null;
    onClose: () => void;
}

export class EntryDialogView extends React.Component<ViewProps> {
    render(): JSX.Element {
        let extant_entry = copyOrDefault(this.props.entry);
        return (
            <div ref="modal" className="modal fade">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button" className="close" onClick={() => this.props.onClose()}>&times;</button>
                            <h4 className="modal-title">{extant_entry.title}</h4>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Date</label>
                                <div className="form-control">{extant_entry.date}</div>
                            </div>
                            <div className="form-group">
                                <label>Location</label>
                                <div className="form-control">{extant_entry.location}</div>
                            </div>
                            <div className="form-group">
                                <label>Entry</label>
                                <div className="form-control" dangerouslySetInnerHTML={{ __html: extant_entry.body }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    componentDidMount(): void {
        $(this.refs.modal).modal();
    }

    componentWillUnmount(): void {
        $(this.refs.modal).modal('hide');
    }
}

interface EditProps extends ViewProps {
    onApply?: () => void;
}

export class EntryDialogEdit extends React.Component<EditProps, Entry> {
    constructor(props: EditProps) {
        super(props);
        this.state = copyOrDefault(props.entry);
    }

    render(): JSX.Element {
        return (
            <div ref="modal" className="modal fade">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button" className="close" style={{ float: 'right' }} onClick={() => this.props.onClose()}>&times;</button>
                            <span style={{
                                display: 'block',
                                overflow: 'hidden',
                                paddingRight: 15
                            }}>
                                <input type="text" className="form-control" placeholder="New Entry" value={this.state.title} style={{ width: '100%' }}
                                    onChange={e => this.setState({ title: e.currentTarget.value })} />
                            </span>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Date</label>
                                <input type="text" className="form-control" value={this.state.date}
                                    onChange={e => this.setState({ date: e.currentTarget.value })} />
                            </div>
                            <div className="form-group">
                                <label>Location</label>
                                <input type="text" className="form-control" value={this.state.location}
                                    onChange={e => this.setState({ location: e.currentTarget.value })} />
                            </div>
                            <div className="form-group">
                                <label>Entry</label>
                                <TinyMCE config={{
                                    height: '20em'
                                }} content={this.state.body}
                                onChange={(e, editor) => this.setState({ body: editor.getContent() })} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    componentDidMount(): void {
        $(this.refs.modal).modal();
    }

    componentWillUnmount(): void {
        $(this.refs.modal).modal('hide');
    }
}
