import * as React from 'react';

export class EntryTable extends React.Component<{ height: number | null }> {
    render(): JSX.Element {
        return <div style={{
            // On phones (height = null) the target div should overflow so that the whole document scrolls, but on desktop the div itself should scroll.
            height: this.props.height || 0,
            overflowY: this.props.height ? 'auto' : 'visible'
        }} />;
    }
}
