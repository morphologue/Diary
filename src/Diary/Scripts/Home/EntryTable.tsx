import * as $ from 'jquery';
import * as React from 'react';
import { Entry } from './Diary';

interface Props {
    height: number | null;
    entries: Entry[];
    onClick: (entry: Entry) => void;
}

export class EntryTable extends React.Component<Props> {
    render(): JSX.Element {
        return (
            <div style={{
                // On phones (height = null) the target div should overflow so that the whole document scrolls, but on desktop the div itself should scroll.
                height: this.props.height || 0,
                overflowY: this.props.height ? 'auto' : 'visible'
            }}>
                <div className="list-group">
                {
                        this.props.entries.map(e =>
                            <a key={e.key} className="list-group-item" href="javascript:;" onClick={() => this.props.onClick(e)}>
                                <h4 className="list-group-item-heading">{e.date}: {e.title}</h4>
                                <p className="list-group-item-text" style={{ wordWrap: 'break-word' }}>{this.sanitiseAndElipsise(e.body)}</p>
                        </a>
                    )
                }
                </div>
            </div>
        );
    }

    private sanitiseAndElipsise(body: string): string {
        const MAX_BODY_LENGTH = 200, ELIPSIS = '...';
        let sanitised = $('<div></div>').html(body).text();
        if (!sanitised.length && body.length)
            // Maybe the body is just an image, for example.
            return '[Markup]';
        return (sanitised.length <= MAX_BODY_LENGTH) ? sanitised
            : sanitised.substring(0, MAX_BODY_LENGTH - ELIPSIS.length) + ELIPSIS;
    }
}
