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

interface Props {
    entry?: Entry;
    editable: boolean;
    onClose: () => void;
    onApply?: () => void;
}

export class EntryDialog extends React.Component<Props, Entry> {
    constructor(props: Props) {
        super(props);

        // Set our state initially to the Entry in props, or a default if none was provided.
        if (props.entry)
            this.state = props.entry;
        else {
            // Format the current date in the local timezone as YYYY-MM-DD.
            let today = new Date();
            let yyyymmdd = [today.getFullYear(), today.getMonth() + 1, today.getDate()]
                .map(n => n < 10 ? '0' + n : n)
                .join('-');

            this.state = {
                title: '',
                date: yyyymmdd,
                location: '',
                body: ''
            };
        }
    }

    render(): JSX.Element {
        return (
            <div ref="modal" className="modal fade">
                <div className="modal-dialog" style={{
                    width: '80%',
                    minWidth: 400
                }}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button" className="close" style={{ float: 'right' }} onClick={() => this.props.onClose()}>&times;</button>
                            <span style={{
                                display: 'block',
                                overflow: 'hidden',
                                paddingRight: 15
                            }}>
                                {
                                    this.props.editable ?
                                        <input type="text" className="form-control" placeholder="New Entry" value={this.state.title}
                                            style={{ width: '100%' }} onChange={e => this.setState({ title: e.currentTarget.value })} />
                                        : <h4 className="modal-title">{this.state.title}</h4>
                                }
                            </span>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Date</label>
                                {
                                    this.props.editable ?
                                        <input type="text" className="form-control" value={this.state.date}
                                            onChange={e => this.setState({ date: e.currentTarget.value })} />
                                        : <div className="form-control">{this.state.date}</div>
                                }
                            </div>
                            <div className="form-group">
                                <label>Location</label>
                                {
                                    this.props.editable ?
                                        <input type="text" className="form-control" value={this.state.location}
                                            onChange={e => this.setState({ location: e.currentTarget.value })} />
                                        : <div className="form-control">{this.state.location}</div>
                                }
                            </div>
                            <div className="form-group">
                                <label>Entry</label>
                                {
                                    this.props.editable ?
                                        <TinyMCE content={this.state.body} config={{
                                            height: '20em'
                                        }} onKeyup={(e, editor) => this.setState({ body: editor.getContent() })} />
                                        : <div className="form-control" dangerouslySetInnerHTML={{ __html: this.state.body }} style={{
                                            height: '20em'
                                        }} />
                                }
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
