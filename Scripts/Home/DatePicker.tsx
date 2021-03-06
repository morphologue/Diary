﻿import * as $ from 'jquery';
import 'jquery-ui/ui/widgets/datepicker';
import 'jquery-ui/themes/base/all.css';
import './jquery-ui-icon-paths.css';
import * as React from 'react';

interface Props {
    date: string;
    className: string;
    disabled: boolean;
    onChange: (new_date: string) => void;
}

// An input element with a date picker which provides YYYY-MM-DD format. Whenever the input value is changed (by selecting a date in the datepicker or by typing),
// onChange is fired. However the validity of the entered date is not guaranteed.
export class DatePicker extends React.PureComponent<Props> {
    render(): JSX.Element {
        return <input ref="input" type="text" className={this.props.className} value={this.props.date} onChange={e => this.props.onChange(e.currentTarget.value)} disabled={this.props.disabled} />;
    }

    componentDidMount(): void {
        $(this.refs.input).datepicker({
            dateFormat: 'yy-mm-dd',
            onSelect: new_date => this.props.onChange(new_date)
        });
    }

    componentWillUnmount(): void {
        $(this.refs.input).datepicker('destroy');
    }
}
