/// <reference types="jquery" />
/* tslint:disable comment-format */

function makeTableResizer(): () => void {
    // Search box should not shrink below this.
    const MIN_WIDTH = 10;
    
    // Leave this space at the right, which matches the right padding on the nav pills, so that the
    // search box lines up with the rightmost pill.
    const MARGIN_RIGHT = 15;

    // Cache JQuery objects.
    let $controls = $("#table_controls");
    let $form = $("form");
    let $target = $("#table_target");
    let $footer = $("footer");

    // The search box will be sized to the width of the div less this space, which equates to the width of the 
    // "+" button plus a bit.
    let static_width = $form.offset().left - $controls.offset().left + MARGIN_RIGHT;

    // #table_target will be resized to the top of the footer less this distance, which equates to the height
    // of the nav and search bar combined.
    let static_height = $target.offset().top;

    return (): void => {
        // Resize the search box
        let new_width = $controls.width() - static_width;
        $form.width(new_width > MIN_WIDTH ? new_width : MIN_WIDTH);

        // On phones the footer is hidden and div#target_table will overflow, so that the whole document scrolls. However on
        // desktops the div should itself scroll and take up the central part of the window, with the footer underneath.
        $target.height($footer.css("display") === "none" ? 0 : $footer.offset().top - static_height);
    };
}

$((): void => {
    // Install the resizer when the document has loaded. Importantly, the event handler must be bound after
    // makeFooterResizer() in Site.ts. The layout page currently guarantees this ordering.
    let resizer = makeTableResizer();
    $(window).resize(resizer);
    resizer();
});
