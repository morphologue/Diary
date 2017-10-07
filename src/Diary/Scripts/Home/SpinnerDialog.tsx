import * as React from 'react';

export function SpinnerDialog(): JSX.Element {
    return (
        <div className="modal-dialog" style={{ width: 232 }}>
            <div className="modal-content">
                <div className="modal-body">
                    <img src="/spinner.gif" />
                </div>
            </div>
        </div>
    );
}
