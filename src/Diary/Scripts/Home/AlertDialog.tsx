import * as React from 'react';

interface Props {
    message: string,
    buttons: {
        key: number,
        label: string,
        onClick: () => void,
        btnClassSuffix: "default" | "primary" | "danger"
    }[]
}

export class AlertDialog extends React.PureComponent<Props> {
    render(): JSX.Element {
        return (
            <div className="modal-dialog" style={{ width: 400 }}>
                <div className="modal-content">
                    <div className="modal-body"><strong>{this.props.message}</strong></div>
                    <div className="modal-footer" style={{ borderTop: 'none' }}>
                        {this.props.buttons.map(b =>
                            <button key={b.key} type="button" onClick={b.onClick} className={`btn btn-${b.btnClassSuffix}`}>{b.label}</button>)}
                    </div>
                </div>
            </div>
        );
    }
}
