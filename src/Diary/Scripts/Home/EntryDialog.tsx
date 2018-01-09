import * as React from 'react';
import * as $ from 'jquery';
import { Entry, Diary } from './Diary';
import { DatePicker } from './DatePicker';
import moment = require('moment');
import * as ActualTinyMCE from 'tinymce';
import TinyMCE = require('react-mce');

interface Props {
    entry: Entry;
    editable: boolean;
    deletable: boolean;
    changed: boolean;
    mobile: boolean;
    onChange: (key: keyof Entry, new_value: string) => void;
    onCancel: (saveable: boolean) => void;
    onSave: () => void;
    onSecondary: () => void;  // Clicked "Edit" in view mode or "Delete" in edit mode
}

interface State {
    locked: boolean;
    bodyBoxHeight: number;
}

// This component presents a view of the given 'entry'. If 'editable' is true and anything is changed, onChange will fire.
export class EntryDialog extends React.PureComponent<Props, State> {
    private tmceEditor: ActualTinyMCE.Editor;

    constructor(props: Props) {
        super(props);
        this.state = { locked: false, bodyBoxHeight: 0 };
    }

    render(): JSX.Element {
        let body_holder_style: React.CSSProperties = {
            minHeight: this.state.bodyBoxHeight,
            wordWrap: 'break-word',
            overflow: 'auto',
            resize: 'vertical'
        };
        return (
            <div className="modal-dialog" style={{
                width: this.props.mobile ? undefined : '80%'
            }}>
                <div className="modal-content">
                    <div className="modal-header">
                        <div className={'form-group' + (this.props.entry.title ? '' : ' has-error')} style={{ marginBottom: 0 }}>
                            <button type="button" className="close" style={{ float: 'right' }} onClick={() => this.onCancel()}>&times;</button>
                            <span ref="title" style={{
                                display: 'block',
                                overflow: 'hidden',
                                paddingRight: 15
                            }}>
                                {
                                    this.props.editable ?
                                        <input type="text" className="form-control" placeholder="Title" value={this.props.entry.title} style={{ width: '100%' }}
                                            onChange={e => this.props.onChange('title', e.currentTarget.value)} disabled={this.state.locked} maxLength={100} />
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
                                    <DatePicker date={this.props.entry.date} className="form-control" onChange={new_date => this.props.onChange('date', new_date)} disabled={this.state.locked} />
                                    : <div className="form-control">{this.props.entry.date}</div>
                            }
                        </div>
                        <div className="form-group">
                            <label>Location</label>
                            {
                                this.props.editable ?
                                    <input type="text" className="form-control" value={this.props.entry.location} disabled={this.state.locked}
                                        onChange={e => this.props.onChange('location', e.currentTarget.value)} maxLength={100} />
                                    : <div className="form-control">{this.props.entry.location}</div>
                            }
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Entry</label>
                            {
                                this.props.editable ? (this.props.mobile ? <textarea value={this.props.entry.body} className="form-control" style={body_holder_style}
                                    onChange={e => this.props.onChange('body', $(e.currentTarget).val() as string)} />
                                    : <TinyMCE content={this.props.entry.body} config={{
                                        height: body_holder_style.minHeight + 'px',
                                        branding: false,
                                        content_css: `${Diary.getUrlPrefix()}/skins/bootstrap.min.css`,
                                        plugins: 'advlist autolink link image imagetools lists charmap print hr searchreplace wordcount media nonbreaking table contextmenu emoticons paste textcolor',
                                        toolbar: 'formatselect | fontselect | fontsizeselect | emoticons | bold italic underline | bullist numlist outdent indent | image table | forecolor backcolor',
                                        menubar: 'file edit insert format table',
                                        paste_data_images: true,
                                        images_upload_url: `${Diary.getUrlPrefix()}/Image/Upload`,
                                        theme_advance_resizing: true,
                                        theme_advanced_resizing_use_cookie: false
                                    } as any} onInit={(e, editor) => this.tmceEditor = editor} onChange={(e, editor) => this.props.onChange('body', editor.getContent())} />)
                                    : <div className="form-control" dangerouslySetInnerHTML={{ __html: this.props.entry.body }} style={body_holder_style} />
                            }
                        </div>
                    </div>
                    {
                        this.props.editable ?
                            <div className="modal-footer">
                                <button type="button" className="btn btn-default" onClick={() => this.onCancel()} disabled={this.state.locked}>Cancel</button>
                                <button type="button" className="btn btn-primary" disabled={this.state.locked || !this.isEntryValid() || !this.props.changed}
                                    onClick={() => this.onSave()}>OK</button>
                                {this.props.deletable && <button type="button" className="btn btn-danger" onClick={() => this.onSecondary()} disabled={this.state.locked}>Delete</button>}
                            </div>
                            : <div className="modal-footer">
                                <button type="button" className="btn btn-default" onClick={() => this.onCancel()} disabled={this.state.locked}>Close</button>
                                <button type="button" className="btn btn-primary" onClick={() => this.onSecondary()} disabled={this.state.locked}>Edit</button>
                            </div>
                    }
                </div>
            </div>
        );
    }

    componentDidMount(): void {
        setTimeout(() => {
            // Focus in the title input after we're first created.
            $(this.refs.title).find('input').focus();

            // Make our dialog fill up the middle of the window.
            let bottom = this.props.mobile ? ($(window).height() || 0) : ($('footer').offset() || { top: 0 }).top;
            let modal = $('.modal-dialog');
            this.setState({
                bodyBoxHeight: bottom - (modal.offset() || { top: 0 }).top - (modal.outerHeight(true) || 0) - 30
            });
        }, 500);
    }
  
    private onCancel(): void {
        this.uploadImages(() => this.props.onCancel(this.props.changed && this.isEntryValid()));
    }

    private onSave(): void {
        this.uploadImages(() => this.props.onSave());
    }

    private onSecondary(): void {
        this.uploadImages(() => this.props.onSecondary());
    }

    // Make sure any images are uploaded, and other changes not captured by onChange (e.g. paste) propagated, then do 'and_then'.
    private uploadImages(and_then: () => void): void {
        if (!this.props.editable || this.props.mobile) {
            and_then();
            return;
        }

        // Disable the interface and show a progress bar while we upload images.
        this.tmceEditor.setMode('readonly');
        this.setState({ locked: true });
        this.tmceEditor.setProgressState(true, 500);

        this.tmceEditor.uploadImages(() => {
            // Re-enable the interface and hide the progress bar.
            this.tmceEditor.setMode('design');
            this.setState({ locked: false });
            this.tmceEditor.setProgressState(false, 0);

            // The content may have changed due to e.g. a paste or an image upload.
            let content = this.tmceEditor.getContent();
            content === this.props.entry.body || this.props.onChange('body', content);

            // Now get around to whatever else we were trying to do.
            and_then();
        });
    }

    private isEntryValid(): boolean {
        return !!this.props.entry.title && this.isDateValid();
    }

    private isDateValid(): boolean {
        return moment(this.props.entry.date, "YYYY-MM-DD", true).isValid();
    }
}
