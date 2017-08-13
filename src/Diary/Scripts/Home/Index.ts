import $ = require('jquery');
import React = require('react');
import ReactDOM = require('react-dom');
import Diary = require('./Diary');
import '../Site';

$((): void => {
    //// Search box should not shrink below this.
    //const MIN_WIDTH = 10;

    //// Leave this space at the right, which matches the right padding on the nav pills, so that the
    //// search box lines up with the rightmost pill.
    //const MARGIN_RIGHT = 15;

    //// Cache JQuery objects.
    //let $controls = $("#table_controls");
    //let $input = $("#table_controls > input");
    //let $target = $("#table_target");
    //let $footer = $("footer");

    //// The search box will be sized to the width of the div less this space, which equates to the width of the 
    //// "+" button plus a bit.
    //let static_width = $input.offset().left - $controls.offset().left + MARGIN_RIGHT;

    //// #table_target will be resized to the top of the footer less this distance, which equates to the height
    //// of the nav and search bar combined.
    //let static_height = $target.offset().top;

    //// Install the resizer and run it immediately once. Importantly, the event handler must be bound after
    //// makeFooterResizer() in Site.ts, as this resizer relies on $footer.offset() being up-to-date.
    //let resizer = (): void => {
    //    // Resize the search box
    //    let new_width = $controls.width() - static_width;
    //    $input.outerWidth(new_width > MIN_WIDTH ? new_width : MIN_WIDTH);

    //    // On phones the footer is hidden and div#target_table will overflow, so that the whole document scrolls. However on
    //    // desktops the div should itself scroll and take up the central part of the window, with the footer underneath.
    //    $target.height($footer.css("display") === "none" ? 0 : $footer.offset().top - static_height);
    //};
    //$(window).resize(resizer);
    //resizer();
    
    // Defer to React for the guts of the interface.
    ReactDOM.render(React.createElement(Diary), $('#react-root')[0]);
});
