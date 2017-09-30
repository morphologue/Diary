import * as $ from 'jquery';
import 'jquery-validation';
import 'jquery-validation/dist/additional-methods';  // for "pattern"
import 'jquery-ui/ui/widgets/datepicker';
import 'jquery-ui/themes/base/all.css';
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
    entry: Entry;
    editable: boolean;
    deletable: boolean;
    onChange: (key: keyof Entry, new_value: string) => void;
    onClose: () => void;
    onSecondary: () => void;  // Clicked "Edit" in view mode or "Delete" in edit mode
}

// This component presents a view of the given 'entry'. If 'editable' is true and anything is changed, onChange will fire.
export class EntryDialog extends React.PureComponent<Props> {
    private validator: JQueryValidation.Validator;

    render(): JSX.Element {
        return (
            <div className="modal-dialog" style={{
                width: '80%',
                minWidth: 400
            }}>
                <div className="modal-content">
                    <form ref="form">
                        <div className="modal-header">
                            <div className="form-group">
                                <button type="button" className="close" style={{ float: 'right' }} onClick={() => this.onClose()}>&times;</button>
                                <span style={{
                                    display: 'block',
                                    overflow: 'hidden',
                                    paddingRight: 15
                                }}>
                                    {
                                        this.props.editable ?
                                            <input type="text" name="title" className="form-control" placeholder="Title" value={this.props.entry.title}
                                                style={{ width: '100%' }} onChange={e => this.props.onChange('title', e.currentTarget.value)} required />
                                            : <h4 className="modal-title">{this.props.entry.title}</h4>
                                    }
                                </span>
                            </div>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Date&nbsp;</label>
                                {this.props.editable && <label className="error text-danger" htmlFor="date"></label>}
                                {
                                    this.props.editable ?
                                        <input type="text" name="date" className="form-control" value={this.props.entry.date}
                                            onChange={e => this.props.onChange('date', e.currentTarget.value)} pattern="^[0-9]{4}-[0-9]{2}-[0-9]{2}$" required />
                                        : <div className="form-control">{this.props.entry.date}</div>
                                }
                            </div>
                            <div className="form-group">
                                <label>Location</label>
                                {
                                    this.props.editable ?
                                        <input type="text" name="location" className="form-control" value={this.props.entry.location}
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
                        <div className="modal-footer">
                            <button type="button" className="btn btn-default" onClick={() => this.onClose()}>Close</button>
                            {
                                this.props.editable ?
                                    (this.props.deletable && <button type= "button" className="btn btn-danger" onClick={() => this.props.onSecondary()}>Delete</button>)
                                    : <button type="button" className="btn btn-primary" onClick={() => this.props.onSecondary()}>Edit</button>
                            }
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    componentDidMount(): void {
        this.props.editable && this.setUpDOMForEditing();
    }

    componentWillUnmount(): void {
        this.props.editable && this.tearDownDOMFromEditing();
    }

    componentDidUpdate(prev_props: Props) {
        // Can go from viewing to editing, but not the other way around.
        this.props.editable && !prev_props.editable && this.setUpDOMForEditing();
    }

    private onClose(): void {
        $(this.refs.form).submit();
    }

    // DOM manipulation which we need to do when the component becomes editable at mount- or update-time.
    private setUpDOMForEditing(): void {
        let $form = $(this.refs.form);

        this.validator = $form.validate({
            messages: {
                date: {
                    required: '',
                    pattern: '- YYYY-MM-DD'
                }
            },
            errorPlacement: () => { },  // Only use the error label we've created explicitly.
            highlight: elem => $(elem).closest('.form-group').addClass('has-error'),
            unhighlight: elem => $(elem).closest('.form-group').removeClass('has-error'),
            submitHandler: () => this.props.onClose()
        });

        $form.find('.mce-edit-area').css('border-right-width', 1);  // Work around react-mce layout bug.

        $form.find('input[name=date]').datepicker({
            dateFormat: 'yy-mm-dd',
            onSelect: date_text => this.props.onChange('date', date_text)
        });
    }

    // DOM manipulation which we need to do when the component is unmounted after editing.
    private tearDownDOMFromEditing(): void {
        (this.validator as any).destroy();  // The typing is missing destroy().
        $(this.refs.form).find('input[name=date]').datepicker('destroy');
    }
}
