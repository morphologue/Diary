import * as React from 'react';

interface Props {
    searchText: string;
    disabled: boolean;
    onAddButtonClick: () => void;
    onChange: (new_search_text: string) => void;
}

export class SearchBar extends React.Component<Props> {
    render(): JSX.Element {
        return (
            <div>
                <button className="btn btn-default" onClick={() => this.props.onAddButtonClick()} disabled={this.props.disabled} style={{
                    borderRadius: '50%',  // circle
                    float: 'left'
                }}>+</button>
                <span style={{
                    display: 'block',
                    overflow: 'hidden',
                    paddingLeft: 7
                }}>
                    <div className="input-group" style={{ width: '100%' }}>
                        <input type="text" className="form-control" placeholder="Search" value={this.props.searchText} onChange={evt => this.props.onChange(evt.currentTarget.value)} style={
                            this.props.searchText ? {} : { borderRadius: 4 }
                        } />
                        {
                            this.props.searchText && <div className="input-group-addon" onClick={() => this.props.onChange('')} style={{
                                backgroundColor: 'white',
                                cursor: 'pointer'
                            }}>x</div>
                        }
                    </div>
                </span>
            </div>
        );
    }
}
