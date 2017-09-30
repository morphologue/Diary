import * as React from 'react';

interface Props {
    message: string,
    buttons: {
        label: string,
        onClick: () => void,
        btnClassSuffix: "default" | "primary" | "danger"
    }[]
}

export class AlertDialog extends React.PureComponent<Props> {
    render(): JSX.Element {
        return (
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-body"><strong>{this.props.message}</strong></div>
                    <div className="modal-footer">
                        {this.props.buttons.map((b, idx) =>
                            <button key={idx} type="button" onClick={b.onClick} className={`btn btn-${b.btnClassSuffix}`}>{b.label}</button>)}
                    </div>
                </div>
            </div>
        );
    }
}
