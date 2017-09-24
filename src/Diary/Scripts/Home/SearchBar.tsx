import * as React from 'react';

interface Props {
    onAddButtonClick: () => void
}

export class SearchBar extends React.Component<Props> {
    render(): JSX.Element {
        return (
            <div>
                <button className="btn btn-default" onClick={() => this.props.onAddButtonClick()} style={{
                    borderRadius: '50%',  // circle
                    float: 'left'
                }}>+</button>
                <span style={{
                    display: 'block',
                    overflow: 'hidden',
                    paddingLeft: 7
                }}>
                    <input type="search" className="form-control" placeholder="Search" style={{
                        borderRadius: 10,
                        width: '100%'
                    }} />
                </span>
            </div>
        );
    }
}
