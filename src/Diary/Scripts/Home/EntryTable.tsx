import * as $ from 'jquery';
import * as React from 'react';
import { Entry, Diary } from './Diary';

interface Props {
    height: number | null;
    entries: Entry[];
    onClick: (entry: Entry) => void;
    onScrollHungry: () => void;
    spinning: boolean;
}

export class EntryTable extends React.Component<Props> {
    render(): JSX.Element {
        return (
            <div ref="listGroup" className="list-group" style={{
                // On phones (height = null) the target div should overflow so that the whole document scrolls, but on desktop the div itself should scroll.
                height: this.props.height === null ? 'auto' : this.props.height,
                overflowY: this.props.height === null ? 'visible' : 'auto'
            }}>
            {
                this.props.entries.map(e => <a key={e.key} className="list-group-item" href="javascript:;" onClick={() => this.props.onClick(e)}>
                    <h4 className="list-group-item-heading">{e.date}: {e.title}</h4>
                    <p className="list-group-item-text" style={{ wordWrap: 'break-word' }}>{this.sanitiseAndElipsise(e.body)}</p>
                </a>)
            }
            {this.props.spinning && <img src={`${Diary.getUrlPrefix()}/spinner.gif`} style={{ display: 'block', margin: '0 auto', height: 80 }} />}
            </div>
        );
    }

    componentDidMount(): void {
        this.installScrollWatcher();
    }

    componentDidUpdate(prev_props: Props) {
        // If we changed between mobile (height = null) and desktop view, reinstall the scroll watcher.
        ((this.props.height === null) === (prev_props.height === null)) || this.installScrollWatcher();
    }

    private installScrollWatcher(): void {
        let handle_scroll_invoker: () => void;
        if (this.props.height === null) {
            $(this.refs.listGroup).off('scroll');
            $(document).scroll(handle_scroll_invoker = () => this.handleScroll(document.body, $(window)));
        } else {
            $(document).off('scroll');
            $(this.refs.listGroup).scroll(handle_scroll_invoker = () => this.handleScroll(this.refs.listGroup as HTMLElement, $(this.refs.listGroup)));
        }
        handle_scroll_invoker();
    }

    private handleScroll(scroll_element: HTMLElement, height_jq: JQuery): void {
        const MIN_SCROLLBUM = 100;  // Fetch more entries when this many pixels or fewer remain to be scrolled.
        let scrollbum = scroll_element.scrollHeight - (height_jq.scrollTop() || 0) - (height_jq.height() || 0);
        if (scrollbum < MIN_SCROLLBUM)
            this.props.onScrollHungry();
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
