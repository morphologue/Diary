/// <reference types="jquery" />
/* tslint:disable comment-format */

function makeFooterResizer(): () => void {
    // Pixels to reserve under the footer, i.e. at the bottom of the window
    const MARGIN_BOTTOM = 20;

    // Footer should be positioned no higher on the page than this.
    const MIN_TOP = 200;

    // Cache JQuery objects.
    let $window = $(window);
    let $footer = $("footer");

    // Distance from the bottom of the window to position the footer
    let static_height = $footer.height() + MARGIN_BOTTOM;

    return (): void => {
        let new_top = $window.height() - static_height;
        $footer.css("top", (new_top > MIN_TOP ? new_top : MIN_TOP) + "px");
    };
}

$((): void => {
    // Install the resizer when the document has loaded.
    let resizer = makeFooterResizer();
    $(window).resize(resizer);
    resizer();
});
