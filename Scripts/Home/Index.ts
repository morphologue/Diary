import * as $ from 'jquery';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Diary } from './Diary';
import '../Site';

$((): void => {
    // Defer to React.
    ReactDOM.render(React.createElement(Diary), $('#react-root')[0]);
});
